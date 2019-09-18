const logger = require('loglevel');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

import * as helpers from './helpers';

let _db;

export default {
    getDb: () => {
        assert.ok(_db, "Db has not been initialized. Please call init first.");
        return _db;
    },

    // ### Callback-based DB-Functions ###
    initDbCB: (callback) => {
        if (_db) {
            console.warn('Trying to init DB again!');
            return callback(null, _db);
        }

        initSQLite(callback);
    },

    fireProcedureCB: (query, vars, callback) => {
        sqliteFireProcedureCB(query, vars, callback);
    },

    fireProcedureReturnScalarCB: (query, vars, callback) => {
        sqlitefireProcedureReturnScalarCB(query, vars, callback);
    },

    fireProcedureReturnAllCB: (query, vars, callback) => {
        sqlitefireProcedureReturnAllCB(query, vars, callback);
    },

    // ### Promise-based DB-Functions
    fireProcedure: (query, vars) => {
        return new Promise((resolve, reject) => {
            sqliteFireProcedureCB(query, vars, (err, result) => {
                if (err) {
                    return reject(err);
                }

                return resolve(result);
            });
        })
    },

    fireProcedureReturnScalar: (query, vars) => {
        return new Promise((resolve, reject) => {
            sqlitefireProcedureReturnScalarCB(query, vars, (err, result) => {
                if (err) {
                    return reject(err);
                }

                return resolve(result);
            });
        })
    },

    fireProcedureReturnAll: (query, vars) => {
        return new Promise((resolve, reject) => {
            sqlitefireProcedureReturnAllCB(query, vars, (err, result) => {
                if (err) {
                    return reject(err);
                }

                return resolve(result);
            });
        })
    },
}

function initSQLite(callback) {
    logger.debug('Initializing SQLite');

    if (!fs.existsSync(helpers.default.getPath('data/mediabox.db'))) {
        fs.copyFileSync(helpers.default.getPath('data/mediabox.db_initial'), helpers.default.getPath('data/mediabox.db'));
    }

    _db = new sqlite3.Database(helpers.default.getPath('data/mediabox.db'), (err) => {
        callback(err, _db);
    });
};

function sqliteFireProcedureCB(query, vars, callback) {
    _db.run(query, vars, (err) => {
        return callback(err);
    });
};

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
};

function sqlitefireProcedureReturnAllCB(query, vars, callback) {
    _db.all(query, vars, (err, all) => {
        return callback(err, all);
    })
};