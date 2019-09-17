const logger		= require('loglevel');
const helpers = require("./helpers/helpers");
const db = require("./helpers/db");
const dbsyncSQLite = require('./helpers/dbsync-sqlite');

dbsyncSQLite.runSync(helpers.getInitialDBPath(), helpers.getDBPath(), {doCreateTables: true, doCreateColumns: true, doCopyContent: true}, (err) => {
	if (err) {
		//logger.error('ERROR:', err);
		console.error('ERROR:', err);
		return;
	}

	db.initDbCB((err) => {
		if (err) {
			// logger.error(chalk.red(err));
			console.error('ERROR:', err);

		}
	});
})
