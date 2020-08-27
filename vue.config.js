module.exports = {
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        extraResources: [
          'data/media-hoarder.db_initial',
          'data/mediainfo/**/*',
          'data/easylist.txt'
        ],
        publish: [
          'github'
        ],
        linux: {
          category: 'AudioVideo'
        }
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
