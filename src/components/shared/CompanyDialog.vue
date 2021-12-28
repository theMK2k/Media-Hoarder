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
        {{ $t("Company") }}: {{ Company_Name }}
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
                style="margin-left: 20px; margin-right: 6px; margin-bottom: 8px"
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
          class="xs-fullwidth"
          color="primary"
          v-on:click.stop="openIMDB()"
          style="margin-left: 8px"
        >
          <v-icon small>mdi-web</v-icon>&nbsp;IMDB
        </v-btn>
        <v-btn
          v-if="numMovies !== null"
          class="xs-fullwidth"
          color="primary"
          v-on:click.native="onFilterClick"
          style="margin-left: 8px"
        >
          {{ $t("Filter by this company") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import * as store from "@/store";
// const logger = require("../../helpers/logger");

const { shell } = require("@electron/remote");

const sqlString = require("sqlstring-sqlite");

import { eventBus } from "@/main";

export default {
  props: ["show", "IMDB_Company_ID", "Company_Name"],

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
    Company_Name: function (newVal) {
      this.init(newVal);
    },
  },

  methods: {
    async init(Company_Name) {
      this.movies = [];
      this.showMovies = false;
      this.numMovies = null;

      this.numMovies = await store.db.fireProcedureReturnScalar(
        `
        SELECT COUNT(1) FROM
        (
          SELECT DISTINCT
              MOV.Name || ' ' || IFNULL(MOV.startYear, 'xxx')
          FROM tbl_Movies_IMDB_Companies MC
        	INNER JOIN tbl_Movies MOV ON MC.id_Movies = MOV.id_Movies
          WHERE MC.Company_Name = ${sqlString.escape(Company_Name)}
                AND (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
        )
      `
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
      await store.addFilterCompany(this.Company_Name);

      const setFilter = {
        filterCompanies: [this.Company_Name],
      };

      eventBus.companyDialogConfirm(setFilter);

      eventBus.refetchSpecificFilter(setFilter);

      this.$emit("close");
    },

    openIMDB() {
      shell.openExternal(
        `https://www.imdb.com/company/${this.IMDB_Company_ID}`
      );
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
            filterCompanies: [
              {
                id_Filter_Companies: 0,
                Selected: false,
              },
              {
                id_Filter_Companies: 666,
                Selected: true,
                IMDB_Company_ID: this.IMDB_Company_ID,
                Company_Name: this.Company_Name,
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
