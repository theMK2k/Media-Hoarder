const logger = require("loglevel");

logger.group = (label) => {
  console.group(label);
};

logger.groupCollapsed = (label) => {
  if (logger.getLevel() < 2) {
    console.groupCollapsed(label);
  } else {
    console.group(label);
  }
};

logger.groupEnd = () => {
  console.groupEnd();
};

module.exports = logger;
