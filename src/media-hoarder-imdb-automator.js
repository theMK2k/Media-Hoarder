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
  const automator = await import("./helpers/imdb-automator.js");

  await runAutomatorFunction("FindPageSearch", automator.getFindPageSearchGraphqlURL);
  await runAutomatorFunction("AdvancedTitleSearch", automator.getAdvancedTitleSearchGraphqlURL);
  await runAutomatorFunction("IMDBPlotKeywords", automator.getIMDBPlotKeywordsGraphqlURL);
  await runAutomatorFunction("SeriesEpisodes", automator.getSeriesEpisodesGraphqlURL);
  await runAutomatorFunction("FullCredits", automator.getCreditsGraphqlURL);
})();
