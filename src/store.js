const fs = require("fs");
const util = require("util");
const { dialog } = require("electron").remote;
const logger = require("loglevel");
const child_process = require("child_process");
const xml2js = require("xml2js");
// const textVersion = require("textversionjs");
// const moment = require("moment");
const levenshtein = require("fast-levenshtein");
const osLocale = require("os-locale");

const readdirAsync = util.promisify(fs.readdir);
const existsAsync = util.promisify(fs.exists);
const statAsync = util.promisify(fs.stat);
const execAsync = util.promisify(child_process.exec);
const readFileAsync = util.promisify(fs.readFile);

const path = require("path");
// import path from "path";

import { eventBus } from "@/main";

const db = require("./helpers/db");
// import * as db from "@/helpers/db";

const dbsyncSQLite = require("./helpers/dbsync-sqlite");
// import * as dbsyncSQLite from "@/helpers/dbsync-sqlite";

const helpers = require("./helpers/helpers");
// import * as helpers from "@/helpers/helpers";

const {
  languageNameCodeMapping,
  languageCodeNameMapping,
} = require("./languages");
// import { languageNameCodeMapping, languageCodeNameMapping } from "@/languages";

const { shared } = require("./shared");

const {
  scrapeIMDBmainPageData,
  scrapeIMDBplotSummary,
  scrapeIMDBCompaniesData,
  scrapeIMDBFullCreditsData,
  scrapeIMDBParentalGuideData,
  scrapeIMDBreleaseinfo,
  scrapeIMDBtechnicalData,
  scrapeIMDBSuggestion,
  scrapeIMDBplotKeywords,
  scrapeIMDBFilmingLocations,
  scrapeIMDBRatingDemographics,
} = require("./imdb-scraper");

const definedError = require("@/helpers/defined-error");

const isBuild = process.env.NODE_ENV === "production";

if (!isBuild) {
  logger.setLevel(0);
}

// eslint-disable-next-line no-console
console.log("logLevel:", logger.getLevel());

let isScanning = false;
let doAbortRescan = false;

let currentScanInfoHeader = "";

let dbsync = dbsyncSQLite;

dbsync.runSync(
  helpers.getPath("data/mediabox.db_initial"),
  helpers.getPath("data/mediabox.db"),
  { doCreateTables: true, doCreateColumns: true, doCopyContent: true },
  (err) => {
    if (err) {
      if (err.error && err.error.errorCode == "SYNCERR") {
        dialog.showMessageBox(null, {
          type: "error",
          title: "MediaBox - DB Sync Error",
          message: err.error.message,
        });
        logger.error("ERROR:", err);
        return;
      }

      logger.log("WARN:", err);
    }

    db.initDbCB((err) => {
      if (err) {
        return logger.error(err);
      }

      (async () => {
        await createIndexes(db);

        await loadSettingDuplicatesHandling();

        shared.currentLocale = await osLocale();

        logger.log("shared.currentLocale:", shared.currentLocale);

        const fallbackRegion = await getSetting("fallbackRegion");
        if (fallbackRegion) {
          const fallbackRegionObj = JSON.parse(fallbackRegion);

          if (fallbackRegionObj.locale === shared.currentLocale) {
            shared.fallbackRegion = fallbackRegionObj;
            logger.log("Fallback Region (from db):", shared.fallbackRegion);
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

        shared.uiLanguage = await fetchUILanguage();
      })();
    });
  }
);

function generateIndexQuery(tableName, ColumnNames, isUnique) {
  const columnNamesString = ColumnNames.reduce((prev, current) => {
    return prev + (prev ? ", " : "") + `${current}`;
  }, "");

  return `CREATE ${
    isUnique ? "UNIQUE " : ""
    } INDEX IF NOT EXISTS main.IDX_${tableName}_${columnNamesString.replace(
      /, /g,
      "_"
    )} ON ${tableName} (${columnNamesString})`;
}

async function createIndexes(db) {
  logger.log("creating indexes...");

  const queries = [
    generateIndexQuery("tbl_Genres", ["GenreID"], true),
    generateIndexQuery("tbl_Movies", ["id_SourcePaths"], false),
    generateIndexQuery("tbl_Movies", ["MI_Duration_Seconds"], false),
    generateIndexQuery("tbl_Movies", ["MI_Quality"], false),
    generateIndexQuery("tbl_Movies", ["MI_Aspect_Ratio"], false),
    generateIndexQuery("tbl_Movies", ["IMDB_tconst"], false),
    generateIndexQuery("tbl_Movies", ["IMDB_releaseType"], false),
    generateIndexQuery("tbl_Movies", ["IMDB_startYear"], false),
    generateIndexQuery("tbl_Movies", ["IMDB_runtimeMinutes"], false),
    generateIndexQuery("tbl_Movies", ["IMDB_rating"], false),
    generateIndexQuery("tbl_Movies", ["IMDB_numVotes"], false),
    generateIndexQuery("tbl_Movies", ["IMDB_metacriticScore"], false),
    generateIndexQuery("tbl_Movies", ["Extra_id_Movies_Owner"], false),
    generateIndexQuery("tbl_Movies_Genres", ["id_Movies"], false),
    generateIndexQuery("tbl_Movies_Genres", ["id_Genres"], false),
    generateIndexQuery("tbl_Settings", ["Key"], true),
    generateIndexQuery("tbl_SourcePaths", ["MediaType"], false),
    generateIndexQuery("tbl_SourcePaths", ["Description"], false),
    generateIndexQuery("tbl_Movies_IMDB_Credits", ["id_Movies"], false),
    generateIndexQuery("tbl_Movies_IMDB_Credits", ["IMDB_Person_ID"], false),
    generateIndexQuery(
      "tbl_Movies_IMDB_Credits",
      ["id_Movies", "Category", "IMDB_Person_ID"],
      true
    ),
    generateIndexQuery("tbl_Movies_IMDB_Credits", ["Person_Name"], false),
    generateIndexQuery("tbl_Movies_IMDB_Companies", ["id_Movies"], false),
    generateIndexQuery("tbl_Movies_IMDB_Companies", ["IMDB_Company_ID"], false),
    generateIndexQuery(
      "tbl_Movies_IMDB_Companies",
      ["id_Movies", "Category", "IMDB_Company_ID"],
      true
    ),
    generateIndexQuery("tbl_Movies_IMDB_Companies", ["Company_Name"], false),
    generateIndexQuery("tbl_IMDB_Persons", ["IMDB_Person_ID"], true),
    generateIndexQuery("tbl_Movies_Languages", ["Type"], false),
    generateIndexQuery("tbl_Movies_Languages", ["Language"], false),
    generateIndexQuery("tbl_Movies_Languages", ["id_Movies"], false),
    generateIndexQuery(
      "tbl_Movies_Languages",
      ["id_Movies", "Type", "Language"],
      true
    ),
    generateIndexQuery("tbl_IMDB_Plot_Keywords", ["Keyword"], true),
    generateIndexQuery("tbl_Movies_IMDB_Plot_Keywords", ["id_Movies"], false),
    generateIndexQuery(
      "tbl_Movies_IMDB_Plot_Keywords",
      ["id_IMDB_Plot_Keywords"],
      false
    ),
    generateIndexQuery(
      "tbl_Movies_IMDB_Plot_Keywords",
      ["id_Movies", "id_IMDB_Plot_Keywords"],
      true
    ),
    generateIndexQuery("tbl_IMDB_Filming_Locations", ["Location"], true),
    generateIndexQuery(
      "tbl_Movies_IMDB_Filming_Locations",
      ["id_Movies"],
      false
    ),
    generateIndexQuery(
      "tbl_Movies_IMDB_Filming_Locations",
      ["id_IMDB_Filming_Locations"],
      false
    ),
    generateIndexQuery(
      "tbl_Movies_IMDB_Filming_Locations",
      ["id_Movies", "id_IMDB_Filming_Locations"],
      true
    ),
  ];

  logger.log("queries:", queries);

  for (let i = 0; i < queries.length; i++) {
    logger.log(".");
    await db.fireProcedure(queries[i]);
  }

  logger.log("index creation done");
}

async function fetchSourcePaths() {
  const result = await db.fireProcedureReturnAll(
    `
			SELECT 
			id_SourcePaths
			, MediaType
			, Path
			, Description
			, created_at
			, checkRemovedFiles
		FROM tbl_SourcePaths`,
    []
  );

  return result;
}

async function rescan(onlyNew) {
  isScanning = true;
  eventBus.rescanStarted();

  if (shared.scanOptions.filescanMovies) await filescanMovies(onlyNew);
  if (shared.scanOptions.rescanMoviesMetaData)
    await rescanMoviesMetaData(onlyNew);

  // await rescanSeries();								// TODO: Series support

  if (shared.scanOptions.mergeExtras) await mergeExtras(onlyNew);

  if (shared.scanOptions.handleDuplicates) await rescanHandleDuplicates();

  // clear isNew flag from all entries
  await db.fireProcedure(`UPDATE tbl_Movies SET isNew = 0`, []);

  isScanning = false;
  doAbortRescan = false;
  eventBus.rescanStopped();
}

async function rescanHandleDuplicates() {
  // const KILLME = 1;
  // if (KILLME === 1) return;

  logger.log("### rescanHandleDuplicates ###");

  eventBus.setProgressBar(2); // marquee

  const newMovies = await db.fireProcedureReturnAll(
    "SELECT id_Movies FROM tbl_Movies WHERE isNew = 1 AND Extra_id_Movies_Owner IS NULL"
  );

  logger.log("newMovies:", newMovies);

  const arrNewMovies = newMovies.map((movie) => movie.id_Movies);

  logger.log("arrNewMovies:", arrNewMovies);

  for (let i = 0; i < arrNewMovies.length; i++) {
    const $id_Movies = arrNewMovies[i];

    const currentMovie = (await db.fireProcedureReturnAll(
      "SELECT * FROM tbl_Movies WHERE id_Movies = $id_Movies",
      { $id_Movies }
    ))[0];

    logger.log("currentMovie:", currentMovie);

    const actualDuplicates = await getMovieDuplicates(
      $id_Movies,
      true,
      false,
      true
    );
    const metaDuplicates = await getMovieDuplicates(
      $id_Movies,
      false,
      true,
      true
    );

    // even if there are multiple duplicates possible, we just take the first ones
    const actualDuplicate =
      actualDuplicates.length > 0
        ? (await db.fireProcedureReturnAll(
          "SELECT * FROM tbl_Movies WHERE id_Movies = $id_Movies",
          { $id_Movies: actualDuplicates[0] }
        ))[0]
        : null;
    const metaDuplicate =
      metaDuplicates.length > 0
        ? (await db.fireProcedureReturnAll(
          "SELECT * FROM tbl_Movies WHERE id_Movies = $id_Movies",
          { $id_Movies: metaDuplicates[0] }
        ))[0]
        : null;

    // relink IMDB is alread handled by findIMDBtconst
    // if (shared.duplicatesHandling.actualDuplicate.relinkIMDB && currentMovie.IMDB_tconst && actualDuplicate.IMDB_tconst && currentMovie.IMDB_tconst !== actualDuplicate.IMDB_tconst) {
    //   await assignIMDB($id_Movies, actualDuplicate.IMDB_tconst, true, true);
    // }

    // addToList
    if (
      (shared.duplicatesHandling.actualDuplicate.addToList &&
        actualDuplicate) ||
      (shared.duplicatesHandling.metaDuplicate.addToList && metaDuplicate)
    ) {
      logger.log("addToList by duplicate");

      const duplicate =
        shared.duplicatesHandling.actualDuplicate.addToList && actualDuplicate
          ? actualDuplicate
          : metaDuplicate;

      logger.log("addToList duplicate:", duplicate);

      const inLists = await db.fireProcedureReturnAll(
        "SELECT id_Lists FROM tbl_Lists_Movies WHERE id_Movies = $id_Movies",
        { $id_Movies: duplicate.id_Movies }
      );

      logger.log("addToList inLists:", inLists);

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

async function mergeExtras(onlyNew) {
  if (!shared.scanOptions.mergeExtras) {
    return;
  }

  eventBus.setProgressBar(2); // marquee

  const children = await db.fireProcedureReturnAll(`
	SELECT
		id_Movies
		, Path
		, Directory
		, Filename
		, Name
		, Name2
		, IMDB_tconst
	FROM tbl_Movies MOV
	WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
		AND Filename LIKE '% - extra%'
		AND Extra_id_Movies_Owner IS NULL
		${onlyNew ? "AND MOV.isNew = 1" : ""}
	`);

  logger.log("Extra children:", children);

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    await mergeExtra(child);
  }

  eventBus.setProgressBar(-1); // off
}

async function mergeExtra(movie) {
  logger.log("merging Extra:", movie);

  const rxMovieName = /(^.*?) - extra/i;
  if (!rxMovieName.test(movie.Filename)) {
    logger.log("Extra name not identifyable in:", movie.Filename);
    return;
  }

  const $movieName = movie.Filename.match(rxMovieName)[1].trim();

  logger.log("identified $movieName:", $movieName);

  let possibleParents = await db.fireProcedureReturnAll(`
		SELECT
			id_Movies
			, Path
			, Directory
			, Filename
			, Name
			, Name2
			, IMDB_tconst
		FROM tbl_Movies MOV
		WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
			AND Filename NOT LIKE '% - extra%'
			AND Filename LIKE '${$movieName.replace("'", "_")}%'
	`);

  logger.log("possibleParents:", possibleParents);

  if (possibleParents.length == 0) {
    logger.log("no possible parent found :(");
    return;
  }

  if (possibleParents.length == 1) {
    logger.log("single parent found");
    await assignExtra(possibleParents[0], movie);
    return;
  }

  possibleParents.forEach((parent) => {
    parent.distance = levenshtein.get(movie.Path, parent.Path);
    logger.log("parent distance:", parent.distance, parent.Path);
  });

  const bestDistance = possibleParents.sort(
    (a, b) => a.distance - b.distance
  )[0].distance;

  possibleParents = possibleParents.filter(
    (parent) => parent.distance === bestDistance
  );

  if (possibleParents.length == 1) {
    logger.log("best parent by string distance found:", possibleParents[0]);
    await assignExtra(possibleParents[0], movie);
    return;
  }

  const possibleParentsMultipartFirst = possibleParents.filter((movie) =>
    /1_\d/.test(movie.Filename)
  );

  logger.log("possibleParentsMultipartFirst:", possibleParentsMultipartFirst);

  if (possibleParentsMultipartFirst.length == 1) {
    logger.log("multipart start single parent found");
    await assignExtra(possibleParentsMultipartFirst[0], movie);
    return;
  }
}

async function assignExtra(parent, child) {
  logger.log("assigning", child.Filename, "as extra to", parent.Filename);
  await db.fireProcedure(
    `UPDATE tbl_Movies SET Extra_id_Movies_Owner = $Extra_id_Movies_Owner WHERE id_Movies = $id_Movies`,
    { $Extra_id_Movies_Owner: parent.id_Movies, $id_Movies: child.id_Movies }
  );
  return;
}

async function filescanMovies(onlyNew) {
  logger.log("### filescanMovies started");

  eventBus.scanInfoShow("Rescanning Movies", "Rescan started");

  eventBus.setProgressBar(2); // marquee

  try {
    const moviesHave = await db.fireProcedureReturnAll(`
			SELECT
				id_Movies
				, LOWER(Path) AS tmp_PathLower
			FROM tbl_Movies
		`);

    moviesHave.forEach((movie) => {
      movie.tmp_PathLower = movie.tmp_PathLower.toLowerCase();
    });

    logger.log("moviesHave:", moviesHave);

    const moviesSourcePaths = await db.fireProcedureReturnAll(`
			SELECT
				id_SourcePaths
				, MediaType
				, Path
				, Description
				, checkRemovedFiles
			FROM tbl_SourcePaths
			WHERE MediaType = 'movies'
			${
      shared.scanOptions.filescanMovies_id_SourcePaths_IN
        ? "AND id_SourcePaths IN " +
        shared.scanOptions.filescanMovies_id_SourcePaths_IN
        : ""
      }
		`);

    for (let i = 0; i < moviesSourcePaths.length; i++) {
      const movieSourcePath = moviesSourcePaths[i];
      logger.log(
        `  scanning Source Path ${movieSourcePath.Path} (${
        movieSourcePath.Description
        })`
      );

      if (movieSourcePath.checkRemovedFiles) {
        await db.fireProcedure(
          `UPDATE tbl_Movies SET isRemoved = 1 WHERE id_SourcePaths = $id_SourcePaths`,
          { $id_SourcePaths: movieSourcePath.id_SourcePaths }
        );
      }

      currentScanInfoHeader = `Rescanning Movies - ${
        movieSourcePath.Description
        }`;

      eventBus.scanInfoShow(currentScanInfoHeader, "");

      await filescanMoviesPath(
        onlyNew,
        moviesHave,
        movieSourcePath.id_SourcePaths,
        movieSourcePath.Path
      );
    }

    eventBus.scanInfoOff();

    logger.log("### filescanMovies END");
  } catch (err) {
    throw err;
  } finally {
    eventBus.setProgressBar(-1); // off
  }
}

async function filescanMoviesPath(
  onlyNew,
  moviesHave,
  id_SourcePaths,
  scanPath
) {
  logger.log("scan", scanPath);

  try {
    const pathItems = await listPath(scanPath);

    // add files
    for (let i = 0; i < pathItems.length; i++) {
      const pathItem = pathItems[i];
      const pathLower = pathItem.Path.toLowerCase();

      if (pathItem.isFile) {
        const movieHave = moviesHave.find(
          (have) => have.tmp_PathLower === pathLower
        );

        if (movieHave) {
          logger.log("HAVE:", pathLower, "movieHave:", movieHave);
          await db.fireProcedure(
            `UPDATE tbl_Movies SET isRemoved = 0, Size = $Size, file_created_at = $file_created_at WHERE id_Movies = $id_Movies`,
            {
              $id_Movies: movieHave.id_Movies,
              $Size: pathItem.Size,
              $file_created_at: pathItem.file_created_at,
            }
          );
          continue;
        }

        if (
          ![".avi", ".mp4", ".mkv", ".m2ts"].find((ext) => {
            return ext === pathItem.ExtensionLower;
          })
        ) {
          continue;
        }

        await addMovie(id_SourcePaths, pathItem);
      }
    }

    // recurse directories
    for (let i = 0; i < pathItems.length; i++) {
      const pathItem = pathItems[i];

      if (pathItem.isDirectory) {
        await filescanMoviesPath(
          onlyNew,
          moviesHave,
          id_SourcePaths,
          pathItem.Path
        );
      }
    }
  } catch (err) {
    return;
  }
}

async function addMovie(id_SourcePaths, pathItem) {
  logger.log("add file:", pathItem);
  // currentScanInfoHeader
  eventBus.scanInfoShow(currentScanInfoHeader, `adding ${pathItem.Name}`);

  await db.fireProcedure(
    `INSERT INTO tbl_Movies (
			id_SourcePaths
			, Name
			, Path
			, Directory
			, Filename
			, Size
			, file_created_at
			, created_at
			, isNew
		) VALUES (
			$id_SourcePaths
			, $Name
			, $Path
			, $Directory
			, $Filename
			, $Size
			, $created_at
			, DATETIME('now')
			, 1
		)`,
    {
      $id_SourcePaths: id_SourcePaths,
      $Name: helpers.getMovieNameFromFileName(pathItem.Name),
      $Path: pathItem.Path,
      $Directory: pathItem.Directory,
      $Filename: pathItem.Name,
      $Size: pathItem.Size,
      $file_created_at: pathItem.$file_created_at,
    }
  );
}

async function listPath(scanPath) {
  const readdirResult = await readdirAsync(scanPath, { withFileTypes: true });

  const arrResult = [];

  // logger.log('listPath result:', result);

  for (let i = 0; i < readdirResult.length; i++) {
    const dirent = readdirResult[i];

    const fullPath = path.join(scanPath, dirent.name);

    const stats = await statAsync(fullPath);

    arrResult.push({
      Path: fullPath,
      Name: dirent.name,
      Directory: scanPath,
      ExtensionLower: path.extname(dirent.name).toLowerCase(),
      isFile: dirent.isFile(),
      isDirectory: dirent.isDirectory(),
      Size: stats.size,
      file_created_at: stats.mtime,
      stats,
    });
  }

  logger.log("listPath arrResult:", arrResult);

  return arrResult;
}

async function applyMetaData(onlyNew, id_Movies) {
  // create Name, Name2 etc. from IMDBData for each movie, also apply possible metadata from duplicates
  logger.log("applying Metadata...");

  const movies = await db.fireProcedureReturnAll(
    `
			SELECT
				MOV.id_Movies
				, MOV.Filename
				, IFNULL(MOV.IMDB_localTitle, '') AS IMDB_localTitle
				, IFNULL(MOV.IMDB_originalTitle, '') AS IMDB_originalTitle
				, IFNULL(MOV.IMDB_primaryTitle, '') AS IMDB_primaryTitle
				, MOV.IMDB_startYear
				, MOV.IMDB_endYear
			FROM tbl_Movies MOV
			WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
			${onlyNew ? "AND (MOV.isNew = 1 OR MOV.scanErrors IS NOT NULL)" : ""}
			${id_Movies ? "AND MOV.id_Movies = " + id_Movies : ""}
			`,
    []
  );

  logger.log('scanErrors applyMetaData movies:', movies);

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

    logger.log("names:", {
      IMDB_localTitle: movie.IMDB_localTitle,
      IMDB_originalTitle: movie.IMDB_originalTitle,
      IMDB_primaryTitle: movie.IMDB_primaryTitle,
    });

    if (movie.IMDB_localTitle) {
      names.push(movie.IMDB_localTitle);
    }

    if (
      movie.IMDB_originalTitle &&
      (name.length === 0 ||
        !name[0]
          .toLowerCase()
          .includes(
            movie.IMDB_originalTitle.toLowerCase() &&
            !movie.IMDB_originalTitle.toLowerCase().includes(
              name[0].toLowerCase()
            )
          ))
    ) {
      names.push(movie.IMDB_originalTitle);
    }

    if (
      movie.IMDB_primaryTitle &&
      name.length < 2 &&
      (name.length === 0 ||
        !name[0]
          .toLowerCase()
          .includes(
            movie.IMDB_primaryTitle.toLowerCase() &&
            !movie.IMDB_primaryTitle.toLowerCase().includes(
              name[0].toLowerCase()
            )
          ))
    ) {
      names.push(movie.IMDB_primaryTitle);
    }

    if (names.length > 0) {
      Name = names[0];
    }

    if (names.length > 1) {
      Name2 = names[1];
    }

    logger.log("names:", {
      Name,
      Name2,
    });

    // if (
    //   movie.IMDB_originalTitle &&
    //   !movie.IMDB_localTitle.toLowerCase().includes(
    //     movie.IMDB_originalTitle.toLowerCase()
    //   )
    // ) {
    //   if (Name) {
    //     Name2 = movie.IMDB_originalTitle;
    //   } else {
    //     Name = movie.IMDB_originalTitle;
    //   }
    // }

    // if (
    //   movie.IMDB_primaryTitle &&
    //   !movie.IMDB_localTitle &&
    //   !movie.IMDB_originalTitle.toLowerCase().includes(
    //     movie.IMDB_primaryTitle.toLowerCase()
    //   )
    // ) {
    //   if (Name) {
    //     Name2 = movie.IMDB_originalTitle;
    //   } else {
    //     Name = movie.IMDB_originalTitle;
    //   }
    // }

    if (!Name) {
      Name = helpers.getMovieNameFromFileName(movie.Filename);
    }

    const rxMultiPart = /(\d)_(\d)/;
    if (rxMultiPart.test(movie.Filename)) {
      const multiPartMatches = movie.Filename.match(rxMultiPart);
      Name += ` (${multiPartMatches[1]}/${multiPartMatches[2]})`;
    }

    const startYear = movie.IMDB_startYear;
    const endYear = movie.IMDB_endYear;

    const duplicates = await getMovieDuplicates(
      movie.id_Movies,
      true,
      false,
      true
    );
    const duplicate =
      duplicates.length > 0
        ? (await db.fireProcedureReturnAll(
          "SELECT * FROM tbl_Movies WHERE id_Movies = $id_Movies",
          { $id_Movies: duplicates[0] }
        ))[0]
        : null;

    // Overwrite by duplicate
    if (duplicate && shared.duplicatesHandling.actualDuplicate.updateTitle) {
      Name = duplicate.Name;
    }
    if (duplicate && shared.duplicatesHandling.actualDuplicate.updateSubTitle) {
      Name2 = duplicate.Name2;
    }

    let $last_access_at = null;

    if (
      duplicate &&
      shared.duplicatesHandling.actualDuplicate.updateLastAccess
    ) {
      $last_access_at = duplicate.last_access_at;
    }

    let $Rating = null;
    if (duplicate && shared.duplicatesHandling.actualDuplicate.updateRating) {
      $Rating = duplicate.Rating;
    } else if (shared.duplicatesHandling.metaDuplicate.updateRating) {
      const metaDuplicates = await getMovieDuplicates(
        movie.id_Movies,
        false,
        true,
        true
      );
      const metaDuplicate =
        metaDuplicates.length > 0
          ? (await db.fireProcedureReturnAll(
            "SELECT * FROM tbl_Movies WHERE id_Movies = $id_Movies",
            { $id_Movies: metaDuplicates[0] }
          ))[0]
          : null;

      if (metaDuplicate) {
        $Rating = metaDuplicate.Rating;
      }
    }

    await db.fireProcedure(
      `UPDATE tbl_Movies Set Name = $Name, Name2 = $Name2, startYear = $startYear, endYear = $endYear, last_access_at = $last_access_at, Rating = $Rating WHERE id_Movies = $id_Movies`,
      {
        $Name: Name,
        $Name2: Name2,
        $id_Movies: movie.id_Movies,
        $startYear: startYear,
        $endYear: endYear,
        $last_access_at,
        $Rating,
      }
    );
  }

  logger.log("applying IMDB Titles DONE");
}

async function rescanMoviesMetaData(onlyNew, id_Movies) {
  const movies = await db.fireProcedureReturnAll(
    `
			SELECT
				id_Movies
				, id_SourcePaths
				, Path
				, Directory
				, Filename
				, MI_Done
				, IMDB_Done
				, IMDB_tconst
			FROM tbl_Movies
			WHERE 
				(isRemoved IS NULL OR isRemoved = 0)
				${onlyNew ? "AND (isNew = 1 OR scanErrors IS NOT NULL)" : ""}
				${
    shared.scanOptions.rescanMoviesMetaData_id_SourcePaths_IN
      ? "AND id_SourcePaths IN " +
      shared.scanOptions.rescanMoviesMetaData_id_SourcePaths_IN
      : ""
    }
				${
    shared.scanOptions.rescanMoviesMetaData_id_Movies
      ? "AND id_Movies = " +
      shared.scanOptions.rescanMoviesMetaData_id_Movies
      : ""
    }
				${id_Movies ? "AND id_Movies = " + id_Movies : ""}
			`,
    []
  );

    logger.log('scanErrors rescanMoviesMetadata movies:', movies);

  for (let i = 0; i < movies.length; i++) {
    if (doAbortRescan) {
      break;
    }

    const movie = movies[i];

    if (
      shared.scanOptions.rescanMoviesMetaData_maxEntries &&
      i > shared.scanOptions.rescanMoviesMetaData_maxEntries
    ) {
      break;
    }

    // eventBus.scanInfoOff();
    eventBus.scanInfoShow(
      "Rescanning Movies",
      `${movie.Name || movie.Filename}`
    );

    eventBus.setProgressBar((i + 1) / movies.length); // absolute progress

    if (!id_Movies && shared.scanOptions.rescanMoviesMetaData_applyMediaInfo)
      await applyMediaInfo(movie, onlyNew);

    if (!id_Movies && shared.scanOptions.rescanMoviesMetaData_findIMDBtconst)
      await findIMDBtconst(movie, onlyNew);

    if (shared.scanOptions.rescanMoviesMetaData_fetchIMDBMetaData)
      await fetchIMDBMetaData(movie, onlyNew);

    if (shared.scanOptions.applyMetaData)
      await applyMetaData(false, movie.id_Movies);
  }

  eventBus.scanInfoOff();
  eventBus.setProgressBar(-1); // off
}

async function applyMediaInfo(movie, onlyNew) {
  // run mediainfo on movie file
  // parse mediainfo result and save to db
  if (onlyNew && movie.MI_Done) {
    return;
  }

  const mediainfo = await getSetting("MediainfoPath");

  if (!mediainfo) {
    logger.log("mediainfo not set, aborting");
    return;
  }

  // const mi_task = `${helpers.getPath('data/mediainfo/win/mediainfo-rar.exe')} --Output=XML "${movie.Path}"`;
  const mi_task = `${mediainfo} --Output=XML "${movie.Path}"`;
  logger.log("running mediainfo:", mi_task);

  const audioLanguages = [];
  const subtitleLanguages = [];

  try {
    const { stdout, stderr } = await execAsync(mi_task);

    if (stderr) {
      logger.error(stderr);
      return;
    }

    const MI = {
      $id_Movies: movie.id_Movies,
      $MI_Duration: null,
      $MI_Duration_Seconds: null,
      $MI_Duration_Formatted: null,
      $MI_Quality: null,
      $MI_Aspect_Ratio: null,
      $MI_Audio_Languages: "",
      $MI_Subtitle_Languages: "",
    };

    const miObj = await xml2js.parseStringPromise(stdout);

    logger.log("miObj:", miObj);

    let tracks = [];

    if (miObj.File && miObj.File.track) {
      tracks = miObj.File.tracks;
    } else if (miObj.MediaInfo && miObj.MediaInfo.media) {
      miObj.MediaInfo.media.forEach((media) => {
        media.track.forEach((track) => {
          tracks.push(track);
        });
      });
    }

    tracks.forEach((track) => {
      if (track.$.type === "Video") {
        if (track.Duration && track.Duration.length > 0) {
          MI.$MI_Duration = track.Duration[0];

          // eslint-disable-next-line no-unused-vars
          let durationSeconds = 0;

          if (
            MI.$MI_Duration.includes("h") ||
            MI.$MI_Duration.includes("mn") ||
            MI.$MI_Duration.includes("s")
          ) {
            if (/(\d*)h/.test(MI.$MI_Duration)) {
              durationSeconds +=
                60 * 60 * parseInt(MI.$MI_Duration.match(/(\d*)h/)[1]);
            }
            if (/(\d*)mn/.test(MI.$MI_Duration)) {
              durationSeconds +=
                60 * parseInt(MI.$MI_Duration.match(/(\d*)mn/)[1]);
            }
            if (/(\d*)s/.test(MI.$MI_Duration)) {
              durationSeconds += parseInt(MI.$MI_Duration.match(/(\d*)s/)[1]);
            }
          }

          if (/^\d+/.test(MI.$MI_Duration) && /\d+$/.test(MI.$MI_Duration)) {
            durationSeconds = parseInt(MI.$MI_Duration);
          }

          if (durationSeconds > 0) {
            MI.$MI_Duration_Seconds = durationSeconds;

            MI.$MI_Duration_Formatted = helpers.getTimeString(
              MI.$MI_Duration_Seconds
            );
          }
        }

        if (track.Width && track.Width.length > 0) {
          const width = track.Width[0].replace(/\s/g, "");
          const iWidth = parseInt(width);

          let height = 0;
          if (track.Height && track.Height.length > 0) {
            height = track.Height[0].replace(/\s/g, "");
          }
          const iHeight = parseInt(height);

          MI.$MI_Quality = "SD";

          if (iWidth > 1200 || iHeight >= 720) {
            MI.$MI_Quality = "720p";
          }
          if (iWidth > 1900 || iHeight >= 1080) {
            MI.$MI_Quality = "HD";
          }
          if (iWidth > 3800 || iHeight >= 2000) {
            MI.$MI_Quality = "UHD";
          }
        }

        if (
          track.Display_aspect_ratio &&
          track.Display_aspect_ratio.length > 0
        ) {
          MI.$MI_Aspect_Ratio = track.Display_aspect_ratio[0];
        }

        if (track.DisplayAspectRatio && track.DisplayAspectRatio.length > 0) {
          MI.$MI_Aspect_Ratio = track.DisplayAspectRatio[0];
        }
      }

      if (track.$.type === "Audio") {
        if (track.Language && track.Language.length > 0) {
          let lang = track.Language[0];

          if (languageNameCodeMapping[lang]) {
            lang = languageNameCodeMapping[lang];
          } else {
            lang = helpers.uppercaseEachWord(lang);
          }

          if (!audioLanguages.find((al) => al === lang)) {
            audioLanguages.push(lang);
          }
        }
      }

      if (track.$.type === "Text") {
        if (track.Language && track.Language.length > 0) {
          let lang = track.Language[0];
          if (languageNameCodeMapping[lang]) {
            lang = languageNameCodeMapping[lang];
          } else {
            lang = helpers.uppercaseEachWord(lang);
          }

          if (!subtitleLanguages.find((al) => al === lang)) {
            subtitleLanguages.push(lang);
          }
        }
      }
    });

    if (audioLanguages.length > 0) {
      MI.$MI_Audio_Languages = audioLanguages.reduce(
        (prev, current) => prev + (prev ? ", " : "") + current
      );
    }

    if (subtitleLanguages.length > 0) {
      MI.$MI_Subtitle_Languages = subtitleLanguages.reduce(
        (prev, current) => prev + (prev ? ", " : "") + current
      );
    }

    logger.log("MI:", MI);

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
  } catch (err) {
    logger.error(err);
  }
}

async function findIMDBtconst(movie, onlyNew) {
  // find IMDB tconst (currently just from filename)
  // save IMDB_tconst to db
  if (onlyNew && movie.IMDB_Done) {
    return;
  }

  let tconstIncluded = "";
  let tconst = "";

  // find tconst by duplicate
  if (shared.duplicatesHandling.actualDuplicate.relinkIMDB) {
    const actualDuplicates = await getMovieDuplicates(
      movie.id_Movies,
      true,
      false,
      true
    );
    const actualDuplicate =
      actualDuplicates.length > 0
        ? (await db.fireProcedureReturnAll(
          "SELECT * FROM tbl_Movies WHERE id_Movies = $id_Movies",
          { $id_Movies: actualDuplicates[0] }
        ))[0]
        : null;

    if (actualDuplicate && actualDuplicate.IMDB_tconst) {
      tconst = actualDuplicate.IMDB_tconst;
    }
  }

  if (!tconst) {
    // tconst not found by duplicate
    tconstIncluded = await findIMDBtconstIncluded(movie);
    if (
      !shared.scanOptions
        .rescanMoviesMetaData_findIMDBtconst_ignore_tconst_in_filename
    ) {
      tconst = tconstIncluded;
    }
  }

  if (!tconst) {
    // tconst is not included in the filename, try to find it by searching imdb
    tconst = await findIMDBtconstByFilename(movie);

    if (
      shared.scanOptions
        .rescanMoviesMetaData_findIMDBtconst_ignore_tconst_in_filename
    ) {
      // compare tconst from IMDB search with included tconst
      if (tconstIncluded && tconst) {
        if (tconstIncluded !== tconst) {
          logger.log(
            `tconst compare;mismatch;${tconst};${tconstIncluded};${
            movie.Filename
            }`
          );
        } else {
          logger.log(
            `tconst compare;match;${tconst};${tconstIncluded};${movie.Filename}`
          );
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
  }
}

async function findIMDBtconstIncluded(movie) {
  // tconst is actually included in the filename, e.g. A Movie (2009)[tt123456789]
  if (/\[tt\d*?\]/.test(movie.Filename)) {
    const tconst = movie.Filename.match(/\[(tt\d*?)\]/)[1];

    if (tconst.length > 8) {
      return tconst;
    }
  }

  return "";
}

async function findIMDBtconstByFilename(movie) {
  const arrYears = helpers.getYearsFromFileName(movie.Filename, false);

  // const name = helpers.getMovieNameFromFileName(movie.Filename).replace(/[()[]]/g, ' ');
  const name = helpers
    .getMovieNameFromFileName(movie.Filename)
    .replace(/\([^)]*?\)/g, "")
    .replace(/\[[^\]]*?\]/g, "")
    .trim();

  logger.log("findIMDBtconstByFilename:", name);

  logger.log("findIMDBtconstByFilename years:", arrYears);

  const arrName = name.split(" ");

  for (let i = arrName.length; i > 0; i--) {
    const searchTerm = arrName.slice(0, i).join(" ");

    logger.log(`findIMDBtconstByFilename trying: ${searchTerm}`);

    const results = await scrapeIMDBSuggestion(searchTerm);

    if (results.length === 1) {
      // definitely found our optimum!
      logger.log("findIMDBtconstByFilename OPTIMUM found!", results);
      return results[0].tconst;
    }

    if (results.length > 0) {
      // check for year match
      for (let y = 0; y < arrYears.length; y++) {
        for (let r = 0; r < results.length; r++) {
          if (results[r].year) {
            const year = parseInt(results[r].year);
            if (arrYears[y] - year >= -1 && arrYears[y] - year <= 1) {
              return results[r].tconst;
            }
          }
        }
      }

      // just use the first mentioned
      return results[0].tconst;
    }
  }

  return "";
}

async function fetchIMDBMetaData(movie, onlyNew) {
  logger.log("fetchIMDBdata movie:", movie);

  // fetch IMDB data from imdb.com (incl. images)
  // save IMDB data to db
  if (onlyNew && movie.IMDB_Done) {
    return;
  }

  if (!movie.IMDB_tconst) {
    return;
  }

  let IMDBdata = {};

  try {
    const scanErrorsString = await db.fireProcedureReturnScalar(`SELECT scanErrors FROM tbl_Movies WHERE id_Movies = $id_Movies`, { $id_Movies: movie.id_Movies });

    movie.scanErrors = scanErrorsString ? JSON.parse(scanErrorsString) : {};

    if (
      shared.scanOptions.rescanMoviesMetaData_fetchIMDBMetaData_mainPageData &&
      getUserScanOption("rescanMoviesMetaData_fetchIMDBMetaData_mainPageData")
        .enabled
    ) {
      try {
        const mainPageData = await scrapeIMDBmainPageData(
          movie,
          helpers.downloadFile
        );
        IMDBdata = Object.assign(IMDBdata, mainPageData);
      } catch (error) {
        //
      }
    }

    if (
      shared.scanOptions
        .rescanMoviesMetaData_fetchIMDBMetaData_ratingDemographics &&
      getUserScanOption(
        "rescanMoviesMetaData_fetchIMDBMetaData_ratingDemographics"
      ).enabled
    ) {
      const ratingDemographics = await scrapeIMDBRatingDemographics(movie);
      IMDBdata = Object.assign(IMDBdata, ratingDemographics);
    }

    if (
      shared.scanOptions.rescanMoviesMetaData_fetchIMDBMetaData_plotSummary &&
      getUserScanOption("rescanMoviesMetaData_fetchIMDBMetaData_plotSummary")
        .enabled
    ) {
      const plotSummaryFull = await scrapeIMDBplotSummary(
        movie,
        IMDBdata.$IMDB_plotSummary
      );
      IMDBdata = Object.assign(IMDBdata, plotSummaryFull);
    }

    let plotKeywords = [];
    if (
      shared.scanOptions.rescanMoviesMetaData_fetchIMDBMetaData_plotKeywords &&
      getUserScanOption("rescanMoviesMetaData_fetchIMDBMetaData_plotKeywords")
        .enabled
    ) {
      plotKeywords = await scrapeIMDBplotKeywords(movie);
    }

    if (
      shared.scanOptions.rescanMoviesMetaData_fetchIMDBMetaData_releaseinfo &&
      getUserScanOption("rescanMoviesMetaData_fetchIMDBMetaData_releaseinfo")
        .enabled
    ) {
      const regions = await getRegions();
      const allowedTitleTypes = await getAllowedTitleTypes();

      const releaseinfo = await scrapeIMDBreleaseinfo(
        movie,
        regions,
        allowedTitleTypes
      );
      IMDBdata = Object.assign(IMDBdata, releaseinfo);
    }

    if (
      shared.scanOptions.rescanMoviesMetaData_fetchIMDBMetaData_technicalData &&
      getUserScanOption("rescanMoviesMetaData_fetchIMDBMetaData_technicalData")
        .enabled
    ) {
      const technicalData = await scrapeIMDBtechnicalData(movie);
      IMDBdata = Object.assign(IMDBdata, technicalData);
    }

    if (
      shared.scanOptions
        .rescanMoviesMetaData_fetchIMDBMetaData_parentalguideData &&
      getUserScanOption(
        "rescanMoviesMetaData_fetchIMDBMetaData_parentalguideData"
      ).enabled
    ) {
      const regions = await getRegions();
      const parentalguideData = await scrapeIMDBParentalGuideData(
        movie,
        regions,
        db.fireProcedureReturnAll,
        db.fireProcedure,
        db.fireProcedureReturnScalar
      );
      IMDBdata = Object.assign(IMDBdata, parentalguideData);
    }

    let credits = [];
    if (
      shared.scanOptions.rescanMoviesMetaData_fetchIMDBMetaData_creditsData &&
      getUserScanOption("rescanMoviesMetaData_fetchIMDBMetaData_creditsData")
        .enabled
    ) {
      const creditsData = await scrapeIMDBFullCreditsData(movie);
      IMDBdata = Object.assign(IMDBdata, creditsData.topCredits);
      credits = creditsData.credits;
    }

    let companies = [];
    if (
      shared.scanOptions.rescanMoviesMetaData_fetchIMDBMetaData_companiesData &&
      getUserScanOption("rescanMoviesMetaData_fetchIMDBMetaData_companiesData")
        .enabled
    ) {
      const companiesData = await scrapeIMDBCompaniesData(movie);
      IMDBdata = Object.assign(IMDBdata, companiesData.topProductionCompanies);
      companies = companiesData.companies;
    }

    let filmingLocations = [];
    if (
      shared.scanOptions
        .rescanMoviesMetaData_fetchIMDBMetaData_filmingLocations &&
      getUserScanOption(
        "rescanMoviesMetaData_fetchIMDBMetaData_filmingLocations"
      ).enabled
    ) {
      filmingLocations = await scrapeIMDBFilmingLocations(movie);
    }

    logger.log("IMDBdata:", IMDBdata);

    const genres = await db.fireProcedureReturnAll(
      "SELECT id_Genres, GenreID, Name FROM tbl_Genres",
      []
    );

    if (shared.scanOptions.rescanMoviesMetaData_saveIMDBData) {
      await saveIMDBData(
        movie,
        IMDBdata,
        genres,
        credits,
        companies,
        plotKeywords,
        filmingLocations
      );
    }
  } catch (err) {
    logger.error(err);
    return;
  }
}

async function saveIMDBData(
  movie,
  IMDBdata,
  genres,
  credits,
  companies,
  plotKeywords,
  filmingLocations
) {
  const IMDB_genres = IMDBdata.$IMDB_genres || [];
  delete IMDBdata.$IMDB_genres;

  let sql = `IMDB_Done = ${Object.keys(movie.scanErrors).length > 0 ? '0' :'1'}, scanErrors = $scanErrors`;
  Object.keys(IMDBdata).forEach((key) => {
    sql += `, [${key.replace("$", "")}] = ${key}`;
  });
  sql = `UPDATE tbl_Movies SET ${sql} WHERE id_Movies = $id_Movies`;

  const payload = Object.assign(IMDBdata, { $id_Movies: movie.id_Movies, $scanErrors: (movie.scanErrors && Object.keys(movie.scanErrors).length > 0 ? JSON.stringify(movie.scanErrors) : null) });
  
  logger.log('saveIMDBData payload:', payload, 'movie.scanErrors:', movie.scanErrors);

  await db.fireProcedure(
    sql,
    Object.assign(IMDBdata, { $id_Movies: movie.id_Movies, $scanErrors: (movie.scanErrors && Object.keys(movie.scanErrors).length > 0 ? JSON.stringify(movie.scanErrors) : null) })
  );

  const movieGenres = await db.fireProcedureReturnAll(
    "SELECT MG.id_Genres, G.GenreID, G.Name FROM tbl_Movies_Genres MG INNER JOIN tbl_Genres G ON MG.id_Genres = G.id_Genres WHERE MG.id_Movies = $id_Movies",
    { $id_Movies: movie.id_Movies }
  );

  for (let i = 0; i < IMDB_genres.length; i++) {
    const genre = IMDB_genres[i];

    if (!movieGenres.find((mg) => mg.GenreID === genre)) {
      // genre needs to be added for the movie
      if (!genres.find((g) => g.GenreID === genre)) {
        // genre needs to be added to main list of genres (we need id_Genres later)
        await db.fireProcedure(
          "INSERT INTO tbl_Genres (GenreID, Name) VALUES ($GenreID, $Name)",
          { $GenreID: genre, $Name: helpers.uppercaseEachWord(genre) }
        );
        const id_Genres = await db.fireProcedureReturnScalar(
          "SELECT id_Genres FROM tbl_Genres WHERE GenreID = $GenreID",
          { $GenreID: genre }
        );
        genres.push({
          id_Genres: id_Genres,
          GenreID: genre,
          Name: helpers.uppercaseEachWord(genre),
        });
      }

      const id_Genres = genres.find((g) => g.GenreID === genre).id_Genres;
      await db.fireProcedure(
        "INSERT INTO tbl_Movies_Genres (id_Movies, id_Genres) VALUES ($id_Movies, $id_Genres)",
        { $id_Movies: movie.id_Movies, $id_Genres: id_Genres }
      );
    }
  }

  for (let i = 0; i < credits.length; i++) {
    const credit = credits[i];

    await db.fireProcedure(
      `
			INSERT INTO tbl_Movies_IMDB_Credits (
				id_Movies
				, Category
				, IMDB_Person_ID
				, Person_Name
				, Credit
			) VALUES (
				$id_Movies
				, $Category
				, $IMDB_Person_ID
				, $Person_Name
				, $Credit
			)
			ON CONFLICT(id_Movies, Category, IMDB_Person_ID)
			DO UPDATE SET
				Person_Name = excluded.Person_Name
				, Credit = excluded.Credit`,
      {
        $id_Movies: movie.id_Movies,
        $Category: credit.category,
        $IMDB_Person_ID: credit.id,
        $Person_Name: credit.name,
        $Credit: credit.credit,
      }
    );
  }

  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];

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
			)
			ON CONFLICT(id_Movies, Category, IMDB_Company_ID)
			DO UPDATE SET
				Company_Name = excluded.Company_Name
				, Role = excluded.Role`,
      {
        $id_Movies: movie.id_Movies,
        $Category: company.category,
        $IMDB_Company_ID: company.id,
        $Company_Name: company.name,
        $Role: company.role,
      }
    );
  }

  for (let i = 0; i < plotKeywords.length; i++) {
    let plotKeyword = plotKeywords[i];

    let $id_IMDB_Plot_Keywords = await db.fireProcedureReturnScalar(
      `SELECT id_IMDB_Plot_Keywords FROM tbl_IMDB_Plot_Keywords WHERE Keyword = $Keyword`,
      { $Keyword: plotKeyword.Keyword }
    );

    if (!$id_IMDB_Plot_Keywords) {
      await db.fireProcedure(
        `INSERT INTO tbl_IMDB_Plot_Keywords (Keyword) VALUES ($Keyword)`,
        { $Keyword: plotKeyword.Keyword }
      );
      $id_IMDB_Plot_Keywords = await db.fireProcedureReturnScalar(
        `SELECT id_IMDB_Plot_Keywords FROM tbl_IMDB_Plot_Keywords WHERE Keyword = $Keyword`,
        { $Keyword: plotKeyword.Keyword }
      );
    }

    if (!$id_IMDB_Plot_Keywords) {
      logger.error("unable to store plot keyword:", plotKeyword);
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

  for (let i = 0; i < filmingLocations.length; i++) {
    let filmingLocation = filmingLocations[i];

    let $id_IMDB_Filming_Locations = await db.fireProcedureReturnScalar(
      `SELECT id_IMDB_Filming_Locations FROM tbl_IMDB_Filming_Locations WHERE Location = $Location`,
      { $Location: filmingLocation.Location }
    );

    if (!$id_IMDB_Filming_Locations) {
      await db.fireProcedure(
        `INSERT INTO tbl_IMDB_Filming_Locations (Location) VALUES ($Location)`,
        { $Location: filmingLocation.Location }
      );
      $id_IMDB_Filming_Locations = await db.fireProcedureReturnScalar(
        `SELECT id_IMDB_Filming_Locations FROM tbl_IMDB_Filming_Locations WHERE Location = $Location`,
        { $Location: filmingLocation.Location }
      );
    }

    if (!$id_IMDB_Filming_Locations) {
      logger.error("unable to store filming location:", filmingLocation);
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
}

async function fetchMedia($MediaType, arr_id_Movies, minimumResultSet, $t) {
  try {
    logger.log(
      "shared.languagesAudioSubtitles:",
      shared.languagesAudioSubtitles
    );

    const preferredLanguages = [];

    if (
      shared.languagesAudioSubtitles &&
      shared.languagesAudioSubtitles.length > 0
    ) {
      shared.languagesAudioSubtitles.forEach((lang) => {
        preferredLanguages.push(lang.code);
      });
    } else if (shared.fallbackLanguage) {
      preferredLanguages.push(shared.fallbackLanguage.code);
    }

    let filterSourcePaths = "";
    logger.log("shared.filterSourcePaths:", shared.filterSourcePaths);
    if (
      shared.filterSourcePaths &&
      shared.filterSourcePaths.find((filter) => !filter.Selected)
    ) {
      filterSourcePaths =
        "AND MOV.id_SourcePaths IN (SELECT id_SourcePaths FROM tbl_SourcePaths WHERE Description IN (";

      filterSourcePaths += shared.filterSourcePaths
        .filter((filter) => filter.Selected)
        .map((filter) => filter.Description)
        .reduce((prev, current) => {
          return prev + (prev ? ", " : "") + `'${current}'`;
        }, "");

      filterSourcePaths += "))";
    }

    let filterGenres = "";
    if (
      shared.filterGenres &&
      ((!shared.filterSettings.filterGenresAND &&
        shared.filterGenres.find((filter) => !filter.Selected)) ||
        (shared.filterSettings.filterGenresAND &&
          shared.filterGenres.find((filter) => filter.Selected)))
    ) {
      const filterGenresList = shared.filterGenres
        .filter((filter) => filter.Selected)
        .map((filter) => filter.id_Genres);

      if (shared.filterSettings.filterGenresAND) {
        // use INTERSECT for AND-filter
        filterGenres = "AND MOV.id_Movies IN (";

        filterGenres += filterGenresList.reduce((prev, current) => {
          return (
            prev +
            (prev ? " INTERSECT " : "") +
            `SELECT id_Movies FROM tbl_Movies_Genres WHERE id_Genres = ${current}`
          );
        }, "");

        filterGenres += ")";
      } else {
        // OR-filter
        filterGenres =
          "AND MOV.id_Movies IN (SELECT id_Movies FROM tbl_Movies_Genres WHERE id_Genres IN (";

        filterGenres += filterGenresList.reduce((prev, current) => {
          return prev + (prev ? ", " : "") + current;
        }, "");

        filterGenres += "))";
      }
    }

    let filterAgeRatings = "";
    logger.log("shared.filterAgeRatings:", shared.filterAgeRatings);
    if (
      shared.filterAgeRatings &&
      shared.filterAgeRatings.find((filter) => !filter.Selected)
    ) {
      if (
        shared.filterAgeRatings.find(
          (filter) => filter.Selected && filter.Age == -1
        )
      ) {
        filterAgeRatings = `AND (AR.Age IS NULL `;
      } else {
        filterAgeRatings = `AND (1=0 `;
      }

      if (
        shared.filterAgeRatings.find(
          (filter) => filter.Selected && filter.Age >= 0
        )
      ) {
        filterAgeRatings += `OR AR.Age IN (`;

        filterAgeRatings += shared.filterAgeRatings
          .filter((filter) => filter.Selected && filter.Age >= 0)
          .map((filter) => filter.Age)
          .reduce((prev, current) => {
            return prev + (prev ? ", " : "") + current;
          }, "");

        filterAgeRatings += ")";
      }

      filterAgeRatings += ")";
    }

    // if (shared.filterAgeRatings && shared.filterAgeRatings.find(filter => !filter.Selected)) {
    // 	filterAgeRatings = 'AND AR.Age IN (';

    // 	filterAgeRatings += shared.filterAgeRatings.filter(filter => filter.Selected).map(filter => filter.Age).reduce((prev, current) => {
    // 		return prev + (prev ? ', ' : '') + current;
    // 	}, '');

    // 	filterAgeRatings += ')'
    // }

    let filterRatings = "";
    logger.log("shared.filterRatings:", shared.filterRatings);
    if (
      shared.filterRatings &&
      shared.filterRatings.find((filter) => !filter.Selected)
    ) {
      if (
        shared.filterRatings.find((filter) => filter.Selected && !filter.Rating)
      ) {
        filterRatings = "AND (MOV.Rating IS NULL OR MOV.Rating = 0 ";
      } else {
        filterRatings = "AND (0=1 ";
      }

      if (
        shared.filterRatings.find((filter) => filter.Selected && filter.Rating)
      ) {
        filterRatings +=
          "OR MOV.Rating IN (" +
          shared.filterRatings
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
    if (
      shared.filterLists &&
      shared.filterLists.find((filter) => !filter.Selected)
    ) {
      if (
        shared.filterLists.find((filter) => filter.Selected && !filter.id_Lists)
      ) {
        filterLists = `AND (MOV.id_Movies NOT IN (SELECT id_Movies FROM tbl_Lists_Movies) `;
      } else {
        filterLists = `AND (1=0 `;
      }

      if (
        shared.filterLists.find((filter) => filter.Selected && filter.id_Lists)
      ) {
        filterLists += `OR MOV.id_Movies IN (SELECT id_Movies FROM tbl_Lists_Movies WHERE id_Lists IN (`;

        filterLists += shared.filterLists
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
    Object.keys(shared.filterParentalAdvisory).forEach((category) => {
      let filterPACategory = "";

      if (
        shared.filterParentalAdvisory[category] &&
        shared.filterParentalAdvisory[category].find(
          (filter) => !filter.Selected
        )
      ) {
        if (
          shared.filterParentalAdvisory[category].find(
            (filter) => filter.Selected && filter.Severity == -1
          )
        ) {
          filterPACategory = `AND (MOV.IMDB_Parental_Advisory_${category} IS NULL `;
        } else {
          filterPACategory = `AND (1=0 `;
        }

        if (
          shared.filterParentalAdvisory[category].find(
            (filter) => filter.Selected && filter.Severity >= 0
          )
        ) {
          filterPACategory += `OR MOV.IMDB_Parental_Advisory_${category} IN (`;

          filterPACategory += shared.filterParentalAdvisory[category]
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

    let filterPersons = "";
    if (
      shared.filterPersons &&
      ((!shared.filterSettings.filterPersonsAND &&
        shared.filterPersons.find((filter) => !filter.Selected)) ||
        (shared.filterSettings.filterPersonsAND &&
          shared.filterPersons.find(
            (filter) => filter.Selected && filter.IMDB_Person_ID
          )))
    ) {
      const filterPersonsList = shared.filterPersons
        .filter((filter) => filter.Selected && filter.IMDB_Person_ID)
        .map((filter) => filter.IMDB_Person_ID);

      if (shared.filterSettings.filterPersonsAND) {
        // use INTERSECT for AND-filter
        // note: we don't have to take "any other person" into account
        filterPersons = "AND MOV.id_Movies IN (";

        filterPersons += filterPersonsList.reduce((prev, current) => {
          return (
            prev +
            (prev ? " INTERSECT " : "") +
            `SELECT id_Movies FROM tbl_Movies_IMDB_Credits WHERE IMDB_Person_ID = '${current}'`
          );
        }, "");

        filterPersons += ")";
      } else {
        // OR-filter
        if (
          shared.filterPersons.find(
            (filter) => filter.Selected && !filter.id_Filter_Persons
          )
        ) {
          filterPersons = `AND (MOV.id_Movies NOT IN (SELECT id_Movies FROM tbl_Movies_IMDB_Credits WHERE IMDB_Person_ID IN (SELECT IMDB_Person_ID FROM tbl_Filter_Persons)) `;
        } else {
          filterPersons = `AND (1=0 `;
        }

        if (
          shared.filterPersons.find(
            (filter) => filter.Selected && filter.id_Filter_Persons
          )
        ) {
          filterPersons += `OR MOV.id_Movies IN (SELECT id_Movies FROM tbl_Movies_IMDB_Credits WHERE IMDB_Person_ID IN (`;

          filterPersons += filterPersonsList.reduce((prev, current) => {
            return prev + (prev ? ", " : "") + `'${current}'`;
          }, "");

          filterPersons += "))";
        }

        filterPersons += ")";
      }
    }

    let filterCompanies = "";
    if (
      shared.filterCompanies &&
      ((!shared.filterSettings.filterCompaniesAND &&
        shared.filterCompanies.find((filter) => !filter.Selected)) ||
        (shared.filterSettings.filterCompaniesAND &&
          shared.filterCompanies.find(
            (filter) => filter.Selected && filter.id_Filter_Companies
          )))
    ) {
      const filterCompaniesList = shared.filterCompanies
        .filter((filter) => filter.Selected && filter.id_Filter_Companies)
        .map((filter) => filter.Company_Name);

      if (shared.filterSettings.filterCompaniesAND) {
        // use INTERSECT for AND-filter
        // note: we don't have to take "any other company" into account
        filterCompanies = "AND MOV.id_Movies IN (";

        filterCompanies += filterCompaniesList.reduce((prev, current) => {
          return (
            prev +
            (prev ? " INTERSECT " : "") +
            `SELECT id_Movies FROM tbl_Movies_IMDB_Companies WHERE Company_Name = '${current}'`
          );
        }, "");

        filterCompanies += ")";
      } else {
        // OR-filter
        if (
          shared.filterCompanies.find(
            (filter) => filter.Selected && !filter.id_Filter_Companies
          )
        ) {
          filterCompanies = `AND (MOV.id_Movies NOT IN (SELECT id_Movies FROM tbl_Movies_IMDB_Companies WHERE Company_Name IN (SELECT Company_Name FROM tbl_Filter_Companies)) `;
        } else {
          filterCompanies = `AND (1=0 `;
        }

        if (
          shared.filterCompanies.find(
            (filter) => filter.Selected && filter.id_Filter_Companies
          )
        ) {
          filterCompanies += `OR MOV.id_Movies IN (SELECT id_Movies FROM tbl_Movies_IMDB_Companies WHERE Company_Name IN (`;

          filterCompanies += filterCompaniesList.reduce((prev, current) => {
            return prev + (prev ? ", " : "") + `'${current}'`;
          }, "");

          filterCompanies += "))";
        }

        filterCompanies += ")";
      }
    }

    let filterIMDBPlotKeywords = "";
    if (
      shared.filterIMDBPlotKeywords &&
      ((!shared.filterSettings.filterIMDBPlotKeywordsAND &&
        shared.filterIMDBPlotKeywords.find((filter) => !filter.Selected)) ||
        (shared.filterSettings.filterIMDBPlotKeywordsAND &&
          shared.filterIMDBPlotKeywords.find(
            (filter) => filter.Selected && filter.id_Filter_IMDB_Plot_Keywords
          )))
    ) {
      const filterIMDBPlotKeywordsList = shared.filterIMDBPlotKeywords
        .filter(
          (filter) => filter.Selected && filter.id_Filter_IMDB_Plot_Keywords
        )
        .map((filter) => filter.id_IMDB_Plot_Keywords);

      if (shared.filterSettings.filterIMDBPlotKeywordsAND) {
        // use INTERSECT for AND-filter
        // note: we don't have to take "any other plot keyword" into account
        filterIMDBPlotKeywords = "AND MOV.id_Movies IN (";

        filterIMDBPlotKeywords += filterIMDBPlotKeywordsList.reduce(
          (prev, current) => {
            return (
              prev +
              (prev ? " INTERSECT " : "") +
              `SELECT id_Movies FROM tbl_Movies_IMDB_Plot_Keywords WHERE id_IMDB_Plot_Keywords = ${current}`
            );
          },
          ""
        );

        filterIMDBPlotKeywords += ")";
      } else {
        // OR-filter
        if (
          shared.filterIMDBPlotKeywords.find(
            (filter) => filter.Selected && !filter.id_Filter_IMDB_Plot_Keywords
          )
        ) {
          filterIMDBPlotKeywords = `AND (MOV.id_Movies NOT IN (SELECT id_Movies FROM tbl_Movies_IMDB_Plot_Keywords WHERE id_IMDB_Plot_Keywords IN (SELECT id_IMDB_Plot_Keywords FROM tbl_Filter_IMDB_Plot_Keywords)) `;
        } else {
          filterIMDBPlotKeywords = `AND (1=0 `;
        }

        if (
          shared.filterIMDBPlotKeywords.find(
            (filter) => filter.Selected && filter.id_Filter_IMDB_Plot_Keywords
          )
        ) {
          filterIMDBPlotKeywords += `OR MOV.id_Movies IN (SELECT id_Movies FROM tbl_Movies_IMDB_Plot_Keywords WHERE id_IMDB_Plot_Keywords IN (`;

          filterIMDBPlotKeywords += filterIMDBPlotKeywordsList.reduce(
            (prev, current) => {
              return prev + (prev ? ", " : "") + `${current}`;
            },
            ""
          );

          filterIMDBPlotKeywords += "))";
        }

        filterIMDBPlotKeywords += ")";
      }
    }

    let filterIMDBFilmingLocations = "";
    if (
      shared.filterIMDBFilmingLocations &&
      ((!shared.filterSettings.filterIMDBFilmingLocationsAND &&
        shared.filterIMDBFilmingLocations.find((filter) => !filter.Selected)) ||
        (shared.filterSettings.filterIMDBFilmingLocationsAND &&
          shared.filterIMDBFilmingLocations.find(
            (filter) =>
              filter.Selected && filter.id_Filter_IMDB_Filming_Locations
          )))
    ) {
      const filterIMDBFilmingLocationsList = shared.filterIMDBFilmingLocations
        .filter(
          (filter) => filter.Selected && filter.id_Filter_IMDB_Filming_Locations
        )
        .map((filter) => filter.id_IMDB_Filming_Locations);

      if (shared.filterSettings.filterIMDBFilmingLocationsAND) {
        // use INTERSECT for AND-filter
        // note: we don't have to take "any other filming location" into account
        filterIMDBFilmingLocations = "AND MOV.id_Movies IN (";

        filterIMDBFilmingLocations += filterIMDBFilmingLocationsList.reduce(
          (prev, current) => {
            return (
              prev +
              (prev ? " INTERSECT " : "") +
              `SELECT id_Movies FROM tbl_Movies_IMDB_Filming_Locations WHERE id_IMDB_Filming_Locations = ${current}`
            );
          },
          ""
        );

        filterIMDBFilmingLocations += ")";
      } else {
        // OR-filter
        if (
          shared.filterIMDBFilmingLocations.find(
            (filter) =>
              filter.Selected && !filter.id_Filter_IMDB_Filming_Locations
          )
        ) {
          filterIMDBFilmingLocations = `AND (MOV.id_Movies NOT IN (SELECT id_Movies FROM tbl_Movies_IMDB_Filming_Locations WHERE id_IMDB_Filming_Locations IN (SELECT id_IMDB_Filming_Locations FROM tbl_Filter_IMDB_Filming_Locations)) `;
        } else {
          filterIMDBFilmingLocations = `AND (1=0 `;
        }

        if (
          shared.filterIMDBFilmingLocations.find(
            (filter) =>
              filter.Selected && filter.id_Filter_IMDB_Filming_Locations
          )
        ) {
          filterIMDBFilmingLocations += `OR MOV.id_Movies IN (SELECT id_Movies FROM tbl_Movies_IMDB_Filming_Locations WHERE id_IMDB_Filming_Locations IN (`;

          filterIMDBFilmingLocations += filterIMDBFilmingLocationsList.reduce(
            (prev, current) => {
              return prev + (prev ? ", " : "") + `${current}`;
            },
            ""
          );

          filterIMDBFilmingLocations += "))";
        }

        filterIMDBFilmingLocations += ")";
      }
    }

    let filterYears = "";
    logger.log("shared.filterYears:", shared.filterYears);
    if (
      shared.filterYears &&
      shared.filterYears.find((filter) => !filter.Selected)
    ) {
      if (
        shared.filterYears.find(
          (filter) => filter.Selected && filter.startYear == -1
        )
      ) {
        filterYears = `AND (MOV.startYear IS NULL `;
      } else {
        filterYears = `AND (1=0 `;
      }

      if (
        shared.filterYears.find(
          (filter) => filter.Selected && filter.startYear >= 0
        )
      ) {
        filterYears += `OR MOV.startYear IN (`;

        filterYears += shared.filterYears
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
    logger.log("shared.filterQualities:", shared.filterQualities);
    if (
      shared.filterQualities &&
      shared.filterQualities.find((filter) => !filter.Selected)
    ) {
      if (
        shared.filterQualities.find(
          (filter) => filter.Selected && !filter.MI_Quality
        )
      ) {
        filterQualities = `AND (MOV.MI_Quality IS NULL `;
      } else {
        filterQualities = `AND (1=0 `;
      }

      if (
        shared.filterQualities.find(
          (filter) => filter.Selected && filter.MI_Quality
        )
      ) {
        filterQualities += `OR MOV.MI_Quality IN (`;

        filterQualities += shared.filterQualities
          .filter((filter) => filter.Selected)
          .map((filter) => filter.MI_Quality)
          .reduce((prev, current) => {
            return prev + (prev ? ", " : "") + `'${current}'`;
          }, "");

        filterQualities += ")";
      }

      filterQualities += ")";
    }

    let filterAudioLanguages = "";
    if (
      shared.filterAudioLanguages &&
      shared.filterAudioLanguages.find((filter) => !filter.Selected)
    ) {
      if (
        shared.filterAudioLanguages.find(
          (filter) => filter.Selected && filter.Language == "<not available>"
        )
      ) {
        filterAudioLanguages = `AND (MOV.id_Movies NOT IN (SELECT id_Movies FROM tbl_Movies_Languages WHERE Type = 'audio') `;
      } else {
        filterAudioLanguages = `AND (1=0 `;
      }

      if (
        shared.filterAudioLanguages.find(
          (filter) => filter.Selected && filter.Language !== "<not available>"
        )
      ) {
        filterAudioLanguages += `OR MOV.id_Movies IN (SELECT id_Movies FROM tbl_Movies_Languages WHERE Type = 'audio' AND Language IN (`;

        filterAudioLanguages += shared.filterAudioLanguages
          .filter((filter) => filter.Selected)
          .map((filter) => filter.Language)
          .reduce((prev, current) => {
            return prev + (prev ? ", " : "") + `'${current}'`;
          }, "");

        filterAudioLanguages += "))";
      }

      filterAudioLanguages += ")";
    }

    let filterSubtitleLanguages = "";
    if (
      shared.filterSubtitleLanguages &&
      shared.filterSubtitleLanguages.find((filter) => !filter.Selected)
    ) {
      if (
        shared.filterSubtitleLanguages.find(
          (filter) => filter.Selected && filter.Language == "<not available>"
        )
      ) {
        filterSubtitleLanguages = `AND (MOV.id_Movies NOT IN (SELECT id_Movies FROM tbl_Movies_Languages WHERE Type = 'subtitle') `;
      } else {
        filterSubtitleLanguages = `AND (1=0 `;
      }

      if (
        shared.filterSubtitleLanguages.find(
          (filter) => filter.Selected && filter.Language !== "<not available>"
        )
      ) {
        filterSubtitleLanguages += `OR MOV.id_Movies IN (SELECT id_Movies FROM tbl_Movies_Languages WHERE Type = 'subtitle' AND Language IN (`;

        filterSubtitleLanguages += shared.filterSubtitleLanguages
          .filter((filter) => filter.Selected)
          .map((filter) => filter.Language)
          .reduce((prev, current) => {
            return prev + (prev ? ", " : "") + `'${current}'`;
          }, "");

        filterSubtitleLanguages += "))";
      }

      filterSubtitleLanguages += ")";
    }

    let filterMetacriticScore = "";
    if (
      !(
        shared.filterMetacriticScore[0] == 0 &&
        shared.filterMetacriticScore[1] == 100 &&
        shared.filterMetacriticScoreNone == true
      )
    ) {
      if (!shared.filterMetacriticScoreNone) {
        filterMetacriticScore = "AND (MOV.IMDB_metacriticScore IS NOT NULL OR ";
      } else {
        filterMetacriticScore = "AND (1 = 0 OR ";
      }

      if (
        shared.filterMetacriticScore[0] > 0 ||
        shared.filterMetacriticScore[1] < 100
      ) {
        filterMetacriticScore += `(MOV.IMDB_metacriticScore >= ${
          shared.filterMetacriticScore[0]
          } AND MOV.IMDB_metacriticScore <= ${shared.filterMetacriticScore[1]})`;
      } else {
        filterMetacriticScore += "1 = 0";
      }

      filterMetacriticScore += ")";
    }

    let filterIMDBRating = "";
    if (
      !(
        shared.filterIMDBRating[0] == 0 &&
        shared.filterIMDBRating[1] == 10 &&
        shared.filterIMDBRatingNone == true
      )
    ) {
      if (!shared.filterIMDBRatingNone) {
        filterIMDBRating = "AND (MOV.IMDB_rating IS NOT NULL OR ";
      } else {
        filterIMDBRating = "AND (1 = 0 OR ";
      }

      if (shared.filterIMDBRating[0] > 0 || shared.filterIMDBRating[1] < 10) {
        filterIMDBRating += `(MOV.IMDB_rating >= ${
          shared.filterIMDBRating[0]
          } AND MOV.IMDB_rating <= ${shared.filterIMDBRating[1]})`;
      } else {
        filterIMDBRating += "1 = 0";
      }

      filterIMDBRating += ")";
    }

    let filter_id_Movies = "";
    if (arr_id_Movies && arr_id_Movies.length) {
      filter_id_Movies = "AND MOV.id_Movies IN (";
      filter_id_Movies += arr_id_Movies.reduce(
        (prev, current) => prev + (prev ? ", " : "") + `${current}`
      );
      filter_id_Movies += ")";
    }

    logger.log("fetchMedia filterSourcePaths:", filterSourcePaths);
    logger.log("fetchMedia filterGenres:", filterGenres);
    logger.log("fetchMedia filterAgeRatings:", filterAgeRatings);
    logger.log("fetchMedia filterRatings:", filterRatings);
    logger.log("fetchMedia filterLists:", filterLists);
    logger.log("fetchMedia filterParentalAdvisory:", filterParentalAdvisory);
    logger.log("fetchMedia filterPersons:", filterPersons);
    logger.log("fetchMedia filterCompanies:", filterCompanies);
    logger.log("fetchMedia filterIMDBPlotKeywords:", filterIMDBPlotKeywords);
    logger.log(
      "fetchMedia filterIMDBPlotKeywords:",
      filterIMDBFilmingLocations
    );
    logger.log("fetchMedia filterAudioLanguages:", filterAudioLanguages);
    logger.log("fetchMedia filter_id_Movies:", filter_id_Movies);

    const query = `
		SELECT
			MOV.id_Movies
			, MOV.Name
			, MOV.IMDB_rating${
      shared.imdbRatingDemographic ? "_" + shared.imdbRatingDemographic : ""
      } AS IMDB_rating_default
			, MOV.IMDB_metacriticScore
			, IFNULL(MOV.Rating, 0) AS Rating
			, MOV.startYear
			, MOV.created_at
			, MOV.last_access_at
      , MOV.IMDB_numVotes${
      shared.imdbRatingDemographic ? "_" + shared.imdbRatingDemographic : ""
      } AS IMDB_numVotes_default
      , MOV.IMDB_plotSummary
      , MOV.Path
      , MI_Duration_Formatted
      , IMDB_runtimeMinutes
      , AR.Age
      , MOV.IMDB_MinAge
      , MOV.IMDB_MaxAge

      ${
      minimumResultSet
        ? `
        , 0 AS isCompletelyFetched
        , NULL AS FileName
        , NULL AS Size
        , NULL AS file_created_at
        , NULL AS Name2
        , NULL AS endYear
        , NULL AS MI_Duration
        , NULL AS MI_Quality
        , NULL AS MI_Audio_Languages
        , NULL AS MI_Subtitle_Languages
        , NULL AS IMDB_tconst
        , NULL AS IMDB_posterSmall_URL
        , NULL AS IMDB_posterLarge_URL
        , NULL AS IMDB_plotSummaryFull
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
        , NULL AS IMDB_Trailer_URL
        , NULL AS NumExtras
      `
        : `
        , 1 AS isCompletelyFetched
        , MOV.FileName
        , MOV.Size
        , MOV.file_created_at
        , MOV.Name2
        , MOV.endYear
        , MOV.MI_Duration
        , MOV.MI_Quality
        , MOV.MI_Audio_Languages
        , MOV.MI_Subtitle_Languages
        , MOV.IMDB_tconst
        , MOV.IMDB_posterSmall_URL
        , MOV.IMDB_posterLarge_URL
        , MOV.IMDB_plotSummaryFull
        , (SELECT GROUP_CONCAT(G.Name, ', ') FROM tbl_Movies_Genres MG INNER JOIN tbl_Genres G ON MG.id_Genres = G.id_Genres AND MG.id_Movies = MOV.id_Movies) AS Genres
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
        , MOV.IMDB_Trailer_URL
        , (SELECT COUNT(1) FROM tbl_Movies MOVEXTRAS WHERE MOVEXTRAS.Extra_id_Movies_Owner = MOV.id_Movies) AS NumExtras
      `
      }
		FROM tbl_Movies MOV
		LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
		WHERE	(MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
					AND id_SourcePaths IN (SELECT id_SourcePaths FROM tbl_SourcePaths WHERE MediaType = $MediaType)
		${filterSourcePaths}
		${filterGenres}
		${filterAgeRatings}
		${filterRatings}
		${filterLists}
		${filterParentalAdvisory}
		${filterPersons}
		${filterYears}
		${filterQualities}
    ${filterCompanies}
    ${filterIMDBPlotKeywords}
    ${filterIMDBFilmingLocations}
		${filterAudioLanguages}
		${filterSubtitleLanguages}
		${filterMetacriticScore}
    ${filterIMDBRating}
    ${filter_id_Movies}
	`;

    logger.log("fetchMedia query:", query);

    const result = await db.fireProcedureReturnAll(query, { $MediaType });

    if (result && result.length > 0) {
      saveFilterValues($MediaType);
      saveSortValues($MediaType);
    }

    result.forEach((item) => {
      // logger.log(item.Name);
      item.IMDB_posterSmall_URL = item.IMDB_posterSmall_URL
        ? "file://" + helpers.getPath(item.IMDB_posterSmall_URL)
        : item.IMDB_posterSmall_URL;
      item.IMDB_posterLarge_URL = item.IMDB_posterLarge_URL
        ? "file://" + helpers.getPath(item.IMDB_posterLarge_URL)
        : item.IMDB_posterLarge_URL;
      item.yearDisplay = item.startYear
        ? "(" + item.startYear + (item.endYear ? `-${item.endYear}` : "") + ")"
        : "";
      item.IMDB_rating_defaultFormatted = item.IMDB_rating_default
        ? `${item.IMDB_rating_default.toLocaleString(undefined, {
          minimumFractionDigits: 1,
        })}`
        : "";
      item.IMDB_rating_defaultDisplay = item.IMDB_rating_defaultFormatted
        ? `${
        item.IMDB_rating_defaultFormatted
        } (${item.IMDB_numVotes_default.toLocaleString()})`
        : "";

      item.AudioLanguages = generateLanguageString(
        item.MI_Audio_Languages,
        preferredLanguages
      );

      item.SubtitleLanguages = generateLanguageString(
        item.MI_Subtitle_Languages,
        preferredLanguages
      );

      if (item.Age || item.Age === 0) {
        item.AgeRating = item.Age + "+";
      } else {
        if (item.IMDB_MinAge || item.IMDB_MinAge === 0) {
          item.AgeRating = `${item.IMDB_MinAge}${
            item.IMDB_MaxAge && item.IMDB_MaxAge > item.IMDB_MinAge
              ? "-" + item.IMDB_MaxAge
              : ""
            }+`;
        }
      }

      item.SearchSpace =
        (item.Name || "").toLowerCase() +
        " " +
        (item.Name2 || "").toLowerCase() +
        " " +
        (item.IMDB_plotSummary || "").toLowerCase() +
        " " +
        (item.Path || "").toLowerCase();

      item.IMDB_Top_Directors = item.IMDB_Top_Directors
        ? JSON.parse(item.IMDB_Top_Directors)
        : null;
      item.IMDB_Top_Writers = item.IMDB_Top_Writers
        ? JSON.parse(item.IMDB_Top_Writers)
        : null;
      item.IMDB_Top_Producers = item.IMDB_Top_Producers
        ? JSON.parse(item.IMDB_Top_Producers)
        : null;
      item.IMDB_Top_Cast = item.IMDB_Top_Cast
        ? JSON.parse(item.IMDB_Top_Cast)
        : null;
      item.IMDB_Top_Production_Companies = item.IMDB_Top_Production_Companies
        ? JSON.parse(item.IMDB_Top_Production_Companies)
        : null;

      if (item.MI_Duration_Formatted) {
        item.Duration = item.MI_Duration_Formatted;
      } else if (item.IMDB_runtimeMinutes) {
        item.Duration = helpers.getTimeString(item.IMDB_runtimeMinutes * 60);
      }

      // TODO: tranlate Genres
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

      if (item.AudioLanguages) {
        item.AudioLanguages = item.AudioLanguages.split(", ");
      }

      if (item.SubtitleLanguages) {
        item.SubtitleLanguages = item.SubtitleLanguages.split(", ");
      }

      // additional fields (prevent Recalculation of Pagination Items on mouseover)
      item.lists = [];
      item.extras = [];
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
    });

    return result;
  } catch (err) {
    logger.error(err);
    return;
  }
}

function generateLanguageString(languages, preferredLanguages) {
  if (!languages) {
    return null;
  }

  const maxLangDisplay = 2;
  const languagesSplit = languages.split(",");
  const preferredLanguagesJoinLower = preferredLanguages
    .join(", ")
    .toLowerCase();

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
    // logger.log('overshot languagesFiltered:', languagesFiltered);

    if (languagesFiltered.length - result.length < 2) {
      result.push(lastOvershotLanguage);
    } else {
      result.push("+" + (languagesFiltered.length - result.length));
    }

    // logger.log('result:', result);
  }

  if (!result) {
    result = languages;
  }

  return result.join(", ");
}

async function clearRating($id_Movies, isHandlingDuplicates) {
  await db.fireProcedure(
    `UPDATE tbl_Movies SET Rating = NULL WHERE id_Movies = $id_Movies`,
    { $id_Movies }
  );

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
  logger.log("setRating id_Movies:", $id_Movies, "Rating:", $Rating);
  try {
    await db.fireProcedure(
      `UPDATE tbl_Movies SET Rating = $Rating WHERE id_Movies = $id_Movies`,
      { $id_Movies, $Rating }
    );

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
    return await db.fireProcedureReturnScalar(
      `SELECT Value FROM tbl_Settings WHERE Key = $Key`,
      { $Key }
    );
  } catch (err) {
    logger.error(err);
    return null;
  }
}

async function setSetting($Key, $Value) {
  try {
    const mustUpdate = await db.fireProcedureReturnScalar(
      `SELECT COUNT(1) FROM tbl_Settings WHERE Key = $Key`,
      { $Key }
    );

    if (mustUpdate) {
      await db.fireProcedure(
        `UPDATE tbl_Settings SET Value = $Value WHERE Key = $Key`,
        { $Value, $Key }
      );
    } else {
      await db.fireProcedure(
        `INSERT INTO tbl_Settings (Key, Value) VALUES ($Key, $Value)`,
        { $Value, $Key }
      );
    }
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
        text:
          "Unable to launch: Mediaplayer Path is not set_ Please go to Settings and provide one_",
      },
    });
  }

  const fileExists = await existsAsync(movie.Path);

  if (!fileExists) {
    eventBus.showSnackbar("error", {
      translateMe: {
        text: "Cannot access {path}",
        payload: {
          path: movie.Path,
        },
      },
    });
    return;
  }

  const task = `${MediaplayerPath} "${movie.Path}"`;
  logger.log("launching:", task);
  await execAsync(task);
  logger.log("end launching:", task);
}

async function fetchFilterValues($MediaType) {
  const result = await getSetting(`filtersMediaType${$MediaType}`);
  if (!result) {
    return null;
  }

  return JSON.parse(result);
}

async function fetchSortValues($MediaType) {
  logger.log("fetchSortValues");

  const result = await getSetting(`sortMediaType${$MediaType}`);
  if (!result) {
    return null;
  }

  shared.sortField = JSON.parse(result).sortField;

  logger.log("shared.sortField:", shared.sortField);

  return JSON.parse(result);
}

async function fetchFilterSourcePaths($MediaType) {
  logger.log("fetchFilterSourcePaths MediaType:", $MediaType);

  const filterValues = await fetchFilterValues($MediaType);

  logger.log("fetchFilterSourcePaths filterValues:", filterValues);

  const results = await db.fireProcedureReturnAll(
    `
			SELECT DISTINCT
			1 AS Selected
			, SP.Description
			, (SELECT COUNT(1) FROM tbl_Movies MOV WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL AND id_SourcePaths IN (SELECT id_SourcePaths FROM tbl_SourcePaths SP2 WHERE SP2.Description = SP.Description)) AS NumMovies
		FROM tbl_SourcePaths SP WHERE MediaType = $MediaType`,
    { $MediaType }
  );

  if (filterValues && filterValues.filterSourcePaths) {
    results.forEach((result) => {
      const filterValue = filterValues.filterSourcePaths.find(
        (value) => value.Description === result.Description
      );

      if (filterValue) {
        result.Selected = filterValue.Selected;
      }

      result.NumMovies = result.NumMovies.toLocaleString();
    });
  }

  logger.log("fetchFilterSourcePaths result:", results);

  shared.filterSourcePaths = results;
}

async function fetchFilterGenres($MediaType, $t) {
  logger.log("fetchFilterGenres MediaType:", $MediaType);

  const filterValues = await fetchFilterValues($MediaType);

  logger.log("fetchFilterGenres filterValues:", filterValues);

  const results = await db.fireProcedureReturnAll(
    `
			SELECT
			id_Genres
			, GenreID
			, Name
			, 1 AS Selected
			, (
				SELECT COUNT(1)
				FROM tbl_Movies_Genres MG
				INNER JOIN tbl_Movies MOV ON MG.id_Movies = MOV.id_Movies AND (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
				INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
				WHERE MG.id_Genres = G.id_Genres
			) AS NumMovies
		FROM tbl_Genres G
		ORDER BY Name`,
    { $MediaType }
  );

  const resultsFiltered = results.filter((result) => result.NumMovies > 0);

  if (filterValues && filterValues.filterGenres) {
    resultsFiltered.forEach((result) => {
      const filterValue = filterValues.filterGenres.find(
        (value) => value.GenreID === result.GenreID
      );

      if (filterValue) {
        result.Selected = filterValue.Selected;
      }

      result.NumMovies = result.NumMovies.toLocaleString();
    });
  }

  // Translate
  resultsFiltered.forEach((resultFiltered) => {
    const genreNameTranslated = $t(`GenreNames.${resultFiltered.Name}`);

    if (genreNameTranslated && !genreNameTranslated.includes(".")) {
      resultFiltered.Name = genreNameTranslated;
    }
  });

  logger.log("fetchFilterGenres resultsFiltered:", resultsFiltered);

  shared.filterGenres = resultsFiltered;
}

async function fetchFilterAgeRatings($MediaType) {
  logger.log("fetchFilterAgeRatings MediaType:", $MediaType);

  const filterValues = await fetchFilterValues($MediaType);

  logger.log("fetchFilterAgeRatings filterValues:", filterValues);

  const results = await db.fireProcedureReturnAll(
    `
		SELECT
			-1 AS Age
			, (SELECT COUNT(1) FROM tbl_Movies MOV INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND MediaType = $MediaType WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL AND MOV.IMDB_id_AgeRating_Chosen_Country IS NULL) AS NumMovies
			, 1 AS Selected
		UNION
		SELECT
			Age
			, COUNT(1) AS NumMovies
			, 1 AS Selected
		FROM (
			SELECT
				AR.Age
			FROM tbl_Movies MOV
			INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND MediaType = $MediaType
			INNER JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating AND AR.Age IS NOT NULL
			WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
		)
		GROUP BY (Age)`,
    { $MediaType }
  );

  const resultsFiltered = results.filter((result) => result.NumMovies > 0);

  if (filterValues && filterValues.filterAgeRatings) {
    resultsFiltered.forEach((result) => {
      const filterValue = filterValues.filterAgeRatings.find(
        (value) => value.Age === result.Age
      );

      if (filterValue) {
        result.Selected = filterValue.Selected;
      }

      result.NumMovies = result.NumMovies.toLocaleString();
    });
  }

  logger.log("fetchFilterAgeRatings resultsFiltered:", resultsFiltered);

  shared.filterAgeRatings = resultsFiltered;
}

async function fetchFilterRatings($MediaType) {
  logger.log("fetchFilterRatings MediaType:", $MediaType);

  const filterValues = await fetchFilterValues($MediaType);

  logger.log("fetchFilterRatings filterValues:", filterValues);

  const results = await db.fireProcedureReturnAll(
    `
			SELECT
				0 AS Rating
				, 1 AS Selected
				, (
					SELECT COUNT(1)
					FROM tbl_Movies MOV
					INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
					WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
								AND (MOV.Rating IS NULL OR MOV.Rating = 0)
				) AS NumMovies
			UNION
			SELECT
				1 AS Rating
				, 1 AS Selected
				, (
					SELECT COUNT(1)
					FROM tbl_Movies MOV
					INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
					WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL AND MOV.Rating = 1
				) AS NumMovies
			UNION
			SELECT
				2 AS Rating
				, 1 AS Selected
				, (
					SELECT COUNT(1)
					FROM tbl_Movies MOV
					INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
					WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL AND MOV.Rating = 2
				) AS NumMovies
			UNION
			SELECT
				3 AS Rating
				, 1 AS Selected
				, (
					SELECT COUNT(1)
					FROM tbl_Movies MOV
					INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
					WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL AND MOV.Rating = 3
				) AS NumMovies
			UNION
			SELECT
				4 AS Rating
				, 1 AS Selected
				, (
					SELECT COUNT(1)
					FROM tbl_Movies MOV
					INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
					WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL AND MOV.Rating = 4
				) AS NumMovies
			UNION
			SELECT
				5 AS Rating
				, 1 AS Selected
				, (
					SELECT COUNT(1)
					FROM tbl_Movies MOV
					INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
					WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL AND MOV.Rating = 5
				) AS NumMovies
				`,
    { $MediaType }
  );

  if (filterValues && filterValues.filterRatings) {
    results.forEach((result) => {
      const filterValue = filterValues.filterRatings.find(
        (value) => value.Rating === result.Rating
      );

      if (filterValue) {
        result.Selected = filterValue.Selected;
      }

      result.NumMovies = result.NumMovies.toLocaleString();
    });
  }

  logger.log("fetchFilterRatings results:", results);

  shared.filterRatings = results;
}

async function fetchFilterParentalAdvisory($MediaType) {
  const Nudity = await fetchFilterParentalAdvisoryCategory(
    $MediaType,
    "Nudity"
  );
  const Violence = await fetchFilterParentalAdvisoryCategory(
    $MediaType,
    "Violence"
  );
  const Profanity = await fetchFilterParentalAdvisoryCategory(
    $MediaType,
    "Profanity"
  );
  const Alcohol = await fetchFilterParentalAdvisoryCategory(
    $MediaType,
    "Alcohol"
  );
  const Frightening = await fetchFilterParentalAdvisoryCategory(
    $MediaType,
    "Frightening"
  );

  shared.filterParentalAdvisory = {
    Nudity,
    Violence,
    Profanity,
    Alcohol,
    Frightening,
  };
}

async function fetchFilterParentalAdvisoryCategory($MediaType, PA_Category) {
  logger.log(
    `fetchFilterParentalAdvisory${PA_Category} MediaType:`,
    $MediaType
  );

  const filterValues = await fetchFilterValues($MediaType);

  logger.log(
    `fetchFilterParentalAdvisory${PA_Category} filterValues:`,
    filterValues
  );

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
					WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL AND MOV.IMDB_Parental_Advisory_${PA_Category} IS NULL
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
					WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL AND MOV.IMDB_Parental_Advisory_${PA_Category} = 0
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
					WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL AND MOV.IMDB_Parental_Advisory_${PA_Category} = 1
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
					WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL AND MOV.IMDB_Parental_Advisory_${PA_Category} = 2
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
					WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL AND MOV.IMDB_Parental_Advisory_${PA_Category} = 3
				) AS NumMovies
				`,
    { $MediaType }
  );

  if (
    filterValues &&
    filterValues.filterParentalAdvisory &&
    filterValues.filterParentalAdvisory[PA_Category]
  ) {
    results.forEach((result) => {
      const filterValue = filterValues.filterParentalAdvisory[PA_Category].find(
        (value) => value.Severity === result.Severity
      );

      if (filterValue) {
        result.Selected = filterValue.Selected;
      }

      result.NumMovies = result.NumMovies.toLocaleString();
    });
  }

  logger.log(`fetchFilterParentalAdvisory${PA_Category} results:`, results);

  return results;
}

async function fetchFilterPersons($MediaType, $t) {
  const filterValues = await fetchFilterValues($MediaType);

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
					WHERE
						(MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
						AND MOV.id_Movies NOT IN (
						SELECT DISTINCT MC.id_Movies
						FROM tbl_Movies_IMDB_Credits MC
						INNER JOIN tbl_Movies MOV2 ON MC.id_Movies = MOV2.id_Movies
						INNER JOIN tbl_SourcePaths SP2 ON MOV2.id_SourcePaths = SP2.id_SourcePaths AND SP2.MediaType = $MediaType
						WHERE MC.IMDB_Person_ID IN (SELECT IMDB_Person_ID FROM tbl_Filter_Persons)
					)
				)
			AS NumMovies
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
						WHERE MC.IMDB_Person_ID = FILTERPERSON.IMDB_Person_ID
					)
			) AS NumMovies
		FROM tbl_Filter_Persons FILTERPERSON
	`,
    { $MediaType, $any: $t("<any other person>") }
  );

  // logger.log('fetchFilterPersons QUERY:', )

  if (filterValues && filterValues.filterPersons) {
    results.forEach((result) => {
      const filterValue = filterValues.filterPersons.find(
        (value) => value.id_Filter_Persons === result.id_Filter_Persons
      );

      if (filterValue) {
        result.Selected = filterValue.Selected;
      }

      result.NumMovies = result.NumMovies.toLocaleString();
    });
  }

  logger.log("fetchFilterPersons result:", results);

  shared.filterPersons = results;
}

async function fetchFilterCompanies($MediaType, $t) {
  const filterValues = await fetchFilterValues($MediaType);

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
					WHERE
						(MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
              AND MOV.id_Movies NOT IN (
              SELECT DISTINCT MC.id_Movies
              FROM tbl_Movies_IMDB_Companies MC
              INNER JOIN tbl_Movies MOV2 ON MC.id_Movies = MOV2.id_Movies
              INNER JOIN tbl_SourcePaths SP2 ON MOV2.id_SourcePaths = SP2.id_SourcePaths AND SP2.MediaType = $MediaType
              WHERE MC.Company_Name IN (SELECT Company_Name FROM tbl_Filter_Companies)
					)
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
						WHERE MC.Company_Name = FILTERCOMPANY.Company_Name
					)
			) AS NumMovies
		FROM tbl_Filter_Companies FILTERCOMPANY
	`,
    { $MediaType, $any: $t("<any other company>") }
  );

  // logger.log('fetchFilterCompanies QUERY:', )

  if (filterValues && filterValues.filterCompanies) {
    results.forEach((result) => {
      const filterValue = filterValues.filterCompanies.find(
        (value) => value.id_Filter_Companies === result.id_Filter_Companies
      );

      if (filterValue) {
        result.Selected = filterValue.Selected;
      }

      result.NumMovies = result.NumMovies.toLocaleString();
    });
  }

  logger.log("fetchFilterCompanies result:", results);

  shared.filterCompanies = results;
}

async function fetchFilterIMDBPlotKeywords($MediaType, $t) {
  const filterValues = await fetchFilterValues($MediaType);

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
					WHERE
						(MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
						AND MOV.id_Movies NOT IN (
              SELECT DISTINCT MPK.id_Movies
              FROM tbl_Movies_IMDB_Plot_Keywords MPK
              INNER JOIN tbl_Movies MOV2 ON MPK.id_Movies = MOV2.id_Movies
              INNER JOIN tbl_SourcePaths SP2 ON MOV2.id_SourcePaths = SP2.id_SourcePaths AND SP2.MediaType = $MediaType
              WHERE MPK.id_IMDB_Plot_Keywords IN (SELECT id_IMDB_Plot_Keywords FROM tbl_Filter_IMDB_Plot_Keywords)
					)
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
            INNER JOIN tbl_Movies MOV2 ON MPK.id_Movies = MOV2.id_Movies
            INNER JOIN tbl_SourcePaths SP2 ON MOV2.id_SourcePaths = SP2.id_SourcePaths AND SP2.MediaType = $MediaType
            WHERE MPK.id_IMDB_Plot_Keywords IN (SELECT id_IMDB_Plot_Keywords FROM tbl_Filter_IMDB_Plot_Keywords WHERE id_IMDB_Plot_Keywords = FILTERPLOTKEYWORDS.id_IMDB_Plot_Keywords)
        )
			) AS NumMovies
		FROM tbl_Filter_IMDB_Plot_Keywords FILTERPLOTKEYWORDS
	`,
    { $MediaType, $any: $t("<any other plot keyword>") }
  );

  // logger.log('fetchFilterIMDBPlotKeywords QUERY:', )

  if (filterValues && filterValues.filterIMDBPlotKeywords) {
    results.forEach((result) => {
      const filterValue = filterValues.filterIMDBPlotKeywords.find(
        (value) =>
          value.id_Filter_IMDB_Plot_Keywords ===
          result.id_Filter_IMDB_Plot_Keywords
      );

      if (filterValue) {
        result.Selected = filterValue.Selected;
      }

      result.NumMovies = result.NumMovies.toLocaleString();
    });
  }

  logger.log("fetchFilterIMDBPlotKeywords result:", results);

  shared.filterIMDBPlotKeywords = results;
}

async function fetchFilterIMDBFilmingLocations($MediaType, $t) {
  const filterValues = await fetchFilterValues($MediaType);

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
					WHERE
						(MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
						AND MOV.id_Movies NOT IN (
              SELECT DISTINCT MFL.id_Movies
              FROM tbl_Movies_IMDB_Filming_Locations MFL
              INNER JOIN tbl_Movies MOV2 ON MFL.id_Movies = MOV2.id_Movies
              INNER JOIN tbl_SourcePaths SP2 ON MOV2.id_SourcePaths = SP2.id_SourcePaths AND SP2.MediaType = $MediaType
              WHERE MFL.id_IMDB_Filming_Locations IN (SELECT id_IMDB_Filming_Locations FROM tbl_Filter_IMDB_Filming_Locations)
					)
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
            INNER JOIN tbl_Movies MOV2 ON MFL.id_Movies = MOV2.id_Movies
            INNER JOIN tbl_SourcePaths SP2 ON MOV2.id_SourcePaths = SP2.id_SourcePaths AND SP2.MediaType = $MediaType
            WHERE MFL.id_IMDB_Filming_Locations IN (SELECT id_IMDB_Filming_Locations FROM tbl_Filter_IMDB_Filming_Locations WHERE id_IMDB_Filming_Locations = FILTERFILMINGLOCATIONS.id_IMDB_Filming_Locations)
        )
			) AS NumMovies
		FROM tbl_Filter_IMDB_Filming_Locations FILTERFILMINGLOCATIONS
	`,
    { $MediaType, $any: $t("<any other filming location>") }
  );

  if (filterValues && filterValues.filterIMDBFilmingLocations) {
    results.forEach((result) => {
      const filterValue = filterValues.filterIMDBFilmingLocations.find(
        (value) =>
          value.id_Filter_IMDB_Filming_Locations ===
          result.id_Filter_IMDB_Filming_Locations
      );

      if (filterValue) {
        result.Selected = filterValue.Selected;
      }

      result.NumMovies = result.NumMovies.toLocaleString();
    });
  }

  logger.log("fetchFilterIMDBFilmingLocations result:", results);

  shared.filterIMDBFilmingLocations = results;
}

async function fetchFilterYears($MediaType) {
  logger.log("fetchFilterYears MediaType:", $MediaType);

  const filterValues = await fetchFilterValues($MediaType);

  logger.log("fetchFilterYears filterValues:", filterValues);

  const results = await db.fireProcedureReturnAll(
    `
		SELECT
			'-1' AS startYear
			, COUNT(1) AS NumMovies
			, 1 AS Selected
		FROM tbl_Movies MOV
		INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND MediaType = $MediaType
		WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL AND MOV.startYear IS NULL
		UNION
		SELECT
			startYear
			, COUNT(1) AS NumMovies
			, 1 AS Selected
		FROM tbl_Movies MOV
		INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND MediaType = $MediaType
		WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL AND MOV.startYear IS NOT NULL
		GROUP BY (startYear)
		ORDER BY startYear DESC`,
    { $MediaType }
  );

  const resultsFiltered = results.filter((result) => result.NumMovies > 0);

  results.forEach((result) => {
    result.startYear = parseInt(result.startYear);
  });

  if (filterValues && filterValues.filterYear) {
    resultsFiltered.forEach((result) => {
      const filterValue = filterValues.filterYear.find(
        (value) => value.startYear == result.startYear
      );

      if (filterValue) {
        result.Selected = filterValue.Selected;
      }

      result.NumMovies = result.NumMovies.toLocaleString();
    });
  }

  logger.log("fetchFilterYears resultsFiltered:", resultsFiltered);

  shared.filterYears = resultsFiltered;
}

async function fetchFilterQualities($MediaType) {
  logger.log("fetchFilterQualities MediaType:", $MediaType);

  const filterValues = await fetchFilterValues($MediaType);

  logger.log("fetchFilterQualities filterValues:", filterValues);

  const results = await db.fireProcedureReturnAll(
    `
		SELECT
			MI_Quality
			, COUNT(1) AS NumMovies
			, 1 AS Selected
		FROM tbl_Movies MOV
		INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND MediaType = $MediaType
		WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
		GROUP BY (MI_Quality)`,
    { $MediaType }
  );

  const resultsFiltered = results.filter((result) => result.NumMovies > 0);

  if (filterValues && filterValues.filterQualities) {
    resultsFiltered.forEach((result) => {
      const filterValue = filterValues.filterQualities.find(
        (value) => value.MI_Quality == result.MI_Quality
      );

      if (filterValue) {
        result.Selected = filterValue.Selected;
      }

      result.NumMovies = result.NumMovies.toLocaleString();
    });
  }

  logger.log("fetchFilterQualities resultsFiltered:", resultsFiltered);

  shared.filterQualities = resultsFiltered;
}

function abortRescan() {
  doAbortRescan = true;
}

function saveFilterValues($MediaType) {
  const filterValues = {
    filterSettings: shared.filterSettings,
    filterSourcePaths: shared.filterSourcePaths,
    filterGenres: shared.filterGenres,
    filterAgeRatings: shared.filterAgeRatings,
    filterRatings: shared.filterRatings,
    filterLists: shared.filterLists,
    filterParentalAdvisory: shared.filterParentalAdvisory,
    filterPersons: shared.filterPersons,
    filterYears: shared.filterYears,
    filterQualities: shared.filterQualities,
    filterCompanies: shared.filterCompanies,
    filterIMDBRating: shared.filterIMDBRating,
    filterIMDBRatingNone: shared.filterIMDBRatingNone,
    filterMetacriticScore: shared.filterMetacriticScore,
    filterMetacriticScoreNone: shared.filterMetacriticScoreNone,
  };

  const filterValuesString = JSON.stringify(filterValues);

  logger.log("saveFilterValues:", filterValuesString);

  setSetting(`filtersMediaType${$MediaType}`, filterValuesString);
}

async function saveSortValues($MediaType) {
  const sortValues = {
    sortField: shared.sortField,
  };

  const sortValuesString = JSON.stringify(sortValues);

  await setSetting(`sortMediaType${$MediaType}`, sortValuesString);
}

async function createList($Name) {
  const id_Lists = await db.fireProcedureReturnScalar(
    `SELECT id_Lists FROM tbl_Lists WHERE Name = $Name`,
    { $Name }
  );
  if (id_Lists) {
    throw definedError.create(
      "a list with the same name already exists",
      null,
      null,
      null
    );
  }

  await db.fireProcedure(
    `INSERT INTO tbl_Lists (Name, created_at) VALUES ($Name, DATETIME('now'))`,
    { $Name }
  );
  return await db.fireProcedureReturnScalar(
    `SELECT id_Lists FROM tbl_Lists WHERE Name = $Name`,
    { $Name }
  );
}

async function addToList($id_Lists, $id_Movies, isHandlingDuplicates) {
  const id_Lists = await db.fireProcedureReturnScalar(
    `SELECT id_Lists_Movies FROM tbl_Lists_Movies WHERE id_Lists = $id_Lists AND id_Movies = $id_Movies`,
    { $id_Lists, $id_Movies }
  );
  if (id_Lists) {
    if (isHandlingDuplicates) {
      return;
    }

    throw definedError.create(
      "the item is already part of the list",
      null,
      null,
      null
    );
  }

  await db.fireProcedure(
    `INSERT INTO tbl_Lists_Movies (id_Lists, id_Movies, created_at) VALUES ($id_Lists, $id_Movies, DATETIME('now'))`,
    { $id_Lists, $id_Movies }
  );

  if (!isHandlingDuplicates) {
    const duplicates = await getMovieDuplicates(
      $id_Movies,
      shared.duplicatesHandling.actualDuplicate.addToList,
      shared.duplicatesHandling.metaDuplicate.addToList
    );
    logger.log("duplicates:", duplicates);

    for (let i = 0; i < duplicates.length; i++) {
      await addToList($id_Lists, duplicates[i], true);
    }
  }
}

async function removeFromList($id_Lists, $id_Movies) {
  logger.log("removeFromList $id_Lists:", $id_Lists, "$id_Movies:", $id_Movies);
  return await db.fireProcedureReturnScalar(
    `DELETE FROM tbl_Lists_Movies WHERE id_Lists = $id_Lists AND id_Movies = $id_Movies`,
    { $id_Lists, $id_Movies }
  );
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
  const filterValues = await fetchFilterValues($MediaType);

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
				WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL AND MOV.id_Movies NOT IN (SELECT id_Movies FROM tbl_Lists_Movies)
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
				WHERE LM.id_Lists = LISTS.id_Lists
			) AS NumMovies
		FROM tbl_Lists LISTS
		ORDER BY Name
	`,
    { $MediaType, $any: $t("<not in any list>") }
  );

  if (filterValues && filterValues.filterLists) {
    results.forEach((result) => {
      const filterValue = filterValues.filterLists.find(
        (value) => value.Name === result.Name
      );

      if (filterValue) {
        result.Selected = filterValue.Selected;
      }

      result.NumMovies = result.NumMovies.toLocaleString();
    });
  }

  logger.log("fetchFilterLists result:", results);

  shared.filterLists = results;
}

async function fetchFilterLanguages($MediaType, $LanguageType, $t) {
  logger.log("fetchFilterLanguages MediaType:", $MediaType);

  const filterValues = await fetchFilterValues($MediaType);

  logger.log("fetchFilterLanguages filterValues:", filterValues);

  const results = await db.fireProcedureReturnAll(
    `
		SELECT 
			'<not available>' AS Language
			, '<not available>' AS DisplayText
			, 1 AS Selected
			, (
					SELECT COUNT(1) FROM tbl_Movies MOV
					INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
					WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
					AND MOV.id_Movies NOT IN (
						SELECT id_Movies
						FROM	tbl_Movies_Languages ML
						WHERE ML.Type = $LanguageType
					)
				) AS NumMovies
		UNION
		SELECT
			Language
			, '' AS DisplayText
			, 1 AS Selected
			, (
					SELECT COUNT(1) FROM tbl_Movies_Languages ML2
					INNER JOIN tbl_Movies MOV2 ON ML2.id_Movies = MOV2.id_Movies
					INNER JOIN tbl_SourcePaths SP2 ON MOV2.id_SourcePaths = SP2.id_SourcePaths AND SP2.MediaType = $MediaType
					WHERE	ML.Language = ML2.Language
							AND ML2.Type = $LanguageType
							AND (MOV2.isRemoved IS NULL OR MOV2.isRemoved = 0)
							AND MOV2.Extra_id_Movies_Owner IS NULL
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

  const resultsFiltered = results.filter((result) => result.NumMovies > 0);

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
      const filterValue = filterValuesLanguages.find(
        (value) => value.Language === result.Language
      );

      if (filterValue) {
        result.Selected = filterValue.Selected;
      }
    }

    result.NumMovies = result.NumMovies.toLocaleString();

    result.DisplayText = result.Language;
    if (languageCodeNameMapping[result.Language]) {
      result.DisplayText = `${result.Language} - ${
        languageCodeNameMapping[result.Language]
        }`;
      result.LanguageFull = languageCodeNameMapping[result.Language];
    }
  });

  logger.log("fetchFilterLanguages resultsFiltered:", resultsFiltered);

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
    shared.filterAudioLanguages = resultsFiltered;
  } else {
    shared.filterSubtitleLanguages = resultsFiltered;
  }
}

async function fetchFilterIMDBRating($MediaType) {
  const filterValues = await fetchFilterValues($MediaType);

  if (
    filterValues &&
    filterValues.filterIMDBRating &&
    filterValues.filterIMDBRating.length > 0
  ) {
    shared.filterIMDBRating = filterValues.filterIMDBRating;
  }

  if (
    filterValues &&
    filterValues.filterIMDBRatingNone != null &&
    filterValues.filterIMDBRatingNone != undefined
  ) {
    shared.filterIMDBRatingNone = filterValues.filterIMDBRatingNone;
  }
}

async function fetchFilterMetacriticScore($MediaType) {
  const filterValues = await fetchFilterValues($MediaType);

  if (
    filterValues &&
    filterValues.filterMetacriticScore &&
    filterValues.filterMetacriticScore.length > 0
  ) {
    shared.filterMetacriticScore = filterValues.filterMetacriticScore;
  }

  if (
    filterValues &&
    filterValues.filterMetacriticScoreNone != null &&
    filterValues.filterMetacriticScoreNone != undefined
  ) {
    shared.filterMetacriticScoreNone = filterValues.filterMetacriticScoreNone;
  }
}

async function fetchFilterSettings($MediaType) {
  logger.log("fetchFilterSettings START");

  const filterValues = await fetchFilterValues($MediaType);

  logger.log("fetchFilterSettings filterValues:", filterValues);

  if (filterValues && filterValues.filterSettings) {
    logger.log(
      "fetchFilterSettings filterValues.filterSettings:",
      filterValues
    );

    shared.filterSettings = filterValues.filterSettings;
  }
}

async function getMovieDetails($id_Movies) {
  const lists = await db.fireProcedureReturnAll(
    `SELECT id_Lists, Name FROM tbl_Lists WHERE id_Lists IN (SELECT id_Lists FROM tbl_Lists_Movies WHERE id_Movies = $id_Movies) ORDER BY Name`,
    { $id_Movies }
  );

  const extras = await db.fireProcedureReturnAll(
    `SELECT id_Movies, Path, Filename, Name FROM tbl_Movies WHERE Extra_id_Movies_Owner = $id_Movies`,
    { $id_Movies }
  );

  return {
    lists,
    extras,
  };
}

async function setLastAccess($id_Movies, isHandlingDuplicates) {
  await db.fireProcedure(
    `UPDATE tbl_Movies SET last_access_at = DATETIME('now') WHERE id_Movies = $id_Movies`,
    { $id_Movies }
  );

  if (!isHandlingDuplicates) {
    const duplicates = await getMovieDuplicates(
      $id_Movies,
      shared.duplicatesHandling.actualDuplicate.updateLastAccess,
      false
    );

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

    creditsCategorized
      .find((cc) => cc.category === credit.category)
      .items.push(credit);
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

    companiesCategorized
      .find((cc) => cc.category === company.category)
      .items.push(company);
  });

  return companiesCategorized;
}

async function fetchMoviePlotKeywords($id_Movies) {
  return await db.fireProcedureReturnAll(
    `
    SELECT
      PK.id_IMDB_Plot_Keywords
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
      MFL.id_IMDB_Filming_Locations
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
  const id_Filter_Persons = await db.fireProcedureReturnScalar(
    `SELECT id_Filter_Persons FROM tbl_Filter_Persons WHERE IMDB_Person_ID = $IMDB_Person_ID`,
    { $IMDB_Person_ID }
  );
  if (id_Filter_Persons) {
    return;
  }

  await db.fireProcedure(
    `INSERT INTO tbl_Filter_persons (IMDB_Person_ID, Person_Name, created_at) VALUES ($IMDB_Person_ID, $Person_Name, DATETIME('now'))`,
    { $IMDB_Person_ID, $Person_Name }
  );
}

async function deleteFilterPerson($id_Filter_Persons) {
  return await db.fireProcedureReturnScalar(
    `DELETE FROM tbl_Filter_Persons WHERE id_Filter_Persons = $id_Filter_Persons`,
    { $id_Filter_Persons }
  );
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

async function addFilterIMDBFilmingLocation(
  $id_IMDB_Filming_Locations,
  $Location
) {
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
  return await db.fireProcedureReturnScalar(
    `DELETE FROM tbl_Filter_IMDB_Plot_Keywords WHERE id_Filter_IMDB_Plot_Keywords = $id_Filter_IMDB_Plot_Keywords`,
    { $id_Filter_IMDB_Plot_Keywords }
  );
}

async function deleteFilterIMDBFilmingLocation(
  $id_Filter_IMDB_Filming_Locations
) {
  return await db.fireProcedureReturnScalar(
    `DELETE FROM tbl_Filter_IMDB_Filming_Locations WHERE id_Filter_IMDB_Filming_Locations = $id_Filter_IMDB_Filming_Locations`,
    { $id_Filter_IMDB_Filming_Locations }
  );
}

async function addFilterCompany($Company_Name) {
  const id_Filter_Companies = await db.fireProcedureReturnScalar(
    `SELECT id_Filter_Companies FROM tbl_Filter_Companies WHERE Company_Name = $Company_Name`,
    { $Company_Name }
  );
  if (id_Filter_Companies) {
    return;
  }

  await db.fireProcedure(
    `INSERT INTO tbl_Filter_Companies (Company_Name, created_at) VALUES ($Company_Name, DATETIME('now'))`,
    { $Company_Name }
  );
}

async function deleteFilterCompany($id_Filter_Companies) {
  return await db.fireProcedureReturnScalar(
    `DELETE FROM tbl_Filter_Companies WHERE id_Filter_Companies = $id_Filter_Companies`,
    { $id_Filter_Companies }
  );
}

async function assignIMDB(
  $id_Movies,
  $IMDB_tconst,
  isHandlingDuplicates,
  noEventBus
) {
  logger.log(
    "assignIMDB $id_Movies:",
    $id_Movies,
    "$IMDB_tconst:",
    $IMDB_tconst
  );

  await db.fireProcedure(
    `UPDATE tbl_Movies SET IMDB_tconst = $IMDB_tconst WHERE id_Movies = $id_Movies`,
    { $id_Movies, $IMDB_tconst }
  );

  // rescan IMDB Metadata
  if (!noEventBus) {
    eventBus.rescanStarted();
  }

  await rescanMoviesMetaData(false, $id_Movies);
  await applyMetaData(false, $id_Movies);

  if (isHandlingDuplicates) {
    return;
  }

  const duplicates = await getMovieDuplicates(
    $id_Movies,
    shared.duplicatesHandling.actualDuplicate.relinkIMDB,
    false
  );

  for (let i = 0; i < duplicates.length; i++) {
    await assignIMDB(duplicates[i], $IMDB_tconst, true);
  }

  if (!noEventBus) {
    eventBus.rescanStopped();
  }
}

async function saveCurrentPage($MediaType) {
  logger.log("saveCurrentPage");

  logger.log("saveCurrentPage shared.currentPage:", shared.currentPage);
  await setSetting(`currentPageMediatype${$MediaType}`, shared.currentPage);
}

async function fetchCurrentPage($MediaType) {
  logger.log("fetchCurrentPage");

  const currentPage = await getSetting(`currentPageMediatype${$MediaType}`);
  shared.currentPage = parseInt(currentPage || 1);

  logger.log("fetchCurrentPage shared.currentPage:", shared.currentPage);
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

    logger.log("loadedSetting:", loadedSetting);

    if (!loadedSetting) {
      return;
    }

    const objLoadedSetting = JSON.parse(loadedSetting);

    if (objLoadedSetting.actualDuplicate) {
      Object.keys(objLoadedSetting.actualDuplicate).forEach((key) => {
        if (shared.duplicatesHandling.actualDuplicate.hasOwnProperty(key)) {
          shared.duplicatesHandling.actualDuplicate[key] =
            objLoadedSetting.actualDuplicate[key];
        }
      });
    }

    if (objLoadedSetting.metaDuplicate) {
      Object.keys(objLoadedSetting.metaDuplicate).forEach((key) => {
        if (shared.duplicatesHandling.metaDuplicate.hasOwnProperty(key)) {
          shared.duplicatesHandling.metaDuplicate[key] =
            objLoadedSetting.metaDuplicate[key];
        }
      });
    }
  } catch (e) {
    //
  }
}

async function getMovieDuplicates(
  $id_Movies,
  useActualDuplicates,
  useMetaDuplicates,
  ignoreNew
) {
  const result = [];

  if (!useActualDuplicates && !useMetaDuplicates) {
    logger.log("getMovieDuplicates bailing out");
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
          ${
        ignoreNew ? "AND (MOV.isNew IS NULL OR MOV.isNew = 0)" : ""
        }    -- optional: only newly added movies (rescan)
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
        ${
        ignoreNew ? "AND (MOV.isNew IS NULL OR MOV.isNew = 0)" : ""
        }      -- optional: only newly added movies (rescan)
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
  await db.fireProcedure(
    "DELETE FROM tbl_Movies_Genres WHERE id_Movies NOT IN (SELECT id_Movies FROM tbl_Movies)"
  );
  await db.fireProcedure(
    "DELETE FROM tbl_Movies_IMDB_Companies WHERE id_Movies NOT IN (SELECT id_Movies FROM tbl_Movies)"
  );
  await db.fireProcedure(
    "DELETE FROM tbl_Movies_IMDB_Credits WHERE id_Movies NOT IN (SELECT id_Movies FROM tbl_Movies)"
  );
  await db.fireProcedure(
    "DELETE FROM tbl_Movies_Languages WHERE id_Movies NOT IN (SELECT id_Movies FROM tbl_Movies)"
  );
}

async function updateMovieAttribute(
  $id_Movies,
  attributeName,
  $value,
  useActualDuplicates,
  useMetaDuplicates,
  isHandlingDuplicates
) {
  await db.fireProcedure(
    `UPDATE tbl_Movies SET ${attributeName} = $value WHERE id_Movies = $id_Movies`,
    {
      $value,
      $id_Movies,
    }
  );

  if (!isHandlingDuplicates) {
    const duplicates = await getMovieDuplicates(
      $id_Movies,
      useActualDuplicates,
      useMetaDuplicates
    );

    for (let i = 0; i < duplicates.length; i++) {
      await updateMovieAttribute(
        duplicates[i],
        attributeName,
        $value,
        useActualDuplicates,
        useMetaDuplicates,
        true
      );
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

async function addRegions(items) {
  logger.log("TODO: store.addRegions", items);
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
      logger.log("Fallback Region: set to", region);
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

  const uiLanguageCode =
    splitCurrentLocale[0].toUpperCase().charAt(0) +
    splitCurrentLocale[0].toLowerCase().slice(1);

  const languages = await getIMDBLanguages();

  if (!languages) {
    logger.warn("unable to fetch languages, abort");
    return;
  }

  logger.log("languages:", languages);

  let fallbackLanguage = languages.find((lang) => lang.code === uiLanguageCode);

  if (fallbackLanguage) {
    shared.fallbackLanguage = Object.assign(fallbackLanguage, {
      locale: shared.currentLocale,
    });
    logger.log("Fallback Language: set to", shared.fallbackLanguage);
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
      return prev + (prev ? ", " : "") + `'${current}'`;
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

  logger.log("getIMDBLanguages sSQL: ", sSQL);

  const languages = await db.fireProcedureReturnAll(sSQL);

  logger.log("getIMDBLanguages:", languages);

  return languages;
}

async function ensureLanguageMapping() {
  const languages = await db.fireProcedureReturnAll(`
    SELECT Code, Name FROM tbl_IMDB_Languages
  `);

  languages.forEach((language) => {
    if (
      languageCodeNameMapping[language.Code] &&
      languageCodeNameMapping[language.Code] !== language.Name
    ) {
      logger.log("ensureLanguageMapping Code-Name mismatch:", language);
    }
    if (!languageCodeNameMapping[language.Code]) {
      languageCodeNameMapping[language.Code] = language.Name;
    }

    if (
      languageNameCodeMapping[language.Name] &&
      languageNameCodeMapping[language.Name] !== language.Code
    ) {
      logger.log("ensureLanguageMapping Name-Code mismatch:", language);
    }
    if (!languageNameCodeMapping[language.Name]) {
      languageNameCodeMapping[language.Name] = language.Code;
    }
  });

  logger.log(
    "ensureLanguageMapping languageNameCodeMapping:",
    languageCodeNameMapping
  );
  logger.log(
    "ensureLanguageMapping languageNameCodeMapping:",
    languageNameCodeMapping
  );
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
    logger.log("loadLocalHistory fileName", fileName);

    const filePath = helpers.getPath(path.join("public", "history", fileName));

    const fileExists = await existsAsync(filePath);

    if (!fileExists) {
      return null;
    }

    logger.log("loadLocalHistory path:", filePath);

    const history = await readFileAsync(filePath);

    logger.log("loadLocalHistory versionInfo:", history.toString());

    return history;
  } catch (e) {
    logger.error(e);
  }
}

function getUserScanOption(key) {
  return shared.userScanOptions.find(
    (userScanOption) => userScanOption.key === key
  );
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
        ? `${ratingDemographics[key].toLocaleString(undefined, {
          minimumFractionDigits: 1,
        })}`
        : "";
    }

    if (key.includes("numVotes")) {
      ratingDemographics[key + "_formatted"] = ratingDemographics[key]
        ? `${ratingDemographics[key].toLocaleString()}`
        : "";
    }
  });

  return ratingDemographics;
}

async function saveIMDBPersonData(data) {
  logger.log("saveIMDBPersonData data:", data);

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
  logger.log("fetchUILanguage START");

  let lang = await getSetting("uiLanguage");
  let fallbackLanguage = null;

  if (shared.fallbackLanguage) {
    fallbackLanguage = shared.fallbackLanguage.code.toLowerCase();
  }

  if (lang) {
    logger.log(`fetchUILanguage got previously saved language: "${lang}"`);
  }

  if (!lang) {
    if (fallbackLanguage) {
      logger.log(
        `fetchUILanguage no locale defined, fallback to "${fallbackLanguage}"`
      );
      lang = fallbackLanguage;
    } else {
      logger.log(`fetchUILanguage no locale defined, default to "en"`);
      lang = "en";
    }
  }

  if (
    !shared.supportedLanguages.find(
      (supportedLanguage) => supportedLanguage.code === lang
    )
  ) {
    logger.log(
      `fetchUILanguage locale "${lang}" is not supported, fallback to "en"`
    );
    lang = "en";
  }

  logger.log(`fetchUILanguage using "${lang}"`);
  return lang;
}

export {
  db,
  fetchSourcePaths,
  rescan,
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
  fetchFilterQualities,
  fetchFilterCompanies,
  fetchFilterLanguages,
  fetchFilterIMDBRating,
  fetchFilterMetacriticScore,
  isScanning,
  abortRescan,
  createList,
  addToList,
  removeFromList,
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
  addRegions,
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
};
