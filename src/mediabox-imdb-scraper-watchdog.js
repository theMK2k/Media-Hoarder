/* eslint-disable no-console */
const chalk = require("chalk");

const imdbScraper = require("./imdb-scraper");

const status = {
  SUCCESS: 0,
  WARNING: 1,
  ERROR: 2,
};

const log = [];

(async () => {
  addLogEntry(await testIMDBmainPageData());
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

function array2string() {
  let result = "";

  for (let i = 0; i < arguments.length; i++) {
    result += arguments[i].toString();
  }

  return result;
}

function addSubLogEntry(testResult, message, newStatus) {
  if (testResult.status < newStatus) {
    testResult.status = newStatus;
  }

  testResult.log.push(message);
}

async function testIMDBmainPageData() {
  const testResult = {
    name: "IMDB Main Page Data",
    status: status.SUCCESS,
    log: [],
  };

  const expected = {
    $IMDB_releaseType: "movie",
    $IMDB_genres: ["action", "adventure", "drama", "sci-fi"],
    $IMDB_rating: 8.4,
    $IMDB_numVotes: 714190,
    $IMDB_metacriticScore: 78,
    $IMDB_posterSmall_URL: "data/extras/tt4154796_posterSmall.jpg",
    $IMDB_posterLarge_URL: "data/extras/tt4154796_posterLarge.jpg",
    $IMDB_plotSummary:
      "After the devastating events of Avengers: Infinity War (2018), the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos' actions and restore balance to the universe.",
    $IMDB_Trailer_URL: "/video/imdb/vi2163260441",
  };

  const movie = {
    IMDB_tconst: "tt4154796",
  };

  const scrapeResult = await imdbScraper.scrapeIMDBmainPageData(
    movie,
    async () => {
      return true;
    }
  );

  if (!scrapeResult) {
    addSubLogEntry(testResult, "no response", status.ERROR);
    return;
  }

  if (!scrapeResult.$IMDB_releaseType) {
    addSubLogEntry(testResult, "$IMDB_releaseType missing", status.ERROR);
  } else if (scrapeResult.$IMDB_releaseType !== expected.$IMDB_releaseType) {
    addSubLogEntry(
      testResult,
      `$IMDB_releaseType mismatch
got:      "${scrapeResult.$IMDB_releaseType}"
expected: "${expected.$IMDB_releaseType}"`,
      status.WARNING
    );
  }

  if (!scrapeResult.$IMDB_genres) {
    addSubLogEntry(testResult, "$IMDB_genres missing", status.ERROR);
  } else if (scrapeResult.$IMDB_genres !== expected.$IMDB_genres) {
    addSubLogEntry(
      testResult,
      `$IMDB_genres mismatch
got:      "${scrapeResult.$IMDB_genres}"
expected: "${expected.$IMDB_genres}"`,
      status.WARNING
    );
  }

  if (!scrapeResult.$IMDB_rating) {
    addSubLogEntry(testResult, "$IMDB_rating missing", status.ERROR);
  } else if (scrapeResult.$IMDB_rating < 7) {
    addSubLogEntry(testResult, `$IMDB_rating unexpected value`, status.WARNING);
  }

  if (!scrapeResult.$IMDB_numVotes) {
    addSubLogEntry(testResult, "$IMDB_numVotes missing", status.ERROR);
  } else if (scrapeResult.$IMDB_numVotes !== expected.$IMDB_numVotes) {
    addSubLogEntry(testResult, `$IMDB_numVotes unexpected value`, status.WARNING);
  }

  //   checkField(
  //     "$IMDB_metacriticScore",
  //     scrapeResult.$IMDB_metacriticScore,
  //     testResult,
  //     scrapeResult,
  //     expected,
  //     status.ERROR
  //   );
  //   checkField(
  //     "$IMDB_metacriticScore",
  //     scrapeResult.$IMDB_metacriticScore === expected.$IMDB_metacriticScore,
  //     testResult,
  //     scrapeResult,
  //     expected,
  //     status.WARNING
  //   );
  //   checkField(
  //     "$IMDB_posterSmall_URL",
  //     scrapeResult.$IMDB_posterSmall_URL,
  //     testResult,
  //     scrapeResult,
  //     expected,
  //     status.ERROR
  //   );
  //   checkField(
  //     "$IMDB_posterSmall_URL",
  //     scrapeResult.$IMDB_posterSmall_URL === expected.$IMDB_posterSmall_URL,
  //     testResult,
  //     scrapeResult,
  //     expected,
  //     status.WARNING
  //   );
  //   checkField(
  //     "$IMDB_posterSmall_URL",
  //     scrapeResult.$IMDB_posterLarge_URL,
  //     testResult,
  //     scrapeResult,
  //     expected,
  //     status.ERROR
  //   );
  //   checkField(
  //     "$IMDB_posterSmall_URL",
  //     scrapeResult.$IMDB_posterLarge_URL === expected.$IMDB_posterLarge_URL,
  //     testResult,
  //     scrapeResult,
  //     expected,
  //     status.WARNING
  //   );
  //   checkField(
  //     "$IMDB_plotSummary",
  //     scrapeResult.$IMDB_plotSummary,
  //     testResult,
  //     scrapeResult,
  //     expected,
  //     status.ERROR
  //   );
  //   checkField(
  //     "$IMDB_Trailer_URL",
  //     scrapeResult.$IMDB_Trailer_URL === expected.$IMDB_Trailer_URL,
  //     testResult,
  //     scrapeResult,
  //     expected,
  //     status.WARNING
  //   );

  return testResult;
}
