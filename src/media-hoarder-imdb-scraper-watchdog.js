/* eslint-disable no-console */
const chalk = require("chalk");
const logger = require("loglevel");
const minimist = require('minimist');

const imdbScraperTests = require('./imdb-scraper-tests');

const cmdArguments = minimist(process.argv.slice(2))

const config = {
  logLevel: cmdArguments.logLevel != undefined ? cmdArguments.logLevel : 2
}

const status = {
  SUCCESS: 0,
  WARNING: 1,
  ERROR: 2,
};

logger.setLevel(config.logLevel); // set to 0 for log output of imdb-scraper, else 2

const log = [];

(async () => {
  logger.info('Syntax: media-hoarder-imdb-scraper-watchdog [options]')
  logger.info('')
  logger.info('options:')
  logger.info('         --logLevel=<logLevel>                                log level, default: 2')

  logger.info('')
  logger.info('used config:', JSON.stringify(config, null, 2));

  addLogEntry(await imdbScraperTests.testIMDBmainPageData());
  addLogEntry(await imdbScraperTests.testIMDBplotSummary());
  addLogEntry(await imdbScraperTests.testIMDBreleaseinfo());
  addLogEntry(await imdbScraperTests.testIMDBtechnicalData());
  addLogEntry(await imdbScraperTests.testIMDBParentalGuideData());
  addLogEntry(await imdbScraperTests.testIMDBFullCreditsData());
  addLogEntry(await imdbScraperTests.testIMDBCompaniesData());
  addLogEntry(await imdbScraperTests.testIMDBPersonData());
  addLogEntry(await imdbScraperTests.testIMDBTrailerMediaURLs());
  addLogEntry(await imdbScraperTests.testIMDBplotKeywords());
  addLogEntry(await imdbScraperTests.testIMDBFilmingLocations());
  addLogEntry(await imdbScraperTests.testIMDBRatingDemographics());
  addLogEntry(await imdbScraperTests.testIMDBSuggestion());
  addLogEntry(await imdbScraperTests.testIMDBAdvancedTitleSearch());
  addLogEntry(await imdbScraperTests.testIMDBFind());
})();

function addLogEntry(testResult) {
  const entry = `${chalk.white("[")}${
    testResult.status === status.SUCCESS
      ? chalk.green("OK")
      : testResult.status === status.WARNING
      ? chalk.yellow("WARN")
      : testResult.status === status.ERROR
      ? chalk.red("FAIL")
      : chalk.red("EXCEPTION")
  }${chalk.white("]")} ${testResult.name}`;

  log.push(entry);

  console.log(entry);
  if (testResult.status !== status.SUCCESS) {
    testResult.log.forEach((entry) => {
      console.log(entry);
    });
  }
}