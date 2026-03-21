import util from "util";
import loglevel from "loglevel";

import { asciiLogo } from "@helpers/ascii-logo.js";

console.info(asciiLogo);

const logger = loglevel;

// Large object filtering: objects exceeding this char size get truncated to a shallow preview.
// Tunable at runtime via DevTools console: logger.maxLogSize = 5000
logger.maxLogSize = 1024;

// Array of string or regular expressions which, when the first 200 characters of the logged item match, the full log item is provided.
// Persisted to localStorage so patterns survive restarts.
// Use logger.logFullPatterns.push("pattern") in the console as before.
const LOG_FULL_PATTERNS_KEY = "logger.logFullPatterns";

function serializePatterns(patterns) {
  return JSON.stringify(
    patterns.map((p) => (p instanceof RegExp ? { __re: true, source: p.source, flags: p.flags } : p))
  );
}

function deserializePatterns(json) {
  try {
    return JSON.parse(json).map((p) => (p && p.__re ? new RegExp(p.source, p.flags) : p));
  } catch {
    return [];
  }
}

function savePatterns(patterns) {
  try {
    localStorage.setItem(LOG_FULL_PATTERNS_KEY, serializePatterns(patterns));
  } catch {
    // localStorage unavailable (e.g. main process)
  }
}

function loadPatterns() {
  try {
    const stored = localStorage.getItem(LOG_FULL_PATTERNS_KEY);
    return stored ? deserializePatterns(stored) : [];
  } catch {
    return [];
  }
}

// Auto-saving array: intercepts mutations so every push/splice/etc. persists automatically.
function createPersistentArray(initial) {
  const arr = [...initial];
  return new Proxy(arr, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === "function") {
        return function (...args) {
          const result = value.apply(target, args);
          // Save after any mutating method
          if (["push", "pop", "shift", "unshift", "splice", "sort", "reverse", "fill", "copyWithin"].includes(prop)) {
            savePatterns(target);
          }
          return result;
        };
      }
      return value;
    },
    set(target, prop, value) {
      target[prop] = value;
      // Save on index assignment (e.g. arr[0] = "x") or length change
      if (!isNaN(prop) || prop === "length") {
        savePatterns(target);
      }
      return true;
    },
  });
}

logger.logFullPatterns = createPersistentArray(loadPatterns());

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

  console.info(`ℹ️ Important information about the console logs of Media Hoarder ℹ️

The console logs are filtered by their log level, go to Settings and change it to receive more log messages or less.

The individual log messages are truncated if they contain large objects, arrays or strings.

To lift the truncation for some log entries, you can provide patterns which, if they match the first 200 characters of the log entry, will have the complete entry be logged out. Patterns are stored to survive restarts.

Example:

If you are interested in the full log output of "[fetchMedia] query ...", simply type the following in the console:

  logger.logFullPatterns.push("[fetchMedia] query")

and the next time you will get the full entry logged.

Simple strings (like "[fetchMedia] query" see above) as well as regular expressions are supported.

To clear all patterns type:

  logger.logFullPatterns.splice(0)

logger.logFullPatterns currently has ${logger.logFullPatterns.length} pattern(s)
`);
}

export default logger;
