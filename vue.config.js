module.exports = {
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        extraResources: ['data/mediabox.db_initial', 'data/mediainfo/**/*', 'data/easylist.txt'],
        publish: ['github']
      }
    }
	}
}