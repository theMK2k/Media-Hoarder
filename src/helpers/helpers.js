const util = require("util");
const path = require("path");
const fs = require("fs");
const requestretry = require("requestretry");
const os = require("os");
const filenamify = require("filenamify");
const hash = require("string-hash-64");
const _ = require("lodash");

const logger = require("./logger");

const isBuild = process.env.NODE_ENV === "production";
const isDevelopment = !isBuild;
const isWindows = process.platform === "win32";

const writeFileAsync = util.promisify(fs.writeFile);
const existsAsync = util.promisify(fs.exists);
const readdirAsync = util.promisify(fs.readdir);
const statAsync = util.promisify(fs.stat);
const readFileAsync = util.promisify(fs.readFile);
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

/**
 * Get a time string from a given runtime in seconds, e.g. 1:23:45
 * @param {number} runtimeSeconds
 * @returns
 */
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

/**
 * Get a minute-based time string from a given runtime in seconds, e.g. 123 min
 * @param {number} runtimeSeconds
 */
function getTimeStringMinutes(runtimeSeconds) {
  let result = "";

  if (typeof runtimeSeconds !== "number") {
    return "";
  }

  const minutes = Math.floor(runtimeSeconds / 60);
  result += `${minutes} min`;

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
      // logger.log(`[uppercaseEachWord] new beginning: "${text[i]}"`);
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

/**
 *
 * @param {*} directory
 * @returns
 */
function getLastDirectoryName(directory) {
  const arrDirectory = directory.split(path.sep);
  return arrDirectory[arrDirectory.length - 1];
}

function getMovieNameFromDirectory(directory) {
  logger.log("[getMovieNameFromDirectory] directory:", directory);

  let lastDirectory = getLastDirectoryName(directory);

  lastDirectory = lastDirectory.replace(/[.,_-]/g, " ");

  while (/\s\s/.test(lastDirectory)) {
    lastDirectory = lastDirectory.replace(/\s\s/g, " ");
  }

  logger.log("[getMovieNameFromDirectory] lastDirectory:", lastDirectory);

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
  logger.log("[getYearsFromFileName] filename:", filename);

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
    logger.log("[downloadFile] url:", url);

    if (!url) {
      return false;
    }

    const fullPath = getDataPath(targetPath);

    if (!redownload) {
      const exists = await existsAsync(targetPath);
      if (exists) {
        logger.log("[downloadFile]  target file already exists, abort");
        return true;
      }
    }

    logger.log("[downloadFile]  fetching from web");
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
    logger.log("[requestRetryStrategy] retrying options:", options);
  }

  return {
    mustRetry,
    options: options,
  };
}

function filenamifyExt(input) {
  let filename = filenamify(input, { maxLength: 10000 });

  if (filename.length > 160) {
    filename = filename.substr(0, 141) + "-" + hash(filename).toString(16);
  }

  return filename;
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

  optionsDerived.headers["User-Agent"] =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0";

  optionsDerived.timeout = 10000; // we set a 10s timeout

  // logger.log("[requestAsync] optionsDerived:", optionsDerived);

  if (imdbScraperWatchdogUseDumps) {
    const filename = `${filenamifyExt(optionsDerived.url ? optionsDerived.url : optionsDerived.uri)}.html`;
    if (fs.existsSync(filename)) {
      return {
        body: fs.readFileSync(
          `${filenamifyExt(optionsDerived.url ? optionsDerived.url : optionsDerived.uri)}.html`,
          "UTF8"
        ),
      };
    }
  }

  // return requestretryAsync(optionsDerived);
  // logger.log("[requestAsync] running requestretryAsync with optionsDerived:", optionsDerived);
  const response = await requestretryAsync(optionsDerived);

  logger.log("[requestAsync] response.body.length:", _.get(response, "body.length", 0));
  // logger.log("[requestAsync] response:", response);

  if (requestAsyncDumpToFile) {
    const filename = `${filenamifyExt(optionsDerived.url ? optionsDerived.url : optionsDerived.uri)}.html`;
    logger.log("[requestAsync] dumping to", filename);
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

/**
 * Compare a and b
 * @param {any} a value to compare
 * @param {any} b value to compare
 * @param {boolean} reverse if true, the comparison is reversed
 * @returns 0, 1 or -1
 */
function compare(a, b, reverse) {
  if (isNullOrUndefined(a) && isNullOrUndefined(b)) {
    return 0;
  }

  if (isNullOrUndefined(a)) {
    return reverse ? 1 : -1;
  }
  if (isNullOrUndefined(b)) {
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

async function listPath(basePath, scanPath) {
  if (!basePath || !scanPath) {
    throw Error("listPath called without basePath!");
  }

  const readdirResult = await readdirAsync(scanPath, { withFileTypes: true });

  const arrResult = [];

  // logger.log('listPath result:', result);

  for (let i = 0; i < readdirResult.length; i++) {
    const dirent = readdirResult[i];

    const fullPath = path.join(scanPath, dirent.name);

    const stats = await statAsync(fullPath);

    arrResult.push({
      fullPath: fullPath,
      fullDirectory: scanPath,
      fullPathLower: fullPath.toLowerCase(),

      relativePath: path.relative(basePath, fullPath),
      relativeDirectory: path.relative(basePath, scanPath),
      relativePathLower: path.relative(basePath, fullPath).toLowerCase(),

      Name: dirent.name,
      ExtensionLower: path.extname(dirent.name).toLowerCase(),
      isFile: dirent.isFile(),
      isDirectory: dirent.isDirectory(),
      Size: stats.size,
      file_created_at: stats.mtime,
      stats,
    });
  }

  logger.log("[listPath] arrResult:", arrResult);

  return arrResult;
}

function getMetaCriticClass(IMDB_metacriticScore) {
  const cssClasses = {};
  if (IMDB_metacriticScore <= 39) {
    cssClasses.MetaCriticRed = true;
  } else if (IMDB_metacriticScore <= 60) {
    cssClasses.MetaCriticYellow = true;
  } else {
    cssClasses.MetaCriticGreen = true;
  }

  return cssClasses;
}

function getIMDBRatingClass(IMDB_rating) {
  const cssClasses = {};

  if (!IMDB_rating) {
    cssClasses.IMDBRatingNone = true;
  } else if (IMDB_rating < 5) {
    cssClasses.IMDBRatingRed = true;
  } else if (IMDB_rating < 6) {
    cssClasses.IMDBRatingOrangeRed = true;
  } else if (IMDB_rating < 7) {
    cssClasses.IMDBRatingOrange = true;
  } else if (IMDB_rating < 8) {
    cssClasses.IMDBRatingOrangeGreen = true;
  } else if (IMDB_rating < 9) {
    cssClasses.IMDBRatingGreenOrange = true;
  } else if (IMDB_rating < 9.5) {
    cssClasses.IMDBRatingGreen = true;
  } else {
    cssClasses.IMDBRatingDarkGreen = true;
  }

  return cssClasses;
}

function randomizeArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[randomIndex]] = [arr[randomIndex], arr[i]];
  }
  return arr;
}

/**
 * Get a series episode's season and episode numbers from its name
 * @param {string} name
 */
function getSeriesEpisodeSeasonAndEpisodeNumbersFromName(name) {
  const result = {
    $Series_Season: null,
    $Series_Episodes_First: null,
    $Series_Episodes_Complete: null,
    $Series_Bonus_Number: null,
  };

  let hasMatched = false;

  // match [S01]E01[E02E04] (with or without leading zeros), if season is omitted, use 1
  const rxS_E_ = /(s\d+)?([eb]p?\d+)+/i;
  if (rxS_E_.test(name)) {
    hasMatched = true;

    const isolated = name.match(rxS_E_)[0];

    result.$Series_Season = isolated.match(/(s(\d+))?/i)[2];
    if (result.$Series_Season == undefined) {
      result.$Series_Season = 1;
    } else {
      result.$Series_Season = +result.$Series_Season;
    }

    if (/(s\d+)?(b\d+)+/i.test(isolated)) {
      // a bonus / extra
      result.$Series_Bonus_Number = +isolated.match(/b(\d+)/i)[1];
    } else {
      // a regular episode
      result.$Series_Episodes_Complete = isolated
        .match(/ep?\d+/gi)
        .map((item) => +item.toLowerCase().replace("ep", "").replace("e", ""));
      result.$Series_Episodes_First = result.$Series_Episodes_Complete[0];
    }
  }

  // match [S01]E[P]01-E[P]04 or S01E[P]01-04 (with or without leading zeros), if season is omitted, use 1
  const rxS_Erange = /s(\d+)e(\d+)-e?(\d+)/i;
  if (rxS_Erange.test(name)) {
    hasMatched = true;

    const matches = name.match(rxS_Erange);

    result.$Series_Season = +matches[1];
    const min = +matches[2];
    const max = +matches[3];

    result.$Series_Episodes_Complete = Array.from({ length: max - min + 1 }, (_, i) => i + min);
    result.$Series_Episodes_First = result.$Series_Episodes_Complete[0];
  }

  // match 1x5 if we have no previous matches
  const rx_x_ = /(\d+)x(\d+)/i;
  if (!hasMatched && rx_x_.test(name)) {
    hasMatched = true;

    result.$Series_Season = +name.match(rx_x_)[1];
    result.$Series_Episodes_Complete = [+name.match(rx_x_)[2]];
    result.$Series_Episodes_First = result.$Series_Episodes_Complete[0];
  }

  return result;
}

/**
 * Get 'movies', 'series' or 'episode' according to mediaItem's data
 * @param {*} mediaItem
 */
function getSpecificMediaType(mediaItem) {
  if (mediaItem.MediaType === "series") {
    if (mediaItem.Series_id_Movies_Owner) {
      return "Episodes";
    } else {
      return "Series";
    }
  }

  return "Movies";
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
  getTimeStringMinutes,
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
  listPath,
  readFileAsync,
  getMetaCriticClass,
  getIMDBRatingClass,
  filenamifyExt,
  randomizeArray,
  getSeriesEpisodeSeasonAndEpisodeNumbersFromName,
  getSpecificMediaType,
};
