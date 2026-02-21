// Shim for @electron/remote in the renderer process.
// vite-plugin-electron-renderer's CJS transform doesn't work for this package,
// so we use a Vite alias to point imports here instead.
const remote = require("@electron/remote");

export default remote;
export const {
  app,
  BrowserWindow,
  clipboard,
  dialog,
  getCurrentWebContents,
  getCurrentWindow,
  getGlobal,
  nativeImage,
  nativeTheme,
  net,
  powerMonitor,
  screen,
  session,
  shell,
  systemPreferences,
  webContents,
  webFrame,
} = remote;
