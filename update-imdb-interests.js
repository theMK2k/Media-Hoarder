// https://www.imdb.com/interest/all/
const _ = require("lodash");

const logger = require("./src/helpers/logger");
const helpers = require("./src/helpers/helpers");

logger.setLevel(0);

helpers.setRequestAsyncDumpToFile(true);

(async () => {
  const imdbInterestData = [];

  // TODO: load from JSON for prefilling

  try {
    // TODO: loop
    let failedPages = 0;
    let counter = 0;

    for (counter = 1; counter <= 9999; counter++) {
      // NOTE: IMDB JSON is always nested in props.pageProps
      const imdbInterestDataItem = {
        IMDB_Interest_ID: null, // interestData.id; e.g. "in0000001"
        Name: null, // interestData.primaryText.id; e.g. "Action"
        Category: null, // interestData.secondaryText.id; e.g. "Genre"
        Description: null, // interestData.description.value.plainText; e.g. "The action genre features fast-paced..."
        Image_URL: null, // interestData.primaryImage.url; e.g. "https://m.media-amazon.com/images/G/01/imdb/images-ANDW73HA/imdb_fb_logo._CB1542065250_.png"
        Image_Caption: null, // interestData.primaryImage.caption.plainText
        Similar_Interests_IDs: [], // interestData.similarInterests[].id; e.g. ["in0000002", "in0000003"]
      };

      const url = `https://www.imdb.com/interest/in0000${counter < 100 ? "0" : ""}${
        counter < 10 ? "0" : ""
      }${counter}/`;

      const response = await helpers.requestAsync(url);

      if (response.statusCode > 399) {
        throw new Error(`ERROR: IMDB Main Page gave HTTP status code ${response.statusCode}. URL used: ${url}`);
      }

      const html = response.body;

      const jsonDataNext = JSON.parse(
        (html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/) || [null, "{}"])[1]
      );

      const interestData = _.get(jsonDataNext, "props.pageProps.interestData");

      imdbInterestDataItem.IMDB_Interest_ID = _.get(interestData, "id");
      imdbInterestDataItem.Name = _.get(interestData, "primaryText.id");
      imdbInterestDataItem.Category = _.get(interestData, "secondaryText.id");
      imdbInterestDataItem.Description = _.get(interestData, "description.value.plainText");
      imdbInterestDataItem.Image_URL = _.get(interestData, "primaryImage.url");
      imdbInterestDataItem.Image_Caption = _.get(interestData, "primaryImage.caption.plainText");
      imdbInterestDataItem.Similar_Interests_IDs = _.get(interestData, "similarInterests.edges", []).map(
        (similarInterest) => _.get(similarInterest, "node.id")
      );

      // logger.log(imdbInterestDataItem);
      if (imdbInterestDataItem.IMDB_Interest_ID && imdbInterestDataItem.Name && imdbInterestDataItem.Category) {
        logger.log(
          "adding/updating",
          imdbInterestDataItem.Category,
          imdbInterestDataItem.Name,
          `(${imdbInterestDataItem.IMDB_Interest_ID})`
        );
        imdbInterestData.push(imdbInterestDataItem);
      } else {
        logger.error("cannot add/update, counter:", counter, "failedPages:", failedPages++);
      }

      if (failedPages > 2) {
        break;
      }
    }

    if (counter > 200) {
      logger.error("counter reached at least 200, saving json...");
      await helpers.writeFileAsync("./data/imdb-interests.json", JSON.stringify(imdbInterestData, null, 2));
    }
  } catch (error) {
    logger.error(`EXCEPTION: ${error}`);
  }
})();
