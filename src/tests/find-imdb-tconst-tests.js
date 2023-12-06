const fs = require("fs");
const util = require("util");

const minimist = require("minimist");

const readFileAsync = util.promisify(fs.readFile);

const logger = require("../helpers/logger");
const findIMDBtconst = require("../find-imdb-tconst");
const { scrapeIMDBtechnicalData } = require("../imdb-scraper");

const cmdArguments = minimist(process.argv.slice(2));

const config = {
  name: cmdArguments.name,
  batch: cmdArguments.batch,
  duration: cmdArguments.duration ? parseInt(cmdArguments.duration) : null,
};

logger.setLevel(0);

logger.info("Syntax: find-imdb-tconst-tests [options]");
logger.info("");
logger.info("options:");
logger.info("         --name=<name>        find IMDB tconst for a single name");
logger.info(
  "         --batch=<file.txt>   find IMDB tconst for multiple names defined in file.txt (also do a statistical analysis)"
);
logger.info("         --duration=<seconds> provide a duration in seconds for the movie");

logger.info(config);

(async () => {
  if (config.name) {
    const movie = {
      isDirectoryBased: false,
      Filename: config.name,
      MI_Duration_Seconds: config.duration,
    };
    const options = {
      returnAnalysisData: true,
      category: "title",
      excludeTVSeries: true,
    };
    const tconstIncluded = await findIMDBtconst.findIMDBtconstIncluded(movie);
    const stats = await findIMDBtconst.findIMDBtconstByFileOrDirname(movie, options);
    stats.tconstIncluded = tconstIncluded;

    stats.isTconstCorrect = tconstIncluded == (stats.result ? stats.result.tconst : "<none>");

    logger.info("stats:", stats);
    return;
  }

  if (config.batch) {
    await benchmark(config.batch);
  }
})();

async function benchmark(filePath) {
  if (!filePath) {
    return logger.error(`filePath is missing!`);
  }

  const fileContent = await (await readFileAsync(filePath)).toString().split("\n");

  let counter = 0;

  let resultTable = `fileName\tfullName\tchosenName\tresult_tconst\tresult_type\tresult_title\tresult_year\tsearchAPI\tchoiceType\ttconstIncluded\tnumResults\tnumResultsFiltered\truntimeDiff\tisTconstCorrect\n`;

  for (let line of fileContent) {
    counter++;
    const name = line.trim();

    if (!name) {
      continue;
    }

    const movie = {
      isDirectoryBased: false,
      Filename: name,
    };

    logger.info(`${counter} / ${fileContent.length}`, name);
    const tconstIncluded = await findIMDBtconst.findIMDBtconstIncluded(movie);

    let stats = await findIMDBtconst.findIMDBtconstByFileOrDirname(movie, {
      returnAnalysisData: true,
      category: "title",
      excludeTVSeries: true,
    });

    stats.tconstIncluded = tconstIncluded;
    stats.isTconstCorrect = tconstIncluded == (stats.result ? stats.result.tconst : "<none>");

    if (!stats.isTconstCorrect && tconstIncluded) {
      // 2nd try with runtime
      const imdbData = await scrapeIMDBtechnicalData({
        IMDB_tconst: tconstIncluded,
      });
      if (imdbData.$IMDB_runtimeMinutes) {
        const runtimeSeconds = imdbData.$IMDB_runtimeMinutes ? parseInt(imdbData.$IMDB_runtimeMinutes) * 60 : null;

        movie.MI_Duration_Seconds = runtimeSeconds;

        stats = await findIMDBtconst.findIMDBtconstByFileOrDirname(movie, {
          returnAnalysisData: true,
          category: "title",
          excludeTVSeries: true,
        });
      }

      stats.tconstIncluded = tconstIncluded;
      stats.isTconstCorrect = tconstIncluded == (stats.result ? stats.result.tconst : "<none>");
    }

    logger.info("stats:", stats);

    const statsFlattened = {
      fileName: name,
      fullName: stats.fullName,
      chosenName: stats.chosenName,
      result_tconst: stats.result ? stats.result.tconst : null,
      result_type: stats.result ? stats.result.type : null,
      result_title: stats.result ? stats.result.title : null,
      result_year: stats.result ? stats.result.year : null,
      searchAPI: stats.searchAPI,
      choiceType: stats.choiceType,
      tconstIncluded: stats.tconstIncluded,
      numResults: stats.numResults,
      numResultsFiltered: stats.numResultsFiltered,
      runtimeDiff: stats.runtimeDiff === -1337 ? "N/A" : stats.runtimeDiff,
      isTconstCorrect: stats.isTconstCorrect,
    };

    resultTable += `${statsFlattened.fileName}\t${statsFlattened.fullName}\t${statsFlattened.chosenName}\t${statsFlattened.result_tconst}\t${statsFlattened.result_type}\t${statsFlattened.result_title}\t${statsFlattened.result_year}\t${statsFlattened.searchAPI}\t${statsFlattened.choiceType}\t${statsFlattened.tconstIncluded}\t${statsFlattened.numResults}\t${statsFlattened.numResultsFiltered}\t${statsFlattened.runtimeDiff}\t${statsFlattened.isTconstCorrect}\n`;
  }

  const resultCSV = `tconst-benchmark-results-${new Date().toISOString().substr(0, 19).replace(/:/g, "")}.csv`;

  fs.writeFileSync(resultCSV, resultTable);

  logger.info("results written to", resultCSV);
}
