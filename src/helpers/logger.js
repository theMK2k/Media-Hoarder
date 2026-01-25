import util from "util";
import loglevel from "loglevel";

const logger = loglevel;

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

logger.inspectObject = (obj) => {
  return util.inspect(obj, { showHidden: false, depth: null, colors: true });
};

export default logger;
