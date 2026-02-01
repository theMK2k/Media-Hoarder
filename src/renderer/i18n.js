import { createI18n } from "vue-i18n";
import fs from "fs";
import path from "path";
import logger from "@helpers/logger.js";
import * as helpers from "@helpers/helpers.js";

// Import locale files directly (Vite doesn't support require.context)
import en from "./i18n/en.json";
import de from "./i18n/de.json";
import fr from "./i18n/fr.json";

function loadLocaleMessages() {
  // Static locale messages from bundled JSON files
  const messages = {
    en,
    de,
    fr,
  };

  logger.log(`[loadLocaleMessages] loaded bundled locales:`, Object.keys(messages));

  // Load extra locale files from the data directory at runtime
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
        return;
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

  logger.log("[loadLocaleMessages] messages:", messages);
  return messages;
}

const messages = loadLocaleMessages();

validateMessages(messages);

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
  warnHtmlInMessage: "off",
});
