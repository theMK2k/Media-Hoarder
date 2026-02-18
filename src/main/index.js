// Main process entry point for Electron (electron-vite)
// Note: @electron/remote initialization moved to app.on('ready') - see below

import { app, protocol, BrowserWindow, session, shell, net } from "electron";
import { pathToFileURL, URL } from "url";
import path from "path";
import fs from "fs";
import _ from "lodash";
import windowStateKeeper from "@/helpers/electron-window-state";
import { ElectronBlocker } from "@ghostery/adblocker-electron";
import remoteMain from "@electron/remote/main";

import * as helpers from "@/helpers/helpers";
import { asciiLogo } from "@/helpers/ascii-logo";

console.log(asciiLogo);

const isDevelopment = process.env.NODE_ENV !== "production";

// Use a separate userData directory in development to avoid conflicts with installed version
if (isDevelopment) {
  const devUserData = path.join(app.getPath("appData"), "media-hoarder-dev");
  app.setPath("userData", devUserData);
  console.log("Development mode: using userData path:", devUserData);
}

// MIME types for createProtocol (used in production)
const mimeTypes = {
  ".html": "text/html",
  ".htm": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/vnd.microsoft.icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".xml": "application/xml",
};

function getMimeType(filename) {
  const ext = path.extname(filename || "").toLowerCase();
  return mimeTypes[ext] || "application/octet-stream";
}

function getCharset(mimeType) {
  return ["text/html", "text/javascript", "text/css", "application/json"].includes(mimeType) ? "utf-8" : null;
}

// Local implementation of createProtocol for production builds
function createProtocol(scheme, baseDir) {
  const protocolDir = baseDir || path.join(__dirname, "../renderer");

  protocol.registerBufferProtocol(scheme, (req, callback) => {
    const reqUrl = new URL(req.url);

    // Security: path must start with /
    if (!reqUrl.pathname.startsWith("/")) {
      return callback({ mimeType: null, charset: null, data: null });
    }

    let reqPath = path.normalize(reqUrl.pathname);
    if (reqPath === "/" || reqPath === "\\") {
      reqPath = "/index.html";
    }

    const reqFilename = path.basename(reqPath);
    const fullPath = path.join(protocolDir, reqPath);

    fs.readFile(fullPath, (err, data) => {
      const mimeType = getMimeType(reqFilename);
      if (!err) {
        callback({
          mimeType: mimeType,
          charset: getCharset(mimeType),
          data: data,
        });
      } else {
        console.error("createProtocol error:", err.message, "path:", fullPath);
        callback({ mimeType: null, charset: null, data: null });
      }
    });
  });
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
  { scheme: "local-resource", privileges: { secure: true, standard: true, supportFetchAPI: true } },
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
      webviewTag: true,
      fullscreenable: false,
      preload: path.join(__dirname, "../preload/index.js"), // electron-vite handles this path
    },
    icon: isDevelopment
      ? path.join(process.cwd(), "public", "icon.png")
      : path.join(__dirname, "..", "renderer", "icon.png"),
  });

  // Let us register listeners on the window, so we can update the state
  // automatically (the listeners will be removed when the window is closed)
  // and restore the maximized or full screen state
  mainWindowState.manage(win);

  // Enable @electron/remote for this WebContents (required in Electron 14+)
  remoteMain.enable(win.webContents);

  // adBocker stuff
  try {
    const easyListPath = helpers.getStaticPath("data/easylist.txt");
    console.log("instantiating adBlock with:", easyListPath);
    const adBlocker = ElectronBlocker.parse(fs.readFileSync(easyListPath, "utf-8"));
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

  // electron-vite: use ELECTRON_RENDERER_URL for development
  if (process.env.ELECTRON_RENDERER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.ELECTRON_RENDERER_URL);

    if (!process.env.IS_TEST) {
      win.webContents.openDevTools();
    }
  } else {
    createProtocol("app");
    // Load the index.html when not in development
    win.loadURL("app://./index.html");
  }

  win.on("resize", _.debounce(mainWindowState.saveState, 500));
  win.on("move", _.debounce(mainWindowState.saveState, 500));

  win.on("close", mainWindowState.saveState);

  win.on("closed", () => {
    win = null;
  });

  // target="_blank" external links should be opened with the browser and not the app itself
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http:") || url.startsWith("https:")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });
}

// allows us to use local files outside "public" folder as web ressource
function registerLocalResourceProtocol() {
  protocol.handle("local-resource", async (request) => {
    let filePath = request.url.replace(/^local-resource:\/\//, "");

    // Decode URL to prevent errors when loading filenames with UTF-8 chars or chars like "#"
    filePath = decodeURI(filePath);

    // Fix double slashes that result from escaped backslashes in URLs
    filePath = filePath.replace(/\/\//g, "/");

    // Add colon after drive letter if missing (Windows paths)
    filePath = filePath.replace(/^([a-zA-Z])\//, "$1:/");

    // Convert forward slashes to backslashes for Windows
    filePath = filePath.replace(/\//g, "\\");

    try {
      const fileUrl = pathToFileURL(filePath).href;
      return await net.fetch(fileUrl);
    } catch (error) {
      console.error(
        "ERROR: registerLocalResourceProtocol: Could not get file path:",
        error,
        "Original URL:",
        request.url,
        "Processed path:",
        filePath
      );
      return new Response(null, { status: 404 });
    }
  });
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on("ready", async () => {
  // Initialize @electron/remote (must be done after app is ready in Electron 39+)
  remoteMain.initialize();

  registerLocalResourceProtocol();

  if (isDevelopment && !process.env.IS_TEST) {
    // Vue Devtools can be installed here if needed
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
