import Vue from "vue";
// const logger = require("loglevel");
// const moment = require("moment");

const helpers = require("./helpers/helpers");
const imdbScraperTests = require("./imdb-scraper-tests");

const shared = new Vue({
  data: {
    appName: "Media Hoarder",
    isPORTABLE: helpers.isPORTABLE,
    isDevelopment: helpers.isDevelopment,

    currentVersion: null,
    currentName: null,

    sidenav: null,
    searchText: null,
    logLevel: 0,

    isScanning: false,

    filterGroups: [
      {
        name: "filterSourcePaths",
        visible: true,
      },
      {
        name: "filterQualities",
        visible: true,
      },
      {
        name: "filterAudioLanguages",
        visible: true,
      },
      {
        name: "filterSubtitleLanguages",
        visible: true,
      },
      {
        name: "filterReleaseAttributes",
        visible: true,
      },
      {
        name: "filterLists",
        visible: true,
      },
      {
        name: "filterRatings",
        visible: true,
      },
      {
        name: "filterMetacriticScore",
        visible: true,
      },
      {
        name: "filterIMDBRating",
        visible: true,
      },
      {
        name: "filterGenres",
        visible: true,
      },
      {
        name: "filterAgeRatings",
        visible: true,
      },
      {
        name: "filterParentalAdvisory",
        visible: true,
      },
      {
        name: "filterPersons",
        visible: true,
      },
      {
        name: "filterCompanies",
        visible: true,
      },
      {
        name: "filterYears",
        visible: true,
      },
      {
        name: "filterIMDBPlotKeywords",
        visible: true,
      },
      {
        name: "filterIMDBFilmingLocations",
        visible: true,
      },
      {
        name: "filterDataQuality",
        visible: true,
      },
    ],

    filters: {
      filterSourcePaths: [],
      filterQualities: [],
      filterAudioLanguages: [],
      filterSubtitleLanguages: [],
      filterReleaseAttributes: [],
      filterLists: [],
      filterRatings: [],
      filterMetacriticScore: [0, 100],
      filterMetacriticScoreNone: true,
      filterIMDBRating: [0, 10],
      filterIMDBRatingNone: true,
      filterGenres: [],
      filterAgeRatings: [],
      filterParentalAdvisory: {
        Nudity: [],
        Violence: [],
        Profanity: [],
        Alcohol: [],
        Frightening: [],
      },
      filterPersons: [],
      filterCompanies: [],
      filterYears: [],
      filterIMDBPlotKeywords: [],
      filterIMDBFilmingLocations: [],
      filterDataQuality: [],

      filterSettings: {
        filterGenresAND: false,
        filterPersonsAND: false,
        filterCompaniesAND: false,
        filterIMDBPlotKeywordsAND: false,
        filterIMDBFilmingLocationsAND: false,
        filterReleaseAttributesAND: false,
        filterDataQualityAND: false,
      },
    },

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
        long_translated: "",
      },
      {
        code: "aged_under_18",
        short: "⚧<18",
        long: "Aged under 18",
        long_translated: "",
      },
      {
        code: "aged_18_29",
        short: "⚧<30",
        long: "Aged 18-29",
        long_translated: "",
      },
      {
        code: "aged_30_44",
        short: "⚧<45",
        long: "Aged 30-44",
        long_translated: "",
      },
      {
        code: "aged_45_plus",
        short: "⚧45+",
        long: "Aged 45+",
        long_translated: "",
      },
      {
        code: "females",
        short: "♀",
        long: "Females",
        long_translated: "",
      },
      {
        code: "females_aged_under_18",
        short: "♀<18",
        long: "Females aged under 18",
        long_translated: "",
      },
      {
        code: "females_aged_18_29",
        short: "♀<30",
        long: "Females aged 18-29",
        long_translated: "",
      },
      {
        code: "females_aged_30_44",
        short: "♀<45",
        long: "Females aged 30-44",
        long_translated: "",
      },
      {
        code: "females_aged_45_plus",
        short: "♀45+",
        long: "Females aged 45+",
        long_translated: "",
      },
      {
        code: "males",
        short: "♂",
        long: "Males",
        long_translated: "",
      },
      {
        code: "males_aged_under_18",
        short: "♂<18",
        long: "Males aged under 18",
        long_translated: "",
      },
      {
        code: "males_aged_18_29",
        short: "♂<30",
        long: "Males aged 18-29",
        long_translated: "",
      },
      {
        code: "males_aged_30_44",
        short: "♂<45",
        long: "Males aged 30-44",
        long_translated: "",
      },
      {
        code: "males_aged_45_plus",
        short: "♂45+",
        long: "Males aged 45+",
        long_translated: "",
      },
      {
        code: "top_1000_voters",
        short: "🎩",
        long: "Top 1000 Voters",
        long_translated: "",
      },
      {
        code: "non_us_users",
        short: "non-US",
        long: "Non-US Users",
        long_translated: "",
      },
      {
        code: "us_users",
        short: "US",
        long: "US Users",
        long_translated: "",
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

      rescanMoviesMetaData_findReleaseAttributes: true,

      rescanMoviesMetaData_saveIMDBData: true,

      applyMetaData: true,

      checkIMDBtconst: true,

      mergeExtras: true,

      handleDuplicates: true,
    },

    userScanOptions: [
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_mainPageData",
        enabled: true,
        description:
          "Main Page (Genres, Rating/Votes, Metacritic Score, Poster, Plot Summary, Trailer URL)",
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_ratingDemographics",
        enabled: true,
        description:
          "Ratings (Rating by Demographics, e_g_ Ages, Male/Female, US/Non-US)",
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_plotSummary",
        enabled: true,
        description:
          "Full Plot Summary (Main Page only contains an extract of the full summary)",
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_plotKeywords",
        enabled: true,
        description: "Plot Keywords",
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_releaseinfo",
        enabled: true,
        description:
          "Release Info (Title, Localized Title, Original Title, Year)",
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_technicalData",
        enabled: true,
        description: "Technical Data (Runtime)",
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_parentalguideData",
        enabled: true,
        description:
          "Parental Guide (Age Rating, Levels of: Nudity, Violence, Profanity, Alcohol & Drugs, Frightening Scenes)",
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_creditsData",
        enabled: true,
        description: "Credits",
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_companiesData",
        enabled: true,
        description: "Companies",
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_filmingLocations",
        enabled: true,
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
          "Ratings (Rating by Demographics, e_g_ Ages, Male/Female, US/Non-US)",
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

    uiLanguage: "en",

    releaseAttributes: [
      {
        searchTerm: "unrated",
        displayAs: "UNRATED",
        deleted: false,
      },
      {
        searchTerm: "uncut",
        displayAs: "UNCUT",
        deleted: false,
      },
      {
        searchTerm: "uncensored",
        displayAs: "UNCUT",
        deleted: false,
      },
      {
        searchTerm: "restore",
        displayAs: "RESTORED",
        deleted: false,
      },
      {
        searchTerm: "restored",
        displayAs: "RESTORED",
        deleted: false,
      },
      {
        searchTerm: "director's",
        displayAs: "Director's Cut",
        deleted: false,
      },
      {
        searchTerm: "directors cut",
        displayAs: "Director's Cut",
        deleted: false,
      },
      {
        searchTerm: "dc",
        displayAs: "Director's Cut",
        deleted: false,
      },
      {
        searchTerm: "recut",
        displayAs: "Recut",
        deleted: false,
      },
      {
        searchTerm: "final cut",
        displayAs: "Final Cut",
        deleted: false,
      },
      {
        searchTerm: "ultimate cut",
        displayAs: "Ultimate Cut",
        deleted: false,
      },
      {
        searchTerm: "extended",
        displayAs: "EXTENDED",
        deleted: false,
      },
      {
        searchTerm: "remaster",
        displayAs: "REMASTERED",
        deleted: false,
      },
      {
        searchTerm: "remastered",
        displayAs: "REMASTERED",
        deleted: false,
      },
      {
        searchTerm: "special edition",
        displayAs: "SPECIAL EDITION",
        deleted: false,
      },
      {
        searchTerm: "se",
        displayAs: "SPECIAL EDITION",
        deleted: false,
      },
      {
        searchTerm: "imax",
        displayAs: "IMAX",
        deleted: false,
      },
      {
        searchTerm: "open matte",
        displayAs: "Open Matte",
        deleted: false,
      },
      {
        searchTerm: "bootleg",
        displayAs: "BOOTLEG",
        deleted: false,
      },
      {
        searchTerm: "dubbed",
        displayAs: "DUBBED",
        deleted: false,
      },
      {
        searchTerm: "ac3d",
        displayAs: "DUBBED",
        deleted: false,
      },
      {
        searchTerm: "ac3ld",
        displayAs: "DUBBED",
        deleted: false,
      },
      {
        searchTerm: "ac3md",
        displayAs: "DUBBED",
        deleted: false,
      },
      {
        searchTerm: "dvdripld",
        displayAs: "DUBBED",
        deleted: false,
      },
      {
        searchTerm: "eac3d",
        displayAs: "DUBBED",
        deleted: false,
      },
      {
        searchTerm: "ld",
        displayAs: "DUBBED",
        deleted: false,
      },
      {
        searchTerm: "bdripld",
        displayAs: "DUBBED",
        deleted: false,
      },
      {
        searchTerm: "r5ld",
        displayAs: "DUBBED",
        deleted: false,
      },
      {
        searchTerm: "screener",
        displayAs: "SCREENER",
        deleted: false,
      },
      {
        searchTerm: "webscr",
        displayAs: "SCREENER",
        deleted: false,
      },
      {
        searchTerm: "dvdscr",
        displayAs: "SCREENER",
        deleted: false,
      },
      {
        searchTerm: "bluray",
        displayAs: "BD",
        deleted: false,
      },
      {
        searchTerm: "mbluray",
        displayAs: "BD",
        deleted: false,
      },
      {
        searchTerm: "blu ray",
        displayAs: "BD",
        deleted: false,
      },
      {
        searchTerm: "bd",
        displayAs: "BD",
        deleted: false,
      },
      {
        searchTerm: "bdrip",
        displayAs: "BD",
        deleted: false,
      },
      {
        searchTerm: "bdripld",
        displayAs: "BD",
        deleted: false,
      },
      {
        searchTerm: "brrip",
        displayAs: "BD",
        deleted: false,
      },
      {
        searchTerm: "dvd",
        displayAs: "DVD",
        deleted: false,
      },
      {
        searchTerm: "dvdrip",
        displayAs: "DVD",
        deleted: false,
      },
      {
        searchTerm: "dvdripld",
        displayAs: "DVD",
        deleted: false,
      },
      {
        searchTerm: "dvdscr",
        displayAs: "DVD",
        deleted: false,
      },
      {
        searchTerm: "r5",
        displayAs: "R5",
        deleted: false,
      },
      {
        searchTerm: "r5ld",
        displayAs: "R5",
        deleted: false,
      },
      {
        searchTerm: "web",
        displayAs: "WEB",
        deleted: false,
      },
      {
        searchTerm: "webrip",
        displayAs: "WEB",
        deleted: false,
      },
      {
        searchTerm: "webhd",
        displayAs: "WEB",
        deleted: false,
      },
      {
        searchTerm: "netflix",
        displayAs: "WEB",
        deleted: false,
      },
      {
        searchTerm: "amazon",
        displayAs: "WEB",
        deleted: false,
      },
      {
        searchTerm: "hulu",
        displayAs: "WEB",
        deleted: false,
      },
      {
        searchTerm: "hdrip",
        displayAs: "WEB",
        deleted: false,
      },
      {
        searchTerm: "hdtv",
        displayAs: "HDTV",
        deleted: false,
      },
      {
        searchTerm: "tv",
        displayAs: "TV",
        deleted: false,
      },
    ],

    videoQualities: [
      {
        name: "SD",
        minResolution: 0 * 0,
      },
      {
        name: "720p",
        minResolution: 720 * 576,
      },
      {
        name: "HD",
        minResolution: 1280 * 720,
      },
      {
        name: "UHD",
        minResolution: 1920 * 1080,
      },
      {
        name: "4K",
        minResolution: 3840 * 2160,
      },
      {
        name: "8K",
        minResolution: 4096 * 2160,
      },
    ],
  },

  computed: {},

  methods: {},
});

shared.install = function () {
  Object.defineProperty(Vue.prototype, "$shared", {
    get() {
      return shared;
    },
  });
};

export { shared };
