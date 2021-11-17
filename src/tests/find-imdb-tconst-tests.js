const minimist = require("minimist");

const logger = require("../helpers/logger");
const findIMDBtconst = require("../find-imdb-tconst");

const cmdArguments = minimist(process.argv.slice(2));

const config = {
  name: cmdArguments.name,
  batch: cmdArguments.batch,
};

logger.setLevel(0);

logger.info("Syntax: find-imdb-tconst-tests [options]");
logger.info("");
logger.info("options:");
logger.info("         --name=<name>        find IMDB tconst for a single name");
logger.info(
  "         --batch=<file.txt>   find IMDB tconst for multiple names defined in file.txt (also do a statistical analysis)"
);

logger.info(config);

(async () => {
  if (config.name) {
    const stats = await findIMDBtconst.findIMDBtconstByFileOrDirname(
      {
        isDirectoryBased: false,
        Filename: config.name,
      },
      true
    );

    logger.info("stats:", stats);
    return;
  }
})();
