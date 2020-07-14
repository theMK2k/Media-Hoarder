import Vue from "vue";
// const logger = require("loglevel");
// const moment = require("moment");

const imdbScraperTests = require("./imdb-scraper-tests");

const shared = new Vue({
  data: {
    sidenav: null,
    searchText: null,
    filterSourcePaths: [],
    filterGenres: [],
    filterSettings: {
      filterGenresAND: false,
      filterPersonsAND: false,
      filterCompaniesAND: false,
      filterIMDBPlotKeywordsAND: false,
      filterIMDBFilmingLocationsAND: false,
    },
    filterAgeRatings: [],
    filterRatings: [],
    filterLists: [],
    filterParentalAdvisory: {
      Nudity: [],
      Violence: [],
      Profanity: [],
      Alcohol: [],
      Frightening: [],
    },
    filterPersons: [],
    filterYears: [],
    filterQualities: [],
    filterCompanies: [],
    filterAudioLanguages: [],
    filterSubtitleLanguages: [],

    filterMetacriticScore: [0, 100],
    filterMetacriticScoreNone: true,

    filterIMDBRating: [0, 10],
    filterIMDBRatingNone: true,

    filterIMDBPlotKeywords: [],

    filterIMDBFilmingLocations: [],

    contentAdvisoryCategories: [
      {
        Name: "Nudity",
        DisplayText: "Sex & Nudity",
      },
      {
        Name: "Violence",
        DisplayText: "Violence & Gore",
      },
      {
        Name: "Profanity",
        DisplayText: "Profanity",
      },
      {
        Name: "Alcohol",
        DisplayText: "Alcohol, Drugs & Smoking",
      },
      {
        Name: "Frightening",
        DisplayText: "Frightening & Intense Scenes",
      },
    ],

    sortField: null,

    currentPage: 1,

    duplicatesHandling: {
      actualDuplicate: {
        relinkIMDB: true,
        addToList: true,
        updateTitle: true,
        updateSubTitle: true,
        updateRating: true,
        updateLastAccess: true,
      },
      metaDuplicate: {
        addToList: true,
        updateRating: true,
      },
    },

    currentLocale: null,
    fallbackRegion: null,
    regions: [],
    imdbTitleTypesWhitelist: [],
    fallbackLanguage: null,
    languagesPrimaryTitle: [],
    languagesAudioSubtitles: [],
    imdbRatingDemographics: [
      {
        code: "",
        short: null,
        long: "All",
      },
      {
        code: "aged_under_18",
        short: "⚧<18",
        long: "Aged under 18",
      },
      {
        code: "aged_18_29",
        short: "⚧<30",
        long: "Aged 18-29",
      },
      {
        code: "aged_30_44",
        short: "⚧<45",
        long: "Aged 30-44",
      },
      {
        code: "aged_45_plus",
        short: "⚧45+",
        long: "Aged 45+",
      },
      {
        code: "females",
        short: "♀",
        long: "Females",
      },
      {
        code: "females_aged_under_18",
        short: "♀<18",
        long: "Females aged under 18",
      },
      {
        code: "females_aged_18_29",
        short: "♀<30",
        long: "Females aged 18-29",
      },
      {
        code: "females_aged_30_44",
        short: "♀<45",
        long: "Females aged 30-44",
      },
      {
        code: "females_aged_45_plus",
        short: "♀45+",
        long: "Females aged 45+",
      },
      {
        code: "males",
        short: "♂",
        long: "Males",
      },
      {
        code: "males_aged_under_18",
        short: "♂<18",
        long: "Males aged under 18",
      },
      {
        code: "males_aged_18_29",
        short: "♂<30",
        long: "Males aged 18-29",
      },
      {
        code: "males_aged_30_44",
        short: "♂<45",
        long: "Males aged 30-44",
      },
      {
        code: "males_aged_45_plus",
        short: "♂45+",
        long: "Males aged 45+",
      },
      {
        code: "top_1000_voters",
        short: "🎩",
        long: "Top 1000 voters",
      },
      {
        code: "non_us_users",
        short: "non-US",
        long: "Non-US users",
      },
      {
        code: "us_users",
        short: "US",
        long: "US users",
      },
    ],
    imdbRatingDemographic: "",

    scanOptions: {
      filescanMovies: true,
      // filescanMovies_id_SourcePaths_IN: '(5, 10)',											// only scan certain SourcePaths

      rescanMoviesMetaData: true,

      // rescanMoviesMetaData_id_SourcePaths_IN: '(5, 10)',								// only rescan metadata in certain SourcePaths
      // rescanMoviesMetaData_id_Movies: 23,																	// only rescan a certain movie
      // rescanMoviesMetaData_maxEntries: 10,

      rescanMoviesMetaData_applyMediaInfo: true,
      rescanMoviesMetaData_findIMDBtconst: true,
      // rescanMoviesMetaData_findIMDBtconst_ignore_tconst_in_filename: true,				// ignore tconst contained in filename, instead perform IMDB search (and match against tconst contained in filename)

      rescanMoviesMetaData_fetchIMDBMetaData: true,
      rescanMoviesMetaData_fetchIMDBMetaData_mainPageData: true,
      rescanMoviesMetaData_fetchIMDBMetaData_ratingDemographics: true,
      rescanMoviesMetaData_fetchIMDBMetaData_plotSummary: true,
      rescanMoviesMetaData_fetchIMDBMetaData_plotKeywords: true,
      rescanMoviesMetaData_fetchIMDBMetaData_releaseinfo: true,
      rescanMoviesMetaData_fetchIMDBMetaData_technicalData: true,
      rescanMoviesMetaData_fetchIMDBMetaData_parentalguideData: true,
      rescanMoviesMetaData_fetchIMDBMetaData_creditsData: true,
      rescanMoviesMetaData_fetchIMDBMetaData_companiesData: true,
      rescanMoviesMetaData_fetchIMDBMetaData_filmingLocations: true,
      rescanMoviesMetaData_saveIMDBData: true,

      applyMetaData: true,

      mergeExtras: true,

      handleDuplicates: true,
    },

    userScanOptions: [
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_mainPageData",
        deleted: false,
        description:
          "Main Page (Genres, Rating/Votes, Metacritic Score, Poster, Plot Summary, Trailer URL)",
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_ratingDemographics",
        deleted: false,
        description:
          "Ratings (Rating by Demographics, e.g. Ages, Male/Female, US/Non-US)",
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_plotSummary",
        deleted: false,
        description:
          "Full Plot Summary (Main Page only contains an extract of the full summary)",
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_plotKeywords",
        deleted: false,
        description: "Plot Keywords",
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_releaseinfo",
        deleted: false,
        description:
          "Release Info (Title, Localized Title, Original Title, Year)",
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_technicalData",
        deleted: false,
        description: "Technical Data (Runtime)",
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_parentalguideData",
        deleted: false,
        description:
          "Parental Guide (Age Rating, Levels of: Nudity, Violence, Profanity, Alcohol & Drugs, Frightening Scenes)",
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_creditsData",
        deleted: false,
        description: "Credits",
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_companiesData",
        deleted: false,
        description: "Companies",
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_filmingLocations",
        deleted: false,
        description: "Filming Locations",
      },
    ],

    imdbScraperChecks: [
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_mainPageData",
        description:
          "Main Page (Genres, Rating/Votes, Metacritic Score, Poster, Plot Summary, Trailer URL)",
        enabled: true,
        checkFunction: imdbScraperTests.testIMDBmainPageData,
        icon: null,
        color: null,
        isRunning: false,
        result: null,
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_ratingDemographics",
        description:
          "Ratings (Rating by Demographics, e.g. Ages, Male/Female, US/Non-US)",
        enabled: true,
        checkFunction: imdbScraperTests.testIMDBRatingDemographics,
        icon: null,
        color: null,
        isRunning: false,
        result: null,
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_plotSummary",
        description:
          "Full Plot Summary (Main Page only contains an extract of the full summary)",
        enabled: true,
        checkFunction: imdbScraperTests.testIMDBplotSummary,
        icon: null,
        color: null,
        isRunning: false,
        result: null,
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_plotKeywords",
        description: "Plot Keywords",
        enabled: true,
        checkFunction: imdbScraperTests.testIMDBplotKeywords,
        icon: null,
        color: null,
        isRunning: false,
        result: null,
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_releaseinfo",
        description:
          "Release Info (Title, Localized Title, Original Title, Year)",
        enabled: true,
        checkFunction: imdbScraperTests.testIMDBreleaseinfo,
        icon: null,
        color: null,
        isRunning: false,
        result: null,
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_technicalData",
        description: "Technical Data (Runtime)",
        enabled: true,
        checkFunction: imdbScraperTests.testIMDBtechnicalData,
        icon: null,
        color: null,
        isRunning: false,
        result: null,
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_parentalguideData",
        description:
          "Parental Guide (Age Rating, Levels of: Nudity, Violence, Profanity, Alcohol & Drugs, Frightening Scenes)",
        enabled: true,
        checkFunction: imdbScraperTests.testIMDBParentalGuideData,
        icon: null,
        color: null,
        isRunning: false,
        result: null,
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_creditsData",
        description: "Credits",
        enabled: true,
        checkFunction: imdbScraperTests.testIMDBFullCreditsData,
        icon: null,
        color: null,
        isRunning: false,
        result: null,
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_companiesData",
        description: "Companies",
        enabled: true,
        checkFunction: imdbScraperTests.testIMDBCompaniesData,
        icon: null,
        color: null,
        isRunning: false,
        result: null,
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_filmingLocations",
        description: "Filming Locations",
        enabled: true,
        checkFunction: imdbScraperTests.testIMDBFilmingLocations,
        icon: null,
        color: null,
        isRunning: false,
        result: null,
      },
      {
        key: "adhoc_PersonData",
        description: "Person Data (Ad-Hoc)",
        enabled: true,
        checkFunction: imdbScraperTests.testIMDBPersonData,
        icon: null,
        color: null,
        isRunning: false,
        result: null,
      },
      {
        key: "adhoc_TrailerMediaURLs",
        description: "Trailer Media URLs (Ad-Hoc)",
        enabled: true,
        checkFunction: imdbScraperTests.testIMDBTrailerMediaURLs,
        icon: null,
        color: null,
        isRunning: false,
        result: null,
      },
      {
        key: "adhoc_Suggestion",
        description: "Suggestion Search (Ad-Hoc)",
        enabled: true,
        checkFunction: imdbScraperTests.testIMDBSuggestion,
        icon: null,
        color: null,
        isRunning: false,
        result: null,
      },
      {
        key: "adhoc_AdvancedTitleSearch",
        description: "Advanced Title Search (Ad-Hoc)",
        enabled: true,
        checkFunction: imdbScraperTests.testIMDBAdvancedTitleSearch,
        icon: null,
        color: null,
        isRunning: false,
        result: null,
      },
      {
        key: "adhoc_FindSearch",
        description: "Find (Ad-Hoc)",
        enabled: true,
        checkFunction: imdbScraperTests.testIMDBFind,
        icon: null,
        color: null,
        isRunning: false,
        result: null,
      },
    ],

    supportedLanguages: [
      {
        code: "en",
        name: "English",
      },
      {
        code: "de",
        name: "Deutsch",
      },
    ],

    uiLanguage: 'en',

    releaseAttributes: [
      {
        searchTerm: 'unrated',
        displayAs: 'UNRATED',
        deleted: false,
        sort: -1000
      },
      {
        searchTerm: 'director\'s',
        displayAs: 'Director\'s Cut',
        deleted: false,
        sort: -999
      },
      {
        searchTerm: 'directors cut',
        displayAs: 'Director\'s Cut',
        deleted: false,
        sort: -998
      },
      {
        searchTerm: 'dc',
        displayAs: 'Director\'s Cut',
        deleted: false,
        sort: -997
      },
      {
        searchTerm: 'recut',
        displayAs: 'Recut',
        deleted: false,
        sort: -996
      },
      {
        searchTerm: 'final cut',
        displayAs: 'Final Cut',
        deleted: false,
        sort: -995
      },
      {
        searchTerm: 'ultimate cut',
        displayAs: 'Ultimate Cut',
        deleted: false,
        sort: -994
      },
      {
        searchTerm: 'extended',
        displayAs: 'EXTENDED',
        deleted: false,
        sort: -993
      },
      {
        searchTerm: 'see',
        displayAs: 'EXTENDED',
        deleted: false,
        sort: -992
      },
      {
        searchTerm: 'remaster',
        displayAs: 'REMASTERED',
        deleted: false,
        sort: -991
      },
      {
        searchTerm: 'remastered',
        displayAs: 'REMASTERED',
        deleted: false,
        sort: -990
      },
      {
        searchTerm: 'special edition',
        displayAs: 'SPECIAL EDITION',
        deleted: false,
        sort: -989
      },
      {
        searchTerm: 'se',
        displayAs: 'SPECIAL EDITION',
        deleted: false,
        sort: -988
      },
      {
        searchTerm: 'see',
        displayAs: 'SPECIAL EDITION',
        deleted: false,
        sort: -987
      },
      {
        searchTerm: 'imax',
        displayAs: 'IMAX',
        deleted: false,
        sort: -986
      },
      {
        searchTerm: 'open matte',
        displayAs: 'Open Matte',
        deleted: false,
        sort: -985
      },
      {
        searchTerm: 'bootleg',
        displayAs: 'BOOTLEG',
        deleted: false,
        sort: -984
      },
      {
        searchTerm: 'bluray',
        displayAs: 'BD',
        deleted: false,
        sort: -983
      },
      {
        searchTerm: 'mbluray',
        displayAs: 'BD',
        deleted: false,
        sort: -982
      },
      {
        searchTerm: 'blu ray',
        displayAs: 'BD',
        deleted: false,
        sort: -981
      },
      {
        searchTerm: 'bd',
        displayAs: 'BD',
        deleted: false,
        sort: -980
      },
      {
        searchTerm: 'bdrip',
        displayAs: 'BD',
        deleted: false,
        sort: -979
      },
      {
        searchTerm: 'bdripld',
        displayAs: 'BD',
        deleted: false,
        sort: -978
      },
      {
        searchTerm: 'brrip',
        displayAs: 'BD',
        deleted: false,
        sort: -977
      },
      {
        searchTerm: 'dvd',
        displayAs: 'DVD',
        deleted: false,
        sort: -976
      },
      {
        searchTerm: 'dvdrip',
        displayAs: 'DVD',
        deleted: false,
        sort: -975
      },
      {
        searchTerm: 'dvdripld',
        displayAs: 'DVD',
        deleted: false,
        sort: -974
      },
      {
        searchTerm: 'dvdscr',
        displayAs: 'DVD',
        deleted: false,
        sort: -973
      },
      {
        searchTerm: 'r5',
        displayAs: 'R5',
        deleted: false,
        sort: -972
      },
      {
        searchTerm: 'r5ld',
        displayAs: 'R5',
        deleted: false,
        sort: -971
      },
      {
        searchTerm: 'web',
        displayAs: 'WEB',
        deleted: false,
        sort: -970
      },
      {
        searchTerm: 'webrip',
        displayAs: 'WEB',
        deleted: false,
        sort: -969
      },
      {
        searchTerm: 'webhd',
        displayAs: 'WEB',
        deleted: false,
        sort: -968
      },
      {
        searchTerm: 'netflix',
        displayAs: 'WEB',
        deleted: false,
        sort: -967
      },
      {
        searchTerm: 'amazon',
        displayAs: 'WEB',
        deleted: false,
        sort: -966
      },
      {
        searchTerm: 'hulu',
        displayAs: 'WEB',
        deleted: false,
        sort: -965
      },
      {
        searchTerm: 'hdrip',
        displayAs: 'WEB',
        deleted: false,
        sort: -964
      },
      {
        searchTerm: 'hdtv',
        displayAs: 'HDTV',
        deleted: false,
        sort: -963
      },
      {
        searchTerm: 'tv',
        displayAs: 'TV',
        deleted: false,
        sort: -962
      }

      // TODO - more!
    ]
  },

  methods: {}
});

shared.install = function() {
  Object.defineProperty(Vue.prototype, "$shared", {
    get() {
      return shared;
    },
  });
};

export { shared };
