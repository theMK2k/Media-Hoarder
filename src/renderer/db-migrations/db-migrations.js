/* eslint-disable no-unreachable */
import logger from "@helpers/logger.js";

import * as migration20240602 from "./2024-06-02 migrate to tbl_Movies_MI_Qualities.js";

const modules = [migration20240602];

async function runMigrations(db) {
  for (const module of modules) {
    if (!module.getName || !module.getName()) {
      throw new Error("At least one migration module is missing a name (expected by the getName function)");
    }
  }

  for (let module of modules) {
    logger.info(`checking migration: ${module.getName()}`);

    if (
      await db.fireProcedureReturnScalar(`SELECT COUNT(*) FROM tbl_DB_Migrations WHERE Name = $Name`, {
        $Name: module.getName(),
      })
    ) {
      logger.info(`  migration was already applied, skip`);
      continue;
    }

    await module.runMigration(db);

    await db.fireProcedure(`INSERT INTO tbl_DB_Migrations (Name, created_at) VALUES ($Name, DATETIME('now'))`, {
      $Name: module.getName(),
    });
  }

  logger.info("all migrations completed");
}

export { runMigrations };
