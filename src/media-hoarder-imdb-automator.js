/* eslint-disable no-console */
const minimist = require("minimist");

const logger = require("./helpers/logger");

const cmdArguments = minimist(process.argv.slice(2));

logger.setLevel(cmdArguments.logLevel != undefined ? cmdArguments.logLevel : 2);

async function runAutomatorFunction(name, func) {
  logger.info(`[imdb-automator] running ${name}`);
  const url = await func();
  console.log(`[imdb-automator] ${name} GraphQL URL:`);
  console.log(url);
}

module.exports = (async () => {
  const { getFindPageSearchGraphqlURL, getAdvancedTitleSearchGraphqlURL, getIMDBPlotKeywordsGraphqlURL, getSeriesEpisodesGraphqlURL } = await import("./helpers/imdb-automator.js");

  await runAutomatorFunction("FindPageSearch", getFindPageSearchGraphqlURL);
  await runAutomatorFunction("AdvancedTitleSearch", getAdvancedTitleSearchGraphqlURL);
  await runAutomatorFunction("IMDBPlotKeywords", getIMDBPlotKeywordsGraphqlURL);
  await runAutomatorFunction("SeriesEpisodes", getSeriesEpisodesGraphqlURL);
})();
