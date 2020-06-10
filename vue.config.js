module.exports = {
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        extraResources: [
          'data/mediabox.db_initial',
          'data/mediainfo/**/*',
          'data/easylist.txt'
        ],
        publish: [
          'github'
        ]
      }
    },
    i18n: {
      locale: 'en',
      fallbackLocale: 'en',
      localeDir: 'i18n',
      enableInSFC: false
    }
  }
}
