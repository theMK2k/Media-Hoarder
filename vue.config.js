const { defineConfig } = require("@vue/cli-service");
const { VuetifyPlugin } = require("webpack-plugin-vuetify");

module.exports = defineConfig({
  configureWebpack: {
    plugins: [
      // Vuetify 3 webpack plugin (tree-shaking and auto-import)
      new VuetifyPlugin(),
    ],
  },

  css: {
    sourceMap: true,
  },

  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        productName: "Media Hoarder",
        extraResources: ["data/media-hoarder.db_initial", "data/easylist.txt"],
        publish: ["github"],
        win: {
          extraResources: ["bin/win"],
        },
        linux: {
          category: "AudioVideo",
          extraResources: ["bin/linux"],
        },
        // afterSign: "@oshell/vue-cli-plugin-electron-builder-notarize",
        mac: {
          hardenedRuntime: true,
          entitlements: "./entitlements.plist",
          extraResources: ["bin/mac"],
        },
      },
      // Electron-specific settings
      contextIsolation: false,
      nodeIntegration: true,
      enableRemoteModule: true,
      // NOTE: There is a known issue with vue-cli-plugin-electron-builder v3.0.0-alpha.4
      // and Electron 39 where require("electron") in the webpack bundle resolves to
      // the npm package (which returns the path to electron.exe) instead of Electron's
      // built-in module. This causes "Cannot read properties of undefined" errors.
      // See: https://github.com/nklayman/vue-cli-plugin-electron-builder/issues
      //
      // Workarounds attempted but failed:
      // - bundleMainProcess: false (ESM resolution issues with plugin)
      // - externals whitelist with alias (alias not applied before externals check)
      // - Monkeypatching node_modules/electron/index.js (can't access Electron's internal module)
      // - Various webpack configuration changes
      //
      // Recommended solutions:
      // 1. Wait for stable vue-cli-plugin-electron-builder v3
      // 2. Switch to electron-vite or electron-forge
      // 3. Downgrade to vue-cli-plugin-electron-builder v2.x (requires Vue CLI 4, webpack 4)
    },
    i18n: {
      locale: "en",
      fallbackLocale: "en",
      localeDir: "i18n",
      enableInSFC: false,
    },
  },

  transpileDependencies: ["vuetify", "chart.js", "fs-extra"],
});
