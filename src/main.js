import Vue from 'vue'
import App from './App.vue'
import Vuetify from 'vuetify'
import '@mdi/font/css/materialdesignicons.css'

// const logger		= require('loglevel');

import 'vuetify/dist/vuetify.min.css'

import router from './router'

// const db = require("./helpers/db");
// const dbsyncSQLite = require('./helpers/dbsync-sqlite');

Vue.use(Vuetify)

Vue.config.productionTip = false

export const eventBus = new Vue({
});

new Vue({
	router,
	vuetify: new Vuetify({ iconfont: 'mdi' }),
	render: h => h(App),
}).$mount('#app')

/*
dbsyncSQLite.runSync('./data/mediabox.db_initial', './data/mediabox.db', {doCreateTables: true, doCreateColumns: true, doCopyContent: true}, (err) => {
	if (err) {
		logger.error('ERROR:', err);
		return;
	}

	db.initDbCB((err) => {
		if (err) {
			logger.error(chalk.red(err));
		}

		app.listen(config.port, (err) => {
			if (err) {
				logger.error(chalk.red(err));
			}
			
			logger.info(`TDC Management Backend is listening on port ${config.port}`);
		});
	});
})
*/