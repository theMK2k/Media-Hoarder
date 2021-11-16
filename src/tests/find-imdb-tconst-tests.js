const logger = require("../helpers/logger");

const findIMDBtconst = require("../find-imdb-tconst");

logger.setLevel(0);

(async () => {
  const tconst = await findIMDBtconst.findIMDBtconstByFileOrDirname({
    isDirectoryBased: false,
    Filename:
      "Agent 327_ Operation Barbershop (858p_24fps_VP9-128kbit_AAC).mkv",
  });

  logger.info("tconst:", tconst);
})();
