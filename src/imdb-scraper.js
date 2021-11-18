const cheerio = require("cheerio");
const htmlToText = require("html-to-text");
const urlencode = require("urlencode");

const logger = require("./helpers/logger");
const helpers = require("./helpers/helpers");

function uppercaseEachWord(input) {
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

  return text;
}

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

    const html = response.body;

    // V2: we partially use the application/ld+json data, too
    const jsonData = JSON.parse(
      html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]
    );

    // V3?
    // const jsonDataNext = JSON.parse(
    //   html.match(
    //     /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
    //   )[1]
    // );

    // ## Release Type
    let $IMDB_releaseType = "movie";
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
    if (/>TV Movie/.test(html)) $IMDB_releaseType = "tvMovie";
    if (/>Episode/.test(html)) $IMDB_releaseType = "tvEpisode";
    if (/>TV Short/.test(html)) $IMDB_releaseType = "tvShort";
    if (/>TV Mini-Series/.test(html)) $IMDB_releaseType = "tvMiniSeries";
    if (/>TV Special/.test(html)) $IMDB_releaseType = "tvSpecial";
    if (/>Video\s/.test(html)) $IMDB_releaseType = "video";
    if (/>Video game/.test(html)) $IMDB_releaseType = "videoGame";

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

      const strVotes = html
        .match(/itemprop="ratingCount">(.*?)<\/span>/)[1]
        .replace(/,/g, "");
      logger.log("[scrapeIMDBmainPageData] strVotes:", strVotes);
      $IMDB_numVotes = parseInt(strVotes);
    }

    // V2
    if (
      jsonData.aggregateRating &&
      jsonData.aggregateRating.ratingValue &&
      jsonData.aggregateRating.ratingCount
    ) {
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

    const rxMetacriticScore =
      /<div class="metacriticScore .*? titleReviewBarSubItem">[\s\S]*?<span>(\d*)<\/span>/;
    if (rxMetacriticScore.test(html)) {
      $IMDB_metacriticScore = parseInt(html.match(rxMetacriticScore)[1]);
    }

    // V2
    // <span class="score-meta" style="background-color:#54A72A">78</span>
    const rxMetacriticScoreV2 = /<span class="score-meta[\s\S]*?>(\d+)<\/span>/;
    if (rxMetacriticScoreV2.test(html)) {
      $IMDB_metacriticScore = parseInt(html.match(rxMetacriticScoreV2)[1]);
    }

    // ## Poster
    let $IMDB_posterSmall_URL = null;
    let $IMDB_posterLarge_URL = null;
    let rxPosterMediaViewerURL = null;

    rxPosterMediaViewerURL =
      /<div class="poster">[\s\S]*?<a href="(.*?)"[\s\S]*?>/; // "/title/tt0130827/mediaviewer/rm215942400"

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
        const posterURLs = await scrapeIMDBposterURLs(
          html.match(rxPosterMediaViewerURL)[1]
        );

        const posterSmallPath = `extras/${movie.IMDB_tconst}_posterSmall.jpg`;
        const posterSmallSuccess = await downloadFileCallback(
          posterURLs.$IMDB_posterSmall_URL,
          posterSmallPath,
          false
        );
        if (posterSmallSuccess) {
          $IMDB_posterSmall_URL = posterSmallPath;
        }

        const posterLargePath = `extras/${movie.IMDB_tconst}_posterLarge.jpg`;
        const posterLargeSuccess = await downloadFileCallback(
          posterURLs.$IMDB_posterLarge_URL,
          posterLargePath,
          false
        );
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
      $IMDB_Trailer_URL = jsonData.trailer.embedUrl;
    } else {
      const rxTrailerUrl =
        /href="(\/video\/vi\d*)\?playlistId=tt\d*&amp;ref_=tt_ov_vi"[\s\S]*?aria-label="Watch {VideoTitle}"/;
      if (rxTrailerUrl.test(html)) {
        $IMDB_Trailer_URL = html.match(rxTrailerUrl)[1];
      }
    }

    logger.log(
      "[scrapeIMDBmainPageData] $IMDB_Trailer_URL:",
      $IMDB_Trailer_URL
    );

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
  let $IMDB_plotSummaryFull = null;

  if (!shortSummary) {
    return { $IMDB_plotSummaryFull };
  }

  if (movie.scanErrors) {
    delete movie.scanErrors["IMDB Plot Summary"];
  }

  try {
    const url = `https://www.imdb.com/title/${movie.IMDB_tconst}/plotsummary`;

    const response = await helpers.requestAsync(url);

    const html = response.body;

    const shortSummaryClean = shortSummary.split("...")[0].trim();

    const rxPlotSummary = new RegExp(
      `<li class="ipl-zebra-list__item"[\\s\\S]*?<p>([\\s\\S]*?)</p>`,
      "g"
    );

    const rxPlotSummary2 = new RegExp(
      `<li.*?id="summary[\\s\\S]*?<p>([\\s\\S]*?)</p>`,
      "g"
    );

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

async function scrapeIMDBposterURLs(posterMediaViewerURL) {
  logger.log(
    "[scrapeIMDBposterURLs] posterMediaViewerURL:",
    posterMediaViewerURL
  );

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
  logger.log(
    "[scrapeIMDBreleaseinfo] movie:",
    movie,
    "regions:",
    regions,
    "allowedTitleTypes:",
    allowedTitleTypes
  );

  if (movie.scanErrors) {
    delete movie.scanErrors["IMDB Release Info"];
  }

  try {
    const url = `https://www.imdb.com/title/${movie.IMDB_tconst}/releaseinfo`;
    logger.log(
      "[scrapeIMDBreleaseinfo] url:",
      url,
      "allowedTitleTypes:",
      allowedTitleTypes
    );
    const response = await helpers.requestAsync(url);
    const html = response.body;
    // logger.log('[scrapeIMDBreleaseinfo] imdbReleaseinfoHTML', imdbReleaseinfoHTML);

    let $IMDB_originalTitle = null;
    const rxOriginalTitle =
      /td class="aka-item__name"> \(original title\)<\/td>[\s\S]*?<td class="aka-item__title">(.*?)<\/td>/;
    if (rxOriginalTitle.test(html))
      $IMDB_originalTitle = html.match(rxOriginalTitle)[1];

    logger.log("[scrapeIMDBreleaseinfo] regions used:", regions);

    let $IMDB_localTitle = null;
    if (regions) {
      for (let i = 0; i < regions.length; i++) {
        const region = regions[i].name;

        logger.log("[scrapeIMDBreleaseinfo] regions trying:", `"${region}"`);

        if (!$IMDB_localTitle) {
          const rxLocalTitleFuzzy = new RegExp(
            `td class="aka-item__name">${region}(.*?)</td>[\\s\\S]*?<td class="aka-item__title">(.*?)</td>`,
            "g"
          );

          let match = null;

          while ((match = rxLocalTitleFuzzy.exec(html))) {
            logger.log(
              "[scrapeIMDBreleaseinfo] regions: fuzzy match found for",
              region
            );

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

              logger.log(
                "[scrapeIMDBreleaseinfo] regions: local title match:",
                {
                  title,
                  arrTitleTypes,
                }
              );

              let allowed = 0;
              for (let i = 0; i < arrTitleTypes.length; i++) {
                const titleType = arrTitleTypes[i];

                if (
                  allowedTitleTypes.find((allowed) => allowed === titleType)
                ) {
                  allowed++;
                }
              }

              if (allowed !== arrTitleTypes.length) {
                logger.log(
                  "[scrapeIMDBreleaseinfo] regions: skipped local title, some title types are not allowed"
                );
                continue;
              }
            }

            logger.log(
              "[scrapeIMDBreleaseinfo] regions: using local title:",
              title
            );
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

      logger.log("[scrapeIMDBreleaseinfo] yearRange:", yearRange);
      $IMDB_startYear = yearRange.match(/(\d\d\d\d)/)[1];
      if (/\d\d\d\d–\d\d\d\d/.test(yearRange)) {
        $IMDB_endYear = yearRange.match(/\d\d\d\d–(\d\d\d\d)/)[1];
      }
    }

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
      $IMDB_startYear,
      $IMDB_endYear,
    };

    logger.log("[scrapeIMDBreleaseinfo] scrapeIMDBreleaseinfo result:", result);

    return result;
  } catch (error) {
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
    logger.log("[scrapeIMDBreleaseinfo] scrapeIMDBtechnicalData url:", url);
    const response = await helpers.requestAsync(url);
    const html = response.body;

    let $IMDB_runtimeMinutes = null;
    const rxRuntimeValue =
      /<td class="label"> Runtime <\/td>[\s\S]*?<td>([\s\S]*?)<\/td>/;

    if (rxRuntimeValue.test(html)) {
      const rxRuntimeMinutesTotal = /\((\d*?) min\)/;
      const rxRuntimeMinutes = /\s(\d*?) min/;

      if (rxRuntimeMinutesTotal.test(html)) {
        $IMDB_runtimeMinutes = html.match(rxRuntimeMinutesTotal)[1];
      } else if (rxRuntimeMinutes.test(html)) {
        $IMDB_runtimeMinutes = html.match(rxRuntimeMinutes)[1];
      }
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
      logger.log(
        "[scrapeIMDBParentalGuideData] cacheAgeRatings:",
        cacheAgeRatings
      );
    }

    let regionCodes = [];

    try {
      if (regions) {
        regionCodes = regions.map((region) =>
          region.code ? region.code.toUpperCase() : ""
        );
      }
    } catch (e) {
      logger.error(e);
    }

    logger.log(
      "[scrapeIMDBParentalGuideData] AgeRating regionCodes:",
      regionCodes
    );

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

      const cachedRating = cacheAgeRatings.find(
        (cache) => cache.Country === Country && cache.Code === Code
      );

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
        (cache) =>
          cache.Country === rating.Country && cache.Code === rating.Code
      );

      if (!cachedRating) {
        await dbFireProcedureCallback(
          `INSERT INTO tbl_AgeRating (Country, Code, Age) VALUES ($Country, $Code, $Age)`,
          { $Country: rating.Country, $Code: rating.Code, $Age: rating.Age }
        );
        rating.id_AgeRating = await dbFireProcedureReturnScalarCallback(
          `SELECT id_AgeRating FROM tbl_AgeRating WHERE Country = $Country AND Code = $Code`,
          { $Country: rating.Country, $Code: rating.Code }
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
        logger.log(
          "[scrapeIMDBParentalGuideData] AgeRating regions FOUND:",
          rating
        );
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
      const severity = html
        .match(rx_Parental_Advisory_Nudity)[1]
        .trim()
        .toLowerCase();

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
      const severity = html
        .match(rx_Parental_Advisory_Violence)[1]
        .trim()
        .toLowerCase();

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
      const severity = html
        .match(rx_Parental_Advisory_Profanity)[1]
        .trim()
        .toLowerCase();

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
      const severity = html
        .match(rx_Parental_Advisory_Alcohol)[1]
        .trim()
        .toLowerCase();

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
      const severity = html
        .match(rx_Parental_Advisory_Frightening)[1]
        .trim()
        .toLowerCase();

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

      const rx_castEntry =
        /<tr class.*?>[\s\S]*?<a href="\/name\/(nm\d*)\/[\s\S]*?>\s([\s\S]*?)<\/a>[\s\S]*?<\/tr>/g;

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
        if (topCast.length < topMax) {
          topCast.push(entry);
        }
      }
    }

    const rx_creditsCategories =
      /class="dataHeaderWithBorder">([\s\S]*?)&nbsp/g;

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
      logger.log(
        "[scrapeIMDBFullCreditsData] creditsCategory found:",
        creditsCategory
      );

      const result = parseCreditsCategory(html, creditsCategory, credits);

      if (creditsCategory === "Directed by") {
        result.forEach((entry) => {
          if (topDirector.length < topMax) {
            topDirector.push(entry);
          }
        });
      }
      if (creditsCategory === "Produced by") {
        result.forEach((entry) => {
          if (topProducer.length < topMax) {
            topProducer.push(entry);
          }
        });
      }
      if (creditsCategory === "Writing Credits") {
        result.forEach((entry) => {
          if (topWriter.length < topMax) {
            topWriter.push(entry);
          }
        });
      }
    }

    logger.log("[scrapeIMDBFullCreditsData] credits:", credits);

    let $IMDB_Top_Cast = topCast.length > 0 ? JSON.stringify(topCast) : null;
    let $IMDB_Top_Writers =
      topWriter.length > 0 ? JSON.stringify(topWriter) : null;
    let $IMDB_Top_Directors =
      topDirector.length > 0 ? JSON.stringify(topDirector) : null;
    let $IMDB_Top_Producers =
      topProducer.length > 0 ? JSON.stringify(topProducer) : null;

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

async function scrapeIMDBCompaniesData(movie) {
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

      const result = parseCompaniesCategory(
        companiesCategoryName,
        ccMatch[0],
        companies
      );

      if (companiesCategoryName === "Production") {
        result.forEach((entry) => {
          if (topProductionCompanies.length < topMax) {
            topProductionCompanies.push(entry);
          }
        });
      }
    }

    logger.log("[scrapeIMDBCompaniesData] companies:", companies);
    logger.log(
      "[scrapeIMDBCompaniesData] topProductionCompanies:",
      topProductionCompanies
    );

    return {
      topProductionCompanies: {
        $IMDB_Top_Production_Companies:
          topProductionCompanies.length > 0
            ? JSON.stringify(topProductionCompanies)
            : null,
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
  const rx_entry =
    /<li>[\s\S]*?<a href="\/company\/(co\d*)[\s\S]*?>([\s\S]*?)<\/a>([\s\S]*?)<\/li>/g;

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
  const rx_table = new RegExp(
    `"dataHeaderWithBorder">${tableHeader}[\\s\\S]*?<\\/table>`
  );

  const result = [];

  if (rx_table.test(html)) {
    const table = html.match(rx_table)[0];

    const rx_entry =
      /<tr>[\s\S]*?<a href="\/name\/(nm\d*)\/[\s\S]*?>([\s\S]*?)<\/a>[\s\S]*?<\/tr>/g;

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

  const rxLongBio =
    /<h4 class="li_group">Mini Bio[\s\S]*?(<div[\s\S]*?)<\/div>/;

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

async function scrapeIMDBAdvancedTitleSearch(title, titleTypes) {
  // only supports latin characters!
  // https://www.imdb.com/search/title/?title=Gnothi Seauton&view=advanced
  // optional: &title_type=feature,tv_movie,tv_series,tv_episode,tv_special,tv_miniseries,documentary,short,video,tv_short
  //
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
    const imageURL = $($(item).find(".lister-item-image > a > img")).attr(
      "loadlate"
    );

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
 * IMPORTANT: this only supports latin characters!
 * @param {string} searchTerm
 */
async function scrapeIMDBSuggestion(searchTerm) {
  // only supports latin characters!
  // https://v2.sg.media-imdb.com/suggestion/d/Das%20Phantom%20Kommando%20(1985).json
  const url = `https://v2.sg.media-imdb.com/suggestion/${searchTerm[0].toLowerCase()}/${urlencode(
    searchTerm
  )}.json`;

  logger.log("[scrapeIMDBSuggestion] url:", url);

  const response = await helpers.requestAsync(url);

  let objResponse = null;

  try {
    objResponse = JSON.parse(response.body);
  } catch (err) {
    logger.error(
      "[scrapeIMDBSuggestion] failed parsing response body:",
      response.body
    );
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

/** "Find" search, also support Unicode
 * @param  {string} searchTerm
 * @param  {string} [type]
 */
async function scrapeIMDBFind(searchTerm, type) {
  // ALL:      https://www.imdb.com/find?q=天気の子
  // Titles:   https://www.imdb.com/find?s=tt&q=天気の子
  // Episodes: https://www.imdb.com/find?s=ep&q=start%26over
  // People:   https://www.imdb.com/find?s=nm&q=laurence+fishburn
  // Company:  https://www.imdb.com/find?s=co&q=universal
  // Keyword:  https://www.imdb.com/find?s=kw&q=christmas
  const url = `https://www.imdb.com/find?q=${urlencode(searchTerm)}${
    type ? "&s=" + type : ""
  }`;

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

async function scrapeIMDBTrailerMediaURLs(trailerURL) {
  try {
    const result = [];

    trailerURL = trailerURL.replace("/video/imdb/", "/videoplayer/");

    logger.log("[scrapeIMDBTrailerMediaURLs] trailerURL:", trailerURL);

    const response = await helpers.requestAsync({
      uri: trailerURL,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36",
      },
    });

    const html = response.body;

    // logger.log('[scrapeIMDBTrailerMediaURLs] trailerURLs html:', html);

    // "definition":"auto","mimeType":"application\u002Fx-mpegURL","videoUrl":"https:\u002F\u002Fimdb-video.media-imdb.com\u002Fvi1499136537\u002Fhls-1563882933870-master.m3u8?Expires=1575383713&Signature=PXs6zzGNbbxUR5SKWcNIWg~iA2TYAgfao8VNfaelya7rlNgxYz9yeh3kLJdUYqHQOK57Tbk5abPzx2lMLZea3lLRmR9T17~MN4M4RAaYUZR5w69wnQKu2wzGv5n7qgm3IaXyVdO61L37fuecTvzz-tigaVaWDnViTr5tkpf7Pu4isE-qF9hd1xX~oXDk5A~z2TdGzII16faXnxIY~xs~7rbKMgKfTJUxGtUmjSGTKXqEIh-VqPG0p4gYaXOCB-HCu42hqxeb8ll2XFPiBTCogyoBj-r0CRYZhx9GQ7FbfCkE0t9bgJ16dhy8eb9tVwsaZ6wjMjoQxu-CiaLDelciqg__&Key-Pair-Id=APKAIFLZBVQZ24NQH3KA"
    const rxMediaURL =
      /"definition":"(.*?)","mimeType":"(.*?)","videoUrl":"(.*?)"/g;

    let match = null;

    // eslint-disable-next-line no-cond-assign
    while ((match = rxMediaURL.exec(html))) {
      const definition = match[1];
      const mimeType = match[2].replace(/\\u002F/g, "/");
      const mediaURL = match[3].replace(/\\u002F/g, "/");

      result.push({
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

    return {
      mediaURLs: result,
      slateURL,
    };
  } catch (err) {
    logger.error(err);
    throw err;
  }
}

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

    const rxPlotKeywords =
      /<a href="\/search\/keyword\?[\s\S]*?>(.*?)<\/a>[\s\S]*?>(.*?relevant)/g;

    let match = null;

    while ((match = rxPlotKeywords.exec(html))) {
      const Keyword = uppercaseEachWord(match[1].trim());
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

    logger.log(
      "[scrapeIMDBFilmingLocations] filmingLocations:",
      filmingLocations
    );

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
        const demographic = ratingDemographicsMatch[2].trim();
        const strNumVotes = ratingDemographicsMatch[3].trim().replace(/,/g, "");

        ratingDemographics[`$IMDB_rating_${demographic}`] =
          parseFloat(strRating);
        ratingDemographics[`$IMDB_numVotes_${demographic}`] =
          parseInt(strNumVotes);
      }
    }

    // we already have the following data as IMDB_rating and IMDB_numVotes from the main page and thus delete it here
    delete ratingDemographics[`$IMDB_rating_imdb_users`];
    delete ratingDemographics[`$IMDB_numVotes_imdb_users`];

    logger.log(
      "[scrapeIMDBRatingDemographics] ratingDemographics:",
      ratingDemographics
    );

    return ratingDemographics;
  } catch (error) {
    if (movie.scanErrors) {
      movie.scanErrors["IMDB Rating Demographics"] = error.message;
    }

    throw error;
  }
}

export {
  scrapeIMDBmainPageData,
  scrapeIMDBplotSummary,
  scrapeIMDBposterURLs,
  scrapeIMDBCompaniesData,
  scrapeIMDBFullCreditsData,
  scrapeIMDBParentalGuideData,
  scrapeIMDBreleaseinfo,
  scrapeIMDBtechnicalData,
  scrapeIMDBPersonData,
  scrapeIMDBAdvancedTitleSearch,
  scrapeIMDBSuggestion,
  scrapeIMDBFind,
  scrapeIMDBTrailerMediaURLs,
  scrapeIMDBplotKeywords,
  scrapeIMDBFilmingLocations,
  scrapeIMDBRatingDemographics,
};
