const util = require("util");
const path = require("path");
const fs = require("fs");
const request = require("request");

// import path from 'path'

const logger = require("loglevel");

const isBuild = process.env.NODE_ENV === "production";
const isWindows = process.platform === "win32";

const writeFileAsync = util.promisify(fs.writeFile);
const existsAsync = util.promisify(fs.exists);
const requestGetAsync = util.promisify(request.get);

function getPath(relativePath) {
  /* eslint-disable no-undef */
  return path.join(isBuild ? __dirname : __static, "../", relativePath);
  /* eslint-enable no-undef */
}

function getTimeString(runtimeSeconds) {
  let result = "";

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
  logger.log("uppercaseEachWord:", input);

  let isNewBeginning = true;
  let text = input;

  for (let i = 0; i < text.length; i++) {
    if (/[\s\-,.:"'!§$%&/()=?*+~#;_]/.test(text[i])) {
      isNewBeginning = true;
    } else {
      if (isNewBeginning) {
        text = text.substr(0, i) + text[i].toUpperCase() + text.substr(i + 1);
        isNewBeginning = false;
      }
    }
  }

  logger.log("uppercaseEachWord result:", text);
  return text;
}

function getMovieNameFromFileName(filename) {
  let filenameFiltered = filename;

  if (filenameFiltered.includes(".")) {
    filenameFiltered = filenameFiltered
      .split(".")
      .slice(0, -1)
      .join(".");
  }

  filenameFiltered = filenameFiltered.replace(/\.,_/g, " ");

  return filenameFiltered;
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

    const fullPath = getPath(targetPath);

    if (!redownload) {
      const exists = await existsAsync(targetPath);
      if (exists) {
        logger.log("  target file already exists, abort");
        return true;
      }
    }

    logger.log("  fetching from web");
    const response = await requestGetAsync({ url, encoding: null });
    const data = response.body;

    await writeFileAsync(fullPath, data, "binary");

    return true;
  } catch (err) {
    logger.error(err);
    return false;
  }
}

export {
  isWindows,
  getPath,
  getTimeString,
  uppercaseEachWord,
  getMovieNameFromFileName,
  getYearsFromFileName,
  getDirectoryName,
  downloadFile
};
