import util from "util";
import loglevel from "loglevel";

const logger = loglevel;

// Large object filtering: objects exceeding this char size get truncated to a shallow preview.
// Tunable at runtime via DevTools console: logger.maxLogSize = 5000
logger.maxLogSize = 1024;

// Array of string or regular expresions which, when the first 200 characters of the logged item match, the full log item is provided
logger.logFullPatternss = [];

const originalFactory = logger.methodFactory;
logger.methodFactory = (methodName, logLevel, loggerName) => {
  const rawMethod = originalFactory(methodName, logLevel, loggerName);
  return (...args) => {
    // Check if any string arg's first 200 chars matches a logFullPatterns entry
    const matchesFullPattern =
      logger.logFullPatterns.length > 0 &&
      args.some((arg) => {
        if (typeof arg !== "string") return false;
        const head = arg.substring(0, 200);
        return logger.logFullPatterns.some((pattern) =>
          pattern instanceof RegExp ? pattern.test(head) : head.includes(pattern)
        );
      });

    if (matchesFullPattern) {
      rawMethod(...args);
      return;
    }

    const filtered = args.map((arg) => {
      if (typeof arg === "string") {
        if (arg.length > logger.maxLogSize) {
          return `${arg.substring(0, logger.maxLogSize)} <truncated ${arg.length - logger.maxLogSize} chars>`;
        }
        return arg;
      }
      if (typeof arg !== "object" || arg === null) {
        return arg;
      }
      let size;
      try {
        size = JSON.stringify(arg).length;
      } catch {
        // circular reference or other stringify failure — always truncate
        size = logger.maxLogSize + 1;
      }
      if (size > logger.maxLogSize) {
        if (Array.isArray(arg)) {
          return `<truncated, size: ${arg.length} items>`;
        }
        return `<truncated, size: ${size} bytes>`;
      }
      return arg;
    });
    rawMethod(...filtered);
  };
};
logger.setLevel(logger.getLevel()); // reapply to activate the custom factory

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

if (typeof window !== "undefined") {
  window.logger = logger;

  setTimeout(() => {
    console.info(`ℹ️ Important information about the console logs of Media Hoarder ℹ️
      
The console logs are filtered by their log level, go to Settings and change it to receive more log messages or less.

The individual log messages are truncated if they contain large objects, arrays or strings.

To lift the truncation for some log entries, you can provide patterns which, if they match the first 200 characters of the log entry, will have the complete entry be logged out.

Example:

If you are interested in the full log output of "[fetchMedia] query ...", simply type this in the console:

logger.logFullPatterns.push("[fetchMedia] query")

and the next time you will get the full entry logged.`);
  }, 10);
}

export default logger;
