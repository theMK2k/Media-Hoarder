const logger = require("loglevel");

logger.group = (label) => {
  if (logger.getLevel() < 2) {
    console.group(label);
  } else {
    console.group(label);
  }
};

logger.groupEnd = () => {
  console.groupEnd();
};

module.exports = logger;
