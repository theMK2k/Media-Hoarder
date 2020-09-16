module.exports = {
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        extraResources: [
          'data/media-hoarder.db_initial',
          'data/easylist.txt'
        ],
        publish: [
          'github'
        ],
        linux: {
          category: 'AudioVideo'
        },
        afterSign: "@oshell/vue-cli-plugin-electron-builder-notarize",
        mac: {
          hardenedRuntime: true,
          entitlements: "./entitlements.plist",
        }
      },
    },
    i18n: {
      locale: 'en',
      fallbackLocale: 'en',
      localeDir: 'i18n',
      enableInSFC: false
    }
  }
}
