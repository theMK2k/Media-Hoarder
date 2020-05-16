/* eslint-disable no-console */
const chalk = require("chalk");
const logger = require("loglevel");

const imdbScraper = require("./imdb-scraper");

const status = {
  SUCCESS: 0,
  WARNING: 1,
  ERROR: 2,
};

logger.setLevel(2); // set to 0 for log output of imdb-scraper, else 2

const log = [];

(async () => {
  addLogEntry(await testIMDBmainPageData());
  addLogEntry(await testIMDBplotSummary());
  addLogEntry(await testIMDBreleaseinfo());
  addLogEntry(await testIMDBtechnicalData());
  addLogEntry(await testIMDBParentalGuideData());
  addLogEntry(await testIMDBFullCreditsData());
  addLogEntry(await testIMDBCompaniesData());
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

// function array2string() {
//   let result = "";

//   for (let i = 0; i < arguments.length; i++) {
//     result += arguments[i].toString();
//   }

//   return result;
// }

function addSubLogEntry(testResult, message, newStatus) {
  if (testResult.status < newStatus) {
    testResult.status = newStatus;
  }

  testResult.log.push(message);
}

/*
 * Perform a default check: the item must be truthy and equal to the expected value
 */
function performDefaultCheck(scrapeResult, expected, testResult, fieldName) {
  if (!scrapeResult[fieldName]) {
    addSubLogEntry(testResult, `${fieldName} missing`, status.ERROR);
  } else if (JSON.stringify(scrapeResult[fieldName]) !== JSON.stringify(expected[fieldName])) {
    addSubLogEntry(
      testResult,
      `${fieldName} mismatch
  got:      ${JSON.stringify(scrapeResult[fieldName])}"
  expected: ${JSON.stringify(expected[fieldName])}`,
      status.WARNING
    );
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

  if (!scrapeResult) {
    addSubLogEntry(testResult, "no response", status.ERROR);
    return;
  }

  performDefaultCheck(scrapeResult, expected, testResult, '$IMDB_releaseType')
  performDefaultCheck(scrapeResult, expected, testResult, '$IMDB_genres')

  if (!scrapeResult.$IMDB_rating) {
    addSubLogEntry(testResult, "$IMDB_rating missing", status.ERROR);
  } else if (scrapeResult.$IMDB_rating < 7) {
    addSubLogEntry(testResult, `$IMDB_rating unexpected value
got:      "${scrapeResult.$IMDB_rating}"
expected: > 7`, status.WARNING);
  }

  if (!scrapeResult.$IMDB_numVotes) {
    addSubLogEntry(testResult, "$IMDB_numVotes missing", status.ERROR);
  } else if (scrapeResult.$IMDB_numVotes < expected.$IMDB_numVotes) {
    addSubLogEntry(testResult, `$IMDB_numVotes not lower than expected value
got:      "${scrapeResult.$IMDB_numVotes}"
expected: "${expected.$IMDB_numVotes}"`,
      status.WARNING);
  }

  performDefaultCheck(scrapeResult, expected, testResult, '$IMDB_metacriticScore')
  performDefaultCheck(scrapeResult, expected, testResult, '$IMDB_posterSmall_URL')
  performDefaultCheck(scrapeResult, expected, testResult, '$IMDB_posterLarge_URL')
  performDefaultCheck(scrapeResult, expected, testResult, '$IMDB_plotSummary')

  return testResult;
}

async function testIMDBplotSummary() {
  const testResult = {
    name: "IMDB Plot Summary",
    status: status.SUCCESS,
    log: [],
  };

  const expected = {
    $IMDB_plotSummaryFull: "After the devastating events of Avengers: Infinity War (2018), the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos' actions and restore balance to the universe."
  };

  const movie = {
    IMDB_tconst: "tt4154796",
  };

  const scrapeResult = await imdbScraper.scrapeIMDBplotSummary(
    movie,
    "After the devastating events of Avengers: Infinity War (2018), the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos' actions and restore balance to the universe."
  );

  if (!scrapeResult) {
    addSubLogEntry(testResult, "no response", status.ERROR);
    return;
  }

  performDefaultCheck(scrapeResult, expected, testResult, '$IMDB_plotSummaryFull')

  return testResult;
}

async function testIMDBreleaseinfo() {
  const testResult = {
    name: "IMDB Release Info",
    status: status.SUCCESS,
    log: [],
  };

  const expected = {
    $IMDB_originalTitle: 'Star Trek: The Next Generation',
    $IMDB_localTitle: 'Raumschiff Enterprise: Das nächste Jahrhundert',
    $IMDB_primaryTitle: 'Raumschiff Enterprise - Das nächste Jahrhundert',
    $IMDB_startYear: '1987',
    $IMDB_endYear: '1994'
  }

  const movie = {
    IMDB_tconst: "tt0092455",
  };

  const scrapeResult = await imdbScraper.scrapeIMDBreleaseinfo(
    movie,
    [{ name: 'Germany' }],
    []
  );

  if (!scrapeResult) {
    addSubLogEntry(testResult, "no response", status.ERROR);
    return;
  }

  performDefaultCheck(scrapeResult, expected, testResult, '$IMDB_originalTitle')
  performDefaultCheck(scrapeResult, expected, testResult, '$IMDB_localTitle')
  performDefaultCheck(scrapeResult, expected, testResult, '$IMDB_primaryTitle')
  performDefaultCheck(scrapeResult, expected, testResult, '$IMDB_startYear')
  performDefaultCheck(scrapeResult, expected, testResult, '$IMDB_endYear')

  return testResult;
}

async function testIMDBtechnicalData() {
  const testResult = {
    name: "IMDB Technical Data",
    status: status.SUCCESS,
    log: [],
  };

  const expected = {
    $IMDB_runtimeMinutes: '181'
  }

  const movie = {
    IMDB_tconst: "tt4154796",
  };

  const scrapeResult = await imdbScraper.scrapeIMDBtechnicalData(
    movie
  );

  if (!scrapeResult) {
    addSubLogEntry(testResult, "no response", status.ERROR);
    return;
  }

  performDefaultCheck(scrapeResult, expected, testResult, '$IMDB_runtimeMinutes')

  return testResult;
}

async function testIMDBParentalGuideData() {
  const testResult = {
    name: "IMDB Parental Guide Data",
    status: status.SUCCESS,
    log: [],
  };

  const expected = {
    $IMDB_MinAge: 7,
    $IMDB_MaxAge: 16,
    $IMDB_id_AgeRating_Chosen_Country: 1337,  // yeah, we made this up
    $IMDB_Parental_Advisory_Nudity: 0,
    $IMDB_Parental_Advisory_Violence: 2,
    $IMDB_Parental_Advisory_Profanity: 1,
    $IMDB_Parental_Advisory_Alcohol: 1,
    $IMDB_Parental_Advisory_Frightening: 2
  }

  const movie = {
    IMDB_tconst: "tt4154796",
  };

  async function dbFireProcedureReturnAllCallback() {
    return [
      { Country: 'DE', Code: '12', Age: 12, id_AgeRating: 1337 }
    ];
  }

  function dbFireProcedureCallback() {
    return;
  }

  function dbFireProcedureReturnScalarCallback() {
    return null;
  }

  const scrapeResult = await imdbScraper.scrapeIMDBParentalGuideData(
    movie, [{ code: 'de' }], dbFireProcedureReturnAllCallback, dbFireProcedureCallback, dbFireProcedureReturnScalarCallback
  );

  if (!scrapeResult) {
    addSubLogEntry(testResult, "no response", status.ERROR);
    return;
  }

  performDefaultCheck(scrapeResult, expected, testResult, '$IMDB_MinAge')
  performDefaultCheck(scrapeResult, expected, testResult, '$IMDB_MaxAge')
  performDefaultCheck(scrapeResult, expected, testResult, '$IMDB_id_AgeRating_Chosen_Country')

  if (isNaN(scrapeResult.$IMDB_Parental_Advisory_Nudity)) {
    addSubLogEntry(testResult, "$IMDB_Parental_Advisory_Nudity missing", status.ERROR);
  } else if (scrapeResult.$IMDB_Parental_Advisory_Nudity !== expected.$IMDB_Parental_Advisory_Nudity) {
    addSubLogEntry(testResult, `$IMDB_Parental_Advisory_Nudity mismatch
got:      "${scrapeResult.$IMDB_Parental_Advisory_Nudity}"
expected: "${expected.$IMDB_Parental_Advisory_Nudity}"`,
      status.WARNING);
  }

  performDefaultCheck(scrapeResult, expected, testResult, '$IMDB_Parental_Advisory_Violence')
  performDefaultCheck(scrapeResult, expected, testResult, '$IMDB_Parental_Advisory_Profanity')
  performDefaultCheck(scrapeResult, expected, testResult, '$IMDB_Parental_Advisory_Alcohol')
  performDefaultCheck(scrapeResult, expected, testResult, '$IMDB_Parental_Advisory_Frightening')

  return testResult;
}

async function testIMDBFullCreditsData() {
  const testResult = {
    name: "IMDB Full Credits Data",
    status: status.SUCCESS,
    log: [],
  };

  const expected = {
    topCredits: {
      '$IMDB_Top_Directors': '[{"category":"Directed by","id":"nm0751577","name":"Anthony Russo","credit":null},{"category":"Directed by","id":"nm0751648","name":"Joe Russo","credit":null}]',
      '$IMDB_Top_Writers': '[{"category":"Writing Credits","id":"nm1321655","name":"Christopher Markus","credit":"(screenplay by) &"},{"category":"Writing Credits","id":"nm1321656","name":"Stephen McFeely","credit":"(screenplay by)"},{"category":"Writing Credits","id":"nm0498278","name":"Stan Lee","credit":"(based on the Marvel comics by) and"},{"category":"Writing Credits","id":"nm0456158","name":"Jack Kirby","credit":"(based on the Marvel comics by)"},{"category":"Writing Credits","id":"nm0800209","name":"Joe Simon","credit":"(Captain America created by) and"}]',
      '$IMDB_Top_Producers': `[{"category":"Produced by","id":"nm0022285","name":"Victoria Alonso","credit":"executive producer"},{"category":"Produced by","id":"nm0068416","name":"Mitchell Bell","credit":"co-producer (as Mitch Bell)"},{"category":"Produced by","id":"nm2753152","name":"Ari Costa","credit":"associate producer"},{"category":"Produced by","id":"nm0195669","name":"Louis D'Esposito","credit":"executive producer"},{"category":"Produced by","id":"nm0269463","name":"Jon Favreau","credit":"executive producer"}]`,
      '$IMDB_Top_Cast': '[{"category":"Cast","id":"nm0000375","name":"Robert Downey Jr.","credit":"Tony Stark / Iron Man"},{"category":"Cast","id":"nm0262635","name":"Chris Evans","credit":"Steve Rogers / Captain America"},{"category":"Cast","id":"nm0749263","name":"Mark Ruffalo","credit":"Bruce Banner / Hulk"},{"category":"Cast","id":"nm1165110","name":"Chris Hemsworth","credit":"Thor"},{"category":"Cast","id":"nm0424060","name":"Scarlett Johansson","credit":"Natasha Romanoff / Black Widow"}]'
    },

    credits0: {
      category: 'Cast',
      id: 'nm0000375',
      name: 'Robert Downey Jr.',
      credit: 'Tony Stark / Iron Man'
    }
  }

  const movie = {
    IMDB_tconst: "tt4154796",
  };

  const scrapeResult = await imdbScraper.scrapeIMDBFullCreditsData(
    movie
  );

  if (!scrapeResult) {
    addSubLogEntry(testResult, "no response", status.ERROR);
    return;
  }

  performDefaultCheck(scrapeResult, expected, testResult, 'topCredits')

  if (!scrapeResult.credits) {
    addSubLogEntry(testResult, "credits missing", status.ERROR);
  } else {
    if (scrapeResult.credits.length !== 3647) {
      addSubLogEntry(testResult, `credits count mismatch
  got:      ${scrapeResult.credits.length} entries
  expected: 3647 entries`,
        status.WARNING);
    }

    if (JSON.stringify(scrapeResult.credits[0]) !== JSON.stringify(expected.credits0)) {
      addSubLogEntry(testResult, `credits[0] mismatch
  got:      ${JSON.stringify(scrapeResult.credits[0])}
  expected: ${JSON.stringify(expected.credits0)}`,
        status.WARNING);
    }
  }

  return testResult;
}

async function testIMDBCompaniesData() {
  const testResult = {
    name: "IMDB Companies Data",
    status: status.SUCCESS,
    log: [],
  };

  const expected = {
    topProductionCompanies: {
      '$IMDB_Top_Production_Companies': '[{"category":"Production","id":"co0051941","name":"Marvel Studios","role":""}]'
    },

    companies1: {
      category: 'Distributors',
      id: 'co0242075',
      name: 'B&H Film Distribution',
      role: '(2019) (Ukraine) (theatrical)'
    }
  }

  const movie = {
    IMDB_tconst: "tt4154796",
  };

  const scrapeResult = await imdbScraper.scrapeIMDBCompaniesData(movie);

  if (!scrapeResult) {
    addSubLogEntry(testResult, "no response", status.ERROR);
    return;
  }

  performDefaultCheck(scrapeResult, expected, testResult, 'topProductionCompanies')

  if (!scrapeResult.companies) {
    addSubLogEntry(testResult, "companies missing", status.ERROR);
  } else {
    if (scrapeResult.companies.length < 140) {
      addSubLogEntry(testResult, `companies count too low
  got:      ${scrapeResult.companies.length} entries
  expected: > 140 entries`,
        status.WARNING);
    }

    if (JSON.stringify(scrapeResult.companies[1]) !== JSON.stringify(expected.companies1)) {
      addSubLogEntry(testResult, `companies[1] mismatch
  got:      ${JSON.stringify(scrapeResult.companies[1])}
  expected: ${JSON.stringify(expected.companies1)}`,
        status.WARNING);
    }
  }

  return testResult;
}