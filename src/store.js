const fs = require("fs");
const util = require("util");
const { dialog } = require("@electron/remote");
const child_process = require("child_process");
const _ = require("lodash");
// const textVersion = require("textversionjs");
const moment = require("moment");
const levenshtein = require("fast-levenshtein");
const osLocale = require("os-locale");
const path = require("path");
const sqlString = require("sqlstring-sqlite");

const readdirAsync = util.promisify(fs.readdir);
const existsAsync = util.promisify(fs.exists);
const statAsync = util.promisify(fs.stat);
const execAsync = util.promisify(child_process.exec);
const readFileAsync = util.promisify(fs.readFile);

import { asciiLogo } from "@/helpers/ascii-logo";
import { eventBus } from "@/main";

const logger = require("./helpers/logger");
const db = require("./helpers/db");
const dbsyncSQLite = require("./helpers/dbsync-sqlite");
const helpers = require("./helpers/helpers");
const { findIMDBtconstIncluded, findIMDBtconstInNFO, findIMDBtconstByFileOrDirname } = require("./find-imdb-tconst");
const { languageNameCodeMapping, languageCodeNameMapping } = require("./languages");
const mediainfo = require("./mediainfo");

const { shared } = require("./shared");

const {
  scrapeIMDBmainPageData,
  scrapeIMDBplotSummary,
  scrapeIMDBCompaniesDataV3,
  scrapeIMDBFullCreditsData,
  scrapeIMDBParentalGuideData,
  scrapeIMDBreleaseinfo,
  scrapeIMDBtechnicalData,
  scrapeIMDBplotKeywordsV3,
  scrapeIMDBFilmingLocationsV3,
} = require("./imdb-scraper");

const definedError = require("@/helpers/defined-error");

const imdbDataDefinition = require("./object-definitions/imdb-data");

const isBuild = process.env.NODE_ENV === "production";

let rescanAddedMovies = 0;

let rescanETA = {
  show: false,
  counter: null,
  numItems: null,
  elapsedMS: null,
  averageMS: null,
  startTime: null,
  endTime: null,
  timeRemaining: null,
  displayETA: "",
  progressPercent: 0,
};

let doAbortRescan = false;

let currentScanInfoHeader = "";

let dbsync = dbsyncSQLite;

// ensure standard paths
helpers.ensureDirectorySync(helpers.getDataPath(""));
helpers.ensureDirectorySync(helpers.getDataPath("extras"));

logger.info(asciiLogo);

logger.group("[Initialization]");
dbsync.runSync(
  helpers.getStaticPath("data/media-hoarder.db_initial"),
  helpers.getDataPath("media-hoarder.db"),
  { doCreateTables: true, doCreateColumns: true, doCopyContent: true },
  (err) => {
    if (err) {
      if (err.error && err.error.errorCode == "SYNCERR") {
        dialog.showMessageBox(null, {
          type: "error",
          title: "Media Hoarder - DB Sync Error",
          message: err.error.message,
        });
        logger.error("[Initialization] ERROR:", err);
        return;
      }

      logger.log("[Initialization] WARN:", err);
    }

    db.initDbCB((err) => {
      if (err) {
        return logger.error(err);
      }

      (async () => {
        // After the DB is successfully initialized, we can initialize everything else
        await ensureLogLevel();

        await manageIndexes(db);

        await loadSettingDuplicatesHandling();

        shared.currentLocale = await osLocale();

        logger.log("[Initialization] shared.currentLocale:", shared.currentLocale);

        const fallbackRegion = await getSetting("fallbackRegion");
        if (fallbackRegion) {
          const fallbackRegionObj = JSON.parse(fallbackRegion);

          if (fallbackRegionObj.locale === shared.currentLocale) {
            shared.fallbackRegion = fallbackRegionObj;
            logger.log("[Initialization] Fallback Region (from db):", shared.fallbackRegion);
          }
        }

        if (!shared.fallbackRegion) {
          await getFallbackRegion();
        }

        if (!shared.fallbackLanguage) {
          await getFallbackLanguage();
        }

        await ensureLanguageMapping();

        await fetchLanguageSettings();

        await fetchIMDBRatingDemographic();

        await loadReleaseAttributes();
        await loadFilterGroups();

        await ensureToolPath("mediainfo", "MediainfoPath");
        await ensureToolPath("vlc", "MediaplayerPath");

        shared.uiLanguage = await fetchUILanguage();

        moment.locale(shared.uiLanguage);

        eventBus.dbInitialized();

        logger.groupEnd();
      })();
    });
  }
);

function generateIndexQueryObject(tableName, ColumnNames, isUnique) {
  const columnNamesString = ColumnNames.reduce((prev, current) => {
    return prev + (prev ? ", " : "") + `${current}`;
  }, "");

  const name = `IDX_${tableName}_${columnNamesString.replace(/, /g, "_")}`;

  return {
    name,
    query: `CREATE ${isUnique ? "UNIQUE " : ""} INDEX IF NOT EXISTS main.${name} ON ${tableName} (${columnNamesString})`,
  };
}

async function manageIndexes(db) {
  logger.log("[manageIndexes] START");

  // add indexes (if they don't exist already)
  const queries = [
    generateIndexQueryObject("tbl_Genres", ["GenreID"], true),
    generateIndexQueryObject("tbl_Movies", ["id_SourcePaths"], false),
    generateIndexQueryObject("tbl_Movies", ["MI_Duration_Seconds"], false),
    generateIndexQueryObject("tbl_Movies", ["MI_Quality"], false),
    generateIndexQueryObject("tbl_Movies", ["MI_Aspect_Ratio"], false),
    generateIndexQueryObject("tbl_Movies", ["IMDB_tconst"], false),
    generateIndexQueryObject("tbl_Movies", ["IMDB_releaseType"], false),
    generateIndexQueryObject("tbl_Movies", ["IMDB_startYear"], false),
    generateIndexQueryObject("tbl_Movies", ["IMDB_runtimeMinutes"], false),
    generateIndexQueryObject("tbl_Movies", ["IMDB_rating"], false),
    generateIndexQueryObject("tbl_Movies", ["IMDB_numVotes"], false),
    generateIndexQueryObject("tbl_Movies", ["IMDB_metacriticScore"], false),
    generateIndexQueryObject("tbl_Movies", ["Extra_id_Movies_Owner"], false),
    generateIndexQueryObject("tbl_Movies_Genres", ["id_Movies"], false),
    generateIndexQueryObject("tbl_Movies_Genres", ["id_Genres"], false),
    generateIndexQueryObject("tbl_Settings", ["Key"], true),
    generateIndexQueryObject("tbl_SourcePaths", ["MediaType"], false),
    generateIndexQueryObject("tbl_SourcePaths", ["Description"], false),
    generateIndexQueryObject("tbl_Movies_IMDB_Credits", ["id_Movies"], false),
    generateIndexQueryObject("tbl_Movies_IMDB_Credits", ["IMDB_Person_ID"], false),
    generateIndexQueryObject("tbl_Movies_IMDB_Credits", ["id_Movies", "Category", "IMDB_Person_ID", "Credit"], true),
    generateIndexQueryObject("tbl_Movies_IMDB_Credits", ["Person_Name"], false),
    generateIndexQueryObject("tbl_Movies_IMDB_Companies", ["id_Movies"], false),
    generateIndexQueryObject("tbl_Movies_IMDB_Companies", ["IMDB_Company_ID"], false),
    generateIndexQueryObject("tbl_Movies_IMDB_Companies", ["id_Movies", "Category", "IMDB_Company_ID", "Role"], true),
    generateIndexQueryObject("tbl_Movies_IMDB_Companies", ["Company_Name"], false),
    generateIndexQueryObject("tbl_IMDB_Persons", ["IMDB_Person_ID"], true),
    generateIndexQueryObject("tbl_Movies_Languages", ["Type"], false),
    generateIndexQueryObject("tbl_Movies_Languages", ["Language"], false),
    generateIndexQueryObject("tbl_Movies_Languages", ["id_Movies"], false),
    generateIndexQueryObject("tbl_Movies_Languages", ["id_Movies", "Type", "Language"], true),
    generateIndexQueryObject("tbl_IMDB_Plot_Keywords", ["Keyword"], true),
    generateIndexQueryObject("tbl_Movies_IMDB_Plot_Keywords", ["id_Movies"], false),
    generateIndexQueryObject("tbl_Movies_IMDB_Plot_Keywords", ["id_IMDB_Plot_Keywords"], false),
    generateIndexQueryObject("tbl_Movies_IMDB_Plot_Keywords", ["id_Movies", "id_IMDB_Plot_Keywords"], true),
    generateIndexQueryObject("tbl_IMDB_Filming_Locations", ["Location"], true),
    generateIndexQueryObject("tbl_Movies_IMDB_Filming_Locations", ["id_Movies"], false),
    generateIndexQueryObject("tbl_Movies_IMDB_Filming_Locations", ["id_IMDB_Filming_Locations"], false),
    generateIndexQueryObject("tbl_Movies_IMDB_Filming_Locations", ["id_Movies", "id_IMDB_Filming_Locations"], true),
    generateIndexQueryObject("tbl_Movies_Release_Attributes", ["id_Movies"], false),
    generateIndexQueryObject("tbl_Movies_MI_Tracks", ["id_Movies"], false),
    generateIndexQueryObject("tbl_Movies_MI_Tracks", ["type"], false),
  ];

  logger.log("[manageIndexes] queries:", queries);

  for (let i = 0; i < queries.length; i++) {
    logger.log(".");
    await db.fireProcedure(queries[i].query);
  }

  logger.log("[manageIndexes] index creation done");

  // remove indexes which should not be used anymore
  const availableIndexes = await db.fireProcedureReturnAll(/* sql */ `SELECT name FROM sqlite_master WHERE type = 'index'`);

  for (let availableIndex of availableIndexes) {
    if (availableIndex.name.startsWith("IDX") && !queries.find((query) => query.name === availableIndex.name)) {
      logger.log("[manageIndexes] removing", availableIndex.name);
      await db.fireProcedure(`DROP INDEX main.${availableIndex.name}`);
    }
  }

  logger.log("[manageIndexes] index cleanup done");
}

async function fetchSourcePaths() {
  const result = await db.fireProcedureReturnAll(
    /* sql */ `
			SELECT 
			id_SourcePaths
			, MediaType
			, Path
			, Description
			, created_at
			, checkRemovedFiles
		FROM tbl_SourcePaths
    `,
    []
  );

  return result;
}

/**
 * Rescan meta data of the given items
 * @param {Array} items the items to rescan
 * @param {object} $t the i18n translate function
 */
async function rescanItems(items, $t) {
  rescanETA = {
    show: false,
    counter: 0,
    numItems: items.length,
    elapsedMS: 0,
    averageMS: null,
    startTime: null,
    endTime: null,
    timeRemaining: null,
    displayETA: "",
    progressPercent: 0,
  };

  resetUserScanOptions(); // user scan options (which apply to the standard rescan by source paths) don't apply here

  shared.isScanning = true;
  eventBus.rescanStarted();

  for (const item of items) {
    if (doAbortRescan) {
      break;
    }

    rescanETA.counter++;
    rescanETA.startTime = new Date().getTime();

    eventBus.scanInfoShow($t("Rescanning Movies") + " {remainingTimeDisplay}", `${item.Name || item.Filename}`, rescanETA);

    eventBus.setProgressBar(rescanETA.counter / rescanETA.numItems); // absolute progress

    await findReleaseAttributes(item, false);

    await applyMediaInfo(item, false);

    await assignIMDB(item.id_Movies, item.IMDB_tconst, null, item, $t);

    rescanETA.endTime = new Date().getTime();
    rescanETA.elapsedMS += rescanETA.endTime - rescanETA.startTime;
    rescanETA.averageMS = rescanETA.elapsedMS / rescanETA.counter;
    rescanETA.timeRemaining = Math.round(((rescanETA.numItems - rescanETA.counter) * rescanETA.averageMS) / 1000);
    rescanETA.displayETA = ` (${helpers.getTimeString(Math.round(((rescanETA.numItems - rescanETA.counter) * rescanETA.averageMS) / 1000))})`;
    rescanETA.progressPercent = 100 * (rescanETA.counter / rescanETA.numItems);
    rescanETA.show = true;
  }

  eventBus.rescanStopped();

  eventBus.scanInfoOff();
  eventBus.setProgressBar(-1); // off
}

/**
 * Rescan media based on the given source paths
 * @param {boolean} onlyNew if true, only new media will be scanned
 * @param {object} $t the i18n translate function
 */
async function rescan(onlyNew, $t) {
  rescanETA = {
    show: false,
    counter: null,
    numItems: null,
    elapsedMS: null,
    averageMS: null,
    startTime: null,
    endTime: null,
    timeRemaining: null,
    displayETA: "",
    progressPercent: 0,
  };

  rescanAddedMovies = 0;

  shared.isScanning = true;
  eventBus.rescanStarted();

  if (shared.scanOptions.filescanMovies) await filescanMovies(onlyNew, $t);

  if (shared.scanOptions.mergeExtras) await mergeExtras(onlyNew);

  if (shared.scanOptions.rescanMoviesMetaData) await rescanMoviesMetaData(onlyNew, null, $t);

  // await rescanSeries();								// TODO: Series support

  if (shared.scanOptions.handleDuplicates) await rescanHandleDuplicates();

  // clear isNew flag from all entries
  await db.fireProcedure(`UPDATE tbl_Movies SET isNew = 0`, []);

  // delete all removed entries
  logger.log("[rescan] Cleanup START");

  const rescanRemovedMovies = await db.fireProcedureReturnScalar(`SELECT COUNT(1) FROM tbl_Movies WHERE isRemoved = 1`);

  await db.fireProcedure(`DELETE FROM tbl_Movies WHERE isRemoved = 1`, []);
  await ensureMovieDeleted();
  logger.log("[rescan] CLEANUP END");

  shared.isScanning = false;
  doAbortRescan = false;
  eventBus.rescanStopped();
  eventBus.rescanFinished({ rescanAddedMovies, rescanRemovedMovies });
}

async function rescanHandleDuplicates() {
  logger.log("[rescan] ### rescanHandleDuplicates ###");

  eventBus.setProgressBar(2); // marquee

  const newMovies = await db.fireProcedureReturnAll("SELECT id_Movies FROM tbl_Movies WHERE isNew = 1 AND Extra_id_Movies_Owner IS NULL");

  logger.log("[rescan] newMovies:", newMovies);

  const arrNewMovies = newMovies.map((movie) => movie.id_Movies);

  logger.log("[rescan] arrNewMovies:", arrNewMovies);

  for (let i = 0; i < arrNewMovies.length; i++) {
    const $id_Movies = arrNewMovies[i];

    const currentMovie = (await db.fireProcedureReturnAll("SELECT * FROM tbl_Movies WHERE id_Movies = $id_Movies", { $id_Movies }))[0];

    logger.log("[rescan] currentMovie:", currentMovie);

    const actualDuplicates = await getMovieDuplicates($id_Movies, true, false, true);
    const metaDuplicates = await getMovieDuplicates($id_Movies, false, true, true);

    // even if there are multiple duplicates possible, we just take the first ones
    const actualDuplicate =
      actualDuplicates.length > 0
        ? (await db.fireProcedureReturnAll("SELECT * FROM tbl_Movies WHERE id_Movies = $id_Movies", { $id_Movies: actualDuplicates[0] }))[0]
        : null;
    const metaDuplicate =
      metaDuplicates.length > 0
        ? (await db.fireProcedureReturnAll("SELECT * FROM tbl_Movies WHERE id_Movies = $id_Movies", { $id_Movies: metaDuplicates[0] }))[0]
        : null;

    // addToList
    if ((shared.duplicatesHandling.actualDuplicate.addToList && actualDuplicate) || (shared.duplicatesHandling.metaDuplicate.addToList && metaDuplicate)) {
      logger.log("[rescanHandleDuplicates] addToList by duplicate");

      const duplicate = shared.duplicatesHandling.actualDuplicate.addToList && actualDuplicate ? actualDuplicate : metaDuplicate;

      logger.log("[rescanHandleDuplicates] addToList duplicate:", duplicate);

      const inLists = await db.fireProcedureReturnAll("SELECT id_Lists FROM tbl_Lists_Movies WHERE id_Movies = $id_Movies", {
        $id_Movies: duplicate.id_Movies,
      });

      logger.log("[rescanHandleDuplicates] addToList inLists:", inLists);

      for (let i = 0; i < inLists.length; i++) {
        const id_Lists = inLists[i].id_Lists;

        await addToList(id_Lists, $id_Movies, true);
      }
    }

    // updateTitle is already handled by applyMetaData
    // updateSubTitle is already handled by applyMetaData
    // updateRating is already handled by applyMetaData
    // updateLastAccess is already handled by applyMetaData
  }

  eventBus.setProgressBar(-1); // off
}

/**
 * Create
 * - fullPath from joining SourcePath and RelativePath
 * - fullDirectory from joining SourcePath and RelativeDirectory
 * @param {*} movies
 */
function ensureMovieFullPath(movie) {
  movie.fullPath = path.join(movie.SourcePath, movie.RelativePath);
  movie.fullDirectory = path.join(movie.SourcePath, movie.RelativeDirectory);
}

async function mergeExtras(onlyNew) {
  logger.log("[mergeExtras] START");

  if (!shared.scanOptions.mergeExtras) {
    logger.log("[mergeExtras] mergeExtras OFF in scanOptions, abort");
    return;
  }

  eventBus.setProgressBar(2); // marquee

  // removed: 		AND Extra_id_Movies_Owner IS NULL
  //              because on rescan we also want to re-merge extras
  const children = await db.fireProcedureReturnAll(/* sql */ `
	SELECT
		MOV.id_Movies
		, MOV.RelativePath
		, MOV.RelativeDirectory
		, MOV.Filename
		, MOV.Name
		, MOV.Name2
    , MOV.IMDB_tconst
    , MOV.id_SourcePaths
    , MOV.isDirectoryBased
    , SP.Path AS SourcePath
  FROM tbl_Movies MOV
  INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths
	WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
		AND (Filename LIKE '% - extra%' OR (isDirectoryBased = 1 AND RelativeDirectory LIKE '%extra%'))
		${onlyNew ? "AND MOV.isNew = 1" : ""}
  `);

  children.forEach((movie) => {
    ensureMovieFullPath(movie);
  });

  logger.log("[mergeExtras] Extra children (from db):", children);

  for (let i = 0; i < children.length; i++) {
    const child = children[i];

    if (!child.isDirectoryBased) {
      await mergeExtraFileBased(child);
    } else {
      await mergeExtraDirectoryBased(child);
    }
  }

  eventBus.setProgressBar(-1); // off
}

async function mergeExtraDirectoryBased(movie) {
  logger.log("[mergeExtraDirectoryBased] movie.Filename:", movie.Filename);

  // first, check if the media file is actually an extra - it must reside in an "extra" or "extras" directory
  const lastDirectoryNameLower = helpers.getLastDirectoryName(movie.fullDirectory).toLowerCase();

  if (!(lastDirectoryNameLower === "extra" || lastDirectoryNameLower === "extras")) {
    logger.log('[mergeExtraDirectoryBased] media file is not in "extra" or "extras" directory, abort');
  }

  logger.log("[mergeExtraDirectoryBased] movie.SourcePath:", movie.SourcePath);
  logger.log('[mergeExtraDirectoryBased] path.resolve(movie.fullDirectory, "..")', path.resolve(movie.fullDirectory, ".."));

  const $ParentDirectory = path.relative(movie.SourcePath, path.resolve(movie.fullDirectory, ".."));

  logger.log("[mergeExtraDirectoryBased] $ParentDirectory:", $ParentDirectory);

  let possibleParents = await db.fireProcedureReturnAll(
    /*sql*/ `
		SELECT
			id_Movies
			, RelativePath
			, RelativeDirectory
			, Filename
			, Name
			, Name2
      , IMDB_tconst
      , isDirectoryBased
		FROM tbl_Movies MOV
		WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
      AND RelativeDirectory = $ParentDirectory
      AND isDirectoryBased = 1
	`,
    { $ParentDirectory }
  );

  logger.log("[mergeExtraDirectoryBased] possibleParents:", possibleParents);

  if (possibleParents.length == 0) {
    logger.log("[mergeExtraDirectoryBased] no possible parent found :(");
    if (movie.Extra_id_Movies_Owner) {
      await db.fireProcedure(`UPDATE tbl_Movies SET Extra_id_Movies_Owner = NULL WHERE id_Movies = $id_Movies`, { $id_Movies: movie.id_Movies });
    }
    return;
  }

  if (possibleParents.length == 1) {
    logger.log("[mergeExtraDirectoryBased] single parent found");
    await assignExtra(possibleParents[0], movie, helpers.getMovieNameFromFileName(movie.Filename));
    return;
  }

  if (possibleParents.length > 1) {
    logger.log("[mergeExtraDirectoryBased] multiple parents found, we just use the first");
    await assignExtra(possibleParents[0], movie, helpers.getMovieNameFromFileName(movie.Filename));
    return;
  }

  return;
}

async function mergeExtraFileBased(movie) {
  logger.log("[mergeExtraFileBased] movie:", movie);

  const rxMovieName = /(^.*?) - extra/i;
  if (!rxMovieName.test(movie.Filename)) {
    logger.log("[mergeExtraFileBased] Extra name not identifyable in:", movie.Filename);
    return;
  }

  const $movieName = movie.Filename.match(rxMovieName)[1].trim();

  const $extraname = movie.Filename.match(/(extra.*?)[([.]/i)[1].trim();

  logger.log("[mergeExtraFileBased] $extraname:", $extraname);

  logger.log("[mergeExtraFileBased] identified $movieName:", $movieName);

  let possibleParents = await db.fireProcedureReturnAll(
    `
		SELECT
			id_Movies
			, RelativePath
			, RelativeDirectory
			, Filename
			, Name
			, Name2
			, IMDB_tconst
		FROM tbl_Movies MOV
		WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
      AND id_SourcePaths = $id_SourcePaths
			AND Filename NOT LIKE '% - extra%'
      AND Filename LIKE '${$movieName.replace("'", "_")}%'
	`,
    { $id_SourcePaths: movie.id_SourcePaths }
  );

  logger.log("[mergeExtraFileBased] possibleParents:", possibleParents);

  if (possibleParents.length == 0) {
    logger.log("[mergeExtraFileBased] no possible parent found :(");
    if (movie.Extra_id_Movies_Owner) {
      await db.fireProcedure(`UPDATE tbl_Movies SET Extra_id_Movies_Owner = NULL WHERE id_Movies = $id_Movies`, { $id_Movies: movie.id_Movies });
    }
    return;
  }

  if (possibleParents.length == 1) {
    logger.log("[mergeExtraFileBased] single parent found");
    await assignExtra(possibleParents[0], movie, $extraname);
    return;
  }

  possibleParents.forEach((parent) => {
    parent.distance = levenshtein.get(movie.fullPath, parent.fullPath);
    logger.log("[mergeExtraFileBased] parent distance:", parent.distance, parent.fullPath);
  });

  const bestDistance = possibleParents.sort((a, b) => a.distance - b.distance)[0].distance;

  possibleParents = possibleParents.filter((parent) => parent.distance === bestDistance);

  if (possibleParents.length == 1) {
    logger.log("[mergeExtraFileBased] best parent by string distance found:", possibleParents[0]);
    await assignExtra(possibleParents[0], movie, $extraname);
    return;
  }

  const possibleParentsMultipartFirst = possibleParents.filter((movie) => /\s1_\d/.test(movie.Filename));

  logger.log("[mergeExtraFileBased] possibleParentsMultipartFirst:", possibleParentsMultipartFirst);

  if (possibleParentsMultipartFirst.length == 1) {
    logger.log("[mergeExtraFileBased] multipart start single parent found");
    await assignExtra(possibleParentsMultipartFirst[0], movie, $extraname);
    return;
  }
}

async function assignExtra(parent, child, $extraname) {
  logger.log("[mergeExtraFileBased] assigning", child.Filename, "as extra to", parent.Filename);
  await db.fireProcedure(`UPDATE tbl_Movies SET Extra_id_Movies_Owner = $Extra_id_Movies_Owner, Name = $extraname, Name2 = NULL WHERE id_Movies = $id_Movies`, {
    $Extra_id_Movies_Owner: parent.id_Movies,
    $id_Movies: child.id_Movies,
    $extraname,
  });
  return;
}

async function filescanMovies(onlyNew, $t) {
  logger.log("[filescanMovies] START");

  eventBus.scanInfoShow($t("Rescanning Movies"), $t("Rescan started"));

  eventBus.setProgressBar(2); // marquee

  try {
    const moviesHave = await db.fireProcedureReturnAll(`
      SELECT
        MOV.id_Movies
        , LOWER(MOV.RelativePath) AS tmp_PathLower
        , LOWER(SP.Path) AS tmp_SourcePathLower
      FROM tbl_Movies MOV
      INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths
  		`);

    moviesHave.forEach((movie) => {
      movie.fullPathLower = path.join(movie.tmp_SourcePathLower, movie.tmp_PathLower).toLowerCase(); // we need to lowercase in code again, because some special characters aren't lowercased properly by SQLite, e.g. "Ä" -> "ä"
    });

    logger.log("[filescanMovies] moviesHave:", moviesHave); // #relpath: is this correct??

    const moviesSourcePaths = await db.fireProcedureReturnAll(`
			SELECT
				id_SourcePaths
				, MediaType
				, Path
				, Description
				, checkRemovedFiles
			FROM tbl_SourcePaths
			WHERE MediaType = 'movies'
			${shared.scanOptions.filescanMovies_id_SourcePaths_IN ? "AND id_SourcePaths IN " + shared.scanOptions.filescanMovies_id_SourcePaths_IN : ""}
		`);

    for (let i = 0; i < moviesSourcePaths.length; i++) {
      const movieSourcePath = moviesSourcePaths[i];
      logger.log(`[filescanMovies]   scanning Source Path ${movieSourcePath.Path} (${movieSourcePath.Description})`);

      if (movieSourcePath.checkRemovedFiles) {
        await db.fireProcedure(`UPDATE tbl_Movies SET isRemoved = 1 WHERE id_SourcePaths = $id_SourcePaths`, {
          $id_SourcePaths: movieSourcePath.id_SourcePaths,
        });
      }

      currentScanInfoHeader = `${$t("Rescanning Movies")} - ${movieSourcePath.Description}`;

      eventBus.scanInfoShow(currentScanInfoHeader, "");

      await filescanMoviesPath(onlyNew, moviesHave, movieSourcePath, movieSourcePath.Path);
    }

    eventBus.scanInfoOff();

    logger.log("[filescanMovies] END");
  } catch (err) {
    logger.log("[filescanMovies] ERROR:", err);
    throw err;
  } finally {
    eventBus.setProgressBar(-1); // off
  }
}

async function filescanMoviesPath(onlyNew, moviesHave, movieSourcePath, scanPath) {
  logger.log("[filescanMoviesPath] scan", scanPath);

  try {
    const pathItems = await listPath(movieSourcePath.Path, scanPath);

    // add files
    for (let i = 0; i < pathItems.length; i++) {
      const pathItem = pathItems[i];

      if (pathItem.isFile) {
        const movieHave = moviesHave.find((have) => have.fullPathLower === pathItem.fullPathLower);

        if (movieHave) {
          logger.log("[filescanMoviesPath] HAVE:", pathItem.fullPathLower, "movieHave:", movieHave);

          const $Size = await getFileSize(pathItem);

          await db.fireProcedure(`UPDATE tbl_Movies SET isRemoved = 0, Size = $Size, file_created_at = $file_created_at WHERE id_Movies = $id_Movies`, {
            $id_Movies: movieHave.id_Movies,
            $Size,
            $file_created_at: pathItem.file_created_at,
          });
          continue;
        }

        if (
          ![".avi", ".mp4", ".mkv", ".m2ts", ".rar"].find((ext) => {
            return ext === pathItem.ExtensionLower;
          })
        ) {
          continue;
        }

        await addMovie(movieSourcePath, pathItem);
      }
    }

    // recurse directories
    for (let i = 0; i < pathItems.length; i++) {
      const pathItem = pathItems[i];

      if (pathItem.isDirectory) {
        await filescanMoviesPath(onlyNew, moviesHave, movieSourcePath, pathItem.fullPath);
      }
    }
  } catch (err) {
    return;
  }
}

const enmMovieTypes = {
  IGNORE: 0,
  DIRECTORYBASED: 1,
  FILEBASED: 2,
  EXCEPTION: 3,
};

/**
 * Identify the type of movie (file-based, directory-based etc.)
 *
 * the movie is to be IGNOREd if:
 * - it has a ".rar" extension and it contains "part*.rar" in its name but not /part0*1/
 * - it resides in a directory named "sample" or "proof"
 *
 * the movie is DIRECTORYBASED if:
 * - it resides alongside an .nfo AND the directory contains at most 2 media files (i.e. part1.rar, .mkv, .avi etc.)
 *
 * else the movie is FILEBASED
 *
 * @param {pathItem} pathItem
 */
async function getMovieType(basePath, pathItem) {
  logger.log("[getMovieType] pathItem:", pathItem);

  const lastDirLower = helpers.getLastDirectoryName(pathItem.fullDirectory).toLowerCase();

  // check for IGNORE
  if (await isIgnoreFile(pathItem)) {
    return enmMovieTypes.IGNORE;
  }

  // check for DIRECTORYBASED
  if (lastDirLower.match(/^extra/)) {
    // file is inside an "extra" directory -> we should check the parent directory, if it is in itself DIRECTORYBASED
    logger.log('[getMovieType] file is inside "extra" directory, check the parent directory...');

    if (await isDirectoryBased(basePath, path.resolve(pathItem.fullDirectory, ".."))) {
      logger.log("[getMovieType] parent directory is directory-based");
      return enmMovieTypes.DIRECTORYBASED;
    } else {
      logger.log("[getMovieType] parent directory is NOT directory-based");
      return enmMovieTypes.FILEBASED;
    }
  }

  if (await isDirectoryBased(basePath, pathItem.fullDirectory)) {
    return enmMovieTypes.DIRECTORYBASED;
  }

  return enmMovieTypes.FILEBASED;
}

/**
 * check if the directory:
 * - contains at most two media files
 * - contains an .nfo file
 * @param {string} directory
 */
async function isDirectoryBased(basePath, directory) {
  try {
    logger.log("[isDirectoryBased] directory:", directory);

    const pathItems = await listPath(basePath, directory);

    logger.log("[isDirectoryBased] pathItems:", pathItems);

    let numMediaFiles = 0;
    let nfoFound = false;

    for (let i = 0; i < pathItems.length; i++) {
      const pathItem = pathItems[i];

      if (
        ![".avi", ".mp4", ".mkv", ".m2ts", ".rar", ".nfo"].find((ext) => {
          return ext === pathItem.ExtensionLower;
        })
      ) {
        continue;
      }

      if (pathItem.ExtensionLower === ".nfo") {
        nfoFound = true;
        continue;
      }

      if (await isIgnoreFile(pathItem)) {
        continue;
      }

      numMediaFiles++;
    }

    if (numMediaFiles < 3 && nfoFound) {
      logger.log("[isDirectoryBased] YES! numMediaFiles:", numMediaFiles, "nfoFound:", nfoFound);
      return true;
    }

    logger.log("[isDirectoryBased] NOPE! numMediaFiles:", numMediaFiles, "nfoFound:", nfoFound);
    return false;
  } catch (error) {
    logger.error(error);
  }
}

/**
 * A file is to be ignored if:
 * - it has a ".rar" extension and it contains "part*.rar" in its name but not /part0*1/
 * - it resides in a directory named "sample" or "proof"
 *
 * @param {pathItem} pathItem
 */
async function isIgnoreFile(pathItem) {
  const nameLower = pathItem.Name.toLowerCase();

  const lastDirLower = helpers.getLastDirectoryName(pathItem.fullDirectory).toLowerCase();

  if (pathItem.isDirectory) {
    logger.log("[isIgnoreFile] file is actually a directory, IGNORE");
    return true;
  }

  if (pathItem.ExtensionLower === ".rar" && nameLower.match(/part.*\.rar/) && !nameLower.match(/part0*1\.rar/)) {
    logger.log("[isIgnoreFile] file is .rar but it is not the first part, IGNORE");
    return true;
  }

  if (lastDirLower === "sample") {
    logger.log('[isIgnoreFile] file is in a "sample" directory, IGNORE');
    return true;
  }

  if (lastDirLower === "proof") {
    logger.log('[isIgnoreFile] file is in a "proof" directory, IGNORE');
    return true;
  }

  logger.log("[isIgnoreFile] file is NOT to be ignored");
  return false;
}

/**
 * Add the movie to the database
 *
 * @param {*} movieSourcePath
 * @param {pathItem} pathItem
 */
async function addMovie(movieSourcePath, pathItem) {
  logger.log("[addMovie] pathItem.fullPath:", pathItem.fullPath);

  const movieType = await getMovieType(movieSourcePath.Path, pathItem);

  logger.log("[addMovie] movieType:", movieType);

  if (movieType === enmMovieTypes.IGNORE || movieType === enmMovieTypes.EXCEPTION) {
    logger.log("[addMovie] movieType is IGNORE or EXCEPTION, abort!");
    return;
  }

  logger.log("[addMovie] adding:", pathItem.Name);

  rescanAddedMovies++;

  // currentScanInfoHeader
  eventBus.scanInfoShow(currentScanInfoHeader, `adding ${pathItem.Name}`);

  let $Name = null;
  if (movieType === enmMovieTypes.DIRECTORYBASED) {
    $Name = helpers.getMovieNameFromDirectory(pathItem.fullDirectory);
  } else {
    $Name = helpers.getMovieNameFromFileName(pathItem.Name);
  }

  logger.log("[addMovie] $Name:", $Name);

  const $Size = await getFileSize(pathItem);

  const sqlQuery = `INSERT INTO tbl_Movies (
    id_SourcePaths
    , Name
    , RelativePath
    , RelativeDirectory
    , Filename
    , Size
    , file_created_at
    , created_at
    , isNew
    , isDirectoryBased
  ) VALUES (
    $id_SourcePaths
    , $Name
    , $RelativePath
    , $RelativeDirectory
    , $Filename
    , $Size
    , $file_created_at
    , DATETIME('now')
    , 1
    , $DIRECTORYBASED
  )`;

  const sqlData = {
    $id_SourcePaths: movieSourcePath.id_SourcePaths,
    $Name,
    $RelativePath: pathItem.relativePath,
    $RelativeDirectory: pathItem.relativeDirectory,
    $Filename: pathItem.Name,
    $Size,
    $file_created_at: pathItem.file_created_at,
    $DIRECTORYBASED: movieType === enmMovieTypes.DIRECTORYBASED,
  };

  logger.log("[addMovie] query:", sqlQuery, "data:", sqlData);

  await db.fireProcedure(sqlQuery, sqlData);
}

/**
 * Get the filesize of a media file:
 * - usually it is the actual size of the file
 * - when dealing with multipart .rar files, we need to summarize
 *
 * @param {pathItem} pathItem
 */
async function getFileSize(pathItem) {
  logger.log("[getFileSize] pathItem.Name:", pathItem.Name);

  if (pathItem.ExtensionLower !== ".rar") {
    logger.log("[getFileSize] not .rar, we use the file size:", pathItem.Size);

    return pathItem.Size;
  }

  let commonNameLower = pathItem.Name.toLowerCase().replace(".rar", "");

  commonNameLower = commonNameLower.replace(/\.part\d*$/, "");

  logger.log("[getFileSize] got .rar, using common name:", commonNameLower);

  const pathItems = await listPath(pathItem.fullDirectory, pathItem.fullDirectory);

  return pathItems
    .filter((item) => {
      let itemCommonNameLower = item.Name.split(".").slice(0, -1).join(".").toLowerCase(); // remove file ending

      itemCommonNameLower = itemCommonNameLower.replace(/\.part\d*$/, "");

      if (itemCommonNameLower !== commonNameLower) {
        return false;
      }

      if (item.ExtensionLower === ".rar" || /r\d\d/.test(item.ExtensionLower) || /\s\d\d/.test(item.ExtensionLower) || /\t\d\d/.test(item.ExtensionLower)) {
        return true;
      }

      return false;
    })
    .map((item) => {
      return item.Size;
    })
    .reduce((acc, cur) => {
      return acc + cur;
    });
}

async function listPath(basePath, scanPath) {
  if (!basePath || !scanPath) {
    throw Error("listPath called without basePath!");
  }

  const readdirResult = await readdirAsync(scanPath, { withFileTypes: true });

  const arrResult = [];

  // logger.log('listPath result:', result);

  for (let i = 0; i < readdirResult.length; i++) {
    const dirent = readdirResult[i];

    const fullPath = path.join(scanPath, dirent.name);

    const stats = await statAsync(fullPath);

    arrResult.push({
      fullPath: fullPath,
      fullDirectory: scanPath,
      fullPathLower: fullPath.toLowerCase(),

      relativePath: path.relative(basePath, fullPath),
      relativeDirectory: path.relative(basePath, scanPath),
      relativePathLower: path.relative(basePath, fullPath).toLowerCase(),

      Name: dirent.name,
      ExtensionLower: path.extname(dirent.name).toLowerCase(),
      isFile: dirent.isFile(),
      isDirectory: dirent.isDirectory(),
      Size: stats.size,
      file_created_at: stats.mtime,
      stats,
    });
  }

  logger.log("[listPath] arrResult:", arrResult);

  return arrResult;
}

/**
 * Create Name, Name2 etc. from IMDBData for each movie, also apply possible metadata from duplicates
 * @param {*} onlyNew
 * @param {*} id_Movies
 */
async function applyMetaData(onlyNew, id_Movies) {
  logger.log("[applyMetaData] onlyNew:", onlyNew, "id_Movies:", id_Movies);

  const query = `
  SELECT
    MOV.id_Movies
    , MOV.Filename
    , IFNULL(MOV.IMDB_localTitle, '') AS IMDB_localTitle
    , IFNULL(MOV.IMDB_originalTitle, '') AS IMDB_originalTitle
    , IFNULL(MOV.IMDB_primaryTitle, '') AS IMDB_primaryTitle
    , MOV.IMDB_startYear
    , MOV.IMDB_endYear
    , SP.MediaType
    , MOV.DefinedByUser
  FROM tbl_Movies MOV
  INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths
  WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
  ${onlyNew ? "AND (MOV.isNew = 1 OR MOV.scanErrors IS NOT NULL)" : ""}
  ${id_Movies ? "AND MOV.id_Movies = " + id_Movies : ""}
  `;

  logger.log("[applyMetaData] query:", query);

  const movies = await db.fireProcedureReturnAll(query, []);

  logger.log("[applyMetaData] movies:", movies);

  for (let i = 0; i < movies.length; i++) {
    if (doAbortRescan) {
      break;
    }

    const movie = movies[i];

    // let Name = movie.IMDB_localTitle;
    // let Name2 = null;

    let Name = null;
    let Name2 = null;

    const names = [];

    logger.log("[applyMetaData] names from IMDB:", {
      IMDB_localTitle: movie.IMDB_localTitle,
      IMDB_originalTitle: movie.IMDB_originalTitle,
      IMDB_primaryTitle: movie.IMDB_primaryTitle,
    });

    if (movie.IMDB_localTitle) {
      logger.log("[applyMetaData] names: we use IMDB_localTitle:", movie.IMDB_localTitle);
      names.push(movie.IMDB_localTitle);
    }

    if (
      movie.IMDB_primaryTitle &&
      (names.length === 0 ||
        (!names[0].toLowerCase().includes(movie.IMDB_primaryTitle.toLowerCase()) && !movie.IMDB_primaryTitle.toLowerCase().includes(names[0].toLowerCase())))
    ) {
      logger.log("[applyMetaData] names: we use IMDB_primaryTitle:", movie.IMDB_primaryTitle);
      names.push(movie.IMDB_primaryTitle);
    }

    if (
      movie.IMDB_originalTitle &&
      names.length < 2 &&
      (names.length === 0 ||
        (!names[0].toLowerCase().includes(movie.IMDB_originalTitle.toLowerCase()) && !movie.IMDB_originalTitle.toLowerCase().includes(names[0].toLowerCase())))
    ) {
      logger.log("[applyMetaData] names: we use IMDB_originalTitle:", movie.IMDB_originalTitle);
      names.push(movie.IMDB_originalTitle);
    }

    if (names.length > 0) {
      Name = names[0];
    }

    if (names.length > 1) {
      Name2 = names[1];
    }

    logger.log("[applyMetaData] names:", {
      Name,
      Name2,
    });

    if (!Name) {
      Name = helpers.getMovieNameFromFileName(movie.Filename);
    }

    const rxMultiPart = /\s(\d)_(\d)/;
    if (rxMultiPart.test(movie.Filename)) {
      const multiPartMatches = movie.Filename.match(rxMultiPart);
      Name += ` (${multiPartMatches[1]}/${multiPartMatches[2]})`;
    }

    const startYear = movie.IMDB_startYear;
    const endYear = movie.IMDB_endYear;

    const duplicates = await getMovieDuplicates(movie.id_Movies, true, false, true); // actual duplicates
    const duplicate =
      duplicates.length > 0
        ? (await db.fireProcedureReturnAll("SELECT * FROM tbl_Movies WHERE id_Movies = $id_Movies", { $id_Movies: duplicates[0] }))[0]
        : null;

    // Overwrite by duplicate
    if (duplicate && shared.duplicatesHandling.actualDuplicate.updateTitle) {
      Name = duplicate.Name;
    }
    if (duplicate && shared.duplicatesHandling.actualDuplicate.updateSubTitle) {
      Name2 = duplicate.Name2;
    }

    let $last_access_at = null;

    if (duplicate && shared.duplicatesHandling.actualDuplicate.updateLastAccess) {
      $last_access_at = duplicate.last_access_at;
    }

    let $plotSummaryFull = null;
    let $plotSummary = null;

    if (duplicate && shared.duplicatesHandling.actualDuplicate.updateDescription) {
      $plotSummaryFull = duplicate.plotSummaryFull;
      $plotSummary = _.truncate(duplicate.plotSummaryFull, {
        length: 400,
        separator: " ",
        omission: " ...",
      });
    }

    let $Rating = null;
    if (duplicate && shared.duplicatesHandling.actualDuplicate.updateRating) {
      $Rating = duplicate.Rating;
    } else if (shared.duplicatesHandling.metaDuplicate.updateRating) {
      const metaDuplicates = await getMovieDuplicates(movie.id_Movies, false, true, true); // meta duplicates
      const metaDuplicate =
        metaDuplicates.length > 0
          ? (await db.fireProcedureReturnAll("SELECT * FROM tbl_Movies WHERE id_Movies = $id_Movies", { $id_Movies: metaDuplicates[0] }))[0]
          : null;

      if (metaDuplicate) {
        $Rating = metaDuplicate.Rating;
      }
    }

    // omit anything that has been (re-)defined by the user
    const definedByUser = getFieldsDefinedByUser(movie.DefinedByUser);
    logger.log("[applyMetaData] definedByUser:", definedByUser);

    const data = {
      $id_Movies: movie.id_Movies,
      $endYear: endYear,
      $last_access_at,
      $Rating,
    };

    let query = `UPDATE tbl_Movies SET
    last_access_at = $last_access_at
      , endYear = $endYear
      , Rating = $Rating`;

    if ($plotSummaryFull) {
      // $plotSummaryFull can only be truthy if a duplicate entry is found and it contains a plotSummaryFull
      data.$plotSummaryFull = $plotSummaryFull;
      data.$plotSummary = $plotSummary;
      query += "\n, plotSummaryFull = $plotSummaryFull";
      query += "\n, plotSummary = $plotSummary";
    }
    if (!definedByUser.find((item) => item === "Name")) {
      data.$Name = Name;
      query += "\n, Name = $Name";
    } else {
      logger.log("[applyMetaData] omitting Name (already defined by the user)");
    }
    if (!definedByUser.find((item) => item === "Name2")) {
      data.$Name2 = Name2;
      query += "\n, Name2 = $Name2";
    } else {
      logger.log("[applyMetaData] omitting Name2 (already defined by the user)");
    }
    if (!definedByUser.find((item) => item === "startYear")) {
      data.$startYear = startYear;
      query += "\n, startYear = $startYear";
    } else {
      logger.log("[applyMetaData] omitting startYear (already defined by the user)");
    }
    query += "\nWHERE id_Movies = $id_Movies";

    await db.fireProcedure(query, data);

    if (duplicate && shared.duplicatesHandling.actualDuplicate.updateReleaseAttributes) {
      // use actual duplicate's release attributes
      await db.fireProcedure(`DELETE FROM tbl_Movies_Release_Attributes WHERE id_Movies = $id_Movies`, { $id_Movies: movie.id_Movies });
      await db.fireProcedure(
        `INSERT INTO tbl_Movies_Release_Attributes (
            id_Movies
            , Release_Attributes_searchTerm
            , deleted
          )
          SELECT
            $id_Movies AS id_Movies
            , Release_Attributes_searchTerm
            , deleted
          FROM tbl_Movies_Release_Attributes WHERE id_Movies = $id_Movies_Duplicate`,
        { $id_Movies: movie.id_Movies, $id_Movies_Duplicate: duplicate.id_Movies }
      );
    }
  }

  logger.log("[applyMetaData] END");
}

async function rescanMoviesMetaData(onlyNew, id_Movies, $t) {
  // NOTE: if WHERE clause gets enhanced, please also enhance the code below "Filter movies that only have..."
  let movies = await db.fireProcedureReturnAll(
    `
			SELECT
				MOV.id_Movies
				, MOV.id_SourcePaths
				, MOV.RelativePath
				, MOV.RelativeDirectory
				, MOV.Filename
        , MOV.MI_Duration_Seconds
				, MOV.MI_Done
				, MOV.IMDB_Done
        , MOV.IMDB_tconst
        , MOV.isDirectoryBased
        , SP.Path AS SourcePath
        , MOV.DefinedByUser
        , MOV.isUnlinkedIMDB
        , MOV.scanErrors
      FROM tbl_Movies MOV
      INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths
			WHERE 
        (isRemoved IS NULL OR isRemoved = 0)
        AND Extra_id_Movies_Owner IS NULL
				${onlyNew ? "AND (isNew = 1 OR scanErrors IS NOT NULL OR IFNULL(IMDB_Done, 0) = 0 OR IFNULL(MI_Done, 0) = 0)" : ""}
				${shared.scanOptions.rescanMoviesMetaData_id_SourcePaths_IN ? "AND id_SourcePaths IN " + shared.scanOptions.rescanMoviesMetaData_id_SourcePaths_IN : ""}
				${shared.scanOptions.rescanMoviesMetaData_id_Movies ? "AND id_Movies = " + shared.scanOptions.rescanMoviesMetaData_id_Movies : ""}
				${id_Movies ? "AND id_Movies = " + id_Movies : ""}
			`,
    []
  );

  // Filter movies that only have one scanError and that is "IMDB link verification" - a rescan without new IMDB tconst will not help here
  if (!id_Movies && onlyNew) {
    movies = movies.filter((movie) => {
      // there are other reasons why the movie should definitely be rescanned
      if (movie.isNew || !movie.IMDB_Done || !movie.MI_Done) {
        return true;
      }

      if (!movie.IMDB_tconst) {
        return true;
      }

      if (!movie.scanErrors) {
        return false;
      }

      const scanErrors = JSON.parse(movie.scanErrors);

      if (Object.keys(scanErrors).length === 1 && scanErrors["IMDB link verification"]) {
        return false;
      }

      return true;
    });
  }

  if (!id_Movies) {
    rescanETA.show = false;
    rescanETA.numItems = movies.length;
    rescanETA.counter = 0;
    rescanETA.elapsedMS = 0;
  }

  movies.forEach((movie) => {
    ensureMovieFullPath(movie);
  });

  logger.log("[rescanMoviesMetadata] movies:", movies);

  for (let i = 0; i < movies.length; i++) {
    if (doAbortRescan) {
      break;
    }

    if (!id_Movies) {
      rescanETA.counter++;
      rescanETA.startTime = new Date().getTime();
    }

    const movie = movies[i];

    if (shared.scanOptions.rescanMoviesMetaData_maxEntries && i > shared.scanOptions.rescanMoviesMetaData_maxEntries) {
      break;
    }

    await rescanMovieMetaData(onlyNew, movie, $t, !id_Movies, !id_Movies);

    if (!id_Movies) {
      rescanETA.endTime = new Date().getTime();
      rescanETA.elapsedMS += rescanETA.endTime - rescanETA.startTime;
      rescanETA.averageMS = rescanETA.elapsedMS / rescanETA.counter;
      rescanETA.timeRemaining = Math.round(((rescanETA.numItems - rescanETA.counter) * rescanETA.averageMS) / 1000);
      rescanETA.displayETA = ` (${helpers.getTimeString(Math.round(((rescanETA.numItems - rescanETA.counter) * rescanETA.averageMS) / 1000))})`;
      rescanETA.progressPercent = 100 * (rescanETA.counter / rescanETA.numItems);
      rescanETA.show = true;
    }
  }

  eventBus.scanInfoOff();
  eventBus.setProgressBar(-1); // off
}

/**
 * Rescan the metadata (MediaInfo, IMDB) for the given movie
 * @param {boolean} onlyNew
 * @param {Object} movie
 * @param {Object} $t
 */
async function rescanMovieMetaData(onlyNew, movie, $t, optRescanMediaInfo, optFindIMDBtconst) {
  // eventBus.scanInfoOff();
  eventBus.scanInfoShow($t("Rescanning Movies") + " {remainingTimeDisplay}", `${movie.Name || movie.Filename}`, rescanETA);

  eventBus.setProgressBar(rescanETA.counter / rescanETA.numItems); // absolute progress

  const definedByUser = getFieldsDefinedByUser(movie.DefinedByUser);
  const IMDB_tconst_before = movie.IMDB_tconst;

  // MediaInfo
  if (optRescanMediaInfo && shared.scanOptions.rescanMoviesMetaData_applyMediaInfo) {
    eventBus.scanInfoShow($t("Rescanning Movies") + " {remainingTimeDisplay}", `${movie.Name || movie.Filename} (${$t("applying MediaInfo")})`, rescanETA);

    await applyMediaInfo(movie, onlyNew);
  }

  if (optFindIMDBtconst && shared.scanOptions.rescanMoviesMetaData_findIMDBtconst) {
    eventBus.scanInfoShow($t("Rescanning Movies") + " {remainingTimeDisplay}", `${movie.Name || movie.Filename} (${$t("determining IMDB ID")})`, rescanETA);

    if (!movie.isUnlinkedIMDB) {
      await findIMDBtconst(movie, onlyNew, $t);
    }
  }

  if (shared.scanOptions.rescanMoviesMetaData_fetchIMDBMetaData) {
    eventBus.scanInfoShow($t("Rescanning Movies") + " {remainingTimeDisplay}", `${movie.Name || movie.Filename} (${$t("scraping IMDB metadata")})`, rescanETA);

    await fetchIMDBMetaData($t, movie, onlyNew);
  }

  if (shared.scanOptions.rescanMoviesMetaData_findReleaseAttributes) {
    if (!definedByUser.find((item) => item === "ReleaseAttributesSearchTerms")) {
      eventBus.scanInfoShow(
        $t("Rescanning Movies") + " {remainingTimeDisplay}",
        `${movie.Name || movie.Filename} (${$t("finding release attributes")})`,
        rescanETA
      );

      await findReleaseAttributes(movie, onlyNew);
    } else {
      logger.log("[rescanMoviesMetadata] omitting Release Attribtues (already defined by the user)");
    }
  }

  if (shared.scanOptions.applyMetaData) {
    eventBus.scanInfoShow($t("Rescanning Movies") + " {remainingTimeDisplay}", `${movie.Name || movie.Filename} (${$t("applying metadata")})`, rescanETA);

    await applyMetaData(false, movie.id_Movies);
  }

  if (shared.scanOptions.checkIMDBtconst && IMDB_tconst_before !== movie.IMDB_tconst) {
    eventBus.scanInfoShow($t("Rescanning Movies") + " {remainingTimeDisplay}", `${movie.Name || movie.Filename} (${$t("checking IMDB link")})`, rescanETA);

    await verifyIMDBtconst(movie.id_Movies, $t);
  }
}

/**
 * Run MediaInfo-CLI on the file
 * Analyze the data provided by MediaInfo-CLI and store it in tbl_Movies (MI_* fields)
 * @param {Object} movie
 * @param {Boolean} onlyNew
 * @returns
 */
async function applyMediaInfo(movie, onlyNew) {
  // run mediainfo on movie file
  // parse mediainfo result and save to db
  if (onlyNew && movie.MI_Done) {
    return;
  }

  const mediaInfoPath = await getSetting("MediainfoPath");

  if (!mediaInfoPath) {
    logger.log("[applyMediaInfo] mediainfo not set, aborting");
    return;
  }

  if (!(await existsAsync(movie.fullPath))) {
    logger.log("[applyMediaInfo] file not found, skipping movie:", movie);
    return;
  }

  logger.log("[applyMediaInfo] movie:", movie);

  try {
    const miObj = await mediainfo.runMediaInfo(mediaInfoPath, movie.fullPath);
    const { MI, tracks, audioLanguages, subtitleLanguages } = await mediainfo.analyzeMediaInfoData(miObj, movie.id_Movies);

    logger.log("[applyMediaInfo] { MI, tracks, audioLanguages, subtitleLanguages }:", { MI, tracks, audioLanguages, subtitleLanguages });

    // store to db
    await db.fireProcedure(
      `UPDATE tbl_Movies
				SET
				MI_Done = 1
				, MI_Duration = $MI_Duration
				, MI_Duration_Seconds = $MI_Duration_Seconds
				, MI_Duration_Formatted = $MI_Duration_Formatted
				, MI_Quality = $MI_Quality
				, MI_Aspect_Ratio = $MI_Aspect_Ratio
				, MI_Audio_Languages = $MI_Audio_Languages
				, MI_Subtitle_Languages = $MI_Subtitle_Languages
			WHERE id_Movies = $id_Movies
			`,
      MI
    );

    for (let i = 0; i < audioLanguages.length; i++) {
      await db.fireProcedure(
        `INSERT OR IGNORE INTO tbl_Movies_Languages (id_Movies, Type, Language)
					VALUES ($id_Movies, 'audio', $Language)
				`,
        { $id_Movies: movie.id_Movies, $Language: audioLanguages[i] }
      );
    }

    for (let i = 0; i < subtitleLanguages.length; i++) {
      await db.fireProcedure(
        `INSERT OR IGNORE INTO tbl_Movies_Languages (id_Movies, Type, Language)
					VALUES ($id_Movies, 'subtitle', $Language)
				`,
        { $id_Movies: movie.id_Movies, $Language: subtitleLanguages[i] }
      );
    }

    for (let track of tracks) {
      const trackFields = track.trackFields;

      const checkData = {
        $id_Movies: trackFields.$id_Movies,
        $type: trackFields.$type,
      };
      if (trackFields.$ID !== null) {
        checkData.$ID = trackFields.$ID;
      }
      const checkQuery = `
      SELECT id_Movies_MI_Tracks FROM tbl_Movies_MI_Tracks WHERE id_Movies = $id_Movies AND type = $type AND ${
        trackFields.$ID !== null ? "ID = $ID" : "ID IS NULL"
      }
      `;

      logger.log("[applyMediaInfo] checkQuery:", checkQuery, "checkData:", checkData);

      const id_Movies_MI_Tracks = await db.fireProcedureReturnScalar(checkQuery, checkData);

      if (id_Movies_MI_Tracks) {
        // UPDATE
        trackFields.$id_Movies_MI_Tracks = id_Movies_MI_Tracks;
        logger.log("[applyMediaInfo] updating track record:", trackFields);
        const query = db.buildUPDATEQuery("tbl_Movies_MI_Tracks", "id_Movies_MI_Tracks", trackFields);
        await db.fireProcedure(query, trackFields);
      } else {
        // INSERT
        logger.log("[applyMediaInfo] inserting new track record:", trackFields);
        const query = db.buildINSERTQuery("tbl_Movies_MI_Tracks", "id_Movies_MI_Tracks", trackFields);
        await db.fireProcedure(query, trackFields);
      }
    }
  } catch (err) {
    logger.error(err);
  }
}

async function findIMDBtconst(movie, onlyNew, $t) {
  // find IMDB tconst
  // save IMDB_tconst to db
  logger.log("[findIMDBtconst] START movie:", movie);

  if (onlyNew && movie.IMDB_Done) {
    logger.log("[findIMDBtconst] nothing to do, abort");
    return;
  }

  eventBus.scanInfoShow(`${$t("Rescanning Movies")} {remainingTimeDisplay}`, `${movie.Name || movie.Filename} (${$t("detecting IMDB entry")})`, rescanETA);

  try {
    const scanErrorsString = await db.fireProcedureReturnScalar(`SELECT scanErrors FROM tbl_Movies WHERE id_Movies = $id_Movies`, {
      $id_Movies: movie.id_Movies,
    });

    movie.scanErrors = scanErrorsString ? JSON.parse(scanErrorsString) : {};

    delete movie.scanErrors["IMDB entry detection"];

    let tconstIncluded = "";
    let tconst = "";

    // find tconst by duplicate
    if (shared.duplicatesHandling.actualDuplicate.relinkIMDB) {
      logger.log("[findIMDBtconst] trying by duplicate");
      const actualDuplicates = await getMovieDuplicates(movie.id_Movies, true, false, true);
      const actualDuplicate =
        actualDuplicates.length > 0
          ? (await db.fireProcedureReturnAll("SELECT * FROM tbl_Movies WHERE id_Movies = $id_Movies", { $id_Movies: actualDuplicates[0] }))[0]
          : null;

      if (actualDuplicate && actualDuplicate.IMDB_tconst) {
        tconst = actualDuplicate.IMDB_tconst;
        logger.log("[findIMDBtconst] trying by duplicate - FOUND!");
      }
    }

    if (!tconst) {
      // tconst not found yet, maybe it's included in the file/directory name
      logger.log("[findIMDBtconst] checking for file/directory name inclusion");
      tconstIncluded = await findIMDBtconstIncluded(movie);
      if (!shared.scanOptions.rescanMoviesMetaData_findIMDBtconst_ignore_tconst_in_filename) {
        tconst = tconstIncluded;
      }
    }

    if (!tconst) {
      // tconst not found yet, try to find it in the .nfo file (if it exists)
      logger.log("[findIMDBtconst] checking for .nfo file content");
      const tconstByNFO = await findIMDBtconstInNFO(movie);

      if (tconstByNFO) {
        tconst = tconstByNFO;
      }
    }

    if (!tconst) {
      // tconst not found yet, try to find it by searching imdb from the file/directory name
      logger.log("[findIMDBtconst] using file/directory name (search)");
      logger.log("[findIMDBtconst] movie:", movie);
      tconst = await findIMDBtconstByFileOrDirname(movie, {
        returnAnalysisData: false,
        category: "title",
        excludeTVSeries: true,
      });

      if (shared.scanOptions.rescanMoviesMetaData_findIMDBtconst_ignore_tconst_in_filename) {
        // compare tconst from IMDB search with included tconst
        if (tconstIncluded && tconst) {
          if (tconstIncluded !== tconst) {
            logger.log(`[findIMDBtconst] tconst compare;mismatch;${tconst};${tconstIncluded};${movie.Filename}`);
          } else {
            logger.log(`[findIMDBtconst] tconst compare;match;${tconst};${tconstIncluded};${movie.Filename}`);
          }
        }
      }
    }

    if (tconst) {
      movie.IMDB_tconst = tconst;

      await db.fireProcedure(
        `
        UPDATE tbl_Movies
          SET	IMDB_tconst = $IMDB_tconst
        WHERE id_Movies = $id_Movies
        `,
        {
          $id_Movies: movie.id_Movies,
          $IMDB_tconst: movie.IMDB_tconst,
        }
      );

      return tconst;
    }
  } catch (error) {
    logger.error(error);

    if (movie.scanErrors) {
      movie.scanErrors["IMDB entry detection"] = error.message;
    }
  } finally {
    if (movie.scanErrors) {
      await db.fireProcedure(
        `
        UPDATE tbl_Movies
          SET	scanErrors = $scanErrors
        WHERE id_Movies = $id_Movies
        `,
        {
          $id_Movies: movie.id_Movies,
          $scanErrors: JSON.stringify(movie.scanErrors),
        }
      );
    }
  }
}

async function fetchIMDBMetaData($t, movie, onlyNew) {
  logger.log("[fetchIMDBdata] movie:", movie);

  // fetch IMDB data from imdb.com (incl. images)
  // save IMDB data to db
  if (onlyNew && movie.IMDB_Done) {
    logger.log("[fetchIMDBdata] IMDB already processed, abort");
    return;
  }

  if (!movie.IMDB_tconst) {
    return;
  }

  let imdbData = JSON.parse(JSON.stringify(imdbDataDefinition));

  try {
    const scanErrorsString = await db.fireProcedureReturnScalar(`SELECT scanErrors FROM tbl_Movies WHERE id_Movies = $id_Movies`, {
      $id_Movies: movie.id_Movies,
    });

    movie.scanErrors = scanErrorsString ? JSON.parse(scanErrorsString) : {};

    if (
      shared.scanOptions.rescanMoviesMetaData_fetchIMDBMetaData_mainPageData &&
      getUserScanOption("rescanMoviesMetaData_fetchIMDBMetaData_mainPageData").enabled
    ) {
      try {
        eventBus.scanInfoShow(
          $t("Rescanning Movies") + " {remainingTimeDisplay}",
          `${movie.Name || movie.Filename} (${$t("scraping IMDB Main Page")})`,
          rescanETA
        );

        imdbData.mainPageData = await scrapeIMDBmainPageData(movie, helpers.downloadFile);
      } catch (error) {
        imdbData.IMDB_Done = false;
        logger.error(error);
      }
    }

    // #rip-rating-demographics
    // if (
    //   shared.scanOptions.rescanMoviesMetaData_fetchIMDBMetaData_ratingDemographics &&
    //   getUserScanOption("rescanMoviesMetaData_fetchIMDBMetaData_ratingDemographics").enabled
    // ) {
    //   try {
    //     eventBus.scanInfoShow(
    //       $t("Rescanning Movies") + " {remainingTimeDisplay}",
    //       `${movie.Name || movie.Filename} (${$t("scraping IMDB Rating Demographics")})`,
    //       rescanETA
    //     );

    //     imdbData.ratingDemographics = await scrapeIMDBRatingDemographics(movie);
    //   } catch (error) {
    //     imdbData.IMDB_Done = false;
    //     logger.error(error);
    //   }
    // }

    if (
      shared.scanOptions.rescanMoviesMetaData_fetchIMDBMetaData_plotSummary &&
      getUserScanOption("rescanMoviesMetaData_fetchIMDBMetaData_plotSummary").enabled
    ) {
      try {
        eventBus.scanInfoShow(
          $t("Rescanning Movies") + " {remainingTimeDisplay}",
          `${movie.Name || movie.Filename} (${$t("scraping IMDB Plot Summary")})`,
          rescanETA
        );

        imdbData.plotSummaryFull = await scrapeIMDBplotSummary(movie, imdbData.mainPageData.$IMDB_plotSummary);
      } catch (error) {
        imdbData.IMDB_Done = false;
        logger.error(error);
      }
    }

    if (
      shared.scanOptions.rescanMoviesMetaData_fetchIMDBMetaData_plotKeywords &&
      getUserScanOption("rescanMoviesMetaData_fetchIMDBMetaData_plotKeywords").enabled
    ) {
      try {
        eventBus.scanInfoShow(
          $t("Rescanning Movies") + " {remainingTimeDisplay}",
          `${movie.Name || movie.Filename} (${$t("scraping IMDB Plot Keywords")})`,
          rescanETA
        );

        imdbData.plotKeywords = await scrapeIMDBplotKeywordsV3(movie);
      } catch (error) {
        imdbData.IMDB_Done = false;
        logger.error(error);
      }
    }

    if (
      shared.scanOptions.rescanMoviesMetaData_fetchIMDBMetaData_releaseinfo &&
      getUserScanOption("rescanMoviesMetaData_fetchIMDBMetaData_releaseinfo").enabled
    ) {
      try {
        const regions = await getRegions();
        const allowedTitleTypes = await getAllowedTitleTypes();

        eventBus.scanInfoShow(
          $t("Rescanning Movies") + " {remainingTimeDisplay}",
          `${movie.Name || movie.Filename} (${$t("scraping IMDB Release Info")})`,
          rescanETA
        );

        imdbData.releaseinfo = await scrapeIMDBreleaseinfo(movie, regions, allowedTitleTypes);
      } catch (error) {
        imdbData.IMDB_Done = false;
        logger.error(error);
      }
    }

    if (
      shared.scanOptions.rescanMoviesMetaData_fetchIMDBMetaData_technicalData &&
      getUserScanOption("rescanMoviesMetaData_fetchIMDBMetaData_technicalData").enabled
    ) {
      try {
        eventBus.scanInfoShow(
          $t("Rescanning Movies") + " {remainingTimeDisplay}",
          `${movie.Name || movie.Filename} (${$t("scraping IMDB Technical Data")})`,
          rescanETA
        );

        imdbData.technicalData = await scrapeIMDBtechnicalData(movie);
      } catch (error) {
        imdbData.IMDB_Done = false;
        logger.error(error);
      }
    }

    if (
      shared.scanOptions.rescanMoviesMetaData_fetchIMDBMetaData_parentalguideData &&
      getUserScanOption("rescanMoviesMetaData_fetchIMDBMetaData_parentalguideData").enabled
    ) {
      try {
        const regions = await getRegions();

        eventBus.scanInfoShow(
          $t("Rescanning Movies") + " {remainingTimeDisplay}",
          `${movie.Name || movie.Filename} (${$t("scraping IMDB Parental Guide")})`,
          rescanETA
        );

        imdbData.parentalguideData = await scrapeIMDBParentalGuideData(
          movie,
          regions,
          db.fireProcedureReturnAll,
          db.fireProcedure,
          db.fireProcedureReturnScalar
        );
      } catch (error) {
        imdbData.IMDB_Done = false;
        logger.error(error);
      }
    }

    if (
      shared.scanOptions.rescanMoviesMetaData_fetchIMDBMetaData_creditsData &&
      getUserScanOption("rescanMoviesMetaData_fetchIMDBMetaData_creditsData").enabled
    ) {
      try {
        eventBus.scanInfoShow(
          $t("Rescanning Movies") + " {remainingTimeDisplay}",
          `${movie.Name || movie.Filename} (${$t("scraping IMDB Full Credits")})`,
          rescanETA
        );

        imdbData.creditsData = await scrapeIMDBFullCreditsData(movie);
      } catch (error) {
        imdbData.IMDB_Done = false;
        logger.error(error);
      }
    }

    if (
      shared.scanOptions.rescanMoviesMetaData_fetchIMDBMetaData_companiesData &&
      getUserScanOption("rescanMoviesMetaData_fetchIMDBMetaData_companiesData").enabled
    ) {
      try {
        eventBus.scanInfoShow(
          $t("Rescanning Movies") + " {remainingTimeDisplay}",
          `${movie.Name || movie.Filename} (${$t("scraping IMDB Companies")})`,
          rescanETA
        );

        imdbData.companiesData = await scrapeIMDBCompaniesDataV3(movie);
      } catch (error) {
        imdbData.IMDB_Done = false;
        logger.error(error);
      }
    }

    if (
      shared.scanOptions.rescanMoviesMetaData_fetchIMDBMetaData_filmingLocations &&
      getUserScanOption("rescanMoviesMetaData_fetchIMDBMetaData_filmingLocations").enabled
    ) {
      try {
        eventBus.scanInfoShow(
          $t("Rescanning Movies") + " {remainingTimeDisplay}",
          `${movie.Name || movie.Filename} (${$t("scraping IMDB Filming Locations")})`,
          rescanETA
        );

        imdbData.filmingLocations = await scrapeIMDBFilmingLocationsV3(movie);
      } catch (error) {
        imdbData.IMDB_Done = false;
        logger.error(error);
      }
    }

    logger.log("[fetchIMDBdata] imdbData:", imdbData);

    if (shared.scanOptions.rescanMoviesMetaData_saveIMDBData) {
      eventBus.scanInfoShow($t("Rescanning Movies") + " {remainingTimeDisplay}", `${movie.Name || movie.Filename} (${$t("store IMDB metadata")})`, rescanETA);

      await saveIMDBData(movie, imdbData);
    }
  } catch (err) {
    logger.error(err);
    return;
  }
}

/**
 * Removes all IMDB Data from a certain movie
 * @param {String} $id_Movies
 */
async function deleteIMDBData($id_Movies) {
  const rowsMovie = await db.fireProcedureReturnAll(
    `SELECT
      MOV.*
      , SP.Path AS SourcePath
    FROM tbl_Movies MOV
    INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths
    WHERE id_Movies = $id_Movies`,
    { $id_Movies }
  );
  const movie = rowsMovie[0];

  logger.log("[deleteIMDBData] movie:", movie);

  movie.DefinedByUser = movie.DefinedByUser || "";

  let colsMovieIMDB = "";
  Object.keys(movie).forEach((col) => {
    if (col.startsWith("IMDB")) {
      colsMovieIMDB += `${colsMovieIMDB ? ", " : ""}${col} = NULL`;
    }
  });

  const sqlMoviesIMDBCols = `UPDATE tbl_Movies SET scanErrors = NULL, ${colsMovieIMDB} WHERE id_Movies = $id_Movies`;
  logger.log("[deleteIMDBData] sqlMoviesIMDBCols:", sqlMoviesIMDBCols);
  await db.fireProcedure(sqlMoviesIMDBCols, { $id_Movies });

  if (!movie.DefinedByUser.includes("|Name|")) {
    const $Name = movie.isDirectoryBased
      ? helpers.getMovieNameFromDirectory(path.join(movie.SourcePath, movie.RelativeDirectory))
      : helpers.getMovieNameFromFileName(movie.Filename);

    const sqlMovieName = `UPDATE tbl_Movies SET Name = $Name WHERE id_Movies = $id_Movies`;
    logger.log("[deleteIMDBData] sqlMovieNames $Name:", $Name, "sqlMovieNames:", sqlMovieName);
    await db.fireProcedure(sqlMovieName, { $id_Movies, $Name });
  }

  if (!movie.DefinedByUser.includes("|Name2|")) {
    const sqlMoviesName2 = `UPDATE tbl_Movies SET Name2 = NULL WHERE id_Movies = $id_Movies`;
    logger.log("[deleteIMDBData] sqlMoviesName2:", sqlMoviesName2);
    await db.fireProcedure(sqlMoviesName2, { $id_Movies });
  }

  if (!movie.DefinedByUser.includes("|plotSummaryFull|")) {
    const sqlMoviePlotSummary = `UPDATE tbl_Movies SET plotSummary = NULL, plotSummaryFull = NULL WHERE id_Movies = $id_Movies`;
    logger.log("[deleteIMDBData] sqlMoviePlotSummary:", sqlMoviePlotSummary);
    await db.fireProcedure(sqlMoviePlotSummary, { $id_Movies });
  }

  if (!movie.DefinedByUser.includes("|startYear|")) {
    const sqlMovieStartYear = `UPDATE tbl_Movies SET startYear = NULL WHERE id_Movies = $id_Movies`;
    logger.log("[deleteIMDBData] sqlMovieStartYear:", sqlMovieStartYear);
    await db.fireProcedure(sqlMovieStartYear, { $id_Movies });
  }

  if (!movie.DefinedByUser.includes("|Genres|")) {
    const sqlMoviesGenres = `DELETE FROM tbl_Movies_Genres WHERE id_Movies = $id_Movies`;
    logger.log("[deleteIMDBData] sqlMoviesGenres:", sqlMoviesGenres);
    await db.fireProcedure(sqlMoviesGenres, { $id_Movies });
  }

  await db.fireProcedure("DELETE FROM tbl_Movies_IMDB_Companies WHERE id_Movies = $id_Movies", { $id_Movies });
  await db.fireProcedure("DELETE FROM tbl_Movies_IMDB_Credits WHERE id_Movies = $id_Movies", { $id_Movies });
  await db.fireProcedure("DELETE FROM tbl_Movies_IMDB_Filming_Locations WHERE id_Movies = $id_Movies", { $id_Movies });
  await db.fireProcedure("DELETE FROM tbl_Movies_IMDB_Plot_Keywords WHERE id_Movies = $id_Movies", { $id_Movies });

  // mark as "isUnlinkedIMDB" to prevent rescan doing a tconst detection
  await db.fireProcedure("UPDATE tbl_Movies SET isUnlinkedIMDB = 1 WHERE id_Movies = $id_Movies", { $id_Movies });
}

async function saveIMDBData(movie, imdbData) {
  logger.log("[saveIMDBData] imdbData:", imdbData);
  const definedByUser = getFieldsDefinedByUser(movie.DefinedByUser);

  let tbl_Movies_IMDB_Data = {};

  tbl_Movies_IMDB_Data = Object.assign(tbl_Movies_IMDB_Data, imdbData.mainPageData || {});
  tbl_Movies_IMDB_Data = Object.assign(tbl_Movies_IMDB_Data, imdbData.ratingDemographics || {});
  tbl_Movies_IMDB_Data = Object.assign(tbl_Movies_IMDB_Data, imdbData.plotSummaryFull || {});
  tbl_Movies_IMDB_Data = Object.assign(tbl_Movies_IMDB_Data, imdbData.releaseinfo || {});
  tbl_Movies_IMDB_Data = Object.assign(tbl_Movies_IMDB_Data, imdbData.parentalguideData || {});
  tbl_Movies_IMDB_Data = Object.assign(tbl_Movies_IMDB_Data, (imdbData.creditsData || {}).topCredits || {});
  tbl_Movies_IMDB_Data = Object.assign(tbl_Movies_IMDB_Data, (imdbData.companiesData || {}).topProductionCompanies || {});
  tbl_Movies_IMDB_Data = Object.assign(tbl_Movies_IMDB_Data, imdbData.technicalData || {});

  const IMDB_genres = (imdbData.mainPageData || {}).$IMDB_genres || [];
  delete tbl_Movies_IMDB_Data.$IMDB_genres;
  logger.log("[saveIMDBData] IMDB_genres:", IMDB_genres);

  await db.fireProcedure(
    `UPDATE tbl_Movies SET
      isUnlinkedIMDB = 0  
      , IMDB_Done = $IMDB_Done
      , scanErrors = $scanErrors
    WHERE id_Movies = $id_Movies
  `,
    {
      $id_Movies: movie.id_Movies,
      $IMDB_Done: imdbData.IMDB_Done,
      $scanErrors: movie.scanErrors && Object.keys(movie.scanErrors).length > 0 ? JSON.stringify(movie.scanErrors) : null,
    }
  );

  // update tbl_Movies
  if (Object.keys(tbl_Movies_IMDB_Data).length > 0) {
    tbl_Movies_IMDB_Data = Object.assign(tbl_Movies_IMDB_Data, {
      $id_Movies: movie.id_Movies,
    });
    let query = db.buildUPDATEQuery("tbl_Movies", "id_Movies", tbl_Movies_IMDB_Data);

    logger.log("[saveIMDBData] update tbl_Movie query:", query, "data:", tbl_Movies_IMDB_Data);

    await db.fireProcedure(query, tbl_Movies_IMDB_Data);
  }

  if (definedByUser.find((item) => item === "Genres")) {
    logger.log("[saveIMDBData] omitting Genres (already defined by the user)");
  } else {
    await updateMovieGenres(movie.id_Movies, IMDB_genres);
  }

  // Credits
  if (
    shared.scanOptions.rescanMoviesMetaData_fetchIMDBMetaData_creditsData &&
    getUserScanOption("rescanMoviesMetaData_fetchIMDBMetaData_creditsData").enabled
  ) {
    logger.log("[saveIMDBData] credits:", imdbData.creditsData.credits);

    const movieCredits = await db.fireProcedureReturnAll(
      `
    SELECT
      id_Movies_IMDB_Credits
      , id_Movies
      , Category			AS category
      , IMDB_Person_ID	AS id
      , Person_Name		AS name
      , Credit			AS credit
    FROM tbl_Movies_IMDB_Credits WHERE id_Movies = $id_Movies`,
      { $id_Movies: movie.id_Movies }
    );

    for (let credit of imdbData.creditsData.credits || []) {
      const movieCredit = movieCredits.find(
        (mc) => mc.category === credit.category && mc.id === credit.id && helpers.nz(mc.credit) == helpers.nz(credit.credit)
      );

      let creditData = {
        $id_Movies: movie.id_Movies,
        $Category: credit.category,
        $IMDB_Person_ID: credit.id,
        $Person_Name: credit.name,
        $Credit: credit.credit,
      };

      // we can't use the INSERT ON CONFLICT UPDATE approach, because Credit can be NULL and ON CONFLICT doesn't fire with NULL
      if (movieCredit) {
        movieCredit.Found = true;

        creditData.$id_Movies_IMDB_Credits = movieCredit.id_Movies_IMDB_Credits;

        await db.fireProcedure(db.buildUPDATEQuery("tbl_Movies_IMDB_Credits", "id_Movies_IMDB_Credits", creditData), creditData);
      } else {
        await db.fireProcedure(db.buildINSERTQuery("tbl_Movies_IMDB_Credits", "id_Movies_IMDB_Credits", creditData), creditData);
      }
    }

    // remove existing credits that are not available anymore (re-link to another imdb entry)
    for (let movieCredit of movieCredits || []) {
      if (!movieCredit.Found) {
        // logger.log('[saveIMDBData] removing credit', movieCredit);

        await db.fireProcedure("DELETE FROM tbl_Movies_IMDB_Credits WHERE id_Movies_IMDB_Credits = $id_Movies_IMDB_Credits", {
          $id_Movies_IMDB_Credits: movieCredit.id_Movies_IMDB_Credits,
        });
      }
    }
  }

  // Companies
  if (
    shared.scanOptions.rescanMoviesMetaData_fetchIMDBMetaData_companiesData &&
    getUserScanOption("rescanMoviesMetaData_fetchIMDBMetaData_companiesData").enabled
  ) {
    const movieCompanies = await db.fireProcedureReturnAll(
      `
    SELECT
      id_Movies_IMDB_Companies
      , id_Movies
      , Category			AS category
      , IMDB_Company_ID	AS id
      , Company_Name		AS name
      , Role			AS role
    FROM tbl_Movies_IMDB_Companies WHERE id_Movies = $id_Movies`,
      { $id_Movies: movie.id_Movies }
    );

    for (let company of imdbData.companiesData.companies) {
      const movieCompany = movieCompanies.find(
        (mc) => mc.category === company.category && mc.id === company.id && helpers.nz(mc.role) == helpers.nz(company.role)
      );

      const companyData = {
        $id_Movies: movie.id_Movies,
        $Category: company.category,
        $IMDB_Company_ID: company.id,
        $Company_Name: company.name,
        $Role: company.role,
      };

      if (movieCompany) {
        movieCompany.Found = true;
        companyData.$id_Movies_IMDB_Companies = movieCompany.id_Movies_IMDB_Companies;

        await db.fireProcedure(db.buildUPDATEQuery("tbl_Movies_IMDB_Companies", "id_Movies_IMDB_Companies", companyData), companyData);
      } else {
        await db.fireProcedure(
          `
          INSERT INTO tbl_Movies_IMDB_Companies (
            id_Movies
            , Category
            , IMDB_Company_ID
            , Company_Name
            , Role
          ) VALUES (
            $id_Movies
            , $Category
            , $IMDB_Company_ID
            , $Company_Name
            , $Role
          )`,
          {
            $id_Movies: movie.id_Movies,
            $Category: company.category,
            $IMDB_Company_ID: company.id,
            $Company_Name: company.name,
            $Role: company.role,
          }
        );
      }
    }

    // remove existing companies that are not available anymore (re-link to another imdb entry)
    for (let i = 0; i < movieCompanies.length; i++) {
      const movieCompany = movieCompanies[i];

      if (!movieCompany.Found) {
        // logger.log('[saveIMDBData] removing company', movieCompany);

        await db.fireProcedure("DELETE FROM tbl_Movies_IMDB_Companies WHERE id_Movies_IMDB_Companies = $id_Movies_IMDB_Companies", {
          $id_Movies_IMDB_Companies: movieCompany.id_Movies_IMDB_Companies,
        });
      }
    }
  }

  if (
    shared.scanOptions.rescanMoviesMetaData_fetchIMDBMetaData_plotKeywords &&
    getUserScanOption("rescanMoviesMetaData_fetchIMDBMetaData_plotKeywords").enabled
  ) {
    const moviePlotKeywords = await fetchMoviePlotKeywords(movie.id_Movies);

    for (let plotKeyword of imdbData.plotKeywords || []) {
      let $id_IMDB_Plot_Keywords = await db.fireProcedureReturnScalar(`SELECT id_IMDB_Plot_Keywords FROM tbl_IMDB_Plot_Keywords WHERE Keyword = $Keyword`, {
        $Keyword: plotKeyword.Keyword,
      });

      if (!$id_IMDB_Plot_Keywords) {
        await db.fireProcedure(`INSERT INTO tbl_IMDB_Plot_Keywords (Keyword) VALUES ($Keyword)`, { $Keyword: plotKeyword.Keyword });
        $id_IMDB_Plot_Keywords = await db.fireProcedureReturnScalar(`SELECT id_IMDB_Plot_Keywords FROM tbl_IMDB_Plot_Keywords WHERE Keyword = $Keyword`, {
          $Keyword: plotKeyword.Keyword,
        });
      }

      if (!$id_IMDB_Plot_Keywords) {
        logger.error("[saveIMDBData] unable to store plot keyword:", plotKeyword);
      }

      const moviePlotKeyword = moviePlotKeywords.find((pk) => pk.id_IMDB_Plot_Keywords === $id_IMDB_Plot_Keywords);

      if (moviePlotKeyword) {
        moviePlotKeyword.Found = 1;
      }

      await db.fireProcedure(
        `
        INSERT INTO tbl_Movies_IMDB_Plot_Keywords (
          id_Movies
          , id_IMDB_Plot_Keywords
          , NumVotes
          , NumRelevant
        ) VALUES (
          $id_Movies
          , $id_IMDB_Plot_Keywords
          , $NumVotes
          , $NumRelevant
        )
        ON CONFLICT(id_Movies, id_IMDB_Plot_Keywords)
        DO UPDATE SET
          NumVotes = excluded.NumVotes
          , NumRelevant = excluded.NumRelevant`,
        {
          $id_Movies: movie.id_Movies,
          $id_IMDB_Plot_Keywords,
          $NumVotes: plotKeyword.NumVotes,
          $NumRelevant: plotKeyword.NumRelevant,
        }
      );
    }

    //remove existing plot keywords that are not available anymore (re-link to another imdb entry)
    for (let i = 0; i < moviePlotKeywords.length; i++) {
      const moviePlotKeyword = moviePlotKeywords[i];

      if (!moviePlotKeyword.Found) {
        // logger.log('[saveIMDBData] removing plot keyword', moviePlotKeyword);

        await db.fireProcedure("DELETE FROM tbl_Movies_IMDB_Plot_Keywords WHERE id_Movies_IMDB_Plot_Keywords = $id_Movies_IMDB_Plot_Keywords", {
          $id_Movies_IMDB_Plot_Keywords: moviePlotKeyword.id_Movies_IMDB_Plot_Keywords,
        });
      }
    }
  }

  if (
    shared.scanOptions.rescanMoviesMetaData_fetchIMDBMetaData_filmingLocations &&
    getUserScanOption("rescanMoviesMetaData_fetchIMDBMetaData_filmingLocations").enabled
  ) {
    const movieFilmingLocations = await fetchMovieFilmingLocations(movie.id_Movies);

    for (let filmingLocation of imdbData.filmingLocations || []) {
      let $id_IMDB_Filming_Locations = await db.fireProcedureReturnScalar(
        `SELECT id_IMDB_Filming_Locations FROM tbl_IMDB_Filming_Locations WHERE Location = $Location`,
        { $Location: filmingLocation.Location }
      );

      if (!$id_IMDB_Filming_Locations) {
        await db.fireProcedure(`INSERT INTO tbl_IMDB_Filming_Locations (Location) VALUES ($Location)`, { $Location: filmingLocation.Location });
        $id_IMDB_Filming_Locations = await db.fireProcedureReturnScalar(
          `SELECT id_IMDB_Filming_Locations FROM tbl_IMDB_Filming_Locations WHERE Location = $Location`,
          { $Location: filmingLocation.Location }
        );
      }

      if (!$id_IMDB_Filming_Locations) {
        logger.error("[saveIMDBData] unable to store filming location:", filmingLocation);
      }

      const movieFilmingLocation = movieFilmingLocations.find((fl) => fl.id_IMDB_Filming_Locations === $id_IMDB_Filming_Locations);

      if (movieFilmingLocation) {
        movieFilmingLocation.Found = 1;
      }

      await db.fireProcedure(
        `
      INSERT INTO tbl_Movies_IMDB_Filming_Locations (
        id_Movies
        , id_IMDB_Filming_Locations
        , Details
        , NumVotes
        , NumInteresting
      ) VALUES (
        $id_Movies
        , $id_IMDB_Filming_Locations
        , $Details
        , $NumVotes
        , $NumInteresting
      )
      ON CONFLICT(id_Movies, id_IMDB_Filming_Locations)
      DO UPDATE SET
        Details = excluded.Details  
        , NumVotes = excluded.NumVotes
        , NumInteresting = excluded.NumInteresting`,
        {
          $id_Movies: movie.id_Movies,
          $id_IMDB_Filming_Locations: $id_IMDB_Filming_Locations,
          $NumVotes: filmingLocation.NumVotes,
          $NumInteresting: filmingLocation.NumInteresting,
        }
      );
    }

    // remove existing filming locations that are not available anymore (re-link to another imdb entry)
    for (let i = 0; i < movieFilmingLocations.length; i++) {
      const movieFilmingLocation = movieFilmingLocations[i];

      if (!movieFilmingLocation.Found) {
        // logger.log('[saveIMDBData] removing filming location', movieFilmingLocation);

        await db.fireProcedure("DELETE FROM tbl_Movies_IMDB_Filming_Locations WHERE id_Movies_IMDB_Filming_Locations = $id_Movies_IMDB_Filming_Locations", {
          $id_Movies_IMDB_Filming_Locations: movieFilmingLocation.id_Movies_IMDB_Filming_Locations,
        });
      }
    }
  }
}

function getPreferredLanguages() {
  const preferredLanguages = [];

  if (shared.languagesAudioSubtitles && shared.languagesAudioSubtitles.length > 0) {
    shared.languagesAudioSubtitles.forEach((lang) => {
      preferredLanguages.push(lang.code);
    });
  } else if (shared.fallbackLanguage) {
    preferredLanguages.push(shared.fallbackLanguage.code);
  }

  return preferredLanguages;
}

/**
 * Generate an SQL query for the given filters
 * @param {Object} filters
 */
function generateFilterQuery(filters, arr_id_Movies, arr_IMDB_tconst) {
  let filterSourcePaths = "";
  logger.log("[generateFilterQuery] filters.filterSourcePaths:", filters.filterSourcePaths);
  if (filters.filterSourcePaths && filters.filterSourcePaths.find((filter) => !filter.Selected)) {
    filterSourcePaths = "AND MOV.id_SourcePaths IN (SELECT id_SourcePaths FROM tbl_SourcePaths WHERE Description IN (";

    filterSourcePaths += filters.filterSourcePaths
      .filter((filter) => filter.Selected)
      .map((filter) => filter.Description)
      .reduce((prev, current) => {
        return prev + (prev ? ", " : "") + `${sqlString.escape(current)}`;
      }, "");

    filterSourcePaths += "))";
  }

  let filterGenres = "";
  if (
    filters.filterGenres &&
    ((!filters.filterSettings.filterGenresAND && filters.filterGenres.find((filter) => !filter.Selected && !filter.Excluded)) ||
      (filters.filterSettings.filterGenresAND && filters.filterGenres.find((filter) => filter.Selected && !filter.Excluded)) ||
      filters.filterGenres.find((filter) => filter.Selected && filter.Excluded))
  ) {
    // ### INCLUSIVE Genres (selected and not excluded) ###
    if (
      (!filters.filterSettings.filterGenresAND && filters.filterGenres.find((filter) => !filter.Selected && !filter.Excluded)) ||
      (filters.filterSettings.filterGenresAND && filters.filterGenres.find((filter) => filter.Selected && !filter.Excluded))
    ) {
      const filterGenresListInclusive = filters.filterGenres.filter((filter) => filter.Selected && !filter.Excluded).map((filter) => filter.id_Genres);

      logger.debug("[generateFilterQuery] filterGenresListInclusive:", filterGenresListInclusive);

      if (filters.filterSettings.filterGenresAND) {
        // AND-filter: use INTERSECT
        filterGenres += "AND MOV.id_Movies IN (";

        filterGenres += filterGenresListInclusive.reduce((prev, current) => {
          return prev + (prev ? " INTERSECT " : "") + `SELECT id_Movies FROM tbl_Movies_Genres WHERE id_Genres = ${current}`;
        }, "");

        filterGenres += ")";
      } else {
        // OR-filter
        filterGenres = "AND MOV.id_Movies IN (SELECT id_Movies FROM tbl_Movies_Genres WHERE id_Genres IN (";

        filterGenres += filterGenresListInclusive.reduce((prev, current) => {
          return prev + (prev ? ", " : "") + current;
        }, "");

        filterGenres += "))";
      }
    }

    // ### EXCLUDING Genres (selected and excluded) ###
    if (filters.filterGenres.find((filter) => filter.Selected && filter.Excluded)) {
      const filterGenresListExclusive = filters.filterGenres.filter((filter) => filter.Selected && filter.Excluded).map((filter) => filter.id_Genres);

      logger.debug("[generateFilterQuery] filterGenresListExclusive:", filterGenresListExclusive);

      if (filters.filterSettings.filterGenresAND) {
        // AND-filter: use INTERSECT
        filterGenres += " AND MOV.id_Movies NOT IN (";

        filterGenres += filterGenresListExclusive.reduce((prev, current) => {
          return prev + (prev ? " INTERSECT " : "") + `SELECT id_Movies FROM tbl_Movies_Genres WHERE id_Genres = ${current}`;
        }, "");

        filterGenres += ")";
      } else {
        // OR-filter
        filterGenres += " AND MOV.id_Movies NOT IN (SELECT id_Movies FROM tbl_Movies_Genres WHERE id_Genres IN (";

        filterGenres += filterGenresListExclusive.reduce((prev, current) => {
          return prev + (prev ? ", " : "") + current;
        }, "");

        filterGenres += "))";
      }
    }
  }

  let filterAgeRatings = "";
  logger.log("[generateFilterQuery] filters.filterAgeRatings:", filters.filterAgeRatings);
  if (filters.filterAgeRatings && filters.filterAgeRatings.find((filter) => !filter.Selected)) {
    if (filters.filterAgeRatings.find((filter) => filter.Selected && filter.Age == -1)) {
      filterAgeRatings = `AND ((AR.Age IS NULL AND MOV.IMDB_MinAge IS NULL AND MOV.IMDB_MaxAge IS NULL) `;
    } else {
      filterAgeRatings = `AND (1=0 `;
    }

    if (filters.filterAgeRatings.find((filter) => filter.Selected && filter.Age >= 0)) {
      filterAgeRatings += `OR AR.Age IN (`;

      filterAgeRatings += filters.filterAgeRatings
        .filter((filter) => filter.Selected && filter.Age >= 0)
        .map((filter) => filter.Age)
        .reduce((prev, current) => {
          return prev + (prev ? ", " : "") + current;
        }, "");

      filterAgeRatings += ")";
    }

    filters.filterAgeRatings
      .filter((filter) => filter.Selected && filter.Age >= 0)
      .map((filter) => filter.Age)
      .forEach((age) => {
        filterAgeRatings += `
          OR (MOV.IMDB_id_AgeRating_Chosen_Country IS NULL AND MOV.IMDB_MinAge >= ${age} AND MOV.IMDB_MaxAge <= ${age})`;
      });

    filterAgeRatings += ")";
  }

  let filterRatings = "";
  logger.log("[generateFilterQuery] filters.filterRatings:", filters.filterRatings);
  if (filters.filterRatings && filters.filterRatings.find((filter) => !filter.Selected)) {
    if (filters.filterRatings.find((filter) => filter.Selected && !filter.Rating)) {
      filterRatings = "AND (MOV.Rating IS NULL OR MOV.Rating = 0 ";
    } else {
      filterRatings = "AND (0=1 ";
    }

    if (filters.filterRatings.find((filter) => filter.Selected && filter.Rating)) {
      filterRatings +=
        "OR MOV.Rating IN (" +
        filters.filterRatings
          .filter((filter) => filter.Selected && filter.Rating)
          .map((filter) => filter.Rating)
          .reduce((prev, current) => {
            return prev + (prev ? ", " : "") + current;
          }, "");

      filterRatings += ")";
    }

    filterRatings += ")";
  }

  let filterLists = "";
  if (filters.filterLists && filters.filterLists.find((filter) => !filter.Selected)) {
    if (filters.filterLists.find((filter) => filter.Selected && !filter.id_Lists)) {
      filterLists = `AND (MOV.id_Movies NOT IN (SELECT id_Movies FROM tbl_Lists_Movies) `;
    } else {
      filterLists = `AND (1=0 `;
    }

    if (filters.filterLists.find((filter) => filter.Selected && filter.id_Lists)) {
      filterLists += `OR MOV.id_Movies IN (SELECT id_Movies FROM tbl_Lists_Movies WHERE id_Lists IN (`;

      filterLists += filters.filterLists
        .filter((filter) => filter.Selected)
        .map((filter) => filter.id_Lists)
        .reduce((prev, current) => {
          return prev + (prev ? ", " : "") + current;
        }, "");

      filterLists += "))";
    }

    filterLists += ")";
  }

  let filterParentalAdvisory = "";
  if (filters.filterParentalAdvisory) {
    Object.keys(filters.filterParentalAdvisory).forEach((category) => {
      let filterPACategory = "";

      if (filters.filterParentalAdvisory[category] && filters.filterParentalAdvisory[category].find((filter) => !filter.Selected)) {
        if (filters.filterParentalAdvisory[category].find((filter) => filter.Selected && filter.Severity == -1)) {
          filterPACategory = `AND (MOV.IMDB_Parental_Advisory_${category} IS NULL `;
        } else {
          filterPACategory = `AND (1=0 `;
        }

        if (filters.filterParentalAdvisory[category].find((filter) => filter.Selected && filter.Severity >= 0)) {
          filterPACategory += `OR MOV.IMDB_Parental_Advisory_${category} IN (`;

          filterPACategory += filters.filterParentalAdvisory[category]
            .filter((filter) => filter.Selected)
            .map((filter) => filter.Severity)
            .reduce((prev, current) => {
              return prev + (prev ? ", " : "") + current;
            }, "");

          filterPACategory += ")";
        }

        filterPACategory += ")";
      }

      if (filterPACategory) {
        filterParentalAdvisory += `${filterPACategory}
        `;
      }
    });
  }

  let filterPersons = "";
  logger.log("[generateFilterQuery] filters.filterPersons:", filters.filterPersons);
  if (
    filters.filterPersons &&
    ((!filters.filterSettings.filterPersonsAND && filters.filterPersons.find((filter) => !filter.Selected)) ||
      (filters.filterSettings.filterPersonsAND && filters.filterPersons.find((filter) => filter.Selected && filter.IMDB_Person_ID)))
  ) {
    const filterPersonsList = filters.filterPersons.filter((filter) => filter.Selected && filter.IMDB_Person_ID).map((filter) => filter.IMDB_Person_ID);

    if (filters.filterSettings.filterPersonsAND) {
      // use INTERSECT for AND-filter
      // note: we don't have to take "any other person" into account
      filterPersons = "AND MOV.id_Movies IN (";

      filterPersons += filterPersonsList.reduce((prev, current) => {
        return prev + (prev ? " INTERSECT " : "") + `SELECT id_Movies FROM tbl_Movies_IMDB_Credits WHERE IMDB_Person_ID = ${sqlString.escape(current)}`;
      }, "");

      filterPersons += ")";
    } else {
      // OR-filter
      if (filters.filterPersons.find((filter) => filter.Selected && !filter.id_Filter_Persons)) {
        filterPersons = `AND (MOV.id_Movies NOT IN (SELECT id_Movies FROM tbl_Movies_IMDB_Credits WHERE IMDB_Person_ID IN (SELECT IMDB_Person_ID FROM tbl_Filter_Persons)) `;
      } else {
        filterPersons = `AND (1=0 `;
      }

      if (filters.filterPersons.find((filter) => filter.Selected && filter.id_Filter_Persons)) {
        filterPersons += `OR MOV.id_Movies IN (SELECT id_Movies FROM tbl_Movies_IMDB_Credits WHERE IMDB_Person_ID IN (`;

        filterPersons += filterPersonsList.reduce((prev, current) => {
          return prev + (prev ? ", " : "") + `${sqlString.escape(current)}`;
        }, "");

        filterPersons += "))";
      }

      filterPersons += ")";
    }
  }

  let filterCompanies = "";
  if (
    filters.filterCompanies &&
    ((!filters.filterSettings.filterCompaniesAND && filters.filterCompanies.find((filter) => !filter.Selected)) ||
      (filters.filterSettings.filterCompaniesAND && filters.filterCompanies.find((filter) => filter.Selected && filter.id_Filter_Companies)))
  ) {
    const filterCompaniesList = filters.filterCompanies.filter((filter) => filter.Selected && filter.id_Filter_Companies).map((filter) => filter.Company_Name);

    if (filters.filterSettings.filterCompaniesAND) {
      // use INTERSECT for AND-filter
      // note: we don't have to take "any other company" into account
      filterCompanies = "AND MOV.id_Movies IN (";

      filterCompanies += filterCompaniesList.reduce((prev, current) => {
        return prev + (prev ? " INTERSECT " : "") + `SELECT id_Movies FROM tbl_Movies_IMDB_Companies WHERE Company_Name = ${sqlString.escape(current)}`;
      }, "");

      filterCompanies += ")";
    } else {
      // OR-filter
      if (filters.filterCompanies.find((filter) => filter.Selected && !filter.id_Filter_Companies)) {
        filterCompanies = `AND (MOV.id_Movies NOT IN (SELECT id_Movies FROM tbl_Movies_IMDB_Companies WHERE Company_Name IN (SELECT Company_Name FROM tbl_Filter_Companies)) `;
      } else {
        filterCompanies = `AND (1=0 `;
      }

      if (filters.filterCompanies.find((filter) => filter.Selected && filter.id_Filter_Companies)) {
        filterCompanies += `OR MOV.id_Movies IN (SELECT id_Movies FROM tbl_Movies_IMDB_Companies WHERE Company_Name IN (`;

        filterCompanies += filterCompaniesList.reduce((prev, current) => {
          return prev + (prev ? ", " : "") + `${sqlString.escape(current)}`;
        }, "");

        filterCompanies += "))";
      }

      filterCompanies += ")";
    }
  }

  let filterIMDBPlotKeywords = "";
  if (
    filters.filterIMDBPlotKeywords &&
    ((!filters.filterSettings.filterIMDBPlotKeywordsAND && filters.filterIMDBPlotKeywords.find((filter) => !filter.Selected)) ||
      (filters.filterSettings.filterIMDBPlotKeywordsAND &&
        filters.filterIMDBPlotKeywords.find((filter) => filter.Selected && filter.id_Filter_IMDB_Plot_Keywords)))
  ) {
    const filterIMDBPlotKeywordsList = filters.filterIMDBPlotKeywords
      .filter((filter) => filter.Selected && filter.id_Filter_IMDB_Plot_Keywords)
      .map((filter) => filter.id_IMDB_Plot_Keywords);

    if (filters.filterSettings.filterIMDBPlotKeywordsAND) {
      // use INTERSECT for AND-filter
      // note: we don't have to take "any other plot keyword" into account
      filterIMDBPlotKeywords = "AND MOV.id_Movies IN (";

      filterIMDBPlotKeywords += filterIMDBPlotKeywordsList.reduce((prev, current) => {
        return prev + (prev ? " INTERSECT " : "") + `SELECT id_Movies FROM tbl_Movies_IMDB_Plot_Keywords WHERE id_IMDB_Plot_Keywords = ${current}`;
      }, "");

      filterIMDBPlotKeywords += ")";
    } else {
      // OR-filter
      if (filters.filterIMDBPlotKeywords.find((filter) => filter.Selected && !filter.id_Filter_IMDB_Plot_Keywords)) {
        filterIMDBPlotKeywords = `AND (MOV.id_Movies NOT IN (SELECT id_Movies FROM tbl_Movies_IMDB_Plot_Keywords WHERE id_IMDB_Plot_Keywords IN (SELECT id_IMDB_Plot_Keywords FROM tbl_Filter_IMDB_Plot_Keywords)) `;
      } else {
        filterIMDBPlotKeywords = `AND (1=0 `;
      }

      if (filters.filterIMDBPlotKeywords.find((filter) => filter.Selected && filter.id_Filter_IMDB_Plot_Keywords)) {
        filterIMDBPlotKeywords += `OR MOV.id_Movies IN (SELECT id_Movies FROM tbl_Movies_IMDB_Plot_Keywords WHERE id_IMDB_Plot_Keywords IN (`;

        filterIMDBPlotKeywords += filterIMDBPlotKeywordsList.reduce((prev, current) => {
          return prev + (prev ? ", " : "") + `${current}`;
        }, "");

        filterIMDBPlotKeywords += "))";
      }

      filterIMDBPlotKeywords += ")";
    }
  }

  let filterIMDBFilmingLocations = "";
  if (
    filters.filterIMDBFilmingLocations &&
    ((!filters.filterSettings.filterIMDBFilmingLocationsAND && filters.filterIMDBFilmingLocations.find((filter) => !filter.Selected)) ||
      (filters.filterSettings.filterIMDBFilmingLocationsAND &&
        filters.filterIMDBFilmingLocations.find((filter) => filter.Selected && filter.id_Filter_IMDB_Filming_Locations)))
  ) {
    const filterIMDBFilmingLocationsList = filters.filterIMDBFilmingLocations
      .filter((filter) => filter.Selected && filter.id_Filter_IMDB_Filming_Locations)
      .map((filter) => filter.id_IMDB_Filming_Locations);

    if (filters.filterSettings.filterIMDBFilmingLocationsAND) {
      // use INTERSECT for AND-filter
      // note: we don't have to take "any other filming location" into account
      filterIMDBFilmingLocations = "AND MOV.id_Movies IN (";

      filterIMDBFilmingLocations += filterIMDBFilmingLocationsList.reduce((prev, current) => {
        return prev + (prev ? " INTERSECT " : "") + `SELECT id_Movies FROM tbl_Movies_IMDB_Filming_Locations WHERE id_IMDB_Filming_Locations = ${current}`;
      }, "");

      filterIMDBFilmingLocations += ")";
    } else {
      // OR-filter
      if (filters.filterIMDBFilmingLocations.find((filter) => filter.Selected && !filter.id_Filter_IMDB_Filming_Locations)) {
        filterIMDBFilmingLocations = `AND (MOV.id_Movies NOT IN (SELECT id_Movies FROM tbl_Movies_IMDB_Filming_Locations WHERE id_IMDB_Filming_Locations IN (SELECT id_IMDB_Filming_Locations FROM tbl_Filter_IMDB_Filming_Locations)) `;
      } else {
        filterIMDBFilmingLocations = `AND (1=0 `;
      }

      if (filters.filterIMDBFilmingLocations.find((filter) => filter.Selected && filter.id_Filter_IMDB_Filming_Locations)) {
        filterIMDBFilmingLocations += `OR MOV.id_Movies IN (SELECT id_Movies FROM tbl_Movies_IMDB_Filming_Locations WHERE id_IMDB_Filming_Locations IN (`;

        filterIMDBFilmingLocations += filterIMDBFilmingLocationsList.reduce((prev, current) => {
          return prev + (prev ? ", " : "") + `${current}`;
        }, "");

        filterIMDBFilmingLocations += "))";
      }

      filterIMDBFilmingLocations += ")";
    }
  }

  let filterYears = "";
  logger.log("[generateFilterQuery] filters.filterYears:", filters.filterYears);
  if (filters.filterYears && filters.filterYears.find((filter) => !filter.Selected)) {
    if (filters.filterYears.find((filter) => filter.Selected && filter.startYear == -1)) {
      filterYears = `AND (MOV.startYear IS NULL `;
    } else {
      filterYears = `AND (1=0 `;
    }

    if (filters.filterYears.find((filter) => filter.Selected && filter.startYear >= 0)) {
      filterYears += `OR MOV.startYear IN (`;

      filterYears += filters.filterYears
        .filter((filter) => filter.Selected)
        .map((filter) => filter.startYear)
        .reduce((prev, current) => {
          return prev + (prev ? ", " : "") + current;
        }, "");

      filterYears += ")";
    }

    filterYears += ")";
  }

  let filterQualities = "";
  logger.log("[generateFilterQuery] filters.filterQualities:", filters.filterQualities);
  if (filters.filterQualities && filters.filterQualities.find((filter) => !filter.Selected)) {
    if (filters.filterQualities.find((filter) => filter.Selected && !filter.MI_Quality)) {
      filterQualities = `AND (MOV.MI_Quality IS NULL `;
    } else {
      filterQualities = `AND (1=0 `;
    }

    if (filters.filterQualities.find((filter) => filter.Selected && filter.MI_Quality)) {
      filterQualities += `OR MOV.MI_Quality IN (`;

      filterQualities += filters.filterQualities
        .filter((filter) => filter.Selected)
        .map((filter) => filter.MI_Quality)
        .reduce((prev, current) => {
          return prev + (prev ? ", " : "") + `${sqlString.escape(current)}`;
        }, "");

      filterQualities += ")";
    }

    filterQualities += ")";
  }

  let filterAudioLanguages = "";
  if (filters.filterAudioLanguages && filters.filterAudioLanguages.find((filter) => !filter.Selected)) {
    if (filters.filterAudioLanguages.find((filter) => filter.Selected && filter.Language == "<not available>")) {
      filterAudioLanguages = `AND (MOV.id_Movies NOT IN (SELECT id_Movies FROM tbl_Movies_Languages WHERE Type = 'audio') `;
    } else {
      filterAudioLanguages = `AND (1=0 `;
    }

    if (filters.filterAudioLanguages.find((filter) => filter.Selected && filter.Language !== "<not available>")) {
      filterAudioLanguages += `OR MOV.id_Movies IN (SELECT id_Movies FROM tbl_Movies_Languages WHERE Type = 'audio' AND Language IN (`;

      filterAudioLanguages += filters.filterAudioLanguages
        .filter((filter) => filter.Selected)
        .map((filter) => filter.Language)
        .reduce((prev, current) => {
          return prev + (prev ? ", " : "") + `${sqlString.escape(current)}`;
        }, "");

      filterAudioLanguages += "))";
    }

    filterAudioLanguages += ")";
  }

  let filterSubtitleLanguages = "";
  if (filters.filterSubtitleLanguages && filters.filterSubtitleLanguages.find((filter) => !filter.Selected)) {
    if (filters.filterSubtitleLanguages.find((filter) => filter.Selected && filter.Language == "<not available>")) {
      filterSubtitleLanguages = `AND (MOV.id_Movies NOT IN (SELECT id_Movies FROM tbl_Movies_Languages WHERE Type = 'subtitle') `;
    } else {
      filterSubtitleLanguages = `AND (1=0 `;
    }

    if (filters.filterSubtitleLanguages.find((filter) => filter.Selected && filter.Language !== "<not available>")) {
      filterSubtitleLanguages += `OR MOV.id_Movies IN (SELECT id_Movies FROM tbl_Movies_Languages WHERE Type = 'subtitle' AND Language IN (`;

      filterSubtitleLanguages += filters.filterSubtitleLanguages
        .filter((filter) => filter.Selected)
        .map((filter) => filter.Language)
        .reduce((prev, current) => {
          return prev + (prev ? ", " : "") + `${sqlString.escape(current)}`;
        }, "");

      filterSubtitleLanguages += "))";
    }

    filterSubtitleLanguages += ")";
  }

  let filterMetacriticScore = "";
  if (
    filters.filterMetacriticScore &&
    !(filters.filterMetacriticScore[0] == 0 && filters.filterMetacriticScore[1] == 100 && filters.filterMetacriticScoreNone == true)
  ) {
    if (!filters.filterMetacriticScoreNone) {
      filterMetacriticScore = "AND (MOV.IMDB_metacriticScore IS NOT NULL AND ";
    } else {
      filterMetacriticScore = "AND (MOV.IMDB_metacriticScore IS NULL OR ";
    }

    if (filters.filterMetacriticScore[0] > 0 || filters.filterMetacriticScore[1] < 100) {
      filterMetacriticScore += `(MOV.IMDB_metacriticScore >= ${filters.filterMetacriticScore[0]} AND MOV.IMDB_metacriticScore <= ${filters.filterMetacriticScore[1]})`;
    } else {
      filterMetacriticScore += "1 = 0";
    }

    filterMetacriticScore += ")";
  }

  let filterIMDBRating = "";
  if (filters.filterIMDBRating && !(filters.filterIMDBRating[0] == 0 && filters.filterIMDBRating[1] == 10 && filters.filterIMDBRatingNone == true)) {
    if (!filters.filterIMDBRatingNone) {
      filterIMDBRating = "AND (MOV.IMDB_rating IS NOT NULL AND ";
    } else {
      filterIMDBRating = "AND (MOV.IMDB_rating IS NULL OR ";
    }

    if (filters.filterIMDBRating[0] > 0 || filters.filterIMDBRating[1] < 10) {
      filterIMDBRating += `(MOV.IMDB_rating >= ${filters.filterIMDBRating[0]} AND MOV.IMDB_rating <= ${filters.filterIMDBRating[1]})`;
    } else {
      filterIMDBRating += "1 = 0";
    }

    filterIMDBRating += ")";
  }

  let filterReleaseAttributes = "";
  const releaseAttributesHierarchy = getReleaseAttributesHierarchy();

  if (
    filters.filterReleaseAttributes &&
    ((!filters.filterSettings.filterReleaseAttributesAND && filters.filterReleaseAttributes.find((filter) => !filter.Selected)) ||
      (filters.filterSettings.filterReleaseAttributesAND && filters.filterReleaseAttributes.find((filter) => filter.Selected && !filter.isAny)))
  ) {
    const filterReleaseAttributesList = filters.filterReleaseAttributes
      .filter((filter) => filter.Selected && !filter.isAny)
      .map((filter) => filter.ReleaseAttribute);

    if (filters.filterSettings.filterReleaseAttributesAND) {
      // use INTERSECT for AND-filter
      // note: we don't have to take "none provided" into account
      filterReleaseAttributes = "AND MOV.id_Movies IN (";

      filterReleaseAttributes += filterReleaseAttributesList.reduce((prev, current) => {
        return (
          prev +
          (prev ? " INTERSECT " : "") +
          `SELECT id_Movies FROM tbl_Movies_Release_Attributes WHERE deleted = 0 AND Release_Attributes_searchTerm IN (${releaseAttributesHierarchy
            .find((ra) => ra.displayAs === current)
            .searchTerms.reduce((prev2, current2) => {
              return prev2 + (prev2 ? ", " : "") + `${sqlString.escape(current2)}`;
            }, "")})`
        );
      }, "");

      filterReleaseAttributes += ")";
    } else {
      // OR-filter
      if (filters.filterReleaseAttributes.find((filter) => filter.Selected && filter.isAny)) {
        filterReleaseAttributes = `AND (MOV.id_Movies NOT IN (SELECT id_Movies FROM tbl_Movies_Release_Attributes WHERE deleted = 0) `;
      } else {
        filterReleaseAttributes = `AND (1=0 `;
      }

      if (filters.filterReleaseAttributes.find((filter) => filter.Selected && !filter.isAny)) {
        const searchTerms = [];

        releaseAttributesHierarchy.forEach((rah) => {
          if (filterReleaseAttributesList.find((ra) => ra === rah.displayAs)) {
            rah.searchTerms.forEach((searchTerm) => {
              searchTerms.push(searchTerm);
            });
          }
        });

        filterReleaseAttributes += `OR MOV.id_Movies IN (SELECT id_Movies FROM tbl_Movies_Release_Attributes WHERE deleted = 0 AND Release_Attributes_searchTerm IN (`;

        filterReleaseAttributes += searchTerms.reduce((prev, current) => {
          return prev + (prev ? ", " : "") + `${sqlString.escape(current)}`;
        }, "");

        filterReleaseAttributes += "))";
      }

      filterReleaseAttributes += ")";
    }
  }

  let filterDataQuality = "";
  logger.log("[generateFilterQuery] filters.filterDataQuality:", filters.filterDataQuality);

  const getFilterDataQualityQuery = function (filterDataQualityName) {
    switch (filterDataQualityName) {
      case "<noAnomalies>":
        return `SELECT id_Movies FROM tbl_Movies WHERE (
          IMDB_tconst IS NOT NULL
          AND scanErrors IS NULL
          AND Name2 IS NOT NULL
          AND IMDB_posterSmall_URL IS NOT NULL
          AND IMDB_plotSummary IS NOT NULL
        )`;
      case "missingIMDBLink":
        return `SELECT id_Movies FROM tbl_Movies WHERE IMDB_tconst IS NULL`;
      case "hasScanErrors":
        return `SELECT id_Movies FROM tbl_Movies WHERE scanErrors IS NOT NULL`;
      case "missingSecondaryTitle":
        return `SELECT id_Movies FROM tbl_Movies WHERE Name2 IS NULL`;
      case "missingPoster":
        return `SELECT id_Movies FROM tbl_Movies WHERE IMDB_posterSmall_URL IS NULL`;
      case "missingPlotSummary":
        return `SELECT id_Movies FROM tbl_Movies WHERE IMDB_plotSummary IS NULL`;
      default:
        throw new Error(`Unknown data quality filter "${filterDataQualityName}"`);
    }
  };

  if (
    (filters.filterDataQuality && !filters.filterSettings.filterDataQualityAND && filters.filterDataQuality.find((filter) => !filter.Selected)) ||
    (filters.filterSettings.filterDataQualityAND && filters.filterDataQuality.find((filter) => filter.Selected))
  ) {
    const filterDataQualityList = filters.filterDataQuality.filter((filter) => filter.Selected).map((filter) => filter.Name);

    if (filters.filterSettings.filterDataQualityAND) {
      // use INTERSECT for AND-filter
      filterDataQuality = "AND MOV.id_Movies IN (";

      filterDataQuality += filterDataQualityList.reduce((prev, current) => {
        return prev + (prev ? " INTERSECT " : "") + getFilterDataQualityQuery(current);
      }, "");

      filterDataQuality += ")";
    } else {
      // use UNION for OR-filter
      filterDataQuality += `AND MOV.id_Movies IN (`;

      filterDataQuality += filterDataQualityList.reduce((prev, current) => {
        return prev + (prev ? " UNION " : "") + getFilterDataQualityQuery(current);
      }, "");

      filterDataQuality += ")";
    }
  }

  let filterVideoEncoders = "";
  if (filters.filterVideoEncoders && filters.filterVideoEncoders.find((filter) => !filter.Selected)) {
    filterVideoEncoders = `AND MOV.id_Movies IN (SELECT id_Movies FROM tbl_Movies_MI_Tracks MITVIDEO WHERE MITVIDEO.type = "video" `;

    if (filters.filterVideoEncoders.find((filter) => filter.Selected && filter.Name.match(/^<.*?>$/))) {
      filterVideoEncoders += `AND ((MITVIDEO.Encoded_Library_Name_Trimmed IS NULL) `;
    } else {
      filterVideoEncoders += `AND (1=0 `;
    }

    if (filters.filterVideoEncoders.find((filter) => filter.Selected && !filter.Name.match(/^<.*?>$/))) {
      filterVideoEncoders += `OR MITVIDEO.Encoded_Library_Name_Trimmed IN (`;

      filterVideoEncoders += filters.filterVideoEncoders
        .filter((filter) => filter.Selected && !filter.Name.match(/^<.*?>$/))
        .map((filter) => filter.Name)
        .reduce((prev, current) => {
          return prev + (prev ? ", " : "") + `"${current}"`;
        }, "");

      filterVideoEncoders += ")";
    }

    filterVideoEncoders += "))";
  }

  let filterAudioFormats = "";
  if (filters.filterAudioFormats && filters.filterAudioFormats.find((filter) => !filter.Selected)) {
    filterAudioFormats = `AND MOV.id_Movies IN (SELECT id_Movies FROM tbl_Movies_MI_Tracks MITAUDIO WHERE MITAUDIO.type = "audio" `;

    if (filters.filterAudioFormats.find((filter) => filter.Selected && filter.Name.match(/^<.*?>$/))) {
      filterAudioFormats += `AND ((MITAUDIO.Format IS NULL) `;
    } else {
      filterAudioFormats += `AND (1=0 `;
    }

    if (filters.filterAudioFormats.find((filter) => filter.Selected && !filter.Name.match(/^<.*?>$/))) {
      filterAudioFormats += `OR MITAUDIO.Format IN (`;

      filterAudioFormats += filters.filterAudioFormats
        .filter((filter) => filter.Selected && !filter.Name.match(/^<.*?>$/))
        .map((filter) => filter.Name)
        .reduce((prev, current) => {
          return prev + (prev ? ", " : "") + `"${current}"`;
        }, "");

      filterAudioFormats += ")";
    }

    filterAudioFormats += "))";
  }

  let filter_id_Movies = "";
  if (arr_id_Movies && arr_id_Movies.length) {
    filter_id_Movies = "AND MOV.id_Movies IN (";
    filter_id_Movies += arr_id_Movies.reduce((prev, current) => prev + (prev ? ", " : "") + `${current}`);
    filter_id_Movies += ")";
  }

  let filter_IMDB_tconst = "";
  if (arr_IMDB_tconst && arr_IMDB_tconst.length) {
    filter_IMDB_tconst = "AND MOV.IMDB_tconst IN (";
    filter_IMDB_tconst += arr_IMDB_tconst.reduce((prev, current) => {
      return prev + (prev ? ", " : "") + `"${current}"`;
    }, "");
    filter_IMDB_tconst += ")";
  }

  /*
  logger.log("[generateFilterQuery] filterSourcePaths:", filterSourcePaths);
  logger.log("[generateFilterQuery] filterGenres:", filterGenres);
  logger.log("[generateFilterQuery] filterAgeRatings:", filterAgeRatings);
  logger.log("[generateFilterQuery] filterRatings:", filterRatings);
  logger.log("[generateFilterQuery] filterLists:", filterLists);
  logger.log("[generateFilterQuery] filterParentalAdvisory:", filterParentalAdvisory);
  logger.log("[generateFilterQuery] filterPersons:", filterPersons);
  logger.log("[generateFilterQuery] filterCompanies:", filterCompanies);
  logger.log("[generateFilterQuery] filterIMDBPlotKeywords:", filterIMDBPlotKeywords);
  logger.log("[generateFilterQuery] filterIMDBPlotKeywords:", filterIMDBFilmingLocations);
  logger.log("[generateFilterQuery] filterAudioLanguages:", filterAudioLanguages);
  logger.log("[generateFilterQuery] filterReleaseAttributes:", filterReleaseAttributes);
  logger.log("[generateFilterQuery] filterDataQuality:", filterDataQuality);
  logger.log("[generateFilterQuery] filter_id_Movies:", filter_id_Movies);
  */

  return `
  ${filterSourcePaths}
  ${filterGenres}
  ${filterAgeRatings}
  ${filterRatings}
  ${filterLists}
  ${filterParentalAdvisory}
  ${filterPersons}
  ${filterQualities}
  ${filterCompanies}
  ${filterIMDBPlotKeywords}
  ${filterIMDBFilmingLocations}
  ${filterYears}
  ${filterAudioLanguages}
  ${filterSubtitleLanguages}
  ${filterMetacriticScore}
  ${filterIMDBRating}
  ${filterReleaseAttributes}
  ${filterDataQuality}
  ${filterVideoEncoders}
  ${filterAudioFormats}
  ${filter_id_Movies}
  ${filter_IMDB_tconst}
`;
}

async function fetchMedia($MediaType, arr_id_Movies, minimumResultSet, $t, filters, arr_IMDB_tconst) {
  logger.log("[fetchMedia] filters:", filters);

  const filterQuery = generateFilterQuery(filters, arr_id_Movies, arr_IMDB_tconst);

  try {
    logger.log("[fetchMedia] shared.languagesAudioSubtitles:", shared.languagesAudioSubtitles);

    const query = /*sql*/ `
		SELECT
			MOV.id_Movies
			, MOV.Name
      , MOV.Name2
			-- #rip-rating-demographics, MOV.IMDB_rating${shared.imdbRatingDemographic ? "_" + shared.imdbRatingDemographic : ""} AS IMDB_rating_default
      , MOV.IMDB_rating AS IMDB_rating_default
			, MOV.IMDB_metacriticScore
			, IFNULL(MOV.Rating, 0) AS Rating
			, MOV.startYear
			, MOV.created_at
			, MOV.last_access_at
      -- #rip-rating-demographics, MOV.IMDB_numVotes${shared.imdbRatingDemographic ? "_" + shared.imdbRatingDemographic : ""} AS IMDB_numVotes_default
      , MOV.IMDB_numVotes AS IMDB_numVotes_default
      , IFNULL(MOV.plotSummary, IFNULL(MOV.IMDB_plotSummary_Translated, MOV.IMDB_plotSummary)) AS plotSummary
      , MOV.RelativePath
      , MOV.RelativeDirectory
      , MI_Done
      , MI_Duration_Formatted
      , MI_Duration_Seconds
      , IMDB_runtimeMinutes
      , AR.Age
      , MOV.IMDB_MinAge
      , MOV.IMDB_MaxAge
      , MOV.isDirectoryBased
      , SP.Path AS SourcePath
      , MOV.IMDB_tconst
      , SP.id_SourcePaths
      , MOV.IMDB_Trailer_URL

      ${
        minimumResultSet
          ? /*sql*/ `
        , 0 AS isCompletelyFetched
        , NULL AS Filename
        , NULL AS Size
        , NULL AS file_created_at
        , NULL AS endYear
        , NULL AS MI_Duration
        , NULL AS MI_Quality
        , NULL AS Audio_Languages
        , NULL AS Subtitle_Languages
        , NULL AS MI_Audio_Languages
        , NULL AS MI_Subtitle_Languages
        , NULL AS IMDB_posterSmall_URL
        , NULL AS IMDB_posterLarge_URL
        , IFNULL(MOV.plotSummaryFull, IFNULL(MOV.IMDB_plotSummaryFull_Translated, MOV.IMDB_plotSummaryFull)) AS plotSummaryFull
        , NULL AS Genres
        , NULL AS IMDB_Parental_Advisory_Nudity
        , NULL AS IMDB_Parental_Advisory_Violence
        , NULL AS IMDB_Parental_Advisory_Profanity
        , NULL AS IMDB_Parental_Advisory_Alcohol
        , NULL AS IMDB_Parental_Advisory_Frightening
        , NULL AS IMDB_Top_Directors
        , NULL AS IMDB_Top_Writers
        , NULL AS IMDB_Top_Producers
        , NULL AS IMDB_Top_Cast
        , NULL AS IMDB_Top_Production_Companies
        , NULL AS NumExtras
        , NULL AS scanErrors
        , NULL AS ReleaseAttributesSearchTerms
        , NULL AS Video_Encoder
        , NULL AS Audio_Format
      `
          : /*sql*/ `
        , 1 AS isCompletelyFetched
        , MOV.Filename
        , MOV.Size
        , MOV.file_created_at
        , MOV.endYear
        , MOV.MI_Duration
        , MOV.MI_Quality
        , (SELECT GROUP_CONCAT(Language, ', ') FROM tbl_Movies_Languages ML WHERE ML.id_Movies = MOV.id_Movies AND ML.Type = 'audio') AS Audio_Languages
        , (SELECT GROUP_CONCAT(Language, ', ') FROM tbl_Movies_Languages ML WHERE ML.id_Movies = MOV.id_Movies AND ML.Type = 'subtitle') AS Subtitle_Languages
        , MOV.MI_Audio_Languages
        , MOV.MI_Subtitle_Languages
        , MOV.IMDB_posterSmall_URL
        , MOV.IMDB_posterLarge_URL
        , IFNULL(MOV.plotSummaryFull, IFNULL(MOV.IMDB_plotSummaryFull_Translated, MOV.IMDB_plotSummaryFull)) AS plotSummaryFull
        , (SELECT GROUP_CONCAT(GQ.Name, ', ') FROM
            (
              SELECT DISTINCT
                G.Name
              FROM tbl_Movies_Genres MG
              INNER JOIN tbl_Genres G ON MG.id_Genres = G.id_Genres AND MG.id_Movies = MOV.id_Movies                
            ) AS GQ
        ) AS Genres
        , MOV.IMDB_Parental_Advisory_Nudity
        , MOV.IMDB_Parental_Advisory_Violence
        , MOV.IMDB_Parental_Advisory_Profanity
        , MOV.IMDB_Parental_Advisory_Alcohol
        , MOV.IMDB_Parental_Advisory_Frightening
        , MOV.IMDB_Top_Directors
        , MOV.IMDB_Top_Writers
        , MOV.IMDB_Top_Producers
        , MOV.IMDB_Top_Cast
        , MOV.IMDB_Top_Production_Companies
        , (SELECT COUNT(1) FROM tbl_Movies MOVEXTRAS WHERE MOVEXTRAS.Extra_id_Movies_Owner = MOV.id_Movies) AS NumExtras
        , MOV.scanErrors
        , (SELECT GROUP_CONCAT(MRA.Release_Attributes_searchTerm, ';') FROM tbl_Movies_Release_Attributes MRA WHERE MRA.id_Movies = MOV.id_Movies AND MRA.deleted = 0) AS ReleaseAttributesSearchTerms
        , (SELECT GROUP_CONCAT(Encoded_Library_Name_Trimmed, ';') FROM tbl_Movies_MI_Tracks MITVIDEO WHERE MITVIDEO.type = "video" AND MITVIDEO.id_Movies = MOV.id_Movies ORDER BY "Default" DESC) AS Video_Encoder
        , (SELECT GROUP_CONCAT(Format, ';') FROM tbl_Movies_MI_Tracks MITAUDIO WHERE MITAUDIO.type = "audio" AND MITAUDIO.id_Movies = MOV.id_Movies ORDER BY "Default" DESC) AS Audio_Format
      `
      }
    FROM tbl_Movies MOV
    INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths
		LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
		WHERE	(MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
					AND MOV.id_SourcePaths IN (SELECT id_SourcePaths FROM tbl_SourcePaths WHERE MediaType = $MediaType)
		${filterQuery}
	`;

    logger.log("[fetchMedia] query:", query);

    const result = await db.fireProcedureReturnAll(query, { $MediaType });

    result.forEach((movie) => {
      ensureMovieFullPath(movie);
    });

    if (result && result.length > 0) {
      saveFilterValues($MediaType);
      saveSortValues($MediaType);
    }

    result.forEach((item) => {
      // logger.log("[fetchMedia] item.Name:", item.Name);
      item.IMDB_posterSmall_URL = item.IMDB_posterSmall_URL
        ? "local-resource://" + helpers.getDataPath(item.IMDB_posterSmall_URL).replace(/\\/g, "\\\\")
        : item.IMDB_posterSmall_URL;
      item.IMDB_posterLarge_URL = item.IMDB_posterLarge_URL
        ? "local-resource://" + helpers.getDataPath(item.IMDB_posterLarge_URL).replace(/\\/g, "\\\\")
        : item.IMDB_posterLarge_URL;
      item.yearDisplay = item.startYear ? "(" + item.startYear + (item.endYear ? `-${item.endYear}` : "") + ")" : "";
      item.IMDB_rating_defaultFormatted = item.IMDB_rating_default
        ? `${item.IMDB_rating_default.toLocaleString(shared.uiLanguage, {
            minimumFractionDigits: 1,
          })}`
        : "";
      item.IMDB_rating_defaultDisplay = item.IMDB_rating_defaultFormatted
        ? `${item.IMDB_rating_defaultFormatted} (${item.IMDB_numVotes_default.toLocaleString(shared.uiLanguage)})`
        : "";

      item.AudioLanguages = generateLanguageArray(item.Audio_Languages);

      item.SubtitleLanguages = generateLanguageArray(item.Subtitle_Languages);

      if (item.Age || item.Age === 0) {
        item.AgeRating = item.Age + "+";
      } else {
        if (item.IMDB_MinAge || item.IMDB_MinAge === 0) {
          item.AgeRating = `${item.IMDB_MinAge}${item.IMDB_MaxAge && item.IMDB_MaxAge > item.IMDB_MinAge ? "-" + item.IMDB_MaxAge : ""}+`;
        }
      }

      // only show secondary title if it is not part of the primary title or the primary title
      if (item.Name2) {
        if (item.Name.includes(item.Name2)) {
          item.Name2 = "";
        }
      }

      item.SearchSpace =
        (item.Name || "").toLowerCase() +
        " " +
        (item.Name2 || "").toLowerCase() +
        " " +
        (item.IMDB_plotSummary || "").toLowerCase() +
        " " +
        (item.fullPath || "").toLowerCase() +
        " " +
        (item.IMDB_tconst || "").toLowerCase();

      item.IMDB_Top_Directors = item.IMDB_Top_Directors ? JSON.parse(item.IMDB_Top_Directors) : null;
      item.IMDB_Top_Writers = item.IMDB_Top_Writers ? JSON.parse(item.IMDB_Top_Writers) : null;
      item.IMDB_Top_Producers = item.IMDB_Top_Producers ? JSON.parse(item.IMDB_Top_Producers) : null;
      item.IMDB_Top_Cast = item.IMDB_Top_Cast ? JSON.parse(item.IMDB_Top_Cast) : null;
      item.IMDB_Top_Production_Companies = item.IMDB_Top_Production_Companies ? JSON.parse(item.IMDB_Top_Production_Companies) : null;

      if (item.MI_Duration_Formatted) {
        item.Duration = item.MI_Duration_Formatted;
      } else if (item.IMDB_runtimeMinutes) {
        item.Duration = helpers.getTimeString(item.IMDB_runtimeMinutes * 60);
      }

      // translate Genres
      if (item.Genres) {
        const genres = [];
        item.Genres.split(", ").forEach((genre) => {
          genres.push({
            name: genre,
            translated: $t(`GenreNames.${genre}`),
          });
        });

        item.Genres = genres;
      }

      if (item.scanErrors) {
        item.scanErrors = JSON.parse(item.scanErrors);
      }

      if (item.ReleaseAttributesSearchTerms) {
        item.ReleaseAttributes = getReleaseAttributes(item.ReleaseAttributesSearchTerms);
      } else {
        item.ReleaseAttributes = null;
      }

      if (item.Video_Encoder) {
        item.Video_Encoder_Display = item.Video_Encoder.split(";").map((ve) => {
          return ve.split(" ")[0].trim();
        });
      } else {
        item.Video_Encoder_Display = null;
      }

      if (item.Audio_Format) {
        item.Audio_Format_Display = item.Audio_Format.split(";").map((af) => {
          return af.trim();
        });
        item.Audio_Format_Display = item.Audio_Format_Display.filter((value, index) => {
          return item.Audio_Format_Display.indexOf(value) === index;
        });
      } else {
        item.Audio_Format_Display = null;
      }

      // additional fields (prevent Recalculation of Pagination Items on mouseover)
      item.lists = [];
      item.extras = [];
      item.extrasFetched = false;
      item.selected = false;
      item.lastAccessMoment = null;

      item.showCredits = false;
      item.credits = null;
      item.showCompanies = false;
      item.companies = null;
      item.avatarHovered = false;
      item.nameHovered = false;
      item.name2Hovered = false;
      item.showContentAdvisory = false;
      item.showPlotKeywords = false;
      item.showFilmingLocations = false;
      item.plotKeywords = null;
      item.showScanErrors = false;
    });

    return result;
  } catch (err) {
    logger.error(err);
    return;
  }
}

function generateLanguageArray(languages, maxLangDisplay) {
  if (!languages) {
    return null;
  }

  const preferredLanguages = getPreferredLanguages();

  maxLangDisplay = maxLangDisplay ? maxLangDisplay : 2;

  const languagesSplit = languages.split(",");
  const preferredLanguagesJoinLower = preferredLanguages.join(", ").toLowerCase();

  const languagesFiltered = [];
  languagesSplit.forEach((lang) => {
    lang = lang.trim();
    if (!languagesFiltered.find((l) => lang === l)) {
      languagesFiltered.push(lang);
    }
  });

  let result = [];

  preferredLanguages.forEach((lang) => {
    lang = lang.trim();
    if (languages.toLowerCase().includes(lang.toLowerCase())) {
      if (result.length < maxLangDisplay) {
        result.push(lang.toUpperCase());
      }
    }
  });

  let lastOvershotLanguage = null;
  languagesFiltered.forEach((lang) => {
    lang = lang.trim();
    const langTrimLower = lang.trim().toLowerCase();
    if (!preferredLanguagesJoinLower.includes(langTrimLower)) {
      if (result.length < maxLangDisplay) {
        result.push(langTrimLower.toUpperCase());
      } else {
        lastOvershotLanguage = langTrimLower.toUpperCase();
      }
    }
  });

  if (languages && result.length < languagesFiltered.length) {
    // logger.log('[generateLanguageArray] overshot languagesFiltered:', languagesFiltered);

    if (languagesFiltered.length - result.length < 2) {
      result.push(lastOvershotLanguage);
    } else {
      result.push("+" + (languagesFiltered.length - result.length));
    }

    // logger.log('[generateLanguageArray] result:', result);
  }

  if (!result) {
    result = languages;
  }

  return result;
}

async function clearRating($id_Movies, isHandlingDuplicates) {
  await db.fireProcedure(`UPDATE tbl_Movies SET Rating = NULL WHERE id_Movies = $id_Movies`, { $id_Movies });

  if (!isHandlingDuplicates) {
    const duplicates = await getMovieDuplicates(
      $id_Movies,
      shared.duplicatesHandling.actualDuplicate.updateRating,
      shared.duplicatesHandling.metaDuplicate.updateRating
    );

    for (let i = 0; i < duplicates.length; i++) {
      await clearRating(duplicates[i], true);
    }

    return duplicates.concat([$id_Movies]);
  }
}

async function setRating($id_Movies, $Rating, isHandlingDuplicates) {
  logger.log("[setRating] id_Movies:", $id_Movies, "Rating:", $Rating);
  try {
    await db.fireProcedure(`UPDATE tbl_Movies SET Rating = $Rating WHERE id_Movies = $id_Movies`, { $id_Movies, $Rating });

    if (!isHandlingDuplicates) {
      const duplicates = await getMovieDuplicates(
        $id_Movies,
        shared.duplicatesHandling.actualDuplicate.updateRating,
        shared.duplicatesHandling.metaDuplicate.updateRating
      );

      for (let i = 0; i < duplicates.length; i++) {
        await setRating(duplicates[i], $Rating, true);
      }

      return duplicates.concat([$id_Movies]);
    }

    return true;
  } catch (err) {
    return false;
  }
}

async function getSetting($Key) {
  try {
    return await db.fireProcedureReturnScalar(`SELECT Value FROM tbl_Settings WHERE Key = $Key`, { $Key });
  } catch (err) {
    logger.error(err);
    return null;
  }
}

async function setSetting($Key, $Value) {
  try {
    await db.fireProcedure(
      `INSERT INTO tbl_Settings (Key, Value) VALUES ($Key, $Value)
        ON CONFLICT(Key)
        DO UPDATE SET
          Value = excluded.Value
        `,
      { $Value, $Key }
    );
    return true;
  } catch (err) {
    logger.error(err);
    return false;
  }
}

async function launchMovie(movie) {
  const MediaplayerPath = await getSetting("MediaplayerPath");

  if (!MediaplayerPath) {
    eventBus.showSnackbar("error", {
      translateMe: {
        text: "Unable to launch: Mediaplayer Path is not set_ Please go to Settings and provide one_",
      },
    });
  }

  const fileExists = await existsAsync(movie.fullPath);

  if (!fileExists) {
    eventBus.showSnackbar("error", {
      translateMe: {
        text: "Cannot access {path}",
        payload: {
          path: movie.fullPath,
        },
      },
    });
    return;
  }

  const task = `"${MediaplayerPath}" "${movie.fullPath}"`;
  logger.log("[launchMovie] launching START task:", task);
  await execAsync(task);
  logger.log("[launchMovie] launching END task:", task);
}

async function fetchFilterValues($MediaType, loadFilterValuesFromStorage) {
  if (loadFilterValuesFromStorage) {
    const result = await getSetting(`filtersMediaType_${$MediaType}`);
    if (!result) {
      return null;
    }

    return JSON.parse(result);
  }

  return shared.filters;
}

async function fetchSortValues($MediaType) {
  logger.log("[fetchSortValues] START");

  const result = await getSetting(`sortMediaType${$MediaType}`);
  if (!result) {
    return null;
  }

  shared.sortField = JSON.parse(result).sortField;

  logger.log("[fetchSortValues] shared.sortField:", shared.sortField);

  return JSON.parse(result);
}

async function fetchFilterDataQuality($MediaType, loadFilterValuesFromStorage) {
  logger.log("[fetchFilterDataQuality] MediaType:", $MediaType);
  shared.loadingFilter = "filterDataQuality";

  const filterValues = await fetchFilterValues($MediaType, loadFilterValuesFromStorage);

  logger.log("[fetchFilterDataQuality] filterValues:", filterValues);

  let currentFilters = JSON.parse(JSON.stringify(shared.filters));
  if (!shared.filters.filterSettings.filterDataQualityAND) {
    delete currentFilters.filterDataQuality;
  }
  const additionalFilterQuery = generateFilterQuery(currentFilters);

  const results = await db.fireProcedureReturnAll(
    /*sql*/ `
      SELECT
        1 AS Selected
        , '<noAnomalies>' AS Name
        , '<no Anomalies>' AS DisplayText
        , (
            SELECT COUNT(1)
            FROM tbl_Movies MOV
            INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND MediaType = $MediaType
            LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
            WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
                  AND MOV.Extra_id_Movies_Owner IS NULL
                  AND (
                    MOV.IMDB_tconst IS NOT NULL
                    AND MOV.scanErrors IS NULL
                    AND MOV.Name2 IS NOT NULL
                    AND MOV.IMDB_posterSmall_URL IS NOT NULL
                    AND MOV.IMDB_plotSummary IS NOT NULL
                  )
                  ${additionalFilterQuery}
      ) AS NumMovies
      UNION ALL
      SELECT
        1 AS Selected
        , 'missingIMDBLink' AS Name
        , 'missing IMDB Link' AS DisplayText
        , (
            SELECT COUNT(1) FROM tbl_Movies MOV
            INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND MediaType = $MediaType
            LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
            WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
                  AND MOV.Extra_id_Movies_Owner IS NULL
                  AND MOV.IMDB_tconst IS NULL
                  ${additionalFilterQuery}
            ) AS NumMovies
      UNION ALL
      SELECT 1 AS Selected
      , 'hasScanErrors' AS Name
      , 'has Scan Errors' AS DisplayText
      , (
          SELECT COUNT(1) FROM tbl_Movies MOV
          INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND MediaType = $MediaType
          LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
          WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
                AND MOV.Extra_id_Movies_Owner IS NULL
                AND MOV.scanErrors IS NOT NULL
                ${additionalFilterQuery}
      ) AS NumMovies
      UNION ALL
      SELECT 1 AS Selected
      , 'missingSecondaryTitle' AS Name
      , 'missing Secondary Title' AS DisplayText
      , (
          SELECT COUNT(1) FROM tbl_Movies MOV
          INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND MediaType = $MediaType
          LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
          WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
                AND MOV.Extra_id_Movies_Owner IS NULL
                AND MOV.Name2 IS NULL
                ${additionalFilterQuery}
      ) AS NumMovies
      UNION ALL
      SELECT 1 AS Selected
      , 'missingPoster' AS Name
      , 'missing Poster' AS DisplayText
      , (
          SELECT COUNT(1) FROM tbl_Movies MOV
          INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND MediaType = $MediaType
          LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
          WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
                AND MOV.Extra_id_Movies_Owner IS NULL
                AND MOV.IMDB_posterSmall_URL IS NULL
                ${additionalFilterQuery}
      ) AS NumMovies
      UNION ALL
      SELECT 1 AS Selected
      , 'missingPlotSummary' AS Name
      , 'missing Plot Summary' AS DisplayText
      , (
          SELECT COUNT(1) FROM tbl_Movies MOV
          INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND MediaType = $MediaType
          LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
          WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
                AND MOV.Extra_id_Movies_Owner IS NULL
                AND MOV.IMDB_plotSummary IS NULL
                ${additionalFilterQuery}
      ) AS NumMovies
    `,
    { $MediaType }
  );

  if (filterValues && filterValues.filterDataQuality) {
    results.forEach((result) => {
      const filterValue = filterValues.filterDataQuality.find((value) => value.Name === result.Name);

      if (filterValue) {
        result.Selected = filterValue.Selected;
      }

      result.NumMoviesFormatted = result.NumMovies.toLocaleString(shared.uiLanguage);
    });
  }

  logger.log("[fetchFilterDataQuality] fetchFilterDataQuality result:", results);

  shared.filters.filterDataQuality = results;
  shared.loadingFilter = "";
}

async function fetchFilterSourcePaths($MediaType) {
  logger.log("[fetchFilterSourcePaths] MediaType:", $MediaType);
  shared.loadingFilter = "filterSourcePaths";

  const filterValues = await fetchFilterValues($MediaType);

  logger.log("[fetchFilterSourcePaths] filterValues:", filterValues);

  let currentFilters = JSON.parse(JSON.stringify(shared.filters));
  delete currentFilters.filterSourcePaths;
  const additionalFilterQuery = generateFilterQuery(currentFilters);

  const results = await db.fireProcedureReturnAll(
    `
			SELECT DISTINCT
			1 AS Selected
			, SP.Description
			, (
        SELECT COUNT(1)
        FROM tbl_Movies MOV
        LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
        WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
              AND MOV.Extra_id_Movies_Owner IS NULL
              AND id_SourcePaths IN (SELECT id_SourcePaths FROM tbl_SourcePaths SP2 WHERE SP2.Description = SP.Description)
              ${additionalFilterQuery}
        ) AS NumMovies
		FROM tbl_SourcePaths SP WHERE MediaType = $MediaType`,
    { $MediaType }
  );

  if (filterValues && filterValues.filterSourcePaths) {
    results.forEach((result) => {
      const filterValue = filterValues.filterSourcePaths.find((value) => value.Description === result.Description);

      if (filterValue) {
        result.Selected = filterValue.Selected;
      }

      result.NumMoviesFormatted = result.NumMovies.toLocaleString(shared.uiLanguage);
    });
  }

  logger.log("[fetchFilterSourcePaths] result:", results);

  shared.filters.filterSourcePaths = results;
  shared.loadingFilter = "";
}

async function fetchFilterGenres($MediaType, $t) {
  logger.log("[fetchFilterGenres] MediaType:", $MediaType);
  shared.loadingFilter = "filterGenres";

  const filterValues = await fetchFilterValues($MediaType);

  logger.log("[fetchFilterGenres] filterValues:", filterValues);

  let currentFilters = JSON.parse(JSON.stringify(shared.filters));
  if (!shared.filters.filterGenresAND) {
    delete currentFilters.filterSettings.filterGenres;
  }
  const additionalFilterQuery = generateFilterQuery(currentFilters);

  const results = await db.fireProcedureReturnAll(
    `
			SELECT
			id_Genres
			, GenreID
			, Name
			, 1 AS Selected
      , 0 AS Excluded
			, (
				SELECT COUNT(1)
				FROM tbl_Movies_Genres MG
				INNER JOIN tbl_Movies MOV ON MG.id_Movies = MOV.id_Movies AND (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
				INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
        LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
				WHERE MG.id_Genres = G.id_Genres
              ${additionalFilterQuery}
			) AS NumMovies
		FROM tbl_Genres G
		ORDER BY Name`,
    { $MediaType }
  );

  const resultsFiltered = results; // results.filter((result) => result.NumMovies > 0); // we should not filter out, because "AND" can quickly result in an empty set

  if (filterValues && filterValues.filterGenres) {
    resultsFiltered.forEach((result) => {
      const filterValue = filterValues.filterGenres.find((value) => value.GenreID === result.GenreID);

      if (filterValue) {
        result.Selected = filterValue.Selected;
        result.Excluded = !!filterValue.Excluded;
      }
    });
  }

  // Format and Translate
  resultsFiltered.forEach((result) => {
    result.NumMoviesFormatted = result.NumMovies.toLocaleString(shared.uiLanguage);

    const genreNameTranslated = $t(`GenreNames.${result.Name}`);

    if (genreNameTranslated && !genreNameTranslated.includes(".")) {
      result.Name = genreNameTranslated;
    }
  });

  logger.log("[fetchFilterGenres] filterValues:", filterValues);
  logger.log("[fetchFilterGenres] resultsFiltered:", resultsFiltered);

  shared.filters.filterGenres = resultsFiltered.sort((a, b) => helpers.compare(a.Name, b.Name, false));
  shared.loadingFilter = "";
}

async function fetchFilterAgeRatings($MediaType) {
  logger.log("[fetchFilterAgeRatings] MediaType:", $MediaType);
  shared.loadingFilter = "filterAgeRatings";

  const filterValues = await fetchFilterValues($MediaType);

  logger.log("[fetchFilterAgeRatings] filterValues:", filterValues);

  let currentFilters = JSON.parse(JSON.stringify(shared.filters));
  delete currentFilters.filterAgeRatings;
  const additionalFilterQuery = generateFilterQuery(currentFilters);

  const results = await db.fireProcedureReturnAll(
    `
		SELECT
			-1 AS Age
			, (
        SELECT COUNT(1)
        FROM tbl_Movies MOV
        INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND MediaType = $MediaType
        LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
        WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
              AND MOV.Extra_id_Movies_Owner IS NULL
              AND 
              (
                  MOV.IMDB_id_AgeRating_Chosen_Country IS NULL
                  AND MOV.IMDB_MinAge IS NULL
                  AND MOV.IMDB_MaxAge IS NULL
              )
              ${additionalFilterQuery}
        ) AS NumMovies
			, 1 AS Selected
		UNION
    SELECT
      Ages.Age
      , (
          SELECT COUNT(1)
          FROM tbl_Movies MOV
          INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND MediaType = $MediaType
          LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating AND AR.Age IS NOT NULL
          WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
                AND (
                      AR.Age = Ages.Age
                      OR (
                            MOV.IMDB_id_AgeRating_Chosen_Country IS NULL
                            AND MOV.IMDB_MinAge >= Ages.Age
                            AND MOV.IMDB_MaxAge <= Ages.Age
                      )
                    AND MOV.Extra_id_Movies_Owner IS NULL
                )
                ${additionalFilterQuery}
        ) AS NumMovies
      , 1 AS Selected
    FROM
    (SELECT DISTINCT Age FROM (
      SELECT AR.Age FROM tbl_AgeRating AR WHERE AR.Age IS NOT NULL
      UNION
      SELECT IMDB_MinAge FROM tbl_Movies MOV WHERE MOV.IMDB_MinAge IS NOT NULL
      UNION
      SELECT IMDB_MaxAge FROM tbl_Movies MOV WHERE MOV.IMDB_MinAge IS NOT NULL
    )) Ages
    WHERE NumMovies > 0
    `,
    { $MediaType }
  );

  const resultsFiltered = results; // results.filter((result) => result.NumMovies > 0);  // we should not filter out, because "AND" can quickly result in an empty set

  if (filterValues && filterValues.filterAgeRatings) {
    resultsFiltered.forEach((result) => {
      const filterValue = filterValues.filterAgeRatings.find((value) => value.Age === result.Age);

      if (filterValue) {
        result.Selected = filterValue.Selected;
      }

      result.NumMoviesFormatted = result.NumMovies.toLocaleString(shared.uiLanguage);
    });
  }

  logger.log("[fetchFilterAgeRatings] resultsFiltered:", resultsFiltered);

  shared.filters.filterAgeRatings = resultsFiltered;
  shared.loadingFilter = "";
}

async function fetchFilterRatings($MediaType) {
  logger.log("[fetchFilterRatings] MediaType:", $MediaType);
  shared.loadingFilter = "filterRatings";

  const filterValues = await fetchFilterValues($MediaType);

  logger.log("[fetchFilterRatings] filterValues:", filterValues);

  let currentFilters = JSON.parse(JSON.stringify(shared.filters));
  delete currentFilters.filterRatings;
  const additionalFilterQuery = generateFilterQuery(currentFilters);

  const results = await db.fireProcedureReturnAll(
    `
    SELECT
    0 AS Rating
    , 1 AS Selected
    , (
      SELECT COUNT(1)
      FROM tbl_Movies MOV
      INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
      LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
      WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
            AND (MOV.Rating IS NULL OR MOV.Rating = 0)
            ${additionalFilterQuery}
    ) AS NumMovies
    UNION
    SELECT
      0.5 AS Rating
      , 1 AS Selected
      , (
        SELECT COUNT(1)
        FROM tbl_Movies MOV
        INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
        LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
        WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
              AND MOV.Rating = 0.5
              ${additionalFilterQuery}
        ) AS NumMovies
    UNION
    SELECT
      1 AS Rating
      , 1 AS Selected
      , (
        SELECT COUNT(1)
        FROM tbl_Movies MOV
        INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
        LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
        WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
              AND MOV.Extra_id_Movies_Owner IS NULL
              AND MOV.Rating = 1
        ${additionalFilterQuery}
      ) AS NumMovies
    UNION
    SELECT
      1.5 AS Rating
      , 1 AS Selected
      , (
        SELECT COUNT(1)
        FROM tbl_Movies MOV
        INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
        LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
        WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
              AND MOV.Extra_id_Movies_Owner IS NULL
              AND MOV.Rating = 1.5
              ${additionalFilterQuery}
      ) AS NumMovies
    UNION
    SELECT
      2 AS Rating
      , 1 AS Selected
      , (
        SELECT COUNT(1)
        FROM tbl_Movies MOV
        INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
        LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
        WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
              AND MOV.Extra_id_Movies_Owner IS NULL
              AND MOV.Rating = 2
              ${additionalFilterQuery}
      ) AS NumMovies
    UNION
    SELECT
      2.5 AS Rating
      , 1 AS Selected
      , (
        SELECT COUNT(1)
        FROM tbl_Movies MOV
        INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
        LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
        WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
              AND MOV.Extra_id_Movies_Owner IS NULL
              AND MOV.Rating = 2.5
              ${additionalFilterQuery}
      ) AS NumMovies
    UNION
    SELECT
      3 AS Rating
      , 1 AS Selected
      , (
        SELECT COUNT(1)
        FROM tbl_Movies MOV
        INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
        LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
        WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
              AND MOV.Extra_id_Movies_Owner IS NULL
              AND MOV.Rating = 3
              ${additionalFilterQuery}
      ) AS NumMovies
    UNION
    SELECT
      3.5 AS Rating
      , 1 AS Selected
      , (
        SELECT COUNT(1)
        FROM tbl_Movies MOV
        INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
        LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
        WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
              AND MOV.Extra_id_Movies_Owner IS NULL
              AND MOV.Rating = 3.5
              ${additionalFilterQuery}
      ) AS NumMovies
    UNION
    SELECT
      4 AS Rating
      , 1 AS Selected
      , (
        SELECT COUNT(1)
        FROM tbl_Movies MOV
        INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
        LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
        WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
              AND MOV.Extra_id_Movies_Owner IS NULL
              AND MOV.Rating = 4
              ${additionalFilterQuery}
      ) AS NumMovies
    UNION
    SELECT
      4.5 AS Rating
      , 1 AS Selected
      , (
        SELECT COUNT(1)
        FROM tbl_Movies MOV
        INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
        LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
        WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
              AND MOV.Extra_id_Movies_Owner IS NULL
              AND MOV.Rating = 4.5
              ${additionalFilterQuery}
      ) AS NumMovies
    UNION
    SELECT
      5 AS Rating
      , 1 AS Selected
      , (
        SELECT COUNT(1)
        FROM tbl_Movies MOV
        INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
        LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
        WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
              AND MOV.Extra_id_Movies_Owner IS NULL
              AND MOV.Rating = 5
              ${additionalFilterQuery}
      ) AS NumMovies
				`,
    { $MediaType }
  );

  if (filterValues && filterValues.filterRatings) {
    results.forEach((result) => {
      const filterValue = filterValues.filterRatings.find((value) => value.Rating === result.Rating);

      if (filterValue) {
        result.Selected = filterValue.Selected;
      }

      result.NumMoviesFormatted = result.NumMovies.toLocaleString(shared.uiLanguage);
    });
  }

  logger.log("[fetchFilterRatings] results:", results);

  shared.filters.filterRatings = results;
  shared.loadingFilter = "";
}

async function fetchFilterParentalAdvisory($MediaType) {
  shared.loadingFilter = "filterParentalAdvisory";
  const Nudity = await fetchFilterParentalAdvisoryCategory($MediaType, "Nudity");
  const Violence = await fetchFilterParentalAdvisoryCategory($MediaType, "Violence");
  const Profanity = await fetchFilterParentalAdvisoryCategory($MediaType, "Profanity");
  const Alcohol = await fetchFilterParentalAdvisoryCategory($MediaType, "Alcohol");
  const Frightening = await fetchFilterParentalAdvisoryCategory($MediaType, "Frightening");

  shared.filters.filterParentalAdvisory = {
    Nudity,
    Violence,
    Profanity,
    Alcohol,
    Frightening,
  };
  shared.loadingFilter = "";
}

async function fetchFilterParentalAdvisoryCategory($MediaType, PA_Category) {
  logger.log(`[fetchFilterParentalAdvisory${PA_Category}] MediaType:`, $MediaType);

  const filterValues = await fetchFilterValues($MediaType);

  logger.log(`[fetchFilterParentalAdvisory${PA_Category}] filterValues:`, filterValues);

  let currentFilters = JSON.parse(JSON.stringify(shared.filters));
  delete currentFilters.filterParentalAdvisory;
  const additionalFilterQuery = generateFilterQuery(currentFilters);

  const results = await db.fireProcedureReturnAll(
    `
			SELECT
				-1 AS Severity
				, '<not available>' AS DisplayText
				, 1 AS Selected
				, (
					SELECT COUNT(1)
					FROM tbl_Movies MOV
					INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
          LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
					WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
                AND MOV.Extra_id_Movies_Owner IS NULL
                AND MOV.IMDB_Parental_Advisory_${PA_Category} IS NULL
                ${additionalFilterQuery}
				) AS NumMovies
			UNION
			SELECT
				0 AS Severity
				, 'None' AS DisplayText
				, 1 AS Selected
				, (
					SELECT COUNT(1)
					FROM tbl_Movies MOV
					INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
          LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
					WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
                AND MOV.Extra_id_Movies_Owner IS NULL
                AND MOV.IMDB_Parental_Advisory_${PA_Category} = 0
                ${additionalFilterQuery}
				) AS NumMovies
			UNION
			SELECT
				1 AS Severity
				, 'Mild' AS DisplayText
				, 1 AS Selected
				, (
					SELECT COUNT(1)
					FROM tbl_Movies MOV
					INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
          LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
					WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
                AND MOV.Extra_id_Movies_Owner IS NULL
                AND MOV.IMDB_Parental_Advisory_${PA_Category} = 1
                ${additionalFilterQuery}
				) AS NumMovies
			UNION
			SELECT
				2 AS Severity
				, 'Moderate' AS DisplayText
				, 1 AS Selected
				, (
					SELECT COUNT(1)
					FROM tbl_Movies MOV
					INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
          LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
					WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
                AND MOV.Extra_id_Movies_Owner IS NULL
                AND MOV.IMDB_Parental_Advisory_${PA_Category} = 2
                ${additionalFilterQuery}
				) AS NumMovies
			UNION
			SELECT
				3 AS Severity
				, 'Severe' AS DisplayText
				, 1 AS Selected
				, (
					SELECT COUNT(1)
					FROM tbl_Movies MOV
					INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
          LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
					WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
                AND MOV.Extra_id_Movies_Owner IS NULL
                AND MOV.IMDB_Parental_Advisory_${PA_Category} = 3
                ${additionalFilterQuery}
				) AS NumMovies
				`,
    { $MediaType }
  );

  if (filterValues && filterValues.filterParentalAdvisory && filterValues.filterParentalAdvisory[PA_Category]) {
    results.forEach((result) => {
      const filterValue = filterValues.filterParentalAdvisory[PA_Category].find((value) => value.Severity === result.Severity);

      if (filterValue) {
        result.Selected = filterValue.Selected;
      }

      result.NumMoviesFormatted = result.NumMovies.toLocaleString(shared.uiLanguage);
    });
  }

  logger.log(`[fetchFilterParentalAdvisory${PA_Category}] results:`, results);

  return results;
}

async function fetchFilterPersons($MediaType, $t) {
  shared.loadingFilter = "filterPersons";
  const filterValues = await fetchFilterValues($MediaType);

  let currentFilters = JSON.parse(JSON.stringify(shared.filters));
  if (!shared.filters.filterSettings.filterPersonsAND) {
    delete currentFilters.filterPersons;
  }
  const additionalFilterQuery = generateFilterQuery(currentFilters);

  const results = await db.fireProcedureReturnAll(
    `
		SELECT
			0 AS id_Filter_Persons
			, NULL AS IMDB_Person_ID
			, $any AS Person_Name
			, 1 AS Selected
			, (
					SELECT COUNT(1)
					FROM tbl_Movies MOV
					INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
          LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
					WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
                AND MOV.Extra_id_Movies_Owner IS NULL
                AND MOV.id_Movies NOT IN (
                  SELECT DISTINCT MC.id_Movies
                  FROM tbl_Movies_IMDB_Credits MC
                  INNER JOIN tbl_Movies MOV2 ON MC.id_Movies = MOV2.id_Movies AND (MOV2.isRemoved IS NULL OR MOV2.isRemoved = 0) AND MOV2.Extra_id_Movies_Owner IS NULL
                  INNER JOIN tbl_SourcePaths SP2 ON MOV2.id_SourcePaths = SP2.id_SourcePaths AND SP2.MediaType = $MediaType
                  WHERE MC.IMDB_Person_ID IN (SELECT IMDB_Person_ID FROM tbl_Filter_Persons)
                )
                ${additionalFilterQuery}
				) AS NumMovies
		UNION
		SELECT
			id_Filter_Persons
			, IMDB_Person_ID
			, Person_Name
			, 1 AS Selected
			, (
					SELECT COUNT(1) FROM (
						SELECT DISTINCT MC.id_Movies
						FROM tbl_Movies_IMDB_Credits MC
						INNER JOIN tbl_Movies MOV ON MC.id_Movies = MOV.id_Movies AND (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
						INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
            LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
						WHERE MC.IMDB_Person_ID = FILTERPERSON.IMDB_Person_ID
                  ${additionalFilterQuery}
					)
        ) AS NumMovies
		FROM tbl_Filter_Persons FILTERPERSON
	`,
    { $MediaType, $any: $t("<any other person>") }
  );

  // logger.log('[fetchFilterPersons] QUERY:', )

  if (filterValues && filterValues.filterPersons) {
    results.forEach((result) => {
      const filterValue = filterValues.filterPersons.find((value) => value.id_Filter_Persons === result.id_Filter_Persons);

      if (filterValue) {
        result.Selected = filterValue.Selected;
      }

      result.NumMoviesFormatted = result.NumMovies.toLocaleString(shared.uiLanguage);
    });
  }

  logger.log("[fetchFilterPersons] result:", results);

  shared.filters.filterPersons = results;
  shared.loadingFilter = "";
}

async function fetchFilterCompanies($MediaType, $t) {
  shared.loadingFilter = "filterCompanies";
  const filterValues = await fetchFilterValues($MediaType);

  let currentFilters = JSON.parse(JSON.stringify(shared.filters));
  if (!shared.filters.filterSettings.filterCompaniesAND) {
    delete currentFilters.filterCompanies;
  }
  const additionalFilterQuery = generateFilterQuery(currentFilters);

  const results = await db.fireProcedureReturnAll(
    `
		SELECT
			0 AS id_Filter_Companies
			, $any AS Company_Name
			, 1 AS Selected
			, (
					SELECT COUNT(1)
					FROM tbl_Movies MOV
					INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
          LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
					WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
                AND MOV.Extra_id_Movies_Owner IS NULL
                AND MOV.id_Movies NOT IN (
                  SELECT DISTINCT MC.id_Movies
                  FROM tbl_Movies_IMDB_Companies MC
                  INNER JOIN tbl_Movies MOV2 ON MC.id_Movies = MOV2.id_Movies AND (MOV2.isRemoved IS NULL OR MOV2.isRemoved = 0) AND MOV2.Extra_id_Movies_Owner IS NULL
                  INNER JOIN tbl_SourcePaths SP2 ON MOV2.id_SourcePaths = SP2.id_SourcePaths AND SP2.MediaType = $MediaType
                  WHERE MC.Company_Name IN (SELECT Company_Name FROM tbl_Filter_Companies)
                )
                ${additionalFilterQuery}
				)
			AS NumMovies
		UNION
		SELECT
			id_Filter_Companies
			, Company_Name
			, 1 AS Selected
			, (
					SELECT COUNT(1) FROM (
						SELECT DISTINCT MC.id_Movies
						FROM tbl_Movies_IMDB_Companies MC
						INNER JOIN tbl_Movies MOV ON MC.id_Movies = MOV.id_Movies AND (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
						INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
            LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
						WHERE MC.Company_Name = FILTERCOMPANY.Company_Name
                  ${additionalFilterQuery}
					)
			) AS NumMovies
		FROM tbl_Filter_Companies FILTERCOMPANY
	`,
    { $MediaType, $any: $t("<any other company>") }
  );

  // logger.log('[fetchFilterCompanies] QUERY:', )

  if (filterValues && filterValues.filterCompanies) {
    results.forEach((result) => {
      const filterValue = filterValues.filterCompanies.find((value) => value.id_Filter_Companies === result.id_Filter_Companies);

      if (filterValue) {
        result.Selected = filterValue.Selected;
      }

      result.NumMoviesFormatted = result.NumMovies.toLocaleString(shared.uiLanguage);
    });
  }

  logger.log("[fetchFilterCompanies] result:", results);

  shared.filters.filterCompanies = results;
  shared.loadingFilter = "";
}

async function fetchFilterIMDBPlotKeywords($MediaType, $t) {
  shared.loadingFilter = "filterIMDBPlotKeywords";
  const filterValues = await fetchFilterValues($MediaType);

  let currentFilters = JSON.parse(JSON.stringify(shared.filters));
  if (!shared.filters.filterSettings.filterIMDBPlotKeywordsAND) {
    delete currentFilters.filterIMDBPlotKeywords;
  }
  const additionalFilterQuery = generateFilterQuery(currentFilters);

  const results = await db.fireProcedureReturnAll(
    `
		SELECT
			0 AS id_Filter_IMDB_Plot_Keywords
			, NULL AS id_IMDB_Plot_Keywords
			, $any AS Keyword
			, 1 AS Selected
			, (
					SELECT COUNT(1)
					FROM tbl_Movies MOV
					INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
          LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
					WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
                AND MOV.Extra_id_Movies_Owner IS NULL
                AND MOV.id_Movies NOT IN (
                  SELECT DISTINCT MPK.id_Movies
                  FROM tbl_Movies_IMDB_Plot_Keywords MPK
                  INNER JOIN tbl_Movies MOV2 ON MPK.id_Movies = MOV2.id_Movies AND (MOV2.isRemoved IS NULL OR MOV2.isRemoved = 0) AND MOV2.Extra_id_Movies_Owner IS NULL
                  INNER JOIN tbl_SourcePaths SP2 ON MOV2.id_SourcePaths = SP2.id_SourcePaths AND SP2.MediaType = $MediaType
                  WHERE MPK.id_IMDB_Plot_Keywords IN (SELECT id_IMDB_Plot_Keywords FROM tbl_Filter_IMDB_Plot_Keywords)
                )
                ${additionalFilterQuery}
				)
			AS NumMovies
		UNION
		SELECT
    id_Filter_IMDB_Plot_Keywords
			, id_IMDB_Plot_Keywords
			, Keyword
			, 1 AS Selected
			, (
					SELECT COUNT(1) FROM (
            SELECT DISTINCT MPK.id_Movies
            FROM tbl_Movies_IMDB_Plot_Keywords MPK
            INNER JOIN tbl_Movies MOV ON MPK.id_Movies = MOV.id_Movies AND (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
            INNER JOIN tbl_SourcePaths SP2 ON MOV.id_SourcePaths = SP2.id_SourcePaths AND SP2.MediaType = $MediaType
            LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
            WHERE MPK.id_IMDB_Plot_Keywords IN (SELECT id_IMDB_Plot_Keywords FROM tbl_Filter_IMDB_Plot_Keywords WHERE id_IMDB_Plot_Keywords = FILTERPLOTKEYWORDS.id_IMDB_Plot_Keywords)
                  ${additionalFilterQuery}
        )
			) AS NumMovies
		FROM tbl_Filter_IMDB_Plot_Keywords FILTERPLOTKEYWORDS
	`,
    { $MediaType, $any: $t("<any other plot keyword>") }
  );

  // logger.log('[fetchFilterIMDBPlotKeywords] QUERY:', )

  if (filterValues && filterValues.filterIMDBPlotKeywords) {
    results.forEach((result) => {
      const filterValue = filterValues.filterIMDBPlotKeywords.find((value) => value.id_Filter_IMDB_Plot_Keywords === result.id_Filter_IMDB_Plot_Keywords);

      if (filterValue) {
        result.Selected = filterValue.Selected;
      }

      result.NumMoviesFormatted = result.NumMovies.toLocaleString(shared.uiLanguage);
    });
  }

  logger.log("[fetchFilterIMDBPlotKeywords] result:", results);

  shared.filters.filterIMDBPlotKeywords = results;
  shared.loadingFilter = "";
}

async function fetchFilterIMDBFilmingLocations($MediaType, $t) {
  shared.loadingFilter = "filterIMDBFilmingLocations";
  const filterValues = await fetchFilterValues($MediaType);

  let currentFilters = JSON.parse(JSON.stringify(shared.filters));
  if (!shared.filters.filterSettings.filterIMDBFilmingLocationsAND) {
    delete currentFilters.filterIMDBFilmingLocations;
  }
  const additionalFilterQuery = generateFilterQuery(currentFilters);

  const results = await db.fireProcedureReturnAll(
    `
		SELECT
			0 AS id_Filter_IMDB_Filming_Locations
			, NULL AS id_IMDB_Filming_Locations
			, $any AS Location
			, 1 AS Selected
			, (
					SELECT COUNT(1)
					FROM tbl_Movies MOV
					INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
          LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
					WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
                AND MOV.Extra_id_Movies_Owner IS NULL
                AND MOV.id_Movies NOT IN (
                  SELECT DISTINCT MFL.id_Movies
                  FROM tbl_Movies_IMDB_Filming_Locations MFL
                  INNER JOIN tbl_Movies MOV2 ON MFL.id_Movies = MOV2.id_Movies AND (MOV2.isRemoved IS NULL OR MOV2.isRemoved = 0) AND MOV2.Extra_id_Movies_Owner IS NULL
                  INNER JOIN tbl_SourcePaths SP2 ON MOV2.id_SourcePaths = SP2.id_SourcePaths AND SP2.MediaType = $MediaType
                  WHERE MFL.id_IMDB_Filming_Locations IN (SELECT id_IMDB_Filming_Locations FROM tbl_Filter_IMDB_Filming_Locations)
                )
                ${additionalFilterQuery}
				)
			AS NumMovies
		UNION
		SELECT
    id_Filter_IMDB_Filming_Locations
			, id_IMDB_Filming_Locations
			, Location
			, 1 AS Selected
			, (
					SELECT COUNT(1) FROM (
            SELECT DISTINCT MFL.id_Movies
            FROM tbl_Movies_IMDB_Filming_Locations MFL
            INNER JOIN tbl_Movies MOV ON MFL.id_Movies = MOV.id_Movies AND (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
            INNER JOIN tbl_SourcePaths SP2 ON MOV.id_SourcePaths = SP2.id_SourcePaths AND SP2.MediaType = $MediaType
            LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
            WHERE MFL.id_IMDB_Filming_Locations IN (SELECT id_IMDB_Filming_Locations FROM tbl_Filter_IMDB_Filming_Locations WHERE id_IMDB_Filming_Locations = FILTERFILMINGLOCATIONS.id_IMDB_Filming_Locations)
                  ${additionalFilterQuery}
        )
			) AS NumMovies
		FROM tbl_Filter_IMDB_Filming_Locations FILTERFILMINGLOCATIONS
	`,
    { $MediaType, $any: $t("<any other filming location>") }
  );

  if (filterValues && filterValues.filterIMDBFilmingLocations) {
    results.forEach((result) => {
      const filterValue = filterValues.filterIMDBFilmingLocations.find(
        (value) => value.id_Filter_IMDB_Filming_Locations === result.id_Filter_IMDB_Filming_Locations
      );

      if (filterValue) {
        result.Selected = filterValue.Selected;
      }

      result.NumMoviesFormatted = result.NumMovies.toLocaleString(shared.uiLanguage);
    });
  }

  logger.log("[fetchFilterIMDBFilmingLocations] result:", results);

  shared.filters.filterIMDBFilmingLocations = results;
  shared.loadingFilter = "";
}

async function fetchFilterYears($MediaType) {
  shared.loadingFilter = "filterYears";
  logger.log("[fetchFilterYears] MediaType:", $MediaType);

  const filterValues = await fetchFilterValues($MediaType);

  logger.log("[fetchFilterYears] filterValues:", filterValues);

  let currentFilters = JSON.parse(JSON.stringify(shared.filters));
  delete currentFilters.filterYears;
  const additionalFilterQuery = generateFilterQuery(currentFilters);

  const results = await db.fireProcedureReturnAll(
    `
		SELECT
			'-1' AS startYear
			, COUNT(1) AS NumMovies
			, 1 AS Selected
		FROM tbl_Movies MOV
		INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND MediaType = $MediaType
		LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
		WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
          AND MOV.Extra_id_Movies_Owner IS NULL
          AND MOV.startYear IS NULL
          ${additionalFilterQuery}
		UNION
		SELECT
			startYear
			, COUNT(1) AS NumMovies
			, 1 AS Selected
		FROM tbl_Movies MOV
		INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND MediaType = $MediaType
		LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
		WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
          AND MOV.Extra_id_Movies_Owner IS NULL
          AND MOV.startYear IS NOT NULL
          ${additionalFilterQuery}
		GROUP BY (startYear)
		ORDER BY startYear DESC`,
    { $MediaType }
  );

  const resultsFiltered = results; // results.filter((result) => result.NumMovies > 0); // we should not filter out, because "AND" can quickly result in an empty set

  results.forEach((result) => {
    result.startYear = parseInt(result.startYear);
  });

  if (filterValues && filterValues.filterYears) {
    resultsFiltered.forEach((result) => {
      const filterValue = filterValues.filterYears.find((value) => value.startYear == result.startYear);

      if (filterValue) {
        result.Selected = filterValue.Selected;
      }

      result.NumMoviesFormatted = result.NumMovies.toLocaleString(shared.uiLanguage);
    });
  }

  logger.log("[fetchFilterYears] resultsFiltered:", resultsFiltered);

  shared.filters.filterYears = resultsFiltered;
  shared.loadingFilter = "";
}

async function fetchFilterQualities($MediaType) {
  shared.loadingFilter = "filterQualities";
  logger.log("[fetchFilterQualities] MediaType:", $MediaType);

  const filterValues = await fetchFilterValues($MediaType);

  logger.log("[fetchFilterQualities] filterValues:", filterValues);

  let currentFilters = JSON.parse(JSON.stringify(shared.filters));
  delete currentFilters.filterQualities;
  const additionalFilterQuery = generateFilterQuery(currentFilters);

  const results = await db.fireProcedureReturnAll(
    `
		SELECT
			MI_Quality
			, COUNT(1) AS NumMovies
			, 1 AS Selected
		FROM tbl_Movies MOV
		INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND MediaType = $MediaType
		LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
		WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
          AND MOV.Extra_id_Movies_Owner IS NULL
          ${additionalFilterQuery}
		GROUP BY (MI_Quality)`,
    { $MediaType }
  );

  const resultsFiltered = results; // results.filter((result) => result.NumMovies > 0);  // we should not filter out, because "AND" can quickly result in an empty set

  if (filterValues && filterValues.filterQualities) {
    resultsFiltered.forEach((result) => {
      const filterValue = filterValues.filterQualities.find((value) => value.MI_Quality == result.MI_Quality);

      if (filterValue) {
        result.Selected = filterValue.Selected;
      }

      result.NumMoviesFormatted = result.NumMovies.toLocaleString(shared.uiLanguage);
    });
  }

  logger.log("[fetchFilterQualities] resultsFiltered:", resultsFiltered);

  shared.filters.filterQualities = resultsFiltered;
  shared.loadingFilter = "";
}

function abortRescan() {
  doAbortRescan = true;
}

function resetAbortRescan() {
  doAbortRescan = false;
}

function saveFilterValues($MediaType) {
  const filterValues = shared.filters;

  const filterValuesString = JSON.stringify(filterValues);

  logger.log("[saveFilterValues] filterValues:", filterValues);

  setSetting(`filtersMediaType_${$MediaType}`, filterValuesString);
}

async function saveSortValues($MediaType) {
  const sortValues = {
    sortField: shared.sortField,
  };

  const sortValuesString = JSON.stringify(sortValues);

  await setSetting(`sortMediaType${$MediaType}`, sortValuesString);
}

async function createList($Name, noErrorOnDuplicateName) {
  const id_Lists = await db.fireProcedureReturnScalar(`SELECT id_Lists FROM tbl_Lists WHERE Name = $Name`, { $Name });
  if (id_Lists) {
    if (noErrorOnDuplicateName) {
      return id_Lists;
    }

    throw definedError.create("a list with the same name already exists", null, null, null);
  }

  await db.fireProcedure(`INSERT INTO tbl_Lists (Name, created_at) VALUES ($Name, DATETIME('now'))`, { $Name });
  return await db.fireProcedureReturnScalar(`SELECT id_Lists FROM tbl_Lists WHERE Name = $Name`, { $Name });
}

/**
 *
 * @param {Integer} $id_Lists
 * @param {Integer} $id_Movies
 * @param {Boolean} isHandlingDuplicates if false, addToList will determine duplicates and add them to the list
 * @returns
 */
async function addToList($id_Lists, $id_Movies, isHandlingDuplicates, dontThrowErrorOnDuplicate) {
  const id_Lists_Movies = await db.fireProcedureReturnScalar(
    `SELECT id_Lists_Movies FROM tbl_Lists_Movies WHERE id_Lists = $id_Lists AND id_Movies = $id_Movies`,
    { $id_Lists, $id_Movies }
  );
  if (id_Lists_Movies) {
    if (isHandlingDuplicates || dontThrowErrorOnDuplicate) {
      return;
    }

    throw definedError.create("the item is already part of the list", null, null, null);
  }

  await db.fireProcedure(`INSERT INTO tbl_Lists_Movies (id_Lists, id_Movies, created_at) VALUES ($id_Lists, $id_Movies, DATETIME('now'))`, {
    $id_Lists,
    $id_Movies,
  });

  if (!isHandlingDuplicates) {
    const duplicates = await getMovieDuplicates(
      $id_Movies,
      shared.duplicatesHandling.actualDuplicate.addToList,
      shared.duplicatesHandling.metaDuplicate.addToList
    );
    logger.log("[addToList] duplicates:", duplicates);

    for (let i = 0; i < duplicates.length; i++) {
      await addToList($id_Lists, duplicates[i], true);
    }
  }
}

/**
 * Clears a list from all entries
 * @param {Integer} $id_Lists
 */
async function clearList($id_Lists) {
  return await db.fireProcedureReturnScalar(`DELETE FROM tbl_Lists_Movies WHERE id_Lists = $id_Lists`, { $id_Lists });
}

async function removeFromList($id_Lists, $id_Movies) {
  logger.log("[removeFromList] $id_Lists:", $id_Lists, "$id_Movies:", $id_Movies);
  return await db.fireProcedureReturnScalar(`DELETE FROM tbl_Lists_Movies WHERE id_Lists = $id_Lists AND id_Movies = $id_Movies`, { $id_Lists, $id_Movies });
}

async function fetchLists() {
  return await db.fireProcedureReturnAll(`
			SELECT
				id_Lists
				, Name
			FROM tbl_Lists LISTS
			ORDER BY Name
	`);
}

async function fetchFilterLists($MediaType, $t) {
  shared.loadingFilter = "filterLists";
  const filterValues = await fetchFilterValues($MediaType);

  let currentFilters = JSON.parse(JSON.stringify(shared.filters));
  delete currentFilters.filterLists;
  const additionalFilterQuery = generateFilterQuery(currentFilters);

  const results = await db.fireProcedureReturnAll(
    `
		SELECT
			0 AS id_Lists
			, $any AS Name
			, 1 AS Selected
			, (
				SELECT COUNT(1)
				FROM tbl_Movies MOV
				INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
        LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
				WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
              AND MOV.Extra_id_Movies_Owner IS NULL
              AND MOV.id_Movies NOT IN (SELECT id_Movies FROM tbl_Lists_Movies)
              ${additionalFilterQuery}
			) AS NumMovies
		UNION
		SELECT
			id_Lists
			, Name
			, 1 AS Selected
			, (
				SELECT COUNT(1)
				FROM tbl_Lists_Movies LM
				INNER JOIN tbl_Movies MOV ON LM.id_Movies = MOV.id_Movies AND (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
				INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
        LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
				WHERE LM.id_Lists = LISTS.id_Lists
              ${additionalFilterQuery}
			) AS NumMovies
		FROM tbl_Lists LISTS
		ORDER BY Name
	`,
    { $MediaType, $any: $t("<not in any list>") }
  );

  if (filterValues && filterValues.filterLists) {
    results.forEach((result) => {
      const filterValue = filterValues.filterLists.find((value) => value.Name === result.Name);

      if (filterValue) {
        result.Selected = filterValue.Selected;
      }

      result.NumMoviesFormatted = result.NumMovies.toLocaleString(shared.uiLanguage);
    });
  }

  logger.log("[fetchFilterLists] result:", results);

  shared.filters.filterLists = results;
  shared.loadingFilter = "";
}

async function fetchFilterLanguages($MediaType, $LanguageType, $t) {
  shared.loadingFilter = `filter${helpers.uppercaseEachWord($LanguageType)}Languages`;
  logger.log("[fetchFilterLanguages] MediaType:", $MediaType);

  const filterValues = await fetchFilterValues($MediaType);

  logger.log("[fetchFilterLanguages] filterValues:", filterValues);

  let currentFilters = JSON.parse(JSON.stringify(shared.filters));
  delete currentFilters[`filter${helpers.uppercaseEachWord($LanguageType)}Languages`];
  const additionalFilterQuery = generateFilterQuery(currentFilters);

  const results = await db.fireProcedureReturnAll(
    `
		SELECT 
			'<not available>' AS Language
			, '<not available>' AS DisplayText
			, 1 AS Selected
			, (
					SELECT COUNT(1) FROM tbl_Movies MOV
					INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
          LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
					WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
					AND MOV.id_Movies NOT IN (
                SELECT id_Movies
                FROM	tbl_Movies_Languages ML
                WHERE ML.Type = $LanguageType
              )
              ${additionalFilterQuery}
				) AS NumMovies
		UNION
		SELECT
			Language
			, '' AS DisplayText
			, 1 AS Selected
			, (
					SELECT COUNT(1) FROM tbl_Movies_Languages ML2
					INNER JOIN tbl_Movies MOV ON ML2.id_Movies = MOV.id_Movies
					INNER JOIN tbl_SourcePaths SP2 ON MOV.id_SourcePaths = SP2.id_SourcePaths AND SP2.MediaType = $MediaType
          LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
					WHERE	ML.Language = ML2.Language
                AND ML2.Type = $LanguageType
                AND (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
                AND MOV.Extra_id_Movies_Owner IS NULL
                ${additionalFilterQuery}
				) AS NumMovies
		FROM tbl_Movies_Languages ML
		WHERE ML.Type = $LanguageType
		AND id_Movies IN (
			SELECT id_Movies
			FROM tbl_Movies MOV
			INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
			WHERE	(MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
					AND MOV.Extra_id_Movies_Owner IS NULL
		)
		GROUP BY Language
		ORDER BY NumMovies DESC`,
    { $MediaType, $LanguageType }
  );

  const resultsFiltered = results; //results.filter((result) => result.NumMovies > 0); // we should not filter out, because "AND" can quickly result in an empty set

  let filterValuesLanguages = null;
  if (filterValues) {
    if ($LanguageType === "audio") {
      filterValuesLanguages = filterValues.filterAudioLanguages;
    } else {
      filterValuesLanguages = filterValues.filterSubtitleLanguages;
    }
  }

  resultsFiltered.forEach((result) => {
    if (filterValuesLanguages) {
      const filterValue = filterValuesLanguages.find((value) => value.Language === result.Language);

      if (filterValue) {
        result.Selected = filterValue.Selected;
      }
    }

    result.NumMoviesFormatted = result.NumMovies.toLocaleString(shared.uiLanguage);

    result.DisplayText = result.Language;
    if (languageCodeNameMapping[result.Language]) {
      result.DisplayText = `${result.Language} - ${languageCodeNameMapping[result.Language]}`;
      result.LanguageFull = languageCodeNameMapping[result.Language];
    }
  });

  logger.log("[fetchFilterLanguages] resultsFiltered:", resultsFiltered);

  // Translate
  resultsFiltered.forEach((language) => {
    if (!language.LanguageFull) {
      return;
    }

    const LanguageFullTranslated = $t(`LanguageNames.${language.LanguageFull}`);

    if (LanguageFullTranslated && !LanguageFullTranslated.includes(".")) {
      language.DisplayText = `${language.Language} - ${LanguageFullTranslated}`;
    }
  });

  if ($LanguageType === "audio") {
    shared.filters.filterAudioLanguages = resultsFiltered;
  } else {
    shared.filters.filterSubtitleLanguages = resultsFiltered;
  }
  shared.loadingFilter = "";
}

async function fetchFilterIMDBRating($MediaType) {
  shared.loadingFilter = "filterIMDBRating";
  const filterValues = await fetchFilterValues($MediaType);

  if (filterValues && filterValues.filterIMDBRating && filterValues.filterIMDBRating.length > 0) {
    shared.filters.filterIMDBRating = filterValues.filterIMDBRating;
  }

  if (filterValues && filterValues.filterIMDBRatingNone != null && filterValues.filterIMDBRatingNone != undefined) {
    shared.filters.filterIMDBRatingNone = filterValues.filterIMDBRatingNone;
  }
  shared.loadingFilter = "";
}

async function fetchFilterMetacriticScore($MediaType) {
  const filterValues = await fetchFilterValues($MediaType);

  if (filterValues && filterValues.filterMetacriticScore && filterValues.filterMetacriticScore.length > 0) {
    shared.filters.filterMetacriticScore = filterValues.filterMetacriticScore;
  }

  if (filterValues && filterValues.filterMetacriticScoreNone != null && filterValues.filterMetacriticScoreNone != undefined) {
    shared.filters.filterMetacriticScoreNone = filterValues.filterMetacriticScoreNone;
  }
}

// async function ensureFilterReleaseYearsRange($MediaType) {
//   shared.filters.filterReleaseYearsMin = helpers.nz(await db.fireProcedureReturnScalar(
//     `
//     SELECT MIN(startYear)
//       FROM tbl_Movies MOV
//       INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
//       WHERE
//         (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL`,
//     { $MediaType }
//   ), new Date().getFullYear());

//   logger.log('[ensureFilterReleaseYearsRange] Min:', shared.filters.filterReleaseYearsMin);

//   shared.filters.filterReleaseYearsMax = helpers.nz(await db.fireProcedureReturnScalar(
//     `
//     SELECT MAX(startYear)
//       FROM tbl_Movies MOV
//       INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
//       WHERE
//         (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL`,
//     { $MediaType }
//   ), new Date().getFullYear());

//   logger.log('[ensureFilterReleaseYearsRange] Max:', shared.filters.filterReleaseYearsMax);

//   if (shared.isScanning) {
//     // during rescan fuckups may happen
//     shared.filters.filterReleaseYears = [shared.filters.filterReleaseYearsMin, shared.filters.filterReleaseYearsMax];
//   } else {
//    shared.filters.filterReleaseYears = [Math.max(shared.filters.filterReleaseYears[0], shared.filters.filterReleaseYearsMin), Math.min(shared.filters.filterReleaseYears[1], shared.filters.filterReleaseYearsMax)];
//   }
// }

// async function fetchFilterReleaseYears($MediaType) {
//   await ensureFilterReleaseYearsRange($MediaType);

//   shared.filters.filterReleaseYears = [shared.filters.filterReleaseYearsMin, shared.filters.filterReleaseYearsMax];

//   const filterValues = await fetchFilterValues($MediaType);

//   if (
//     filterValues &&
//     filterValues.filterReleaseYearsNone != null &&
//     filterValues.filterReleaseYearsNone != undefined
//   ) {
//     shared.filters.filterReleaseYearsNone = filterValues.filterReleaseYearsNone;
//   }

//   if (filterValues && filterValues.filterReleaseYears && filterValues.filterReleaseYears.length === 2 && filterValues.filterReleaseYearsMin == filterValues.filterReleaseYears[0] && filterValues.filterReleaseYearsMax == filterValues.filterReleaseYears[1]) {
//     // the old setting already was the "ALL" range, no need to overwrite
//     logger.log('[fetchFilterReleaseYears] saved was the "ALL" range');
//     return;
//   }

//   if (
//     filterValues &&
//     filterValues.filterReleaseYears &&
//     filterValues.filterReleaseYears.length > 0
//   ) {
//     logger.log('[fetchFilterReleaseYears] saved was NOT the "ALL" range:', filterValues);
//     shared.filters.filterReleaseYears = [Math.max(filterValues.filterReleaseYears[0], shared.filters.filterReleaseYearsMin), Math.min(filterValues.filterReleaseYears[1], shared.filters.filterReleaseYearsMax)];
//   }
// }

async function fetchFilterSettings($MediaType) {
  logger.log("[fetchFilterSettings] START");
  shared.loadingFilter = "filterSettings";

  const filterValues = await fetchFilterValues($MediaType);

  logger.log("[fetchFilterSettings] filterValues:", filterValues);

  if (filterValues && filterValues.filterSettings) {
    logger.log("[fetchFilterSettings] filterValues.filterSettings:", filterValues);

    shared.filters.filterSettings = filterValues.filterSettings;
  }
  shared.loadingFilter = "";
}

async function getMovieDetails($id_Movies) {
  const lists = await db.fireProcedureReturnAll(
    `SELECT id_Lists, Name FROM tbl_Lists WHERE id_Lists IN (SELECT id_Lists FROM tbl_Lists_Movies WHERE id_Movies = $id_Movies) ORDER BY Name`,
    { $id_Movies }
  );

  const extras = await db.fireProcedureReturnAll(
    `SELECT
      MOV.id_Movies
      , MOV.RelativePath
      , MOV.RelativeDirectory
      , MOV.Filename
      , MOV.Name
      , SP.Path AS SourcePath
    FROM tbl_Movies MOV
    INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths
    WHERE Extra_id_Movies_Owner = $id_Movies`,
    { $id_Movies }
  );

  extras.forEach((movie) => {
    ensureMovieFullPath(movie);
  });

  return {
    lists,
    extras,
  };
}

async function setLastAccess($id_Movies, isHandlingDuplicates) {
  await db.fireProcedure(`UPDATE tbl_Movies SET last_access_at = DATETIME('now') WHERE id_Movies = $id_Movies`, { $id_Movies });

  if (!isHandlingDuplicates) {
    const duplicates = await getMovieDuplicates($id_Movies, shared.duplicatesHandling.actualDuplicate.updateLastAccess, false);

    for (let i = 0; i < duplicates.length; i++) {
      await setLastAccess(duplicates[i], true);
    }

    return duplicates.concat([$id_Movies]);
  }
}

async function getCurrentTime() {
  return await db.fireProcedureReturnScalar(`SELECT DATETIME('now')`);
}

async function fetchMovieCredits($id_Movies) {
  const credits = await db.fireProcedureReturnAll(
    `
	SELECT
		id_Movies_IMDB_Credits
		, id_Movies
		, Category			AS category
		, IMDB_Person_ID	AS id
		, Person_Name		AS name
		, Credit			AS credit
	FROM tbl_Movies_IMDB_Credits WHERE id_Movies = $id_Movies`,
    { $id_Movies }
  );

  const creditsCategorized = [];

  credits.forEach((credit) => {
    if (!creditsCategorized.find((cc) => cc.category === credit.category)) {
      creditsCategorized.push({
        category: credit.category,
        items: [],
      });
    }

    creditsCategorized.find((cc) => cc.category === credit.category).items.push(credit);
  });

  return creditsCategorized;
}

async function fetchMovieCompanies($id_Movies) {
  const companies = await db.fireProcedureReturnAll(
    `
	SELECT
		id_Movies_IMDB_Companies
		, id_Movies
		, Category			AS category
		, IMDB_Company_ID	AS id
		, Company_Name		AS name
		, Role			AS role
	FROM tbl_Movies_IMDB_Companies WHERE id_Movies = $id_Movies`,
    { $id_Movies }
  );

  const companiesCategorized = [];

  companies.forEach((company) => {
    if (!companiesCategorized.find((cc) => cc.category === company.category)) {
      companiesCategorized.push({
        category: company.category,
        items: [],
      });
    }

    companiesCategorized.find((cc) => cc.category === company.category).items.push(company);
  });

  return companiesCategorized;
}

async function fetchMoviePlotKeywords($id_Movies) {
  return await db.fireProcedureReturnAll(
    `
    SELECT
      MPK.id_Movies_IMDB_Plot_Keywords
      , PK.id_IMDB_Plot_Keywords
      , PK.Keyword
      , MPK.NumVotes
      , MPK.NumRelevant
    FROM tbl_Movies_IMDB_Plot_Keywords MPK
    INNER JOIN tbl_IMDB_Plot_Keywords PK ON MPK.id_IMDB_Plot_Keywords = PK.id_IMDB_Plot_Keywords
    WHERE MPK.id_Movies = $id_Movies
  `,
    { $id_Movies }
  );
}

async function fetchMovieFilmingLocations($id_Movies) {
  return await db.fireProcedureReturnAll(
    `
    SELECT
      MFL.id_Movies_IMDB_Filming_Locations
      , MFL.id_IMDB_Filming_Locations
      , FL.Location
      , MFL.NumVotes
      , MFL.NumInteresting
    FROM tbl_Movies_IMDB_Filming_Locations MFL
    INNER JOIN tbl_IMDB_Filming_Locations FL ON MFL.id_IMDB_Filming_Locations = FL.id_IMDB_Filming_Locations
    WHERE MFL.id_Movies = $id_Movies
  `,
    { $id_Movies }
  );
}

async function fetchIMDBPerson($IMDB_Person_ID) {
  return await db.fireProcedureReturnAll(
    `
	SELECT
		id_IMDB_Persons
		, IMDB_Person_ID
		, Photo_URL
		, ShortBio
		, LongBio
	FROM tbl_IMDB_Persons
	WHERE IMDB_Person_ID = $IMDB_Person_ID`,
    { $IMDB_Person_ID }
  );
}

async function fetchNumMoviesForPerson($IMDB_Person_ID) {
  return await db.fireProcedureReturnScalar(
    `
		SELECT COUNT(1) FROM (
			SELECT DISTINCT id_Movies FROM tbl_Movies_IMDB_Credits WHERE IMDB_Person_ID = $IMDB_Person_ID
		)
	`,
    { $IMDB_Person_ID }
  );
}

async function addFilterPerson($IMDB_Person_ID, $Person_Name) {
  const id_Filter_Persons = await db.fireProcedureReturnScalar(`SELECT id_Filter_Persons FROM tbl_Filter_Persons WHERE IMDB_Person_ID = $IMDB_Person_ID`, {
    $IMDB_Person_ID,
  });
  if (id_Filter_Persons) {
    return;
  }

  await db.fireProcedure(`INSERT INTO tbl_Filter_persons (IMDB_Person_ID, Person_Name, created_at) VALUES ($IMDB_Person_ID, $Person_Name, DATETIME('now'))`, {
    $IMDB_Person_ID,
    $Person_Name,
  });
}

async function deleteFilterPerson($id_Filter_Persons) {
  return await db.fireProcedureReturnScalar(`DELETE FROM tbl_Filter_Persons WHERE id_Filter_Persons = $id_Filter_Persons`, { $id_Filter_Persons });
}

async function addFilterIMDBPlotKeyword($id_IMDB_Plot_Keywords, $Keyword) {
  const id_Filter_IMDB_Plot_Keywords = await db.fireProcedureReturnScalar(
    `SELECT id_Filter_IMDB_Plot_Keywords FROM tbl_Filter_IMDB_Plot_Keywords WHERE id_IMDB_Plot_Keywords = $id_IMDB_Plot_Keywords`,
    { $id_IMDB_Plot_Keywords }
  );
  if (id_Filter_IMDB_Plot_Keywords) {
    return;
  }

  await db.fireProcedure(
    `INSERT INTO tbl_Filter_IMDB_Plot_Keywords (id_IMDB_Plot_Keywords, Keyword, created_at) VALUES ($id_IMDB_Plot_Keywords, $Keyword, DATETIME('now'))`,
    { $id_IMDB_Plot_Keywords, $Keyword }
  );
}

async function addFilterIMDBFilmingLocation($id_IMDB_Filming_Locations, $Location) {
  const id_Filter_IMDB_Filming_Locations = await db.fireProcedureReturnScalar(
    `SELECT id_Filter_IMDB_Filming_Locations FROM tbl_Filter_IMDB_Filming_Locations WHERE id_IMDB_Filming_Locations = $id_IMDB_Filming_Locations`,
    { $id_IMDB_Filming_Locations }
  );
  if (id_Filter_IMDB_Filming_Locations) {
    return;
  }

  await db.fireProcedure(
    `INSERT INTO tbl_Filter_IMDB_Filming_Locations (id_IMDB_Filming_Locations, Location, created_at) VALUES ($id_IMDB_Filming_Locations, $Location, DATETIME('now'))`,
    { $id_IMDB_Filming_Locations, $Location }
  );
}

async function deleteFilterIMDBPlotKeyword($id_Filter_IMDB_Plot_Keywords) {
  return await db.fireProcedureReturnScalar(`DELETE FROM tbl_Filter_IMDB_Plot_Keywords WHERE id_Filter_IMDB_Plot_Keywords = $id_Filter_IMDB_Plot_Keywords`, {
    $id_Filter_IMDB_Plot_Keywords,
  });
}

async function deleteFilterIMDBFilmingLocation($id_Filter_IMDB_Filming_Locations) {
  return await db.fireProcedureReturnScalar(
    `DELETE FROM tbl_Filter_IMDB_Filming_Locations WHERE id_Filter_IMDB_Filming_Locations = $id_Filter_IMDB_Filming_Locations`,
    { $id_Filter_IMDB_Filming_Locations }
  );
}

async function addFilterCompany($Company_Name) {
  const id_Filter_Companies = await db.fireProcedureReturnScalar(`SELECT id_Filter_Companies FROM tbl_Filter_Companies WHERE Company_Name = $Company_Name`, {
    $Company_Name,
  });
  if (id_Filter_Companies) {
    return;
  }

  await db.fireProcedure(`INSERT INTO tbl_Filter_Companies (Company_Name, created_at) VALUES ($Company_Name, DATETIME('now'))`, { $Company_Name });
}

async function deleteFilterCompany($id_Filter_Companies) {
  return await db.fireProcedureReturnScalar(`DELETE FROM tbl_Filter_Companies WHERE id_Filter_Companies = $id_Filter_Companies`, { $id_Filter_Companies });
}

async function assignIMDB($id_Movies, $IMDB_tconst, isHandlingDuplicates, movie, $t) {
  logger.log("[assignIMDB] $id_Movies:", $id_Movies, "$IMDB_tconst:", $IMDB_tconst, "movie:", movie);

  if (!$IMDB_tconst && movie) {
    $IMDB_tconst = await findIMDBtconst(movie, false, $t);
  }

  if (!$IMDB_tconst) {
    return;
  }

  await db.fireProcedure(`UPDATE tbl_Movies SET IMDB_tconst = $IMDB_tconst WHERE id_Movies = $id_Movies`, { $id_Movies, $IMDB_tconst });

  await rescanMoviesMetaData(false, $id_Movies, $t);
  await applyMetaData(false, $id_Movies);

  if (isHandlingDuplicates) {
    return;
  }

  const duplicates = await getMovieDuplicates($id_Movies, shared.duplicatesHandling.actualDuplicate.relinkIMDB, false);

  for (let i = 0; i < duplicates.length; i++) {
    await assignIMDB(duplicates[i], $IMDB_tconst, true, null, $t);
  }
}

async function saveCurrentPage($MediaType) {
  await setSetting(`currentPageMediatype${$MediaType}`, shared.currentPage);
}

async function fetchCurrentPage($MediaType) {
  const currentPage = await getSetting(`currentPageMediatype${$MediaType}`);
  shared.currentPage = parseInt(currentPage || 1);
}

function selectBestQualityMediaURL(mediaURLs) {
  const bestQualities = ["HD", "1080p", "720p", "480p", "auto", "SD"];

  let bestURL = null;

  bestQualities.forEach((quality) => {
    if (bestURL) return;
    mediaURLs.forEach((mediaURL) => {
      if (mediaURL.definition == quality) {
        if (bestURL) return;

        bestURL = mediaURL;
      }
    });
  });

  return bestURL;
}

async function loadSettingDuplicatesHandling() {
  try {
    const loadedSetting = await getSetting(`duplicatesHandling`);

    logger.log("[loadSettingDuplicatesHandling] loadedSetting:", loadedSetting);

    if (!loadedSetting) {
      return;
    }

    const objLoadedSetting = JSON.parse(loadedSetting);

    if (objLoadedSetting.actualDuplicate) {
      Object.keys(objLoadedSetting.actualDuplicate).forEach((key) => {
        // eslint-disable-next-line no-prototype-builtins
        if (shared.duplicatesHandling.actualDuplicate.hasOwnProperty(key)) {
          shared.duplicatesHandling.actualDuplicate[key] = objLoadedSetting.actualDuplicate[key];
        }
      });
    }

    if (objLoadedSetting.metaDuplicate) {
      Object.keys(objLoadedSetting.metaDuplicate).forEach((key) => {
        // eslint-disable-next-line no-prototype-builtins
        if (shared.duplicatesHandling.metaDuplicate.hasOwnProperty(key)) {
          shared.duplicatesHandling.metaDuplicate[key] = objLoadedSetting.metaDuplicate[key];
        }
      });
    }
  } catch (e) {
    //
  }
}

async function getMovieDuplicates($id_Movies, useActualDuplicates, useMetaDuplicates, ignoreNew) {
  const result = [];

  if (!useActualDuplicates && !useMetaDuplicates) {
    logger.log("[getMovieDuplicates] bailing out");
    return [];
  }

  try {
    if (useActualDuplicates) {
      const actualDuplicates = await db.fireProcedureReturnAll(
        `
				SELECT
					MOV.id_Movies
				FROM tbl_Movies MOV
				INNER JOIN tbl_Movies MOVSource ON
					MOVSource.id_Movies = $id_Movies
					AND MOV.id_Movies <> $id_Movies                                   -- Exclude the Source
					AND MOV.Filename = MOVSource.Filename                             -- Must have same Filename (actual duplicate)
          AND MOV.Size = MOVSource.Size                                     -- Must have same Size (actual duplicate)
          AND MOV.Extra_id_Movies_Owner IS NULL                             -- Exclude Extras
          ${ignoreNew ? "AND (MOV.isNew IS NULL OR MOV.isNew = 0)" : ""}    -- optional: only newly added movies (rescan)
          `,
        { $id_Movies }
      );

      //           ${ignoreNew ? 'AND (MOV.isNew IS NULL OR MOV.isNew = 0)' : ''}    'optional: only newly added movies (rescan)

      for (let i = 0; i < actualDuplicates.length; i++) {
        //if (result.findIndex(actualDuplicates[i].id_Movies) === -1) {
        result.push(actualDuplicates[i].id_Movies);
        //}
      }
    }

    if (useMetaDuplicates) {
      const metaDuplicates = await db.fireProcedureReturnAll(
        `
			SELECT
				MOV.id_Movies
			FROM tbl_Movies MOV
			INNER JOIN tbl_Movies MOVSource ON
				MOVSource.id_Movies = $id_Movies                                    
				AND MOV.id_Movies <> $id_Movies                                     -- Exclude the Source
				AND MOV.IMDB_tconst = MOVSource.IMDB_tconst                         -- Same IMDB ID (meta Duplicate)
        AND MOV.IMDB_tconst IS NOT NULL                                     -- IMDB ID should exist
        AND MOV.Extra_id_Movies_Owner IS NULL                               -- Exclude Extras
        ${ignoreNew ? "AND (MOV.isNew IS NULL OR MOV.isNew = 0)" : ""}      -- optional: only newly added movies (rescan)
        `,
        { $id_Movies }
      );

      for (let i = 0; i < metaDuplicates.length; i++) {
        //if (result.findIndex(metaDuplicates[i].id_Movies) === -1) {
        result.push(metaDuplicates[i].id_Movies);
        //}
      }
    }

    return result;
  } catch (e) {
    logger.error(e);
    return [];
  }
}

async function ensureMovieDeleted() {
  await db.fireProcedure("DELETE FROM tbl_Movies_Genres WHERE id_Movies NOT IN (SELECT id_Movies FROM tbl_Movies)");
  await db.fireProcedure("DELETE FROM tbl_Movies_IMDB_Companies WHERE id_Movies NOT IN (SELECT id_Movies FROM tbl_Movies)");
  await db.fireProcedure("DELETE FROM tbl_Movies_IMDB_Credits WHERE id_Movies NOT IN (SELECT id_Movies FROM tbl_Movies)");
  await db.fireProcedure("DELETE FROM tbl_Movies_IMDB_Filming_Locations WHERE id_Movies NOT IN (SELECT id_Movies FROM tbl_Movies)");
  await db.fireProcedure("DELETE FROM tbl_Movies_IMDB_Plot_Keywords WHERE id_Movies NOT IN (SELECT id_Movies FROM tbl_Movies)");
  await db.fireProcedure("DELETE FROM tbl_Movies_Languages WHERE id_Movies NOT IN (SELECT id_Movies FROM tbl_Movies)");
  await db.fireProcedure("DELETE FROM tbl_Movies_Release_Attributes WHERE id_Movies NOT IN (SELECT id_Movies FROM tbl_Movies)");
  await db.fireProcedure(
    "DELETE FROM tbl_IMDB_Plot_Keywords WHERE id_IMDB_Plot_Keywords NOT IN (SELECT id_IMDB_Plot_Keywords FROM tbl_Movies_IMDB_Plot_Keywords)"
  );
}

async function updateMovieAttribute($id_Movies, attributeName, $value, useActualDuplicates, useMetaDuplicates, isHandlingDuplicates) {
  await db.fireProcedure(`UPDATE tbl_Movies SET ${attributeName} = $value WHERE id_Movies = $id_Movies`, {
    $value,
    $id_Movies,
  });

  if (!isHandlingDuplicates) {
    const duplicates = await getMovieDuplicates($id_Movies, useActualDuplicates, useMetaDuplicates);

    for (let i = 0; i < duplicates.length; i++) {
      await updateMovieAttribute(duplicates[i], attributeName, $value, useActualDuplicates, useMetaDuplicates, true);
    }

    return duplicates.concat([$id_Movies]);
  }
}

async function getIMDBRegions() {
  const regions = await db.fireProcedureReturnAll(`
    SELECT
      Code AS code
      , Name AS name
      , 0 AS selected
    FROM tbl_IMDB_Regions
  `);

  regions.forEach((region) => {
    region.selected = !!region.selected;
  });

  return regions;
}

async function getFallbackRegion() {
  if (!shared.currentLocale) {
    return;
  }

  const splitCurrentLocale = shared.currentLocale.split(/[_-]/);

  if (splitCurrentLocale.length !== 2) {
    return;
  }

  const currentRegionCode = splitCurrentLocale[1].toLowerCase();

  const regions = await getIMDBRegions();

  if (regions.length === 0) {
    return;
  }

  regions.forEach((region) => {
    if (region.code === currentRegionCode) {
      shared.fallbackRegion = Object.assign(region, {
        locale: shared.currentLocale,
      });
      logger.log("[getFallbackRegion] Fallback Region: set to", region);
    }
  });

  if (shared.fallbackRegion) {
    await setSetting("fallbackRegion", JSON.stringify(shared.fallbackRegion));
  }
}

async function getFallbackLanguage() {
  if (!shared.currentLocale) {
    return;
  }

  const splitCurrentLocale = shared.currentLocale.split(/[_-]/);

  if (splitCurrentLocale.length !== 2) {
    return;
  }

  const uiLanguageCode = splitCurrentLocale[0].toUpperCase().charAt(0) + splitCurrentLocale[0].toLowerCase().slice(1);

  const languages = await getIMDBLanguages();

  if (!languages) {
    logger.warn("[getFallbackLanguage] unable to fetch languages, abort");
    return;
  }

  logger.log("[getFallbackLanguage] languages:", languages);

  let fallbackLanguage = languages.find((lang) => lang.code === uiLanguageCode);

  if (fallbackLanguage) {
    shared.fallbackLanguage = Object.assign(fallbackLanguage, {
      locale: shared.currentLocale,
    });
    logger.log("[getFallbackLanguage] Fallback Language: set to", shared.fallbackLanguage);
  }
}

async function fetchIMDBTitleTypes() {
  return await db.fireProcedureReturnAll(`
    SELECT
      TitleType
      , Count
      , Example_Primary_Title
      , Example_Secondary_Label
      , Example_Secondary_Title
      , Example_Tertiary_Label
      , Example_Tertiary_Title
      , Link
    FROM tbl_IMDB_Title_Types
    ORDER BY Count DESC
  `);
}

async function getIMDBLanguages(regionCodes) {
  const filterRegions = !regionCodes
    ? null
    : regionCodes.reduce((prev, current) => {
        return prev + (prev ? ", " : "") + `${sqlString.escape(current)}`;
      }, "");

  const sSQL = `
  SELECT DISTINCT
    L.Code AS code
    , L.Name AS name
    , L.Name || ' (' || L.Code || ')' AS DisplayText
    , 0 AS selected
  FROM tbl_IMDB_Regions_Languages RL
  INNER JOIN tbl_IMDB_Languages L ON RL.LanguageCode = L.Code
  ${filterRegions ? `WHERE RL.RegionCode IN (${filterRegions})` : ""}
  ORDER BY L.Name
`;

  logger.log("[getIMDBLanguages] sSQL: ", sSQL);

  const languages = await db.fireProcedureReturnAll(sSQL);

  logger.log("[getIMDBLanguages] languages:", languages);

  return languages;
}

async function ensureLanguageMapping() {
  const languages = await db.fireProcedureReturnAll(`
    SELECT Code, Name FROM tbl_IMDB_Languages
  `);

  languages.forEach((language) => {
    if (languageCodeNameMapping[language.Code] && languageCodeNameMapping[language.Code] !== language.Name) {
      logger.log("[ensureLanguageMapping] Code-Name mismatch:", language);
    }
    if (!languageCodeNameMapping[language.Code]) {
      languageCodeNameMapping[language.Code] = language.Name;
    }

    if (languageNameCodeMapping[language.Name] && languageNameCodeMapping[language.Name] !== language.Code) {
      logger.log("[ensureLanguageMapping] Name-Code mismatch:", language);
    }
    if (!languageNameCodeMapping[language.Name]) {
      languageNameCodeMapping[language.Name] = language.Code;
    }
  });

  logger.log("[ensureLanguageMapping] languageNameCodeMapping:", languageCodeNameMapping);
  logger.log("[ensureLanguageMapping] languageNameCodeMapping:", languageNameCodeMapping);
}

async function fetchLanguageSettings() {
  const languagesPrimaryTitle = await getSetting("languagesPrimaryTitle");
  if (languagesPrimaryTitle) {
    shared.languagesPrimaryTitle = JSON.parse(languagesPrimaryTitle);
  }

  const languagesAudioSubtitles = await getSetting("languagesAudioSubtitles");
  if (languagesAudioSubtitles) {
    shared.languagesAudioSubtitles = JSON.parse(languagesAudioSubtitles);
  }
}

async function ensureRegions() {
  if (shared.regions && shared.regions.length > 0) {
    return;
  }

  const regions = await getSetting("regions");
  if (regions) {
    shared.regions = JSON.parse(regions);
  }
}

async function getRegions() {
  await ensureRegions();

  if (shared.regions && shared.regions.length > 0) {
    return shared.regions;
  }

  if (shared.fallbackRegion) {
    return [shared.fallbackRegion];
  }

  return null;
}

async function getAllowedTitleTypes() {
  const titleTypeWhitelist = await getSetting("IMDBTitleTypeWhitelist");
  const languagesPrimaryTitle = await getSetting("languagesPrimaryTitle");

  const result = [];

  if (titleTypeWhitelist) {
    JSON.parse(titleTypeWhitelist).forEach((titleType) => {
      if (titleType.TitleType) {
        result.push(titleType.TitleType);
      }
    });
  }

  if (languagesPrimaryTitle) {
    JSON.parse(languagesPrimaryTitle).forEach((lang) => {
      if (lang.name) {
        result.push(`${lang.name} title`);
      }
    });
  }

  return result;
}

async function fetchIMDBRatingDemographic() {
  const imdbRatingDemographic = await getSetting("IMDBRatingDemographic");

  if (imdbRatingDemographic) {
    shared.imdbRatingDemographic = imdbRatingDemographic;
  }
}

async function findMissingSourcePaths() {
  const sourcePathsDB = await db.fireProcedureReturnAll(
    `SELECT id_SourcePaths, MediaType, Path, Description, created_at, checkRemovedFiles FROM tbl_SourcePaths`
  );

  const sourcePaths = sourcePathsDB.filter((sp) => sp.checkRemovedFiles);

  for (let i = 0; i < sourcePaths.length; i++) {
    const sourcePath = sourcePaths[i];
    sourcePath.exists = await existsAsync(sourcePath.Path);
  }

  return sourcePaths.filter((sourcePath) => !sourcePath.exists);
}

async function loadLocalHistory(fileName) {
  try {
    logger.log("[loadLocalHistory] fileName:", fileName);

    const filePath = isBuild ? path.join(__dirname, "history", fileName) : helpers.getStaticPath(path.join("public", "history", fileName));

    logger.log("[loadLocalHistory] filePath:", filePath);

    const fileExists = await existsAsync(filePath);

    if (!fileExists) {
      return null;
    }

    logger.log("[loadLocalHistory] path:", filePath);

    const history = await readFileAsync(filePath);

    logger.log("[loadLocalHistory] versionInfo:", history.toString());

    return history;
  } catch (e) {
    logger.error(e);
  }
}

function getUserScanOption(key) {
  return shared.userScanOptions.find((userScanOption) => userScanOption.key === key);
}

function resetUserScanOptions() {
  shared.userScanOptions.forEach((userScanOption) => {
    userScanOption.enabled = true;
  });
}

async function fetchRatingDemographics($id_Movies) {
  const rows = await db.fireProcedureReturnAll(
    `
  SELECT
    IMDB_rating
    , IMDB_numVotes
    , IMDB_rating_males
    , IMDB_numVotes_males
    , IMDB_rating_females
    , IMDB_numVotes_females
    , IMDB_rating_aged_under_18
    , IMDB_numVotes_aged_under_18
    , IMDB_rating_males_aged_under_18
    , IMDB_numVotes_males_aged_under_18
    , IMDB_rating_females_aged_under_18
    , IMDB_numVotes_females_aged_under_18
    , IMDB_rating_aged_18_29
    , IMDB_numVotes_aged_18_29
    , IMDB_rating_males_aged_18_29
    , IMDB_numVotes_males_aged_18_29
    , IMDB_rating_females_aged_18_29
    , IMDB_numVotes_females_aged_18_29
    , IMDB_rating_aged_30_44
    , IMDB_numVotes_aged_30_44
    , IMDB_rating_males_aged_30_44
    , IMDB_numVotes_males_aged_30_44
    , IMDB_rating_females_aged_30_44
    , IMDB_numVotes_females_aged_30_44
    , IMDB_rating_aged_45_plus
    , IMDB_numVotes_aged_45_plus
    , IMDB_rating_males_aged_45_plus
    , IMDB_numVotes_males_aged_45_plus
    , IMDB_rating_females_aged_45_plus
    , IMDB_numVotes_females_aged_45_plus
    , IMDB_rating_top_1000_voters
    , IMDB_numVotes_top_1000_voters
    , IMDB_rating_us_users
    , IMDB_numVotes_us_users
    , IMDB_rating_non_us_users
    , IMDB_numVotes_non_us_users
  FROM tbl_Movies
  WHERE id_Movies = $id_Movies
    `,
    { $id_Movies }
  );

  if (!rows || !rows.length === 1) {
    return null;
  }

  const ratingDemographics = rows[0];

  Object.keys(ratingDemographics).forEach((key) => {
    if (key.includes("rating")) {
      ratingDemographics[key + "_formatted"] = ratingDemographics[key]
        ? `${ratingDemographics[key].toLocaleString(shared.uiLanguage, {
            minimumFractionDigits: 1,
          })}`
        : "";
    }

    if (key.includes("numVotes")) {
      ratingDemographics[key + "_formatted"] = ratingDemographics[key] ? `${ratingDemographics[key].toLocaleString(shared.uiLanguage)}` : "";
    }
  });

  return ratingDemographics;
}

async function saveIMDBPersonData(data) {
  logger.log("[saveIMDBPersonData] data:", data);

  // return;

  return await db.fireProcedure(
    `INSERT INTO tbl_IMDB_Persons (
          IMDB_Person_ID
          , Photo_URL
          , ShortBio
          , LongBio
          , created_at
          , updated_at
      ) VALUES (
          $IMDB_Person_ID
          , $Photo_URL
          , $ShortBio
          , $LongBio
          , DATETIME('now')
          , DATETIME('now')
      )
      ON CONFLICT(IMDB_Person_ID)
      DO UPDATE SET
          Photo_URL = excluded.Photo_URL
          , ShortBio = excluded.ShortBio
          , LongBio = excluded.LongBio
          , updated_at = DATETIME('now')
          `,
    data
  );
}

async function fetchUILanguage() {
  logger.log("[fetchUILanguage] START");

  let lang = await getSetting("uiLanguage");
  let fallbackLanguage = null;

  if (shared.fallbackLanguage) {
    fallbackLanguage = shared.fallbackLanguage.code.toLowerCase();
  }

  if (lang) {
    logger.log(`[fetchUILanguage] got previously saved language: "${lang}"`);
  }

  if (!lang) {
    if (fallbackLanguage) {
      logger.log(`[fetchUILanguage] no locale defined, fallback to "${fallbackLanguage}"`);
      lang = fallbackLanguage;
    } else {
      logger.log(`[fetchUILanguage] no locale defined, default to "en"`);
      lang = "en";
    }
  }

  // currently, we can't check for supported languages as they now rely on .json files present for i18n messages
  // if (
  //   !supportedLanguageCodes.find(
  //     (code) => code === lang
  //   )
  // ) {
  //   logger.log(
  //     `[fetchUILanguage] locale "${lang}" is not supported, fallback to "en"`
  //   );
  //   lang = "en";
  // }

  logger.log(`[fetchUILanguage] using "${lang}"`);
  return lang;
}

async function loadReleaseAttributes() {
  const savedReleaseAttributes = await getSetting("ReleaseAttributes");
  if (savedReleaseAttributes) {
    const oldSharedReleaseAttributes = JSON.parse(JSON.stringify(shared.releaseAttributes));

    shared.releaseAttributes = JSON.parse(savedReleaseAttributes);

    // merge with old shared.releaseAttribues
    oldSharedReleaseAttributes.forEach((oldAttrib) => {
      if (!shared.releaseAttributes.find((attrib) => attrib.searchTerm === oldAttrib.searchTerm && attrib.displayAs === oldAttrib.displayAs)) {
        shared.releaseAttributes.push(oldAttrib);
      }
    });
  }
}

async function saveFilterGroups() {
  await setSetting("filterGroups", JSON.stringify(shared.filterGroups));
}

async function loadFilterGroups() {
  const savedFilterGroups = await getSetting("filterGroups");
  if (savedFilterGroups) {
    const oldSharedFilterGroups = JSON.parse(JSON.stringify(shared.filterGroups));

    const filterGroups = JSON.parse(savedFilterGroups);

    shared.filterGroups = [];

    // merge and add
    filterGroups.forEach((fg) => {
      const fgo = oldSharedFilterGroups.find((fgo) => fgo.name === fg.name);
      if (fgo) {
        shared.filterGroups.push(Object.assign(fgo, fg));
      }
    });

    // add missing filterGroups
    oldSharedFilterGroups.forEach((oldFG) => {
      if (!shared.filterGroups.find((fg) => fg.name === oldFG.name)) {
        shared.filterGroups.push(oldFG);
      }
    });
  }

  logger.log("[loadFilterGroups] shared.filterGroups:", shared.filterGroups);
}

async function findReleaseAttributes(movie, onlyNew) {
  logger.log("[findReleaseAttributes] movie:", movie);

  if (onlyNew && movie.IMDB_Done) {
    logger.log("[findReleaseAttributes] nothing to do, abort");
    return;
  }

  let nameFiltered = " " + helpers.cleanupFileName(movie.Filename).toLowerCase() + " ";

  if (movie.isDirectoryBased) {
    let dirName = movie.fullDirectory;

    let lastDirectoryNameLower = helpers.getLastDirectoryName(movie.fullDirectory).toLowerCase();

    if (lastDirectoryNameLower.match(/^extra/)) {
      // we are inside a sub-directory and need to search the parent directory
      dirName = path.resolve(movie.fullDirectory, "..");
      lastDirectoryNameLower = helpers.getLastDirectoryName(dirName).toLowerCase();
    }

    // use directory name instead of filename for directory-based movie
    nameFiltered = " " + helpers.cleanupDirectoryName(lastDirectoryNameLower).toLowerCase() + " ";
  }

  logger.log("[findReleaseAttributes] nameFiltered:", nameFiltered);

  const alreadyAvailableReleaseAttributes = await db.fireProcedureReturnAll(
    `
    SELECT
      id_Movies_Release_Attributes
      , Release_Attributes_searchTerm
      , deleted
      , 0 AS foundAgain
    FROM tbl_Movies_Release_Attributes MRA WHERE MRA.id_Movies = $id_Movies
  `,
    { $id_Movies: movie.id_Movies }
  );

  logger.log("[findReleaseAttributes] alreadyAvailableReleaseAttributes:", alreadyAvailableReleaseAttributes);

  const foundSearchTerms = [];

  shared.releaseAttributes.forEach((ra) => {
    const available = alreadyAvailableReleaseAttributes.find((available) => available.Release_Attributes_searchTerm === ra.searchTerm);

    if (available) {
      // this searchTerm is already known
      available.foundAgain = true;
      return;
    }

    if (nameFiltered.includes(` ${ra.searchTerm} `)) {
      // newly found search term
      if (!foundSearchTerms.find((st) => st === ra.searchTerm)) {
        foundSearchTerms.push(ra.searchTerm);
      }
    }
  });

  logger.log("[findReleaseAttributes] foundSearchTerms:", foundSearchTerms);

  // save all newly found search terms
  for (let i = 0; i < foundSearchTerms.length; i++) {
    await db.fireProcedure(
      `
      INSERT INTO tbl_Movies_Release_Attributes (
        id_Movies
        , Release_Attributes_searchTerm
        , deleted
      ) VALUES (
        $id_Movies
        , $Release_Attributes_searchTerm
        , $deleted
      )`,
      {
        $id_Movies: movie.id_Movies,
        $Release_Attributes_searchTerm: foundSearchTerms[i],
        $deleted: false,
      }
    );
  }

  const deleteAvailableReleaseAttributes = alreadyAvailableReleaseAttributes.filter((ra) => !ra.foundAgain);

  logger.log("[findReleaseAttributes] deleteAvailableReleaseAttributes:", deleteAvailableReleaseAttributes);

  // delete all already available search terms which weren't found again
  for (let i = 0; i < deleteAvailableReleaseAttributes.length; i++) {
    await db.fireProcedure(
      `
      UPDATE tbl_Movies_Release_Attributes SET deleted = 1 WHERE id_Movies_Release_Attributes = $id_Movies_Release_Attributes
    `,
      {
        $id_Movies_Release_Attributes: deleteAvailableReleaseAttributes[i].id_Movies_Release_Attributes,
      }
    );
  }
}

function getReleaseAttributes(searchTerms) {
  const arrSearchTerms = searchTerms.split(";");

  const releaseAttributes = [];

  const shared_releaseAttributes = shared.releaseAttributes.filter((sra) => !sra.deleted);

  shared_releaseAttributes.forEach((sra) => {
    if (releaseAttributes.find((ra) => ra === sra.displayAs)) {
      return;
    }

    if (arrSearchTerms.find((st) => st === sra.searchTerm)) {
      releaseAttributes.push(sra.displayAs);
    }
  });

  return releaseAttributes;
}

function getReleaseAttributesHierarchy() {
  const shared_releaseAttributesFiltered = shared.releaseAttributes.filter((ra) => !ra.deleted);

  const releaseAttributes = [];

  for (let i = 0; i < shared_releaseAttributesFiltered.length; i++) {
    const ra = shared_releaseAttributesFiltered[i];

    const ra2 = releaseAttributes.find((ra2) => ra2.displayAs === ra.displayAs);

    if (ra2) {
      ra2.searchTerms.push(ra.searchTerm);
    } else {
      releaseAttributes.push({
        displayAs: ra.displayAs,
        searchTerms: [ra.searchTerm],
      });
    }
  }

  return releaseAttributes;
}

async function fetchFilterReleaseAttributes($MediaType) {
  logger.log("[fetchFilterReleaseAttributes] MediaType:", $MediaType);
  shared.loadingFilter = "filterReleaseAttributes";

  const filterValues = await fetchFilterValues($MediaType);

  logger.log("[fetchFilterReleaseAttributes] filterValues:", filterValues);

  const releaseAttributesHierarchy = getReleaseAttributesHierarchy();

  logger.log("[fetchFilterReleaseAttributes] releaseAttributesHierarchy:", releaseAttributesHierarchy);

  let results = [];

  let currentFilters = JSON.parse(JSON.stringify(shared.filters));
  if (!shared.filters.filterSettings.filterReleaseAttributesAND) {
    delete currentFilters.filterReleaseAttributes;
  }
  const additionalFilterQuery = generateFilterQuery(currentFilters);

  for (let i = 0; i < releaseAttributesHierarchy.length; i++) {
    const ra = releaseAttributesHierarchy[i];

    const sql = `
    SELECT COUNT(1) FROM (
      SELECT DISTINCT MRA.id_Movies
      FROM tbl_Movies_Release_Attributes MRA
      INNER JOIN tbl_Movies MOV ON MRA.id_Movies = MOV.id_Movies
      INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
      LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
      WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
      AND MRA.deleted = 0
      AND MRA.Release_Attributes_searchTerm IN (${ra.searchTerms.reduce((prev, current) => {
        return prev + (prev ? ", " : "") + `${sqlString.escape(current)}`;
      }, "")})
          ${additionalFilterQuery}        
    )
`;

    logger.log("[fetchFilterReleaseAttributes] sql:", sql);

    const NumMovies = await db.fireProcedureReturnScalar(sql, { $MediaType });

    logger.log("[fetchFilterReleaseAttributes] NumMovies:", NumMovies);

    if (NumMovies) {
      results.push({
        ReleaseAttribute: ra.displayAs,
        NumMovies,
        isAny: false,
        Selected: true,
      });
    }
  }

  const sqlAny = `
    SELECT
      '<not available>' AS ReleaseAttribute
      , 1 AS isAny
      , 1 AS Selected
      , (
          SELECT COUNT(1)
          FROM tbl_Movies MOV
          INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
          LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
          WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
                ${additionalFilterQuery}
                AND MOV.id_Movies NOT IN (
                  SELECT MRA.id_Movies
                  FROM tbl_Movies_Release_Attributes MRA
                  WHERE MRA.deleted = 0
                )
        ) AS NumMovies
    `;

  const anyResults = await db.fireProcedureReturnAll(sqlAny, { $MediaType });

  results = [anyResults[0], ...results.sort((a, b) => (a.ReleaseAttribute.toLowerCase() < b.ReleaseAttribute.toLowerCase() ? -1 : 1))];

  if (filterValues && filterValues.filterReleaseAttributes) {
    results.forEach((result) => {
      const filterReleaseAttribute = filterValues.filterReleaseAttributes.find((value) => value.ReleaseAttribute == result.ReleaseAttribute);

      if (filterReleaseAttribute) {
        result.Selected = filterReleaseAttribute.Selected;
      }

      result.NumMoviesFormatted = result.NumMovies.toLocaleString(shared.uiLanguage);
    });
  }

  logger.log("[fetchFilterReleaseAttributes] results:", results);

  shared.filters.filterReleaseAttributes = results;

  shared.loadingFilter = "";
}

async function fetchFilterVideoEncoders($MediaType) {
  logger.log("[fetchFilterVideoEncoders] MediaType:", $MediaType);
  shared.loadingFilter = "filterVideoEncoders";

  const filterValues = await fetchFilterValues($MediaType);

  logger.log("[fetchFilterVideoEncoders] filterValues:", filterValues);

  let results = [];

  let currentFilters = JSON.parse(JSON.stringify(shared.filters));
  delete currentFilters.filterVideoEncoders;
  const additionalFilterQuery = generateFilterQuery(currentFilters);

  const sql = `
  SELECT 1 AS Selected
  , IFNULL(Name, '<not available>') AS Name
  , (
    SELECT COUNT(1)
    FROM tbl_Movies MOV
    INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
    LEFT JOIN tbl_Movies_MI_Tracks MITVIDEO2 ON MITVIDEO2.type = "video" AND MOV.id_Movies = MITVIDEO2.id_Movies
    LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
    WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
        AND MOV.Extra_id_Movies_Owner IS NULL
        AND IFNULL(MITVIDEO2.Encoded_Library_Name_Trimmed, 'null') = IFNULL(SubQ.Name, 'null')
        ${additionalFilterQuery}
      ) AS NumMovies
FROM (	SELECT DISTINCT
  MITVIDEO.Encoded_Library_Name_Trimmed AS Name
  FROM tbl_Movies_MI_Tracks MITVIDEO WHERE MITVIDEO.type = "video"
) SubQ
`;

  logger.log("[fetchFilterVideoEncoders] sql:", sql);

  results = await db.fireProcedureReturnAll(sql, { $MediaType });

  if (filterValues && filterValues.filterVideoEncoders) {
    results.forEach((result) => {
      const filterVideoEncoder = filterValues.filterVideoEncoders.find((value) => value.Name == result.Name);

      if (filterVideoEncoder) {
        result.Selected = filterVideoEncoder.Selected;
      }

      result.NumMoviesFormatted = result.NumMovies.toLocaleString(shared.uiLanguage);
    });
  }

  logger.log("[fetchFilterVideoEncoders] results:", results);

  shared.filters.filterVideoEncoders = results;

  shared.loadingFilter = "";
}

async function fetchFilterAudioFormats($MediaType) {
  logger.log("[fetchFilterAudioFormats] MediaType:", $MediaType);
  shared.loadingFilter = "filterAudioFormats";

  const filterValues = await fetchFilterValues($MediaType);

  logger.log("[fetchFilterAudioFormats] filterValues:", filterValues);

  let results = [];

  let currentFilters = JSON.parse(JSON.stringify(shared.filters));
  delete currentFilters.filterAudioFormats;
  const additionalFilterQuery = generateFilterQuery(currentFilters);

  const sql = `
  SELECT 1 AS Selected
  , IFNULL(Name, '<not available>') AS Name
  , (
    SELECT COUNT(1)
    FROM tbl_Movies MOV
    INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
    LEFT JOIN tbl_Movies_MI_Tracks MITAUDIO2 ON MITAUDIO2.type = "audio" AND MOV.id_Movies = MITAUDIO2.id_Movies
    LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
    WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
        AND MOV.Extra_id_Movies_Owner IS NULL
        AND IFNULL(MITAUDIO2.Format, 'null') = IFNULL(SubQ.Name, 'null')
        ${additionalFilterQuery}
      ) AS NumMovies
FROM (	SELECT DISTINCT
  MITAUDIO.Format AS Name
  FROM tbl_Movies_MI_Tracks MITAUDIO WHERE MITAUDIO.type = "audio"
) SubQ
`;

  logger.log("[fetchFilterAudioFormats] sql:", sql);

  results = await db.fireProcedureReturnAll(sql, { $MediaType });

  if (filterValues && filterValues.filterAudioFormats) {
    results.forEach((result) => {
      const filterAudioFormat = filterValues.filterAudioFormats.find((value) => value.Name == result.Name);

      if (filterAudioFormat) {
        result.Selected = filterAudioFormat.Selected;
      }

      result.NumMoviesFormatted = result.NumMovies.toLocaleString(shared.uiLanguage);
    });
  }

  logger.log("[fetchFilterAudioFormats] results:", results);

  shared.filters.filterAudioFormats = results;

  shared.loadingFilter = "";
}

function resetFilters(objFilter) {
  if (!objFilter) {
    objFilter = shared.filters;
  }

  const before = JSON.stringify(objFilter);

  Object.keys(objFilter).forEach((key) => {
    logger.log("[resetFilters] ", key);

    if (key === "Selected") {
      logger.log('  is "Selected" -> set to "true"');
      objFilter[key] = true;
      return;
    }

    if (key === "Excluded") {
      logger.log('  is "Excluded" -> set to "false"');
      objFilter[key] = false;
      return;
    }

    if (key === "filterSettings") {
      logger.log('  is "filterSettings" -> Select All of them to "false"');
      Object.keys(objFilter[key]).forEach((subkey) => {
        objFilter[key][subkey] = false;
      });
      return;
    }

    if (key === "filterMetacriticScore") {
      logger.log('  is "filterMetacriticScore" -> reset to [0, 100]');
      objFilter[key] = [0, 100];
      return;
    }

    if (key === "filterReleaseYears") {
      logger.log('  is "filterReleaseYears" -> reset to [min, max]');
      objFilter[key] = [shared.filters.filterReleaseYearsMin, shared.filters.filterReleaseYearsMax];
      return;
    }

    if (key === "filterIMDBRating") {
      logger.log('  is "filterIMDBRating" -> reset to [0, 10]');
      objFilter[key] = [0, 10];
      return;
    }

    if (_.isPlainObject(objFilter[key])) {
      logger.log("  is Object -> recurse");
      resetFilters(objFilter[key]);
      return;
    }

    if (_.isArray(objFilter[key])) {
      logger.log("  is Array -> recurse elements");

      for (let i = 0; i < objFilter[key].length; i++) {
        resetFilters(objFilter[key][i]);
      }
      return;
    }

    if (_.isBoolean(objFilter[key])) {
      logger.log('  is Boolean -> reset to "true"');
      objFilter[key] = true;
    }
  });

  const after = JSON.stringify(objFilter);

  return before != after;
}

async function removeReleaseAttributeFromMovie($id_Movies, releaseAttribute) {
  const releaseAttributesHierarchy = getReleaseAttributesHierarchy();

  const ra = releaseAttributesHierarchy.find((r) => r.displayAs === releaseAttribute);

  const sql = `
    UPDATE tbl_Movies_Release_Attributes SET deleted = 1 WHERE id_Movies = $id_Movies AND Release_Attributes_searchTerm IN (${ra.searchTerms
      .map((param) => param.replace(/'/g, "''"))
      .reduce((prev, current) => {
        return prev + (prev ? ", " : "") + `${sqlString.escape(current)}`;
      }, "")})
  `;

  await db.fireProcedure(sql, { $id_Movies });

  return;
}

async function ensureToolPath(executable, settingName) {
  const toolPath = await getSetting(settingName);

  if (toolPath) {
    return;
  }

  let toolpath = null; // no path is set, for win we can use shipped vlc and mediainfo, for mac we could wildly guess

  if (process.platform === "win32") {
    if (executable === "vlc") {
      toolpath = helpers.getStaticPath(path.join("bin", "win", "vlc", "vlc.exe"));
      logger.log("[ensureToolPath] VLC path:", toolpath);
    }
    if (executable === "mediainfo") {
      // use ./bin/win/mediainfo-cli/MediaInfo.exe
      toolpath = helpers.getStaticPath(path.join("bin", "win", "mediainfo-cli", "MediaInfo.exe"));
      logger.log("[ensureToolPath] MediaInfo CLI path:", toolpath);
    }
  }

  // MacOS wild guess: VLC may be available at /Applications/VLC.app/Contents/MacOS/VLC
  if (process.platform === "darwin" && executable === "vlc") {
    toolpath = "/Applications/VLC.app/Contents/MacOS/VLC";
  }

  // check if the application is available and save
  if (await existsAsync(toolpath)) {
    setSetting(settingName, toolpath);
    return;
  }

  // use which/where to find the application (possibly it is already installed)
  let lookupTask = "";

  if (helpers.isWindows) {
    // use where
    lookupTask = `where ${executable}`;
  } else {
    // use which
    lookupTask = `which ${executable}`;
  }

  try {
    logger.log("[ensureToolPath] lookupTask:", lookupTask);

    const { stdout, stderr } = await execAsync(lookupTask);

    if (stderr) {
      logger.error(stderr);
      return;
    }

    logger.log("[ensureToolPath] stdout:", stdout);

    // if (helpers.isWindows) {
    const arrStdOut = stdout.split("\n");
    for (let i = 0; i < arrStdOut.length; i++) {
      const path = arrStdOut[i].trim();

      logger.log("[ensureToolPath] checking path:", path);

      if (await helpers.existsAsync(path)) {
        logger.log("[ensureToolPath] path found at:", path);
        setSetting(settingName, path);
        return;
      }
    }
    /*
    } else {
      const arrStdOut = stdout.split('\n');
      for (let i = 0; i < arrStdOut.length; i++) {
        const arrLine = arrStdOut[i].split(' ');

        for (let j = 0; j < arrLine.length; j++) {
          const path = arrLine[j].trim();

          logger.log('[ensureToolPath] checking path:', path);

          if (await helpers.existsAsync(path)) {
            logger.log('[ensureToolPath] path found at:', path);
            setSetting(settingName, path);
            return;
          }
        }
      }
    }
    */
  } catch (err) {
    logger.log("[ensureToolPath] tool not found or error:", err);
  }
}

async function getMinimumWaitForSetAccess() {
  const value = await getSetting("minimumWaitForSetAccess");

  if (value === undefined || value === null) {
    return 60;
  }

  return value;
}

async function ensureLogLevel() {
  if (!isBuild) {
    setLogLevel(0);
  }

  const savedLogLevel = await getSetting("LogLevel");

  if (savedLogLevel === 0 || savedLogLevel) {
    setLogLevel(+savedLogLevel);
  }
}

function setLogLevel(level) {
  shared.logLevel = level;

  logger.setLevel(level);

  // eslint-disable-next-line no-console
  console.log("[setLogLevel] logLevel set to", logger.getLevel());
}

function routeTo(router, route) {
  router.push(route).catch((err) => {
    if (err.name != "NavigationDuplicated") {
      logger.error(err);
    }
  });
}

async function fetchNumMovies($MediaType) {
  const numMovies = await db.fireProcedureReturnScalar(
    `
    SELECT COUNT(1) FROM tbl_Movies MOV
      WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
            AND MOV.Extra_id_Movies_Owner IS NULL
            AND MOV.id_SourcePaths IN (SELECT id_SourcePaths FROM tbl_SourcePaths WHERE MediaType = $MediaType)
  `,
    { $MediaType }
  );

  return numMovies.toLocaleString(shared.uiLanguage);
}

async function updateMediaRecordField($id_Movies, FieldName, $Value) {
  const query = `UPDATE tbl_Movies SET ${FieldName} = $Value WHERE id_Movies = $id_Movies`;
  await db.fireProcedure(query, { $id_Movies, $Value });
}

/**
 *
 * @param {Integer} $id_Movies
 * @param {Array<String>} genres e.g. ['action', 'adventure', 'sci-fi']
 */
async function updateMovieGenres($id_Movies, genres) {
  const availableGenres = await db.fireProcedureReturnAll("SELECT id_Genres, GenreID, Name FROM tbl_Genres", []);

  const movieGenres = await db.fireProcedureReturnAll(
    "SELECT MG.id_Movies_Genres, MG.id_Genres, G.GenreID, G.Name, 0 AS Found FROM tbl_Movies_Genres MG INNER JOIN tbl_Genres G ON MG.id_Genres = G.id_Genres WHERE MG.id_Movies = $id_Movies",
    { $id_Movies }
  );

  for (let i = 0; i < genres.length; i++) {
    const genre = genres[i].toLowerCase();

    const movieGenre = movieGenres.find((mg) => mg.GenreID === genre);

    if (movieGenre) {
      // genre is already known
      movieGenre.Found = true;
    } else {
      // genre needs to be added for the movie
      if (!availableGenres.find((g) => g.GenreID === genre)) {
        // genre needs to be added to main list of genres (we need id_Genres later)
        await db.fireProcedure("INSERT INTO tbl_Genres (GenreID, Name) VALUES ($GenreID, $Name)", { $GenreID: genre, $Name: helpers.uppercaseEachWord(genre) });
        const id_Genres = await db.fireProcedureReturnScalar("SELECT id_Genres FROM tbl_Genres WHERE GenreID = $GenreID", { $GenreID: genre });
        availableGenres.push({
          id_Genres: id_Genres,
          GenreID: genre,
          Name: helpers.uppercaseEachWord(genre),
        });
      }

      const id_Genres = availableGenres.find((g) => g.GenreID === genre).id_Genres;
      await db.fireProcedure("INSERT INTO tbl_Movies_Genres (id_Movies, id_Genres) VALUES ($id_Movies, $id_Genres)", { $id_Movies, $id_Genres: id_Genres });
    }
  }

  // remove existing genres that are not available anymore (e.g. re-link to another imdb entry)
  for (let i = 0; i < movieGenres.length; i++) {
    const movieGenre = movieGenres[i];

    if (!movieGenre.Found) {
      // logger.log('[updateMovieGenres] removing genre', movieGenre);

      await db.fireProcedure("DELETE FROM tbl_Movies_Genres WHERE id_Movies_Genres = $id_Movies_Genres", { $id_Movies_Genres: movieGenre.id_Movies_Genres });
    }
  }
}

/**
 *
 * @param {Integer} $id_Movies
 * @param {String} searchTermsString Semicolon separated list of search terms
 */
async function updateMovieReleaseAttribues($id_Movies, searchTermsString) {
  const searchTerms = searchTermsString.split(";");
  const searchTermsHave = (
    await db.fireProcedureReturnAll(
      `SELECT Release_Attributes_searchTerm FROM tbl_Movies_Release_Attributes WHERE id_Movies = $id_Movies AND (deleted IS NULL OR deleted = 0)`,
      { $id_Movies }
    )
  ).map((row) => row.Release_Attributes_searchTerm);
  const searchTermsHaveDeleted = (
    await db.fireProcedureReturnAll(`SELECT Release_Attributes_searchTerm FROM tbl_Movies_Release_Attributes WHERE id_Movies = $id_Movies AND deleted = 1`, {
      $id_Movies,
    })
  ).map((row) => row.Release_Attributes_searchTerm);

  logger.log("[updateMovieReleaseAttribues] searchTerms:", searchTerms);
  logger.log("[updateMovieReleaseAttribues] searchTermsHave:", searchTermsHave);
  logger.log("[updateMovieReleaseAttribues] searchTermsHaveDeleted:", searchTermsHaveDeleted);

  // remove searchTerms that have been deleted
  for (let i = 0; i < searchTermsHave.length; i++) {
    const $searchTermHave = searchTermsHave[i];

    if (!searchTerms.find((searchTerm) => searchTerm === $searchTermHave)) {
      logger.log("[updateMovieReleaseAttribues] REMOVE:", $searchTermHave);
      await db.fireProcedure(
        `UPDATE tbl_Movies_Release_Attributes SET deleted = 1 WHERE id_Movies = $id_Movies AND Release_Attributes_searchTerm = $searchTermHave`,
        { $id_Movies, $searchTermHave }
      );
    }
  }

  // add searchTerms that have been added
  for (let i = 0; i < searchTerms.length; i++) {
    const $searchTerm = searchTerms[i];

    if (!$searchTerm) {
      continue;
    }

    if (!searchTermsHave.find((searchTermHave) => searchTermHave === $searchTerm)) {
      // not already stored
      if (searchTermsHaveDeleted.find((searchTermHaveDeleted) => searchTermHaveDeleted === $searchTerm)) {
        // previously deleted searchTerm -> just UPDATE the record
        logger.log("[updateMovieReleaseAttribues] UNDELETE:", $searchTerm);
        await db.fireProcedure(
          `UPDATE tbl_Movies_Release_Attributes SET deleted = 0 WHERE id_Movies = $id_Movies AND Release_Attributes_searchTerm = $searchTerm`,
          { $id_Movies, $searchTerm }
        );
      } else {
        // unknown searchTerm -> INSERT the record
        logger.log("[updateMovieReleaseAttribues] INSERT:", $searchTerm);
        await db.fireProcedure(
          `
        INSERT INTO tbl_Movies_Release_Attributes (
          id_Movies
          , Release_Attributes_searchTerm
          , deleted
        ) VALUES (
          $id_Movies
          , $searchTerm
          , $deleted
        )`,
          {
            $id_Movies,
            $searchTerm,
            $deleted: false,
          }
        );
      }
    }
  }
}

/**
 * Returns an array of fieldnames which have been (re-)defined by the user and not the scraper
 * On the database DefinedByUser is a string, e.g. "|field1|,|field2|" so this is queryable with LIKE '%|field1|%'
 * @param {Integer} $id_Movies
 */
async function fetchMovieFieldsDefinedByUser($id_Movies) {
  const definedByUser = await db.fireProcedureReturnScalar(`SELECT DefinedByUser FROM tbl_Movies WHERE id_Movies = $id_Movies`, { $id_Movies });

  return getFieldsDefinedByUser(definedByUser);
}

function getFieldsDefinedByUser(definedByUserString) {
  return !definedByUserString ? [] : definedByUserString.split(",").map((item) => item.match(/^\|(.*?)\|/)[1]);
}

/**
 * Check if the IMDB tconst is plausible, if not, a scanError will be added
 * @param {Integer} $id_Movies
 */
async function verifyIMDBtconst($id_Movies) {
  const queryMovie = `
  SELECT
    scanErrors
    , MI_Duration_Seconds
    , IMDB_runtimeMinutes
    , IMDB_startYear
    , Filename
    , isDirectoryBased
    , RelativeDirectory
    FROM tbl_Movies WHERE id_Movies = $id_Movies
  `;

  logger.log("[verifyIMDBtconst] query:", queryMovie, "$id_Movies:", $id_Movies);

  const rowsMovie = await db.fireProcedureReturnAll(queryMovie, { $id_Movies });

  logger.log("[verifyIMDBtconst] rowsMovie:", rowsMovie);

  const movie = rowsMovie[0];

  movie.scanErrors = movie.scanErrors ? JSON.parse(movie.scanErrors) : {};
  delete movie.scanErrors["IMDB link verification"];

  // compare runtimes (both must be non-null)
  logger.log("[verifyIMDBtconst] movie.IMDB_runtimeMinutes:", movie.IMDB_runtimeMinutes);
  logger.log("[verifyIMDBtconst] movie.MI_Duration_Seconds:", movie.MI_Duration_Seconds);

  if (movie.IMDB_runtimeMinutes && movie.MI_Duration_Seconds) {
    const MI_runtimeMinutes = parseInt(movie.MI_Duration_Seconds) / 60;

    const diff = Math.abs(parseInt(movie.IMDB_runtimeMinutes) - MI_runtimeMinutes);

    logger.log("[verifyIMDBtconst] diff:", diff);

    if (diff > 4) {
      movie.scanErrors["IMDB link verification"] = {
        message:
          "Warning: the actual runtime of the movie ({runtimeMovie}min) deviates by at least 5 minutes from the runtime reported by IMDB ({runtimeIMDB}min)_ Please check if the correct IMDB entry is used here_",
        data: {
          runtimeMovie: parseInt(MI_runtimeMinutes),
          runtimeIMDB: parseInt(movie.IMDB_runtimeMinutes),
        },
      };
    }
  }

  if (!movie.scanErrors["IMDB link verification"] && movie.IMDB_startYear) {
    const arrYears = movie.isDirectoryBased
      ? helpers.getYearsFromFileName(helpers.getLastDirectoryName(movie.RelativeDirectory), false)
      : helpers.getYearsFromFileName(movie.Filename, false);

    logger.log("[verifyIMDBtconst] arrYears:", arrYears);

    let yearDiff = -1;
    let yearMovie = -1;

    arrYears.forEach((year) => {
      const diff = Math.abs(year - parseInt(movie.IMDB_startYear));

      if (yearDiff === -1 || diff < yearDiff) {
        yearDiff = diff;
        yearMovie = year;
      }
    });

    if (yearDiff !== -1 && yearDiff > 1) {
      movie.scanErrors["IMDB link verification"] = {
        message:
          "Warning: the release date provided in the file/directory name ({yearMovie}) deviates by at least 2 years from the one reported by IMDB ({yearIMDB})_ Please check if the correct IMDB entry is used here_",
        data: {
          yearMovie,
          yearIMDB: movie.IMDB_startYear,
        },
      };
    }
  }

  if (JSON.stringify(movie.scanErrors) === "{}") {
    await db.fireProcedure(
      `
      UPDATE tbl_Movies SET scanErrors = NULL WHERE id_Movies = $id_Movies
    `,
      { $id_Movies }
    );
  } else {
    await db.fireProcedure(
      `
      UPDATE tbl_Movies
        SET	scanErrors = $scanErrors
      WHERE id_Movies = $id_Movies
      `,
      {
        $id_Movies,
        $scanErrors: JSON.stringify(movie.scanErrors),
      }
    );
  }

  logger.log("[verifyIMDBtconst] movie:", movie);
}

export {
  db,
  doAbortRescan,
  definedError,
  existsAsync,
  fetchSourcePaths,
  rescan,
  rescanItems,
  fetchMedia,
  clearRating,
  setRating,
  getSetting,
  setSetting,
  launchMovie,
  fetchFilterSettings,
  fetchFilterSourcePaths,
  fetchFilterGenres,
  fetchFilterAgeRatings,
  fetchFilterRatings,
  fetchFilterLists,
  fetchFilterParentalAdvisory,
  fetchFilterPersons,
  fetchFilterIMDBPlotKeywords,
  fetchFilterIMDBFilmingLocations,
  fetchFilterYears,
  // fetchFilterReleaseYears,
  fetchFilterQualities,
  fetchFilterCompanies,
  fetchFilterLanguages,
  fetchFilterIMDBRating,
  fetchFilterMetacriticScore,
  fetchFilterReleaseAttributes,
  fetchFilterDataQuality,
  fetchFilterVideoEncoders,
  fetchFilterAudioFormats,
  abortRescan,
  resetAbortRescan,
  createList,
  addToList,
  removeFromList,
  clearList,
  fetchLists,
  getMovieDetails,
  setLastAccess,
  getCurrentTime,
  fetchMovieCredits,
  fetchMovieCompanies,
  fetchIMDBPerson,
  fetchNumMoviesForPerson,
  addFilterPerson,
  deleteFilterPerson,
  addFilterCompany,
  deleteFilterCompany,
  addFilterIMDBPlotKeyword,
  addFilterIMDBFilmingLocation,
  deleteFilterIMDBPlotKeyword,
  deleteFilterIMDBFilmingLocation,
  assignIMDB,
  fetchSortValues,
  saveSortValues,
  saveCurrentPage,
  fetchCurrentPage,
  selectBestQualityMediaURL,
  getMovieDuplicates,
  ensureMovieDeleted,
  updateMovieAttribute,
  getIMDBRegions,
  getIMDBLanguages,
  fetchIMDBTitleTypes,
  getFallbackLanguage,
  fetchLanguageSettings,
  fetchMoviePlotKeywords,
  fetchMovieFilmingLocations,
  findMissingSourcePaths,
  loadLocalHistory,
  resetUserScanOptions,
  fetchRatingDemographics,
  saveIMDBPersonData,
  fetchUILanguage,
  generateLanguageArray,
  findReleaseAttributes,
  resetFilters,
  getReleaseAttributesHierarchy,
  removeReleaseAttributeFromMovie,
  getMinimumWaitForSetAccess,
  setLogLevel,
  routeTo,
  fetchNumMovies,
  // ensureFilterReleaseYearsRange,
  saveFilterValues,
  updateMediaRecordField,
  updateMovieGenres,
  updateMovieReleaseAttribues,
  fetchMovieFieldsDefinedByUser,
  getFieldsDefinedByUser,
  deleteIMDBData,
  saveFilterGroups,
  applyMediaInfo,
};
