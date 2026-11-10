module.exports = {
  moduleNameMapper: {
    "^@helpers/(.*)$": "<rootDir>/src/helpers/$1",
  },
  // Babel also needs to transform the ESM-only filename helpers.
  transformIgnorePatterns: ["/node_modules/(?!(filenamify|filename-reserved-regex)/)"],
};
