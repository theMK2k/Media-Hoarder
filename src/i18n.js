import Vue from 'vue'
import VueI18n from 'vue-i18n'

const moment = require("moment");

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

  logger.log('locales messages:', messages);

  return messages
}

const messages = loadLocaleMessages();

validateMessages(messages);

// Load Moment Locales
Object.keys(messages).forEach(key => {
  if (messages[key].moment) {
    moment.locale(key, messages[key].moment);
  }
})

// any other locale should have at least the keys, that "en" has
function validateMessages(messages) {
  Object.keys(messages).forEach(locale => {
    if (locale === 'en') {
      return;
    }
    
    const checkKeys = function (en, other) {
      Object.keys(en).forEach(key => {
        if (typeof en[key] === 'string') {
          if (en[key].includes('_')) {
            logger.warn(`Locale en contains underscore in key '${key}'`);
          }
        }
        
        if (other[key] === undefined) {
          logger.warn(`Locale ${locale} is missing key '${key}'!`);
          return;
        }

        if (typeof en[key] === 'object') {
          checkKeys(en[key], other[key]);
        }
        
        if (typeof other[key] === 'string') {
          if (other[key].includes('_')) {
            logger.warn(`Locale ${locale} contains underscore in key '${key}'`);
          }
        }
      })
    }

    checkKeys(messages.en, messages[locale]);
  })
}

export default new VueI18n({
  locale: process.env.VUE_APP_I18N_LOCALE || 'en',
  fallbackLocale: process.env.VUE_APP_I18N_FALLBACK_LOCALE || 'en',
  messages
})
