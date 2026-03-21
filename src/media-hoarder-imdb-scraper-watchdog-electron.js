/* eslint-disable no-console */
// Electron main-process entry point for the IMDB scraper watchdog.
// Boots the Electron app (headless) then runs the regular watchdog script.

const path = require("path");

require("@babel/register")({
  presets: ["@babel/preset-env"],
  plugins: [
    [
      "module-resolver",
      {
        alias: {
          "@helpers": path.resolve(__dirname, "helpers"),
          "@electron/remote": "electron",
        },
      },
    ],
    "add-module-exports",
  ],
  configFile: false,
  babelrc: false,
});

const { app } = require("electron");

app.on("ready", async () => {
  await require("./media-hoarder-imdb-scraper-watchdog");
  app.quit();
});

app.on("window-all-closed", () => {
  // don't quit when BrowserWindows used by electronBrowserFetch are closed
});
