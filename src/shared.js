import Vue from "vue";
// const logger = require("loglevel");
// const moment = require("moment");

const imdbScraperTests = require("./imdb-scraper-tests");

const shared = new Vue({
  data: {
    sidenav: null,
    searchText: null,

    filters: {
      filterSourcePaths: [],
      filterGenres: [],
      filterSettings: {
        filterGenresAND: false,
        filterPersonsAND: false,
        filterCompaniesAND: false,
        filterIMDBPlotKeywordsAND: false,
        filterIMDBFilmingLocationsAND: false,
        filterReleaseAttributesAND: false,
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
  
      filterReleaseAttributes: [],
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
        enabled: true,
        description:
          "Main Page (Genres, Rating/Votes, Metacritic Score, Poster, Plot Summary, Trailer URL)",
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_ratingDemographics",
        enabled: true,
        description:
          "Ratings (Rating by Demographics, e.g. Ages, Male/Female, US/Non-US)",
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
        sort: null
      },
      {
        searchTerm: 'uncut',
        displayAs: 'UNCUT',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'uncensored',
        displayAs: 'UNCUT',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'director\'s',
        displayAs: 'Director\'s Cut',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'directors cut',
        displayAs: 'Director\'s Cut',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'dc',
        displayAs: 'Director\'s Cut',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'recut',
        displayAs: 'Recut',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'final cut',
        displayAs: 'Final Cut',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'ultimate cut',
        displayAs: 'Ultimate Cut',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'extended',
        displayAs: 'EXTENDED',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'see',
        displayAs: 'EXTENDED',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'remaster',
        displayAs: 'REMASTERED',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'remastered',
        displayAs: 'REMASTERED',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'special edition',
        displayAs: 'SPECIAL EDITION',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'se',
        displayAs: 'SPECIAL EDITION',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'see',
        displayAs: 'SPECIAL EDITION',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'imax',
        displayAs: 'IMAX',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'open matte',
        displayAs: 'Open Matte',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'bootleg',
        displayAs: 'BOOTLEG',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'dubbed',
        displayAs: 'DUBBED',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'ac3d',
        displayAs: 'DUBBED',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'ac3ld',
        displayAs: 'DUBBED',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'ac3md',
        displayAs: 'DUBBED',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'dvdripld',
        displayAs: 'DUBBED',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'ld',
        displayAs: 'DUBBED',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'bdripld',
        displayAs: 'DUBBED',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'r5ld',
        displayAs: 'DUBBED',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'screener',
        displayAs: 'SCREENER',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'webscr',
        displayAs: 'SCREENER',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'dvdscr',
        displayAs: 'SCREENER',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'bluray',
        displayAs: 'BD',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'mbluray',
        displayAs: 'BD',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'blu ray',
        displayAs: 'BD',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'bd',
        displayAs: 'BD',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'bdrip',
        displayAs: 'BD',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'bdripld',
        displayAs: 'BD',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'brrip',
        displayAs: 'BD',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'dvd',
        displayAs: 'DVD',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'dvdrip',
        displayAs: 'DVD',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'dvdripld',
        displayAs: 'DVD',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'dvdscr',
        displayAs: 'DVD',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'r5',
        displayAs: 'R5',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'r5ld',
        displayAs: 'R5',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'web',
        displayAs: 'WEB',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'webrip',
        displayAs: 'WEB',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'webhd',
        displayAs: 'WEB',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'netflix',
        displayAs: 'WEB',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'amazon',
        displayAs: 'WEB',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'hulu',
        displayAs: 'WEB',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'hdrip',
        displayAs: 'WEB',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'hdtv',
        displayAs: 'HDTV',
        deleted: false,
        sort: null
      },
      {
        searchTerm: 'tv',
        displayAs: 'TV',
        deleted: false,
        sort: null
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
