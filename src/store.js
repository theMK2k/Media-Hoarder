const { dialog } = require("electron").remote;
const logger = require('loglevel');

import path from 'path';

import * as db from '@/helpers/db';
import * as dbsyncSQLite from '@/helpers/dbsync-sqlite';
import * as helpers from '@/helpers/helpers';

const isBuild = process.env.NODE_ENV === 'production';

if (!isBuild) {
	logger.setLevel(0);
}

console.log('logLevel:', logger.getLevel());

let dbsync = dbsyncSQLite;

dbsync.default.runSync(helpers.default.getPath('data/mediabox.db_initial'), helpers.default.getPath('data/mediabox.db'), {doCreateTables: true, doCreateColumns: true, doCopyContent: true}, (err) => {
	if (err) {
		if (err.error && err.error.errorCode == 'SYNCERR') {
			dialog.showMessageBox(null, {
				type: 'error',
				title: 'MediaBox - DB Sync Error',
				message: err.error.message
			});
			logger.error('ERROR:', err);
			return;
		}

		logger.log('WARN:', err);
	}

	db.default.initDbCB((err) => {
		if (err) {
			logger.error(err);
		}
	})
});
