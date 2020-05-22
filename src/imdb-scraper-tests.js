const imdbScraper = require("./imdb-scraper");

const status = {
    SUCCESS: 0,
    WARNING: 1,
    ERROR: 2,
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
    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_plotSummary");

    return testResult;
}

async function testIMDBplotSummary() {
    const testResult = {
        name: "IMDB Plot Summary",
        status: status.SUCCESS,
        log: [],
    };

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

    return testResult;
}

async function testIMDBreleaseinfo() {
    const testResult = {
        name: "IMDB Release Info",
        status: status.SUCCESS,
        log: [],
    };

    const expected = {
        $IMDB_originalTitle: "Star Trek: The Next Generation",
        $IMDB_localTitle: "Raumschiff Enterprise: Das nächste Jahrhundert",
        $IMDB_primaryTitle: "Raumschiff Enterprise - Das nächste Jahrhundert",
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
    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_primaryTitle");
    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_startYear");
    performDefaultCheck(scrapeResult, expected, testResult, "$IMDB_endYear");

    return testResult;
}

async function testIMDBtechnicalData() {
    const testResult = {
        name: "IMDB Technical Data",
        status: status.SUCCESS,
        log: [],
    };

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

    async function dbFireProcedureReturnAllCallback() {
        return [{ Country: "DE", Code: "12", Age: 12, id_AgeRating: 1337 }];
    }

    function dbFireProcedureCallback() {
        return;
    }

    function dbFireProcedureReturnScalarCallback() {
        return null;
    }

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
            $IMDB_Top_Directors:
                '[{"category":"Directed by","id":"nm0751577","name":"Anthony Russo","credit":null},{"category":"Directed by","id":"nm0751648","name":"Joe Russo","credit":null}]',
            $IMDB_Top_Writers:
                '[{"category":"Writing Credits","id":"nm1321655","name":"Christopher Markus","credit":"(screenplay by) &"},{"category":"Writing Credits","id":"nm1321656","name":"Stephen McFeely","credit":"(screenplay by)"},{"category":"Writing Credits","id":"nm0498278","name":"Stan Lee","credit":"(based on the Marvel comics by) and"},{"category":"Writing Credits","id":"nm0456158","name":"Jack Kirby","credit":"(based on the Marvel comics by)"},{"category":"Writing Credits","id":"nm0800209","name":"Joe Simon","credit":"(Captain America created by) and"}]',
            $IMDB_Top_Producers: `[{"category":"Produced by","id":"nm0022285","name":"Victoria Alonso","credit":"executive producer"},{"category":"Produced by","id":"nm0068416","name":"Mitchell Bell","credit":"co-producer (as Mitch Bell)"},{"category":"Produced by","id":"nm2753152","name":"Ari Costa","credit":"associate producer"},{"category":"Produced by","id":"nm0195669","name":"Louis D'Esposito","credit":"executive producer"},{"category":"Produced by","id":"nm0269463","name":"Jon Favreau","credit":"executive producer"}]`,
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
            $IMDB_Top_Production_Companies:
                '[{"category":"Production","id":"co0051941","name":"Marvel Studios","role":""}]',
        },

        companies1: {
            category: "Distributors",
            id: "co0242075",
            name: "B&H Film Distribution",
            role: "(2019) (Ukraine) (theatrical)",
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

    return testResult;
}

async function testIMDBPersonData() {
    const testResult = {
        name: "IMDB Person Data",
        status: status.SUCCESS,
        log: [],
    };

    const expected = {
        $IMDB_Person_ID: "nm0001772",
        $Photo_URL: "data/extras/nm0001772_poster.jpg",
        $ShortBio:
            "Sir Patrick Stewart was born in Mirfield, Yorkshire, England, to Gladys (Barrowclough), a textile worker and weaver, and Alfred Stewart, who was in the army. He was a member of various local drama groups from about age 12. He left school at age 15 to work as a junior reporter on a local paper; he quit when his editor told him he was spending too ...  »",
        $LongBio:
            "Sir Patrick Stewart was born in Mirfield, Yorkshire, England, to Gladys (Barrowclough), a textile worker and weaver, and Alfred Stewart, who was in the army. He was a member of various local drama groups from about age 12. He left school at age 15 to work as a junior reporter on a local paper; he quit when his editor told him he was spending too much time at the theatre and not enough working. Stewart spent a year as a furniture salesman, saving cash to attend drama school. He was accepted by Bristol Old Vic Theatre School in 1957. He made his professional debut in 1959 in the repertory theatre in Lincoln; he worked at the Manchester Library Theatre and a tour around the world with the Old Vic Company followed in the early 1960s. Stewart joined the Royal Shakespeare Company in 1966, to begin his 27-year association. Following a spell with the Royal National Theatre in the mid 1980s, he went to Los Angeles, California to star on Raumschiff Enterprise - Das nächste Jahrhundert (1987), which ran from 1987-1994, playing the role of Captain Jean-Luc Picard. After the series ended, Stewart reprised his role for a string of successful Star Trek films: Star Trek: Treffen der Generationen (1994), Star Trek: Der erste Kontakt (1996), Star Trek: Der Aufstand (1998), and Star Trek: Nemesis (2002). Stewart continues to work on the stage and in various films. He was awarded Knight Bachelor of the Order of the British Empire in the 2010 Queen's New Year's Honours List for his services to drama.\n\n\n- IMDb Mini Biography By: International Audience Alliance for Patrick Stewart (IAAPS)",
    };

    async function downloadFileCallback() {
        return true;
    }

    const scrapeResult = await imdbScraper.scrapeIMDBPersonData(
        "nm0001772",
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

    return testResult;
}

async function testIMDBTrailerMediaURLs() {
    // TODO: unfortunately we can't scrape trailer media anymore
    //       i.e. we can't find out the actual .mp4 video source

    const testResult = {
        name: "IMDB Trailer Media URLs",
        status: status.SUCCESS,
        log: [],
    };

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

    return testResult;
}

async function testIMDBplotKeywords() {
    const testResult = {
        name: "IMDB Plot Keywords",
        status: status.SUCCESS,
        log: [],
    };

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

    return testResult;
}

async function testIMDBFilmingLocations() {
    const testResult = {
        name: "IMDB Filming Locations",
        status: status.SUCCESS,
        log: [],
    };

    const expected = {
        locations0: {
            Location: "Durham Cathedral, Durham DH1 3EH, UK",
            Details: "Asgard.",
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

    return testResult;
}

async function testIMDBRatingDemographics() {
    const testResult = {
        name: "IMDB Rating Demographics",
        status: status.SUCCESS,
        log: [],
    };

    const expected = {
        $IMDB_rating_aged_under_18: 8.8,
        $IMDB_numVotes_aged_under_18: 3000,
        $IMDB_rating_aged_18_29: 8.6,
        $IMDB_numVotes_aged_18_29: 170000,
        $IMDB_rating_aged_30_44: 8.3,
        $IMDB_numVotes_aged_30_44: 188000,
        $IMDB_rating_aged_45_plus: 8.1,
        $IMDB_numVotes_aged_45_plus: 43000,
        $IMDB_rating_males: 8.4,
        $IMDB_numVotes_males: 386000,
        $IMDB_rating_males_aged_under_18: 8.6,
        $IMDB_numVotes_males_aged_under_18: 1800,
        $IMDB_rating_males_aged_18_29: 8.5,
        $IMDB_numVotes_males_aged_18_29: 135000,
        $IMDB_rating_males_aged_30_44: 8.2,
        $IMDB_numVotes_males_aged_30_44: 150000,
        $IMDB_rating_males_aged_45_plus: 8.1,
        $IMDB_numVotes_males_aged_45_plus: 35000,
        $IMDB_rating_females: 8.5,
        $IMDB_numVotes_females: 66000,
        $IMDB_rating_females_aged_under_18: 8.7,
        $IMDB_numVotes_females_aged_under_18: 300,
        $IMDB_rating_females_aged_18_29: 8.6,
        $IMDB_numVotes_females_aged_18_29: 25000,
        $IMDB_rating_females_aged_30_44: 8.4,
        $IMDB_numVotes_females_aged_30_44: 24000,
        $IMDB_rating_females_aged_45_plus: 8.5,
        $IMDB_numVotes_females_aged_45_plus: 5000,
        $IMDB_rating_top_1000_voters: 7.8,
        $IMDB_numVotes_top_1000_voters: 600,
        $IMDB_rating_us_users: 8.5,
        $IMDB_numVotes_us_users: 75000,
        $IMDB_rating_non_us_users: 8.2,
        $IMDB_numVotes_non_us_users: 220000,
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

    return testResult;
}

async function testIMDBSearch() {
    const testResult = {
        name: "IMDB Search",
        status: status.SUCCESS,
        log: [],
    };

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

        const scrapeResult = await imdbScraper.scrapeIMDBSearch(
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

    return testResult;
}

async function testIMDBAdvancedTitleSearch() {
    const testResult = {
        name: "IMDB Advanced Title Search",
        status: status.SUCCESS,
        log: [],
    };

    const expected = [
        {
            title: "FoRReST GuMp",
            titleTypes: [],
            numResults: 32,
            result0: {
                tconst: "tt0109830",
                title: " 1.Forrest Gump (1994) ",
                imageURL:
                    "https://m.media-amazon.com/images/M/MV5BNWIwODRlZTUtY2U3ZS00Yzg1LWJhNzYtMmZiYmEyNmU1NjMzXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_UY98_CR0,0,67,98_AL_.jpg",
                ageRating: "12",
                runtime: "142 min",
                genres: "Drama, Romance",
                detailInfo: "12 | 142 min | Drama, Romance",
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
                `query '${expectedValue.title}' [${
                expectedValue.titleTypes
                }] no response`,
                status.ERROR
            );
            return;
        }

        if (scrapeResult.length === 0) {
            addSubLogEntry(
                testResult,
                `query '${expectedValue.title}' [${
                expectedValue.titleTypes
                }] results missing`,
                status.ERROR
            );
            return;
        }

        if (scrapeResult.length < expectedValue.numResults) {
            addSubLogEntry(
                testResult,
                `query '${expectedValue.title}' [${
                expectedValue.titleTypes
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
    testIMDBSearch,
    testIMDBAdvancedTitleSearch,
}