const querystring = require("querystring");

const _ = require("lodash");
const cheerio = require("cheerio");
const htmlToText = require("html-to-text");

const logger = require("./helpers/logger");
const helpers = require("./helpers/helpers");

let graphqlURLs = require("./data/imdb-graphql-urls.json");

const graphQLqueries = {
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
};

/**
 * scrape IMDB Main Page Data (e.g. https://www.imdb.com/title/tt4154796)
 * @param {Object} movie
 * @param {Function} downloadFileCallback
 * @returns
 */
async function scrapeIMDBmainPageData(movie, downloadFileCallback) {
  if (movie.scanErrors) {
    delete movie.scanErrors["IMDB Main Page"];
  }

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
    let $IMDB_releaseType = _.get(jsonDataNext, "props.pageProps.aboveTheFoldData.titleType.id", null);

    if (!$IMDB_releaseType) {
      // V1
      $IMDB_releaseType = "movie";
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

      if (/\/search\/title\?genres=short/.test(html)) $IMDB_releaseType = "";
      if (/"presentation">TV Movie</.test(html)) $IMDB_releaseType = "tvMovie";
      if (/"presentation">TV Series</.test(html)) $IMDB_releaseType = "tvSeries";
      if (/"presentation">Episode/.test(html)) $IMDB_releaseType = "tvEpisode";
      if (/"presentation">TV Short/.test(html)) $IMDB_releaseType = "tvShort";
      if (/"presentation">TV Mini-Series/.test(html)) $IMDB_releaseType = "tvMiniSeries";
      if (/"presentation">TV Special/.test(html)) $IMDB_releaseType = "tvSpecial";
      if (/"presentation">Video\s/.test(html)) $IMDB_releaseType = "video";
      if (/"presentation">Video game/.test(html)) $IMDB_releaseType = "videoGame";
    }

    // ## Genres
    const $IMDB_genres = [];

    const rxGenres = /genres=(.*?)&/g;
    let match = null;

    // eslint-disable-next-line no-cond-assign
    while ((match = rxGenres.exec(html))) {
      const genre = match[1].toLowerCase();
      if (!$IMDB_genres.find((genreFind) => genreFind == genre)) {
        $IMDB_genres.push(genre);
      }
    }

    // ## IMDB Rating and Number of Votes
    let $IMDB_rating = null;
    let $IMDB_numVotes = null;

    const rxRating = /<span itemprop="ratingValue">(.*?)<\/span>/;
    if (rxRating.test(html)) {
      const strRating = html.match(rxRating)[1].replace(",", ".");
      $IMDB_rating = parseFloat(strRating);

      const matchVotes = html.match(/itemprop="ratingCount">(.*?)<\/span>/)[1];
      logger.log("[scrapeIMDBmainPageData] matchVotes:", matchVotes);

      const strVotes = html.match(/itemprop="ratingCount">(.*?)<\/span>/)[1].replace(/,/g, "");
      logger.log("[scrapeIMDBmainPageData] strVotes:", strVotes);
      $IMDB_numVotes = parseInt(strVotes);
    }

    // V2
    if (jsonData.aggregateRating && jsonData.aggregateRating.ratingValue && jsonData.aggregateRating.ratingCount) {
      logger.log("[scrapeIMDBmainPageData]", {
        ratingValue: jsonData.aggregateRating.ratingValue,
        ratingCount: jsonData.aggregateRating.ratingCount,
      });

      const strRating = jsonData.aggregateRating.ratingValue;
      $IMDB_rating = parseFloat(strRating);

      const strVotes = jsonData.aggregateRating.ratingCount;
      $IMDB_numVotes = parseInt(strVotes);
    }

    // ## Metacritic Score
    let $IMDB_metacriticScore = null;

    const rxMetacriticScore = /<div class="metacriticScore .*? titleReviewBarSubItem">[\s\S]*?<span>(\d*)<\/span>/;
    if (rxMetacriticScore.test(html)) {
      $IMDB_metacriticScore = parseInt(html.match(rxMetacriticScore)[1]);
    }

    // V2
    // <span class="score-meta" style="background-color:#54A72A">78</span>
    const rxMetacriticScoreV2 = /<span class="score-meta[\s\S]*?>(\d+)<\/span>/;
    if (rxMetacriticScoreV2.test(html)) {
      $IMDB_metacriticScore = parseInt(html.match(rxMetacriticScoreV2)[1]);
    }

    // V2.1
    // <span class="sc-b0901df4-0 gzyNKq metacritic-score-box" style="background-color:#54A72A">78</span>
    const rxMetacriticScoreV21 = /<span class=".*?metacritic-score-box[\s\S]*?>(\d+)<\/span>/;
    if (rxMetacriticScoreV21.test(html)) {
      $IMDB_metacriticScore = parseInt(html.match(rxMetacriticScoreV21)[1]);
    }

    // ## Poster
    let $IMDB_posterSmall_URL = null;
    let $IMDB_posterLarge_URL = null;
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
          $IMDB_posterSmall_URL = posterSmallPath;
        }

        const posterLargePath = `extras/${movie.IMDB_tconst}_posterLarge.jpg`;
        const posterLargeSuccess = await downloadFileCallback(posterURLs.$IMDB_posterLarge_URL, posterLargePath, false);
        if (posterLargeSuccess) {
          $IMDB_posterLarge_URL = posterLargePath;
        }
      } catch (error) {
        if (movie.scanErrors) {
          movie.scanErrors["IMDB Poster"] = error.message;
        }
      }
    }

    // ## Plot Summary
    let $IMDB_plotSummary = null;
    const rxPlotSummary = /<div class="summary_text">([\s\S]*?)<\/div>/;
    const rxPlotSummary2 = /data-testid="plot-l"[\s\S]*?>([\s\S]*?)<\//;

    let rxPlotSummaryChosen = null;

    if (rxPlotSummary.test(html)) rxPlotSummaryChosen = rxPlotSummary;
    if (rxPlotSummary2.test(html)) rxPlotSummaryChosen = rxPlotSummary2;

    if (rxPlotSummaryChosen) {
      $IMDB_plotSummary = unescape(
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
    let $IMDB_Trailer_URL = null;

    if (jsonData.trailer && jsonData.trailer.embedUrl) {
      // V2
      $IMDB_Trailer_URL = jsonData.trailer.embedUrl.replace("https://www.imdb.com", "");
    } else {
      const rxTrailerUrl =
        /href="(\/video\/vi\d*)\?playlistId=tt\d*&amp;ref_=tt_ov_vi"[\s\S]*?aria-label="Watch {VideoTitle}"/;
      if (rxTrailerUrl.test(html)) {
        $IMDB_Trailer_URL = html.match(rxTrailerUrl)[1];
      }
    }

    logger.log("[scrapeIMDBmainPageData] $IMDB_Trailer_URL:", $IMDB_Trailer_URL);

    // ## Year Range
    // V3
    let $IMDB_startYear = _.get(jsonDataNext, "props.pageProps.aboveTheFoldData.releaseYear.year", null);
    let $IMDB_endYear = _.get(jsonDataNext, "props.pageProps.aboveTheFoldData.releaseYear.endYear", null);

    if (!$IMDB_startYear) {
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
        $IMDB_startYear = +yearRangeSplit[0].match(/\d+/)[0];
        if (yearRange.includes("-")) {
          if (yearRangeSplit[1].match(/\d+/)) {
            $IMDB_endYear = +yearRangeSplit[1].match(/\d+/)[0];
          }
        } else {
          if (["tvSeries", "tvMiniSeries"].includes($IMDB_releaseType === "tvSeries")) {
            $IMDB_endYear = $IMDB_startYear;
          }
        }
      }
    }

    return {
      $IMDB_releaseType,
      $IMDB_genres,
      $IMDB_rating,
      $IMDB_numVotes,
      $IMDB_metacriticScore,
      $IMDB_posterSmall_URL,
      $IMDB_posterLarge_URL,
      $IMDB_plotSummary,
      $IMDB_Trailer_URL,
      $IMDB_startYear,
      $IMDB_endYear,
    };
  } catch (error) {
    logger.error(error);

    if (movie.scanErrors) {
      movie.scanErrors["IMDB Main Page"] = error.message;
    }

    throw error;
  }
}

async function scrapeIMDBplotSummary(movie, shortSummary) {
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

async function scrapeIMDBreleaseinfo(movie, regions, allowedTitleTypes) {
  logger.log("[scrapeIMDBreleaseinfo] movie:", movie, "regions:", regions, "allowedTitleTypes:", allowedTitleTypes);

  if (movie.scanErrors) {
    delete movie.scanErrors["IMDB Release Info"];
  }

  try {
    const url = `https://www.imdb.com/title/${movie.IMDB_tconst}/releaseinfo`;
    logger.log("[scrapeIMDBreleaseinfo] url:", url, "allowedTitleTypes:", allowedTitleTypes);
    const response = await helpers.requestAsync(url);
    const html = response.body;
    // logger.log('[scrapeIMDBreleaseinfo] imdbReleaseinfoHTML', imdbReleaseinfoHTML);

    const version = /aka-item__name/.test(html) ? 1 : 2;

    logger.log(`[scrapeIMDBreleaseinfo] using V${version} scraping method`);

    const result =
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

    const gqlAkaTitles = JSON.parse(
      (
        await helpers.requestAsync({
          uri: graphQLqueries.akaTitles(movie.IMDB_tconst),
          headers: { "content-type": "application/json" },
        })
      ).body
    );

    // logger.log("[scrapeIMDBreleaseinfoV2] gqlAkaTitles:", logger.inspectObject(gqlAkaTitles));

    const gqlAkaTitlesEdges = _.get(gqlAkaTitles, "data.title.akas.edges", []);

    // ### Local Title
    let $IMDB_localTitle = null;
    if (regions) {
      for (const region of regions) {
        logger.log("[scrapeIMDBreleaseinfoV2] regions trying:", `"${region.name}"`);

        if (!$IMDB_localTitle) {
          const regionAkaTitles = gqlAkaTitlesEdges.filter((node) => {
            return ((node.node || {}).country || {}).text === region.name;
          });

          for (const regionAkaTitle of regionAkaTitles) {
            const title = _.get(regionAkaTitle, "node.displayableProperty.value.plainText", null);
            logger.log(`[scrapeIMDBreleaseinfoV2] regions: found aka title candidate: "${title}"`);

            if (!title) {
              logger.log(
                "[scrapeIMDBreleaseinfoV2] skip; no title found in regionAkaTitle:",
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
              logger.log("[scrapeIMDBreleaseinfoV2] regions: skipped local title, some title types are not allowed", {
                numAllowed,
                titleTypes,
              });
              continue;
            }

            logger.log("[scrapeIMDBreleaseinfoV2] regions: using local title:", title);
            $IMDB_localTitle = regionAkaTitle.node.displayableProperty.value.plainText;
            break;
          }
        }
      }
    }

    // ### Local Title
    let $IMDB_primaryTitle = _.get(jsonDataNext, "props.pageProps.contentData.parentDisplayText", null);

    const result = {
      $IMDB_originalTitle,
      $IMDB_localTitle,
      $IMDB_primaryTitle,
    };

    logger.log("[scrapeIMDBreleaseinfoV2] result:", result);

    return result;
  } catch (error) {
    logger.error(error);

    if (movie.scanErrors) {
      movie.scanErrors["IMDB Release Info"] = error.message;
    }

    throw error;
  }
}

async function scrapeIMDBtechnicalData(movie) {
  if (movie.scanErrors) {
    delete movie.scanErrors["IMDB Technical Data"];
  }

  try {
    const url = `https://www.imdb.com/title/${movie.IMDB_tconst}/technical`;
    logger.log("[scrapeIMDBtechnicalData] scrapeIMDBtechnicalData url:", url);
    const response = await helpers.requestAsync(url);
    const html = response.body;

    let $IMDB_runtimeMinutes = null;
    const rxRuntimeValue = /<td class="label"> Runtime <\/td>[\s\S]*?<td>([\s\S]*?)<\/td>/;

    const rxRuntimeValueV2 = /<script.*?type="application\/json">([\s\S]*?)<\/script>/;

    if (rxRuntimeValueV2.test(html)) {
      // v2 (2023-01-28) - utilize JSON
      logger.log("[scrapeIMDBtechnicalData] going for V2");
      const jsonData = JSON.parse(html.match(rxRuntimeValueV2)[1]);

      const runtimeData = jsonData.props.pageProps.contentData.section.items.find((item) => item.id === "runtime");

      if (runtimeData && runtimeData.listContent && runtimeData.listContent[0]) {
        // we expect .text = "3h 1m" and .subText = "(181 min)" (e.g. https://www.imdb.com/title/tt4154796/technical/)
        // sometimes this is not the case: .text = "48m" and .subtext ="(DVD) (United States)" (see: https://www.imdb.com/title/tt0888817/technical/, https://www.imdb.com/title/tt1329665/technical/)
        // -> we should go with .text and interpret "2h 1m" as 121 minutes, while the hour-part is optional and not rely on .subtext being "(xy min)"
        const runtime = runtimeData.listContent[0].text;

        const hours = /(\d+)h/.test(runtime) ? +runtime.match(/(\d+)h/)[1] : 0;
        const minutes = /(\d+)m/.test(runtime) ? +runtime.match(/(\d+)m/)[1] : 0;

        $IMDB_runtimeMinutes = (hours * 60 + minutes).toString() || null;
      }
    } else if (rxRuntimeValue.test(html)) {
      // v1
      logger.log("[scrapeIMDBtechnicalData] going for V1");
      const rxRuntimeMinutesTotal = /\((\d*?) min\)/;
      const rxRuntimeMinutes = /\s(\d*?) min/;

      if (rxRuntimeMinutesTotal.test(html)) {
        $IMDB_runtimeMinutes = html.match(rxRuntimeMinutesTotal)[1];
      } else if (rxRuntimeMinutes.test(html)) {
        $IMDB_runtimeMinutes = html.match(rxRuntimeMinutes)[1];
      }
    } else {
      logger.warn("[scrapeIMDBtechnicalData] WARNING: runtime values not found!");
    }

    return {
      $IMDB_runtimeMinutes,
    };
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
  dbFireProcedureReturnAllCallback,
  dbFireProcedureCallback,
  dbFireProcedureReturnScalarCallback
) {
  if (movie.scanErrors) {
    delete movie.scanErrors["IMDB Parental Guide"];
  }

  try {
    if (!cacheAgeRatings) {
      cacheAgeRatings = await dbFireProcedureReturnAllCallback(
        `SELECT id_AgeRating, Country, Code, Age FROM tbl_AgeRating`
      );
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

    const rxAgeRating = /a href="\/search\/title\?certificates=(.*?):(.*?)"/g;

    let matchAgeRating = null;

    const ageRatings = [];

    // eslint-disable-next-line no-cond-assign
    while ((matchAgeRating = rxAgeRating.exec(html))) {
      const Country = matchAgeRating[1];
      const Code = unescape(matchAgeRating[2]);

      logger.log("[scrapeIMDBParentalGuideData] rating found:", Country, Code);

      const cachedRating = cacheAgeRatings.find((cache) => cache.Country === Country && cache.Code === Code);

      let Age = null;
      if (cachedRating) {
        Age = cachedRating.Age;
        logger.log("[scrapeIMDBParentalGuideData] Age (cached):", Age);
      } else {
        if (/\d+/.test(Code)) {
          Age = parseInt(Code.match(/\d+/)[0]);
          logger.log("[scrapeIMDBParentalGuideData] Age (parsed):", Age);
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
          logger.log("[scrapeIMDBParentalGuideData] Age (found):", Age);
        }
      }

      ageRatings.push({ Country, Code, Age });
      logger.log("[scrapeIMDBParentalGuideData] ageRatings:", ageRatings);
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
        await dbFireProcedureCallback(`INSERT INTO tbl_AgeRating (Country, Code, Age) VALUES ($Country, $Code, $Age)`, {
          $Country: rating.Country,
          $Code: rating.Code,
          $Age: rating.Age,
        });
        rating.id_AgeRating = await dbFireProcedureReturnScalarCallback(
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
        logger.log("[scrapeIMDBParentalGuideData] AgeRating regions FOUND:", rating);
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

    logger.log("[scrapeIMDBParentalGuideData] found age ratings:", ageRatings);

    const rx_Parental_Advisory_Nudity =
      /<section id="advisory-nudity">[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>(.*?)<\/span>/;
    let $IMDB_Parental_Advisory_Nudity = null;

    if (rx_Parental_Advisory_Nudity.test(html)) {
      const severity = html.match(rx_Parental_Advisory_Nudity)[1].trim().toLowerCase();

      if (severity == "none") {
        $IMDB_Parental_Advisory_Nudity = 0;
      } else if (severity == "mild") {
        $IMDB_Parental_Advisory_Nudity = 1;
      } else if (severity == "moderate") {
        $IMDB_Parental_Advisory_Nudity = 2;
      } else if (severity == "severe") {
        $IMDB_Parental_Advisory_Nudity = 3;
      }
    }

    const rx_Parental_Advisory_Violence =
      /<section id="advisory-violence">[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>(.*?)<\/span>/;
    let $IMDB_Parental_Advisory_Violence = null;

    if (rx_Parental_Advisory_Violence.test(html)) {
      const severity = html.match(rx_Parental_Advisory_Violence)[1].trim().toLowerCase();

      if (severity == "none") {
        $IMDB_Parental_Advisory_Violence = 0;
      } else if (severity == "mild") {
        $IMDB_Parental_Advisory_Violence = 1;
      } else if (severity == "moderate") {
        $IMDB_Parental_Advisory_Violence = 2;
      } else if (severity == "severe") {
        $IMDB_Parental_Advisory_Violence = 3;
      }
    }

    const rx_Parental_Advisory_Profanity =
      /<section id="advisory-profanity">[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>(.*?)<\/span>/;
    let $IMDB_Parental_Advisory_Profanity = null;

    if (rx_Parental_Advisory_Profanity.test(html)) {
      const severity = html.match(rx_Parental_Advisory_Profanity)[1].trim().toLowerCase();

      if (severity == "none") {
        $IMDB_Parental_Advisory_Profanity = 0;
      } else if (severity == "mild") {
        $IMDB_Parental_Advisory_Profanity = 1;
      } else if (severity == "moderate") {
        $IMDB_Parental_Advisory_Profanity = 2;
      } else if (severity == "severe") {
        $IMDB_Parental_Advisory_Profanity = 3;
      }
    }

    const rx_Parental_Advisory_Alcohol =
      /<section id="advisory-alcohol">[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>(.*?)<\/span>/;
    let $IMDB_Parental_Advisory_Alcohol = null;

    if (rx_Parental_Advisory_Alcohol.test(html)) {
      const severity = html.match(rx_Parental_Advisory_Alcohol)[1].trim().toLowerCase();

      if (severity == "none") {
        $IMDB_Parental_Advisory_Alcohol = 0;
      } else if (severity == "mild") {
        $IMDB_Parental_Advisory_Alcohol = 1;
      } else if (severity == "moderate") {
        $IMDB_Parental_Advisory_Alcohol = 2;
      } else if (severity == "severe") {
        $IMDB_Parental_Advisory_Alcohol = 3;
      }
    }

    const rx_Parental_Advisory_Frightening =
      /<section id="advisory-frightening">[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>(.*?)<\/span>/;
    let $IMDB_Parental_Advisory_Frightening = null;

    if (rx_Parental_Advisory_Frightening.test(html)) {
      const severity = html.match(rx_Parental_Advisory_Frightening)[1].trim().toLowerCase();

      if (severity == "none") {
        $IMDB_Parental_Advisory_Frightening = 0;
      } else if (severity == "mild") {
        $IMDB_Parental_Advisory_Frightening = 1;
      } else if (severity == "moderate") {
        $IMDB_Parental_Advisory_Frightening = 2;
      } else if (severity == "severe") {
        $IMDB_Parental_Advisory_Frightening = 3;
      }
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

async function scrapeIMDBFullCreditsData(movie) {
  if (movie.scanErrors) {
    delete movie.scanErrors["IMDB Full Credits"];
  }

  try {
    const url = `https://www.imdb.com/title/${movie.IMDB_tconst}/fullcredits`;
    logger.log("[scrapeIMDBFullCreditsData] url:", url);
    const response = await helpers.requestAsync(url);
    const html = response.body;

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
      logger.log("[scrapeIMDBFullCreditsData] creditsCategory found:", creditsCategory);

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

    logger.log("[scrapeIMDBFullCreditsData] credits:", credits);

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
  } catch (error) {
    if (movie.scanErrors) {
      movie.scanErrors["IMDB Parental Guide"] = error.message;
    }

    throw error;
  }
}

function getGQLCompaniesData(gqlCompanies, category) {
  const topMax = 5;
  const companies = [];
  const topCompanies = [];

  if (gqlCompanies && gqlCompanies.data && gqlCompanies.data.title && gqlCompanies.data.title.companyCredits) {
    gqlCompanies.data.title.companyCredits.edges.forEach((edge) => {
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
  }

  return { companies, topCompanies };
}

/**
 * Scrape companies from JSON provided by GraphQL
 * @param {Object} movie
 */
async function scrapeIMDBCompaniesDataV3(movie) {
  if (movie.scanErrors) {
    delete movie.scanErrors["IMDB Companies"];
  }

  try {
    const gqlCompaniesProduction = JSON.parse(
      (
        await helpers.requestAsync({
          uri: graphQLqueries.companies(movie.IMDB_tconst, "production"),
          headers: { "content-type": "application/json" },
        })
      ).body
    );
    const { companies: companiesProduction, topCompanies: topCompaniesProduction } = getGQLCompaniesData(
      gqlCompaniesProduction,
      "Production"
    );

    const gqlCompaniesDistribution = JSON.parse(
      (
        await helpers.requestAsync({
          uri: graphQLqueries.companies(movie.IMDB_tconst, "distribution"),
          headers: { "content-type": "application/json" },
        })
      ).body
    );
    const { companies: companiesDistribution } = getGQLCompaniesData(gqlCompaniesDistribution, "Distribution");

    const gqlCompaniesSpecialEffects = JSON.parse(
      (
        await helpers.requestAsync({
          uri: graphQLqueries.companies(movie.IMDB_tconst, "specialEffects"),
          headers: { "content-type": "application/json" },
        })
      ).body
    );
    const { companies: companiesSpecialEffects } = getGQLCompaniesData(gqlCompaniesSpecialEffects, "Special Effects");

    const gqlCompaniesOther = JSON.parse(
      (
        await helpers.requestAsync({
          uri: graphQLqueries.companies(movie.IMDB_tconst, "miscellaneous"),
          headers: { "content-type": "application/json" },
        })
      ).body
    );
    const { companies: companiesOther } = getGQLCompaniesData(gqlCompaniesOther, "Other");

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
    return [];
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

    logger.log("[scrapeIMDBFindPageSearchV3] gqlTitles:", gqlTitles);

    const results =
      gqlTitles && gqlTitles.data && gqlTitles.data.results
        ? gqlTitles.data.results.edges.map((edge) => {
            return {
              type: _.get(edge.node, "entity.__typename", null),
              tconst: _.get(edge.node, "entity.id", null),
              title: `${_.get(edge.node, "entity.titleText.text", "")}${
                _.get(edge.node, "entity.titleType.displayableProperty.value.plainText")
                  ? ` (${_.get(edge.node, "entity.titleType.displayableProperty.value.plainText")})`
                  : ""
              }`,
              year: _.get(edge.node, "entity.releaseYear.year", null),
              imageURL: _.get(edge.node, "entity.primaryImage.url", null),
              ageRating: null,
              runtimeSeconds: null,
              genres: null,
              rating: null,
              numVotes: null,
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
    return [];
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
    trailerURL = trailerURL.replace("/video/imdb/", "/videoplayer/");

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

async function scrapeIMDBplotKeywordsV3(movie) {
  if (movie.scanErrors) {
    delete movie.scanErrors["IMDB Plot Keywords"];
  }

  try {
    const plotKeywords = [];

    const gqlPlotKeywords = JSON.parse(
      (
        await helpers.requestAsync({
          uri: graphQLqueries.plotKeywords(movie.IMDB_tconst),
          headers: { "content-type": "application/json" },
        })
      ).body
    );

    // logger.log("[scrapeIMDBreleaseinfoV2] gqlAkaTitles:", logger.inspectObject(gqlAkaTitles));

    const gqlPlotKeywordsEdges = _.get(gqlPlotKeywords, "data.title.keywords.edges", []);

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
      movie.scanErrors["IMDB Release Info"] = error.message;
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

async function scrapeIMDBFilmingLocationsV3(movie) {
  if (movie.scanErrors) {
    delete movie.scanErrors["IMDB Filming Locations"];
  }

  try {
    let filmingLocations = [];

    const gqlLocations = JSON.parse(
      (
        await helpers.requestAsync({
          uri: graphQLqueries.filmingLocations(movie.IMDB_tconst),
          headers: { "content-type": "application/json" },
        })
      ).body
    );

    const gqlLocationsEdges = _.get(gqlLocations, "data.title.filmingLocations.edges", []);

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

    const gqlEpisodes = JSON.parse(
      (await helpers.requestAsync({ uri, headers: { "content-type": "application/json" } })).body
    );

    // logger.log("[scrapeIMDBSeriesEpisodes] gqlEpisodes:", JSON.stringify(gqlEpisodes, null, 2));

    if (gqlEpisodes.errors) {
      logger.error("[scrapeIMDBSeriesEpisodes] gqlEpisodes.errors:", gqlEpisodes.errors);
      return [];
    }

    const results = _.get(gqlEpisodes, "data.title.episodes.episodes.edges", []).map((edge) => {
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
      logger.warn("[scrapeIMDBSeriesEpisodes] zero results, gqlEpisodes:", gqlEpisodes);
    }

    logger.log("[scrapeIMDBSeriesEpisodes] results[0]:", results[0]);

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
