import { BrowserWindow, session } from "@electron/remote";

import logger from "@helpers/logger.js";
import * as helpers from "@helpers/helpers.js";

// Module-level state for session reuse
let sharedSession = null;
let fetchCount = 0;
const DEEP_CLEANUP_INTERVAL = 50;
const INTER_REQUEST_DELAY_MS = 300;

function getOrCreateSession() {
  if (sharedSession) return sharedSession;

  sharedSession = session.fromPartition("imdb-scraper", { cache: false });
  sharedSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders["Accept-Language"] = "en-GB,en;q=0.9";
    callback({ requestHeaders: details.requestHeaders });
  });

  return sharedSession;
}

async function cleanupSession() {
  if (!sharedSession) return;
  logger.log("[electronBrowserFetch] cleaning up session after", fetchCount, "fetches");
  try {
    await sharedSession.closeAllConnections();
    await sharedSession.clearCache();
    await sharedSession.clearStorageData();
  } catch (e) {
    logger.log("[electronBrowserFetch] session cleanup error (non-fatal):", e);
  }
}

async function resetSession() {
  await cleanupSession();
  sharedSession = null;
  fetchCount = 0;
}

async function electronBrowserFetch(url, retryCount = 0) {
  logger.log("[electronBrowserFetch] START, url:", url);

  const ses = getOrCreateSession();
  const bw = new BrowserWindow({
    show: false,
    webPreferences: {
      offscreen: true,
      session: ses,
    },
  });

  try {
    await bw.loadURL(url);

    // Wait for AWS WAF challenge to resolve — it auto-navigates to the real page
    const html = await new Promise((resolve, reject) => {
      let resolved = false;

      const timeout = setTimeout(() => {
        if (resolved) return;
        resolved = true;
        cleanup();
        reject(new Error("Timed out waiting for IMDB page to load (WAF challenge?)"));
      }, 30000);

      // check the page content - if no WAF challenge marker is found, we have the real page
      const checkPage = async () => {
        if (resolved) return;
        try {
          const content = await bw.webContents.executeJavaScript("document.documentElement.outerHTML");

          if (resolved) return;

          // If the page doesn't contain the WAF challenge's unique marker, we're good to go
          if (!content.includes("window.gokuProps")) {
            logger.log("[electronBrowserFetch] got real page content, returning");
            resolved = true;
            cleanup();
            resolve(content);
            return;
          }

          logger.log("[electronBrowserFetch] WAF challenge detected, waiting for navigation...");
        } catch (e) {
          // page may be navigating, ignore
          logger.log("[electronBrowserFetch] error during checkPage (probably navigating), this is fine:", e);
        }
      };

      const onNavigate = () => {
        if (resolved) return;
        // Give the new page a moment to render, then check
        logger.log("[electronBrowserFetch] onNavigate triggered, checking page after delay");
        setTimeout(checkPage, 1000);
      };

      const cleanup = () => {
        clearTimeout(timeout);
        clearInterval(pollInterval);
        bw.webContents.removeListener("did-navigate", onNavigate);
      };

      bw.webContents.on("did-navigate", onNavigate);

      // Also poll periodically in case did-navigate doesn't fire (e.g. SPA-style redirect)
      const pollInterval = setInterval(checkPage, 2000);

      // Check immediately in case no WAF challenge was presented
      checkPage();
    });

    fetchCount++;
    if (fetchCount % DEEP_CLEANUP_INTERVAL === 0) {
      await cleanupSession();
    }

    if (helpers.getRequestAsyncDumpToFile()) {
      const filename = `${filenamifyExt(url)}.html`;
      logger.log("[electronBrowserFetch] dumping to", filename);
      await writeFileAsync(`./${filename}`, html);
    }

    await helpers.sleep(INTER_REQUEST_DELAY_MS);

    return html;
  } catch (error) {
    if (retryCount === 0 && /ENOBUFS|ERR_CONNECTION_FAILED|ERR_CONNECTION_REFUSED/.test(error.message)) {
      logger.warn("[electronBrowserFetch] connection error, resetting session and retrying:", error.message);
      await resetSession();
      await helpers.sleep(2000);
      return electronBrowserFetch(url, retryCount + 1);
    }
    throw error;
  } finally {
    if (!bw.isDestroyed()) {
      bw.destroy();
    }
  }
}

export { electronBrowserFetch, resetSession };
