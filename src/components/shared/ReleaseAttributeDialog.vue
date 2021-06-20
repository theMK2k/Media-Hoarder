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
        {{ $t("Release Attribute") }}:
        {{ ReleaseAttribute }}
        <v-progress-linear
          v-if="isScraping || isLoadingMovies"
          color="red accent-0"
          indeterminate
          rounded
          height="3"
        ></v-progress-linear>
      </v-card-title>

      <v-card-text>
        <div v-on:click.stop="toggleShowMovies()">
          <v-row
            v-if="numMovies !== null"
            class="mk-clickable"
            style="margin: 8px 6px 8px 4px"
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
              <v-row
                style="margin-left: 20px; margin-right: 6px; margin-bottom: 0px"
              >
                {{ movie.Name }}
                {{ movie.Name2 ? " | " + movie.Name2 : "" }}
                {{ movie.yearDisplay }}
              </v-row>
            </div>
          </div>
        </div>
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
          v-if="numMovies !== null"
          class="xs-fullwidth"
          color="primary"
          v-on:click.native="onFilterClick"
          style="margin-left: 8px"
        >
          {{ $t("Filter by this release attribute") }}
        </v-btn>
        <v-btn
          class="xs-fullwidth"
          color="red"
          v-on:click.native="onButtonClick('delete')"
          style="margin-left: 8px"
          >{{
            $t("Remove this release attribute for the current movie")
          }}</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import * as store from "@/store";
// import * as helpers from "@/helpers/helpers";
// const logger = require("loglevel");

// const { shell } = require("electron").remote;

import { eventBus } from "@/main";

export default {
  props: ["show", "ReleaseAttribute"],

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
    ReleaseAttribute: function (newVal) {
      this.init(newVal);
    },
  },

  methods: {
    async init(releaseAttribute) {
      this.movies = [];
      this.showMovies = false;
      this.numMovies = null;

      const releaseAttributesHierarchy = store.getReleaseAttributesHierarchy();
      const ra = releaseAttributesHierarchy.find(
        (rah) => rah.displayAs === releaseAttribute
      );

      this.numMovies = await store.db.fireProcedureReturnScalar(
        `
            SELECT COUNT(1) FROM (
                SELECT DISTINCT
                  MOV.Name || ' ' || IFNULL(MOV.startYear, 'xxx')
                FROM tbl_Movies_Release_Attributes MRA
                INNER JOIN tbl_Movies MOV ON MRA.id_Movies = MOV.id_Movies
                --INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
                WHERE
                    (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
                    AND MRA.deleted = 0
                    AND MRA.Release_Attributes_searchTerm IN (${ra.searchTerms
                      .map((param) => param.replace(/'/g, "''"))
                      .reduce((prev, current) => {
                        return prev + (prev ? ", " : "") + `'${current}'`;
                      }, "")}))`
      );
    },

    onButtonClick(eventName) {
      this.$emit(eventName, {});

      this.$emit("close");
    },

    onCloseClick() {
      this.$emit("close");
    },

    async onFilterClick() {
      const setFilter = {
        filterReleaseAttributes: [this.ReleaseAttribute],
      };

      eventBus.refetchFilters(setFilter);

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
            filterReleaseAttributes: [
              { isAny: true, Selected: false },
              {
                isAny: false,
                Selected: true,
                ReleaseAttribute: this.ReleaseAttribute,
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
