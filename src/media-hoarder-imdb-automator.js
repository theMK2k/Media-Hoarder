/* eslint-disable no-console */
const minimist = require("minimist");

const logger = require("./helpers/logger");

const cmdArguments = minimist(process.argv.slice(2));

logger.setLevel(cmdArguments.logLevel != undefined ? cmdArguments.logLevel : 2);

module.exports = (async () => {
  const { getFindPageSearchGraphqlURL, getAdvancedTitleSearchGraphqlURL, getIMDBPlotKeywordsGraphqlURL } = await import("./helpers/imdb-automator.js");

  logger.info("[imdb-automator] running getFindPageSearchGraphqlURL");
  const findPageSearchURL = await getFindPageSearchGraphqlURL();
  console.log("[imdb-automator] FindPageSearch GraphQL URL:");
  console.log(findPageSearchURL);

  logger.info("[imdb-automator] running getAdvancedTitleSearchGraphqlURL");
  const advancedTitleSearchURL = await getAdvancedTitleSearchGraphqlURL();
  console.log("[imdb-automator] AdvancedTitleSearch GraphQL URL:");
  console.log(advancedTitleSearchURL);

  logger.info("[imdb-automator] running getIMDBPlotKeywordsGraphqlURL");
  const plotKeywordsURL = await getIMDBPlotKeywordsGraphqlURL();
  console.log("[imdb-automator] PlotKeywords GraphQL URL:");
  console.log(plotKeywordsURL);
})();
