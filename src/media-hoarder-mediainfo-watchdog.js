/**
 * MediaInfo watchdog
 * - only works on Debian 10 (Buster)
 * - downloads and installs latest mediainfo CLI packs (if newer than already installed ones)
 * - performs analysis on test data
 * - checks against expected result
 */

const child_process = require("child_process");
const util = require("util");

// const nodemailer = require("nodemailer");

const logger = require("./helpers/logger");
const helpers = require("./helpers/helpers");

const execAsync = util.promisify(child_process.exec);

logger.setLevel(0);

logger.log("new year's eve:", helpers.uppercaseEachWord("new year's eve"));

const baseURL = "https://mediaarea.net";

async function fetchRemoteVersionLinks() {
  const result = {
    version: null,
    mediainfoCLIDownloadLink: null,
    libmediainfoDownloadLink: null,
    libzenDownloadLink: null,
  };

  const response = await helpers.requestAsync({
    url: "https://mediaarea.net/en/MediaInfo/Download/Debian",
  });
  const html = response.body;

  // https://mediaarea.net/download/binary/mediainfo/21.09/mediainfo_21.09-1_amd64.Debian_10.deb
  // https://mediaarea.net/download/binary/libmediainfo0/21.09/libmediainfo0v5_21.09-1_i386.Debian_10.deb
  // https://mediaarea.net/download/binary/libzen0/0.4.39/libzen0v5_0.4.39-1_i386.Debian_10.deb

  const rxVersion =
    /<a href=".*?download\/binary\/mediainfo\/(\d+\.\d+)\/mediainfo_.*?_amd64.Debian_10.deb"/;

  if (!rxVersion.test(html)) {
    throw new Error("Cannot determine MediaInfo version");
  }

  result.version = html.match(rxVersion)[1];

  const rxmediainfoCLIDownloadLink =
    /<a href="(.*?download\/binary\/mediainfo\/\d+\.\d+\/mediainfo_.*?_amd64\.Debian_10\.deb)"/;

  if (!rxmediainfoCLIDownloadLink.test(html)) {
    throw new Error("Cannot determine MediaInfo CLI download link");
  }

  result.mediainfoCLIDownloadLink = `${baseURL}${html
    .match(rxmediainfoCLIDownloadLink)[1]
    .replace("//", "/")}`;

  const rxlibmediainfoDownloadLink =
    /<a href="(.*?download\/binary\/libmediainfo0\/\d+\.\d+\/libmediainfo.*?_amd64\.Debian_10\.deb)"/;

  if (!rxlibmediainfoDownloadLink.test(html)) {
    throw new Error("Cannot determine libmediainfo download link");
  }

  result.libmediainfoDownloadLink = `${baseURL}${html
    .match(rxlibmediainfoDownloadLink)[1]
    .replace("//", "/")}`;

  const rxlibzenDownloadLink =
    /<a href="(.*?download\/binary\/libzen0\/.*?\/libzen.*?_amd64.Debian_10.deb)"/;

  if (!rxlibzenDownloadLink.test(html)) {
    throw new Error("Cannot determine libzen download link");
  }

  result.libzenDownloadLink = `${baseURL}${html
    .match(rxlibzenDownloadLink)[1]
    .replace("//", "/")}`;

  return result;
}

async function getLocalMediaInfoVersion() {
  try {
    const { stdout, stderr } = await execAsync(`mediainfo --version`);

    logger.log("[getLocalMediaInfoVersion] stdout:", stdout);
    logger.log("[getLocalMediaInfoVersion] stderr:", stderr);

    return null;
  } catch (err) {
    // ignore
    return null;
  }
}

async function checkAndDownloadMediaInfo() {
  const downloadLinks = await fetchRemoteVersionLinks();

  const localVersion = await getLocalMediaInfoVersion();

  logger.log("downloadLinks:", downloadLinks);
  logger.log("localVersion:", localVersion);

  if (localVersion && downloadLinks && downloadLinks.version === localVersion) {
    logger.log("Same version as installed MediaInfo CLI - abort.");
    return false;
  }

  logger.log("Remote version is newer");

  if (localVersion) {
    // TODO: apt-get remove packs
    logger.log("TODO: remove old version");
  }

  // TODO: download packs
  // TODO: install packs: libzen, libmediainfo, mediainfo
  if (
    !(await helpers.downloadFile(
      downloadLinks.mediainfoCLIDownloadLink,
      "/tmp/mediainfo.deb",
      true
    ))
  ) {
    throw new Error("Error while downloading MediaInfo CLI");
  }

  if (
    !(await helpers.downloadFile(
      downloadLinks.libmediainfoDownloadLink,
      "/tmp/libmediainfo.deb",
      true
    ))
  ) {
    throw new Error("Error while downloading libMediaInfo");
  }

  if (
    !(await helpers.downloadFile(
      downloadLinks.libzenDownloadLink,
      "/tmp/libzen.deb",
      true
    ))
  ) {
    throw new Error("Error while downloading libZen");
  }

  return true;
}

(async () => {
  try {
    logger.info("Syntax: media-hoarder-mediainfo-watchdog [options]");
    logger.info("");
    logger.info("options:");
    logger.info(
      "         --logLevel=<logLevel>                                log level, default: 2"
    );
    logger.info(
      "         --dumpResults                                        dump media info analysis results to .json files"
    );
    logger.info(
      "         --smtpHost=<host address>                            smtp host address, default: null"
    );
    logger.info(
      "         --smtpPort=<port number>                             smtp port, default: null"
    );
    logger.info(
      "         --smtpUser=<username>                                smtp authentication user, default: null"
    );
    logger.info(
      "         --smtpPass=<password>                                smtp authentication password, default: null"
    );
    logger.info(
      "         --smtpReceiver=<receiver mail address>               mail address for receiver of error/warning mails, default: null"
    );
    logger.info(
      "         --smtpSendLevel=<level when mail is to be sent>      SUCCESS: 0, WARNING: 1, ERROR: 2, default: 2"
    );

    logger.info("");

    if (await checkAndDownloadMediaInfo()) {
      process.exit(0);
    }
  } catch (err) {
    logger.error(err);
    // TODO: mail the error out
  }
})();
