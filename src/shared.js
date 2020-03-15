import Vue from 'vue'

const shared = new Vue({
  data: {
    sidenav: null,
    searchText: null,
    filterSourcePaths: [],
    filterGenres: [],
    filterAgeRatings: [],
    filterRatings: [],
    filterLists: [],
    filterParentalAdvisory: {
      Nudity: [],
      Violence: [],
      Profanity: [],
      Alcohol: [],
      Frightening: []
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

    contentAdvisoryCategories: [
      {
        Name: 'Nudity',
        DisplayText: 'Sex & Nudity'
      },
      {
        Name: 'Violence',
        DisplayText: 'Violence & Gore'
      },
      {
        Name: 'Profanity',
        DisplayText: 'Profanity'
      },
      {
        Name: 'Alcohol',
        DisplayText: 'Alcohol, Drugs & Smoking'
      },
      {
        Name: 'Frightening',
        DisplayText: 'Frightening & Intense Scenes'
      }
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
        updateLastAccess: true
      }, metaDuplicate: {
        addToList: true,
        updateRating: true
      }
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
        code: '',
        short: null,
        long: 'All'
      },
      {
        code: 'aged_under_18',
        short: '⚧<18',
        long: 'Aged under 18'
      },
      {
        code: 'aged_18_29',
        short: '⚧<30',
        long: 'Aged 18-29'
      },
      {
        code: 'aged_30_44',
        short: '⚧<45',
        long: 'Aged 30-44'
      },
      {
        code: 'aged_45_plus',
        short: '⚧45+',
        long: 'Aged 45+'
      },
      {
        code: 'males',
        short: '♂',
        long: 'Males'
      },
      {
        code: 'males_aged_under_18',
        short: '♂<18',
        long: 'Males aged under 18'
      },
      {
        code: 'males_aged_18_29',
        short: '♂<30',
        long: 'Males aged 18-29'
      },
      {
        code: 'males_aged_30_44',
        short: '♂<45',
        long: 'Males aged 30-44'
      },
      {
        code: 'males_aged_45_plus',
        short: '♂45+',
        long: 'Males aged 45+'
      },
      {
        code: 'females',
        short: '♀',
        long: 'Females'
      },
      {
        code: 'females_aged_under_18',
        short: '♀<18',
        long: 'Females aged under 18'
      },
      {
        code: 'females_aged_18_29',
        short: '♀<30',
        long: 'Females aged 18-29'
      },
      {
        code: 'females_aged_30_44',
        short: '♀<45',
        long: 'Females aged 30-44'
      },
      {
        code: 'females_aged_45_plus',
        short: '♀45+',
        long: 'Females aged 45+'
      },
      {
        code: 'top_1000_voters',
        short: '🎩',
        long: 'Top 1000 voters'
      },
      {
        code: 'us_users',
        short: 'US',
        long: 'US users'
      },
      {
        code: 'non_us_users',
        short: 'non-US',
        long: 'Non-US users'
      },
    ],
    imdbRatingDemographic: ''
  }
})

shared.install = function () {
  Object.defineProperty(Vue.prototype, '$shared', {
    get() {
      return shared
    }
  })
}

export { shared }
