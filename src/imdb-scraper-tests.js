const imdbScraper = require("./imdb-scraper");

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

/*
 * Perform a default check: the item must be truthy and equal to the expected value
 */
function performDefaultCheck(
  scrapeResult,
  expected,
  testResult,
  fieldName,
  msgPrefix,
  allowFalsy
) {
  if (!allowFalsy && !scrapeResult[fieldName]) {
    addSubLogEntry(
      testResult,
      `${msgPrefix ? msgPrefix + " " : ""}${fieldName} missing`,
      status.ERROR
    );
  } else if (
    JSON.stringify(scrapeResult[fieldName]) !==
    JSON.stringify(expected[fieldName])
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
  const testResult = {
    name: "IMDB Main Page Data",
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

    performDefaultCheck(
      scrapeResult,
      expected,
      testResult,
      "$IMDB_releaseType"
    );
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

    performDefaultCheck(
      scrapeResult,
      expected,
      testResult,
      "$IMDB_metacriticScore"
    );
    performDefaultCheck(
      scrapeResult,
      expected,
      testResult,
      "$IMDB_posterSmall_URL"
    );
    performDefaultCheck(
      scrapeResult,
      expected,
      testResult,
      "$IMDB_posterLarge_URL"
    );
    performDefaultCheck(
      scrapeResult,
      expected,
      testResult,
      "$IMDB_plotSummary"
    );
  } catch (error) {
    testResult.status = status.EXCEPTION;
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, null, 2)}`);
  }

  return testResult;
}

async function testIMDBplotSummary() {
  const testResult = {
    name: "IMDB Plot Summary",
    status: status.SUCCESS,
    log: [],
  };

  try {
    const expected = {
      $IMDB_plotSummaryFull:
        "After the devastating events of Avengers: Infinity War (2018), the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos' actions and restore balance to the universe.",
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

    performDefaultCheck(
      scrapeResult,
      expected,
      testResult,
      "$IMDB_plotSummaryFull"
    );
  } catch (error) {
    testResult.status = status.EXCEPTION;
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, null, 2)}`);
  }

  return testResult;
}

async function testIMDBreleaseinfo() {
  const testResult = {
    name: "IMDB Release Info",
    status: status.SUCCESS,
    log: [],
  };

  try {
    const expected = {
      $IMDB_originalTitle: "Star Trek: The Next Generation",
      $IMDB_localTitle: "Raumschiff Enterprise: Das nächste Jahrhundert",
      $IMDB_primaryTitle: "Star Trek: The Next Generation",
      $IMDB_startYear: "1987",
      $IMDB_endYear: "1994",
    };

    const movie = {
      IMDB_tconst: "tt0092455",
    };

    const scrapeResult = await imdbScraper.scrapeIMDBreleaseinfo(
      movie,
      [{ name: "Germany" }],
      []
    );

    if (!scrapeResult) {
      addSubLogEntry(testResult, "no response", status.ERROR);
      return;
    }

    performDefaultCheck(
      scrapeResult,
      expected,
      testResult,
      "$IMDB_originalTitle"
    );
    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_localTitle");
    performDefaultCheck(
      scrapeResult,
      expected,
      testResult,
      "$IMDB_primaryTitle"
    );
    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_startYear");
    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_endYear");
  } catch (error) {
    testResult.status = status.EXCEPTION;
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, null, 2)}`);
  }

  return testResult;
}

async function testIMDBtechnicalData() {
  const testResult = {
    name: "IMDB Technical Data",
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
      return;
    }

    performDefaultCheck(
      scrapeResult,
      expected,
      testResult,
      "$IMDB_runtimeMinutes"
    );
  } catch (error) {
    testResult.status = status.EXCEPTION;
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, null, 2)}`);
  }

  return testResult;
}

async function testIMDBParentalGuideData() {
  const testResult = {
    name: "IMDB Parental Guide Data",
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
      $IMDB_MinAge: 7,
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
      return;
    }

    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_MinAge");
    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_MaxAge");
    performDefaultCheck(
      scrapeResult,
      expected,
      testResult,
      "$IMDB_id_AgeRating_Chosen_Country"
    );

    if (isNaN(scrapeResult.$IMDB_Parental_Advisory_Nudity)) {
      addSubLogEntry(
        testResult,
        "$IMDB_Parental_Advisory_Nudity missing",
        status.ERROR
      );
    } else if (
      scrapeResult.$IMDB_Parental_Advisory_Nudity !==
      expected.$IMDB_Parental_Advisory_Nudity
    ) {
      addSubLogEntry(
        testResult,
        `$IMDB_Parental_Advisory_Nudity mismatch
    got:      "${scrapeResult.$IMDB_Parental_Advisory_Nudity}"
    expected: "${expected.$IMDB_Parental_Advisory_Nudity}"`,
        status.WARNING
      );
    }

    performDefaultCheck(
      scrapeResult,
      expected,
      testResult,
      "$IMDB_Parental_Advisory_Violence"
    );
    performDefaultCheck(
      scrapeResult,
      expected,
      testResult,
      "$IMDB_Parental_Advisory_Profanity"
    );
    performDefaultCheck(
      scrapeResult,
      expected,
      testResult,
      "$IMDB_Parental_Advisory_Alcohol"
    );
    performDefaultCheck(
      scrapeResult,
      expected,
      testResult,
      "$IMDB_Parental_Advisory_Frightening"
    );
  } catch (error) {
    testResult.status = status.EXCEPTION;
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, null, 2)}`);
  }

  return testResult;
}

async function testIMDBFullCreditsData() {
  const testResult = {
    name: "IMDB Full Credits Data",
    status: status.SUCCESS,
    log: [],
  };

  try {
    const expected = {
      topCredits: {
        $IMDB_Top_Directors: "[{\"category\":\"Directed by\",\"id\":\"nm0751577\",\"name\":\"Anthony Russo\",\"credit\":null},{\"category\":\"Directed by\",\"id\":\"nm0751648\",\"name\":\"Joe Russo\",\"credit\":null}]",
        $IMDB_Top_Writers: "[{\"category\":\"Writing Credits\",\"id\":\"nm1321655\",\"name\":\"Christopher Markus\",\"credit\":\"(screenplay by) &\"},{\"category\":\"Writing Credits\",\"id\":\"nm1321656\",\"name\":\"Stephen McFeely\",\"credit\":\"(screenplay by)\"},{\"category\":\"Writing Credits\",\"id\":\"nm0498278\",\"name\":\"Stan Lee\",\"credit\":\"(based on the Marvel comics by) and\"},{\"category\":\"Writing Credits\",\"id\":\"nm0456158\",\"name\":\"Jack Kirby\",\"credit\":\"(based on the Marvel comics by)\"},{\"category\":\"Writing Credits\",\"id\":\"nm0800209\",\"name\":\"Joe Simon\",\"credit\":\"(Captain America created by) and\"}]",
        $IMDB_Top_Producers: "[{\"category\":\"Produced by\",\"id\":\"nm0022285\",\"name\":\"Victoria Alonso\",\"credit\":\"executive producer\"},{\"category\":\"Produced by\",\"id\":\"nm0068416\",\"name\":\"Mitchell Bell\",\"credit\":\"co-producer (as Mitch Bell)\"},{\"category\":\"Produced by\",\"id\":\"nm2753152\",\"name\":\"Ari Costa\",\"credit\":\"associate producer\"},{\"category\":\"Produced by\",\"id\":\"nm0195669\",\"name\":\"Louis D'Esposito\",\"credit\":\"executive producer\"},{\"category\":\"Produced by\",\"id\":\"nm0269463\",\"name\":\"Jon Favreau\",\"credit\":\"executive producer\"}]",
        $IMDB_Top_Cast: "[{\"category\":\"Cast\",\"id\":\"nm0000375\",\"name\":\"Robert Downey Jr.\",\"credit\":\"Tony Stark / Iron Man\"},{\"category\":\"Cast\",\"id\":\"nm0262635\",\"name\":\"Chris Evans\",\"credit\":\"Steve Rogers / Captain America\"},{\"category\":\"Cast\",\"id\":\"nm0749263\",\"name\":\"Mark Ruffalo\",\"credit\":\"Bruce Banner / Hulk\"},{\"category\":\"Cast\",\"id\":\"nm1165110\",\"name\":\"Chris Hemsworth\",\"credit\":\"Thor\"},{\"category\":\"Cast\",\"id\":\"nm0424060\",\"name\":\"Scarlett Johansson\",\"credit\":\"Natasha Romanoff / Black Widow\"}]"
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
      return;
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

      if (
        JSON.stringify(scrapeResult.credits[0]) !==
        JSON.stringify(expected.credits0)
      ) {
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
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, null, 2)}`);
  }

  return testResult;
}

async function testIMDBCompaniesData() {
  const testResult = {
    name: "IMDB Companies Data",
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

    const scrapeResult = await imdbScraper.scrapeIMDBCompaniesData(movie);

    if (!scrapeResult) {
      addSubLogEntry(testResult, "no response", status.ERROR);
      return;
    }

    performDefaultCheck(
      scrapeResult,
      expected,
      testResult,
      "topProductionCompanies"
    );

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

      if (
        JSON.stringify(scrapeResult.companies[1]) !==
        JSON.stringify(expected.companies1)
      ) {
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
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, null, 2)}`);
  }

  return testResult;
}

async function testIMDBPersonData() {
  const testResult = {
    name: "IMDB Person Data",
    status: status.SUCCESS,
    log: [],
  };

  // Mock Functions
  async function downloadFileCallback() {
    return true;
  }

  try {
    const expected = {
      $IMDB_Person_ID: "nm0000122",
      $Photo_URL: "extras/nm0000122_poster.jpg",
      $ShortBio:
        "Considered to be one of the most pivotal stars of the early days of Hollywood, Charlie Chaplin lived an interesting life both in his films and behind the camera. He is most recognized as an icon of the silent film era, often associated with his popular character, the Little Tramp; the man with the toothbrush mustache, bowler hat, bamboo cane, and ...  »",
      $LongBio:
        "Considered to be one of the most pivotal stars of the early days of Hollywood, Charlie Chaplin lived an interesting life both in his films and behind the camera. He is most recognized as an icon of the silent film era, often associated with his popular character, the Little Tramp; the man with the toothbrush mustache, bowler hat, bamboo cane, and a funny walk.\n\nCharles Spencer Chaplin was born in Walworth, London, England on April 16, 1889, to Hannah Harriet Pedlingham (Hill) and Charles Chaplin, both music hall performers, who were married on June 22, 1885. After Charles Sr. separated from Hannah to perform in New York City, Hannah then tried to resurrect her stage career. Unfortunately, her singing voice had a tendency to break at unexpected moments. When this happened, the stage manager spotted young Charlie standing in the wings and led him on stage, where five-year-old Charlie began to sing a popular tune. Charlie and his half-brother, Syd Chaplin spent their lives in and out of charity homes and workhouses between their mother's bouts of insanity. Hannah was committed to Cane Hill Asylum in May 1903 and lived there until 1921, when Chaplin moved her to California.\n\nChaplin began his official acting career at the age of eight, touring with the Eight Lancashire Lads. At age 18, he began touring with Fred Karno's vaudeville troupe, joining them on the troupe's 1910 United States tour. He traveled west to California in December 1913 and signed on with Keystone Studios' popular comedy director Mack Sennett, who had seen Chaplin perform on stage in New York. Charlie soon wrote his brother Syd, asking him to become his manager. While at Keystone, Chaplin appeared in and directed 35 films, starring as the Little Tramp in nearly all.\n\nIn November 1914, he left Keystone and signed on at Essanay, where he made 15 films. In 1916, he signed on at Mutual and made 12 films. In June 1917, Chaplin signed up with First National Studios, after which he built Chaplin Studios. In 1919, he and Douglas Fairbanks, Mary Pickford and D.W. Griffith formed United Artists (UA).\n\nChaplin's life and career was full of scandal and controversy. His first big scandal was during World War I, during which time his loyalty to England, his home country, was questioned. He had never applied for American citizenship, but claimed that he was a \"paying visitor\" to the United States. Many British citizens called Chaplin a coward and a slacker. This and his other career eccentricities sparked suspicion with FBI chief J. Edgar Hoover and the House Un-American Activities Committee (HUAC), who believed that he was injecting Communist propaganda into his films. Chaplin's later film The Great Dictator (1940), which was his first \"talkie\", also created a stir. In the film, Chaplin plays a humorous caricature of Adolf Hitler. Some thought the film was poorly done and in bad taste. However, the film grossed over $5 million and earned five Academy Award Nominations.\n\nAnother scandal occurred when Chaplin briefly dated 22-year-old Joan Barry. However, Chaplin's relationship with Barry came to an end in 1942, after a series of harassing actions from her. In May 1943, Barry returned to inform Chaplin that she was pregnant and filed a paternity suit, claiming that the unborn child was his. During the 1944 trial, blood tests proved that Chaplin was not the father, but at the time, blood tests were inadmissible evidence and he was ordered to pay $75 a week until the child turned 21.\n\nChaplin was also scrutinized for his support in aiding the Russian struggle against the invading Nazis during World War II, and the United States government questioned his moral and political views, suspecting him of having Communist ties. For this reason, HUAC subpoenaed him in 1947. However, HUAC finally decided that it was no longer necessary for him to appear for testimony. Conversely, when Chaplin and his family traveled to London for the premier of Limelight (1952), he was denied re-entry to the United States. In reality, the government had almost no evidence to prove that he was a threat to national security. Instead, he and his wife decided to settle in Switzerland.\n\nChaplin was married four times and had a total of 11 children. In 1918, he married Mildred Harris and they had a son together, Norman Spencer Chaplin, who only lived three days. Chaplin and Mildred were divorced in 1920. He married Lita Grey in 1924, who had two sons, Charles Chaplin Jr. and Sydney Chaplin. They were divorced in 1927. In 1936, Chaplin married Paulette Goddard and his final marriage was to Oona O'Neill (Oona Chaplin), daughter of playwright Eugene O'Neill in 1943. Oona gave birth to eight children: Geraldine Chaplin, Michael Chaplin, Josephine Chaplin, Victoria Chaplin, Eugene Chaplin, Jane Chaplin, Annette-Emilie Chaplin and Christopher Chaplin.\n\nIn contrast to many of his boisterous characters, Chaplin was a quiet man who kept to himself a great deal. He also had an \"un-millionaire\" way of living. Even after he had accumulated millions, he continued to live in shabby accommodations. In 1921, Chaplin was decorated by the French government for his outstanding work as a filmmaker, and was elevated to the rank of Officer of the Legion of Honor in 1952. In 1972, he was honored with an Academy Award for his \"incalculable effect in making motion pictures the art form of the century.\" He was appointed Knight Commander of the Order of the British Empire in the 1975 New Years Honours List. No formal reason for the honour was listed. The citation simply reads \"Charles Spencer Chaplin, Film Actor and Producer\".\n\nChaplin's other works included musical scores he composed for many of his films. He also authored two autobiographical books, \"My Autobiography\" (1964) and its companion volume, \"My Life in Pictures\" (1974).\n\nChaplin died at age 88 of natural causes on December 25, 1977 at his home in Vevey, Switzerland. His funeral was a small and private Anglican ceremony according to his wishes. In 1978, Chaplin's corpse was stolen from its grave and was not recovered for three months; he was re-buried in a vault surrounded by cement.\n\nSix of Chaplin's films have been selected for preservation in the National Film Registry by the United States Library of Congress: The Immigrant (1917), The Kid (1921) , The Gold Rush (1925), City Lights (1931), Modern Times (1936) and The Great Dictator (1940).\n\nCharlie Chaplin was considered one of the greatest filmmakers in the history of American cinema, whose movies were and still are popular throughout the world, and have even gained notoriety as time progresses. His films show, through the Little Tramp's positive outlook on life in a world full of chaos, that the human spirit has and always will remain the same.\n\n\n- IMDb Mini Biography By: Ed Stephan <stephan@cc.wwu.edu>",
    };

    const scrapeResult = await imdbScraper.scrapeIMDBPersonData(
      "nm0000122",
      downloadFileCallback
    );

    if (!scrapeResult) {
      addSubLogEntry(testResult, "no response", status.ERROR);
      return;
    }

    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_Person_ID");
    performDefaultCheck(scrapeResult, expected, testResult, "$Photo_URL");
    performDefaultCheck(scrapeResult, expected, testResult, "$ShortBio");
    performDefaultCheck(scrapeResult, expected, testResult, "$LongBio");
  } catch (error) {
    testResult.status = status.EXCEPTION;
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, null, 2)}`);
  }

  return testResult;
}

async function testIMDBTrailerMediaURLs() {
  // NOTE: unfortunately we can't scrape trailer media anymore
  //       i.e. we can't find out the actual .mp4 video source

  const testResult = {
    name: "IMDB Trailer Media URLs",
    status: status.SUCCESS,
    log: [],
  };

  try {
    // const expected = {
    //     mediaURLs: [],
    //     slateURL: null,
    // };

    const scrapeResult = await imdbScraper.scrapeIMDBTrailerMediaURLs(
      "https://www.imdb.com/video/imdb/vi2163260441"
    );

    if (!scrapeResult) {
      addSubLogEntry(testResult, "no response", status.ERROR);
      return;
    }

    if (!scrapeResult.mediaURLs) {
      addSubLogEntry(testResult, "mediaURLs missing", status.ERROR);
    } else if (scrapeResult.mediaURLs.length !== 0) {
      addSubLogEntry(
        testResult,
        `mediaURLs count mismatch
          got:      ${scrapeResult.mediaURLs.length} entries
          expected: 0 entries`,
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
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, null, 2)}`);
  }

  return testResult;
}

async function testIMDBplotKeywords() {
  const testResult = {
    name: "IMDB Plot Keywords",
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

    const scrapeResult = await imdbScraper.scrapeIMDBplotKeywords(movie);

    if (!scrapeResult) {
      addSubLogEntry(testResult, "no response", status.ERROR);
      return;
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
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, null, 2)}`);
  }

  return testResult;
}

async function testIMDBFilmingLocations() {
  const testResult = {
    name: "IMDB Filming Locations",
    status: status.SUCCESS,
    log: [],
  };

  try {
    const expected = {
      locations0: {
        Location: "Durham Cathedral, The College, Durham, County Durham, England, UK",
        Details: "Thor Meets His Mother In Asgard",
        NumInteresting: 68,
        NumVotes: 68,
      },
    };

    const movie = {
      IMDB_tconst: "tt4154796",
    };

    const scrapeResult = await imdbScraper.scrapeIMDBFilmingLocations(movie);

    if (!scrapeResult) {
      addSubLogEntry(testResult, "no response", status.ERROR);
      return;
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
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, null, 2)}`);
  }

  return testResult;
}

async function testIMDBRatingDemographics() {
  const testResult = {
    name: "IMDB Rating Demographics",
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

    const scrapeResult = await imdbScraper.scrapeIMDBRatingDemographics(
      movie,
      async () => {
        return true;
      }
    );

    if (!scrapeResult) {
      addSubLogEntry(testResult, "no response", status.ERROR);
      return;
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
        if (
          scrapeValue < expectedValue - 0.5 ||
          scrapeValue > expectedValue + 0.5
        ) {
          addSubLogEntry(
            testResult,
            `${key} mismatch
                  got:      ${scrapeValue}
                  expected: ${expectedValue - 0.5}-${expectedValue + 0.5}`,
            status.WARNING
          );
        }
      }
    });
  } catch (error) {
    testResult.status = status.EXCEPTION;
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, null, 2)}`);
  }

  return testResult;
}

async function testIMDBSuggestion() {
  const testResult = {
    name: "IMDB Search",
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
            "https://m.media-amazon.com/images/M/MV5BNWIwODRlZTUtY2U3ZS00Yzg1LWJhNzYtMmZiYmEyNmU1NjMzXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_.jpg",
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

      const scrapeResult = await imdbScraper.scrapeIMDBSuggestion(
        expectedValue.searchTerm
      );

      // console.log(scrapeResult);

      if (!scrapeResult) {
        addSubLogEntry(
          testResult,
          `query '${expectedValue.searchTerm}' no response`,
          status.ERROR
        );
        return;
      }

      if (scrapeResult.length === 0) {
        addSubLogEntry(
          testResult,
          `query '${expectedValue.searchTerm}' results missing`,
          status.ERROR
        );
        return;
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
      performDefaultCheck(
        scrapeResult[0],
        expectedValue.result0,
        testResult,
        "imageURL",
        `query '${expectedValue.searchTerm}'`
      );
    }
  } catch (error) {
    testResult.status = status.EXCEPTION;
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, null, 2)}`);
  }

  return testResult;
}

async function testIMDBAdvancedTitleSearch() {
  const testResult = {
    name: "IMDB Advanced Title Search",
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
          title: "Forrest Gump (1994) ",
          imageURL:
            "https://m.media-amazon.com/images/M/MV5BNWIwODRlZTUtY2U3ZS00Yzg1LWJhNzYtMmZiYmEyNmU1NjMzXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_UY98_CR0,0,67,98_AL_.jpg",
          ageRating: "PG-13",
          runtime: "142 min",
          genres: "Drama, Romance",
          detailInfo: "PG-13 | 142 min | Drama, Romance",
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

      const scrapeResult = await imdbScraper.scrapeIMDBAdvancedTitleSearch(
        expectedValue.title,
        expectedValue.titleTypes
      );

      // console.log(scrapeResult);

      if (!scrapeResult) {
        addSubLogEntry(
          testResult,
          `query '${expectedValue.title}' [${expectedValue.titleTypes
          }] no response`,
          status.ERROR
        );
        return;
      }

      if (scrapeResult.length === 0) {
        addSubLogEntry(
          testResult,
          `query '${expectedValue.title}' [${expectedValue.titleTypes
          }] results missing`,
          status.ERROR
        );
        return;
      }

      if (scrapeResult.length < expectedValue.numResults) {
        addSubLogEntry(
          testResult,
          `query '${expectedValue.title}' [${expectedValue.titleTypes
          }] results count mismatch
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
      performDefaultCheck(
        scrapeResult[0],
        expectedValue.result0,
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
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, null, 2)}`);
  }

  return testResult;
}

async function testIMDBFind() {
  const testResult = {
    name: "IMDB Find",
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
          id: "tt9426210",
          type: "title",
          resultText:
            'Weathering with You (2019) aka "天気の子"',
          imageURL:
            "https://m.media-amazon.com/images/M/MV5BNzE4ZDEzOGUtYWFjNC00ODczLTljOGQtZGNjNzhjNjdjNjgzXkEyXkFqcGdeQXVyNzE5ODMwNzI@._V1_UX32_CR0,0,32,44_AL_.jpg",
        },
      },
    ];

    for (let i = 0; i < expected.length; i++) {
      const expectedValue = expected[i];

      const scrapeResult = await imdbScraper.scrapeIMDBFind(
        expectedValue.searchTerm,
        expectedValue.type
      );

      // console.log(scrapeResult);

      if (!scrapeResult) {
        addSubLogEntry(
          testResult,
          `query '${expectedValue.searchTerm}' [${expectedValue.type
          }] no response`,
          status.ERROR
        );
        return;
      }

      if (scrapeResult.length === 0) {
        addSubLogEntry(
          testResult,
          `query '${expectedValue.searchTerm}' [${expectedValue.type
          }] results missing`,
          status.ERROR
        );
        return;
      }

      if (scrapeResult.length < expectedValue.numResults) {
        addSubLogEntry(
          testResult,
          `query '${expectedValue.searchTerm}' [${expectedValue.type
          }] results count mismatch
                      got:      ${scrapeResult.length} entries
                      expected: ${expectedValue.numResults}+ entries`,
          status.WARNING
        );
      }

      performDefaultCheck(
        scrapeResult[0],
        expectedValue.result0,
        testResult,
        "id",
        `query '${expectedValue.searchTerm}' [${expectedValue.type}]`
      );
      performDefaultCheck(
        scrapeResult[0],
        expectedValue.result0,
        testResult,
        "type",
        `query '${expectedValue.searchTerm}' [${expectedValue.type}]`
      );
      performDefaultCheck(
        scrapeResult[0],
        expectedValue.result0,
        testResult,
        "resultText",
        `query '${expectedValue.searchTerm}' [${expectedValue.type}]`
      );
      performDefaultCheck(
        scrapeResult[0],
        expectedValue.result0,
        testResult,
        "imageURL",
        `query '${expectedValue.searchTerm}' [${expectedValue.type}]`
      );
    }
  } catch (error) {
    testResult.status = status.EXCEPTION;
    testResult.log.push(`EXCEPTION: ${JSON.stringify(error, null, 2)}`);
  }

  return testResult;
}

export {
  testIMDBmainPageData,
  testIMDBplotSummary,
  testIMDBreleaseinfo,
  testIMDBtechnicalData,
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
  testIMDBFind,
  status,
};
