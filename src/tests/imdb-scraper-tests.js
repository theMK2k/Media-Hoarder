const imdbScraper = require("../imdb-scraper");

const logger = require("../helpers/logger");

const status = {
  SUCCESS: 0,
  WARNING: 1,
  ERROR: 2,
  EXCEPTION: 3,
};

function addSubLogEntry(testResult, message, newStatus) {
  if (testResult.status < newStatus) {
    testResult.status = newStatus;
  }

  testResult.log.push(message);
}

/**
 * Check if a field is truthy and add a log entry if it's not
 * @param {*} scrapeResult
 * @param {*} testResult
 * @param {*} fieldName
 * @param {*} msgPrefix
 * @param {*} allowFalsy
 * @returns {boolean} true if the field is truthy (or allowFalsy allows it to be falsy), false otherwise
 */
function performTruthyCheck(scrapeResult, testResult, fieldName, msgPrefix, allowFalsy) {
  if (!allowFalsy && !scrapeResult[fieldName]) {
    addSubLogEntry(testResult, `${msgPrefix ? msgPrefix + " " : ""}${fieldName} missing`, status.ERROR);
    return false;
  }

  return true;
}

/*
 * Perform a default check: the item must be truthy and equal to the expected value
 */
function performDefaultCheck(scrapeResult, expected, testResult, fieldName, msgPrefix, allowFalsy, checkIncludes) {
  if (!performTruthyCheck(scrapeResult, testResult, fieldName, msgPrefix, allowFalsy)) {
    return;
  }

  if (
    (!checkIncludes && JSON.stringify(scrapeResult[fieldName]) !== JSON.stringify(expected[fieldName])) ||
    (checkIncludes && JSON.stringify(scrapeResult[fieldName]).includes(JSON.stringify(expected[fieldName])))
  ) {
    addSubLogEntry(
      testResult,
      `${msgPrefix ? msgPrefix + " " : ""}${fieldName} mismatch
    got:      ${JSON.stringify(scrapeResult[fieldName])}
    expected: ${JSON.stringify(expected[fieldName])}`,
      status.WARNING
    );
  }
}

async function testIMDBmainPageData() {
  // Avengers: Endgame (2019)
  const testResult = {
    name: "IMDB Main Page Data",
    functionName: "testIMDBmainPageData",
    status: status.SUCCESS,
    log: [],
  };

  try {
    const expected = {
      $IMDB_releaseType: "movie",
      $IMDB_genres: ["action", "adventure", "drama", "sci-fi"],
      $IMDB_rating: 8.4,
      $IMDB_numVotes: 714190,
      $IMDB_metacriticScore: 78,
      $IMDB_posterSmall_URL: "extras/tt4154796_posterSmall.jpg",
      $IMDB_posterLarge_URL: "extras/tt4154796_posterLarge.jpg",
      $IMDB_plotSummary:
        "After the devastating events of Avengers: Infinity War (2018), the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos' actions and restore balance to the universe.",
      $IMDB_Trailer_URL: "/video/imdb/vi2163260441",
      $IMDB_startYear: 2019,
      $IMDB_endYear: null,
    };

    const movie = {
      IMDB_tconst: "tt4154796",
    };

    const scrapeResult = await imdbScraper.scrapeIMDBmainPageData(movie, async () => {
      return true;
    });

    if (!scrapeResult) {
      addSubLogEntry(testResult, "no response", status.ERROR);
      return testResult;
    }

    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_releaseType");

    // Genres: at least 3 of the 4 expected genres should match
    if (!scrapeResult.$IMDB_genres) {
      addSubLogEntry(testResult, "$IMDB_genres missing", status.ERROR);
    } else {
      let counter = 0;
      expected.$IMDB_genres.forEach((expectedGenre) => {
        if (scrapeResult.$IMDB_genres.find((genre) => expectedGenre === genre)) {
          counter++;
        }
      });

      if (counter < 3) {
        addSubLogEntry(
          testResult,
          `$IMDB_genres mismatch too big
    got:      ${JSON.stringify(scrapeResult.$IMDB_genres)}
    expected: ${JSON.stringify(expected.$IMDB_genres)}
    `,
          status.WARNING
        );
      }
    }

    if (!scrapeResult.$IMDB_rating) {
      addSubLogEntry(testResult, "$IMDB_rating missing", status.ERROR);
    } else if (scrapeResult.$IMDB_rating < 7) {
      addSubLogEntry(
        testResult,
        `$IMDB_rating unexpected value
    got:      "${scrapeResult.$IMDB_rating}"
    expected: > 7`,
        status.WARNING
      );
    }

    if (!scrapeResult.$IMDB_numVotes) {
      addSubLogEntry(testResult, "$IMDB_numVotes missing", status.ERROR);
    } else if (scrapeResult.$IMDB_numVotes < expected.$IMDB_numVotes) {
      addSubLogEntry(
        testResult,
        `$IMDB_numVotes not lower than expected value
    got:      "${scrapeResult.$IMDB_numVotes}"
    expected: "${expected.$IMDB_numVotes}"`,
        status.WARNING
      );
    }

    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_metacriticScore");
    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_posterSmall_URL");
    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_posterLarge_URL");
    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_plotSummary");
    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_Trailer_URL");
    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_startYear", null, true);
    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_endYear", null, true);
  } catch (error) {
    testResult.status = status.EXCEPTION;
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
  }

  return testResult;
}

async function testIMDBmainPageData2() {
  // Le Silence de la Mer (1949)
  const testResult = {
    name: "IMDB Main Page Data 2",
    functionName: "testIMDBmainPageData2",
    status: status.SUCCESS,
    log: [],
  };

  try {
    const expected = {
      $IMDB_releaseType: "movie",
      $IMDB_genres: ["drama", "romance", "war"],
      $IMDB_rating: 8.4,
      $IMDB_numVotes: 4000,
      $IMDB_posterSmall_URL: "extras/tt0039822_posterSmall.jpg",
      $IMDB_posterLarge_URL: "extras/tt0039822_posterLarge.jpg",
      $IMDB_plotSummary: "1941 in a small town in Nazi occupied France",
      $IMDB_Trailer_URL: null,
      $IMDB_startYear: 1949,
      $IMDB_endYear: null,
    };

    const movie = {
      IMDB_tconst: "tt0039822",
    };

    const scrapeResult = await imdbScraper.scrapeIMDBmainPageData(movie, async () => {
      return true;
    });

    if (!scrapeResult) {
      addSubLogEntry(testResult, "no response", status.ERROR);
      return testResult;
    }

    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_releaseType");
    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_genres");

    if (!scrapeResult.$IMDB_rating) {
      addSubLogEntry(testResult, "$IMDB_rating missing", status.ERROR);
    } else if (scrapeResult.$IMDB_rating < 7) {
      addSubLogEntry(
        testResult,
        `$IMDB_rating unexpected value
    got:      "${scrapeResult.$IMDB_rating}"
    expected: > 7`,
        status.WARNING
      );
    }

    if (!scrapeResult.$IMDB_numVotes) {
      addSubLogEntry(testResult, "$IMDB_numVotes missing", status.ERROR);
    } else if (scrapeResult.$IMDB_numVotes < expected.$IMDB_numVotes) {
      addSubLogEntry(
        testResult,
        `$IMDB_numVotes not lower than expected value
    got:      "${scrapeResult.$IMDB_numVotes}"
    expected: "${expected.$IMDB_numVotes}"`,
        status.WARNING
      );
    }

    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_posterSmall_URL");
    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_posterLarge_URL");

    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_plotSummary", null, null, true);

    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_Trailer_URL", null, true);

    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_startYear", null, true);
    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_endYear", null, true);
  } catch (error) {
    testResult.status = status.EXCEPTION;
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
  }

  return testResult;
}

async function testIMDBmainPageData3() {
  // Star Trek: The Next Generation (1987–1994)
  const testResult = {
    name: "IMDB Main Page Data 3",
    functionName: "testIMDBmainPageData3",
    status: status.SUCCESS,
    log: [],
  };

  try {
    const expected = {
      $IMDB_releaseType: "tvSeries",
      $IMDB_genres: ["action", "adventure", "drama", "sci-fi"],
      $IMDB_rating: 8.7,
      $IMDB_numVotes: 123000,
      $IMDB_posterSmall_URL: "extras/tt0092455_posterSmall.jpg",
      $IMDB_posterLarge_URL: "extras/tt0092455_posterLarge.jpg",
      $IMDB_plotSummary:
        "Set almost 100 years after Captain Kirk's 5-year mission, a new generation of Starfleet officers sets off in the U.S.S. Enterprise-D",
      $IMDB_Trailer_URL: "/video/imdb/vi71221529",
      $IMDB_startYear: 1987,
      $IMDB_endYear: 1994,
    };

    const movie = {
      IMDB_tconst: "tt0092455",
    };

    const scrapeResult = await imdbScraper.scrapeIMDBmainPageData(movie, async () => {
      return true;
    });

    if (!scrapeResult) {
      addSubLogEntry(testResult, "no response", status.ERROR);
      return testResult;
    }

    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_releaseType");
    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_genres");

    if (!scrapeResult.$IMDB_rating) {
      addSubLogEntry(testResult, "$IMDB_rating missing", status.ERROR);
    } else if (scrapeResult.$IMDB_rating < 7) {
      addSubLogEntry(
        testResult,
        `$IMDB_rating unexpected value
    got:      "${scrapeResult.$IMDB_rating}"
    expected: > 7`,
        status.WARNING
      );
    }

    if (!scrapeResult.$IMDB_numVotes) {
      addSubLogEntry(testResult, "$IMDB_numVotes missing", status.ERROR);
    } else if (scrapeResult.$IMDB_numVotes < expected.$IMDB_numVotes) {
      addSubLogEntry(
        testResult,
        `$IMDB_numVotes not lower than expected value
    got:      "${scrapeResult.$IMDB_numVotes}"
    expected: "${expected.$IMDB_numVotes}"`,
        status.WARNING
      );
    }

    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_posterSmall_URL");
    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_posterLarge_URL");

    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_plotSummary", null, null, true);

    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_Trailer_URL", null, true);

    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_startYear", null, true);
    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_endYear", null, true);
  } catch (error) {
    testResult.status = status.EXCEPTION;
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
  }

  return testResult;
}

async function testIMDBmainPageData4() {
  // An American Werewolf in London (no year, no summary)
  const testResult = {
    name: "IMDB Main Page Data 4",
    functionName: "testIMDBmainPageData4",
    status: status.SUCCESS,
    log: [],
  };

  try {
    const expected = {
      $IMDB_releaseType: "movie",
      $IMDB_genres: ["comedy", "fantasy", "horror", "thriller"],
      $IMDB_plotSummary: null,
      $IMDB_Trailer_URL: null,
      $IMDB_startYear: null,
      $IMDB_endYear: null,
    };

    const movie = {
      IMDB_tconst: "tt1465834",
    };

    const scrapeResult = await imdbScraper.scrapeIMDBmainPageData(movie, async () => {
      return true;
    });

    if (!scrapeResult) {
      addSubLogEntry(testResult, "no response", status.ERROR);
      return testResult;
    }

    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_releaseType");
    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_genres");

    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_plotSummary", null, null, true);

    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_Trailer_URL", null, true);

    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_startYear", null, true);
    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_endYear", null, true);
  } catch (error) {
    testResult.status = status.EXCEPTION;
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
  }

  return testResult;
}

async function testIMDBplotSummary() {
  const testResult = {
    name: "IMDB Plot Summary",
    functionName: "testIMDBplotSummary",
    status: status.SUCCESS,
    log: [],
  };

  try {
    const expected = {
      $IMDB_plotSummaryFull:
        "In occupied France, an elderly man and his niece are forced to give shelter to a German army lieutenant who seemingly loves their country and culture.",
    };

    const movie = {
      IMDB_tconst: "tt0039822",
    };

    const scrapeResult = await imdbScraper.scrapeIMDBplotSummary(
      movie,
      "In occupied France, an elderly man and his niece are forced to give shelter to a German army lieutenant who seemingly loves their country and culture."
    );

    if (!scrapeResult) {
      addSubLogEntry(testResult, "no response", status.ERROR);
      return testResult;
    }

    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_plotSummaryFull");
  } catch (error) {
    testResult.status = status.EXCEPTION;
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
  }

  return testResult;
}

async function testIMDBreleaseinfo() {
  const testResult = {
    name: "IMDB Release Info",
    functionName: "testIMDBreleaseinfo",
    status: status.SUCCESS,
    log: [],
  };

  try {
    const expected = {
      $IMDB_originalTitle: "Star Wars",
      $IMDB_localTitle: "Star Wars: Episode IV - Eine neue Hoffnung",
      $IMDB_primaryTitle: "Star Wars: Episode IV - A New Hope",
    };

    const movie = {
      IMDB_tconst: "tt0076759",
    };

    const scrapeResult = await imdbScraper.scrapeIMDBreleaseinfo(movie, [{ name: "Germany" }], []);

    if (!scrapeResult) {
      addSubLogEntry(testResult, "no response", status.ERROR);
      return testResult;
    }

    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_originalTitle");
    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_localTitle");
    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_primaryTitle");
  } catch (error) {
    testResult.status = status.EXCEPTION;
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
  }

  return testResult;
}

async function testIMDBtechnicalData() {
  const testResult = {
    name: "IMDB Technical Data",
    functionName: "testIMDBtechnicalData",
    status: status.SUCCESS,
    log: [],
  };

  try {
    const expected = {
      $IMDB_runtimeMinutes: "181",
    };

    const movie = {
      IMDB_tconst: "tt4154796",
    };

    const scrapeResult = await imdbScraper.scrapeIMDBtechnicalData(movie);

    if (!scrapeResult) {
      addSubLogEntry(testResult, "no response", status.ERROR);
      return testResult;
    }

    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_runtimeMinutes");
  } catch (error) {
    testResult.status = status.EXCEPTION;
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
  }

  return testResult;
}

async function testIMDBtechnicalData2() {
  const testResult = {
    name: "IMDB Technical Data 2",
    functionName: "testIMDBtechnicalData2",
    status: status.SUCCESS,
    log: [],
  };

  try {
    const expected = {
      $IMDB_runtimeMinutes: "10",
    };

    const movie = {
      IMDB_tconst: "tt2736746",
    };

    const scrapeResult = await imdbScraper.scrapeIMDBtechnicalData(movie);

    if (!scrapeResult) {
      addSubLogEntry(testResult, "no response", status.ERROR);
      return testResult;
    }

    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_runtimeMinutes");
  } catch (error) {
    testResult.status = status.EXCEPTION;
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
    logger.error(error);
  }

  return testResult;
}

async function testIMDBtechnicalData3() {
  const testResult = {
    name: "IMDB Technical Data 3",
    functionName: "testIMDBtechnicalData3",
    status: status.SUCCESS,
    log: [],
  };

  try {
    const expected = {
      $IMDB_runtimeMinutes: "181",
    };

    const movie = {
      IMDB_tconst: "tt4154796",
    };

    const scrapeResult = await imdbScraper.scrapeIMDBtechnicalData(movie);

    if (!scrapeResult) {
      addSubLogEntry(testResult, "no response", status.ERROR);
      return testResult;
    }

    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_runtimeMinutes");
  } catch (error) {
    testResult.status = status.EXCEPTION;
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
    logger.error(error);
  }

  return testResult;
}

async function testIMDBParentalGuideData() {
  const testResult = {
    name: "IMDB Parental Guide Data",
    functionName: "testIMDBParentalGuideData",
    status: status.SUCCESS,
    log: [],
  };

  // Mock Functions
  async function dbFireProcedureReturnAllCallback() {
    return [{ Country: "DE", Code: "12", Age: 12, id_AgeRating: 1337 }];
  }

  function dbFireProcedureCallback() {
    return;
  }

  function dbFireProcedureReturnScalarCallback() {
    return null;
  }

  try {
    const expected = {
      $IMDB_MinAge: 6,
      $IMDB_MaxAge: 16,
      $IMDB_id_AgeRating_Chosen_Country: 1337, // yeah, we made this up
      $IMDB_Parental_Advisory_Nudity: 0,
      $IMDB_Parental_Advisory_Violence: 2,
      $IMDB_Parental_Advisory_Profanity: 1,
      $IMDB_Parental_Advisory_Alcohol: 1,
      $IMDB_Parental_Advisory_Frightening: 2,
    };

    const movie = {
      IMDB_tconst: "tt4154796",
    };

    const scrapeResult = await imdbScraper.scrapeIMDBParentalGuideData(
      movie,
      [{ code: "de" }],
      dbFireProcedureReturnAllCallback,
      dbFireProcedureCallback,
      dbFireProcedureReturnScalarCallback
    );

    if (!scrapeResult) {
      addSubLogEntry(testResult, "no response", status.ERROR);
      return testResult;
    }

    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_MinAge");
    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_MaxAge");
    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_id_AgeRating_Chosen_Country");

    if (isNaN(scrapeResult.$IMDB_Parental_Advisory_Nudity)) {
      addSubLogEntry(testResult, "$IMDB_Parental_Advisory_Nudity missing", status.ERROR);
    } else if (scrapeResult.$IMDB_Parental_Advisory_Nudity !== expected.$IMDB_Parental_Advisory_Nudity) {
      addSubLogEntry(
        testResult,
        `$IMDB_Parental_Advisory_Nudity mismatch
    got:      "${scrapeResult.$IMDB_Parental_Advisory_Nudity}"
    expected: "${expected.$IMDB_Parental_Advisory_Nudity}"`,
        status.WARNING
      );
    }

    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_Parental_Advisory_Violence");
    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_Parental_Advisory_Profanity");
    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_Parental_Advisory_Alcohol");
    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_Parental_Advisory_Frightening");
  } catch (error) {
    testResult.status = status.EXCEPTION;
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
  }

  return testResult;
}

async function testIMDBFullCreditsData() {
  const testResult = {
    name: "IMDB Full Credits Data",
    functionName: "testIMDBFullCreditsData",
    status: status.SUCCESS,
    log: [],
  };

  try {
    const expected = {
      topCredits: {
        $IMDB_Top_Directors:
          '[{"category":"Directed by","id":"nm0751577","name":"Anthony Russo","credit":null},{"category":"Directed by","id":"nm0751648","name":"Joe Russo","credit":null}]',
        $IMDB_Top_Writers:
          '[{"category":"Writing Credits","id":"nm1321655","name":"Christopher Markus","credit":"(screenplay by) &"},{"category":"Writing Credits","id":"nm1321656","name":"Stephen McFeely","credit":"(screenplay by)"},{"category":"Writing Credits","id":"nm0498278","name":"Stan Lee","credit":"(based on the Marvel comics by) and"},{"category":"Writing Credits","id":"nm0456158","name":"Jack Kirby","credit":"(based on the Marvel comics by)"},{"category":"Writing Credits","id":"nm0800209","name":"Joe Simon","credit":"(Captain America created by) and"}]',
        $IMDB_Top_Producers:
          '[{"category":"Produced by","id":"nm0022285","name":"Victoria Alonso","credit":"executive producer"},{"category":"Produced by","id":"nm0068416","name":"Mitchell Bell","credit":"co-producer (as Mitch Bell)"},{"category":"Produced by","id":"nm2753152","name":"Ari Costa","credit":"associate producer"},{"category":"Produced by","id":"nm0195669","name":"Louis D\'Esposito","credit":"executive producer"},{"category":"Produced by","id":"nm0269463","name":"Jon Favreau","credit":"executive producer"}]',
        $IMDB_Top_Cast:
          '[{"category":"Cast","id":"nm0000375","name":"Robert Downey Jr.","credit":"Tony Stark / Iron Man"},{"category":"Cast","id":"nm0262635","name":"Chris Evans","credit":"Steve Rogers / Captain America"},{"category":"Cast","id":"nm0749263","name":"Mark Ruffalo","credit":"Bruce Banner / Hulk"},{"category":"Cast","id":"nm1165110","name":"Chris Hemsworth","credit":"Thor"},{"category":"Cast","id":"nm0424060","name":"Scarlett Johansson","credit":"Natasha Romanoff / Black Widow"}]',
      },

      credits0: {
        category: "Cast",
        id: "nm0000375",
        name: "Robert Downey Jr.",
        credit: "Tony Stark / Iron Man",
      },
    };

    const movie = {
      IMDB_tconst: "tt4154796",
    };

    const scrapeResult = await imdbScraper.scrapeIMDBFullCreditsData(movie);

    if (!scrapeResult) {
      addSubLogEntry(testResult, "no response", status.ERROR);
      return testResult;
    }

    performDefaultCheck(scrapeResult, expected, testResult, "topCredits");

    if (!scrapeResult.credits) {
      addSubLogEntry(testResult, "credits missing", status.ERROR);
    } else {
      if (scrapeResult.credits.length < 3647) {
        addSubLogEntry(
          testResult,
          `credits count mismatch
      got:      ${scrapeResult.credits.length} entries
      expected: 3647+ entries`,
          status.WARNING
        );
      }

      if (JSON.stringify(scrapeResult.credits[0]) !== JSON.stringify(expected.credits0)) {
        addSubLogEntry(
          testResult,
          `credits[0] mismatch
      got:      ${JSON.stringify(scrapeResult.credits[0])}
      expected: ${JSON.stringify(expected.credits0)}`,
          status.WARNING
        );
      }
    }
  } catch (error) {
    testResult.status = status.EXCEPTION;
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
  }

  return testResult;
}

async function testIMDBCompaniesData() {
  const testResult = {
    name: "IMDB Companies Data",
    functionName: "testIMDBCompaniesData",
    status: status.SUCCESS,
    log: [],
  };

  try {
    const expected = {
      topProductionCompanies: {
        $IMDB_Top_Production_Companies:
          '[{"category":"Production","id":"co0051941","name":"Marvel Studios","role":""},{"category":"Production","id":"co0008970","name":"Walt Disney Pictures","role":""}]',
      },

      companies1: {
        category: "Production",
        id: "co0008970",
        name: "Walt Disney Pictures",
        role: "",
      },
    };

    const movie = {
      IMDB_tconst: "tt4154796",
    };

    const scrapeResult = await imdbScraper.scrapeIMDBCompaniesDataV3(movie);

    if (!scrapeResult) {
      addSubLogEntry(testResult, "no response", status.ERROR);
      return testResult;
    }

    performDefaultCheck(scrapeResult, expected, testResult, "topProductionCompanies");

    if (!scrapeResult.companies) {
      addSubLogEntry(testResult, "companies missing", status.ERROR);
    } else {
      if (scrapeResult.companies.length < 140) {
        addSubLogEntry(
          testResult,
          `companies count too low
      got:      ${scrapeResult.companies.length} entries
      expected: > 140 entries`,
          status.WARNING
        );
      }

      if (JSON.stringify(scrapeResult.companies[1]) !== JSON.stringify(expected.companies1)) {
        addSubLogEntry(
          testResult,
          `companies[1] mismatch
      got:      ${JSON.stringify(scrapeResult.companies[1])}
      expected: ${JSON.stringify(expected.companies1)}`,
          status.WARNING
        );
      }
    }
  } catch (error) {
    testResult.status = status.EXCEPTION;
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
  }

  return testResult;
}

async function testIMDBPersonData() {
  const testResult = {
    name: "IMDB Person Data",
    functionName: "testIMDBPersonData",
    status: status.SUCCESS,
    log: [],
  };

  // Mock Functions
  async function downloadFileCallback() {
    return true;
  }

  try {
    const expected = {
      $IMDB_Person_ID: "nm3380149",
      $Photo_URL: "extras/nm3380149_poster.jpg",
      $ShortBio:
        'This is a test biography for testing a const page with over 150 characters so I\'m going to make this really long by typing really hard. I hope this does not break any other test but since this const page was not locked and there was no biography before this one I guess it should be alright. Typing this makes me feel like the "good old" days of ...  »',
      $LongBio:
        "This is a test biography for testing a const page with over 150 characters so I'm going to make this really long by typing really hard. I hope this does not break any other test but since this const page was not locked and there was no biography before this one I guess it should be alright. Typing this makes me feel like the \"good old\" days of writing essays in school, where 90% of the time I was just trying to make my sentences really long to meet the word requirement like I am doing now. There is no word count in this text box so I don't even know how far I am, so I pasted this to the word doc where they have word count and I found out I wasn't even at 100. That hit me hard in the heart and I couldn't take it. But what else could I do besides keep typing and making this really long. Ok I think I'm good with this length I'm just going to copy this paragraph three times.\n\nThis is a test biography for testing a const page with over 150 characters so I'm going to make this really long by typing really hard. I hope this does not break any other test but since this const page was not locked and there was no biography before this one I guess it should be alright. Typing this makes me feel like the \"good old\" days of writing essays in school, where 90% of the time I was just trying to make my sentences really long to meet the word requirement like I am doing now. There is no word count in this text box so I don't even know how far I am, so I pasted this to the word doc where they have word count and I found out I wasn't even at 100. That hit me hard in the heart and I couldn't take it. But what else could I do besides keep typing and making this really long. Ok I think I'm good with this length I'm just going to copy this paragraph three times.\n\nThis is a test biography for testing a const page with over 150 characters so I'm going to make this really long by typing really hard. I hope this does not break any other test but since this const page was not locked and there was no biography before this one I guess it should be alright. Typing this makes me feel like the \"good old\" days of writing essays in school, where 90% of the time I was just trying to make my sentences really long to meet the word requirement like I am doing now. There is no word count in this text box so I don't even know how far I am, so I pasted this to the word doc where they have word count and I found out I wasn't even at 100. That hit me hard in the heart and I couldn't take it. But what else could I do besides keep typing and making this really long. Ok I think I'm good with this length I'm just going to copy this paragraph three times.",
    };

    const scrapeResult = await imdbScraper.scrapeIMDBPersonData(expected.$IMDB_Person_ID, downloadFileCallback);

    if (!scrapeResult) {
      addSubLogEntry(testResult, "no response", status.ERROR);
      return testResult;
    }

    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_Person_ID");
    performDefaultCheck(scrapeResult, expected, testResult, "$Photo_URL");
    performDefaultCheck(scrapeResult, expected, testResult, "$ShortBio");
    performDefaultCheck(scrapeResult, expected, testResult, "$LongBio");
  } catch (error) {
    testResult.status = status.EXCEPTION;
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
  }

  return testResult;
}

async function testIMDBTrailerMediaURLs() {
  // NOTE: unfortunately we can't scrape trailer media anymore
  //       i.e. we can't find out the actual .mp4 video source

  const testResult = {
    name: "IMDB Trailer Media URLs",
    functionName: "testIMDBTrailerMediaURLs",
    status: status.SUCCESS,
    log: [],
  };

  try {
    // const expected = {
    //     mediaURLs: [],
    //     slateURL: null,
    // };

    const scrapeResult = await imdbScraper.scrapeIMDBTrailerMediaURLs("https://www.imdb.com/video/imdb/vi2163260441");

    if (!scrapeResult) {
      addSubLogEntry(testResult, "no response", status.ERROR);
      return testResult;
    }

    if (!scrapeResult.mediaURLs) {
      addSubLogEntry(testResult, "mediaURLs missing", status.ERROR);
    } else if (scrapeResult.mediaURLs.length !== 5) {
      addSubLogEntry(
        testResult,
        `mediaURLs count mismatch
          got:      ${scrapeResult.mediaURLs.length} entries
          expected: 5 entries`,
        status.WARNING
      );
    }

    if (scrapeResult.slateURL) {
      addSubLogEntry(
        testResult,
        `slateURL mismatch
            got:      ${JSON.stringify(scrapeResult.slateURL)}
            expected: null`,
        status.WARNING
      );
    }
  } catch (error) {
    testResult.status = status.EXCEPTION;
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
  }

  return testResult;
}

async function testIMDBplotKeywords() {
  const testResult = {
    name: "IMDB Plot Keywords",
    functionName: "testIMDBplotKeywords",
    status: status.SUCCESS,
    log: [],
  };

  try {
    const expected = {
      keyword0: { Keyword: "Dream", NumVotes: 20, NumRelevant: 20 },
    };

    const movie = {
      IMDB_tconst: "tt1375666",
    };

    const scrapeResult = await imdbScraper.scrapeIMDBplotKeywordsV3(movie);

    if (!scrapeResult) {
      addSubLogEntry(testResult, "no response", status.ERROR);
      return testResult;
    }

    if (scrapeResult.length === 0) {
      addSubLogEntry(testResult, "keywords missing", status.ERROR);
    } else {
      if (scrapeResult.length < 385) {
        addSubLogEntry(
          testResult,
          `keywords count mismatch
          got:      ${scrapeResult.length} entries
          expected: 385+ entries`,
          status.WARNING
        );
      }

      if (scrapeResult[0].Keyword !== expected.keyword0.Keyword) {
        addSubLogEntry(
          testResult,
          `keyword[0].Keyword mismatch
          got:      ${JSON.stringify(scrapeResult[0].Keyword)}
          expected: ${JSON.stringify(expected.keyword0.Keyword)}`,
          status.WARNING
        );
      }

      if (scrapeResult[0].NumVotes < expected.keyword0.NumVotes) {
        addSubLogEntry(
          testResult,
          `keyword[0].NumVotes mismatch
          got:      ${JSON.stringify(scrapeResult[0].NumVotes)}
          expected: ${expected.keyword0.NumVotes}+`,
          status.WARNING
        );
      }
      if (scrapeResult[0].NumRelevant < expected.keyword0.NumRelevant) {
        addSubLogEntry(
          testResult,
          `keyword[0].NumRelevant mismatch
          got:      ${scrapeResult[0].NumRelevant}
          expected: ${expected.keyword0.NumRelevant}+`,
          status.WARNING
        );
      }
    }
  } catch (error) {
    testResult.status = status.EXCEPTION;
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
  }

  return testResult;
}

async function testIMDBFilmingLocations() {
  const testResult = {
    name: "IMDB Filming Locations",
    functionName: "testIMDBFilmingLocations",
    status: status.SUCCESS,
    log: [],
  };

  try {
    const expected = {
      locations0: {
        Location: "Durham Cathedral, The College, Durham, County Durham, England, UK",
        Details: "Thor Meets His Mother In Asgard",
        NumInteresting: 60,
        NumVotes: 60,
      },
    };

    const movie = {
      IMDB_tconst: "tt4154796",
    };

    const scrapeResult = await imdbScraper.scrapeIMDBFilmingLocationsV3(movie);

    if (!scrapeResult) {
      addSubLogEntry(testResult, "no response", status.ERROR);
      return testResult;
    }

    if (scrapeResult.length === 0) {
      addSubLogEntry(testResult, "filming locations missing", status.ERROR);
    } else {
      if (scrapeResult.length < 11) {
        addSubLogEntry(
          testResult,
          `filming locations count mismatch
              got:      ${scrapeResult.length} entries
              expected: 11+ entries`,
          status.WARNING
        );
      }

      if (scrapeResult[0].Location !== expected.locations0.Location) {
        addSubLogEntry(
          testResult,
          `locations[0].Location mismatch
              got:      ${JSON.stringify(scrapeResult[0].Location)}
              expected: ${JSON.stringify(expected.locations0.Location)}`,
          status.WARNING
        );
      }

      if (scrapeResult[0].Details !== expected.locations0.Details) {
        addSubLogEntry(
          testResult,
          `locations[0].Details mismatch
                got:      ${JSON.stringify(scrapeResult[0].Details)}
                expected: ${JSON.stringify(expected.locations0.Details)}`,
          status.WARNING
        );
      }

      if (scrapeResult[0].NumVotes < expected.locations0.NumVotes) {
        addSubLogEntry(
          testResult,
          `keyword[0].NumVotes mismatch
                got:      ${JSON.stringify(scrapeResult[0].NumVotes)}
                expected: ${expected.locations0.NumVotes}+`,
          status.WARNING
        );
      }

      if (scrapeResult[0].NumInteresting < expected.locations0.NumInteresting) {
        addSubLogEntry(
          testResult,
          `keyword[0].NumInteresting mismatch
                got:      ${JSON.stringify(scrapeResult[0].NumInteresting)}
                expected: ${expected.locations0.NumInteresting}+`,
          status.WARNING
        );
      }
    }
  } catch (error) {
    testResult.status = status.EXCEPTION;
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
  }

  return testResult;
}

/**
 * #rip-rating-demographics
 */
async function testIMDBRatingDemographics() {
  const testResult = {
    name: "IMDB Rating Demographics",
    functionName: "testIMDBRatingDemographics",
    status: status.SUCCESS,
    log: [],
  };

  try {
    // these are ballpark values, the actual values do change because IMDB tracks the actual age and not the age when voting took place
    const expected = {
      $IMDB_rating_aged_under_18: 8.8,
      $IMDB_numVotes_aged_under_18: 1000,
      $IMDB_rating_aged_18_29: 8.6,
      $IMDB_numVotes_aged_18_29: 100000,
      $IMDB_rating_aged_30_44: 8.3,
      $IMDB_numVotes_aged_30_44: 100000,
      $IMDB_rating_aged_45_plus: 8.1,
      $IMDB_numVotes_aged_45_plus: 20000,
      $IMDB_rating_males: 8.4,
      $IMDB_numVotes_males: 300000,
      $IMDB_rating_males_aged_under_18: 8.6,
      $IMDB_numVotes_males_aged_under_18: 1000,
      $IMDB_rating_males_aged_18_29: 8.5,
      $IMDB_numVotes_males_aged_18_29: 100000,
      $IMDB_rating_males_aged_30_44: 8.2,
      $IMDB_numVotes_males_aged_30_44: 100000,
      $IMDB_rating_males_aged_45_plus: 8.1,
      $IMDB_numVotes_males_aged_45_plus: 20000,
      $IMDB_rating_females: 8.5,
      $IMDB_numVotes_females: 50000,
      $IMDB_rating_females_aged_under_18: 8.7,
      $IMDB_numVotes_females_aged_under_18: 100,
      $IMDB_rating_females_aged_18_29: 8.6,
      $IMDB_numVotes_females_aged_18_29: 10000,
      $IMDB_rating_females_aged_30_44: 8.4,
      $IMDB_numVotes_females_aged_30_44: 10000,
      $IMDB_rating_females_aged_45_plus: 8.5,
      $IMDB_numVotes_females_aged_45_plus: 1000,
      $IMDB_rating_top_1000_voters: 7.8,
      $IMDB_numVotes_top_1000_voters: 600,
      $IMDB_rating_us_users: 8.5,
      $IMDB_numVotes_us_users: 50000,
      $IMDB_rating_non_us_users: 8.2,
      $IMDB_numVotes_non_us_users: 200000,
    };

    const movie = {
      IMDB_tconst: "tt4154796",
    };

    const scrapeResult = await imdbScraper.scrapeIMDBRatingDemographics(movie, async () => {
      return true;
    });

    if (!scrapeResult) {
      addSubLogEntry(testResult, "no response", status.ERROR);
      return testResult;
    }

    Object.keys(expected).forEach((key) => {
      const scrapeValue = scrapeResult[key];
      const expectedValue = expected[key];

      if (!scrapeValue) {
        addSubLogEntry(testResult, `${key} missing`, status.ERROR);
      }

      if (key.includes("$IMDB_numVotes")) {
        if (scrapeValue < expectedValue) {
          addSubLogEntry(
            testResult,
            `${key} mismatch
                  got:      ${scrapeValue}
                  expected: ${expectedValue}+`,
            status.WARNING
          );
        }
      }

      if (key.includes("$IMDB_rating")) {
        if (scrapeValue < expectedValue - 1 || scrapeValue > expectedValue + 1) {
          addSubLogEntry(
            testResult,
            `${key} mismatch
                  got:      ${scrapeValue}
                  expected: ${expectedValue - 1}-${expectedValue + 1}`,
            status.WARNING
          );
        }
      }
    });
  } catch (error) {
    testResult.status = status.EXCEPTION;
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
  }

  return testResult;
}

async function testIMDBSuggestion() {
  const testResult = {
    name: "IMDB Search",
    functionName: "testIMDBSuggestion",
    status: status.SUCCESS,
    log: [],
  };

  try {
    const expected = [
      {
        searchTerm: "FoRReST GuMp",
        numResults: 7,
        result0: {
          tconst: "tt0109830",
          title: "Forrest Gump",
          titleType: "feature",
          year: 1994,
          imageURL:
            "https://m.media-amazon.com/images/M/MV5BNWIwODRlZTUtY2U3ZS00Yzg1LWJhNzYtMmZiYmEyNmU1NjMzXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_.jpg", // only checked for presence
        },
      },
      // {
      //   searchTerm: `天気の子`,
      //   numResults: 666,
      //   result0: {},
      // },
    ];

    for (let i = 0; i < expected.length; i++) {
      const expectedValue = expected[i];

      const scrapeResult = await imdbScraper.scrapeIMDBSuggestion(expectedValue.searchTerm);

      // logger.log(scrapeResult);

      if (!scrapeResult) {
        addSubLogEntry(testResult, `query '${expectedValue.searchTerm}' no response`, status.ERROR);
        return testResult;
      }

      if (scrapeResult.length === 0) {
        addSubLogEntry(testResult, `query '${expectedValue.searchTerm}' results missing`, status.ERROR);
        return testResult;
      }

      if (scrapeResult.length < expectedValue.numResults) {
        addSubLogEntry(
          testResult,
          `query '${expectedValue.searchTerm}' results count mismatch
                  got:      ${scrapeResult.length} entries
                  expected: ${expectedValue.numResults}+ entries`,
          status.WARNING
        );
      }

      performDefaultCheck(
        scrapeResult[0],
        expectedValue.result0,
        testResult,
        "tconst",
        `query '${expectedValue.searchTerm}'`
      );
      performDefaultCheck(
        scrapeResult[0],
        expectedValue.result0,
        testResult,
        "title",
        `query '${expectedValue.searchTerm}'`
      );
      performDefaultCheck(
        scrapeResult[0],
        expectedValue.result0,
        testResult,
        "titleType",
        `query '${expectedValue.searchTerm}'`
      );
      performDefaultCheck(
        scrapeResult[0],
        expectedValue.result0,
        testResult,
        "year",
        `query '${expectedValue.searchTerm}'`
      );

      performTruthyCheck(scrapeResult[0], testResult, "imageURL", `query '${expectedValue.searchTerm}'`);
    }
  } catch (error) {
    testResult.status = status.EXCEPTION;
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
  }

  return testResult;
}

async function testIMDBAdvancedTitleSearch() {
  const testResult = {
    name: "IMDB Advanced Title Search",
    functionName: "testIMDBAdvancedTitleSearch",
    status: status.SUCCESS,
    log: [],
  };

  try {
    const expected = [
      {
        title: "FoRReST GuMp",
        titleTypes: [],
        numResults: 32,
        result0: {
          tconst: "tt0109830",
          title: "Forrest Gump",
          year: 1994,
          imageURL:
            "https://m.media-amazon.com/images/M/MV5BNWIwODRlZTUtY2U3ZS00Yzg1LWJhNzYtMmZiYmEyNmU1NjMzXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_.jpg", // only checked for presence
          ageRating: "PG-13",
          runtimeSeconds: 8520,
          genres: "Drama, Romance",
          rating: 8.8,
          numVotes: 1850000,
          runtime: "142 min",
          detailInfo: "PG-13 | 142 min | Drama, Romance",
        },
      },
    ];

    for (let i = 0; i < expected.length; i++) {
      const expectedValue = expected[i];

      const scrapeResult = await imdbScraper.scrapeIMDBAdvancedTitleSearchV3(
        expectedValue.title,
        expectedValue.titleTypes
      );

      if (!scrapeResult) {
        addSubLogEntry(
          testResult,
          `query '${expectedValue.title}' [${expectedValue.titleTypes}] no response`,
          status.ERROR
        );
        return testResult;
      }

      if (scrapeResult.length === 0) {
        addSubLogEntry(
          testResult,
          `query '${expectedValue.title}' [${expectedValue.titleTypes}] results missing`,
          status.ERROR
        );
        return testResult;
      }

      if (scrapeResult.length < expectedValue.numResults) {
        addSubLogEntry(
          testResult,
          `query '${expectedValue.title}' [${expectedValue.titleTypes}] results count mismatch
                      got:      ${scrapeResult.length} entries
                      expected: ${expectedValue.numResults}+ entries`,
          status.WARNING
        );
      }

      performDefaultCheck(
        scrapeResult[0],
        expectedValue.result0,
        testResult,
        "tconst",
        `query '${expectedValue.title}' [${expectedValue.titleTypes}]`
      );
      performDefaultCheck(
        scrapeResult[0],
        expectedValue.result0,
        testResult,
        "title",
        `query '${expectedValue.title}' [${expectedValue.titleTypes}]`
      );
      performTruthyCheck(
        scrapeResult[0],
        testResult,
        "imageURL",
        `query '${expectedValue.title}' [${expectedValue.titleTypes}]`
      );
      performDefaultCheck(
        scrapeResult[0],
        expectedValue.result0,
        testResult,
        "ageRating",
        `query '${expectedValue.title}' [${expectedValue.titleTypes}]`,
        true
      );
      performDefaultCheck(
        scrapeResult[0],
        expectedValue.result0,
        testResult,
        "runtime",
        `query '${expectedValue.title}' [${expectedValue.titleTypes}]`
      );
      performDefaultCheck(
        scrapeResult[0],
        expectedValue.result0,
        testResult,
        "genres",
        `query '${expectedValue.title}' [${expectedValue.titleTypes}]`
      );
      performDefaultCheck(
        scrapeResult[0],
        expectedValue.result0,
        testResult,
        "detailInfo",
        `query '${expectedValue.title}' [${expectedValue.titleTypes}]`
      );
    }
  } catch (error) {
    testResult.status = status.EXCEPTION;
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
  }

  return testResult;
}

async function testIMDBFindPageSearch() {
  const testResult = {
    name: "IMDB Find (vital for detecting the IMDB entry, used with find-imdb-tconst)",
    functionName: "testIMDBFindPageSearch",
    status: status.SUCCESS,
    log: [],
  };

  try {
    const expected = [
      {
        searchTerm: "天気の子",
        type: null,
        numResults: 1,
        result0: {
          tconst: "tt9426210",
          title: "Weathering with You",
          year: 2019,
        },
      },
    ];

    for (let i = 0; i < expected.length; i++) {
      const expectedValue = expected[i];

      const scrapeResult = await imdbScraper.scrapeIMDBFindPageSearchV3(expectedValue.searchTerm, expectedValue.type);

      // logger.log(scrapeResult);

      if (!scrapeResult) {
        addSubLogEntry(
          testResult,
          `query '${expectedValue.searchTerm}' [${expectedValue.type}] no response`,
          status.ERROR
        );
        return testResult;
      }

      if (scrapeResult.length === 0) {
        addSubLogEntry(
          testResult,
          `query '${expectedValue.searchTerm}' [${expectedValue.type}] results missing`,
          status.ERROR
        );
        return testResult;
      }

      if (scrapeResult.length < expectedValue.numResults) {
        addSubLogEntry(
          testResult,
          `query '${expectedValue.searchTerm}' [${expectedValue.type}] results count mismatch
                      got:      ${scrapeResult.length} entries
                      expected: ${expectedValue.numResults}+ entries`,
          status.WARNING
        );
      }

      performDefaultCheck(
        scrapeResult[0],
        expectedValue.result0,
        testResult,
        "tconst",
        `query '${expectedValue.searchTerm}' [${expectedValue.type}]`
      );
      performDefaultCheck(
        scrapeResult[0],
        expectedValue.result0,
        testResult,
        "title",
        `query '${expectedValue.searchTerm}' [${expectedValue.type}]`
      );
      performDefaultCheck(
        scrapeResult[0],
        expectedValue.result0,
        testResult,
        "year",
        `query '${expectedValue.searchTerm}' [${expectedValue.type}]`
      );
      performTruthyCheck(
        scrapeResult[0],
        testResult,
        "imageURL",
        `query '${expectedValue.searchTerm}' [${expectedValue.type}]`
      );
    }
  } catch (error) {
    testResult.status = status.EXCEPTION;
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
  }

  return testResult;
}

/**
 * Check if a value is within a percentage of the expected value
 * @param {number} value
 * @param {number} expected
 * @param {number} epsilon A percentage between 0 and 100
 * @returns
 */
function epsilonCheck(value, expected, epsilon) {
  return value >= expected - (expected * epsilon) / 100 && value <= expected + (expected * epsilon) / 100;
}

async function testIMDBSeriesEpisodes() {
  const testResult = {
    name: "IMDB Series Episodes",
    functionName: "testIMDBSeriesEpisodes",
    status: status.SUCCESS,
    log: [],
  };

  try {
    const expected = [
      {
        name: "Bluey",
        Series_IMDB_tconst: "tt7678620",
        Series_Season: 2,
        numResults: 52,
        result0: {
          tconst: "tt12539144",
          title: "Dance Mode",
          releaseDateYear: 2020,
          releaseDateMonth: 3,
          releaseDateDay: 17,
          rating: 9.1,
          numVotes: 600,
          episode: "1",
          season: "2",
          imageURL:
            "https://m.media-amazon.com/images/M/MV5BNTA2Mzc2ZWUtM2Y1MS00NmI2LThmNWEtYTVhZTY5YTc2YWNhXkEyXkFqcGdeQXVyNTE1NjY5Mg@@._V1_.jpg", // only checked for presence
        },
      },
    ];

    for (let i = 0; i < expected.length; i++) {
      const expectedValue = expected[i];

      const scrapeResult = await imdbScraper.scrapeIMDBSeriesEpisodes(
        expectedValue.Series_IMDB_tconst,
        expectedValue.Series_Season
      );

      logger.log(scrapeResult);

      if (!scrapeResult) {
        addSubLogEntry(
          testResult,
          `query '${expectedValue.name} Season ${expectedValue.Series_Season}' no response`,
          status.ERROR
        );
        return testResult;
      }

      if (scrapeResult.length === 0) {
        addSubLogEntry(
          testResult,
          `query '${expectedValue.name} Season ${expectedValue.Series_Season}' results missing`,
          status.ERROR
        );
        return testResult;
      }

      if (scrapeResult.length !== expectedValue.numResults) {
        addSubLogEntry(
          testResult,
          `query '${expectedValue.name} Season ${expectedValue.Series_Season}' results count mismatch
                      got:      ${scrapeResult.length} episodes
                      expected: ${expectedValue.numResults} episodes`,
          status.WARNING
        );
      }

      performDefaultCheck(
        scrapeResult[0],
        expectedValue.result0,
        testResult,
        "tconst",
        `query '${expectedValue.name} Season ${expectedValue.Series_Season}'`
      );
      performDefaultCheck(
        scrapeResult[0],
        expectedValue.result0,
        testResult,
        "title",
        `query '${expectedValue.name} Season ${expectedValue.Series_Season}'`
      );
      performTruthyCheck(
        scrapeResult[0],
        testResult,
        "imageURL",
        `query '${expectedValue.name} Season ${expectedValue.Series_Season}'`
      );
      performDefaultCheck(
        scrapeResult[0],
        expectedValue.result0,
        testResult,
        "releaseDateYear",
        `query '${expectedValue.name} Season ${expectedValue.Series_Season}'`
      );
      performDefaultCheck(
        scrapeResult[0],
        expectedValue.result0,
        testResult,
        "releaseDateMonth",
        `query '${expectedValue.name} Season ${expectedValue.Series_Season}'`
      );
      performDefaultCheck(
        scrapeResult[0],
        expectedValue.result0,
        testResult,
        "releaseDateDay",
        `query '${expectedValue.name} Season ${expectedValue.Series_Season}'`
      );
      if (!scrapeResult[0].rating) {
        addSubLogEntry(testResult, "rating missing", status.ERROR);
      } else if (!epsilonCheck(scrapeResult[0].rating, expectedValue.result0.rating, 20)) {
        addSubLogEntry(
          testResult,
          `rating unexpected value
      got:      "${scrapeResult[0].rating}"
      expected: ${expectedValue.result0.rating} +/- 20%`,
          status.WARNING
        );
      }

      if (!scrapeResult[0].numVotes) {
        addSubLogEntry(testResult, "numVotes missing", status.ERROR);
      } else if (scrapeResult[0].numVotes < expectedValue.result0.numVotes) {
        addSubLogEntry(
          testResult,
          `numVotes unexpected value
      got:      "${scrapeResult[0].numVotes}"
      expected: > ${expectedValue.result0.numVotes}`,
          status.WARNING
        );
      }
    }
  } catch (error) {
    testResult.status = status.EXCEPTION;
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
  }

  return testResult;
}

async function testIMDBSeriesSeasons() {
  const testResult = {
    name: "IMDB Series Seasons",
    functionName: "testIMDBSeriesSeasons",
    status: status.SUCCESS,
    log: [],
  };

  try {
    const expected = [
      {
        name: "Adventure Time",
        Series_IMDB_tconst: "tt1305826",
        seasons: [
          { season: "1", seasonDisplayText: "Season 1" },
          { season: "2", seasonDisplayText: "Season 2" },
          { season: "3", seasonDisplayText: "Season 3" },
          { season: "4", seasonDisplayText: "Season 4" },
          { season: "5", seasonDisplayText: "Season 5" },
          { season: "6", seasonDisplayText: "Season 6" },
          { season: "7", seasonDisplayText: "Season 7" },
          { season: "8", seasonDisplayText: "Season 8" },
          { season: "9", seasonDisplayText: "Season 9" },
          { season: "10", seasonDisplayText: "Season 10" },
          {
            season: "unknown",
            seasonDisplayText: "Extras / Specials / Unknown",
          },
        ],
      },
    ];

    for (let i = 0; i < expected.length; i++) {
      const expectedValue = expected[i];

      const scrapeResult = await imdbScraper.scrapeIMDBSeriesSeasons(expectedValue.Series_IMDB_tconst);

      logger.log(scrapeResult);

      if (!scrapeResult) {
        addSubLogEntry(testResult, `query '${expectedValue.name} Seasons' no response`, status.ERROR);
        return testResult;
      }

      if (scrapeResult.length === 0) {
        addSubLogEntry(testResult, `query '${expectedValue.name} Seasons' results missing`, status.ERROR);
        return testResult;
      }

      if (scrapeResult.length !== expectedValue.seasons.length) {
        addSubLogEntry(
          testResult,
          `query '${expectedValue.name} Seasons' results count mismatch
                      got:      ${scrapeResult.length} seasons
                      expected: ${expectedValue.seasons.length} seasons`,
          status.WARNING
        );
      }

      performDefaultCheck(
        { seasons: scrapeResult },
        expectedValue,
        testResult,
        "seasons",
        `query '${expectedValue.name} Seasons'`
      );
    }
  } catch (error) {
    testResult.status = status.EXCEPTION;
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
  }

  return testResult;
}

export {
  testIMDBmainPageData,
  testIMDBmainPageData2,
  testIMDBmainPageData3,
  testIMDBmainPageData4,
  testIMDBplotSummary,
  testIMDBreleaseinfo,
  testIMDBtechnicalData,
  testIMDBtechnicalData2,
  testIMDBtechnicalData3,
  testIMDBParentalGuideData,
  testIMDBFullCreditsData,
  testIMDBCompaniesData,
  testIMDBPersonData,
  testIMDBTrailerMediaURLs,
  testIMDBplotKeywords,
  testIMDBFilmingLocations,
  testIMDBRatingDemographics,
  testIMDBSuggestion,
  testIMDBAdvancedTitleSearch,
  testIMDBFindPageSearch,
  testIMDBSeriesEpisodes,
  testIMDBSeriesSeasons,
  status,
};
