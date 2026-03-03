/* eslint-disable no-console */
// Electron main-process entry point for the IMDB scraper watchdog.
// Boots the Electron app (headless) then runs the regular watchdog script.

// Enable babel transpilation (same as babel-node --presets es2015)
require("babel-register")({ presets: ["es2015"] });

const { app } = require("electron");

app.on("ready", () => {
  require("./media-hoarder-imdb-scraper-watchdog");
});

app.on("window-all-closed", () => {
  // don't quit when BrowserWindows used by electronBrowserFetch are closed
});
