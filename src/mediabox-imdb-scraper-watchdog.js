/* eslint-disable no-console */
const chalk = require("chalk");
const logger = require("loglevel");

const imdbScraperTests = require('./imdb-scraper-tests');

const status = {
  SUCCESS: 0,
  WARNING: 1,
  ERROR: 2,
};

logger.setLevel(2); // set to 0 for log output of imdb-scraper, else 2

const log = [];

(async () => {
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
  addLogEntry(await imdbScraperTests.testIMDBSearch());
  addLogEntry(await imdbScraperTests.testIMDBAdvancedTitleSearch());
})();

function addLogEntry(testResult) {
  const entry = `${chalk.white("[")}${
    testResult.status === status.SUCCESS
      ? chalk.green("OK")
      : testResult.status === status.WARNING
      ? chalk.yellow("WARN")
      : chalk.red("FAIL")
  }${chalk.white("]")} ${testResult.name}`;

  log.push(entry);

  console.log(entry);
  if (testResult.status !== status.SUCCESS) {
    testResult.log.forEach((entry) => {
      console.log(entry);
    });
  }
}