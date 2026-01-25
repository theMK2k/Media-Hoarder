/**
 * db.js v1.0
 *
 * Database interface and functions for sqlite access and management
 */
import fs from "fs";
import logger from "./logger.js";
import * as helpers from "./helpers.js";

// Use window.require for native CommonJS modules in Electron renderer
// This works because Electron exposes require globally when nodeIntegration is enabled
const sqlite3 = window.require("sqlite3").verbose();
const LOG_ALL_DB = false; // set to true to log all db queries

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
    logger.error("[getDb] Db has not been initialized. Please call init first.");
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

async function initDb() {
  return new Promise((resolve, reject) => {
    initDbCB((err) => {
      if (err) {
        return reject(err);
      }

      return resolve();
    });
  });
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
  if (LOG_ALL_DB) logger.log("[fireProcedure] query: ", query, " vars: ", vars);
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
  if (LOG_ALL_DB) logger.log("[fireProcedureReturnScalar] query: ", query, " vars: ", vars);
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
  if (LOG_ALL_DB) logger.log("[fireProcedureReturnAll] query: ", query, " vars: ", vars);
  return new Promise((resolve, reject) => {
    sqlitefireProcedureReturnAllCB(query, vars, (err, result) => {
      if (err) {
        return reject(err);
      }

      return resolve(result);
    });
  });
}

async function fireProcedureReturnSingle(query, vars) {
  const result = await fireProcedureReturnAll(query, vars);
  return result[0];
}

function initSQLite(callback) {
  logger.debug("[initSQLite] Initializing SQLite");

  if (!fs.existsSync(helpers.getDataPath("media-hoarder.db"))) {
    fs.copyFileSync(helpers.getStaticPath("data/media-hoarder.db_initial"), helpers.getDataPath("media-hoarder.db"));
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

/**
 * Build an INSERT query based on @param data for table provided in @param tableName
 * @param {string} tableName
 * @param {string} primaryKeyName
 * @param {Object} data e.g. {$column1: 'value1', $column2: 'value2'}
 * @param {Object} onConflict e.g. { columns: ['column1', 'column2'], algorithm: 'NOTHING' }
 * @returns {string}
 */
function buildINSERTQuery(tableName, primaryKeyName, data, onConflict = null) {
  let query = `
  INSERT INTO ${tableName} (
    `;
  let counter = 0;
  Object.keys(data).forEach((key) => {
    if (key.substring(1) === primaryKeyName) {
      return;
    }
    query += `${
      counter++
        ? `
    , `
        : ""
    } "${key.substring(1)}"`;
  });
  query += `) VALUES (`;
  counter = 0;
  Object.keys(data).forEach((key) => {
    query += `${
      counter++
        ? `
     , `
        : ""
    } ${key}`;
  });
  query += `)`;

  if (onConflict) {
    query += `\nON CONFLICT (${onConflict.columns.reduce((acc, currentValue, index) => {
      return acc + '"' + currentValue + '"' + (index < onConflict.columns.length - 1 ? ", " : "");
    }, "")}) DO ${onConflict.algorithm}`;
  }

  return query;
}

/**
 * Build an UPDATE query based on @param data for table provided in @param tableName
 * @param {string} tableName
 * @param {string} primaryKeyName
 * @param {Object} data e.g. {$column1: 'value1', $column2: 'value2'}
 * @param {Object} onConflict e.g. { columns: ['column1', 'column2'], algorithm: 'NOTHING' }
 * @returns {string}
 */
function buildUPDATEQuery(tableName, primaryKeyName, data, onConflict = null) {
  let query = `
  UPDATE ${tableName} SET
  `;
  let counter = 0;
  Object.keys(data).forEach((key) => {
    if (key.substring(1) === primaryKeyName) {
      return;
    }
    query += `${
      counter++
        ? `
    , `
        : ""
    } "${key.substring(1)}" = ${key}`;
  });
  query += `
  WHERE ${primaryKeyName} = $${primaryKeyName}`;

  if (onConflict) {
    query += `\nON CONFLICT (${onConflict.columns.reduce((acc, currentValue, index) => {
      return acc + '"' + currentValue + '"' + (index < onConflict.columns.length - 1 ? ", " : "");
    }, "")}) DO ${onConflict.algorithm}`;
  }

  return query;
}

export {
  getDb,
  initDb,
  initDbCB,
  fireProcedureCB,
  fireProcedureReturnScalarCB,
  fireProcedureReturnAllCB,
  fireProcedure,
  fireProcedureReturnScalar,
  fireProcedureReturnAll,
  fireProcedureReturnSingle,
  buildINSERTQuery,
  buildUPDATEQuery,
};
