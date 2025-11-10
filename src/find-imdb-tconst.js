const path = require("path");

const logger = require("./helpers/logger");
const helpers = require("./helpers/helpers");
const { scrapeIMDBFindPageSearchV3, scrapeIMDBtechnicalData } = require("./imdb-scraper");

/**
 * Extract the IMDB tconst if it is included in the file or directory name, e.g. A Movie (2009)[tt123456789]
 *
 * @param {movie} movie
 */
export async function findIMDBtconstIncluded(movie) {
  logger.log("[findIMDBtconstIncluded] START");
  const name = movie.isDirectoryBased
    ? helpers.getLastDirectoryName(movie.MediaType === "series" ? movie.fullPath : movie.fullDirectory)
    : movie.Filename;

  logger.log("[findIMDBtconstIncluded] name:", name);

  if (/tt\d{6,}/.test(name)) {
    const tconst = name.match(/(tt\d{6,})/)[1];

    logger.log("[findIMDBtconstIncluded] tconst is included:", tconst);

    return tconst;
  }

  logger.log("[findIMDBtconstIncluded] tconst is NOT included");

  return "";
}

export async function findIMDBtconstInNFO(movie) {
  logger.log("[findIMDBtconstInNFO] START");

  if (!movie.isDirectoryBased) {
    logger.log("[findIMDBtconstInNFO] movie is not directory-based, abort.");
    return;
  }

  let searchPath = movie.fullDirectory;

  const lastDirectoryNameLower = helpers.getLastDirectoryName(movie.fullDirectory).toLowerCase();

  if (lastDirectoryNameLower.match(/^extra/)) {
    // we are inside a sub-directory and need to search the parent directory
    searchPath = path.resolve(movie.fullDirectory, "..");
  }

  logger.log("[findIMDBtconstInNFO] searching in", searchPath);

  const pathItems = await helpers.listPath(searchPath, searchPath);

  const nfoFile = pathItems.find((pathItem) => pathItem.ExtensionLower === ".nfo");

  if (!nfoFile) {
    logger.log("[findIMDBtconstInNFO] no .nfo file found, abort.");
    return "";
  }

  logger.log("[findIMDBtconstInNFO] .nfo file found:", nfoFile.Name);

  const nfoContent = (await helpers.readFileAsync(nfoFile.fullPath)).toString();

  // logger.log('[findIMDBtconstInNFO] content:', nfoContent);

  if (/tt\d{6,}/.test(nfoContent)) {
    const tconst = nfoContent.match(/(tt\d{6,})/)[1];

    logger.log("[findIMDBtconstInNFO] tconst found:", tconst);

    return tconst;
  }

  logger.log("[findIMDBtconstInNFO] tconst is NOT found");

  return "";
}

/**
 * Find an IMDB tconst based on the movie's name (also checks possible release years contained in the name)
 * @param {Object} mediaItem
 * @param {Object} options
 * @returns {String|Object} with options.returnAnalysisData = true, returns an object with analysis data, else the tconst (or empty string if tconst could't be found)
 */
export async function findIMDBtconstByFileOrDirname(mediaItem, options) {
  // TODO: utilize mediaItem.MediaType ("movies" or "series") to rank the IMDB search results

  logger.log(
    "[findIMDBtconstByFileOrDirname] START mediaItem.isDirectoryBased",
    mediaItem.isDirectoryBased,
    "mediaItem:",
    mediaItem
  );

  if (!options) {
    options = {
      returnAnalysisData: false,
      category: "title",
      excludeTVSeries: true, // filters out all titles containing "(TV Series)" and "(TV Episode)" in the title, still includes "(TV Mini Series)"
    };
  }

  const stats = {
    fullName: null,
    chosenName: null,
    result: null,
    searchAPI: null,
    choiceType: null,
    numResults: null,
    numResultsFiltered: null,
    runtimeDiff: -1337,

    immediateOptimum: false,
    yearmatch: false,
    yearmatchexact: false,
    excludedTVSeries: false,
    runtimematch: false,
  };

  try {
    logger.log("[findIMDBtconstByFileOrDirname] movie.isDirectoryBased", mediaItem.isDirectoryBased);
    const arrYears = mediaItem.isDirectoryBased
      ? helpers.getYearsFromFileName(
          helpers.getLastDirectoryName(mediaItem.MediaType === "series" ? mediaItem.fullPath : mediaItem.fullDirectory),
          false
        )
      : helpers.getYearsFromFileName(mediaItem.Filename, false);

    const name = (
      mediaItem.isDirectoryBased
        ? helpers.getMovieNameFromDirectory(
            mediaItem.MediaType === "series" ? mediaItem.fullPath : mediaItem.fullDirectory
          )
        : helpers.getMovieNameFromFileName(mediaItem.Filename)
    )
      .replace(/\([^)]*?\)/g, "")
      .replace(/\[[^\]]*?\]/g, "")
      .trim();

    stats.fullName = name;

    logger.log("[findIMDBtconstByFileOrDirname] name:", name);

    logger.log("[findIMDBtconstByFileOrDirname] years:", arrYears);

    const arrName = name.split(" ");

    for (let i = arrName.length; i > 0; i--) {
      const searchTerm = arrName.slice(0, i).join(" ");

      logger.log(`[findIMDBtconstByFileOrDirname] trying: "${searchTerm}"`);

      let results = await scrapeIMDBFindPageSearchV3(searchTerm, options.category === "title" ? "tt" : null);

      results.forEach((result) => {
        result.mediaTypeLowerCase = result.mediaType?.toLowerCase() ?? "feature";
      });

      logger.log(`[findIMDBtconstByFileOrDirname] ${results.length} results found for "${searchTerm}"`);
      logger.log(`[findIMDBtconstByFileOrDirname] results:`, JSON.parse(JSON.stringify(results)));
      stats.numResults = results.length;

      if (results.length === 0) {
        // search revealed no results, continue for
        continue;
      }

      if (results.length === 1) {
        stats.immediateOptimum = true;
      }

      // filter by excluding "TV Series"
      if (results.length > 1 && options.excludeTVSeries) {
        logger.log("[findIMDBtconstByFileOrDirname] excluding TV Series and TV Episodes from results");
        while (results.find((result) => result.mediaTypeLowerCase.includes("series"))) {
          stats.excludedTVSeries = true;
          results.splice(
            results.findIndex((result) => result.mediaTypeLowerCase.includes("series")),
            1
          );
        }
        while (results.find((result) => result.mediaTypeLowerCase.includes("episode"))) {
          stats.excludedTVSeries = true;
          results.splice(
            results.findIndex((result) => result.mediaTypeLowerCase.includes("episode")),
            1
          );
        }

        logger.log("[findIMDBtconstByFileOrDirname] results after exclusion:", results);
      }

      // When scanning a Series source path, re-rank results so that TV Series are preferred
      if (mediaItem.MediaType === "series") {
        logger.log("[findIMDBtconstByFileOrDirname] re-ranking results according to TV Series");
        results = results.sort((a, b) => {
          return ((a.mediaTypeLowerCase.includes("series") || a.mediaTypeLowerCase.includes("episode")) &&
            !b.mediaTypeLowerCase.includes("series")) ||
            b.mediaTypeLowerCase.includes("episode")
            ? -1
            : 0;
        });

        logger.log("[findIMDBtconstByFileOrDirname] re-ranked results:", results);
      }

      // filter by year match
      if (results.length > 1) {
        // losely year match (+/- 1 year allowed)
        const resultsYear = [];
        for (let y = 0; y < arrYears.length; y++) {
          for (let r = 0; r < results.length; r++) {
            if (results[r].year) {
              const year = parseInt(results[r].year);
              if (arrYears[y] - year >= -1 && arrYears[y] - year <= 1) {
                stats.yearmatch = true;
                results[r].exactYear = arrYears[y] - year === 0;
                resultsYear.push(results[r]);
              }
            }
          }
        }

        // exact year match
        if (resultsYear.find((result) => result.exactYear)) {
          stats.yearmatchexact = true;
          const resultsYearExact = results.filter((result) => result.exactYear);

          results = resultsYearExact;
        }
      }

      if (results.length === 0) {
        continue;
      }

      // filter by runtime, but only use the first 10 items due to traffic
      if (results.length > 1 && mediaItem.MI_Duration_Seconds) {
        let counter = 0;
        for (let result of results) {
          counter++;
          if (counter > 10) {
            break;
          }
          const imdbData = await scrapeIMDBtechnicalData({
            IMDB_tconst: result.tconst,
          });

          if (imdbData.$IMDB_runtimeMinutes) {
            const runtimeSeconds = imdbData.$IMDB_runtimeMinutes ? parseInt(imdbData.$IMDB_runtimeMinutes) * 60 : null;

            result.runtimeDiff = runtimeSeconds ? Math.abs(mediaItem.MI_Duration_Seconds - runtimeSeconds) : null;

            if (result.runtimeDiff !== null) {
              stats.runtimematch = true;
              if (stats.runtimeDiff === -1337 || stats.runtimeDiff > result.runtimeDiff) {
                stats.runtimeDiff = result.runtimeDiff;
              }
            }

            if (result.runtimeDiff < mediaItem.MI_Duration_Seconds * 0.02) {
              break; // the runtime matches at least to 98%, which is a window of 2 minutes if the movie has a runtime of 100 minutes
            }
          } else {
            result.runtimeDiff = null;
          }
        }

        if (stats.runtimematch) {
          // sort results by runtimeDiff
          logger.log("[findIMDBtconstByFileOrDirname] results before sort:", JSON.stringify(results, null, 2));

          results.sort((a, b) => {
            return a.runtimeDiff === null ? 1 : b.runtimeDiff === null ? -1 : a.runtimeDiff - b.runtimeDiff;
          });

          logger.log("[findIMDBtconstByFileOrDirname] runtime sorted results:", results);

          results = [results[0]]; // take the first
        }
      }

      const coiceType = `${stats.immediateOptimum ? "|immediateOptimum" : ""}${
        stats.yearmatch ? `|year${stats.yearmatchexact ? "(exact)" : "(losely)"}` : ""
      }${stats.excludedTVSeries ? "|excludedTVSeries" : ""}${stats.runtimematch ? "|runtime" : ""}`;

      stats.numResultsFiltered = results.length;
      stats.chosenName = searchTerm;
      stats.searchAPI = "find";
      stats.result = results[0];

      if (results.length === 0) {
        logger.log("[findIMDBtconstByFileOrDirname] NOTHING found :'(");
        stats.choiceType = `none`;
        return options.returnAnalysisData ? stats : "";
      }

      if (results.length === 1) {
        logger.log("[findIMDBtconstByFileOrDirname] OPTIMUM found :D", results[0]);
        stats.choiceType = `optimum${coiceType}`;
      }

      if (results.length > 1) {
        logger.log("[findIMDBtconstByFileOrDirname] just using the first result :(", results[0]);
        stats.choiceType = `fallback${coiceType}`;
      }

      logger.log("[findIMDBtconstByFileOrDirname] stats:", stats);
      return options.returnAnalysisData ? stats : results[0].tconst;
    }
  } catch (err) {
    logger.error(err);
    throw err;
  }

  return options.returnAnalysisData ? stats : "";
}
