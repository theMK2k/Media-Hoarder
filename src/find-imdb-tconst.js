import { result } from "lodash";

const path = require("path");

const logger = require("./helpers/logger");
const helpers = require("./helpers/helpers");
const { scrapeIMDBFind, scrapeIMDBtechnicalData } = require("./imdb-scraper");
/**
 * Extract the IMDB tconst if it is included in the file or directory name, e.g. A Movie (2009)[tt123456789]
 *
 * @param {movie} movie
 */
export async function findIMDBtconstIncluded(movie) {
  logger.log("[findIMDBtconstIncluded] START");
  const name = movie.isDirectoryBased
    ? helpers.getLastDirectoryName(movie.fullDirectory)
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

  const lastDirectoryNameLower = helpers
    .getLastDirectoryName(movie.fullDirectory)
    .toLowerCase();

  if (lastDirectoryNameLower.match(/^extra/)) {
    // we are inside a sub-directory and need to search the parent directory
    searchPath = path.resolve(movie.fullDirectory, "..");
  }

  logger.log("[findIMDBtconstInNFO] searching in", searchPath);

  const pathItems = await helpers.listPath(searchPath, searchPath);

  const nfoFile = pathItems.find(
    (pathItem) => pathItem.ExtensionLower === ".nfo"
  );

  if (!nfoFile) {
    logger.log("[findIMDBtconstInNFO] no .nfo file found, abort.");
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
 * @param {Object} movie
 * @param {Object} options
 * @returns {String|Object}
 */
export async function findIMDBtconstByFileOrDirname(movie, options) {
  logger.log("[findIMDBtconstByFileOrDirname] START");

  if (!options) {
    options = {
      returnAnalysisData: false,
      category: "title",
      excludeTVSeries: true, // filters out all titles containing "(TV Series)" in the title, still includes "(TV Mini Series)"
    };
  }

  const stats = {
    fullName: null,
    chosenName: null,
    result: null,
    searchAPI: null,
    choiceType: null,

    immediateOptimum: false,
    yearmatch: false,
    yearmatchexact: false,
    excludedTVSeries: false,
    excludedByRuntime: false,
  };

  try {
    const arrYears = helpers.getYearsFromFileName(movie.Filename, false); // TODO: also directoryName (if movie.isDirectoryBased)

    const name = (
      movie.isDirectoryBased
        ? helpers.getMovieNameFromDirectory(movie.fullDirectory)
        : helpers.getMovieNameFromFileName(movie.Filename)
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

      for (let searchFunction of [scrapeIMDBFind]) {
        // was: [scrapeIMDBFind, scrapeIMDBSuggestion], but scrapeIMDBSuggestion doesn't provide any benefit

        let results = await searchFunction(
          searchTerm,
          options.category === "title" ? "tt" : null
        );

        logger.log(
          `[findIMDBtconstByFileOrDirname] ${results.length} results found for "${searchTerm}"`
        );

        // filter by excluding "TV Series"
        if (options.excludeTVSeries) {
          while (
            results.find((result) => result.title.includes("(TV Series)"))
          ) {
            results.splice(
              results.findIndex((result) =>
                result.title.includes("(TV Series)")
              ),
              1
            );
          }
        }

        // filter by year match
        if (results.length > 1) {
          const resultsYear = [];
          for (let y = 0; y < arrYears.length; y++) {
            for (let r = 0; r < results.length; r++) {
              if (results[r].year) {
                const year = parseInt(results[r].year);
                if (arrYears[y] - year >= -1 && arrYears[y] - year <= 1) {
                  // logger.log(
                  //   "[findIMDBtconstByFileOrDirname] result found by year :)",
                  //   results[r]
                  // );

                  stats.yearmatch = true;
                  results[r].exactYear = arrYears[y] - year === 0;
                  resultsYear.push(results[r]);

                  // stats.chosenName = searchTerm;
                  // stats.result = results[r];
                  // stats.searchAPI =
                  //   searchFunction === scrapeIMDBFind ? "find" : "suggestion";
                  // stats.choiceType = "yearmatch";
                  // return options.returnAnalysisData ? stats : results[r].tconst;
                }
              }
            }
          }

          if (resultsYear.find((result) => result.exactYear)) {
            stats.yearmatchexact = true;
            const resultsYearExact = results.filter(
              (result) => result.exactYear
            );

            results = resultsYearExact;
          }
        }

        // TODO: filter by runtime, but only if there are less than 10 results left
        if (
          results.length > 1 &&
          results.length < 10 &&
          movie.MI_Duration_Seconds
        ) {
          const resultsRuntime = [];
          for (result of results) {
            const imdbData = await scrapeIMDBtechnicalData({
              IMDB_tconst: result.tconst,
            });

            if (imdbData.$IMDB_runtimeMinutes) {
              const runtimeSeconds = parseInt(imdbData.$IMDB_runtimeMinutes)  // TODO: go on here
            }
          }
        }

        if (results.length === 1) {
          logger.log(
            "[findIMDBtconstByFileOrDirname] OPTIMUM found :D",
            results[0]
          );

          stats.chosenName = searchTerm;
          stats.result = results[0];
          stats.searchAPI =
            searchFunction === scrapeIMDBFind ? "find" : "suggestion";
          stats.choiceType = "optimum";
          stats.immediateOptimum = true;

          return options.returnAnalysisData ? stats : results[0].tconst;
        }

        if (results.length > 1) {
          // just use the first in the list (we can't filter more)
          logger.log(
            "[findIMDBtconstByFileOrDirname] just using the first result :(",
            results[0]
          );

          stats.chosenName = searchTerm;
          stats.result = results[0];
          stats.searchAPI =
            searchFunction === scrapeIMDBFind ? "find" : "suggestion";
          stats.choiceType = "fallback";
          return options.returnAnalysisData ? stats : results[0].tconst;
        }
      }
    }
  } catch (err) {
    logger.error(err);
  }

  return options.returnAnalysisData ? stats : "";
}
