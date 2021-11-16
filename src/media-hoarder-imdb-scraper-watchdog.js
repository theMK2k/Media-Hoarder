/* eslint-disable no-console */
const chalk = require("chalk");
const minimist = require("minimist");
const nodemailer = require("nodemailer");

const logger = require("./helpers/logger");
const helpers = require("./helpers/helpers");
const imdbScraperTests = require("./tests/imdb-scraper-tests");

const cmdArguments = minimist(process.argv.slice(2));

const config = {
  logLevel: cmdArguments.logLevel != undefined ? cmdArguments.logLevel : 2,
  smtpHost: cmdArguments.smtpHost,
  smtpPort: cmdArguments.smtpPort ? +cmdArguments.smtpPort : null,
  smtpUser: cmdArguments.smtpUser,
  smtpPass: cmdArguments.smtpPass,
  smtpSecure: cmdArguments.smtpPort == 465 ? true : false,
  smtpSendLevel:
    cmdArguments.smtpSendLevel != undefined ? +cmdArguments.smtpSendLevel : 2,
  smtpReceiver: cmdArguments.smtpReceiver,
  dumpScrapedHTML: !!cmdArguments.dumpScrapedHTML,
  useDumps: !!cmdArguments.useDumps,
};

const status = {
  SUCCESS: 0,
  WARNING: 1,
  ERROR: 2,
};

logger.setLevel(config.logLevel); // set to 0 for log output of imdb-scraper, else 2

logger.info("cmdArguments:", cmdArguments);

if (config.dumpScrapedHTML) {
  helpers.setRequestAsyncDumpToFile(true);
}

if (config.useDumps) {
  helpers.setIMDBScraperWatchdogUseDumps(true);
}

const log = {
  messages: [],
  maxLevel: 0,
};

(async () => {
  logger.info("Syntax: media-hoarder-imdb-scraper-watchdog [options]");
  logger.info("");
  logger.info("options:");
  logger.info(
    "         --logLevel=<logLevel>                                log level, default: 2"
  );
  logger.info(
    "         --dumpScrapedHTML                                    dump scraped html to file"
  );
  logger.info(
    "         --useDumps                                           do not actually scrape but use previously dumped files"
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
  logger.info("used config:", JSON.stringify(config, null, 2));

  addLogEntry(await imdbScraperTests.testIMDBmainPageData());
  addLogEntry(await imdbScraperTests.testIMDBmainPageData2());
  addLogEntry(await imdbScraperTests.testIMDBplotSummary());
  addLogEntry(await imdbScraperTests.testIMDBreleaseinfo());
  addLogEntry(await imdbScraperTests.testIMDBtechnicalData());
  addLogEntry(await imdbScraperTests.testIMDBParentalGuideData());
  addLogEntry(await imdbScraperTests.testIMDBFullCreditsData());
  addLogEntry(await imdbScraperTests.testIMDBCompaniesData());
  addLogEntry(await imdbScraperTests.testIMDBPersonData());
  addLogEntry(await imdbScraperTests.testIMDBTrailerMediaURLs());
  addLogEntry(await imdbScraperTests.testIMDBplotKeywords());
  addLogEntry(await imdbScraperTests.testIMDBFilmingLocations());
  addLogEntry(await imdbScraperTests.testIMDBRatingDemographics());
  addLogEntry(await imdbScraperTests.testIMDBSuggestion());
  addLogEntry(await imdbScraperTests.testIMDBAdvancedTitleSearch());
  addLogEntry(await imdbScraperTests.testIMDBFind());

  await checkSendMail();
})();

function addLogEntry(testResult) {
  const messageEntry = {
    message: `${chalk.white("[")}${
      testResult.status === status.SUCCESS
        ? chalk.green("OK")
        : testResult.status === status.WARNING
        ? chalk.yellow("WARN")
        : testResult.status === status.ERROR
        ? chalk.red("FAIL")
        : chalk.red("EXCEPTION")
    }${chalk.white("]")} ${testResult.name}`,
  };

  log.messages.push(messageEntry);

  console.log(messageEntry.message);

  if (testResult.status !== status.SUCCESS) {
    messageEntry.details = [];

    testResult.log.forEach((entry) => {
      console.log(entry);
      messageEntry.details.push(entry);
    });
  }

  if (testResult.status > log.maxLevel) {
    log.maxLevel = testResult.status;
  }
}

async function checkSendMail() {
  try {
    logger.info(
      "checkSendMail log.maxLevel:",
      log.maxLevel,
      "config.smtpSendLevel:",
      config.smtpSendLevel
    );

    if (log.maxLevel < config.smtpSendLevel) {
      return;
    }

    logger.info("we should send a mail");

    if (!config.smtpHost) {
      logger.warn("ERROR: smtpHost not defined");
      return;
    }
    if (!config.smtpPort) {
      logger.warn("ERROR: smtpPort not defined");
      return;
    }
    if (!config.smtpReceiver) {
      logger.warn("ERROR: smtpReceiver not defined");
      return;
    }

    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: !!(config.smtpPort === 465), // true for 465, false for other ports
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    });

    // send mail with defined transport object
    // const info =
    await transporter.sendMail({
      from: '"Media Hoarder IMDB Scraper Watchdog" <imdb-scraper-watchdog@hoarder.software>', // sender address
      to: config.smtpReceiver, // "bar@example.com, baz@example.com", // list of receivers
      subject: `IMDB Scraper Watchdog: ${
        log.maxLevel === 2
          ? "ERROR"
          : log.maxLevel === 1
          ? "WARNING"
          : "SUCCESS"
      }`, // Subject line
      text: JSON.stringify(log.messages, null, 2),
    });

    logger.info("mail sent.");
  } catch (e) {
    logger.error(e);
  }
}
