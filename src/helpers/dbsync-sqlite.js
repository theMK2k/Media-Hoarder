const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
const async = require("async");

const logger = require("./logger");
const definedError = require("./defined-error");

const dryRun = false; // if true, don't actually run sqlStatements

let templateDb = null;
let workingDb = null;

function runSync(
  templateDBPath,
  workingDBPath,
  { doCreateTables, doCreateColumns, doCopyContent },
  callback
) {
  logger.debug("[runSync] Syncing DB...");

  logger.debug("[runSync] Template DB Path:", templateDBPath);
  logger.debug("[runSync] Working DB Path :", workingDBPath);

  if (!fs.existsSync(templateDBPath)) {
    return callback(
      definedError.create(
        "templateDBPath not found: " + templateDBPath,
        null,
        "SYNCERR",
        null
      )
    );
  }
  if (!fs.existsSync(workingDBPath)) {
    return callback(
      definedError.create(
        "workingDBPath not found: " + workingDBPath,
        null,
        "SYNCWARN",
        null
      )
    );
  }

  templateDb = new sqlite3.Database(templateDBPath, (err) => {
    if (err) {
      return callback(err);
    }

    workingDb = new sqlite3.Database(workingDBPath, (err2) => {
      if (err2) {
        return callback(err);
      }

      syncTables(doCreateTables, (err) => {
        logger.log("[runSync] syncTables done");

        if (err) {
          logger.log(err);
          return callback(err);
        }

        syncColumns(doCreateColumns, (err) => {
          if (err) {
            logger.log(err);
            return callback(err);
          }

          syncContent(doCopyContent, (err) => {
            if (err) {
              logger.log(err);
            }

            return callback(err);
          });
        });
      });
    });
  });
}

export { runSync };

function runQuery({ db, query, params }, callback) {
  // logger.debug('[runQuery] START');
  if (!query) {
    // logger.debug('[runQuery]  query is null, aborting');
    return callback(null);
  }

  if (dryRun) {
    logger.debug("[runQuery]  SQL Query suppressed due to dryRun:", query);
    return callback(null);
  }

  logger.debug("[runSync]  running query ...");
  db.run(query, params, (err) => {
    if (err) {
      logger.error("[runSync]  error: ", err);
      logger.debug("[runSync]  the query was: ", query);
    } else {
      logger.debug("[runSync]  OK");
    }
    callback(err);
  });
}

function syncTables(doCreateTables, callback) {
  if (!doCreateTables) {
    logger.debug("[syncTables] skipping syncTables due to configuration");
    return callback(null);
  }

  logger.debug("[syncTables] START");

  templateDb.all(
    `select tbl_name, sql from sqlite_master WHERE type='table' AND name not like 'sqlite%' AND name not like 'xtb_Database_Properties'`,
    [],
    (err, rowsTemplate) => {
      logger.debug("[syncTables]  got result");

      if (err) {
        logger.error(definedError.create("error in query", { err }));
        return callback(err);
      }

      // logger.debug('[syncTables] rowsTemplate:', rowsTemplate);

      workingDb.all(
        `select tbl_name from sqlite_master WHERE type='table' AND name not like 'sqlite%' AND name not like 'xtb_Database_Properties'`,
        [],
        (err, rowsWorking) => {
          if (err) {
            return callback(err);
          }

          // logger.debug('[syncTables] rowsWorking:', rowsWorking);

          let sqlStatements = [{ db: workingDb, query: null, params: [] }]; // we always include a null-statement in order to at least call the creation routine one time

          rowsTemplate.forEach((rowTemplate) => {
            if (
              !rowsWorking.find((rowWorking) => {
                return rowWorking["tbl_name"] === rowTemplate["tbl_name"];
              })
            ) {
              sqlStatements.push({
                db: workingDb,
                query: rowTemplate["sql"],
                params: [],
              });
            }
          });

          logger.debug(
            "[syncTables]  found " + (sqlStatements.length - 1) + " new tables"
          );

          async.mapSeries(sqlStatements, runQuery, (err) => {
            return callback(err);
          });
        }
      );
    }
  );
}

function syncColumns(doCreateColumns, callback) {
  if (!doCreateColumns) {
    logger.debug("[syncColumns] skipping syncColumns due to configuration");
    return callback(null);
  }

  logger.debug("[syncColumns] START");

  templateDb.all(
    `select tbl_name from sqlite_master WHERE type='table' AND name not like 'sqlite%' AND name not like 'xtb_Database_Properties'`,
    [],
    (err, rowsTemplate) => {
      if (err) {
        logger.debug("[syncColumns] err:", err);
        return callback(err);
      }

      // logger.debug('[syncColumns] rowsTemplate:', rowsTemplate);

      workingDb.all(
        `select tbl_name from sqlite_master WHERE type='table' AND name not like 'sqlite%' AND name not like 'xtb_Database_Properties'`,
        [],
        (err, rowsWorking) => {
          if (err) {
            return callback(err);
          }

          // logger.debug('[syncColumns] rowsWorking:', rowsWorking);

          let analyzeTables = [null]; // we always include a null-statement in order to at least call the routine one time

          rowsTemplate.forEach((rowTemplate) => {
            if (
              rowsWorking.find((rowWorking) => {
                return rowWorking["tbl_name"] === rowTemplate["tbl_name"];
              })
            ) {
              analyzeTables.push(rowTemplate["tbl_name"]);
            }
          });

          logger.debug(
            "[syncColumns]  analyzing " + (analyzeTables.length - 1) + " tables"
          );

          async.mapSeries(analyzeTables, syncColumnsTable, (err) => {
            return callback(err);
          });
        }
      );
    }
  );
}

function syncColumnsTable(table, callback) {
  if (!table) {
    return callback(null);
  }

  logger.debug("[syncColumnsTable]  analyzing table " + table);

  templateDb.all(`pragma table_info(${table})`, [], (err, colsTemplate) => {
    if (err) {
      logger.debug("[syncColumnsTable] err:", err);
      return callback(err);
    }

    // logger.debug('[syncColumnsTable]    colsTemplate:', colsTemplate);

    workingDb.all(`pragma table_info(${table})`, [], (err, colsWorking) => {
      if (err) {
        return callback(err);
      }

      // logger.debug('[syncColumnsTable]    colsWorking:', colsWorking);

      let sqlStatements = [{ db: workingDb, query: null, params: [] }];
      let numMissingCols = 0;

      colsTemplate.forEach((colTemplate) => {
        if (
          colsWorking.find((colWorking) => {
            return colTemplate.name === colWorking.name;
          })
        ) {
          return;
        }

        logger.debug(
          "[syncColumnsTable]  found missing column:",
          colTemplate.name
        );
        numMissingCols++;

        sqlStatements.push({
          db: workingDb,
          query:
            "ALTER TABLE [" +
            table +
            "] ADD COLUMN [" +
            colTemplate.name +
            "] " +
            colTemplate.type +
            (colTemplate.notnull ? " NOT NULL" : "") +
            (colTemplate["dflt_value"] !== null
              ? " DEFAULT " + colTemplate["dflt_value"]
              : ""),
          params: [],
        });
      });

      logger.debug(
        "[syncColumnsTable]  found " + numMissingCols + " missing column/s"
      );

      async.mapSeries(sqlStatements, runQuery, (err) => {
        return callback(err);
      });
    });
  });
}

function syncContent(doCopyContent, callback) {
  if (!doCopyContent) {
    logger.debug("[syncContent] skipping syncContent due to configuration");
    return callback(null);
  }

  logger.debug("[syncContent] START");

  let tablesToAnalyze = [null];

  templateDb.all(
    `select tbl_name from sqlite_master WHERE type='table' AND name not like 'sqlite%' AND name not like 'xtb_Database_Properties'`,
    [],
    (err, tablesTemplate) => {
      if (err) {
        logger.debug("[syncContent] err:", err);
        return callback(err);
      }
      workingDb.all(
        `select tbl_name from sqlite_master WHERE type='table' AND name not like 'sqlite%' AND name not like 'xtb_Database_Properties'`,
        [],
        (err, tablesWorking) => {
          if (err) {
            return callback(err);
          }

          // logger.debug('[syncContent] tablesTemplate:', tablesTemplate);
          // logger.debug('[syncContent] tablesWorking:', tablesWorking);

          tablesTemplate.forEach((tableTemplate) => {
            if (
              tablesWorking.find((tableWorking) => {
                return tableTemplate["tbl_name"] === tableWorking["tbl_name"];
              })
            ) {
              // logger.debug('[syncContent]  table ' + tableTemplate['tbl_name'] + ' found');
              tablesToAnalyze.push(tableTemplate["tbl_name"]);
            }
          });

          async.mapSeries(tablesToAnalyze, syncContentTable, (err) => {
            return callback(err);
          });
        }
      );
    }
  );
}

function syncContentTable(tableName, callback) {
  if (!tableName) {
    return callback(null);
  }

  logger.debug("[syncContentTable]  analyzing table " + tableName);

  // Fetch content in TemplateDB
  templateDb.all(`SELECT * FROM [${tableName}]`, [], (err, contentTemplate) => {
    if (err) {
      logger.error("[syncContentTable]  ERROR:", err);
      return callback(err);
    }

    if (contentTemplate.length === 0) {
      return callback(null);
    }

    templateDb.all(
      `pragma table_info(${tableName})`,
      [],
      (err, colsTemplate) => {
        if (err) {
          logger.error("[syncContentTable]  ERROR:", err);
          return callback(err);
        }

        workingDb.all(
          `pragma table_info(${tableName})`,
          [],
          (err, colsWorking) => {
            if (err) {
              logger.error("[syncContentTable]  ERROR:", err);
              return callback(err);
            }

            let numPK = 0;
            let pkColumnName = "";

            colsTemplate.forEach((colTemplate) => {
              if (colTemplate.pk === 1) {
                numPK++;
                pkColumnName = colTemplate.name;
              }
            });

            if (numPK === 0) {
              logger.debug("[syncContentTable]    ERROR: no PK column found!");
              return callback({ error: "no PK column found!" });
            }

            if (numPK > 1) {
              logger.debug(
                "[syncContentTable]    ERROR: multiple PK columns found!"
              );
              return callback({ error: "multiple PK columns found!" });
            }

            logger.debug("[syncContentTable]    PK column name:", pkColumnName);

            if (
              !colsWorking.find((colWorking) => {
                return colWorking.name === pkColumnName;
              })
            ) {
              logger.debug(
                "[syncContentTable]    ERROR: PK column not found in working DB"
              );
              return callback({ error: "PK column not found in working DB" });
            }

            const colsToAnalyze = [];
            colsTemplate.forEach((colTemplate) => {
              if (
                colsWorking.find((colWorking) => {
                  return colWorking.name === colTemplate.name;
                })
              ) {
                colsToAnalyze.push(colTemplate.name);
              }
            });

            contentTemplate.forEach((content) => {
              content._colsToAnalyze = colsToAnalyze;
              content._tableName = tableName;
              content._pkColumnName = pkColumnName;
            });

            async.mapSeries(contentTemplate, syncContentTableRow, (err) => {
              return callback(err);
            });
          }
        );
      }
    );
  });
}

function syncContentTableRow(content, callback) {
  // logger.debug('[syncContentTableRow] syncing content table row:', content);

  const query = `SELECT COUNT(1) AS count FROM [${content._tableName}] WHERE ${content._pkColumnName} = $${content._pkColumnName}`;
  const selectParams = {};
  selectParams[`$${content._pkColumnName}`] = content[content._pkColumnName];
  workingDb.get(query, selectParams, (err, row) => {
    if (err) {
      return callback(err);
    }

    let statement = null;
    let params = {};

    if (row.count === 0) {
      // Create INSERT statement
      logger.debug("[syncContentTableRow]    INSERT");

      let insertStatement = `INSERT INTO [${content._tableName}] `;
      let colNames = "";
      let colValues = "";

      content._colsToAnalyze.forEach((col) => {
        colNames = colNames + (colNames ? ", " : "") + "[" + col + "]";
        colValues = colValues + (colValues ? ", " : "") + "$" + col;
        params["$" + col] = content[col];
      });

      statement =
        insertStatement + "(" + colNames + ") VALUES (" + colValues + ")";
    }

    if (row.count === 1) {
      // Create UPDATE statement
      // logger.debug('[syncContentTableRow]    UPDATE');

      let updateStatement = `UPDATE [${content._tableName}] SET `;

      let columns = "";

      content._colsToAnalyze.forEach((col) => {
        if (col === content._pkColumnName) {
          return; // skip the primary key column
        }

        columns = columns + (columns ? ", " : "") + "[" + col + "] = $" + col;
        params["$" + col] = content[col];
      });

      statement =
        updateStatement +
        columns +
        " WHERE [" +
        content._pkColumnName +
        "] = $" +
        content._pkColumnName;
      params["$" + content._pkColumnName] = content[content._pkColumnName];
    }

    // logger.debug('[syncContentTableRow] statement:', statement);
    workingDb.run(statement, params, (err) => {
      if (err) {
        logger.error("[syncContentTableRow]      ERROR:", err);
        logger.debug("[syncContentTableRow]      Statement was:", statement);
        logger.debug("[syncContentTableRow]      Params were:", params);
      } else {
        // logger.debug('[syncContentTableRow]      OK');
      }

      return callback();
    });
  });
}
