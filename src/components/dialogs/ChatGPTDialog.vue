<template>
  <v-dialog v-model="show" persistent max-width="1000px" v-on:keydown.escape="onEscapePressed" scrollable>
    <v-card dark flat v-bind:ripple="false">
      <v-card-title>
        {{ $t("AI Recommendations") }}
      </v-card-title>

      <v-card-text>
        <p>
          {{ $t("Click the button below and ask the AI to list movies according to your criteria_") }}
          <strong>{{ $t("It is recommended to also ask for the release year_") }}</strong>
        </p>

        <v-btn class="xs-fullwidth" color="primary" v-on:click.native="onStartConversation" style="margin-left: 8px">
          {{ $t("Start Conversation") }}
        </v-btn>

        <v-list-item three-line style="padding-left: 0px; align-items: flex-start">
          <v-list-item-content class="align-self-start" style="padding-top: 6px; padding-bottom: 6px">
            <div>
              <v-row v-if="numMovies !== null" class="mk-compact-movie-list-title">
                {{ $t("Result") + ": " + numMovies + " " + $t(numMovies === 1 ? "movie" : "movies") }}
              </v-row>
              <div class="mk-clickable-white">
                <div v-for="(movieItem, index) in movies" v-bind:key="index">
                  <!-- <mk-compact-movie-list-row v-bind:movie="movieItem" /> -->
                  <div>
                    <v-menu
                      v-model="movieItem.showDetails"
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
                          v-on:click="onShowMediaItemDetails(movieItem)"
                          v-bind:movie="movieItem"
                          v-bind:isClickable="true"
                        />
                      </template>
                      <v-card>
                        <v-list-item three-line style="padding-left: 0px; padding-right: 0px">
                          <mk-media-item-card
                            v-bind:mediaItem="movieItem"
                            v-bind:isScanning="false"
                            v-bind:isInDialog="true"
                            v-bind:showCloseButton="true"
                            v-on:close="movieItem.showDetails = false"
                            v-on:mediaItemEvent="onMICmediaItemEvent"
                          ></mk-media-item-card>
                        </v-list-item>
                      </v-card>
                    </v-menu>
                  </div>
                </div>
              </div>
            </div>
          </v-list-item-content>
        </v-list-item>
      </v-card-text>

      <v-card-actions>
        <v-btn class="xs-fullwidth" color="secondary" v-on:click.native="onCloseClick" style="margin-left: 8px">{{
          $t("Close")
        }}</v-btn>
        <v-btn
          v-if="numMovies > 0"
          v-bind:disabled="!listTitle"
          class="xs-fullwidth"
          color="primary"
          v-on:click.native="onFilterClick"
          style="margin-left: 8px"
        >
          {{ $t("Create and filter by this list") }}
        </v-btn>
        <v-text-field
          v-if="numMovies"
          v-bind:label="$t('List Title')"
          v-model="listTitle"
          style="margin-left: 16px"
        ></v-text-field>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import * as store from "@/store";
const logger = require("../../helpers/logger");

const { BrowserWindow } = require("@electron/remote");

const helpers = require("../../helpers/helpers");

import { eventBus } from "@/main";

import CompactMovieListRow from "@/components/shared/CompactMovieListRow.vue";
import MediaItemCard from "@/components/shared/MediaItemCard.vue";

export default {
  props: ["show"],

  components: {
    "mk-compact-movie-list-row": CompactMovieListRow,
    "mk-media-item-card": MediaItemCard,
  },

  data() {
    return {
      isScraping: false,
      numMovies: null,
      isLoadingMovies: false,
      movieNamesAndYears: [], // { name: "Die Hard", year: 1987, imdb_tconst: "tt12345678", processed: true }
      arr_IMDB_tconst: [],
      movies: null,
      listTitle: null,
      browserWindow: null,
      intervalUpdateFromBrowserwindow: null,
    };
  },

  watch: {},

  methods: {
    async init() {
      this.arr_IMDB_tconst = [];
      this.movieNamesAndYears = [];
      this.movies = null;
      this.numMovies = null;
      this.title = null;
    },

    onCloseClick() {
      clearInterval(this.intervalUpdateFromBrowserwindow);
      if (this.browserWindow) {
        this.browserWindow.close();
      }
      this.$emit("close");
    },

    async onFilterClick() {
      const id_Lists = await store.createList(this.listTitle, true);

      await store.clearList(id_Lists);

      logger.log("[onFilterClick] id_Lists:", id_Lists);

      for (const movie of this.movies) {
        await store.addToList(id_Lists, movie.id_Movies, false, true); // addToList determines duplicates and adds them itself
      }

      const setFilter = {
        filterLists: [this.listTitle],
      };

      eventBus.refetchSpecificFilter(setFilter);

      this.$emit("close");
    },

    onEscapePressed() {
      this.onCloseClick();
    },

    async updateLists(arr_IMDB_tconst, movieNamesAndYears) {
      logger.log("[updateLists] movieNamesAndYears:", movieNamesAndYears);

      arr_IMDB_tconst.forEach((imdb_tconst) => {
        if (this.arr_IMDB_tconst.find((imdb_tconst2) => imdb_tconst2 === imdb_tconst)) {
          return;
        }

        this.arr_IMDB_tconst.push(imdb_tconst);
      });

      movieNamesAndYears.forEach((movieNameAndYear) => {
        if (
          this.movieNamesAndYears.find(
            (movieNameAndYear2) =>
              movieNameAndYear2.name === movieNameAndYear.name && movieNameAndYear2.year === movieNameAndYear.year
          )
        ) {
          return;
        }

        this.movieNamesAndYears.push(movieNameAndYear);
      });

      for (const movieNameAndYear of this.movieNamesAndYears.filter((item) => !item.processed)) {
        if (movieNameAndYear.name && movieNameAndYear.year) {
          movieNameAndYear.imdb_tconst = await store.db.fireProcedureReturnScalar(
            `
            SELECT
              IMDB_tconst
            FROM  tbl_Movies MOV
            WHERE MOV.IMDB_startYear = $year
                  AND (
                        MOV.Name LIKE $name
                    OR  MOV.Name2 LIKE $name
                    OR MOV.IMDB_originalTitle LIKE $name
                    OR MOV.IMDB_primaryTitle LIKE $name
                    OR MOV.IMDB_localTitle LIKE $name
                  )
        `,
            { $year: movieNameAndYear.year, $name: movieNameAndYear.name }
          );

          if (movieNameAndYear.imdb_tconst) {
            if (!this.arr_IMDB_tconst.find((imdb_tconst2) => imdb_tconst2 === movieNameAndYear.imdb_tconst)) {
              this.arr_IMDB_tconst.push(movieNameAndYear.imdb_tconst);
            }
          }
        }
        if (movieNameAndYear.name && !movieNameAndYear.year) {
          movieNameAndYear.imdb_tconst = null;
          const imdb_tconst_candidates = await store.db.fireProcedureReturnAll(
            `
            SELECT DISTINCT
              IMDB_tconst
            FROM  tbl_Movies MOV
            WHERE (
                        MOV.Name LIKE $name
                    OR  MOV.Name2 LIKE $name
                    OR MOV.IMDB_originalTitle LIKE $name
                    OR MOV.IMDB_primaryTitle LIKE $name
                    OR MOV.IMDB_localTitle LIKE $name
                  )
        `,
            { $name: movieNameAndYear.name }
          );

          logger.log(
            "[updateLists] movieNameAndYear.name:",
            movieNameAndYear.name,
            " imdb_tconst_candidates:",
            imdb_tconst_candidates
          );

          if (imdb_tconst_candidates.length === 1) {
            logger.log("[updateLists] we found a single candidate!");
            movieNameAndYear.imdb_tconst = imdb_tconst_candidates[0].IMDB_tconst;
          } else {
            logger.log("[updateLists] not a singular candidate found, abort!");
          }

          if (movieNameAndYear.imdb_tconst) {
            if (!this.arr_IMDB_tconst.find((imdb_tconst2) => imdb_tconst2 === movieNameAndYear.imdb_tconst)) {
              this.arr_IMDB_tconst.push(movieNameAndYear.imdb_tconst);
            }
          }
        }

        movieNameAndYear.processed = true;
      }
    },

    async loadMovies(deduplicate) {
      logger.log("[loadMovies] imdbIDs:", this.arr_IMDB_tconst);
      if (this.arr_IMDB_tconst.length === 0) {
        return [];
      }
      this.isLoadingMovies = true;
      let movies = (
        await store.fetchMedia({
          $MediaType: "movies",
          arr_id_Movies: null,
          minimumResultSet: true,
          $t: this.$t,
          filters: {
            filterSettings: {},
          },
          arr_IMDB_tconst: this.arr_IMDB_tconst,
          dontStoreFilters: true,
        })
      ).sort((a, b) => {
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

      if (deduplicate) {
        movies = movies.filter((item, index) => {
          return (
            movies.findIndex((item2) => {
              return `${item2.Name} ${item2.yearDisplay}` === `${item.Name} ${item.yearDisplay}`;
            }) === index
          );
        });
      }

      logger.log("[loadMovies] movies:", movies);

      this.isLoadingMovies = false;

      return movies;
    },

    async onStartConversation() {
      logger.log("[onStartConversation] START");

      if (this.browserWindow) {
        this.browserWindow.close();
        this.browserWindow = null;
      }

      this.browserWindow = new BrowserWindow({
        width: 760,
        height: 600,
        show: true,
      });

      this.browserWindow.setMenu(null);

      if (helpers.isDevelopment) {
        this.browserWindow.toggleDevTools();
      }

      let updateFromBrowserwindowRunning = false;
      async function updateFromBrowserwindow(that) {
        // TODO: also read out "Movie Name X" and try to find them in our database

        if (updateFromBrowserwindowRunning) {
          return;
        }

        try {
          updateFromBrowserwindowRunning = true;

          logger.log("[updateFromBrowserwindow] that.browserWindow:", that.browserWindow);
          logger.log(
            "[updateFromBrowserwindow] browserWindow closing, that.browserWindow.webContents:",
            that.browserWindow.webContents
          );

          const content = await that.browserWindow.webContents.executeJavaScript(
            "document.getElementsByTagName('body')[0].innerHTML"
          );

          logger.log("[onStartConversation] content:", content);

          const rxIMDBtconst = /\d{7,}/g;
          const rxMovieNameAndYear = /<li>.*?\(\d\d\d\d\)/g;
          const rxMovieName = /<li>.*?<\/li>/g;

          if (!rxIMDBtconst.test(content) && !rxMovieNameAndYear.test(content) && !rxMovieName.test(content)) {
            logger.log("[onStartConversation] NO MATCH, initializing");
            that.init();
            return;
          }

          let arr_IMDB_tconst = [];
          if (rxIMDBtconst.test(content)) {
            arr_IMDB_tconst = content.match(rxIMDBtconst).map((item) => {
              return `tt${item}`;
            });
          }

          const movieNamesAndYears = [];
          if (rxMovieNameAndYear.test(content)) {
            content.match(rxMovieNameAndYear).forEach((hit) => {
              const rxNameAndYear = /<li>(.*?)\((\d\d\d\d)\)/;
              movieNamesAndYears.push({
                name: hit.match(rxNameAndYear)[1].replace(/"/g, "").trim(),
                year: +hit.match(rxNameAndYear)[2],
              });
            });
          }

          if (!movieNamesAndYears.length) {
            if (rxMovieName.test(content)) {
              content.match(rxMovieName).forEach((hit) => {
                const rxName = /<li>(.*?)<\/li>/;
                movieNamesAndYears.push({
                  name: hit.match(rxName)[1].replace(/"/g, "").trim(),
                  year: null,
                });
              });
            }
          }

          logger.log("[onStartConversation] imdbIDs:", arr_IMDB_tconst, "movieNamesAndYears:", movieNamesAndYears);

          that.updateLists(arr_IMDB_tconst, movieNamesAndYears);
          that.movies = await that.loadMovies(arr_IMDB_tconst, true);
          that.numMovies = that.movies.length;

          if (/<h1 .*?>(.*?)<\/h1>/s.test(content)) {
            that.listTitle = "AI: " + content.match(/<h1 .*?>(.*?)<\/h1>/s)[1];
          }

          return;
        } catch (err) {
          console.error(err);
        } finally {
          updateFromBrowserwindowRunning = false;
        }
      }

      if (this.intervalUpdateFromBrowserwindow) {
        clearInterval(this.intervalUpdateFromBrowserwindow);
        this.intervalUpdateFromBrowserwindow = null;
      }

      const that = this;

      this.intervalUpdateFromBrowserwindow = setInterval(() => {
        logger.log("[intervalUpdateFromBrowserwindow] tick");
        if (that.browserWindow) {
          logger.log("[browserWindow show event] run updateFromBrowserwindow");
          return updateFromBrowserwindow(that);
        }
      }, 500);

      this.browserWindow.on("close", async () => {
        clearInterval(this.intervalUpdateFromBrowserwindow);
        this.intervalUpdateFromBrowserwindow = null;
        this.browserWindow = null;
      });

      this.browserWindow.loadURL("https://chat.openai.com");
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
      logger.log("[ChatGPTDialog.onMICmediaItemEvent] payload:", payload);
      this.$emit("mediaItemEvent", payload);
    },
  },

  // ### Lifecycle Hooks ###
  created() {},
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
