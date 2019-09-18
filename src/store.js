import path from 'path';

import * as db from './helpers/db';
import * as dbsyncSQLite from './helpers/dbsync-sqlite';
import * as helpers from './helpers/helpers';

let dbsync = dbsyncSQLite;

dbsync.default.runSync(helpers.default.getPath('data/mediabox.db_initial'), helpers.default.getPath('data/mediabox.db'), {doCreateTables: true, doCreateColumns: true, doCopyContent: true}, (err) => {
	if (err) {
		logger.error('ERROR:', err);
		return;
	}

	db.default.initDbCB((err) => {
		if (err) {
			logger.error(err);
		}
	})
});
