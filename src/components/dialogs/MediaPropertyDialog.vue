<!-- This is a generalized dialog for properties like age rating, audio format, genre etc. -->
<template>
  <v-dialog
    v-model="show"
    persistent
    max-width="1000px"
    v-on:keydown.escape="onEscapePressed"
    scrollable
    style="z-index: 300 !important"
  >
    <v-card dark flat v-bind:ripple="false">
      <v-card-title v-on:mouseover="isTitleHovered = true" v-on:mouseleave="isTitleHovered = false">
        {{ propertyTypeKey !== "person" ? `${$t(propertyType.title)}:` : "" }}
        {{
          propertyTypeKey == "audio-language" || propertyTypeKey == "subtitle-language"
            ? Language
              ? `${$t(`LanguageNames.${Language}`)} (${propertyValueDisplayText})`
              : propertyValueDisplayText
            : propertyValueDisplayText
        }}
        <v-tooltip v-if="propertyTypeKey == 'person' && isTitleHovered" bottom>
          <template v-slot:activator="{ on }">
            <span v-on="on">
              <v-icon
                class="mk-clickable"
                v-on:click.stop="scrapeData()"
                style="margin-left: 8px; margin-bottom: 3px"
                v-bind:disabled="isScraping"
                >mdi-reload-alert</v-icon
              >
            </span>
          </template>
          <span>
            {{ $t("Rescan Meta Data") }}
            <span v-if="isScraping">
              <br />
              {{ $t("scan already in progress") }}
            </span>
          </span>
        </v-tooltip>
        <v-progress-linear
          v-if="isScraping || isLoadingMovies"
          color="red accent-0"
          indeterminate
          rounded
          height="3"
        ></v-progress-linear>
      </v-card-title>

      <v-card-text>
        <v-list-item three-line style="padding-left: 0px; align-items: flex-start">
          <div v-if="propertyTypeKey === 'person'">
            <v-list-item-avatar tile style="margin: 6px; height: 150px; width: 120px">
              <!-- v-if="!isScraping" -->
              <v-img
                v-if="detailData.Image_URL"
                contain
                v-bind:src="detailData.Image_URL"
                style="border-radius: 6px"
              ></v-img>
              <v-icon v-if="!detailData.Image_URL && !isScraping" disabled x-large loading>
                mdi-account-outline
              </v-icon>
              <v-progress-circular
                v-if="isScraping"
                indeterminate
                color="grey"
                size="32"
                width="5"
              ></v-progress-circular>
            </v-list-item-avatar>
          </div>
          <v-list-item-content class="align-self-start" style="padding-top: 6px; padding-bottom: 6px">
            <v-col style="padding: 0px 0px 0px 4px !important" sm="12">
              <v-row v-if="propertyTypeKey === 'person'" style="margin: 0px 6px 8px 0px">
                <div
                  v-if="!showDescriptionLong"
                  style="font-size: 0.875rem; font-weight: normal"
                  v-bind:class="{ 'mk-clickable': detailData.DescriptionShort !== detailData.DescriptionLong }"
                  v-on:click.stop="
                    showDescriptionLong = detailData.DescriptionShort !== detailData.DescriptionLong ? true : false
                  "
                >
                  {{ detailData.DescriptionShort ? detailData.DescriptionShort : detailData.DescriptionLong }}
                </div>
                <div v-if="showDescriptionLong" style="font-size: 0.875rem; font-weight: normal">
                  <p v-for="(line, index) in detailData.DescriptionLong.split('\n')" v-bind:key="index">
                    {{ line }}
                  </p>
                </div>
              </v-row>

              <div v-for="(mic, index) in Object.values(mediaItemsContainer)" v-bind:key="index">
                <div v-if="mic.type !== 'episodes' || Series_id_Movies_Owner">
                  <v-row
                    v-if="mic.numItems !== null"
                    class="mk-compact-movie-list-title"
                    v-bind:class="{ 'mk-clickable': !!mic.numItems }"
                    v-on:click.stop="toggleShowMovies(mic)"
                  >
                    {{
                      mic.numItems +
                      " " +
                      $t(mic.numItems === 1 ? mic.nameSingular : mic.namePlural) +
                      (mic.type === "episodes" && Series_Name
                        ? ` - ${Series_Name}${Series_Year_Display ? " " + Series_Year_Display : ""}`
                        : "") +
                      (!!mic.numItems && !mic.showMediaItems ? " »" : "")
                    }}
                  </v-row>
                  <div v-if="mic.showMediaItems">
                    <div v-for="(mediaItem, index) in mic.mediaItems" v-bind:key="index">
                      <!-- Series Item -->
                      <mk-compact-movie-list-row
                        v-if="mic.type == 'series'"
                        v-bind:movie="mediaItem"
                        v-bind:isClickable="mic.type == 'series'"
                        v-bind:isCollapsed="!mediaItem.showSeriesEpisodes"
                        v-bind:showExpandIndicator="true"
                        v-on:click="toggleSeriesEpisodes(mediaItem)"
                      />

                      <!-- Movies Item -->
                      <v-menu
                        v-if="mic.type == 'movies'"
                        v-model="mediaItem.showDetails"
                        v-bind:close-on-click="false"
                        v-bind:close-on-content-click="false"
                        bottom
                        right
                        transition="scale-transition"
                        origin="top left"
                      >
                        <template v-slot:activator="{ on }">
                          <mk-compact-movie-list-row
                            v-on="on"
                            v-on:click="onShowMediaItemDetails(mediaItem)"
                            v-bind:movie="mediaItem"
                            v-bind:isClickable="true"
                            v-bind:isCollapsed="!mediaItem.showSeriesEpisodes"
                          />
                        </template>
                        <v-card>
                          <v-list-item three-line style="padding-left: 0px; padding-right: 0px">
                            <mk-media-item-card
                              v-bind:mediaItem="mediaItem"
                              v-bind:isScanning="false"
                              v-bind:isInDialog="true"
                              v-bind:showCloseButton="true"
                              v-on:close="mediaItem.showDetails = false"
                              v-on:mediaItemEvent="onMICmediaItemEvent"
                            ></mk-media-item-card>
                          </v-list-item>
                        </v-card>
                      </v-menu>

                      <!-- Episodes (after clicking a series)-->
                      <div
                        v-if="mediaItem.showSeriesEpisodes"
                        style="margin-left: 32px; margin-top: 4px; margin-bottom: 4px"
                      >
                        <v-progress-linear
                          v-if="mediaItem.isLoadingSeriesEpisodes"
                          color="red accent-0"
                          indeterminate
                          rounded
                          height="3"
                        ></v-progress-linear>
                        <div v-if="!mediaItem.isLoadingSeriesEpisodes">
                          {{ mediaItem.seriesEpisodesCount }} / {{ mediaItem.seriesEpisodesTotal }} {{ $t("episodes") }}
                        </div>
                        <!-- <mk-compact-movie-list-row
                          v-for="(episode, index) in mediaItem.seriesEpisodesMediaItems"
                          v-bind:key="index"
                          v-bind:movie="episode"
                          v-bind:isClickable="false"
                        ></mk-compact-movie-list-row> -->
                        <div v-for="(episode, index) in mediaItem.seriesEpisodesMediaItems" v-bind:key="index">
                          <v-menu
                            v-model="episode.showDetails"
                            v-bind:close-on-click="false"
                            v-bind:close-on-content-click="false"
                            bottom
                            right
                            transition="scale-transition"
                            origin="top left"
                          >
                            <template v-slot:activator="{ on }">
                              <mk-compact-movie-list-row
                                v-on="on"
                                v-on:click="onShowMediaItemDetails(episode)"
                                v-bind:movie="episode"
                                v-bind:isClickable="true"
                              />
                            </template>
                            <v-card>
                              <v-list-item three-line style="padding-left: 0px; padding-right: 0px">
                                <mk-media-item-card
                                  v-bind:mediaItem="episode"
                                  v-bind:isScanning="false"
                                  v-bind:isInDialog="true"
                                  v-bind:showCloseButton="true"
                                  v-on:close="episode.showDetails = false"
                                  v-on:mediaItemEvent="onMICmediaItemEvent"
                                ></mk-media-item-card>
                              </v-list-item>
                            </v-card>
                          </v-menu>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </v-col>
          </v-list-item-content>
        </v-list-item>
      </v-card-text>

      <v-card-actions>
        <!-- Button: Close -->
        <v-btn class="xs-fullwidth" color="secondary" v-on:click.native="onCloseClick" style="margin-left: 8px">{{
          $t("Close")
        }}</v-btn>

        <!-- Button: IMDB -->
        <v-btn
          v-if="['company', 'person'].includes(propertyTypeKey)"
          class="xs-fullwidth"
          color="primary"
          v-on:click.stop="openIMDB()"
          style="margin-left: 8px"
        >
          <v-icon small>mdi-web</v-icon>&nbsp;IMDB
        </v-btn>
        <!-- Button: Filter by this... -->
        <v-btn
          v-if="
            !Series_id_Movies_Owner && // TODO!!! && numMovies !== null
            !isInDialog
          "
          class="xs-fullwidth"
          color="primary"
          v-on:click.native="onFilterClick"
          style="margin-left: 8px"
        >
          {{ $t(propertyType.filterButtonText) }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
const sqlString = require("sqlstring-sqlite");
const { shell } = require("@electron/remote");

import * as _ from "lodash";

import MediaItemCard from "@/components/shared/MediaItemCard.vue";

import * as store from "@/store";
import * as helpers from "@/helpers/helpers";
const logger = require("../../helpers/logger");

const { languageCodeNameMapping } = require("@/languages");

import { scrapeIMDBPersonData } from "@/imdb-scraper";

import { eventBus } from "@/main";

import CompactMovieListRow from "@/components/shared/CompactMovieListRow.vue";

export default {
  props: [
    "show",
    "isInDialog",
    "propertyTypeKey",
    "propertyValue",
    "propertyValueDisplayText",
    "imdbTconst",
    "mediaType",
    "Series_id_Movies_Owner",
    "Series_Name",
    "Series_Year_Display",
  ],

  components: {
    "mk-compact-movie-list-row": CompactMovieListRow,
    "mk-media-item-card": MediaItemCard,
  },

  computed: {
    propertyType() {
      return this.propertyTypes[this.propertyTypeKey];
    },

    // Language Dialog
    Language() {
      if (this.propertyTypeKey !== "audio-language" && this.propertyTypeKey !== "subtitle-language") {
        return null;
      }
      const codeTransformed = this.propertyValue ? helpers.uppercaseEachWord(this.propertyValue.toLowerCase()) : "";
      return languageCodeNameMapping[codeTransformed];
    },
  },

  watch: {
    propertyValue: function (newVal) {
      this.debouncedInit(newVal);
    },
    mediaType: function () {
      this.debouncedInit(this.propertyValue);
    },
    Series_id_Movies_Owner: function () {
      this.debouncedInit(this.propertyValue);
    },
  },

  data() {
    return {
      propertyTypes: {
        "age-rating": {
          title: "Age Rating",
          filterButtonText: "Filter by this age rating",
        },
        "audio-format": {
          title: "Audio Format",
          filterButtonText: "Filter by this audio format",
        },
        company: {
          title: "Company",
          filterButtonText: "Filter by this company",
        },
        "filming-location": {
          title: "Filming Location",
          filterButtonText: "Filter by this filming location",
        },
        genre: {
          title: "Genre",
          filterButtonText: "Filter by this genre",
        },
        "audio-language": {
          title: "Audio Language",
          filterButtonText: "Filter by this language",
          languageType: "audio",
        },
        "subtitle-language": {
          title: "Subtitle Language",
          filterButtonText: "Filter by this language",
          languageType: "subtitle",
        },
        "plot-keyword": {
          title: "Plot Keyword",
          filterButtonText: "Filter by this plot keyword",
        },
        "release-attribute": {
          title: "Release Attribute",
          filterButtonText: "Filter by this release attribute",
        },
        "video-encoder": {
          title: "Video Encoder",
          filterButtonText: "Filter by this video encoder",
        },
        "video-quality": {
          title: "Video Quality",
          filterButtonText: "Filter by this video quality",
        },
        person: {
          title: "Person",
          filterButtonText: "Filter by this person",
        },
      },

      isTitleHovered: false,

      isScraping: false,
      isLoadingMovies: false,

      mediaItemsContainer: {
        movies: {
          type: "movies",
          nameSingular: "movie",
          namePlural: "movies",
          numItems: null,
          mediaItems: [],
          showMediaItems: false,
        },
        series: {
          type: "series",
          nameSingular: "series_singular",
          namePlural: "series_plural",
          numItems: null,
          mediaItems: [],
          showMediaItems: false,
        },
      },

      detailData: {
        IMDB_ID: null,
        Image_URL: null,
        DescriptionShort: null,
        DescriptionLong: null,
      },
      showDescriptionLong: false,
    };
  },

  methods: {
    // age-rating
    getMinAge(Age_Rating) {
      if (!Age_Rating) return null;

      let ageRating = Age_Rating.replace(/\+/g, "");

      if (ageRating.includes("-")) {
        ageRating = ageRating.split("-")[0];
      }

      ageRating = +ageRating;

      return ageRating;
    },

    getMaxAge(Age_Rating) {
      if (!Age_Rating) return null;

      let ageRating = Age_Rating.replace(/\+/g, "");

      if (ageRating.includes("-")) {
        ageRating = ageRating.split("-")[1];
      }

      ageRating = +ageRating;

      return ageRating;
    },

    // person: scrape data
    async scrapeData() {
      if (this.propertyTypeKey === "person") {
        logger.log(
          `[MediaPropertyDialog ${this.propertyTypeKey} scrapeData] START, this.propertyValue:`,
          this.propertyValue
        );

        try {
          this.isScraping = true;

          const detailData = await scrapeIMDBPersonData(this.propertyValue, helpers.downloadFile);

          store.saveIMDBPersonData(detailData);

          logger.log(`[MediaPropertyDialog ${this.propertyTypeKey} scrapeData] detailData:`, detailData);

          this.detailData = {
            IMDB_ID: detailData.$IMDB_Person_ID,
            Image_URL: detailData.$Photo_URL
              ? "local-resource://" + helpers.getDataPath(detailData.$Photo_URL).replace(/\\/g, "\\\\")
              : detailData.$Photo_URL,
            DescriptionShort: detailData.$ShortBio,
            DescriptionLong: detailData.$LongBio,
          };

          logger.log(`[MediaPropertyDialog ${this.propertyTypeKey} scrapeData] this.detailData:`, this.detailData);
        } catch (err) {
          logger.log(err);
          eventBus.showSnackbar("error", err);
        } finally {
          this.isScraping = false;
        }
      }
    },

    async init() {
      logger.log(`[MediaPropertyDialog ${this.propertyTypeKey} init] START, this.propertyValue:`, this.propertyValue);

      this.isLoadingMovies = true;

      Object.values(this.mediaItemsContainer).forEach((mic) => {
        mic.numItems = null;
        mic.mediaItems = [];
        mic.showMediaItems = false;
      });

      this.detailData = {};
      this.showDescriptionLong = false;

      if (!this.propertyValue) {
        return;
      }

      const queryParams = {};

      // release-attribute needs a bit more preparation
      const releaseAttributesHierarchy =
        this.propertyTypeKey === "release-attribute" ? store.getReleaseAttributesHierarchy() : null;
      const ra =
        this.propertyTypeKey === "release-attribute"
          ? releaseAttributesHierarchy.find((rah) => rah.displayAs === this.propertyValue)
          : null;

      logger.log(`[MediaPropertyDialog ${this.propertyTypeKey} init] ra:`, ra);

      switch (this.propertyTypeKey) {
        case "age-rating":
          queryParams.$MinAge = this.getMinAge(this.propertyValue);
          queryParams.$MaxAge = this.getMaxAge(this.propertyValue);
          break;
        case "audio-format":
          queryParams.$Audio_Format = this.propertyValue;
          break;
        case "company":
          queryParams.$CompanyName = this.propertyValueDisplayText;
          break;
        case "filming-location":
          queryParams.$id_IMDB_Filming_Locations = this.propertyValue;
          break;
        case "genre":
          queryParams.$Genre = this.propertyValue;
          break;
        case "audio-language":
          queryParams.$Language = this.propertyValue;
          break;
        case "subtitle-language":
          queryParams.$Language = this.propertyValue;
          break;
        case "plot-keyword":
          queryParams.$id_IMDB_Plot_Keywords = this.propertyValue;
          break;
        case "video-encoder":
          queryParams.$Video_Encoder = this.propertyValue;
          break;
        case "video-quality":
          queryParams.$Video_Quality = this.propertyValue.MI_Quality;
          break;
        case "person":
          queryParams.$IMDB_Person_ID = this.propertyValue;
          break;
      }

      const query = `
          SELECT COUNT(1) FROM
          (
            SELECT DISTINCT
              MOV.Name || ' ' || IFNULL(MOV.startYear, 'xxx')
            FROM tbl_Movies MOV
            INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths
            ${
              this.propertyTypeKey === "age-rating"
                ? `LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating`
                : this.propertyTypeKey === "audio-format"
                ? `INNER JOIN tbl_Movies_MI_Tracks MITAUDIO ON MITAUDIO.type = "audio" AND MITAUDIO.id_Movies = MOV.id_Movies AND MITAUDIO.Format = $Audio_Format`
                : this.propertyTypeKey === "company"
                ? `INNER JOIN tbl_Movies_IMDB_Companies MC ON MC.id_Movies = MOV.id_Movies`
                : this.propertyTypeKey === "filming-location"
                ? `INNER JOIN tbl_Movies_IMDB_Filming_Locations MFL ON MFL.id_Movies = MOV.id_Movies`
                : this.propertyTypeKey === "plot-keyword"
                ? `INNER JOIN tbl_Movies_IMDB_Plot_Keywords MPK ON MPK.id_Movies = MOV.id_Movies`
                : this.propertyTypeKey === "release-attribute"
                ? `INNER JOIN tbl_Movies_Release_Attributes MRA ON MRA.id_Movies = MOV.id_Movies`
                : this.propertyTypeKey === "video-encoder"
                ? `INNER JOIN tbl_Movies_MI_Tracks MITVIDEO ON MITVIDEO.type = "video" AND MITVIDEO.id_Movies = MOV.id_Movies AND MITVIDEO.Encoded_Library_Name_Trimmed = $Video_Encoder`
                : this.propertyTypeKey === "person"
                ? `INNER JOIN tbl_Movies_IMDB_Credits MC ON MC.id_Movies = MOV.id_Movies`
                : ``
            }

            WHERE SP.MediaType = $MediaType
                  AND (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
                  AND CASE WHEN $Series_id_Movies_Owner IS NOT NULL THEN MOV.Series_id_Movies_Owner = $Series_id_Movies_Owner ELSE MOV.Series_id_Movies_Owner IS NULL END
                  ${
                    this.propertyTypeKey === "age-rating"
                      ? `AND (
                              AR.Age BETWEEN $MinAge AND $MaxAge
                              OR (
                                    MOV.IMDB_id_AgeRating_Chosen_Country IS NULL AND MOV.IMDB_MinAge >= $MinAge AND MOV.IMDB_MaxAge <= $MaxAge
                              )
                        )`
                      : ""
                  }
                  ${this.propertyTypeKey === "company" ? `AND MC.Company_Name = $CompanyName` : ""}
                  ${
                    this.propertyTypeKey === "filming-location"
                      ? `AND MFL.id_IMDB_Filming_Locations = $id_IMDB_Filming_Locations`
                      : ""
                  }
                  ${
                    this.propertyTypeKey === "genre"
                      ? `AND MOV.id_Movies IN (SELECT MG.id_Movies FROM tbl_Movies_Genres MG INNER JOIN tbl_Genres G WHERE MG.id_Genres = G.id_Genres AND G.Name = $Genre)`
                      : ""
                  }
                  ${
                    this.propertyTypeKey === "audio-language"
                      ? `AND MOV.id_Movies IN (SELECT ML.id_Movies FROM tbl_Movies_Languages ML WHERE ML.Type = "audio" AND UPPER(ML.Language) = $Language)`
                      : ""
                  }
                  ${
                    this.propertyTypeKey === "subtitle-language"
                      ? `AND MOV.id_Movies IN (SELECT ML.id_Movies FROM tbl_Movies_Languages ML WHERE ML.Type = "subtitle" AND UPPER(ML.Language) = $Language)`
                      : ""
                  }
                  ${
                    this.propertyTypeKey === "plot-keyword"
                      ? `AND MPK.id_IMDB_Plot_Keywords = $id_IMDB_Plot_Keywords`
                      : ""
                  }
                  ${
                    this.propertyTypeKey === "release-attribute"
                      ? `AND MRA.deleted = 0
                         AND MRA.Release_Attributes_searchTerm IN (${ra.searchTerms.reduce((prev, current) => {
                           return prev + (prev ? ", " : "") + `${sqlString.escape(current)}`;
                         }, "")})`
                      : ""
                  }
                  ${
                    this.propertyTypeKey === "video-quality"
                      ? `AND (MOV.id_Movies IN (SELECT id_Movies FROM tbl_Movies_MI_Qualities MOVQ WHERE MOVQ.MI_Quality = $Video_Quality AND MOVQ.deleted = 0))`
                      : ""
                  }
                  ${this.propertyTypeKey === "person" ? `AND MC.IMDB_Person_ID = $IMDB_Person_ID` : ""}
          )
        `;

      logger.log(`[MediaPropertyDialog ${this.propertyTypeKey} init] queryParams:`, queryParams);

      try {
        if (this.propertyTypeKey === "person") {
          let detailData = await store.fetchIMDBPerson(this.propertyValue);

          logger.log(`[MediaPropertyDialog ${this.propertyTypeKey} init] fetched detailData:`, detailData);

          if (!detailData || detailData.length === 0) {
            this.scrapeData();
          } else {
            detailData = detailData[0];

            detailData.Image_URL = detailData.Photo_URL
              ? "local-resource://" + helpers.getDataPath(detailData.Photo_URL).replace(/\\/g, "\\\\")
              : null;

            this.detailData = {
              IMDB_ID: detailData.IMDB_Person_ID,
              Image_URL: detailData.Image_URL,
              DescriptionShort: detailData.ShortBio,
              DescriptionLong: detailData.LongBio,
            };

            logger.log(`[MediaPropertyDialog ${this.propertyTypeKey} init] this.detailData:`, this.detailData);
          }
        }

        for (const mic of Object.values(this.mediaItemsContainer)) {
          if (mic.type === "episodes" && !this.Series_id_Movies_Owner) {
            continue;
          }

          mic.numItems = await store.db.fireProcedureReturnScalar(
            query,
            Object.assign(queryParams, {
              $MediaType: mic.type === "episodes" ? "series" : mic.type,
              $Series_id_Movies_Owner: mic.type === "episodes" ? this.Series_id_Movies_Owner : null,
            })
          );
        }
        logger.log(`[MediaPropertyDialog] this.mediaItemsContainer:`, this.mediaItemsContainer);
      } catch (error) {
        logger.error(`[MediaPropertyDialog ${this.propertyTypeKey}] ERROR:`, error);
      } finally {
        this.isLoadingMovies = false;
      }
    },

    onCloseClick() {
      this.$emit("close");
    },

    async onFilterClick() {
      const setFilter = {};

      switch (this.propertyTypeKey) {
        case "age-rating":
          setFilter.filterAgeRatings = this.$shared.filters.filterAgeRatings.filter((ageRating) => {
            return (
              ageRating.Age >= this.getMinAge(this.propertyValue) && ageRating.Age <= this.getMaxAge(this.propertyValue)
            );
          });
          break;
        case "audio-format":
          setFilter.filterAudioFormats = [this.propertyValue];
          break;
        case "company":
          await store.addFilterCompany(this.propertyValue);
          setFilter.filterCompanies = [this.propertyValue];
          eventBus.companyDialogConfirm(setFilter);
          break;
        case "filming-location":
          await store.addFilterIMDBFilmingLocation(this.propertyValue, this.propertyValueDisplayText);
          setFilter.filterIMDBFilmingLocations = [this.propertyValue];
          eventBus.filmingLocationDialogConfirm(setFilter);
          break;
        case "genre":
          setFilter.filterGenres = [{ name: this.propertyValue, translated: this.propertyValueDisplayText }];
          break;
        case "audio-language":
          setFilter.filterAudioLanguages = [helpers.uppercaseEachWord(this.propertyValue.toLowerCase())];
          break;
        case "subtitle-language":
          setFilter.filterSubtitleLanguages = [helpers.uppercaseEachWord(this.propertyValue.toLowerCase())];
          break;
        case "plot-keyword":
          await store.addFilterIMDBPlotKeyword(this.propertyValue, this.propertyValueDisplayText);
          setFilter.filterIMDBPlotKeywords = [this.propertyValue];
          eventBus.plotKeywordDialogConfirm(setFilter);
          break;
        case "release-attribute":
          setFilter.filterReleaseAttributes = [this.propertyValue];
          break;
        case "video-encoder":
          setFilter.filterVideoEncoders = [this.propertyValue];
          break;
        case "video-quality":
          setFilter.filterQualities = [this.propertyValue.MI_Quality];
          break;
        case "person":
          await store.addFilterPerson(this.propertyValue, this.propertyValueDisplayText);
          setFilter.filterPersons = [this.propertyValue];
          eventBus.personDialogConfirm(setFilter);
          break;
      }

      eventBus.refetchSpecificFilter(setFilter);

      this.$emit("close");
    },

    openIMDB() {
      if (!this.imdbTconst) {
        return;
      }

      switch (this.propertyTypeKey) {
        case "company":
          shell.openExternal(`https://www.imdb.com/company/${this.imdbTconst}`);
          break;
        case "person":
          shell.openExternal(`https://www.imdb.com/name/${this.imdbTconst}`);
          break;
      }
    },

    onEscapePressed() {
      this.onCloseClick();
    },

    async toggleShowMovies(mic) {
      if (mic.showMediaItems) {
        mic.showMediaItems = false;
        return;
      }

      if (!mic.numItems) {
        return;
      }

      if (mic.mediaItems.length !== 0) {
        mic.showMediaItems = true;
        return;
      }

      this.isLoadingMovies = true;

      // Deduplication
      mic.mediaItems = await this.fetchMediaItems(mic.type);

      logger.log(`[MediaPropertyDialog toggleShowMovies] mic.mediaItems:`, mic.mediaItems);

      this.isLoadingMovies = false;

      mic.showMediaItems = true;
    },

    /**
     * Fetch Media Items (movies, series, episodes)
     * @param {string} type the type of media items to fetch ("movies", "series", "episodes")
     * @param {number} Series_id_Movies_Owner (optional) the Series_id_Movies_Owner (if type === "episodes")
     */
    async fetchMediaItems(type, Series_id_Movies_Owner) {
      try {
        const filters = {
          filterSettings: {},
        };

        switch (this.propertyTypeKey) {
          case "age-rating":
            filters.filterAgeRatings = [
              { Age: -1, Selected: false },
              ...this.$shared.filters.filterAgeRatings
                .filter((item) => {
                  return (
                    item.Age >= this.getMinAge(this.propertyValue) && item.Age <= this.getMaxAge(this.propertyValue)
                  );
                })
                .map((item) => {
                  return {
                    Age: item.Age,
                    Selected: true,
                  };
                }),
            ];
            break;
          case "audio-format":
            filters.filterAudioFormats = [
              { Name: "<not available>", Selected: false },
              {
                Name: this.propertyValue,
                Selected: true,
              },
            ];
            break;
          case "company":
            filters.filterCompanies = [
              {
                id_Filter_Companies: 0,
                Selected: false,
              },
              {
                id_Filter_Companies: 666,
                Selected: true,
                IMDB_Company_ID: this.imdbTconst,
                Company_Name: this.propertyValue,
              },
            ];
            break;
          case "filming-location":
            filters.filterIMDBFilmingLocations = [
              {
                id_Filter_IMDB_Filming_Locations: 0,
                Selected: false,
              },
              {
                id_Filter_IMDB_Filming_Locations: 666,
                id_IMDB_Filming_Locations: this.propertyValue,
                Selected: true,
              },
            ];
            break;
          case "genre":
            filters.filterGenres = [
              { GenreID: "none", Name: "None", Selected: false, id_Genres: -1 },
              ...this.$shared.filters.filterGenres
                .filter((item) => {
                  return item.Name === this.propertyValue;
                })
                .map((item) => {
                  return {
                    GenreID: item.GenreID,
                    Name: item.Name,
                    Selected: true,
                    id_Genres: item.id_Genres,
                  };
                }),
            ];
            break;
          case "audio-language":
            filters.filterAudioLanguages = [
              {
                Language: "<none>",
                Selected: false,
              },
              {
                Language: helpers.uppercaseEachWord(this.propertyValue.toLowerCase()),
                Selected: true,
              },
            ];
            break;
          case "subtitle-language":
            filters.filterSubtitleLanguages = [
              {
                Language: "<none>",
                Selected: false,
              },
              {
                Language: helpers.uppercaseEachWord(this.propertyValue.toLowerCase()),
                Selected: true,
              },
            ];
            break;
          case "plot-keyword":
            filters.filterIMDBPlotKeywords = [
              {
                id_Filter_IMDB_Plot_Keywords: -1,
                Selected: false,
              },
              {
                id_Filter_IMDB_Plot_Keywords: 666,
                Selected: true,
                id_IMDB_Plot_Keywords: this.propertyValue,
                Keyword: this.propertyValueDisplayText,
              },
            ];
            break;
          case "release-attribute":
            filters.filterReleaseAttributes = [
              { isAny: true, Selected: false },
              {
                isAny: false,
                Selected: true,
                ReleaseAttribute: this.propertyValue,
              },
            ];
            break;
          case "video-encoder":
            filters.filterVideoEncoders = [
              { Name: "<not available>", Selected: false },
              {
                Name: this.propertyValue,
                Selected: true,
              },
            ];
            break;
          case "video-quality":
            filters.filterQualities = [
              { MI_Quality: "<none>", Selected: false },
              {
                MI_Quality: this.propertyValue.MI_Quality,
                Selected: true,
              },
            ];
            break;
          case "person":
            filters.filterPersons = [
              {
                id_Filter_Persons: 0,
                Selected: false,
              },
              {
                id_Filter_Persons: 666,
                Selected: true,
                IMDB_Person_ID: this.propertyValue,
              },
            ];
        }

        const options = {
          $MediaType: type === "episodes" ? "series" : type,
          arr_id_Movies: null,
          minimumResultSet: true,
          $t: this.$t,
          filters,
          Series_id_Movies_Owner,
          dontStoreFilters: true,
        };

        logger.log(`[MediaPropertyDialog toggleShowMovies] options:`, options);

        const mediaItems = (await store.fetchMedia(options)).sort((a, b) => {
          if (Series_id_Movies_Owner) {
            if (a.Series_Season > b.Series_Season) {
              return 1;
            }
            if (a.Series_Season < b.Series_Season) {
              return -1;
            }
            if (a.Series_Episodes_First > b.Series_Episodes_First) {
              return 1;
            }
            if (a.Series_Episodes_First < b.Series_Episodes_First) {
              return -1;
            }

            return 0;
          }

          if (a.startYear > b.startYear) {
            return -1;
          }
          if (a.startYear < b.startYear) {
            return 1;
          }
          if (a.Name.toLowerCase() < b.Name.toLowerCase()) {
            return -1;
          }
          if (a.Name.toLowerCase() > b.Name.toLowerCase()) {
            return 1;
          }

          return 0;
        });

        const mediaItemsDeduplicated = mediaItems.filter((item, index) => {
          return (
            mediaItems.findIndex((item2) => {
              return `${item2.Name} ${item2.yearDisplay}` === `${item.Name} ${item.yearDisplay}`;
            }) === index
          );
        });

        logger.log(`[MediaPropertyDialog fetchMediaItems] mediaItemsDeduplicated:`, mediaItemsDeduplicated);

        if (this.propertyTypeKey === "person") {
          await store.addMediaItemPropertyDetails_Person(this.propertyValue, mediaItemsDeduplicated);
        }
        if (this.propertyTypeKey === "company") {
          await store.addMediaItemPropertyDetails_Company(this.imdbTconst, mediaItemsDeduplicated);
        }

        return mediaItemsDeduplicated;
      } catch (error) {
        logger.error(error);
      }

      return [];
    },

    async toggleSeriesEpisodes(mediaItem) {
      // seriesEpisodesCount
      // seriesEpisodesTotal
      // seriesEpisodesMediaItems

      logger.log("[toggleSeriesEpisodes] mediaItem:", mediaItem);

      if (mediaItem.showSeriesEpisodes) {
        this.$set(mediaItem, "showSeriesEpisodes", false);
        return;
      }

      this.$set(mediaItem, "showSeriesEpisodes", true);

      if (mediaItem.seriesEpisodesTotal) {
        return;
      }

      try {
        this.$set(mediaItem, "isLoadingSeriesEpisodes", true);

        const mediaItems = await this.fetchMediaItems("episodes", mediaItem.id_Movies);

        this.$set(mediaItem, "seriesEpisodesMediaItems", mediaItems);

        this.$set(mediaItem, "seriesEpisodesCount", mediaItems.length);

        // get number of total episodes
        const totalEpisodes = await store.db.fireProcedureReturnScalar(
          `
            SELECT COUNT(1) FROM tbl_Movies WHERE Series_id_Movies_Owner = $Series_id_Movies_Owner
          `,
          {
            $Series_id_Movies_Owner: mediaItem.id_Movies,
          }
        );

        this.$set(mediaItem, "seriesEpisodesTotal", totalEpisodes);
      } catch (error) {
        console.error(error);
        eventBus.showSnackbar("error", error);
      } finally {
        this.$set(mediaItem, "isLoadingSeriesEpisodes", false);
      }
    },

    $local_t(key, payload) {
      return this.$t(key, payload);
    },

    async onShowMediaItemDetails(mediaItem) {
      logger.log("[onShowMediaItemDetails] mediaItem:", mediaItem);

      // completely fetch mediaItem details
      const result = await store.fetchMedia({
        $MediaType: mediaItem.MediaType,
        arr_id_Movies: [mediaItem.id_Movies],
        minimumResultSet: false,
        $t: this.$local_t,
        filters: { filterSettings: {} },
        arr_IMDB_tconst: null,
        Series_id_Movies_Owner: mediaItem.Series_id_Movies_Owner,
        specificMediaType: mediaItem.specificMediaType,
      });

      logger.log("[onShowMediaItemDetails] result:", result);

      if (!result || !result.length) return;

      Object.keys(result[0]).forEach((key) => {
        mediaItem[key] = result[0][key];
      });
    },

    async onMICmediaItemEvent(payload) {
      logger.log("[MediaPropertyDialog.onMICmediaItemEvent] payload:", payload);
      this.$emit("mediaItemEvent", payload);
    },
  },

  // ### Lifecycle Hooks ###
  created() {
    // lodash debounced functions
    this.debouncedInit = _.debounce(this.init, 10);
  },
};
</script>

<style scoped>
.btn {
  margin: 2px;
}

.input-group--text-field {
  padding-left: 16px;
  /* padding-top: 0px; */
}

@media screen and (max-width: 599px) {
  .input-group--text-field {
    padding-left: 16px;
    padding-top: 0px;
  }
}
</style>
