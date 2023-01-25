<template>
  <v-dialog
    v-model="show"
    persistent
    max-width="1000px"
    v-on:keydown.escape="onEscapePressed"
    scrollable
  >
    <v-card dark flat v-bind:ripple="false">
      <v-card-title>
        {{ $t("AI Recommendations") }}
      </v-card-title>

      <v-card-text>
        <p>
          {{
            $t(
              "Click the button below and ask the AI to list movies according to your criteria_"
            )
          }}
          <strong>{{ $t("Always ask for IMDB IDs!") }}</strong>
        </p>

        <v-btn
          class="xs-fullwidth"
          color="primary"
          v-on:click.native="onStartConversation"
          style="margin-left: 8px"
        >
          {{ $t("Start Conversation") }}
        </v-btn>

        <v-list-item
          three-line
          style="padding-left: 0px; align-items: flex-start"
        >
          <v-list-item-content
            class="align-self-start"
            style="padding-top: 6px; padding-bottom: 6px"
          >
            <div>
              <v-row
                v-if="numMovies !== null"
                class="mk-compact-movie-list-title"
              >
                {{
                  $t("Result") +
                  ": " +
                  numMovies +
                  " " +
                  $t(numMovies === 1 ? "movie" : "movies")
                }}
              </v-row>
              <div class="mk-clickable-white">
                <div v-for="(movie, index) in movies" v-bind:key="index">
                  <mk-compact-movie-list-row v-bind:movie="movie" />
                </div>
              </div>
            </div>
          </v-list-item-content>
        </v-list-item>
      </v-card-text>

      <v-card-actions>
        <v-btn
          class="xs-fullwidth"
          color="secondary"
          v-on:click.native="onCloseClick"
          style="margin-left: 8px"
          >{{ $t("Close") }}</v-btn
        >
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

export default {
  props: ["show"],

  components: {
    "mk-compact-movie-list-row": CompactMovieListRow,
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
      if (this.browserWindow) {
        this.browserWindow.close();
        this.browserWindow = null;
      }
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
      arr_IMDB_tconst.forEach((imdb_tconst) => {
        if (
          this.arr_IMDB_tconst.find(
            (imdb_tconst2) => imdb_tconst2 === imdb_tconst
          )
        ) {
          return;
        }

        this.arr_IMDB_tconst.push(imdb_tconst);
      });

      movieNamesAndYears.forEach((movieNameAndYear) => {
        if (
          this.movieNamesAndYears.find(
            (movieNameAndYear2) =>
              movieNameAndYear2.name === movieNameAndYear.name &&
              movieNameAndYear2.year === movieNameAndYear.year
          )
        ) {
          return;
        }

        this.movieNamesAndYears.push(movieNameAndYear);
      });

      for (const movieNameAndYear of this.movieNamesAndYears.filter(
        (item) => !item.processed
      )) {
        if (movieNameAndYear.name && movieNameAndYear.year) {
          movieNameAndYear.imdb_tconst =
            await store.db.fireProcedureReturnScalar(
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
            if (
              !this.arr_IMDB_tconst.find(
                (imdb_tconst2) => imdb_tconst2 === movieNameAndYear.imdb_tconst
              )
            ) {
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
        await store.fetchMedia(
          "movies",
          null,
          true,
          this.$t,
          {
            filterSettings: {},
          },
          this.arr_IMDB_tconst
        )
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
              return (
                `${item2.Name} ${item2.yearDisplay}` ===
                `${item.Name} ${item.yearDisplay}`
              );
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

          logger.log(
            "[updateFromBrowserwindow] that.browserWindow:",
            that.browserWindow
          );
          logger.log(
            "[updateFromBrowserwindow] browserWindow closing, that.browserWindow.webContents:",
            that.browserWindow.webContents
          );

          const content =
            await that.browserWindow.webContents.executeJavaScript(
              "document.getElementsByTagName('body')[0].innerHTML"
            );

          logger.log("[onStartConversation] content:", content);

          const rxIMDBtconst = /\d{7,}/g;
          const rxMovieNameAndYear = /<li>.*?\(\d\d\d\d\)/g;

          if (
            !rxIMDBtconst.test(content) &&
            !rxMovieNameAndYear.test(content)
          ) {
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

          logger.log(
            "[onStartConversation] imdbIDs:",
            arr_IMDB_tconst,
            "movieNamesAndYears:",
            movieNamesAndYears
          );

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
