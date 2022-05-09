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
        {{ $t("Plot Keyword") }}: {{ Keyword }}
        <v-progress-linear
          v-if="isScraping || isLoadingMovies"
          color="red accent-0"
          indeterminate
          rounded
          height="3"
        ></v-progress-linear>
      </v-card-title>

      <v-card-text>
        <v-list-item
          three-line
          style="padding-left: 0px; align-items: flex-start"
        >
          <v-list-item-content
            class="align-self-start"
            style="padding-top: 6px; padding-bottom: 6px"
          >
            <div v-on:click.stop="toggleShowMovies()">
              <v-row
                v-if="numMovies !== null"
                class="mk-clickable mk-compact-movie-list-title"
              >
                {{
                  numMovies +
                  " " +
                  $t(numMovies === 1 ? "movie" : "movies") +
                  (!showMovies ? " »" : "")
                }}
              </v-row>
              <div v-if="showMovies" class="mk-clickable-white">
                <div v-for="(movie, index) in movies" v-bind:key="index">
                  <v-row class="mk-compact-movie-list-row">
                    {{ movie.Name }}
                    {{ movie.Name2 ? " | " + movie.Name2 : "" }}
                    {{ movie.yearDisplay }}
                  </v-row>
                </div>
              </div>
            </div>
          </v-list-item-content>
        </v-list-item>
      </v-card-text>

      <v-card-actions>
        <v-btn
          v-if="numMovies !== null"
          class="xs-fullwidth"
          color="secondary"
          v-on:click.native="onCloseClick"
          style="margin-left: 8px"
          >{{ $t("Close") }}</v-btn
        >
        <v-btn
          class="xs-fullwidth"
          color="primary"
          v-on:click.native="onFilterClick"
          style="margin-left: 8px"
        >
          {{ $t("Filter by this plot keyword") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import * as store from "@/store";

import { eventBus } from "@/main";

export default {
  props: ["show", "id_IMDB_Plot_Keywords", "Keyword"],

  data() {
    return {
      isScraping: false,
      numMovies: null,
      isLoadingMovies: false,
      movies: [],
      showMovies: false,
    };
  },

  watch: {
    id_IMDB_Plot_Keywords: function (newVal) {
      this.init(newVal);
    },
  },

  methods: {
    async init($id_IMDB_Plot_Keywords) {
      this.movies = [];
      this.showMovies = false;
      this.numMovies = null;

      this.numMovies = await store.db.fireProcedureReturnScalar(
        `
          SELECT COUNT(1) FROM
          (
            SELECT DISTINCT
              MOV.Name || ' ' || IFNULL(MOV.startYear, 'xxx')
            FROM tbl_Movies_IMDB_Plot_Keywords MPK
            INNER JOIN tbl_Movies MOV ON MPK.id_Movies = MOV.id_Movies
            WHERE MPK.id_IMDB_Plot_Keywords = $id_IMDB_Plot_Keywords
                  AND (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
          )
      `,
        { $id_IMDB_Plot_Keywords }
      );
    },

    onButtonClick(eventName) {
      this.$emit(eventName, {
        dontAskAgain: this.dontAskAgainValue,
        textValue: this.textValueLocal,
      });

      this.resetData();
    },

    onCloseClick() {
      this.$emit("close");
    },

    async onFilterClick() {
      await store.addFilterIMDBPlotKeyword(
        this.id_IMDB_Plot_Keywords,
        this.Keyword
      );

      const setFilter = {
        filterIMDBPlotKeywords: [this.id_IMDB_Plot_Keywords],
      };

      eventBus.plotKeywordDialogConfirm(setFilter);

      eventBus.refetchSpecificFilter(setFilter);

      this.$emit("close");
    },

    onEscapePressed() {
      this.onCloseClick();
    },

    async toggleShowMovies() {
      if (this.showMovies) {
        this.showMovies = false;
        return;
      }

      if (!this.movies.length > 0) {
        this.isLoadingMovies = true;
        const movies = (
          await store.fetchMedia("movies", null, true, this.$t, {
            filterSettings: {},
            filterIMDBPlotKeywords: [
              {
                id_Filter_IMDB_Plot_Keywords: -1,
                Selected: false,
              },
              {
                id_Filter_IMDB_Plot_Keywords: 666,
                Selected: true,
                id_IMDB_Plot_Keywords: this.id_IMDB_Plot_Keywords,
                Keyword: this.Keyword,
              },
            ],
          })
        )
          .sort((a, b) => {
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
          })
          .map((item) => {
            return {
              Name: item.Name,
              Name2: item.Name2,
              yearDisplay: item.yearDisplay,
            };
          });

        this.movies = movies.filter((item, index) => {
          return (
            movies.findIndex((item2) => {
              return (
                `${item2.Name} ${item2.yearDisplay}` ===
                `${item.Name} ${item.yearDisplay}`
              );
            }) === index
          );
        });

        this.isLoadingMovies = false;
      }

      this.showMovies = true;
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
