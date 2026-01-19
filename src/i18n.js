import { createI18n } from "vue-i18n";

const fs = require("fs");
const path = require("path");

// const moment = require("moment");

const logger = require("./helpers/logger");
const helpers = require("./helpers/helpers");

function loadLocaleMessages() {
  const locales = require.context("./i18n", true, /[A-Za-z0-9-_,\s]+\.json$/i);
  logger.log(`[loadLocaleMessages] locales:`, locales);

  const messages = {};
  locales.keys().forEach((key) => {
    const matched = key.match(/([A-Za-z0-9-_]+)\./i);
    if (matched && matched.length > 1) {
      const locale = matched[1];
      messages[locale] = locales(key);
    }
  });

  const extraLocales = {};
  const extraLocalesPath = helpers.getDataPath("i18n");

  if (fs.existsSync(extraLocalesPath)) {
    const extraLocalesFiles = fs.readdirSync(extraLocalesPath);

    logger.log("[loadLocaleMessages] extraLocalesFiles:", extraLocalesFiles);

    extraLocalesFiles.forEach((extraLocalesFile) => {
      const rx = /^([A-Za-z0-9-_]+)\.json$/;
      if (!rx.test(extraLocalesFile)) {
        logger.log(
          `[loadLocaleMessages] skipping locales file ${extraLocalesFile} as it doesn't match expected format`
        );
      }

      const locale = extraLocalesFile.match(rx)[1];

      logger.log(
        `[loadLocaleMessages] loadLocaleMessages using messages for ${locale} from ${extraLocalesFile} in i18n directory`
      );

      try {
        extraLocales[locale] = JSON.parse(fs.readFileSync(path.join(extraLocalesPath, extraLocalesFile)));
      } catch (err) {
        logger.error(`[loadLocaleMessages] ERROR while opening '${extraLocalesFile}:`, err);
      }
    });

    Object.keys(extraLocales).forEach((key) => {
      messages[key] = extraLocales[key];
    });
  }

  // Print all messages to the console (in order to count words)
  // function printMessage(msg) {
  //   if (typeof msg === 'string') {
  //     logger.log(msg);
  //   }

  //   if (typeof msg === 'object') {
  //     Object.keys(msg).forEach(key => {
  //       printMessage(msg[key]);
  //     })
  //   }
  // }

  // printMessage(messages.en);

  logger.log("[loadLocaleMessages] messages:", messages);
  return messages;
}

const messages = loadLocaleMessages();

validateMessages(messages);

// Load Moment Locales
// Object.keys(messages).forEach((key) => {
//   if (messages[key].moment) {
//     moment.locale(key, messages[key].moment);
//   }
// });

/**
 * check that
 * - any other locale should have at least the keys, that "en" has
 * - content does not include "_"
 * @param {Object} messages
 */
function validateMessages(messages) {
  Object.keys(messages).forEach((locale) => {
    if (locale === "en") {
      return;
    }

    const checkKeys = function (en, other) {
      Object.keys(en).forEach((key) => {
        if (typeof en[key] === "string") {
          if (en[key].includes("_")) {
            logger.warn(`[validateMessages] Locale en contains underscore in key '${key}'`);
          }
        }

        if (other[key] === undefined) {
          logger.warn(`[validateMessages] Locale ${locale} is missing key '${key}'!`);
          return;
        }

        if (typeof en[key] === "object") {
          checkKeys(en[key], other[key]);
        }

        if (typeof other[key] === "string") {
          if (other[key].includes("_")) {
            logger.warn(`[validateMessages] Locale ${locale} contains underscore in key '${key}'`);
          }
        }
      });
    };

    checkKeys(messages.en, messages[locale]);
  });
}

// vue-i18n 9 uses createI18n instead of new VueI18n
// legacy: false enables Composition API mode, but we use legacy: true for Options API compatibility
export default createI18n({
  legacy: true, // Use legacy mode for Options API ($t, $tc, etc.)
  globalInjection: true, // Enable $t in templates
  locale: process.env.VUE_APP_I18N_LOCALE || "en",
  fallbackLocale: process.env.VUE_APP_I18N_FALLBACK_LOCALE || "en",
  messages,
});
