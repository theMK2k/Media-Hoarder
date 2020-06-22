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
  return messages
}

const messages = loadLocaleMessages();

logger.log('locale messages:', messages);

// Load Moment Locales
Object.keys(messages).forEach(key => {
  if (messages[key].moment) {
    moment.locale(key, messages[key].moment);
  }
})

export default new VueI18n({
  locale: process.env.VUE_APP_I18N_LOCALE || 'en',
  fallbackLocale: process.env.VUE_APP_I18N_FALLBACK_LOCALE || 'en',
  messages
})
