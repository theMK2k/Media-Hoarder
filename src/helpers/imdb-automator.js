import { BrowserWindow, session } from "@electron/remote";

import logger from "@helpers/logger.js";

const AUTOMATOR_SESSION = "imdb-automator";
const WAF_MARKER = "window.gokuProps";
const WAF_TIMEOUT_MS = 30000;
const GRAPHQL_CAPTURE_TIMEOUT_MS = 15000;

let automatorSession = null;

function getOrCreateSession() {
  if (automatorSession) return automatorSession;

  automatorSession = session.fromPartition(AUTOMATOR_SESSION, { cache: false });
  automatorSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders["Accept-Language"] = "en-GB,en;q=0.9";
    callback({ requestHeaders: details.requestHeaders });
  });

  return automatorSession;
}

async function waitForRealPage(bw) {
  return new Promise((resolve, reject) => {
    let resolved = false;

    const timeout = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      cleanup();
      reject(new Error("Timed out waiting for IMDB page (WAF challenge?)"));
    }, WAF_TIMEOUT_MS);

    const checkPage = async () => {
      if (resolved) return;
      try {
        const content = await bw.webContents.executeJavaScript("document.documentElement.outerHTML");
        if (resolved) return;
        if (!content.includes(WAF_MARKER)) {
          logger.log("[imdbAutomator] real page detected");
          resolved = true;
          cleanup();
          resolve();
        } else {
          logger.log("[imdbAutomator] WAF challenge active, waiting...");
        }
      } catch (e) {
        logger.log("[imdbAutomator] checkPage error (likely navigating):", e.message);
      }
    };

    const onNavigate = () => {
      if (resolved) return;
      logger.log("[imdbAutomator] navigation detected, rechecking...");
      setTimeout(checkPage, 1000);
    };

    const cleanup = () => {
      clearTimeout(timeout);
      clearInterval(pollInterval);
      bw.webContents.removeListener("did-navigate", onNavigate);
    };

    bw.webContents.on("did-navigate", onNavigate);
    const pollInterval = setInterval(checkPage, 2000);
    checkPage();
  });
}

function watchForGraphqlRequest(ses, operationName, timeoutMs = GRAPHQL_CAPTURE_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    let resolved = false;

    const timeout = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      ses.webRequest.onBeforeRequest(null);
      reject(new Error(`Timed out waiting for GraphQL operation: ${operationName}`));
    }, timeoutMs);

    ses.webRequest.onBeforeRequest(
      { urls: ["*://caching.graphql.imdb.com/*"] },
      (details, callback) => {
        callback({});
        if (resolved) return;
        if (details.url.includes(`operationName=${operationName}`)) {
          resolved = true;
          clearTimeout(timeout);
          ses.webRequest.onBeforeRequest(null);
          logger.log(`[imdbAutomator] captured ${operationName} URL:`, details.url);
          resolve(details.url);
        }
      }
    );
  });
}

async function clickMorePopularMatches(bw) {
  const clicked = await bw.webContents.executeJavaScript(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button'))
        .find(b => b.textContent.includes('More popular matches'));
      if (!btn) return false;
      btn.scrollIntoView({ block: 'center' });
      btn.click();
      return true;
    })()
  `);

  if (!clicked) throw new Error('"More popular matches" button not found on page');
  logger.log('[imdbAutomator] clicked "More popular matches"');
}

async function getFindPageSearchGraphqlURL() {
  logger.log("[imdbAutomator] getFindPageSearchGraphqlURL");

  const ses = getOrCreateSession();
  const bw = new BrowserWindow({
    show: false,
    webPreferences: {
      session: ses,
    },
  });

  try {
    await bw.loadURL(`https://www.imdb.com/find/?q=xxx`);
    await waitForRealPage(bw);

    const urlPromise = watchForGraphqlRequest(ses, "FindPageSearch");
    await clickMorePopularMatches(bw);

    const graphqlURL = decodeURIComponent(await urlPromise);
    logger.log("[imdbAutomator] FindPageSearch URL:", graphqlURL);
    return graphqlURL;
  } finally {
    if (!bw.isDestroyed()) bw.destroy();
  }
}

export { getFindPageSearchGraphqlURL };
