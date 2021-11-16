/**
 * db.js v1.0
 *
 * Database interface and functions for sqlite access and management
 */
const logger = require("./logger");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

const helpers = require("./helpers");

// import * as helpers from '@/helpers/helpers';

/**
 * our main connection to the database
 * created via initSQLite's _db = new sqlite3.Database
 */
let _db;

/**
 * @returns main connection to the database
 */
function getDb() {
  if (!_db) {
    logger.error(
      "[getDb] Db has not been initialized. Please call init first."
    );
  }

  return _db;
}

/**
 * Initialize the main connection if not already done
 *
 * @param {*} callback
 */
function initDbCB(callback) {
  if (_db) {
    logger.warn("[initDbCB] Trying to init DB again!");
    return callback(null, _db);
  }

  initSQLite(callback);
}

/**
 * Fire a query to the database (callback)
 * The callback is only invoked with the error Object, i.e. the query won't provide a result
 *
 * @param {string} query
 * @param {object} vars
 * @param {*} callback
 */
function fireProcedureCB(query, vars, callback) {
  sqliteFireProcedureCB(query, vars, callback);
}

/**
 * Fire a query to the database (callback)
 * The callback is invoked with the first column's value of the first row and the error Object
 *
 * @param {string} query
 * @param {object} vars
 * @param {*} callback
 */
function fireProcedureReturnScalarCB(query, vars, callback) {
  sqlitefireProcedureReturnScalarCB(query, vars, callback);
}

/**
 * Fire a query to the database (callback)
 * The callback is invoked with the result set and the error Object
 *
 * @param {string} query
 * @param {object} vars
 * @param {*} callback
 */
function fireProcedureReturnAllCB(query, vars, callback) {
  sqlitefireProcedureReturnAllCB(query, vars, callback);
}

/**
 * Fire a query to the database (Promise)
 * resolves with no parameter, i.e. the query won't provide a result
 *
 * @param {string} query
 * @param {object} vars
 */
function fireProcedure(query, vars) {
  return new Promise((resolve, reject) => {
    sqliteFireProcedureCB(query, vars, (err) => {
      if (err) {
        return reject(err);
      }

      return resolve();
    });
  });
}

function fireProcedureReturnScalar(query, vars) {
  return new Promise((resolve, reject) => {
    sqlitefireProcedureReturnScalarCB(query, vars, (err, result) => {
      if (err) {
        return reject(err);
      }

      return resolve(result);
    });
  });
}

function fireProcedureReturnAll(query, vars) {
  return new Promise((resolve, reject) => {
    sqlitefireProcedureReturnAllCB(query, vars, (err, result) => {
      if (err) {
        return reject(err);
      }

      return resolve(result);
    });
  });
}

function initSQLite(callback) {
  logger.debug("[initSQLite] Initializing SQLite");

  if (!fs.existsSync(helpers.getDataPath("media-hoarder.db"))) {
    fs.copyFileSync(
      helpers.getStaticPath("data/media-hoarder.db_initial"),
      helpers.getDataPath("media-hoarder.db")
    );
  }

  _db = new sqlite3.Database(helpers.getDataPath("media-hoarder.db"), (err) => {
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
  });
}

export {
  getDb,
  initDbCB,
  fireProcedureCB,
  fireProcedureReturnScalarCB,
  fireProcedureReturnAllCB,
  fireProcedure,
  fireProcedureReturnScalar,
  fireProcedureReturnAll,
};
