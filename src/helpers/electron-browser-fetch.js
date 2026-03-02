import { BrowserWindow, session } from "@electron/remote";

import logger from "@helpers/logger.js";
import * as helpers from "@helpers/helpers.js";

async function electronBrowserFetch(url) {
  logger.log("[electronBrowserFetch] START, url:", url);

  // Use a temporary session so we can set Accept-Language without affecting other windows.
  const ses = session.fromPartition(`temp:ebf-${Date.now()}`, { cache: false });
  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders["Accept-Language"] = "en-GB,en;q=0.9";
    callback({ requestHeaders: details.requestHeaders });
  });

  const bw = new BrowserWindow({
    show: false,
    webPreferences: {
      offscreen: true,
      session: ses,
    },
  });

  await bw.loadURL(url);

  // Wait for AWS WAF challenge to resolve — it auto-navigates to the real page
  const html = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      bw.close();
      reject(new Error("Timed out waiting for IMDB page to load (WAF challenge?)"));
    }, 30000);

    // check the page content - if no WAF challenge marker is found, we have the real page
    const checkPage = async () => {
      try {
        const content = await bw.webContents.executeJavaScript("document.documentElement.outerHTML");

        // If the page doesn't contain the WAF challenge's unique marker, we're good to go
        if (!content.includes("window.gokuProps")) {
          logger.log("[electronBrowserFetch] got real page content, returning");
          cleanup();
          resolve(content);
        }

        logger.log("[electronBrowserFetch] WAF challenge detected, waiting for navigation...");
      } catch (e) {
        // page may be navigating, ignore
        logger.log("[electronBrowserFetch] error during checkPage (probably navigating), this is fine:", e);
      }
    };

    const onNavigate = () => {
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

  bw.close();

  if (helpers.getRequestAsyncDumpToFile()) {
    const filename = `${filenamifyExt(url)}.html`;
    logger.log("[electronBrowserFetch] dumping to", filename);
    await writeFileAsync(`./${filename}`, html);
  }

  return html;
}

export { electronBrowserFetch };
