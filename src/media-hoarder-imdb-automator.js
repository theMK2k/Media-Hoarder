/* eslint-disable no-console */
const minimist = require("minimist");

const logger = require("./helpers/logger");

const cmdArguments = minimist(process.argv.slice(2));
const searchTerm = cmdArguments.searchTerm || "xxx";

logger.setLevel(cmdArguments.logLevel != undefined ? cmdArguments.logLevel : 2);

module.exports = (async () => {
  const { getFindPageSearchGraphqlURL } = await import("./helpers/imdb-automator.js");

  logger.info(`[imdb-automator] running getFindPageSearchGraphqlURL, searchTerm: ${searchTerm}`);

  const graphqlURL = await getFindPageSearchGraphqlURL(searchTerm);

  console.log("[imdb-automator] FindPageSearch GraphQL URL:");
  console.log(graphqlURL);
})();
