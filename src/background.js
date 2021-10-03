"use strict";

/* global __static */
import { app, protocol, BrowserWindow, session } from "electron";
import {
  createProtocol,
  // installVueDevtools,
} from "vue-cli-plugin-electron-builder/lib";
// import { autoUpdater } from "electron-updater"
import path from "path";

const fs = require("fs");

import * as _ from "lodash";
const windowStateKeeper = require("electron-window-state");

import * as helpers from "./helpers/helpers";

import { ElectronBlocker } from "@cliqz/adblocker-electron";

const isDevelopment = process.env.NODE_ENV !== "production";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

function createWindow() {
  // Load the previous state with fallback to defaults
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 800,
  });

  // Create the browser window.
  win = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      // webSecurity: false,
      webviewTag: true,
      fullscreenable: false,
    },
    icon: path.join(__static, "icon.png"),
  });

  // Let us register listeners on the window, so we can update the state
  // automatically (the listeners will be removed when the window is closed)
  // and restore the maximized or full screen state
  mainWindowState.manage(win);

  // adBocker stuff
  try {
    const easyListPath = helpers.getStaticPath("data/easylist.txt");
    console.log("instantiating adBlock with:", easyListPath);
    const adBlocker = ElectronBlocker.parse(
      fs.readFileSync(easyListPath, "utf-8")
    );
    adBlocker.enableBlockingInSession(session.defaultSession);
    adBlocker.on("request-blocked", (request) => {
      console.log("blocked", request.tabId, request.url);
    });
    adBlocker.on("request-redirected", (request) => {
      console.log("redirected", request.tabId, request.url);
    });
    adBlocker.on("request-whitelisted", (request) => {
      console.log("whitelisted", request.tabId, request.url);
    });
    adBlocker.on("csp-injected", (request) => {
      console.log("csp", request.url);
    });
    adBlocker.on("script-injected", (script, url) => {
      console.log("script", script.length, url);
    });
    adBlocker.on("style-injected", (style, url) => {
      console.log("style", style.length, url);
    });
  } catch (e) {
    console.error(e);
  }

  win.setMenu(null);

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    setTimeout(() => {
      win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    }, 0);

    if (!process.env.IS_TEST) {
      win.webContents.openDevTools();
    }
  } else {
    createProtocol("app");
    // Load the index.html when not in development
    setTimeout(() => {
      win.loadURL("app://./index.html");
      // autoUpdater.checkForUpdatesAndNotify();
    }, 0);
  }

  win.on("resize", _.debounce(mainWindowState.saveState, 500));
  win.on("move", _.debounce(mainWindowState.saveState, 500));

  win.on("close", mainWindowState.saveState);

  win.on("closed", () => {
    win = null;
  });
}

// allows us to use local files outside "public" folder as web ressource
// https://nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#loading-local-images-resources
function registerLocalResourceProtocol() {
  protocol.registerFileProtocol("local-resource", (request, callback) => {
    const url = request.url.replace(/^local-resource:\/\//, "");
    // Decode URL to prevent errors when loading filenames with UTF-8 chars or chars like "#"
    const decodedUrl = decodeURI(url); // Needed in case URL contains spaces
    try {
      return callback(decodedUrl);
    } catch (error) {
      console.error(
        "ERROR: registerLocalResourceProtocol: Could not get file path:",
        error
      );
    }
  });
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  registerLocalResourceProtocol();

  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    // Devtools extensions are broken in Electron 6.0.0 and greater
    // See https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/378 for more info
    // Electron will not launch with Devtools extensions installed on Windows 10 with dark mode
    // If you are not using Windows 10 dark mode, you may uncomment these lines
    // In addition, if the linked issue is closed, you can upgrade electron and uncomment these lines
    // try {
    //   await installVueDevtools();
    // } catch (e) {
    //   console.error("Vue Devtools failed to install:", e.toString());
    // }
  }
  createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}
