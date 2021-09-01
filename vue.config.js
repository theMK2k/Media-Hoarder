module.exports = {
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        productName: 'Media Hoarder',
        extraResources: [
          'data/media-hoarder.db_initial',
          'data/easylist.txt'
        ],
        publish: [
          'github'
        ],
        win: {
          extraResources: [
            'bin/win'
          ]
        },
        linux: {
          category: 'AudioVideo',
          extraResources: [
            'bin/linux'
          ]
        },
        afterSign: "@oshell/vue-cli-plugin-electron-builder-notarize",
        mac: {
          hardenedRuntime: true,
          entitlements: "./entitlements.plist",
          extraResources: [
            'bin/mac'
          ]
        },
      },
			contextIsolation: false,
      nodeIntegration: true,
      enableRemoteModule: true
    },
    i18n: {
      locale: 'en',
      fallbackLocale: 'en',
      localeDir: 'i18n',
      enableInSFC: false
    }
  }
}
