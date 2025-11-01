import { db } from "./store";

const querystring = require("querystring");

const _ = require("lodash");
const cheerio = require("cheerio");
const htmlToText = require("html-to-text");

const logger = require("./helpers/logger");
const helpers = require("./helpers/helpers");

let graphqlURLs = require("./data/imdb-graphql-urls.json");

const graphQLqueries = {
  releaseNumber: () => graphqlURLs.releaseNumber,

  /**
   * see https://www.imdb.com/title/tt0076759/releaseinfo/
   * @param {string} $IMDB_tconst
   * @returns
   */
  akaTitles: ($IMDB_tconst) => graphqlURLs.akaTitles.replace("$IMDB_tconst", $IMDB_tconst),

  /**
   * see https://www.imdb.com/title/tt4154796/companycredits/
   * @param {string} $IMDB_tconst
   * @param {string} $IMDB_Companies_Category
   * @returns
   */
  companies: ($IMDB_tconst, $IMDB_Companies_Category) =>
    graphqlURLs.companies
      .replace("$IMDB_tconst", $IMDB_tconst)
      .replace("$IMDB_Companies_Category", $IMDB_Companies_Category),

  /**
   * see https://www.imdb.com/title/tt0076759/keywords/
   * @param {string} $IMDB_tconst
   * @returns
   */
  plotKeywords: ($IMDB_tconst) => graphqlURLs.plotKeywords.replace("$IMDB_tconst", $IMDB_tconst),

  /**
   * see https://www.imdb.com/title/tt0076759/locations/
   * @param {string} $IMDB_tconst
   * @returns
   */
  filmingLocations: ($IMDB_tconst) => graphqlURLs.filmingLocations.replace("$IMDB_tconst", $IMDB_tconst),

  /**
   * see https://www.imdb.com/search/title/
   * @param {string} searchTerm
   * @returns
   */
  advancedTitleSearch: (searchTerm) =>
    graphqlURLs.advancedTitleSearch.replace("$searchTerm", encodeURIComponent(searchTerm)),

  /**
   * API called when using https://www.imdb.com/find/?q=xxx
   */
  findPageSearch: (searchTerm) => graphqlURLs.findPageSearch.replace("$searchTerm", encodeURIComponent(searchTerm)),

  /**
   * API called when fetching episodes (e.g. https://www.imdb.com/title/tt7678620/episodes/)
   */
  seriesEpisodes: (Series_IMDB_tconst, Series_Season) =>
    graphqlURLs.seriesEpisodes
      .replace("$Series_IMDB_tconst", Series_IMDB_tconst)
      .replace("$Series_Season", Series_Season),

  /**
   * APIs called when fetching credits (e.g. https://www.imdb.com/title/tt4154796/fullcredits)
   */
  credits: (IMDB_tconst, category) =>
    graphqlURLs.credits.replace(/\$IMDB_tconst/g, IMDB_tconst).replace("$category", category),
};

/**
 * Auto-Update our definition of graphqlURLs from https://raw.githubusercontent.com/theMK2k/Media-Hoarder/master/src/data/imdb-graphql-urls.json
 * I.E. as soon as Media Hoarder has the defintion updated and pushed to master, we can directly use them here (instead of creating a new release just for updated graphqlURLs)
 */
let lastGraphqlURLsUpdate = null;
async function autoUpdateGraphqlURLs() {
  logger.log("[autoUpdateGraphqlURLs] START");
  if (
    lastGraphqlURLsUpdate &&
    /* lastGraphqlURLsUpdate must be older than 1 hour */ Date.now() - lastGraphqlURLsUpdate < 60 * 60 * 1000
  ) {
    logger.log("[autoUpdateGraphqlURLs] lastGraphqlURLsUpdate has already been run in the last hour, skipping");
    return;
  }

  try {
    const response = await helpers.requestAsync(
      "https://raw.githubusercontent.com/theMK2k/Media-Hoarder/master/src/data/imdb-graphql-urls.json"
    );
    const body = JSON.parse(response.body);

    logger.log("[autoUpdateGraphqlURLs] body:", body);
    logger.log("[autoUpdateGraphqlURLs] graphQLqueries.releaseNumber:", graphQLqueries.releaseNumber());

    if (graphQLqueries.releaseNumber() >= body.releaseNumber) {
      logger.log("[autoUpdateGraphqlURLs] remote graphqlURLs are not newer, skipping");
      return;
    }

    graphqlURLs = body;

    logger.log(
      "[autoUpdateGraphqlURLs] graphqlURLs updated, graphQLqueries.releaseNumber:",
      graphQLqueries.releaseNumber()
    );
  } catch (error) {
    logger.error(error);
  }
}

autoUpdateGraphqlURLs();

/**
 * Inspect @param body if it contains errors and throw an error if so
 */
function handleGraphQLErrors(body) {
  if (body.errors && body.errors.length) {
    throw new Error(`GraphQL Error: ${body.errors[0].message}`);
  }
}

/**
 * scrape IMDB Main Page Data (e.g. https://www.imdb.com/title/tt4154796)
 * @param {Object} movie
 * @param {Function} downloadFileCallback
 * @param {Object} actualDuplicate if the movie has an actual duplicate, the Object is passed here
 * @returns
 */
async function scrapeIMDBmainPageData(movie, downloadFileCallback, actualDuplicate) {
  if (movie.scanErrors) {
    delete movie.scanErrors["IMDB Main Page"];
  }

  let result = {
    $IMDB_releaseType: null,
    $IMDB_genres: null,
    $IMDB_rating: null,
    $IMDB_numVotes: null,
    $IMDB_metacriticScore: null,
    $IMDB_posterSmall_URL: null,
    $IMDB_posterLarge_URL: null,
    $IMDB_plotSummary: null,
    $IMDB_Trailer_URL: null,
    $IMDB_startYear: null,
    $IMDB_endYear: null,
  };

  //#region Copy from duplicate
  if (
    actualDuplicate &&
    actualDuplicate.IMDB_tconst &&
    actualDuplicate.IMDB_Done &&
    actualDuplicate.IMDB_tconst == movie.IMDB_tconst
  ) {
    logger.log("[scrapeIMDBmainPageData] using actualDuplicate data, no scraping needed");
    result = {
      $IMDB_releaseType: actualDuplicate.IMDB_releaseType,
      $IMDB_genres: null, // genres are fetched below
      $IMDB_rating: actualDuplicate.IMDB_rating,
      $IMDB_numVotes: actualDuplicate.IMDB_numVotes,
      $IMDB_metacriticScore: actualDuplicate.IMDB_metacriticScore,
      $IMDB_posterSmall_URL: actualDuplicate.IMDB_posterSmall_URL,
      $IMDB_posterLarge_URL: actualDuplicate.IMDB_posterLarge_URL,
      $IMDB_plotSummary: actualDuplicate.IMDB_plotSummary,
      $IMDB_Trailer_URL: actualDuplicate.IMDB_Trailer_URL,
      $IMDB_startYear: actualDuplicate.IMDB_startYear,
      $IMDB_endYear: actualDuplicate.IMDB_endYear,
    };

    result.$IMDB_genres = (
      await db.fireProcedureReturnAll(
        `
        SELECT GenreID
        FROM tbl_Movies_Genres MG
        INNER JOIN tbl_Genres G ON MG.id_Genres = G.id_Genres
        WHERE MG.id_Movies = $id_Movies
      `,
        {
          $id_Movies: actualDuplicate.id_Movies,
        }
      )
    ).map((row) => row.GenreID);

    return result;
  }
  //#endregion Copy from duplicate

  try {
    // ## Fetch HTML
    const url = `https://www.imdb.com/title/${movie.IMDB_tconst}`;
    logger.log("[scrapeIMDBmainPageData] url:", url);

    const response = await helpers.requestAsync(url);

    if (response.statusCode > 399) {
      throw new Error(`ERROR: IMDB Main Page gave HTTP status code ${response.statusCode}. URL used: ${url}`);
    }

    const html = response.body;

    // V2: we partially use the application/ld+json data, too
    const jsonData = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.test(html)
      ? JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])
      : {};

    // logger.log("[scrapeIMDBmainPageData] jsonData:", jsonData);

    // V3: we partially use the __NEXT_DATA__ data, too
    const jsonDataNext = JSON.parse(
      (html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/) || [null, "{}"])[1]
    );

    // logger.log("[scrapeIMDBmainPageData] jsonDataNext:", logger.inspectObject(jsonDataNext));

    // ## Release Type

    // V3
    result.$IMDB_releaseType = _.get(jsonDataNext, "props.pageProps.aboveTheFoldData.titleType.id", null);

    if (!result.$IMDB_releaseType) {
      // V1
      result.$IMDB_releaseType = "movie";
      /*
          short			-- tt0000006 -> "/search/title?genres=short"
          tvMovie 		-- tt9915546 -> ">TV Movie" 
          tvEpisode		-- tt8709982 -> ">Episode"
          tvShort			-- tt9861332 -> ">TV Short"
          tvMiniSeries	-- tt8916384 -> ">TV Mini-Series"
          tvSpecial		-- tt8019378 -> ">TV Special"
          video			-- tt8650100 -> ">Video"
          videoGame		-- tt8848200 -> ">Video game"
      */

      if (/\/search\/title\?genres=short/.test(html)) result.$IMDB_releaseType = "";
      if (/"presentation">TV Movie</.test(html)) result.$IMDB_releaseType = "tvMovie";
      if (/"presentation">TV Series</.test(html)) result.$IMDB_releaseType = "tvSeries";
      if (/"presentation">Episode/.test(html)) result.$IMDB_releaseType = "tvEpisode";
      if (/"presentation">TV Short/.test(html)) result.$IMDB_releaseType = "tvShort";
      if (/"presentation">TV Mini-Series/.test(html)) result.$IMDB_releaseType = "tvMiniSeries";
      if (/"presentation">TV Special/.test(html)) result.$IMDB_releaseType = "tvSpecial";
      if (/"presentation">Video\s/.test(html)) result.$IMDB_releaseType = "video";
      if (/"presentation">Video game/.test(html)) result.$IMDB_releaseType = "videoGame";
    }

    // ## Genres
    result.$IMDB_genres = [];

    const rxGenres = /genres=(.*?)&/g;
    let match = null;

    // eslint-disable-next-line no-cond-assign
    while ((match = rxGenres.exec(html))) {
      const genre = match[1].toLowerCase();
      if (!result.$IMDB_genres.find((genreFind) => genreFind == genre)) {
        result.$IMDB_genres.push(genre);
      }
    }

    logger.log("[scrapeIMDBmainPageData] $IMDB_genres after V1:", result.$IMDB_genres);

    // ## Genres V2 (via __NEXT_DATA__ / jsonDataNext)
    if (jsonDataNext) {
      const genres = _.get(jsonDataNext, "props.pageProps.aboveTheFoldData.genres.genres", []);
      genres.forEach((genre) => {
        const genreId = genre.id.toLowerCase();
        if (!result.$IMDB_genres.find((genreFind) => genreFind == genreId)) {
          result.$IMDB_genres.push(genreId);
        }
      });
    }

    logger.log("[scrapeIMDBmainPageData] $IMDB_genres after V2:", result.$IMDB_genres);

    // ## IMDB Rating and Number of Votes
    result.$IMDB_rating = null;
    result.$IMDB_numVotes = null;

    const rxRating = /<span itemprop="ratingValue">(.*?)<\/span>/;
    if (rxRating.test(html)) {
      const strRating = html.match(rxRating)[1].replace(",", ".");
      result.$IMDB_rating = parseFloat(strRating);

      const matchVotes = html.match(/itemprop="ratingCount">(.*?)<\/span>/)[1];
      logger.log("[scrapeIMDBmainPageData] matchVotes:", matchVotes);

      const strVotes = html.match(/itemprop="ratingCount">(.*?)<\/span>/)[1].replace(/,/g, "");
      logger.log("[scrapeIMDBmainPageData] strVotes:", strVotes);
      result.$IMDB_numVotes = parseInt(strVotes);
    }

    // V2
    if (jsonData.aggregateRating && jsonData.aggregateRating.ratingValue && jsonData.aggregateRating.ratingCount) {
      logger.log("[scrapeIMDBmainPageData]", {
        ratingValue: jsonData.aggregateRating.ratingValue,
        ratingCount: jsonData.aggregateRating.ratingCount,
      });

      const strRating = jsonData.aggregateRating.ratingValue;
      result.$IMDB_rating = parseFloat(strRating);

      const strVotes = jsonData.aggregateRating.ratingCount;
      result.$IMDB_numVotes = parseInt(strVotes);
    }

    // ## Metacritic Score
    result.$IMDB_metacriticScore = null;

    const rxMetacriticScore = /<div class="metacriticScore .*? titleReviewBarSubItem">[\s\S]*?<span>(\d*)<\/span>/;
    if (rxMetacriticScore.test(html)) {
      result.$IMDB_metacriticScore = parseInt(html.match(rxMetacriticScore)[1]);
    }

    // V2
    // <span class="score-meta" style="background-color:#54A72A">78</span>
    const rxMetacriticScoreV2 = /<span class="score-meta[\s\S]*?>(\d+)<\/span>/;
    if (rxMetacriticScoreV2.test(html)) {
      result.$IMDB_metacriticScore = parseInt(html.match(rxMetacriticScoreV2)[1]);
    }

    // V2.1
    // <span class="sc-b0901df4-0 gzyNKq metacritic-score-box" style="background-color:#54A72A">78</span>
    const rxMetacriticScoreV21 = /<span class=".*?metacritic-score-box[\s\S]*?>(\d+)<\/span>/;
    if (rxMetacriticScoreV21.test(html)) {
      result.$IMDB_metacriticScore = parseInt(html.match(rxMetacriticScoreV21)[1]);
    }

    // ## Poster
    result.$IMDB_posterSmall_URL = null;
    result.$IMDB_posterLarge_URL = null;
    let rxPosterMediaViewerURL = null;

    rxPosterMediaViewerURL = /<div class="poster">[\s\S]*?<a href="(.*?)"[\s\S]*?>/; // "/title/tt0130827/mediaviewer/rm215942400"

    if (!rxPosterMediaViewerURL.test(html)) {
      // V2
      // <a class="ipc-lockup-overlay ipc-focusable" href="/title/tt4154796/mediaviewer/rm2775147008/?ref_=tt_ov_i" aria-label="View {Title} Poster">
      rxPosterMediaViewerURL =
        /<a class="ipc-lockup-overlay ipc-focusable" href="(\/title\/.*?\/mediaviewer\/.*?\/.*?)" aria-label=".*?Poster">/;
    }

    if (rxPosterMediaViewerURL.test(html)) {
      if (movie.scanErrors) {
        delete movie.scanErrors["IMDB Poster"];
      }

      try {
        const posterURLs = await scrapeIMDBposterURLs(html.match(rxPosterMediaViewerURL)[1]);

        const posterSmallPath = `extras/${movie.IMDB_tconst}_posterSmall.jpg`;
        const posterSmallSuccess = await downloadFileCallback(posterURLs.$IMDB_posterSmall_URL, posterSmallPath, false);
        if (posterSmallSuccess) {
          result.$IMDB_posterSmall_URL = posterSmallPath;
        }

        const posterLargePath = `extras/${movie.IMDB_tconst}_posterLarge.jpg`;
        const posterLargeSuccess = await downloadFileCallback(posterURLs.$IMDB_posterLarge_URL, posterLargePath, false);
        if (posterLargeSuccess) {
          result.$IMDB_posterLarge_URL = posterLargePath;
        }
      } catch (error) {
        if (movie.scanErrors) {
          movie.scanErrors["IMDB Poster"] = error.message;
        }
      }
    }

    // ## Plot Summary
    result.$IMDB_plotSummary = null;
    const rxPlotSummary = /<div class="summary_text">([\s\S]*?)<\/div>/;
    const rxPlotSummary2 = /data-testid="plot-l"[\s\S]*?>([\s\S]*?)<\//;

    let rxPlotSummaryChosen = null;

    if (rxPlotSummary.test(html)) rxPlotSummaryChosen = rxPlotSummary;
    if (rxPlotSummary2.test(html)) rxPlotSummaryChosen = rxPlotSummary2;

    if (rxPlotSummaryChosen) {
      result.$IMDB_plotSummary = unescape(
        htmlToText
          .fromString(html.match(rxPlotSummaryChosen)[1], {
            wordwrap: null,
            ignoreImage: true,
            ignoreHref: true,
          })
          .replace("See full summary»", "")
          .replace(/ Read all$/, "")
          .trim()
      );
    }

    // ## Trailer
    result.$IMDB_Trailer_URL = null;

    if (jsonData.trailer && jsonData.trailer.embedUrl) {
      // V2
      result.$IMDB_Trailer_URL = jsonData.trailer.embedUrl.replace("https://www.imdb.com", "");
    } else {
      const rxTrailerUrl =
        /href="(\/video\/vi\d*)\?playlistId=tt\d*&amp;ref_=tt_ov_vi"[\s\S]*?aria-label="Watch {VideoTitle}"/;
      if (rxTrailerUrl.test(html)) {
        result.$IMDB_Trailer_URL = html.match(rxTrailerUrl)[1];
      }
    }

    logger.log("[scrapeIMDBmainPageData] result.$IMDB_Trailer_URL:", result.$IMDB_Trailer_URL);

    // ## Year Range
    // V3
    result.$IMDB_startYear = _.get(jsonDataNext, "props.pageProps.aboveTheFoldData.releaseYear.year", null);
    result.$IMDB_endYear = _.get(jsonDataNext, "props.pageProps.aboveTheFoldData.releaseYear.endYear", null);

    if (!result.$IMDB_startYear) {
      // V1
      // <title>Star Trek: The Next Generation (TV Series 1987â€“1994) - Release info - IMDb</title>
      const rxYearRange = /<title>[\s\S]{0,20}\((.*?)\)[\s\S]{0,20}<\/title>/;
      if (rxYearRange.test(html)) {
        const yearRange = unescape(
          htmlToText
            .fromString(html.match(rxYearRange)[1], {
              wordwrap: null,
              ignoreImage: true,
              ignoreHref: true,
            })
            .replace("–", "-")
            .replace("â€“", "-")
            .trim()
        );
        logger.log("[scrapeIMDBmainPageData] yearRange:", yearRange);

        const yearRangeSplit = yearRange.split("-");
        result.$IMDB_startYear = +yearRangeSplit[0].match(/\d+/)[0];
        if (yearRange.includes("-")) {
          if (yearRangeSplit[1].match(/\d+/)) {
            result.$IMDB_endYear = +yearRangeSplit[1].match(/\d+/)[0];
          }
        } else {
          if (["tvSeries", "tvMiniSeries"].includes(result.$IMDB_releaseType === "tvSeries")) {
            // TODO: if statement is a bit odd
            result.$IMDB_endYear = result.$IMDB_startYear;
          }
        }
      }
    }

    return result;
  } catch (error) {
    logger.error(error);

    if (movie.scanErrors) {
      movie.scanErrors["IMDB Main Page"] = error.message;
    }

    throw error;
  }
}

/**
 * scrape IMDB Plot Summary Data (e.g. https://www.imdb.com/title/tt4154796/plotsummary)
 * @param {Object} movie
 * @param {string} shortSummary
 * @param {Object} actualDuplicate if the movie has an actual duplicate, the Object is passed here
 * @returns
 */
async function scrapeIMDBplotSummary(movie, shortSummary, actualDuplicate) {
  if (movie.scanErrors) {
    delete movie.scanErrors["IMDB Plot Summary"];
  }

  let result = { $IMDB_plotSummaryFull: null };

  //#region Copy from duplicate
  if (
    actualDuplicate &&
    actualDuplicate.IMDB_tconst &&
    actualDuplicate.IMDB_Done &&
    actualDuplicate.IMDB_tconst == movie.IMDB_tconst
  ) {
    logger.log("[scrapeIMDBplotSummary] using actualDuplicate data, no scraping needed");
    result = {
      $IMDB_plotSummaryFull: actualDuplicate.IMDB_plotSummaryFull,
    };
    return result;
  }
  //#endregion Copy from duplicate

  const url = `https://www.imdb.com/title/${movie.IMDB_tconst}/plotsummary`;
  const response = await helpers.requestAsync(url);
  const html = response.body;

  if (/styleguide/.test(html)) {
    return await scrapeIMDBplotSummaryV1(movie, shortSummary, html);
  } else {
    return await scrapeIMDBplotSummaryV2(movie, shortSummary, html);
  }
}

async function scrapeIMDBplotSummaryV1(movie, shortSummary, html) {
  let $IMDB_plotSummaryFull = null;

  if (!shortSummary) {
    return { $IMDB_plotSummaryFull };
  }

  if (movie.scanErrors) {
    delete movie.scanErrors["IMDB Plot Summary"];
  }

  try {
    const shortSummaryClean = shortSummary.split("...")[0].trim();

    const rxPlotSummary = new RegExp(`<li class="ipl-zebra-list__item"[\\s\\S]*?<p>([\\s\\S]*?)</p>`, "g");

    const rxPlotSummary2 = new RegExp(`<li.*?id="summary[\\s\\S]*?<p>([\\s\\S]*?)</p>`, "g");

    let rxPlotSummaryChosen = null;
    if (html.match(rxPlotSummary)) rxPlotSummaryChosen = rxPlotSummary;
    if (html.match(rxPlotSummary2)) rxPlotSummaryChosen = rxPlotSummary2;

    if (!rxPlotSummaryChosen) {
      logger.log("[scrapeIMDBplotSummary] no regex matches!");
      return { $IMDB_plotSummaryFull };
    }

    let match = null;

    while ((match = rxPlotSummaryChosen.exec(html))) {
      const plotSummaryFull = unescape(
        htmlToText
          .fromString(match[1], {
            wordwrap: null,
            ignoreImage: true,
            ignoreHref: true,
          })
          .trim()
      );

      if (plotSummaryFull.includes(shortSummaryClean)) {
        logger.log("[scrapeIMDBplotSummary] matching full summary found!");
        $IMDB_plotSummaryFull = plotSummaryFull;
      }
    }

    return { $IMDB_plotSummaryFull };
  } catch (error) {
    logger.error(error);

    if (movie.scanErrors) {
      movie.scanErrors["IMDB Plot Summary"] = error.message;
    }

    throw error;
  }
}

async function scrapeIMDBplotSummaryV2(movie, shortSummary, html) {
  logger.log("[scrapeIMDBplotSummaryV2] START");

  let $IMDB_plotSummaryFull = null;

  if (!shortSummary) {
    return { $IMDB_plotSummaryFull };
  }

  if (movie.scanErrors) {
    delete movie.scanErrors["IMDB Plot Summary"];
  }

  try {
    const jsonDataNext = JSON.parse(
      html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)[1]
    );

    const $IMDB_plotSummaryFull = _.get(
      jsonDataNext,
      "props.pageProps.contentData.entityMetadata.plot.plotText.plainText",
      null
    );

    return { $IMDB_plotSummaryFull };
  } catch (error) {
    logger.error(error);

    if (movie.scanErrors) {
      movie.scanErrors["IMDB Plot Summary"] = error.message;
    }

    throw error;
  }
}

async function scrapeIMDBposterURLs(posterMediaViewerURL) {
  logger.log("[scrapeIMDBposterURLs] posterMediaViewerURL:", posterMediaViewerURL);

  const url = `https://www.imdb.com${posterMediaViewerURL}`;

  const response = await helpers.requestAsync(url);

  const html = response.body;

  const rxID = /(rm\d*).*?\?ref/;
  if (rxID.test(posterMediaViewerURL)) {
    const ID = posterMediaViewerURL.match(rxID)[1];
    logger.log("[scrapeIMDBposterURLs] ID:", ID);

    const rxString = `"id":"${ID}","h":\\d*,"msrc":"(.*?)","src":"(.*?)"`;
    const rxURLs = new RegExp(rxString);

    const matches = html.match(rxURLs);

    if (matches && matches.length === 3) {
      logger.log("[scrapeIMDBposterURLs] Variant 1 found");

      return {
        $IMDB_posterSmall_URL: matches[1],
        $IMDB_posterLarge_URL: matches[2],
      };
    }

    // trying alternative approach

    const rxString2 = `<img src="(.*?)" srcSet="(.*?)\\s.*?${ID}`;
    const rxURLs2 = new RegExp(rxString2);

    const matches2 = html.match(rxURLs2);

    if (matches2 && matches2.length === 3) {
      logger.log("[scrapeIMDBposterURLs] Variant 2 found");

      return {
        $IMDB_posterSmall_URL: matches2[2],
        $IMDB_posterLarge_URL: matches2[1],
      };
    }

    logger.warn("[scrapeIMDBposterURLs] NO URLs found!");
    throw new Error("IMDB Poster URLs cannot be found");
  }
}

async function scrapeIMDBreleaseinfo(movie, regions, allowedTitleTypes, actualDuplicate) {
  logger.log("[scrapeIMDBreleaseinfo] movie:", movie, "regions:", regions, "allowedTitleTypes:", allowedTitleTypes);

  if (movie.scanErrors) {
    delete movie.scanErrors["IMDB Release Info"];
  }

  try {
    let result = {
      $IMDB_originalTitle: null,
      $IMDB_localTitle: null,
      $IMDB_primaryTitle: null,
    };

    //#region Copy from duplicate
    if (
      actualDuplicate &&
      actualDuplicate.IMDB_tconst &&
      actualDuplicate.IMDB_Done &&
      actualDuplicate.IMDB_tconst == movie.IMDB_tconst
    ) {
      logger.log("[scrapeIMDBreleaseinfo] using actualDuplicate data, no scraping needed");

      result = {
        $IMDB_originalTitle: actualDuplicate.IMDB_originalTitle,
        $IMDB_localTitle: actualDuplicate.IMDB_localTitle,
        $IMDB_primaryTitle: actualDuplicate.IMDB_primaryTitle,
      };

      return result;
    }
    //#endregion Copy from duplicate

    const url = `https://www.imdb.com/title/${movie.IMDB_tconst}/releaseinfo`;
    logger.log("[scrapeIMDBreleaseinfo] url:", url, "allowedTitleTypes:", allowedTitleTypes);
    const response = await helpers.requestAsync(url);
    const html = response.body;
    // logger.log('[scrapeIMDBreleaseinfo] imdbReleaseinfoHTML', imdbReleaseinfoHTML);

    const version = /aka-item__name/.test(html) ? 1 : 2;

    logger.log(`[scrapeIMDBreleaseinfo] using V${version} scraping method`);

    result =
      version === 1
        ? await scrapeIMDBreleaseinfoV1(movie, regions, allowedTitleTypes, html)
        : await scrapeIMDBreleaseinfoV3(movie, regions, allowedTitleTypes, html);

    // const result = {
    //   $IMDB_originalTitle,
    //   $IMDB_localTitle,
    //   $IMDB_primaryTitle,
    //   $IMDB_startYear,
    //   $IMDB_endYear,
    // };

    logger.log("[scrapeIMDBreleaseinfo] scrapeIMDBreleaseinfo result:", result);

    return result;
  } catch (error) {
    if (movie.scanErrors) {
      movie.scanErrors["IMDB Release Info"] = error.message;
    }

    throw error;
  }
}

async function scrapeIMDBreleaseinfoV1(movie, regions, allowedTitleTypes, html) {
  try {
    let $IMDB_originalTitle = null;
    const rxOriginalTitle =
      /td class="aka-item__name"> \(original title\)<\/td>[\s\S]*?<td class="aka-item__title">(.*?)<\/td>/;
    if (rxOriginalTitle.test(html)) $IMDB_originalTitle = html.match(rxOriginalTitle)[1];

    logger.log("[scrapeIMDBreleaseinfoV1] regions used:", regions);

    let $IMDB_localTitle = null;
    if (regions) {
      for (let i = 0; i < regions.length; i++) {
        const region = regions[i].name;

        logger.log("[scrapeIMDBreleaseinfoV1] regions trying:", `"${region}"`);

        if (!$IMDB_localTitle) {
          const rxLocalTitleFuzzy = new RegExp(
            `td class="aka-item__name">${region}(.*?)</td>[\\s\\S]*?<td class="aka-item__title">(.*?)</td>`,
            "g"
          );

          let match = null;

          while ((match = rxLocalTitleFuzzy.exec(html))) {
            logger.log("[scrapeIMDBreleaseinfoV1] regions: fuzzy match found for", region);

            const titleTypes = match[1];
            const title = match[2];

            if (titleTypes.trim()) {
              const arrTitleTypes = [];
              titleTypes.split("(").forEach((titleTypes) => {
                const cleanTitleType = titleTypes.replace(/[()]/g, "").trim();

                if (cleanTitleType) {
                  arrTitleTypes.push(cleanTitleType);
                }
              });

              logger.log("[scrapeIMDBreleaseinfoV1] regions: local title match:", {
                title,
                arrTitleTypes,
              });

              let allowed = 0;
              for (let i = 0; i < arrTitleTypes.length; i++) {
                const titleType = arrTitleTypes[i];

                if (allowedTitleTypes.find((allowed) => allowed === titleType)) {
                  allowed++;
                }
              }

              if (allowed !== arrTitleTypes.length) {
                logger.log("[scrapeIMDBreleaseinfoV1] regions: skipped local title, some title types are not allowed");
                continue;
              }
            }

            logger.log("[scrapeIMDBreleaseinfoV1] regions: using local title:", title);
            $IMDB_localTitle = title;
            break;
          }
        }

        if ($IMDB_localTitle) {
          break;
        }
      }
    }

    let $IMDB_primaryTitle = null;
    let $IMDB_startYear = null;
    let $IMDB_endYear = null;
    const rxPrimaryTitleYear =
      /ref_=ttrel_rel_tt"[\s\S]itemprop='url'>(.*?)<\/a>\s*?<span class="nobr">[\s\S]*?\((\d\d\d\d.*?)\)/;
    if (rxPrimaryTitleYear.test(html)) {
      $IMDB_primaryTitle = html.match(rxPrimaryTitleYear)[1];
      const yearRange = html.match(rxPrimaryTitleYear)[2];

      logger.log("[scrapeIMDBreleaseinfoV1] yearRange:", yearRange);
      $IMDB_startYear = yearRange.match(/(\d\d\d\d)/)[1];
      if (/\d\d\d\d–\d\d\d\d/.test(yearRange)) {
        $IMDB_endYear = yearRange.match(/\d\d\d\d–(\d\d\d\d)/)[1];
      }
    }

    logger.log("[scrapeIMDBreleaseinfoV1] years:", { $IMDB_startYear, $IMDB_endYear });

    if ($IMDB_originalTitle) {
      $IMDB_originalTitle = unescape(
        htmlToText
          .fromString($IMDB_originalTitle, {
            wordwrap: null,
            ignoreImage: true,
            ignoreHref: true,
          })
          .trim()
      );
    }
    if ($IMDB_localTitle) {
      $IMDB_localTitle = unescape(
        htmlToText
          .fromString($IMDB_localTitle, {
            wordwrap: null,
            ignoreImage: true,
            ignoreHref: true,
          })
          .trim()
      );
    }
    if ($IMDB_primaryTitle) {
      $IMDB_primaryTitle = unescape(
        htmlToText
          .fromString($IMDB_primaryTitle, {
            wordwrap: null,
            ignoreImage: true,
            ignoreHref: true,
          })
          .trim()
      );
    }

    const result = {
      $IMDB_originalTitle,
      $IMDB_localTitle,
      $IMDB_primaryTitle,

      // we cannot provide the year range, because V2 doesn't provide it - we provide it from the main page
      // $IMDB_startYear,
      // $IMDB_endYear,
    };

    logger.log("[scrapeIMDBreleaseinfoV1] result:", result);

    return result;
  } catch (error) {
    if (movie.scanErrors) {
      movie.scanErrors["IMDB Release Info"] = error.message;
    }

    throw error;
  }
}

async function scrapeIMDBreleaseinfoV3(movie, regions, allowedTitleTypes, html) {
  try {
    const jsonDataNext = JSON.parse(
      html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)[1]
    );

    // logger.log("[scrapeIMDBreleaseinfoV3] jsonDataNext:", logger.inspectObject(jsonDataNext));

    // ### Original Title
    let $IMDB_originalTitle = null;
    const akas = _.get(jsonDataNext, "props.pageProps.contentData.categories", []).find((category) => {
      return category.id === "akas";
    });
    if (akas) {
      const originalTitleObj = akas.section.items.find((item) => {
        return item.rowTitle.toLowerCase() === "(original title)";
      });

      if (originalTitleObj) {
        $IMDB_originalTitle = originalTitleObj.listContent[0].text;
      }
    }

    const gqlAkaTitlesEdges = await scrapeGraphQLPaginated(
      graphQLqueries.akaTitles(movie.IMDB_tconst),
      "data.title.akas"
    );

    // ### Local Title
    let $IMDB_localTitle = null;
    if (regions) {
      for (const region of regions) {
        logger.log("[scrapeIMDBreleaseinfoV3] regions trying:", `"${region.name}"`);

        if (!$IMDB_localTitle) {
          const regionAkaTitles = gqlAkaTitlesEdges.filter((node) => {
            return ((node.node || {}).country || {}).text === region.name;
          });

          for (const regionAkaTitle of regionAkaTitles) {
            const title = _.get(regionAkaTitle, "node.displayableProperty.value.plainText", null);
            logger.log(`[scrapeIMDBreleaseinfoV3] regions: found aka title candidate: "${title}"`);

            if (!title) {
              logger.log(
                "[scrapeIMDBreleaseinfoV3] skip; no title found in regionAkaTitle:",
                logger.inspectObject(regionAkaTitle)
              );
              continue;
            }

            const titleTypes = (regionAkaTitle.qualifiersInMarkdownList || []).map((qualifier) => {
              return qualifier.plainText;
            });

            const numAllowed = titleTypes.filter((titleType) => {
              return allowedTitleTypes.includes(titleType);
            }).length;

            if (numAllowed !== titleTypes.length) {
              logger.log("[scrapeIMDBreleaseinfoV3] regions: skipped local title, some title types are not allowed", {
                numAllowed,
                titleTypes,
              });
              continue;
            }

            logger.log("[scrapeIMDBreleaseinfoV3] regions: using local title:", title);
            $IMDB_localTitle = regionAkaTitle.node.displayableProperty.value.plainText;
            break;
          }
        }
      }
    }

    // ### Local Title
    let $IMDB_primaryTitle = _.get(jsonDataNext, "props.pageProps.contentData.data.title.titleText.text", null);

    const result = {
      $IMDB_originalTitle,
      $IMDB_localTitle,
      $IMDB_primaryTitle,
    };

    logger.log("[scrapeIMDBreleaseinfoV3] result:", result);

    return result;
  } catch (error) {
    logger.error(error);

    if (movie.scanErrors) {
      movie.scanErrors["IMDB Release Info"] = error.message;
    }

    throw error;
  }
}

async function scrapeIMDBtechnicalData(movie, actualDuplicate) {
  if (movie.scanErrors) {
    delete movie.scanErrors["IMDB Technical Data"];
  }

  try {
    let result = {
      $IMDB_runtimeMinutes: null,
    };

    //#region Copy from duplicate
    if (
      actualDuplicate &&
      actualDuplicate.IMDB_tconst &&
      actualDuplicate.IMDB_Done &&
      actualDuplicate.IMDB_tconst == movie.IMDB_tconst
    ) {
      logger.log("[scrapeIMDBtechnicalData] using actualDuplicate data, no scraping needed");

      result = { $IMDB_runtimeMinutes: actualDuplicate.IMDB_runtimeMinutes };

      return result;
    }
    //#endregion Copy from duplicate

    const url = `https://www.imdb.com/title/${movie.IMDB_tconst}/technical`;
    logger.log("[scrapeIMDBtechnicalData] scrapeIMDBtechnicalData url:", url);
    const response = await helpers.requestAsync(url);
    const html = response.body;

    const rxRuntimeValue = /<td class="label"> Runtime <\/td>[\s\S]*?<td>([\s\S]*?)<\/td>/;

    const rxRuntimeValueV2 = /<script id="__NEXT_DATA__".*?type="application\/json">([\s\S]*?)<\/script>/;

    if (rxRuntimeValueV2.test(html)) {
      // v2 (2023-01-28) - utilize JSON
      logger.log("[scrapeIMDBtechnicalData] going for V2");
      const jsonData = JSON.parse(html.match(rxRuntimeValueV2)[1]);

      const runtimeSeconds = _.get(jsonData, "props.pageProps.contentData.entityMetadata.runtime.seconds", null);
      if (runtimeSeconds) {
        result.$IMDB_runtimeMinutes = Math.floor(runtimeSeconds / 60).toString();
      }

      /*
      const runtimeData = jsonData.props.pageProps.contentData.entityMetadata.runtime.seconds.items.find(
        (item) => item.id === "runtime"
      );

      if (runtimeData && runtimeData.listContent && runtimeData.listContent[0]) {
        // we expect .text = "3h 1m" and .subText = "(181 min)" (e.g. https://www.imdb.com/title/tt4154796/technical/)
        // sometimes this is not the case: .text = "48m" and .subtext ="(DVD) (United States)" (see: https://www.imdb.com/title/tt0888817/technical/, https://www.imdb.com/title/tt1329665/technical/)
        // -> we should go with .text and interpret "2h 1m" as 121 minutes, while the hour-part is optional and not rely on .subtext being "(xy min)"
        const runtime = runtimeData.listContent[0].text;

        const hours = /(\d+)h/.test(runtime) ? +runtime.match(/(\d+)h/)[1] : 0;
        const minutes = /(\d+)m/.test(runtime) ? +runtime.match(/(\d+)m/)[1] : 0;

        $IMDB_runtimeMinutes = (hours * 60 + minutes).toString() || null;
      }
      */
    } else if (rxRuntimeValue.test(html)) {
      // v1
      logger.log("[scrapeIMDBtechnicalData] going for V1");
      const rxRuntimeMinutesTotal = /\((\d*?) min\)/;
      const rxRuntimeMinutes = /\s(\d*?) min/;

      if (rxRuntimeMinutesTotal.test(html)) {
        result.$IMDB_runtimeMinutes = html.match(rxRuntimeMinutesTotal)[1];
      } else if (rxRuntimeMinutes.test(html)) {
        result.$IMDB_runtimeMinutes = html.match(rxRuntimeMinutes)[1];
      }
    } else {
      logger.warn("[scrapeIMDBtechnicalData] WARNING: runtime values not found!");
    }

    return result;
  } catch (error) {
    if (movie.scanErrors) {
      movie.scanErrors["IMDB Technical Data"] = error.message;
    }

    throw error;
  }
}

let cacheAgeRatings = null;

async function scrapeIMDBParentalGuideData(
  movie,
  regions,
  dbFireProcedureReturnAll,
  dbFireProcedure,
  dbFireProcedureReturnScalar,
  actualDuplicate
) {
  if (movie.scanErrors) {
    delete movie.scanErrors["IMDB Parental Guide"];
  }

  let result = {
    $IMDB_MinAge: null,
    $IMDB_MaxAge: null,
    $IMDB_id_AgeRating_Chosen_Country: null,
    $IMDB_Parental_Advisory_Nudity: null,
    $IMDB_Parental_Advisory_Violence: null,
    $IMDB_Parental_Advisory_Profanity: null,
    $IMDB_Parental_Advisory_Alcohol: null,
    $IMDB_Parental_Advisory_Frightening: null,
  };

  //#region Copy from duplicate
  if (
    actualDuplicate &&
    actualDuplicate.IMDB_tconst &&
    actualDuplicate.IMDB_Done &&
    actualDuplicate.IMDB_tconst == movie.IMDB_tconst
  ) {
    logger.log("[scrapeIMDBParentalGuideData] using actualDuplicate data, no scraping needed");
    result = {
      $IMDB_MinAge: actualDuplicate.IMDB_MinAge,
      $IMDB_MaxAge: actualDuplicate.IMDB_MaxAge,
      $IMDB_id_AgeRating_Chosen_Country: actualDuplicate.IMDB_id_AgeRating_Chosen_Country,
      $IMDB_Parental_Advisory_Nudity: actualDuplicate.IMDB_Parental_Advisory_Nudity,
      $IMDB_Parental_Advisory_Violence: actualDuplicate.IMDB_Parental_Advisory_Violence,
      $IMDB_Parental_Advisory_Profanity: actualDuplicate.IMDB_Parental_Advisory_Profanity,
      $IMDB_Parental_Advisory_Alcohol: actualDuplicate.IMDB_Parental_Advisory_Alcohol,
      $IMDB_Parental_Advisory_Frightening: actualDuplicate.IMDB_Parental_Advisory_Frightening,
    };

    return result;
  }
  //#endregion Copy from duplicate

  if (!cacheAgeRatings) {
    cacheAgeRatings = await dbFireProcedureReturnAll(`SELECT id_AgeRating, Country, Code, Age FROM tbl_AgeRating`);
    logger.log("[scrapeIMDBParentalGuideData] cacheAgeRatings:", cacheAgeRatings);
  }

  let regionCodes = [];

  try {
    if (regions) {
      regionCodes = regions.map((region) => (region.code ? region.code.toUpperCase() : ""));
    }
  } catch (e) {
    logger.error(e);
  }

  logger.log("[scrapeIMDBParentalGuideData] AgeRating regionCodes:", regionCodes);

  const url = `https://www.imdb.com/title/${movie.IMDB_tconst}/parentalguide`;
  logger.log("[scrapeIMDBParentalGuideData] url:", url);
  const response = await helpers.requestAsync(url);
  const html = response.body;

  const jsonDataNext = JSON.parse(
    (html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/) || [null, null])[1]
  );

  if (jsonDataNext) {
    // V3 - using __NEXT_DATA__
    return await scrapeIMDBParentalGuideDataV3(
      movie,
      regionCodes,
      jsonDataNext,
      dbFireProcedure,
      dbFireProcedureReturnScalar
    );
  }

  // V1 - using plain HTML
  return await scrapeIMDBParentalGuideDataV1(movie, regionCodes, html, dbFireProcedure, dbFireProcedureReturnScalar);
}

/**
 * Scrape IMDB Parental Guide Data V1 - using plain HTML
 * @param {*} movie
 * @param {*} regionCodes
 * @param {*} html
 * @param {*} dbFireProcedure
 * @param {*} dbFireProcedureReturnScalar
 * @returns
 */
async function scrapeIMDBParentalGuideDataV1(movie, regionCodes, html, dbFireProcedure, dbFireProcedureReturnScalar) {
  if (movie.scanErrors) {
    delete movie.scanErrors["IMDB Parental Guide"];
  }

  try {
    const rxAgeRating = /a href="\/search\/title\?certificates=(.*?):(.*?)"/g;

    let matchAgeRating = null;

    const ageRatings = [];

    // eslint-disable-next-line no-cond-assign
    while ((matchAgeRating = rxAgeRating.exec(html))) {
      const Country = matchAgeRating[1];
      const Code = unescape(matchAgeRating[2]);

      logger.log("[scrapeIMDBParentalGuideDataV1] rating found:", Country, Code);

      const cachedRating = cacheAgeRatings.find((cache) => cache.Country === Country && cache.Code === Code);

      let Age = null;
      if (cachedRating) {
        Age = cachedRating.Age;
        logger.log("[scrapeIMDBParentalGuideDataV1] Age (cached):", Age);
      } else {
        if (/\d+/.test(Code)) {
          Age = parseInt(Code.match(/\d+/)[0]);
          logger.log("[scrapeIMDBParentalGuideDataV1] Age (parsed):", Age);
        }

        const definedPGs = [
          {
            Age: 0,
            codes: ["b.o.", "Tous+publics", "Tous+Public"],
          },
          {
            Age: 6,
            codes: ["U", "Tous+publics+avec+avertissement"],
          },
          {
            Age: 12,
            codes: ["T", "PG", "NRC", "GP"],
          },
          {
            Age: 17,
            codes: ["R"],
          },
          {
            Age: 18,
            codes: ["Unrated", "X", "XXX", "SOA"],
          },
        ];

        const foundPG = definedPGs.find((pg) => {
          return pg.codes.find((definedCode) => definedCode === Code);
        });

        if (foundPG) {
          Age = foundPG.Age;
          logger.log("[scrapeIMDBParentalGuideDataV1] Age (found):", Age);
        }
      }

      ageRatings.push({ Country, Code, Age });
      logger.log("[scrapeIMDBParentalGuideDataV1] ageRatings:", ageRatings);
    }

    let $IMDB_MinAge = null;
    let $IMDB_MaxAge = null;
    let $IMDB_id_AgeRating_Chosen_Country = null;

    for (let i = 0; i < ageRatings.length; i++) {
      const rating = ageRatings[i];
      const cachedRating = cacheAgeRatings.find(
        (cache) => cache.Country === rating.Country && cache.Code === rating.Code
      );

      if (!cachedRating) {
        await dbFireProcedure(`INSERT INTO tbl_AgeRating (Country, Code, Age) VALUES ($Country, $Code, $Age)`, {
          $Country: rating.Country,
          $Code: rating.Code,
          $Age: rating.Age,
        });
        rating.id_AgeRating = await dbFireProcedureReturnScalar(
          `SELECT id_AgeRating FROM tbl_AgeRating WHERE Country = $Country AND Code = $Code`,
          {
            $Country: rating.Country,
            $Code: rating.Code,
          }
        );

        cacheAgeRatings.push({
          id_AgeRating: rating.id_AgeRating,
          Country: rating.Country,
          Code: rating.Code,
          Age: rating.Age,
        });
      } else {
        rating.id_AgeRating = cachedRating.id_AgeRating;
      }

      if (
        rating.id_AgeRating &&
        rating.Age != null &&
        regionCodes.find((regionCode) => regionCode === rating.Country)
      ) {
        logger.log("[scrapeIMDBParentalGuideDataV1] AgeRating regions FOUND:", rating);
        $IMDB_id_AgeRating_Chosen_Country = rating.id_AgeRating;
      }

      if (rating.Age || rating.Age === 0) {
        if (!$IMDB_MinAge) {
          $IMDB_MinAge = rating.Age;
        }

        if (!$IMDB_MaxAge) {
          $IMDB_MaxAge = rating.Age;
        }

        if ($IMDB_MinAge > rating.Age) {
          $IMDB_MinAge = rating.Age;
        }
        if ($IMDB_MaxAge < rating.Age) {
          $IMDB_MaxAge = rating.Age;
        }
      }
    }

    logger.log("[scrapeIMDBParentalGuideDataV1] found age ratings:", ageRatings);

    const rx_Parental_Advisory_Nudity =
      /<section id="advisory-nudity">[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>(.*?)<\/span>/;
    let $IMDB_Parental_Advisory_Nudity = null;

    if (rx_Parental_Advisory_Nudity.test(html)) {
      const severity = html.match(rx_Parental_Advisory_Nudity)[1].trim().toLowerCase();

      $IMDB_Parental_Advisory_Nudity = getParentalGuideSeverityNumber(severity);
    }

    const rx_Parental_Advisory_Violence =
      /<section id="advisory-violence">[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>(.*?)<\/span>/;
    let $IMDB_Parental_Advisory_Violence = null;

    if (rx_Parental_Advisory_Violence.test(html)) {
      const severity = html.match(rx_Parental_Advisory_Violence)[1].trim().toLowerCase();

      $IMDB_Parental_Advisory_Violence = getParentalGuideSeverityNumber(severity);
    }

    const rx_Parental_Advisory_Profanity =
      /<section id="advisory-profanity">[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>(.*?)<\/span>/;
    let $IMDB_Parental_Advisory_Profanity = null;

    if (rx_Parental_Advisory_Profanity.test(html)) {
      const severity = html.match(rx_Parental_Advisory_Profanity)[1].trim().toLowerCase();

      $IMDB_Parental_Advisory_Profanity = getParentalGuideSeverityNumber(severity);
    }

    const rx_Parental_Advisory_Alcohol =
      /<section id="advisory-alcohol">[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>(.*?)<\/span>/;
    let $IMDB_Parental_Advisory_Alcohol = null;

    if (rx_Parental_Advisory_Alcohol.test(html)) {
      const severity = html.match(rx_Parental_Advisory_Alcohol)[1].trim().toLowerCase();

      $IMDB_Parental_Advisory_Alcohol = getParentalGuideSeverityNumber(severity);
    }

    const rx_Parental_Advisory_Frightening =
      /<section id="advisory-frightening">[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>(.*?)<\/span>/;
    let $IMDB_Parental_Advisory_Frightening = null;

    if (rx_Parental_Advisory_Frightening.test(html)) {
      const severity = html.match(rx_Parental_Advisory_Frightening)[1].trim().toLowerCase();

      $IMDB_Parental_Advisory_Frightening = getParentalGuideSeverityNumber(severity);
    }

    return {
      $IMDB_MinAge,
      $IMDB_MaxAge,
      $IMDB_id_AgeRating_Chosen_Country,
      $IMDB_Parental_Advisory_Nudity,
      $IMDB_Parental_Advisory_Violence,
      $IMDB_Parental_Advisory_Profanity,
      $IMDB_Parental_Advisory_Alcohol,
      $IMDB_Parental_Advisory_Frightening,
    };
  } catch (error) {
    if (movie.scanErrors) {
      movie.scanErrors["IMDB Parental Guide"] = error.message;
    }

    throw error;
  }
}

function getParentalGuideSeverityNumber(severity) {
  if (severity == "none") {
    return 0;
  } else if (severity == "mild") {
    return 1;
  } else if (severity == "moderate") {
    return 2;
  } else if (severity == "severe") {
    return 3;
  }

  return null;
}

function scrapeIMDBParentalGuideDataV3_getParentalGuideSeverityFromCategory(parentsGuideCategoriesData, categoryId) {
  const parentsGuideData = parentsGuideCategoriesData.find((category) => category.category.id === categoryId);

  if (!parentsGuideData) {
    return null;
  }

  const severity = _.get(parentsGuideData, "severity.text", "").trim().toLowerCase();

  return getParentalGuideSeverityNumber(severity);
}

/**
 * Scrape IMDB Parental Guide Data V3 - using __NEXT_DATA__
 * @param {*} movie
 * @param {*} regionCodes
 * @param {*} jsonDataNext
 * @param {*} dbFireProcedure
 * @param {*} dbFireProcedureReturnScalar
 * @returns
 */
async function scrapeIMDBParentalGuideDataV3(
  movie,
  regionCodes,
  jsonDataNext,
  dbFireProcedure,
  dbFireProcedureReturnScalar
) {
  try {
    // ### Age Ratings ###
    const ageRatings = [];

    const ageRatingsData = _.get(jsonDataNext, "props.pageProps.contentData.data.title.certificates.edges", []);

    for (const ageRating of ageRatingsData) {
      const Country = _.get(ageRating, "node.country.id", null);
      if (!Country) {
        logger.error(
          "[scrapeIMDBParentalGuideDataV3] Country identified in",
          ageRating,
          "expected path: node.country.id"
        );
      }

      const Code = _.get(ageRating, "node.rating", null);
      if (Code == null) {
        logger.error("[scrapeIMDBParentalGuideDataV3] Code identified in", ageRating, "expected path: node.rating");
      }

      logger.log("[scrapeIMDBParentalGuideDataV3] rating found:", Country, Code);

      const cachedRating = cacheAgeRatings.find((cache) => cache.Country === Country && cache.Code === Code);

      let Age = null;
      if (cachedRating) {
        Age = cachedRating.Age;
        logger.log("[scrapeIMDBParentalGuideDataV3] Age (cached):", Age);
      } else {
        if (/\d+/.test(Code)) {
          Age = parseInt(Code.match(/\d+/)[0]);
          logger.log("[scrapeIMDBParentalGuideDataV3] Age (parsed):", Age);
        }

        const definedPGs = [
          {
            Age: 0,
            codes: ["b.o.", "Tous+publics", "Tous+Public"],
          },
          {
            Age: 6,
            codes: ["U", "Tous+publics+avec+avertissement"],
          },
          {
            Age: 12,
            codes: ["T", "PG", "NRC", "GP"],
          },
          {
            Age: 17,
            codes: ["R"],
          },
          {
            Age: 18,
            codes: ["Unrated", "X", "XXX", "SOA"],
          },
        ];

        const foundPG = definedPGs.find((pg) => {
          return pg.codes.find((definedCode) => definedCode === Code);
        });

        if (foundPG) {
          Age = foundPG.Age;
          logger.log("[scrapeIMDBParentalGuideDataV3] Age (found):", Age);
        }
      }

      ageRatings.push({ Country, Code, Age });
      logger.log("[scrapeIMDBParentalGuideDataV3] ageRatings:", ageRatings);
    }

    let $IMDB_MinAge = null;
    let $IMDB_MaxAge = null;
    let $IMDB_id_AgeRating_Chosen_Country = null;

    for (let i = 0; i < ageRatings.length; i++) {
      const rating = ageRatings[i];
      const cachedRating = cacheAgeRatings.find(
        (cache) => cache.Country === rating.Country && cache.Code === rating.Code
      );

      if (!cachedRating) {
        await dbFireProcedure(`INSERT INTO tbl_AgeRating (Country, Code, Age) VALUES ($Country, $Code, $Age)`, {
          $Country: rating.Country,
          $Code: rating.Code,
          $Age: rating.Age,
        });
        rating.id_AgeRating = await dbFireProcedureReturnScalar(
          `SELECT id_AgeRating FROM tbl_AgeRating WHERE Country = $Country AND Code = $Code`,
          {
            $Country: rating.Country,
            $Code: rating.Code,
          }
        );

        cacheAgeRatings.push({
          id_AgeRating: rating.id_AgeRating,
          Country: rating.Country,
          Code: rating.Code,
          Age: rating.Age,
        });
      } else {
        rating.id_AgeRating = cachedRating.id_AgeRating;
      }

      if (
        rating.id_AgeRating &&
        rating.Age != null &&
        regionCodes.find((regionCode) => regionCode === rating.Country)
      ) {
        logger.log("[scrapeIMDBParentalGuideDataV3] AgeRating regions FOUND:", rating);
        $IMDB_id_AgeRating_Chosen_Country = rating.id_AgeRating;
      }

      if (rating.Age || rating.Age === 0) {
        if (!$IMDB_MinAge) {
          $IMDB_MinAge = rating.Age;
        }

        if (!$IMDB_MaxAge) {
          $IMDB_MaxAge = rating.Age;
        }

        if ($IMDB_MinAge > rating.Age) {
          $IMDB_MinAge = rating.Age;
        }
        if ($IMDB_MaxAge < rating.Age) {
          $IMDB_MaxAge = rating.Age;
        }
      }
    }

    logger.log("[scrapeIMDBParentalGuideDataV3] found age ratings:", ageRatings);

    // ### Parental Guides ###
    const parentsGuideCategoriesData = _.get(
      jsonDataNext,
      "props.pageProps.contentData.data.title.parentsGuide.categories",
      []
    );

    logger.log("[scrapeIMDBParentalGuideDataV3] parentsGuideCategoriesData:", parentsGuideCategoriesData);

    const $IMDB_Parental_Advisory_Nudity = scrapeIMDBParentalGuideDataV3_getParentalGuideSeverityFromCategory(
      parentsGuideCategoriesData,
      "NUDITY"
    );

    // Parental Guide: VIOLENCE
    const $IMDB_Parental_Advisory_Violence = scrapeIMDBParentalGuideDataV3_getParentalGuideSeverityFromCategory(
      parentsGuideCategoriesData,
      "VIOLENCE"
    );

    // Parental Guide: PROFANITY
    const $IMDB_Parental_Advisory_Profanity = scrapeIMDBParentalGuideDataV3_getParentalGuideSeverityFromCategory(
      parentsGuideCategoriesData,
      "PROFANITY"
    );

    // Parental Guide: ALCOHOL
    const $IMDB_Parental_Advisory_Alcohol = scrapeIMDBParentalGuideDataV3_getParentalGuideSeverityFromCategory(
      parentsGuideCategoriesData,
      "ALCOHOL"
    );

    // Parental Guide: FRIGHTENING
    const $IMDB_Parental_Advisory_Frightening = scrapeIMDBParentalGuideDataV3_getParentalGuideSeverityFromCategory(
      parentsGuideCategoriesData,
      "FRIGHTENING"
    );

    return {
      $IMDB_MinAge,
      $IMDB_MaxAge,
      $IMDB_id_AgeRating_Chosen_Country,
      $IMDB_Parental_Advisory_Nudity,
      $IMDB_Parental_Advisory_Violence,
      $IMDB_Parental_Advisory_Profanity,
      $IMDB_Parental_Advisory_Alcohol,
      $IMDB_Parental_Advisory_Frightening,
    };
  } catch (error) {
    if (movie.scanErrors) {
      movie.scanErrors["IMDB Parental Guide"] = error.message;
    }

    throw error;
  }
}

async function scrapeIMDBFullCreditsData(movie, actualDuplicate) {
  if (movie.scanErrors) {
    delete movie.scanErrors["IMDB Full Credits"];
  }

  let result = {
    topCredits: {
      $IMDB_Top_Directors: null,
      $IMDB_Top_Writers: null,
      $IMDB_Top_Producers: null,
      $IMDB_Top_Cast: null,
    },
    credits: [],
    scraperVersion: null,
  };

  //#region Copy from duplicate
  if (
    actualDuplicate &&
    actualDuplicate.IMDB_tconst &&
    actualDuplicate.IMDB_Done &&
    actualDuplicate.IMDB_tconst == movie.IMDB_tconst
  ) {
    logger.log("[scrapeIMDBFullCreditsData] using actualDuplicate data, no scraping needed");

    const credits = await db.fireProcedureReturnAll(
      `
      SELECT
      	Category AS category
	      , IMDB_Person_ID AS id
	      , Person_Name AS name
	      , Credit AS credit
      FROM tbl_Movies_IMDB_Credits
      WHERE id_Movies = $id_Movies`,
      { $id_Movies: actualDuplicate.id_Movies }
    );

    result = {
      topCredits: {
        $IMDB_Top_Directors: actualDuplicate.IMDB_Top_Directors,
        $IMDB_Top_Writers: actualDuplicate.IMDB_Top_Writers,
        $IMDB_Top_Producers: actualDuplicate.IMDB_Top_Producers,
        $IMDB_Top_Cast: actualDuplicate.IMDB_Top_Cast,
      },
      credits,
      scraperVersion: "V3",
    };

    return result;
  }
  //#endregion Copy from duplicate

  try {
    const url = `https://www.imdb.com/title/${movie.IMDB_tconst}/fullcredits`;
    logger.log("[scrapeIMDBFullCreditsData] url:", url);
    const response = await helpers.requestAsync(url);
    const html = response.body;

    if (/__NEXT_DATA__/.test(html)) {
      // V3
      logger.log("[scrapeIMDBFullCreditsData] going for V3");
      const result = await scrapeIMDBFullCreditsDataV3(movie, html);
      result.scraperVersion = "V3";
      return result;
    } else {
      logger.log("[scrapeIMDBFullCreditsData] going for V1");
      const result = await scrapeIMDBFullCreditsDataV1(movie, html);
      result.scraperVersion = "V1";
      return result;
    }
  } catch (error) {
    if (movie.scanErrors) {
      movie.scanErrors["scrapeIMDBFullCreditsData"] = error.message;
    }

    throw error;
  }
}

async function scrapeIMDBFullCreditsDataV1(movie, html) {
  const topMax = 5;

  const topCast = [];
  const topDirector = [];
  const topProducer = [];
  const topWriter = [];

  const credits = [];

  const rx_castTable = /<h4 name="cast"[\s\S]*?<\/table>/;

  if (rx_castTable.test(html)) {
    const castTable = html.match(rx_castTable)[0];

    const rx_castEntry = /<tr class.*?>[\s\S]*?<a href="\/name\/(nm\d*)\/[\s\S]*?>\s([\s\S]*?)<\/a>[\s\S]*?<\/tr>/g;

    let match = null;

    // eslint-disable-next-line no-cond-assign
    while ((match = rx_castEntry.exec(castTable))) {
      // const entry = { id: match[1], name: match[2].replace(/^\s*/, '').replace(/\s*$/, ''), character: null };
      const entry = {
        category: "Cast",
        id: match[1],
        name: unescape(
          htmlToText
            .fromString(match[2], {
              wordwrap: null,
              ignoreImage: true,
              ignoreHref: true,
            })
            .trim()
        ),
        credit: null,
      };

      const rx_character = /<td class="character">([\s\S]*?)<\/td>/;
      if (rx_character.test(match[0])) {
        entry.credit = unescape(
          htmlToText
            .fromString(match[0].match(rx_character)[1], {
              wordwrap: null,
              ignoreImage: true,
              ignoreHref: true,
            })
            .trim()
        );
      }

      credits.push(entry);
      if (topCast.length < topMax && !topCast.find((tc) => tc.name === entry.name)) {
        topCast.push(entry);
      }
    }
  }

  const rx_creditsCategories = /class="dataHeaderWithBorder">([\s\S]*?)&nbsp/g;

  let ccMatch = null;

  // eslint-disable-next-line no-cond-assign
  while ((ccMatch = rx_creditsCategories.exec(html))) {
    const creditsCategory = unescape(
      htmlToText.fromString(ccMatch[1], {
        wordwrap: null,
        ignoreImage: true,
        ignoreHref: true,
      })
    )
      .split("(")[0]
      .trim();
    logger.log("[scrapeIMDBFullCreditsDataV1] creditsCategory found:", creditsCategory);

    const result = parseCreditsCategory(html, creditsCategory, credits);

    if (creditsCategory === "Directed by") {
      result.forEach((entry) => {
        if (topDirector.length < topMax && !topDirector.find((td) => td.name === entry.name)) {
          topDirector.push(entry);
        }
      });
    }
    if (creditsCategory === "Produced by") {
      result.forEach((entry) => {
        if (topProducer.length < topMax && !topProducer.find((tp) => tp.name === entry.name)) {
          topProducer.push(entry);
        }
      });
    }
    if (creditsCategory.startsWith("Writing Credits")) {
      result.forEach((entry) => {
        if (topWriter.length < topMax && !topWriter.find((tw) => tw.name === entry.name)) {
          topWriter.push(entry);
        }
      });
    }
  }

  // logger.log("[scrapeIMDBFullCreditsDataV1] credits:", credits);

  let $IMDB_Top_Cast = topCast.length > 0 ? JSON.stringify(topCast) : null;
  let $IMDB_Top_Writers = topWriter.length > 0 ? JSON.stringify(topWriter) : null;
  let $IMDB_Top_Directors = topDirector.length > 0 ? JSON.stringify(topDirector) : null;
  let $IMDB_Top_Producers = topProducer.length > 0 ? JSON.stringify(topProducer) : null;

  return {
    topCredits: {
      $IMDB_Top_Directors,
      $IMDB_Top_Writers,
      $IMDB_Top_Producers,
      $IMDB_Top_Cast,
    },
    credits,
    scraperVersion: "V1",
  };
}

async function scrapeIMDBFullCreditsDataV3(movie, html) {
  const topMax = 5;

  const topCast = [];
  const topDirector = [];
  const topProducer = [];
  const topWriter = [];

  const credits = [];

  // get all available categories from __NEXT_DATA__
  const jsonDataNext = JSON.parse(
    (html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/) || [null, "{}"])[1]
  );

  const creditCategories = _.get(jsonDataNext, "props.pageProps.contentData.categories", []).map((creditCategory) => {
    return {
      id: creditCategory.id,
      name: creditCategory.name,
    };
  });

  logger.log("found categories:\n", creditCategories.map((cc) => cc.name).join("\n"));

  // move category with id = 'cast' to the front of creditCategories (V1 compatibility)
  const castCategoryIndex = creditCategories.findIndex((cc) => cc.id === "cast");
  if (castCategoryIndex > 0) {
    const castCategory = creditCategories.splice(castCategoryIndex, 1)[0];
    creditCategories.unshift(castCategory);
  }

  logger.log("[scrapeIMDBFullCreditsDataV3] creditCategories from __NEXT_DATA__:", creditCategories);

  for (const creditCategory of creditCategories) {
    // fetch GraphQL data for this category
    const uri = graphQLqueries.credits(movie.IMDB_tconst, creditCategory.id);

    logger.log(
      `[scrapeIMDBFullCreditsDataV3] category '${creditCategory.name}' (${creditCategory.id}), GraphQL uri:`,
      uri
    );

    const gqlCredits = await scrapeGraphQLPaginated(uri, "data.title.creditsV2");

    logger.log(
      `[scrapeIMDBFullCreditsDataV3] category '${creditCategory.name}' (${creditCategory.id}), gqlCredits.length:`,
      gqlCredits.length
    );

    const gqlCreditsMapped = (gqlCredits || [])
      .map((edge) => {
        const name = _.get(edge, "node.name.nameText.text");

        const DEBUG_LOG_NAME = "Stan Lee";
        if (name == DEBUG_LOG_NAME) {
          logger.log(`XXX ${DEBUG_LOG_NAME} edge:`, JSON.stringify(edge, null, 2));
        }

        let creditedFor =
          [
            (_.get(edge, "node.creditedRoles.edges", []) || [])
              .map((creditedForEdge) => _.get(creditedForEdge, "node.text", ""))
              .filter((creditedForText) => !!creditedForText)
              .join(" / "),
          ]
            .filter((cf) => !!cf)
            .join(", ") || null;

        const attributes = (_.get(edge, "node.creditedRoles.edges", []) || [])
          .flatMap((creditedForEdge) => _.get(creditedForEdge, "node.attributes", []))
          .map((attribute) => _.get(attribute, "text", ""))
          .filter((attributeText) => !!attributeText)
          .join(", ");

        if (name == DEBUG_LOG_NAME) {
          logger.log(`XXX ${DEBUG_LOG_NAME} attributes:`, attributes);
        }

        if (attributes) {
          creditedFor = `${creditedFor} (${attributes})`;
        }

        const result = {
          category: creditCategory.name,
          id: _.get(edge, "node.name.id"),
          name: _.get(edge, "node.name.nameText.text"),
          credit: creditedFor,
        };

        if (name == DEBUG_LOG_NAME) {
          logger.log(`XXX ${DEBUG_LOG_NAME} result:`, JSON.stringify(result, null, 2));
        }

        return result;
      })
      .filter((credit) => !!credit.id && !!credit.name);

    const gqlCreditsMappedMerged = [];

    // gqlCreditsMapped can contain multiple entries for the same person and department (e.g. Stan Lee in Writers for "based on the Marvel comics by" and "Groot created by")
    for (const gqlCreditsMappedItem of gqlCreditsMapped) {
      const existingItem = gqlCreditsMappedMerged.find(
        (item) => item.category === gqlCreditsMappedItem.category && item.id === gqlCreditsMappedItem.id
      );

      if (existingItem) {
        if (gqlCreditsMappedItem.credit && existingItem.credit !== gqlCreditsMappedItem.credit) {
          existingItem.credit = `${existingItem.credit} / ${gqlCreditsMappedItem.credit}`;
        }
      } else {
        gqlCreditsMappedMerged.push(gqlCreditsMappedItem);
      }
    }

    credits.push(...gqlCreditsMappedMerged);

    // logger.log(`[scrapeIMDBFullCreditsDataV3] credits[0]:`, credits[0]);

    // fill top categories
    const creditCategoryLowerCase = creditCategory.name.toLowerCase();
    if (
      ["cast", "director", "directors", "producer", "producers", "writer", "writers"].includes(
        creditCategory.name.toLowerCase()
      )
    ) {
      const topCategory =
        creditCategoryLowerCase === "cast"
          ? topCast
          : creditCategoryLowerCase === "director" || creditCategoryLowerCase === "directors"
          ? topDirector
          : creditCategoryLowerCase === "producer" || creditCategoryLowerCase === "producers"
          ? topProducer
          : creditCategoryLowerCase === "writer" || creditCategoryLowerCase === "writers"
          ? topWriter
          : null;

      if (!topCategory) {
        throw new Error("INTERNAL ERROR - unknown credit category: " + creditCategoryLowerCase);
      }

      gqlCreditsMapped.forEach((entry) => {
        if (topCategory.length < topMax && !topCategory.find((tc) => tc.name === entry.name)) {
          topCategory.push(entry);
        }
      });
    }

    // logger.log(`[scrapeIMDBFullCreditsDataV3] category '${creditCategory.id}, gqlCreditsMapped:`, gqlCreditsMapped);
  }

  // logger.log("[scrapeIMDBFullCreditsDataV3] topCredits:", { topDirector, topWriter, topProducer, topCast });

  let $IMDB_Top_Cast = topCast.length > 0 ? JSON.stringify(topCast) : null;
  let $IMDB_Top_Writers = topWriter.length > 0 ? JSON.stringify(topWriter) : null;
  let $IMDB_Top_Directors = topDirector.length > 0 ? JSON.stringify(topDirector) : null;
  let $IMDB_Top_Producers = topProducer.length > 0 ? JSON.stringify(topProducer) : null;

  return {
    topCredits: {
      $IMDB_Top_Directors,
      $IMDB_Top_Writers,
      $IMDB_Top_Producers,
      $IMDB_Top_Cast,
    },
    credits,
  };
}

function getGQLCompaniesData(gqlCompaniesEdges, category) {
  const topMax = 5;
  const companies = [];
  const topCompanies = [];

  if (!gqlCompaniesEdges) {
    return { companies, topCompanies };
  }

  gqlCompaniesEdges.forEach((edge) => {
    const node = edge.node;
    const entry = {
      category: category,
      id: node.company.id,
      name: _.get(node, "displayableProperty.value.plainText", null),
      role: null,
    };

    const roles = [];

    let yearsInvolved = "";
    if (node.yearsInvolved && node.yearsInvolved.year) {
      yearsInvolved = `${node.yearsInvolved.year}${
        node.yearsInvolved.endYear && node.yearsInvolved.year !== node.yearsInvolved.endYear
          ? `-${node.yearsInvolved.endYear}`
          : ""
      }`;
    }

    let countries = "";
    if (node.countries && node.countries.length > 0) {
      node.countries.forEach((country) => {
        countries = `${countries ? ", " : ""}${country.text}`;
      });
    }

    if (yearsInvolved || countries) {
      roles.push(`(${countries}${countries && yearsInvolved ? ", " : ""}${yearsInvolved})`);
    }

    if (node.attributes && node.attributes.length > 0) {
      let attributes = "";

      node.attributes.forEach((attribute) => {
        attributes = `${attributes ? `${attributes}, ` : ""}${attribute.text}`;
      });

      roles.push(`(${attributes})`);
    }

    entry.role = roles.join(" ");

    companies.push(entry);

    if (topCompanies.length < topMax && !topCompanies.find((tc) => tc.name === entry.name)) {
      topCompanies.push(entry);
    }
  });

  return { companies, topCompanies };
}

/**
 * Scrape companies from JSON provided by GraphQL
 * @param {Object} movie
 */
async function scrapeIMDBCompaniesDataV3(movie, actualDuplicate) {
  // TODO: use the page to identify the categories (e.g. https://www.imdb.com/title/tt0095327/companycredits/)
  if (movie.scanErrors) {
    delete movie.scanErrors["IMDB Companies"];
  }

  let result = {
    topProductionCompanies: {
      $IMDB_Top_Production_Companies: null,
    },
    companies: [],
  };

  //#region Copy from duplicate
  if (
    actualDuplicate &&
    actualDuplicate.IMDB_tconst &&
    actualDuplicate.IMDB_Done &&
    actualDuplicate.IMDB_tconst == movie.IMDB_tconst
  ) {
    logger.log("[scrapeIMDBCompaniesDataV3] using actualDuplicate data, no scraping needed");

    const companies = await db.fireProcedureReturnAll(
      `
        SELECT
          Category AS category
          , IMDB_Company_ID AS id
          , Company_Name AS name
          , Role AS role
        FROM tbl_Movies_IMDB_Companies
        WHERE id_Movies = $id_Movies`,
      { $id_Movies: actualDuplicate.id_Movies }
    );

    result = {
      topProductionCompanies: {
        $IMDB_Top_Production_Companies: actualDuplicate.IMDB_Top_Production_Companies,
      },
      companies,
    };

    return result;
  }
  //#endregion Copy from duplicate

  try {
    const gqlCompaniesProductionEdges = await scrapeGraphQLPaginated(
      graphQLqueries.companies(movie.IMDB_tconst, "production"),
      "data.title.companyCredits"
    );

    const { companies: companiesProduction, topCompanies: topCompaniesProduction } = getGQLCompaniesData(
      gqlCompaniesProductionEdges,
      "Production"
    );

    const gqlCompaniesDistributionEdges = await scrapeGraphQLPaginated(
      graphQLqueries.companies(movie.IMDB_tconst, "distribution"),
      "data.title.companyCredits"
    );

    const { companies: companiesDistribution } = getGQLCompaniesData(gqlCompaniesDistributionEdges, "Distribution");

    const gqlCompaniesSpecialEffectsEdges = await scrapeGraphQLPaginated(
      graphQLqueries.companies(movie.IMDB_tconst, "specialEffects"),
      "data.title.companyCredits"
    );

    const { companies: companiesSpecialEffects } = getGQLCompaniesData(
      gqlCompaniesSpecialEffectsEdges,
      "Special Effects"
    );

    const gqlCompaniesOtherEdges = await scrapeGraphQLPaginated(
      graphQLqueries.companies(movie.IMDB_tconst, "miscellaneous"),
      "data.title.companyCredits"
    );

    const { companies: companiesOther } = getGQLCompaniesData(gqlCompaniesOtherEdges, "Other");

    return {
      topProductionCompanies: {
        $IMDB_Top_Production_Companies:
          topCompaniesProduction.length > 0 ? JSON.stringify(topCompaniesProduction) : null,
      },
      companies: [...companiesProduction, ...companiesDistribution, ...companiesSpecialEffects, ...companiesOther],
    };
  } catch (error) {
    logger.error(error);

    if (movie.scanErrors) {
      movie.scanErrors["IMDB Companies"] = error.message;
    }

    throw error;
  }
}

/**
 * DEPRECATED: scrape companies from HTML
 * @param {Object} movie
 * @returns
 */
async function scrapeIMDBCompaniesDataV1(movie) {
  if (movie.scanErrors) {
    delete movie.scanErrors["IMDB Companies"];
  }

  try {
    const url = `https://www.imdb.com/title/${movie.IMDB_tconst}/companycredits`;
    logger.log("[scrapeIMDBCompaniesData] url:", url);
    const response = await helpers.requestAsync(url);
    const html = response.body;

    const topMax = 5;

    const topProductionCompanies = [];

    const companies = [];

    const rx_companiesCategories =
      /<h4 class="dataHeaderWithBorder" id="(.*?)" name="(.*?)">(.*?)<\/h4>[\s\S]*?<\/ul>/g;

    let ccMatch = null;

    // eslint-disable-next-line no-cond-assign
    while ((ccMatch = rx_companiesCategories.exec(html))) {
      const companiesCategoryID = ccMatch[1].trim();
      const companiesCategoryName = ccMatch[3].replace("Companies", "").trim();

      logger.log("[scrapeIMDBCompaniesData]", {
        companiesCategoryID,
        companiesCategoryName,
      });

      const result = parseCompaniesCategory(companiesCategoryName, ccMatch[0], companies);

      if (companiesCategoryName === "Production") {
        result.forEach((entry) => {
          if (
            topProductionCompanies.length < topMax &&
            !topProductionCompanies.find((tpc) => tpc.name === entry.name)
          ) {
            topProductionCompanies.push(entry);
          }
        });
      }
    }

    logger.log("[scrapeIMDBCompaniesData] companies:", companies);
    logger.log("[scrapeIMDBCompaniesData] topProductionCompanies:", topProductionCompanies);

    return {
      topProductionCompanies: {
        $IMDB_Top_Production_Companies:
          topProductionCompanies.length > 0 ? JSON.stringify(topProductionCompanies) : null,
      },
      companies,
    };
  } catch (error) {
    if (movie.scanErrors) {
      movie.scanErrors["IMDB Companies"] = error.message;
    }

    throw error;
  }
}

function parseCompaniesCategory(category, matchedhtml, companies) {
  const result = [];

  // <li>
  // <a href="/company/co0046718?ref_=ttco_co_1"
  // >New Line Cinema</a>            (presents)
  //      </li>
  const rx_entry = /<li>[\s\S]*?<a href="\/company\/(co\d*)[\s\S]*?>([\s\S]*?)<\/a>([\s\S]*?)<\/li>/g;

  let match = null;

  // eslint-disable-next-line no-cond-assign
  while ((match = rx_entry.exec(matchedhtml))) {
    const entry = {
      category,
      id: match[1],
      name: match[2].trim(),
      role: match[3].trim(),
    };

    companies.push(entry);
    result.push(entry);
  }

  return result;
}

function parseCreditsCategory(html, tableHeader, credits) {
  const rx_table = new RegExp(`"dataHeaderWithBorder">${tableHeader}[\\s\\S]*?<\\/table>`);

  const result = [];

  if (rx_table.test(html)) {
    const table = html.match(rx_table)[0];

    const rx_entry = /<tr>[\s\S]*?<a href="\/name\/(nm\d*)\/[\s\S]*?>([\s\S]*?)<\/a>[\s\S]*?<\/tr>/g;

    let match = null;

    // eslint-disable-next-line no-cond-assign
    while ((match = rx_entry.exec(table))) {
      const entry = {
        category: tableHeader,
        id: match[1],
        name: match[2].trim(),
        credit: null,
      };

      const rx_credit = /<td class="credit">([\s\S]*?)<\/td>/;
      if (rx_credit.test(match[0])) {
        entry.credit = match[0].match(rx_credit)[1].trim();
      }

      credits.push(entry);
      result.push(entry);
    }
  }

  return result;
}

async function scrapeIMDBPersonData($IMDB_Person_ID, downloadFileCallback) {
  const url = `https://www.imdb.com/name/${$IMDB_Person_ID}`;
  const response = await helpers.requestAsync(url);
  const html = response.body;

  logger.log("[scrapeIMDBPersonData] url:", url);

  // check if V1(+2) or V3
  if (/styleguide/.test(html)) {
    // V1+2
    return await scrapeIMDBPersonDataV1($IMDB_Person_ID, downloadFileCallback, html);
  } else {
    // V3
    return await scrapeIMDBPersonDataV3($IMDB_Person_ID, downloadFileCallback, html);
  }
}

async function scrapeIMDBPersonDataV1($IMDB_Person_ID, downloadFileCallback, html) {
  logger.log("[scrapeIMDBPersonDataV1] START");

  const result = {
    $IMDB_Person_ID,
    $Photo_URL: null,
    $ShortBio: null,
    $LongBio: null,
  };

  const rxShortBio = /<div class="name-trivia-bio-text">([\s\S]*?)<\/div>/;

  if (rxShortBio.test(html)) {
    logger.log("[scrapeIMDBPersonData] bio found");
    result.$ShortBio = unescape(
      htmlToText
        .fromString(html.match(rxShortBio)[1], {
          wordwrap: null,
          ignoreImage: true,
          ignoreHref: true,
        })
        .replace("See full bio", "")
        .trim()
    );
  } else {
    logger.log("[scrapeIMDBPersonData] bio NOT found");
  }

  const rxPhotoURL = /<img id="name-poster"[\s\S]*?src="(.*?)"/;

  if (rxPhotoURL.test(html)) {
    const url = html.match(rxPhotoURL)[1];
    const photoPath = `extras/${$IMDB_Person_ID}_poster.jpg`;
    const success = await downloadFileCallback(url, photoPath, false);

    if (success) {
      result.$Photo_URL = photoPath;
    }
  }

  const urlBio = `https://www.imdb.com/name/${$IMDB_Person_ID}/bio`;
  const responseBio = await helpers.requestAsync(urlBio);
  const htmlBio = responseBio.body;

  const rxLongBio = /<h4 class="li_group">Mini Bio[\s\S]*?(<div[\s\S]*?)<\/div>/;

  if (rxLongBio.test(htmlBio)) {
    logger.log("[scrapeIMDBPersonData] LONG BIO FOUND!:", {
      longbio: htmlBio.match(rxLongBio)[1],
    });
    result.$LongBio = unescape(
      htmlToText
        .fromString(htmlBio.match(rxLongBio)[1], {
          wordwrap: null,
          ignoreImage: true,
          ignoreHref: true,
        })
        .trim()
    );
  }

  return result;
}

async function scrapeIMDBPersonDataV3($IMDB_Person_ID, downloadFileCallback, html) {
  logger.log("[scrapeIMDBPersonDataV3] START");

  const result = {
    $IMDB_Person_ID,
    $Photo_URL: null,
    $ShortBio: null,
    $LongBio: null,
  };

  const jsonDataNext = JSON.parse(
    (html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/) || [null, "{}"])[1]
  );

  // logger.log("[scrapeIMDBPersonDataV3] jsonDataNext:", logger.inspectObject(jsonDataNext));
  result.$LongBio = _.get(jsonDataNext, "props.pageProps.aboveTheFold.bio.text.plaidHtml", null);
  result.$LongBio = unescape(
    htmlToText
      .fromString(result.$LongBio, {
        wordwrap: null,
        ignoreImage: true,
        ignoreHref: true,
      })
      .trim()
  );
  result.$ShortBio = _.truncate(result.$LongBio, {
    length: 356,
    separator: " ",
    omission: " ...  »",
  });

  const photoURL = _.get(jsonDataNext, "props.pageProps.aboveTheFold.primaryImage.url", null);

  if (photoURL) {
    const photoPath = `extras/${$IMDB_Person_ID}_poster.jpg`;
    const success = await downloadFileCallback(photoURL, photoPath, false);

    if (success) {
      result.$Photo_URL = photoPath;
    }
  }

  return result;
}

/**
 * DEPRECATED: use scrapeIMDBPersonDataV3 instead
 * @param {*} title
 * @param {*} titleTypes
 * @returns
 */
async function scrapeIMDBAdvancedTitleSearch(title, titleTypes) {
  // only supports latin characters!
  // Web UI: https://www.imdb.com/search/title/
  // DEPRECATED: https://www.imdb.com/search/title/?title=Gnothi Seauton&view=advanced
  //             optional: &title_type=feature,tv_movie,tv_series,tv_episode,tv_special,tv_miniseries,documentary,short,video,tv_short
  const url =
    `https://www.imdb.com/search/title/?title=${title}` +
    (titleTypes.find((titleType) => !titleType.checked)
      ? "&title_type=" +
        titleTypes
          .filter((titleType) => titleType.checked)
          .map((titleType) => titleType.id)
          .reduce((prev, current) => prev + (prev ? "," : "") + current)
      : "");

  logger.log("[scrapeIMDBAdvancedTitleSearch] url:", url);

  const response = await helpers.requestAsync(url);
  const html = response.body;
  const $ = cheerio.load(html);

  const items = $(".lister-item.mode-advanced");

  // logger.log('[scrapeIMDBAdvancedTitleSearch] items:', items);

  const results = [];

  items.each((index, item) => {
    let tconst = $($(item).find("h3.lister-item-header > a")).attr("href");

    if (tconst) {
      tconst = tconst.match(/tt\d*/)[0];
    }

    // logger.log('[scrapeIMDBAdvancedTitleSearch] item:', $(this).html());
    const imageURL = $($(item).find(".lister-item-image > a > img")).attr("loadlate");

    let title = $($(item).find("h3.lister-item-header")).text();
    title = title.replace(/[\s\n]/g, " ").replace(/^\s*\d+\./, "");
    while (/\s\s/g.test(title)) {
      title = title.replace(/\s\s/g, "");
    }

    const ageRating = $($(item).find("span.certificate")).text();
    const runtime = $($(item).find("span.runtime")).text();
    const genres = $($(item).find("span.genre")).text().trim();

    let detailInfo = "";
    if (ageRating) {
      detailInfo += ageRating;
    }
    if (runtime) {
      detailInfo += (detailInfo ? " | " : "") + runtime;
    }
    if (genres) {
      detailInfo += (detailInfo ? " | " : "") + genres;
    }

    results.push({
      tconst,
      title,
      imageURL,
      ageRating,
      runtime,
      genres,
      detailInfo,
    });
  });

  logger.log("[scrapeIMDBAdvancedTitleSearch] results:", results);

  return results;
}

/**
 * GraphQL based advanced title search (does not support unicode!)
 * WebUI: https://www.imdb.com/search/title/?title=bluey
 * @param {*} title
 * @param {*} titleTypes
 * @returns
 */
async function scrapeIMDBAdvancedTitleSearchV3(title, titleTypes) {
  logger.log("[scrapeIMDBAdvancedTitleSearchV3] START", { title, titleTypes });

  try {
    const uri = graphQLqueries.advancedTitleSearch(title, titleTypes);

    logger.log("[scrapeIMDBAdvancedTitleSearchV3] uri:", uri);

    const gqlTitles = JSON.parse(
      (await helpers.requestAsync({ uri, headers: { "content-type": "application/json" } })).body
    );
    handleGraphQLErrors(gqlTitles);

    logger.log("[scrapeIMDBAdvancedTitleSearchV3] gqlTitles:", gqlTitles);

    const results =
      gqlTitles && gqlTitles.data && gqlTitles.data.advancedTitleSearch
        ? gqlTitles.data.advancedTitleSearch.edges.map((edge) => {
            return {
              tconst: _.get(edge.node.title, "id", null),
              title: _.get(edge.node.title, "titleText.text", null),
              year: _.get(edge.node.title, "releaseYear.year", null),
              imageURL: _.get(edge.node.title, "primaryImage.url", null),
              ageRating: _.get(edge.node.title, "certificate.rating", null),
              runtimeSeconds: _.get(edge.node.title, "runtime.seconds", null),
              genres: (_.get(edge.node.title, "titleGenres.genres", null) || [])
                .map((genre) => genre.genre.text)
                .join(", "),
              rating: _.get(edge.node.title, "ratingsSummary.aggregateRating", null),
              numVotes: _.get(edge.node.title, "ratingsSummary.voteCount", null),
              mediaType: _.get(edge.node.title, "titleType.displayableProperty.value.plainText", null),
            };
          })
        : [];

    results.forEach((result) => {
      let detailInfo = "";
      if (result.ageRating) {
        detailInfo += result.ageRating;
      }

      result.runtime = helpers.getTimeStringMinutes(result.runtimeSeconds);

      if (result.runtime) {
        detailInfo += (detailInfo ? " | " : "") + result.runtime;
      }
      if (result.genres) {
        detailInfo += (detailInfo ? " | " : "") + result.genres;
      }

      result.detailInfo = detailInfo;
    });

    logger.log("[scrapeIMDBAdvancedTitleSearchV3] results[0]:", results[0]);

    return results;
  } catch (error) {
    logger.error("[scrapeIMDBAdvancedTitleSearchV3] ERROR:", error);

    throw error;
  }
}

/**
 * IMPORTANT: this only supports latin characters!
 * @param {string} searchTerm
 */
async function scrapeIMDBSuggestion(searchTerm) {
  // only supports latin characters!
  // https://v2.sg.media-imdb.com/suggestion/d/Das%20Phantom%20Kommando%20(1985).json
  const url = `https://v2.sg.media-imdb.com/suggestion/${searchTerm[0].toLowerCase()}/${querystring.escape(
    searchTerm
  )}.json`;

  logger.log("[scrapeIMDBSuggestion] url:", url);

  const response = await helpers.requestAsync(url);

  let objResponse = null;

  try {
    objResponse = JSON.parse(response.body);
  } catch (err) {
    logger.error("[scrapeIMDBSuggestion] failed parsing response body:", response.body);
  }

  const results = [];

  if (objResponse && objResponse.d && objResponse.d.length > 0) {
    objResponse.d.forEach((item) => {
      if (!item.id.startsWith("tt")) {
        return; // later we found promotional stuff in the suggestions search, e.g. /features/kleenexscore :D
      }

      results.push({
        tconst: item.id,
        title: item.l,
        titleType: item.q,
        year: item.y,
        imageURL: item.i ? item.i.imageUrl : null,
      });
    });
  }

  return results;
}

/**
 * DEPRECATED: "Find" search, also supports Unicode using the HTML
 * @param  {string} searchTerm
 * @param  {string} [type]
 */
async function scrapeIMDBFind(searchTerm, type) {
  // ALL:      https://www.imdb.com/find/?q=天気の子
  // Titles:   https://www.imdb.com/find/?s=tt&q=天気の子
  // Episodes: https://www.imdb.com/find/?s=ep&q=start%26over
  // People:   https://www.imdb.com/find/?s=nm&q=laurence+fishburn
  // Company:  https://www.imdb.com/find/?s=co&q=universal
  // Keyword:  https://www.imdb.com/find/?s=kw&q=christmas
  const url = `https://www.imdb.com/find/?q=${querystring.escape(searchTerm)}${type ? "&s=" + type : ""}`;

  logger.log("[scrapeIMDBFind] url:", url);

  const response = await helpers.requestAsync(url);
  const html = response.body;
  const $ = cheerio.load(html);

  const items = $("tr.findResult");

  // logger.log("[scrapeIMDBFind] items:", items);

  const results = [];

  items.each((index, item) => {
    const result = {
      tconst: null,
      type: null,
      title: null,
      year: null,
      imageURL: null,
    };

    const idString = $($(item).find("td.primary_photo > a")).attr("href");

    if ($($(item).find("img"))) {
      result.imageURL = $($(item).find("img")).attr("src");
    }

    if (idString) {
      if (/tt\d*/.test(idString)) {
        result.tconst = idString.match(/tt\d*/)[0];
        result.type = "title";
      } else if (/nm\d*/.test(idString)) {
        result.tconst = idString.match(/nm\d*/)[0];
        result.type = "name";
      }
    }

    if (!result.tconst) {
      return;
    }

    result.title = $($(item).find("td.result_text")).text().trim();

    const attributes = $($(item).find("td.result_text")).html();
    const rxYear = /<\/a>.*?\((\d\d\d\d)\)/;
    if (rxYear.test(attributes)) {
      result.year = parseInt(attributes.match(rxYear)[1]);
    }

    // result.resultText = result.resultText.replace(/[\s\n]/g, " ");
    while (/\s\s/g.test(result.title)) {
      result.title = result.title.replace(/\s\s/g, "");
    }

    results.push(result);
  });

  return results;
}

/**
 * GraphQL based find page search, supports Unicode!
 * @param {*} title
 * @returns
 */
async function scrapeIMDBFindPageSearchV3(title) {
  logger.log("[scrapeIMDBFindPageSearchV3] START", { title });

  try {
    const uri = graphQLqueries.findPageSearch(title);

    logger.log("[scrapeIMDBFindPageSearchV3] uri:", uri);

    const gqlTitles = JSON.parse(
      (await helpers.requestAsync({ uri, headers: { "content-type": "application/json" } })).body
    );
    handleGraphQLErrors(gqlTitles);

    logger.log("[scrapeIMDBFindPageSearchV3] gqlTitles:", gqlTitles);

    const results =
      gqlTitles && gqlTitles.data && gqlTitles.data.results
        ? gqlTitles.data.results.edges.map((edge) => {
            return {
              type: _.get(edge.node, "entity.__typename", null),
              tconst: _.get(edge.node, "entity.id", null),
              title: _.get(edge.node, "entity.titleText.text", ""),
              year: _.get(edge.node, "entity.releaseYear.year", null),
              imageURL: _.get(edge.node, "entity.primaryImage.url", null),
              ageRating: null,
              runtimeSeconds: null,
              genres: null,
              rating: null,
              numVotes: null,
              mediaType: _.get(edge.node, "entity.titleType.displayableProperty.value.plainText", null),
            };
          })
        : [];

    // results.forEach((result) => {
    //   let detailInfo = "";
    //   if (result.ageRating) {
    //     detailInfo += result.ageRating;
    //   }

    //   result.runtime = helpers.getTimeStringMinutes(result.runtimeSeconds);

    //   if (result.runtime) {
    //     detailInfo += (detailInfo ? " | " : "") + result.runtime;
    //   }
    //   if (result.genres) {
    //     detailInfo += (detailInfo ? " | " : "") + result.genres;
    //   }

    //   result.detailInfo = detailInfo;
    // });

    logger.log("[scrapeIMDBFindPageSearchV3] results[0]:", results[0]);

    return results;
  } catch (error) {
    logger.error("[scrapeIMDBFindPageSearchV3] ERROR:", error);

    // return [];
    throw error;
  }
}

async function scrapeIMDBTrailerMediaURLsV3(html) {
  try {
    logger.log("[scrapeIMDBTrailerMediaURLsV3] START");

    // V3: we partially use the __NEXT_DATA__ data, too
    const jsonDataNext = JSON.parse(
      (html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/) || [null, "{}"])[1]
    );

    // logger.log("[scrapeIMDBTrailerMediaURLsV3] jsonDataNext:", logger.inspectObject(jsonDataNext));

    // V3
    let mediaURLs = _.get(jsonDataNext, "props.pageProps.videoPlaybackData.video.playbackURLs", []).map(
      (playbackURL) => {
        return {
          definition: playbackURL.displayName.value,
          mimeType: playbackURL.mimeType,
          mediaURL: playbackURL.url,
        };
      }
    );
    logger.log("[scrapeIMDBTrailerMediaURLsV3] mediaURLs:", logger.inspectObject(mediaURLs));

    const result = {
      mediaURLs,
      slateURL: null, // no slate url in V3
    };

    return result;
  } catch (err) {
    logger.error(err);
    throw err;
  }
}

async function scrapeIMDBTrailerMediaURLsV1(html) {
  try {
    logger.log("[scrapeIMDBTrailerMediaURLsV1] START");

    const mediaURLs = [];

    // logger.log("[scrapeIMDBTrailerMediaURLs] trailerURLs html:", html);

    // OLD: mimeType, url, displayName
    // "mimeType":"application/x-mpegurl","url":"https://imdb-video.media-imdb.com/vi3904176409/hls-1563415099186-master.m3u8?Expires=1662285123\u0026Signature=SytIHP0GmrooACG~4TQic~SvLmx1ZO5C19okQNOvTwVDtLW3AosKyf8imZlSwLiXH62XATzQycCANPHHLmV2thnTZC-ag6zO7Nf-iytjJUoeYPY7PzxUiebt3k8mSZWrgQUpo3DvAU3Mi7EcNRzhqUSKs4NI-8ghvEEMtfZmLDtjzY9R6Otomr8dHt5AqafMFJf4GZOEpW3rqP1sDl1GMkaRLJOFJwqS32xICFcYG0Eaok5Qm4Lo5TJWWwAi~eyuWZDh-25xMNDaMRpznuo~VhKHcNWpt7fO3JHIIfEl0AnOt0X~esP4vxcYronHDpahSfiO2hPmVozd~9Ii2HrXwA__\u0026Key-Pair-Id=APKAIFLZBVQZ24NQH3KA","displayName":{"value":"AUTO","language":"en-US","__typename":"LocalizedString"},"__typename":"PlaybackURL"
    // const rxMediaURL = /"mimeType":"(.*?)","url":"(.*?)","displayName":{"value":"(.*?)"/g;

    // NEW: displayName, mimeType, url
    // "displayName":{"value":"AUTO","language":"en-US","__typename":"LocalizedString"},"mimeType":"application/x-mpegurl","url":"https://imdb-video.media-imdb.com/vi2163260441/hls-1556354704370-master.m3u8?Expires=1693139566\u0026Signature=cIIoIbiGpnNaoSbMdXih4BsbXDpPsZMPS4dTbbSdi5lfm7~LnYCej58t50RtboMZ2IL0a2PouTjkJpJoBf0Q9UHFnPESx9sDahiLim5qrv6xQTL8wrYIR8pH5gYRzEuHa~vxDxBkq9~qHsvUrDy9uk~JGmYkMoKHnn9V5KV4aohDRVabb7-YyqMh2vDF2XFPB2051mGVyVpTYdeATjuQKOfBTM0oxELXfCJz1u8~S9cO9HfeOvKqvxOGAgLRL~hh8JtEctOwEYjrVwAuCKGViNDvFhsBPmMz~xCtfi0zzWqMjvDcseK2KSy~7gTnxKAKCdBF3UQuorFtA8wlgQJclw__\u0026Key-Pair-Id=APKAIFLZBVQZ24NQH3KA"
    const rxMediaURL = /"displayName":{"value":"(.*?)".*?},"mimeType":"(.*?)","url":"(.*?)"/g;

    let match = null;

    // eslint-disable-next-line no-cond-assign
    while ((match = rxMediaURL.exec(html))) {
      const definition = match[1];
      const mimeType = match[2].replace(/\\u002F/g, "/");
      const mediaURL = match[3].replace(/\\u002F/g, "/").replace(/\\u0026/g, "&");

      mediaURLs.push({
        definition,
        mimeType,
        mediaURL,
      });
    }

    const rxSlate = /"slate":.*?"url":"(.*?)"/;

    let slateURL = null;
    if (rxSlate.test(html)) {
      slateURL = html.match(rxSlate)[1].replace(/\\u002F/g, "/");
    }

    const result = {
      mediaURLs,
      slateURL,
    };

    logger.log("[scrapeIMDBTrailerMediaURLsV1] result:", result);

    return result;
  } catch (err) {
    logger.error(err);
    throw err;
  }
}

async function scrapeIMDBTrailerMediaURLs(trailerURL) {
  try {
    // We're only interested in the vi012345678 id and use it for https://www.imdb.com/videoplayer/vi012345678
    const videoId = trailerURL.match(/vi\d+/)[0];
    trailerURL = `https://www.imdb.com/videoplayer/${videoId}`;

    logger.log("[scrapeIMDBTrailerMediaURLs] trailerURL:", trailerURL);

    const response = await helpers.requestAsync({
      uri: trailerURL,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36",
      },
    });

    logger.log("[scrapeIMDBTrailerMediaURLs] response.statusCode:", response.statusCode);

    if (response.statusCode !== 200) {
      return {
        errorcode: response.statusCode,
      };
    }

    const html = response.body;

    let result = await scrapeIMDBTrailerMediaURLsV3(html);
    logger.debug("[scrapeIMDBTrailerMediaURLs] V3 result:", result);

    if (!result || !result.mediaURLs || result.mediaURLs.length === 0) {
      // Fallback to V1
      result = await scrapeIMDBTrailerMediaURLsV1(html);
    }

    return result;
  } catch (err) {
    logger.error(err);
    throw err;
  }
}

async function scrapeIMDBplotKeywordsV3(movie, actualDuplicate) {
  if (movie.scanErrors) {
    delete movie.scanErrors["IMDB Plot Keywords"];
  }

  try {
    const plotKeywords = [];

    //#region Copy from duplicate
    if (
      actualDuplicate &&
      actualDuplicate.IMDB_tconst &&
      actualDuplicate.IMDB_Done &&
      actualDuplicate.IMDB_tconst == movie.IMDB_tconst
    ) {
      logger.log("[scrapeIMDBplotKeywordsV3] using actualDuplicate data, no scraping needed");
    }

    //#endregion Copy from duplicate

    const gqlPlotKeywordsEdges = await scrapeGraphQLPaginated(
      graphQLqueries.plotKeywords(movie.IMDB_tconst),
      "data.title.keywords"
    );

    gqlPlotKeywordsEdges.forEach((edge) => {
      plotKeywords.push({
        Keyword: helpers.uppercaseEachWord(edge.node.keyword.text.text.trim()),
        NumVotes: edge.node.interestScore.usersVoted,
        NumRelevant: edge.node.interestScore.usersInterested,
      });
    });

    return plotKeywords;
  } catch (error) {
    logger.error(error);

    if (movie.scanErrors) {
      movie.scanErrors["IMDB Plot Keywords"] = error.message;
    }

    throw error;
  }
}

/**
 * DEPRECATED: use scrapeIMDBplotKeywordsV3 instead
 * @param {*} movie
 * @returns
 */
async function scrapeIMDBplotKeywords(movie) {
  if (movie.scanErrors) {
    delete movie.scanErrors["IMDB Plot Keywords"];
  }

  try {
    let plotKeywords = [];

    const url = `https://www.imdb.com/title/${movie.IMDB_tconst}/keywords`;
    logger.log("[scrapeIMDBplotKeywords] url:", url);

    const response = await helpers.requestAsync(url);
    const html = response.body;

    const rxPlotKeywords = /<a href="\/search\/keyword\?[\s\S]*?>(.*?)<\/a>[\s\S]*?>(.*?relevant)/g;

    let match = null;

    while ((match = rxPlotKeywords.exec(html))) {
      // logger.log("[scrapeIMDBplotKeywords] keyword:", match[1].trim());
      const Keyword = helpers.uppercaseEachWord(match[1].trim());
      // logger.log("[scrapeIMDBplotKeywords] keyword uppercased:", Keyword);

      const relevanceString = match[2].trim();
      let NumVotes = null;
      let NumRelevant = null;

      const rxRelevance = /(\d+) of (\d+)/;
      if (rxRelevance.test(relevanceString)) {
        NumRelevant = parseInt(relevanceString.match(rxRelevance)[1]);
        NumVotes = parseInt(relevanceString.match(rxRelevance)[2]);
      }

      plotKeywords.push({
        Keyword,
        NumVotes,
        NumRelevant,
      });
    }

    logger.log("[scrapeIMDBplotKeywords] plotKeywords:", plotKeywords);

    return plotKeywords;
  } catch (error) {
    if (movie.scanErrors) {
      movie.scanErrors["IMDB Plot Keywords"] = error.message;
    }

    throw error;
  }
}

async function scrapeIMDBFilmingLocationsV3(movie, actualDuplicate) {
  if (movie.scanErrors) {
    delete movie.scanErrors["IMDB Filming Locations"];
  }

  let filmingLocations = [];

  //#region Copy from duplicate
  if (
    actualDuplicate &&
    actualDuplicate.IMDB_tconst &&
    actualDuplicate.IMDB_Done &&
    actualDuplicate.IMDB_tconst == movie.IMDB_tconst
  ) {
    logger.log("[scrapeIMDBFilmingLocationsV3] using actualDuplicate data, no scraping needed");

    filmingLocations = await db.fireProcedureReturnAll(
      `
        SELECT
          Location
            , Details
            , NumInteresting
            , NumVotes
        FROM tbl_Movies_IMDB_Filming_Locations MFL
        INNER JOIN tbl_IMDB_Filming_Locations FL ON MFL.id_IMDB_Filming_Locations = FL.id_IMDB_Filming_Locations
        WHERE MFL.id_Movies = $id_Movies`,
      { $id_Movies: actualDuplicate.id_Movies }
    );

    return filmingLocations;
  }
  //#endregion Copy from duplicate

  try {
    const gqlLocationsEdges = await scrapeGraphQLPaginated(
      graphQLqueries.filmingLocations(movie.IMDB_tconst),
      "data.title.filmingLocations"
    );

    gqlLocationsEdges.forEach((edge) => {
      filmingLocations.push({
        Location: edge.node.text,
        Details: _.get(edge, "node.displayableProperty.qualifiersInMarkdownList[0].markdown", null),
        NumInteresting: edge.node.interestScore.usersInterested,
        NumVotes: edge.node.interestScore.usersVoted,
      });
    });

    logger.log("[scrapeIMDBFilmingLocationsV3] filmingLocations:", filmingLocations);

    return filmingLocations;
  } catch (error) {
    if (movie.scanErrors) {
      movie.scanErrors["IMDB Filming Locations"] = error.message;
    }

    throw error;
  }
}

async function scrapeIMDBFilmingLocations(movie) {
  if (movie.scanErrors) {
    delete movie.scanErrors["IMDB Filming Locations"];
  }

  try {
    let filmingLocations = [];

    const url = `https://www.imdb.com/title/${movie.IMDB_tconst}/locations`;
    logger.log("[scrapeIMDBFilmingLocations] url:", url);

    const response = await helpers.requestAsync(url);
    const html = response.body;

    `
  <a href="/search/title?locations=Atlanta,%20Georgia,%20USA&ref_=ttloc_loc_2"
  itemprop='url'>Atlanta, Georgia, USA
  </a>                        </dt>
                          <dd>
  (as Lagos)                        </dd>
                          <div class="did-you-know-actions">
  <a href="/title/tt3498820/locations?item=lc0924105"
  class="interesting-count-text" > 103 of 111 found this interesting</a>
  `;

    const rxFilmingLocations =
      /<a href="\/search\/title\?locations=[\s\S]*?>([\s\S]*?)<\/a>[\s\S]*?<dd>([\s\S]*?)<\/dd>[\s\S]*?class="interesting-count-text"\s*>(.*?)<\/a>/g;

    let match = null;

    while ((match = rxFilmingLocations.exec(html))) {
      const Location = match[1].trim();
      const Details = match[2].trim().replace("(", "").replace(")", "");

      const interestingString = match[3];

      let NumInteresting = null;
      let NumVotes = null;

      const rxInteresting = /(\d+) of (\d+)/;
      if (rxInteresting.test(interestingString)) {
        NumInteresting = parseInt(interestingString.match(rxInteresting)[1]);
        NumVotes = parseInt(interestingString.match(rxInteresting)[2]);
      }

      filmingLocations.push({
        Location,
        Details,
        NumInteresting,
        NumVotes,
      });
    }

    logger.log("[scrapeIMDBFilmingLocations] filmingLocations:", filmingLocations);

    return filmingLocations;
  } catch (error) {
    if (movie.scanErrors) {
      movie.scanErrors["IMDB Filming Locations"] = error.message;
    }

    throw error;
  }
}

async function scrapeIMDBRatingDemographics(movie) {
  if (movie.scanErrors) {
    delete movie.scanErrors["IMDB Rating Demographics"];
  }

  try {
    let ratingDemographics = {};

    const url = `https://www.imdb.com/title/${movie.IMDB_tconst}/ratings`;
    logger.log("[scrapeIMDBRatingDemographics] url:", url);

    const response = await helpers.requestAsync(url);
    const html = response.body;

    /*
      <td class="ratingTable" align="center">
              <div class="bigcell">7,8</div>
              <div class="smallcell">
                  <a href="/title/tt2207986/ratings?demo=females_aged_18_29">
                      22
                  </a>
              </div>
      </td>
    */
    const rxRatingDemographics = /<td class="ratingTable[\s\S]*?<\/td>/g;

    let match = null;

    while ((match = rxRatingDemographics.exec(html))) {
      const ratingDemographicString = match[0];

      const rxData =
        /<div class="bigcell">([\s\S]*?)<\/div>[\s\S]*?<div class="smallcell">[\s\S]*?\/ratings\?demo=(.*?)">([\s\S]*?)<\/a>/;

      if (rxData.test(ratingDemographicString)) {
        const ratingDemographicsMatch = ratingDemographicString.match(rxData);

        const strRating = ratingDemographicsMatch[1].trim().replace(",", ".");
        const demographic = ratingDemographicsMatch[2].trim().split("&")[0];
        const strNumVotes = ratingDemographicsMatch[3].trim().replace(/,/g, "");

        ratingDemographics[`$IMDB_rating_${demographic}`] = parseFloat(strRating);
        ratingDemographics[`$IMDB_numVotes_${demographic}`] = parseInt(strNumVotes);
      }
    }

    // we already have the following data as IMDB_rating and IMDB_numVotes from the main page and thus delete it here
    delete ratingDemographics[`$IMDB_rating_imdb_users`];
    delete ratingDemographics[`$IMDB_numVotes_imdb_users`];

    logger.log("[scrapeIMDBRatingDemographics] ratingDemographics:", ratingDemographics);

    return ratingDemographics;
  } catch (error) {
    if (movie.scanErrors) {
      movie.scanErrors["IMDB Rating Demographics"] = error.message;
    }

    throw error;
  }
}

/**
 * GraphQL based series episodes
 * @param {*} title
 * @param {*} titleTypes
 * @returns
 */
async function scrapeIMDBSeriesEpisodes(Series_IMDB_tconst, Series_Season) {
  logger.log("[scrapeIMDBSeriesEpisodes] START", { Series_IMDB_tconst, Series_Season });

  try {
    const uri = graphQLqueries.seriesEpisodes(Series_IMDB_tconst, Series_Season || "unknown");

    logger.log("[scrapeIMDBSeriesEpisodes] uri:", uri);

    const gqlEpisodesEdges = await scrapeGraphQLPaginated(uri, "data.title.episodes.episodes");

    const results = gqlEpisodesEdges.map((edge) => {
      return {
        tconst: _.get(edge, "node.id"),
        title: _.get(edge, "node.titleText.text"),
        releaseDateYear: _.get(edge, "node.releaseDate.year"),
        releaseDateMonth: _.get(edge, "node.releaseDate.month"),
        releaseDateDay: _.get(edge, "node.releaseDate.day"),
        rating: parseFloat(_.get(edge, "node.ratingsSummary.aggregateRating")) || null,
        numVotes: parseFloat(_.get(edge, "node.ratingsSummary.voteCount")) || null,
        episode:
          parseInt(
            _.get(edge, "node.series.displayableEpisodeNumber.episodeNumber.displayableProperty.value.plainText")
          ) || null,
        season:
          parseInt(
            _.get(edge, "node.series.displayableEpisodeNumber.displayableSeason.displayableProperty.value.plainText")
          ) || null,
        imageURL: _.get(edge, "node.primaryImage.url"),
      };
    });

    if (!results || results.length == 0) {
      logger.warn("[scrapeIMDBSeriesEpisodes] zero results");
    } else {
      logger.log("[scrapeIMDBSeriesEpisodes] results[0]:", results[0]);
    }

    return results;
  } catch (error) {
    logger.error("[scrapeIMDBSeriesEpisodes] ERROR:", error);
    return [];
  }
}

/**
 *
 * @param {String} Series_IMDB_tconst
 */
async function scrapeIMDBSeriesSeasons(Series_IMDB_tconst) {
  const options = {
    uri: `https://www.imdb.com/title/${Series_IMDB_tconst}/episodes/`,
    method: "GET",
  };

  logger.log("[scrapeIMDBSeriesSeasons] fetching", options.uri);
  const responseSeasons = await helpers.requestAsync(options);

  const $ = cheerio.load(responseSeasons.body);

  const seasons = [];

  $(`a[data-testid="tab-season-entry"]`).each((i, elSeason) => {
    const season = $(elSeason).text().trim().toLowerCase();

    let seasonDisplayText = "";

    if (!isNaN(season)) {
      seasonDisplayText = `Season ${season}`;
    }
    if (season === "unknown") {
      seasonDisplayText = "Extras / Specials / Unknown";
    }

    seasons.push({
      season,
      seasonDisplayText,
    });
  });

  return seasons;
}

/**
 * Paginated scraping of GraphQL data
 * IMPORTANT: directly returns the array of edges (not the whole construct)
 * @param {*} uri
 * @param {*} innerPath the inner path leading to the edges array as well as pageInfo
 * @param {*} resultArray
 * @param {*} endCursor
 */
async function scrapeGraphQLPaginated(uri, innerPath, resultArray = null, endCursor = null, retry = 0) {
  const uriUsed = !endCursor ? uri : uri.replace(`"after":""`, `"after":"${endCursor}"`);

  logger.log("[scrapeGraphQLPaginated] uriUsed:", uriUsed);

  let res = null;

  try {
    res = await helpers.requestAsync({
      uri: uriUsed,
      headers: { "content-type": "application/json" },
    });

    if (res.statusCode >= 400) {
      const parsedBody = helpers.tryParseJSON(res.body);
      const cleanBody = res.body
        ? htmlToText
            .fromString(res.body, {
              wordwrap: null,
              ignoreImage: true,
              ignoreHref: true,
            })
            .trim()
        : null;

      throw new Error(
        `HTTP error ${res.statusCode}${
          parsedBody ? `: ${JSON.stringify(parsedBody)}` : cleanBody ? `: ${cleanBody}` : ""
        }`
      );
    }

    const newResult = JSON.parse(res.body);

    try {
      handleGraphQLErrors(newResult);
    } catch (error) {
      if (retry > 3) {
        throw error;
      }

      return scrapeGraphQLPaginated(uri, innerPath, resultArray, endCursor, retry + 1);
    }

    const newResult_pageInfo = _.get(newResult, `${innerPath}.pageInfo`, null);
    const newResult_Array = _.get(newResult, `${innerPath}.edges`, null);

    // logger.log("[scrapeGraphQLPaginated] newResult_Array.length:", newResult_Array.length);

    if (!newResult_pageInfo) {
      throw new Error("[scrapeGraphQLPaginated] pageInfo missing in result");
    }

    if (resultArray) {
      resultArray = resultArray.concat(newResult_Array);
    } else {
      resultArray = newResult_Array;
    }

    if (!newResult_pageInfo.hasNextPage) {
      return resultArray;
    }

    return scrapeGraphQLPaginated(uri, innerPath, resultArray, newResult_pageInfo.endCursor);
  } catch (error) {
    logger.error("[scrapeGraphQLPaginated] ERROR during request, res.statusCode:", res.statusCode);
    logger.error(error);
    throw error;
  }
}

const deprecated = {
  scrapeIMDBplotKeywords,
  scrapeIMDBFilmingLocations,
  scrapeIMDBRatingDemographics,
  scrapeIMDBFind,
  scrapeIMDBCompaniesDataV1,
};

export {
  deprecated,
  scrapeIMDBmainPageData,
  scrapeIMDBplotSummary,
  scrapeIMDBposterURLs,
  scrapeIMDBCompaniesDataV3,
  scrapeIMDBFullCreditsData,
  scrapeIMDBParentalGuideData,
  scrapeIMDBreleaseinfo,
  scrapeIMDBtechnicalData,
  scrapeIMDBPersonData,
  scrapeIMDBAdvancedTitleSearch,
  scrapeIMDBAdvancedTitleSearchV3,
  scrapeIMDBSuggestion,
  scrapeIMDBFindPageSearchV3,
  scrapeIMDBTrailerMediaURLs,
  scrapeIMDBplotKeywordsV3,
  scrapeIMDBFilmingLocationsV3,
  scrapeIMDBSeriesEpisodes,
  scrapeIMDBSeriesSeasons,
};
