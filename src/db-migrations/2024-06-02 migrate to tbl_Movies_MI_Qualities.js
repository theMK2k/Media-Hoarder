const logger = require("../helpers/logger");

function getName() {
  return "2024-06-02 migrate to tbl_Movies_MI_Qualities";
}

async function runMigration(db) {
  // Provide a Category_Name and Category_Sort for all existing MI_Qualities
  logger.log("[runmigration] Provide a Category_Name and Category_Sort for all existing MI_Qualities");
  await db.fireProcedure(
    `UPDATE tbl_Movies_MI_Qualities SET Category_Name = 'video-resolution', Category_Sort = 1 WHERE MI_Quality IN ('SD', '720p', 'HD', 'UHD', '4K', '8K')`
  );

  // Migrate existing MI_Qualities from tbl_Movies to tbl_Movies_MI_Qualities (if not already migrated)
  logger.log("[runmigration] Migrate existing MI_Qualities from tbl_Movies to tbl_Movies_MI_Qualities");
  await db.fireProcedure(
    `INSERT INTO tbl_Movies_MI_Qualities (
      id_Movies
      , MI_Quality
      , Category_Name
      , Category_Sort
      , deleted
    )
    SELECT
      id_Movies
      , MI_Quality
      , 'video-resolution'
      , 1
      , 0
    FROM tbl_Movies MOV
    WHERE MOV.id_Movies || MOV.MI_Quality NOT IN (SELECT id_Movies || MI_Quality FROM tbl_Movies_MI_Qualities)`
  );
  return;
}

export { getName, runMigration };
