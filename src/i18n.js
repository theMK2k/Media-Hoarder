import Vue from 'vue'
import VueI18n from 'vue-i18n'

const logger = require('loglevel');

Vue.use(VueI18n)

function loadLocaleMessages () {
  const locales = require.context('./i18n', true, /[A-Za-z0-9-_,\s]+\.json$/i)
  const messages = {}
  locales.keys().forEach(key => {
    const matched = key.match(/([A-Za-z0-9-_]+)\./i)
    if (matched && matched.length > 1) {
      const locale = matched[1]
      messages[locale] = locales(key)
    }
  })
  return messages
}

const messages = loadLocaleMessages();

// Checking for duplicate entries which will be migrated to global
// Object.keys(messages).forEach(lang => {
//   logger.log('i18n checking language ' + lang);

//   Object.keys(messages[lang]).forEach(category => {
//     Object.keys(messages[lang][category]).forEach(message => {

//       Object.keys(messages[lang]).forEach(categoryCompare => {
//         Object.keys(messages[lang][categoryCompare]).forEach(messageCompare => {
//           if (messages[lang][category][message] === messages[lang][categoryCompare][messageCompare]) {
//             if (category !== categoryCompare) { //  && message !== messageCompare
//               logger.warn('i18n duplicate found: "' + messages[lang][category][message] + '" in ' + lang + '.' + category + '.' + message + ' and '  + lang + '.' + categoryCompare + '.' + messageCompare)
//             }
//           }
//         })
//       })
//     })
//   })
// })

export default new VueI18n({
  locale: process.env.VUE_APP_I18N_LOCALE || 'en',
  fallbackLocale: process.env.VUE_APP_I18N_FALLBACK_LOCALE || 'en',
  messages
})
