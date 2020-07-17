const logger = require('loglevel');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const helpers = require('./helpers');

// import * as helpers from '@/helpers/helpers';

let _db;

function getDb() {
	if (!_db) {
		logger.error('Db has not been initialized. Please call init first.');
	}

	return _db;
}

function initDbCB(callback) {
	if (_db) {
		logger.warn('Trying to init DB again!');
		return callback(null, _db);
	}

	initSQLite(callback);
}

function fireProcedureCB(query, vars, callback) {
	sqliteFireProcedureCB(query, vars, callback);
}

function fireProcedureReturnScalarCB(query, vars, callback) {
	sqlitefireProcedureReturnScalarCB(query, vars, callback);
}

function fireProcedureReturnAllCB(query, vars, callback) {
	sqlitefireProcedureReturnAllCB(query, vars, callback);
}

function fireProcedure(query, vars) {
	return new Promise((resolve, reject) => {
		sqliteFireProcedureCB(query, vars, (err, result) => {
			if (err) {
				return reject(err);
			}

			return resolve(result);
		});
	})
}

function fireProcedureReturnScalar(query, vars) {
	return new Promise((resolve, reject) => {
		sqlitefireProcedureReturnScalarCB(query, vars, (err, result) => {
			if (err) {
				return reject(err);
			}

			return resolve(result);
		});
	})
}

function fireProcedureReturnAll(query, vars) {
	return new Promise((resolve, reject) => {
		sqlitefireProcedureReturnAllCB(query, vars, (err, result) => {
			if (err) {
				return reject(err);
			}

			return resolve(result);
		});
	})
}


export {
	getDb,
	initDbCB,
	fireProcedureCB,
	fireProcedureReturnScalarCB,
	fireProcedureReturnAllCB,
	fireProcedure,
	fireProcedureReturnScalar,
	fireProcedureReturnAll
}

function initSQLite(callback) {
	logger.debug('Initializing SQLite');

	if (!fs.existsSync(helpers.getPath('data/media-hoarder.db'))) {
		fs.copyFileSync(helpers.getPath('data/media-hoarder.db_initial'), helpers.getPath('data/media-hoarder.db'));
	}

	_db = new sqlite3.Database(helpers.getPath('data/media-hoarder.db'), (err) => {
		callback(err, _db);
	});
}

function sqliteFireProcedureCB(query, vars, callback) {
	_db.run(query, vars, (err) => {
		return callback(err);
	});
}

function sqlitefireProcedureReturnScalarCB(query, vars, callback) {
	_db.get(query, vars, (err, row) => {
		let result = null;
		if (!err) {
			try {
				result = row[Object.keys(row)[0]];
			} catch (e) {
				result = null;
			}
		}
		return callback(err, result);
	});
}

function sqlitefireProcedureReturnAllCB(query, vars, callback) {
	_db.all(query, vars, (err, all) => {
		return callback(err, all);
	})
}