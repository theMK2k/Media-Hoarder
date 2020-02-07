import Vue from 'vue'

const shared = new Vue({
  data: {
    message: 'my global message',
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
    fallbackRegion: null
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
