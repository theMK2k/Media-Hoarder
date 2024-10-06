import Vue from "vue";
// const logger = require("./helpers/logger");
// const moment = require("moment");

const helpers = require("./helpers/helpers");
const imdbScraperTests = require("./tests/imdb-scraper-tests");

const { enmFilterSortModes } = require("./enums/enmFilterSortModes");

const shared = new Vue({
  data: {
    appName: "Media Hoarder",
    isPORTABLE: helpers.isPORTABLE,
    isDevelopment: helpers.isDevelopment,
    isBeta: helpers.isBeta,

    currentVersion: null,
    isNewVersionAvailable: false,
    currentName: null,

    sidenav: null,
    searchText: null,
    logLevel: 0,

    isScanning: false,

    loadingFilter: "",
    isLoadingFilter: false,
    loadingFilterProgress: 0,

    mediaPropertyDialogVisible: false, // globally track if MediaPropertyDialog is visible, this is used for SeriesIMDBRatingDialog's Popup Menu, which should be close-clickable if MediaPropertyDialog is not visible

    filterGroups: [
      {
        name: "filterSourcePaths",
        visible: true,
        sort: enmFilterSortModes.alphabetically,
      },
      {
        name: "filterQualities",
        visible: true,
        sort: enmFilterSortModes.alphabetically,
      },
      {
        name: "filterVideoEncoders",
        visible: true,
        sort: enmFilterSortModes.alphabetically,
      },
      {
        name: "filterAudioLanguages",
        visible: true,
        sort: enmFilterSortModes.numMovies,
      },
      {
        name: "filterAudioFormats",
        visible: true,
        sort: enmFilterSortModes.alphabetically,
      },
      {
        name: "filterSubtitleLanguages",
        visible: true,
        sort: enmFilterSortModes.numMovies,
      },
      {
        name: "filterReleaseAttributes",
        visible: true,
        sort: enmFilterSortModes.alphabetically,
      },
      {
        name: "filterLists",
        visible: true,
        sort: enmFilterSortModes.alphabetically,
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
        sort: enmFilterSortModes.alphabetically,
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
        sort: enmFilterSortModes.alphabetically,
      },
      {
        name: "filterCompanies",
        visible: true,
        sort: enmFilterSortModes.alphabetically,
      },
      {
        name: "filterYears",
        visible: true,
        sort: enmFilterSortModes.alphabetically,
      },
      {
        name: "filterIMDBPlotKeywords",
        visible: true,
        sort: enmFilterSortModes.alphabetically,
      },
      {
        name: "filterIMDBFilmingLocations",
        visible: true,
        sort: enmFilterSortModes.alphabetically,
      },
      {
        name: "filterDataQuality",
        visible: true,
      },
    ],

    filters: {
      filterSourcePaths: [],
      filterQualities: [],
      filterVideoEncoders: [],
      filterAudioLanguages: [],
      filterAudioFormats: [],
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

    lastChangedFilter: null,

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
        updateDescription: true,
        updateReleaseAttributes: true,
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

      filescanSeries: true,

      rescanMoviesMetaData: true,

      // rescanMoviesMetaData_id_SourcePaths_IN: '(5, 10)',								// only rescan metadata in certain SourcePaths
      // rescanMoviesMetaData_id_Movies: 23,																	// only rescan a certain movie
      // rescanMoviesMetaData_maxEntries: 3,

      rescanMoviesMetaData_applyMediaInfo: true,
      rescanMoviesMetaData_findIMDBtconst: true,
      // rescanMoviesMetaData_findIMDBtconst_ignore_tconst_in_filename: true,				// ignore tconst contained in filename, instead perform IMDB search (and match against tconst contained in filename)

      rescanMoviesMetaData_fetchIMDBMetaData: true,
      rescanMoviesMetaData_fetchIMDBMetaData_mainPageData: true,
      // #rip-rating-demographcis
      // rescanMoviesMetaData_fetchIMDBMetaData_ratingDemographics: false,
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

    current_id_Scan_Processes: null, // during a re-scan process, this is the id of the Scan_Processes entry

    userScanOptions: [
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_mainPageData",
        enabled: true,
        description: "Main Page (Genres, Rating/Votes, Metacritic Score, Poster, Plot Summary, Trailer URL)",
      },
      // #rip-rating-demographics
      // {
      //   key: "rescanMoviesMetaData_fetchIMDBMetaData_ratingDemographics",
      //   enabled: true,
      //   description: "Ratings (Rating by Demographics, e_g_ Ages, Male/Female, US/Non-US)",
      // },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_plotSummary",
        enabled: true,
        description: "Full Plot Summary (Main Page only contains an extract of the full summary)",
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_plotKeywords",
        enabled: true,
        description: "Plot Keywords",
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_releaseinfo",
        enabled: true,
        description: "Release Info (Title, Localized Title, Original Title, Year)",
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
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_seriesEpisodes",
        enabled: true,
        description: "Series Episodes",
      },
    ],

    imdbScraperChecks: [
      {
        key: "adhoc_FindPageSearch",
        description: "Find (vital to detect the IMDB entry for movies and tv series)",
        alwaysEnabled: true, // show this check in any case
        enabled: true,
        checkFunctions: [imdbScraperTests.testIMDBFindPageSearch],
        icon: null,
        color: null,
        isRunning: false,
        result: null,
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_mainPageData",
        description: "Main Page (Genres, Rating/Votes, Metacritic Score, Poster, Plot Summary, Trailer URL)",
        enabled: true,
        checkFunctions: [
          imdbScraperTests.testIMDBmainPageData,
          imdbScraperTests.testIMDBmainPageData2,
          imdbScraperTests.testIMDBmainPageData3,
          imdbScraperTests.testIMDBmainPageData4,
        ],
        icon: null,
        color: null,
        isRunning: false,
        result: null,
      },
      // #rip-rating-demographics
      // {
      //   key: "rescanMoviesMetaData_fetchIMDBMetaData_ratingDemographics",
      //   description: "Ratings (Rating by Demographics, e_g_ Ages, Male/Female, US/Non-US)",
      //   enabled: true,
      //   checkFunction: imdbScraperTests.testIMDBRatingDemographics,
      //   icon: null,
      //   color: null,
      //   isRunning: false,
      //   result: null,
      // },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_plotSummary",
        description: "Full Plot Summary (Main Page only contains an extract of the full summary)",
        enabled: true,
        checkFunctions: [imdbScraperTests.testIMDBplotSummary],
        icon: null,
        color: null,
        isRunning: false,
        result: null,
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_plotKeywords",
        description: "Plot Keywords",
        enabled: true,
        checkFunctions: [imdbScraperTests.testIMDBplotKeywords],
        icon: null,
        color: null,
        isRunning: false,
        result: null,
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_releaseinfo",
        description: "Release Info (Title, Localized Title, Original Title, Year)",
        enabled: true,
        checkFunctions: [imdbScraperTests.testIMDBreleaseinfo],
        icon: null,
        color: null,
        isRunning: false,
        result: null,
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_technicalData",
        description: "Technical Data (Runtime)",
        enabled: true,
        checkFunctions: [
          imdbScraperTests.testIMDBtechnicalData,
          imdbScraperTests.testIMDBtechnicalData2,
          imdbScraperTests.testIMDBtechnicalData3,
        ],
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
        checkFunctions: [imdbScraperTests.testIMDBParentalGuideData],
        icon: null,
        color: null,
        isRunning: false,
        result: null,
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_creditsData",
        description: "Credits",
        enabled: true,
        checkFunctions: [imdbScraperTests.testIMDBFullCreditsData],
        icon: null,
        color: null,
        isRunning: false,
        result: null,
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_companiesData",
        description: "Companies",
        enabled: true,
        checkFunctions: [imdbScraperTests.testIMDBCompaniesData],
        icon: null,
        color: null,
        isRunning: false,
        result: null,
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_filmingLocations",
        description: "Filming Locations",
        enabled: true,
        checkFunctions: [imdbScraperTests.testIMDBFilmingLocations],
        icon: null,
        color: null,
        isRunning: false,
        result: null,
      },
      {
        key: "rescanMoviesMetaData_fetchIMDBMetaData_seriesEpisodes",
        description: "Series Episodes",
        enabled: true,
        checkFunctions: [imdbScraperTests.testIMDBSeriesEpisodes],
        icon: null,
        color: null,
        isRunning: false,
        result: null,
      },
      {
        key: "adhoc_PersonData",
        description: "Person Data (Ad-Hoc)",
        enabled: true,
        checkFunctions: [imdbScraperTests.testIMDBPersonData],
        icon: null,
        color: null,
        isRunning: false,
        result: null,
      },
      {
        key: "adhoc_TrailerMediaURLs",
        description: "Trailer Media URLs (Ad-Hoc)",
        enabled: true,
        checkFunctions: [imdbScraperTests.testIMDBTrailerMediaURLs],
        icon: null,
        color: null,
        isRunning: false,
        result: null,
      },
      {
        key: "adhoc_Suggestion",
        description: "Suggestion Search (Ad-Hoc)",
        enabled: true,
        checkFunctions: [imdbScraperTests.testIMDBSuggestion],
        icon: null,
        color: null,
        isRunning: false,
        result: null,
      },
      {
        key: "adhoc_AdvancedTitleSearch",
        description: "Advanced Title Search (Ad-Hoc)",
        enabled: true,
        checkFunctions: [imdbScraperTests.testIMDBAdvancedTitleSearch],
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
        searchTerm: "md",
        displayAs: "MD",
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

    videoQualitiesCategories: {
      "video-resolution": {
        displayText: "Video Resolution",
        Category_Sort: 1,
      },
      "video-hdr": {
        displayText: "HDR Variant",
        Category_Sort: 2,
      },
    },

    videoQualities: {
      SD: {
        Category_Name: "video-resolution",
        name: "SD",
        minResolution: 0 * 0,
      },
      "720p": {
        Category_Name: "video-resolution",
        name: "720p",
        minResolution: 720 * 576,
      },
      HD: {
        Category_Name: "video-resolution",
        name: "HD",
        minResolution: 1280 * 720,
      },
      UHD: {
        Category_Name: "video-resolution",
        name: "UHD",
        minResolution: 1920 * 1080,
      },
      "4K": {
        Category_Name: "video-resolution",
        name: "4K",
        minResolution: 3840 * 2160,
      },
      "8K": {
        Category_Name: "video-resolution",
        name: "8K",
        minResolution: 4096 * 2160,
      },
      DV: {
        Category_Name: "video-hdr",
        name: "DV",
      },
      HDR10: {
        Category_Name: "video-hdr",
        name: "HDR10",
      },
      "HDR10+": {
        Category_Name: "video-hdr",
        name: "HDR10+",
      },
    },

    /*
    videoQualities: [
      {
        name: "SD",
        Category_Name: "video-resolution",
        minResolution: 0 * 0,
      },
      {
        name: "720p",
        Category_Name: "video-resolution",
        minResolution: 720 * 576,
      },
      {
        name: "HD",
        Category_Name: "video-resolution",
        minResolution: 1280 * 720,
      },
      {
        name: "UHD",
        Category_Name: "video-resolution",
        minResolution: 1920 * 1080,
      },
      {
        name: "4K",
        Category_Name: "video-resolution",
        minResolution: 3840 * 2160,
      },
      {
        name: "8K",
        Category_Name: "video-resolution",
        minResolution: 4096 * 2160,
      },
      {
        name: "DV",
        Category_Name: "video-hdr",
      },
      {
        name: "HDR10",
        Category_Name: "video-hdr",
      },
      {
        name: "HDR10+",
        Category_Name: "video-hdr",
      },
    ],
    */
  },

  computed: {
    filterPersonsActive() {
      return (
        this.filters.filterPersons &&
        ((!this.filters.filterSettings.filterPersonsAND &&
          this.filters.filterPersons.find((filter) => !filter.Selected)) ||
          (this.filters.filterSettings.filterPersonsAND &&
            this.filters.filterPersons.find((filter) => filter.Selected && filter.IMDB_Person_ID)))
      );
    },
    filterPersonsApplied() {
      if (
        this.filters.filterPersons &&
        ((!this.filters.filterSettings.filterPersonsAND &&
          this.filters.filterPersons.find((filter) => !filter.Selected)) ||
          (this.filters.filterSettings.filterPersonsAND &&
            this.filters.filterPersons.find((filter) => filter.Selected && filter.IMDB_Person_ID)))
      ) {
        return this.filters.filterPersons.filter((filter) => filter.Selected && filter.IMDB_Person_ID);
      }

      return [];
    },

    filterCompaniesActive() {
      return (
        this.filters.filterCompanies &&
        ((!this.filters.filterSettings.filterCompaniesAND &&
          this.filters.filterCompanies.find((filter) => !filter.Selected)) ||
          (this.filters.filterSettings.filterCompaniesAND &&
            this.filters.filterCompanies.find((filter) => filter.Selected && filter.id_Filter_Companies)))
      );
    },
    filterCompaniesApplied() {
      if (
        this.filters.filterCompanies &&
        ((!this.filters.filterSettings.filterCompaniesAND &&
          this.filters.filterCompanies.find((filter) => !filter.Selected)) ||
          (this.filters.filterSettings.filterCompaniesAND &&
            this.filters.filterCompanies.find((filter) => filter.Selected && filter.id_Filter_Companies)))
      ) {
        return this.filters.filterCompanies.filter((filter) => filter.Selected && filter.id_Filter_Companies);
      }

      return [];
    },

    filterSourcePathsActive() {
      return this.filters.filterSourcePaths.find((filter) => !filter.Selected);
    },
    filterSourcePathsApplied() {
      if (this.filterSourcePathsActive) {
        return this.filters.filterSourcePaths.filter((filter) => filter.Selected);
      }

      return [];
    },

    filterQualitiesActive() {
      return this.filters.filterQualities.find((filter) => !filter.Selected);
    },
    filterQualitiesApplied() {
      if (this.filterQualitiesActive) {
        return this.filters.filterQualities.filter((filter) => filter.Selected);
      }

      return [];
    },

    filterAudioLanguagesActive() {
      return this.filters.filterAudioLanguages.find((filter) => !filter.Selected);
    },
    filterAudioLanguagesApplied() {
      if (this.filterAudioLanguagesActive) {
        return this.filters.filterAudioLanguages.filter((filter) => filter.Selected);
      }

      return [];
    },

    filterSubtitleLanguagesActive() {
      return this.filters.filterSubtitleLanguages.find((filter) => !filter.Selected);
    },
    filterSubtitleLanguagesApplied() {
      if (this.filterSubtitleLanguagesActive) {
        return this.filters.filterSubtitleLanguages.filter((filter) => filter.Selected);
      }

      return [];
    },

    filterReleaseAttributesActive() {
      return (
        this.filters.filterReleaseAttributes &&
        ((!this.filters.filterSettings.filterReleaseAttributesAND &&
          this.filters.filterReleaseAttributes.find((filter) => !filter.Selected)) ||
          (this.filters.filterSettings.filterReleaseAttributesAND &&
            this.filters.filterReleaseAttributes.find((filter) => filter.Selected && !filter.isAny)))
      );
    },
    filterReleaseAttributesApplied() {
      if (this.filterReleaseAttributesActive) {
        return this.filters.filterReleaseAttributes.filter((filter) => filter.Selected && !filter.isAny);
      }

      return [];
    },

    filterListsActive() {
      return this.filters.filterLists.find((filter) => !filter.Selected);
    },
    filterListsApplied() {
      if (this.filterListsActive) {
        return this.filters.filterLists.filter((filter) => filter.Selected);
      }

      return [];
    },

    filterGenresActive() {
      return (
        this.filters.filterGenres &&
        ((!this.filters.filterSettings.filterGenresAND &&
          this.filters.filterGenres.find((filter) => !filter.Selected)) ||
          (this.filters.filterSettings.filterGenresAND &&
            this.filters.filterGenres.find((filter) => filter.Selected)) ||
          this.filters.filterGenres.find((filter) => filter.Selected && filter.Excluded))
      );
    },
    filterGenresApplied() {
      if (this.filterGenresActive) {
        return this.filters.filterGenres.filter((filter) => filter.Selected);
      }
      return [];
    },

    filterAgeRatingsActive() {
      return this.filters.filterAgeRatings.find((filter) => !filter.Selected);
    },
    filterAgeRatingsApplied() {
      if (this.filterAgeRatingsActive) {
        return this.filters.filterAgeRatings.filter((filter) => filter.Selected);
      }
      return [];
    },

    filterYearsActive() {
      return this.filters.filterYears.find((filter) => !filter.Selected);
    },
    filterYearsApplied() {
      if (this.filterYearsActive) {
        return this.filters.filterYears.filter((filter) => !filter.Selected);
      }

      return [];
    },

    filterParentalAdvisoryActive() {
      return !this.filterParentalAdvisoryApplied.None;
    },
    filterParentalAdvisoryApplied() {
      const result = {
        None: true,
        Nudity: [],
        Violence: [],
        Profanity: [],
        Alcohol: [],
        Frightening: [],
      };

      if (this.filters.filterParentalAdvisory.Nudity.find((filter) => !filter.Selected)) {
        result.None = false;
        result.Nudity = this.filters.filterParentalAdvisory.Nudity.filter((filter) => filter.Selected);
      }
      if (this.filters.filterParentalAdvisory.Violence.find((filter) => !filter.Selected)) {
        result.None = false;
        result.Violence = this.filters.filterParentalAdvisory.Violence.filter((filter) => filter.Selected);
      }
      if (this.filters.filterParentalAdvisory.Profanity.find((filter) => !filter.Selected)) {
        result.None = false;
        result.Profanity = this.filters.filterParentalAdvisory.Profanity.filter((filter) => filter.Selected);
      }
      if (this.filters.filterParentalAdvisory.Alcohol.find((filter) => !filter.Selected)) {
        result.None = false;
        result.Alcohol = this.filters.filterParentalAdvisory.Alcohol.filter((filter) => filter.Selected);
      }
      if (this.filters.filterParentalAdvisory.Frightening.find((filter) => !filter.Selected)) {
        result.None = false;
        result.Frightening = this.filters.filterParentalAdvisory.Frightening.filter((filter) => filter.Selected);
      }

      return result;
    },

    filterIMDBPlotKeywordsActive() {
      return (
        this.filters.filterIMDBPlotKeywords &&
        ((!this.filters.filterSettings.filterIMDBPlotKeywordsAND &&
          this.filters.filterIMDBPlotKeywords.find((filter) => !filter.Selected)) ||
          (this.filters.filterSettings.filterIMDBPlotKeywordsAND &&
            this.filters.filterIMDBPlotKeywords.find(
              (filter) => filter.Selected && filter.id_Filter_IMDB_Plot_Keywords
            )))
      );
    },
    filterIMDBPlotKeywordsApplied() {
      if (this.filterIMDBPlotKeywordsActive) {
        return this.filters.filterIMDBPlotKeywords.filter(
          (filter) => filter.Selected && filter.id_Filter_IMDB_Plot_Keywords
        );
      }

      return [];
    },

    filterIMDBFilmingLocationsActive() {
      return (
        this.filters.filterIMDBFilmingLocations &&
        ((!this.filters.filterSettings.filterIMDBFilmingLocationsAND &&
          this.filters.filterIMDBFilmingLocations.find((filter) => !filter.Selected)) ||
          (this.filters.filterSettings.filterIMDBFilmingLocationsAND &&
            this.filters.filterIMDBFilmingLocations.find(
              (filter) => filter.Selected && filter.id_Filter_IMDB_Filming_Locations
            )))
      );
    },
    filterIMDBFilmingLocationsApplied() {
      if (this.filterIMDBFilmingLocationsActive) {
        return this.filters.filterIMDBFilmingLocations.filter(
          (filter) => filter.Selected && filter.id_Filter_IMDB_Filming_Locations
        );
      }

      return [];
    },

    filterRatingsActive() {
      return this.filters.filterRatings.find((filter) => !filter.Selected);
    },
    filterRatingsApplied() {
      if (this.filterRatingsActive) {
        return this.filters.filterRatings.filter((filter) => !filter.Selected);
      }

      return [];
    },

    filterMetacriticScoreActive() {
      return (
        this.$shared.filters.filterMetacriticScore[0] !== 0 ||
        this.$shared.filters.filterMetacriticScore[1] !== 100 ||
        !this.$shared.filters.filterMetacriticScoreNone
      );
    },

    filterIMDBRatingsActive() {
      return (
        this.$shared.filters.filterIMDBRating[0] !== 0 ||
        this.$shared.filters.filterIMDBRating[1] !== 10 ||
        !this.$shared.filters.filterIMDBRatingNone
      );
    },

    filterDataQualityActive() {
      return (
        this.$shared.filters.filterDataQuality &&
        ((!this.$shared.filters.filterSettings.filterDataQualityAND &&
          this.$shared.filters.filterDataQuality.find((filter) => !filter.Selected)) ||
          (this.$shared.filters.filterSettings.filterDataQualityAND &&
            this.$shared.filters.filterDataQuality.find((filter) => filter.Selected)))
      );
    },

    filterVideoEncodersActive() {
      return this.filters.filterVideoEncoders.find((filter) => !filter.Selected);
    },
    filterVideoEncodersApplied() {
      if (this.filterVideoEncodersActive) {
        return this.filters.filterVideoEncoders.filter((filter) => filter.Selected);
      }

      return [];
    },

    filterAudioFormatsActive() {
      return this.filters.filterAudioFormats.find((filter) => !filter.Selected);
    },
    filterAudioFormatsApplied() {
      if (this.filterAudioFormatsActive) {
        return this.filters.filterAudioFormats.filter((filter) => filter.Selected);
      }

      return [];
    },
  },

  methods: {
    getFilterGroup(filterGroupName) {
      return this.$shared.filterGroups.find((fg) => fg.name === filterGroupName);
    },

    filterPersonsAppliedContains(person) {
      return !!this.$shared.filterPersonsApplied.find((fp) => fp.IMDB_Person_ID === person.id);
    },

    filterCompaniesAppliedContains(company) {
      return !!this.$shared.filterCompaniesApplied.find((fc) => fc.Company_Name === company.name);
    },

    filterQualitiesAppliedContains(quality) {
      return !!this.$shared.filterQualitiesApplied.find((fq) => fq.MI_Quality === quality);
    },

    filterVideoEncodersAppliedContains(videoEncoder) {
      return !!this.$shared.filterVideoEncodersApplied.find((fve) => fve.Name === videoEncoder);
    },

    filterAudioLanguagesAppliedContains(language, arrVisibleLanguages, allLanguages) {
      if (!/\+\d/.test(language)) {
        // language is not "+6" or similar
        return !!this.$shared.filterAudioLanguagesApplied.find((fal) => fal.Language.toUpperCase() === language);
      } else {
        // language is "+6" or similar, we have to check hidden languages
        const allLanguagesUppercase = allLanguages
          .toUpperCase()
          .split(",")
          .map((lang) => lang.trim());
        arrVisibleLanguages.forEach((visibleLanguage) => {
          while (allLanguagesUppercase.find((lang) => lang === visibleLanguage)) {
            allLanguagesUppercase.splice(
              allLanguagesUppercase.findIndex((lang) => lang === visibleLanguage),
              1
            );
          }
        });

        const arrFilterLanguages = this.$shared.filterAudioLanguagesApplied.map((fal) => fal.Language.toUpperCase());
        for (let filterLanguage of arrFilterLanguages) {
          if (allLanguagesUppercase.find((lang) => lang === filterLanguage)) {
            return true;
          }
        }

        return false;
      }
    },

    filterAudioFormatsAppliedContains(audioFormat) {
      return !!this.$shared.filterAudioFormatsApplied.find((filter) => filter.Name === audioFormat);
    },

    filterSubtitleLanguagesAppliedContains(language) {
      return !!this.$shared.filterSubtitleLanguagesApplied.find((fsl) => fsl.Language.toUpperCase() === language);
    },

    filterReleaseAttributesAppliedContains(releaseAttribute) {
      return !!this.$shared.filterReleaseAttributesApplied.find((fra) => fra.ReleaseAttribute === releaseAttribute);
    },

    filterListsAppliedContains(listName) {
      return !!this.$shared.filterListsApplied.find((fla) => fla.Name === listName);
    },

    filterGenresAppliedContains(genreName) {
      return !!this.$shared.filterGenresApplied.find((fga) => fga.Name === genreName);
    },

    filterParentalAdvisoryAppliedContains(categoryName, severity) {
      return !!this.$shared.filterParentalAdvisoryApplied[categoryName].find((fpaa) => fpaa.Severity === severity);
    },

    filterIMDBPlotKeywordsAppliedContains(plotKeyword) {
      return !!this.$shared.filterIMDBPlotKeywordsApplied.find((fpka) => fpka.Keyword === plotKeyword);
    },

    filterIMDBFilmingLocationsAppliedContains(location) {
      return !!this.$shared.filterIMDBFilmingLocationsApplied.find((ffla) => ffla.Location === location);
    },
  },
});

shared.install = function () {
  Object.defineProperty(Vue.prototype, "$shared", {
    get() {
      return shared;
    },
  });
};

export { shared };
