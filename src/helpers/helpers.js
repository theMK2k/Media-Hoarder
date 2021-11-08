const util = require("util");
const path = require("path");
const fs = require("fs");
const requestretry = require("requestretry");
const os = require("os");
const filenamify = require("filenamify");

const logger = require("./logger");

const isBuild = process.env.NODE_ENV === "production";
const isDevelopment = !isBuild;
const isWindows = process.platform === "win32";

const writeFileAsync = util.promisify(fs.writeFile);
const existsAsync = util.promisify(fs.exists);
const requestretryAsync = util.promisify(requestretry);

const isPORTABLE = false; // DON'T TOUCH! This is handled by set-portable.js

let requestAsyncDumpToFile = false; // Temporarily set to true and every response of requestAsync will be dumped to a file

function setRequestAsyncDumpToFile(value) {
  logger.log("[setRequestAsyncDumpToFile] value:", value);
  requestAsyncDumpToFile = value;
}

let imdbScraperWatchdogUseDumps = false;

function setIMDBScraperWatchdogUseDumps(value) {
  logger.log("[setIMDBScraperWatchdogUseDumps] value:", value);
  imdbScraperWatchdogUseDumps = value;
}

/**
 * get absolute path for a given relative path depending wether the app is explicitly PORTABLE/!PORTABLE or in dev-mode (run via npm start) or built:
 * in portable/dev mode it is APPDIR/data/relativePath
 * in non-portable/non-dev mode it is ~/.media-hoarder/relativePath
 * @param {string} relativePath
 */
function getDataPath(relativePath) {
  if (isDevelopment || isPORTABLE) {
    return path.join(getStaticPath("data"), relativePath);
  }

  return path.join(os.homedir(), ".media-hoarder", relativePath);
}

/**
 * get absolute path for a given relative path from APPDIR/data depending on isBuild
 * @param {string} relativePath
 */
function getStaticPath(relativePath) {
  /* eslint-disable no-undef */
  return path.join(isBuild ? __dirname : __static, "../", relativePath);
  /* eslint-enable no-undef */
}

function getTimeString(runtimeSeconds) {
  let result = "";

  if (typeof runtimeSeconds !== "number") {
    return "";
  }

  const hours = Math.floor(runtimeSeconds / (60 * 60));
  if (hours > 0) {
    result += `${hours}:`;
  }

  const minutes = Math.floor(runtimeSeconds / 60) % 60;
  result += `${minutes < 10 ? "0" + minutes : minutes}:`;

  const seconds = runtimeSeconds % 60;
  result += seconds < 10 ? "0" + seconds : seconds;

  return result;
}

function uppercaseEachWord(input) {
  if (!input) {
    return input;
  }

  let isNewBeginning = true;
  let text = input;

  for (let i = 0; i < text.length; i++) {
    if (/[\s\-,.:"!§$%&/()=?*+~#;_]/.test(text[i])) {
      isNewBeginning = true;
    } else {
      if (isNewBeginning) {
        text = text.substr(0, i) + text[i].toUpperCase() + text.substr(i + 1);
        isNewBeginning = false;
      }
    }
  }

  return text;
}

function getMovieNameFromFileName(filename) {
  let filenameFiltered = filename;

  if (filenameFiltered.includes(".")) {
    filenameFiltered = filenameFiltered.split(".").slice(0, -1).join(".");
  }

  filenameFiltered = filenameFiltered.replace(/[.,_-]/g, " ");

  while (/\s\s/.test(filenameFiltered)) {
    filenameFiltered = filenameFiltered.replace(/\s\s/g, " ");
  }

  return filenameFiltered;
}

function getLastDirectoryName(directory) {
  const arrDirectory = directory.split(path.sep);
  return arrDirectory[arrDirectory.length - 1];
}

function getMovieNameFromDirectory(directory) {
  logger.log("getMovieNameFromDirectory directory:", directory);

  let lastDirectory = getLastDirectoryName(directory);

  lastDirectory = lastDirectory.replace(/[.,_-]/g, " ");

  while (/\s\s/.test(lastDirectory)) {
    lastDirectory = lastDirectory.replace(/\s\s/g, " ");
  }

  return lastDirectory;
}

function cleanupFileName(filename) {
  let filenameFiltered = getMovieNameFromFileName(filename);

  filenameFiltered = filenameFiltered.replace(/[()[\]]/g, " ");

  while (/\s\s/.test(filenameFiltered)) {
    filenameFiltered = filenameFiltered.replace(/\s\s/g, " ");
  }

  return filenameFiltered;
}

function cleanupDirectoryName(directory) {
  let nameFiltered = getMovieNameFromDirectory(directory);

  nameFiltered = nameFiltered.replace(/[()[\]]/g, " ");

  while (/\s\s/.test(nameFiltered)) {
    nameFiltered = nameFiltered.replace(/\s\s/g, " ");
  }

  return nameFiltered;
}

function getYearsFromFileName(filename, includeEmptyString) {
  const maxYear = new Date().getFullYear() + 2;

  const arrYears = [];

  const rxYears = /[^\d](\d\d\d\d)[^\d]/g;

  let match = null;

  // eslint-disable-next-line no-cond-assign
  while ((match = rxYears.exec(filename))) {
    const year = match[1];

    if (parseInt(year) < 1850) {
      continue;
    }

    if (parseInt(year) > maxYear) {
      continue;
    }

    if (!arrYears.find((y) => y == year)) {
      arrYears.push(year);
    }
  }

  if (includeEmptyString) {
    arrYears.push("");
  }

  return arrYears;
}

function getDirectoryName(pathString) {
  const arrDirs = pathString.split(path.sep);
  for (let i = arrDirs.length - 1; i >= 0; i--) {
    if (arrDirs[i] !== "") {
      return arrDirs[i];
    }
  }

  return "";
}

async function downloadFile(url, targetPath, redownload) {
  try {
    logger.log("downloadFile url:", url);

    if (!url) {
      return false;
    }

    const fullPath = getDataPath(targetPath);

    if (!redownload) {
      const exists = await existsAsync(targetPath);
      if (exists) {
        logger.log("  target file already exists, abort");
        return true;
      }
    }

    logger.log("  fetching from web");
    const response = await requestAsync({ url, encoding: null });
    const data = response.body;

    await writeFileAsync(fullPath, data, "binary");

    return true;
  } catch (err) {
    logger.error(err);
    return false;
  }
}

function requestRetryStrategy(err, response, body, options) {
  const mustRetry = !!err;

  if (mustRetry) {
    logger.log("request retry - options:", options);
  }

  return {
    mustRetry,
    options: options,
  };
}

async function requestAsync(options) {
  let optionsDerived = {};

  if (typeof options === "string") {
    optionsDerived.url = options;
  } else {
    optionsDerived = Object.assign({}, options);
  }

  if (!optionsDerived.method) {
    optionsDerived.method = "GET";
  }

  if (!optionsDerived.retryStrategy) {
    optionsDerived.retryStrategy = requestRetryStrategy;
  }

  if (!optionsDerived.maxAttempts) {
    optionsDerived.maxAttempts = 3;
  }

  if (!optionsDerived.retryDelay) {
    optionsDerived.retryDelay = 1000;
  }

  // always provide header "Accept-Language": "en"
  if (!optionsDerived.headers) {
    optionsDerived.headers = {};
  }

  if (!optionsDerived.headers["Accept-Language"]) {
    optionsDerived.headers["Accept-Language"] = "en";
  }

  optionsDerived.timeout = 10000; // we set a 10s timeout

  logger.log("request options:", optionsDerived);

  if (imdbScraperWatchdogUseDumps) {
    const filename = `${filenamify(
      optionsDerived.url ? optionsDerived.url : optionsDerived.uri
    )}.html`;
    if (fs.existsSync(filename)) {
      return {
        body: fs.readFileSync(
          `${filenamify(
            optionsDerived.url ? optionsDerived.url : optionsDerived.uri
          )}.html`,
          "UTF8"
        ),
      };
    }
  }

  // return requestretryAsync(optionsDerived);
  const response = await requestretryAsync(optionsDerived);

  if (requestAsyncDumpToFile) {
    const filename = `${filenamify(
      optionsDerived.url ? optionsDerived.url : optionsDerived.uri
    )}.html`;
    logger.log("dumping to", filename);
    await writeFileAsync(`./${filename}`, response.body);
  }

  return response;
}

function ensureDirectorySync(path) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }
}

function nz(value, valueIfNull) {
  if (typeof value === "undefined" || value === null) {
    return valueIfNull;
  }

  return value;
}

function getStarRatingString(rating) {
  let label = "";

  for (let i = 1; i < 6; i++) {
    const diff = rating - (i - 1);

    if (diff >= 1) {
      label += "★";
    }
    if (diff == 0.5) {
      label += "½"; // we have to wait until unicode 2BEA is available (http://www.fileformat.info/info/unicode/char/002BEA/index.htm)
    }
    if (diff <= 0) {
      label += "☆";
    }
  }

  return label;
}

function isNullOrUndefined(value) {
  return value == null || typeof value === "undefined";
}

function compare(a, b, reverse) {
  if (this.isNullOrUndefined(a) && this.isNullOrUndefined(b)) {
    return 0;
  }

  if (this.isNullOrUndefined(a)) {
    return reverse ? 1 : -1;
  }
  if (this.isNullOrUndefined(b)) {
    return reverse ? -1 : 1;
  }

  if (a > b) {
    return reverse ? -1 : 1;
  }
  if (a < b) {
    return reverse ? 1 : -1;
  }

  return 0;
}

export {
  isWindows,
  isPORTABLE,
  isDevelopment,
  writeFileAsync,
  existsAsync,
  getDataPath,
  getStaticPath,
  getTimeString,
  uppercaseEachWord,
  getMovieNameFromFileName,
  getMovieNameFromDirectory,
  getYearsFromFileName,
  getDirectoryName,
  downloadFile,
  setRequestAsyncDumpToFile,
  requestAsync,
  cleanupFileName,
  cleanupDirectoryName,
  getLastDirectoryName,
  ensureDirectorySync,
  nz,
  getStarRatingString,
  setIMDBScraperWatchdogUseDumps,
  imdbScraperWatchdogUseDumps,
  isNullOrUndefined,
  compare,
};
