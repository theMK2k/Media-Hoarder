/* eslint-disable no-console */
const chalk = require("chalk");

const imdbScraper = require("./imdb-scraper");

const status = {
    SUCCESS: 0,
    WARNING: 1,
    ERROR: 2
}

const log = [];

(async () => {
  addLogEntry(await testIMDBmainPageData());
})();

function addLogEntry(testResult) {
    const entry = `${chalk.white('[')}${testResult.status === status.SUCCESS ? chalk.green('OK') : testResult.status === status.WARNING ? chalk.yellow('WARN') : chalk.red('FAIL')}${chalk.white(']')} ${testResult.name}`;

    log.push(entry);
    
    console.log(entry);
    if (testResult.status !== status.SUCCESS) {
        testResult.log.forEach(entry => {
            console.log(entry);
        })
    }
}

function array2string() {
    let result = ''
    
    for (let i = 0; i < arguments.length; i++) {
        result += arguments[i].toString();
    }

    return result;
}

function checkField(fieldName, condition, testResult, scrapeResult, expected, newStatus) {
    if (!condition) {
        if (testResult.status < newStatus) {
            testResult.status = newStatus;
        }
        
        testResult.log.push(array2string('       ', fieldName, ' mismatch got:', scrapeResult[fieldName], ' expected:', expected[fieldName]));
    }
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

  checkField('$IMDB_releaseType', scrapeResult.$IMDB_releaseType, testResult, scrapeResult, expected, status.ERROR);
  checkField('$IMDB_releaseType', scrapeResult.$IMDB_releaseType === expected.$IMDB_releaseType, testResult, scrapeResult, expected, status.WARNING);
  checkField('$IMDB_genres', array2string(scrapeResult.$IMDB_genres) === array2string(expected.$IMDB_genres), testResult, scrapeResult, expected, status.WARNING);
  checkField('$IMDB_rating', scrapeResult.$IMDB_rating, testResult, scrapeResult, expected, status.ERROR);
  checkField('$IMDB_rating', scrapeResult.$IMDB_rating > 7, testResult, scrapeResult, expected, status.WARNING);
  checkField('$IMDB_numVotes', scrapeResult.$IMDB_numVotes, testResult, scrapeResult, expected, status.ERROR);
  checkField('$IMDB_numVotes', scrapeResult.$IMDB_numVotes === expected.$IMDB_numVotes, testResult, scrapeResult, expected, status.WARNING);
  checkField('$IMDB_metacriticScore', scrapeResult.$IMDB_metacriticScore, testResult, scrapeResult, expected, status.ERROR);
  checkField('$IMDB_metacriticScore', scrapeResult.$IMDB_metacriticScore === expected.$IMDB_metacriticScore, testResult, scrapeResult, expected, status.WARNING);
  checkField('$IMDB_posterSmall_URL', scrapeResult.$IMDB_posterSmall_URL, testResult, scrapeResult, expected, status.ERROR);
  checkField('$IMDB_posterSmall_URL', scrapeResult.$IMDB_posterSmall_URL === expected.$IMDB_posterSmall_URL, testResult, scrapeResult, expected, status.WARNING);
  checkField('$IMDB_posterSmall_URL', scrapeResult.$IMDB_posterLarge_URL, testResult, scrapeResult, expected, status.ERROR);
  checkField('$IMDB_posterSmall_URL', scrapeResult.$IMDB_posterLarge_URL === expected.$IMDB_posterLarge_URL, testResult, scrapeResult, expected, status.WARNING);
  checkField('$IMDB_plotSummary', scrapeResult.$IMDB_plotSummary, testResult, scrapeResult, expected, status.ERROR);
  checkField('$IMDB_Trailer_URL', scrapeResult.$IMDB_Trailer_URL === expected.$IMDB_Trailer_URL, testResult, scrapeResult, expected, status.WARNING);

  return testResult;
}
