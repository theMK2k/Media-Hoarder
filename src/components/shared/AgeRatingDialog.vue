<template>
  <v-dialog
    v-model="show"
    persistent
    max-width="1000px"
    v-on:keydown.escape="onEscapePressed"
  >
    <v-card dark flat v-bind:ripple="false">
      <v-list-item style="padding-left: 0px">
        <!-- <div>
          <v-list-item-avatar tile style="margin: 6px; height: 150px; width: 120px">
          </v-list-item-avatar>
        </div>-->
        <v-list-item-content
          class="align-self-start"
          style="padding-left: 8px; padding-bottom: 6px"
        >
          <v-col style="padding: 0px !important" sm="12">
            <v-row>
              <div style="margin-left: 16px">
                <v-list-item-title
                  class="headline mb-2"
                  style="margin-bottom: 0px !important"
                  >{{ $t("Age Rating") }}: {{ Age_Rating }}</v-list-item-title
                >
              </div>
            </v-row>

            <v-progress-linear
              v-if="isScraping || isLoadingMovies"
              color="red accent-0"
              indeterminate
              rounded
              height="3"
            ></v-progress-linear>

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
                    style="
                      margin-left: 20px;
                      margin-right: 6px;
                      margin-bottom: 8px;
                    "
                  >
                    {{ movie.Name }}
                    {{ movie.Name2 ? " | " + movie.Name2 : "" }}
                    {{ movie.yearDisplay }}
                  </v-row>
                </div>
              </div>
            </div>
          </v-col>
        </v-list-item-content>
      </v-list-item>
      <v-col sm="12">
        <v-row style="margin-top: 8px">
          <v-btn
            class="xs-fullwidth"
            color="secondary"
            v-on:click.native="onCloseClick"
            style="margin-left: 8px"
            >{{ $t("Close") }}</v-btn
          >
          <!-- <v-btn
            class="xs-fullwidth"
            color="primary"
            v-on:click.stop="openIMDB()"
            style="margin-left: 8px;"
          >
            <v-icon small>mdi-web</v-icon>&nbsp;IMDB
          </v-btn>-->
          <v-btn
            v-if="numMovies !== null"
            class="xs-fullwidth"
            color="primary"
            v-on:click.native="onFilterClick"
            style="margin-left: 8px"
          >
            {{ $t("Filter by this age rating") }}
          </v-btn>
        </v-row>
      </v-col>
    </v-card>
  </v-dialog>
</template>

<script>
import * as store from "@/store";
// import * as helpers from "@/helpers/helpers";
const logger = require("loglevel");

// const { shell } = require("electron").remote;

import { eventBus } from "@/main";

export default {
  props: ["show", "Age_Rating"],

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
    Age_Rating: function (newVal) {
      this.init(newVal);
    },
  },

  methods: {
    getMinAge(Age_Rating) {
      let ageRating = Age_Rating.replace(/\+/g, "");

      if (ageRating.includes("-")) {
        ageRating = ageRating.split("-")[0];
      }

      ageRating = +ageRating;

      return ageRating;
    },

    getMaxAge(Age_Rating) {
      let ageRating = Age_Rating.replace(/\+/g, "");

      if (ageRating.includes("-")) {
        ageRating = ageRating.split("-")[1];
      }

      ageRating = +ageRating;

      return ageRating;
    },

    async init(Age_Rating) {
      this.movies = [];
      this.showMovies = false;
      this.numMovies = null;

      const payload = {
        $MinAge: this.getMinAge(Age_Rating),
        $MaxAge: this.getMaxAge(Age_Rating),
      };

      logger.log("payload:", payload);

      try {
        this.numMovies = await store.db.fireProcedureReturnScalar(
          `
          SELECT COUNT(1) FROM
          (
            SELECT DISTINCT
              MOV.Name || ' ' || IFNULL(MOV.startYear, 'xxx')
            FROM tbl_Movies MOV
            LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
            WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
                  AND (
                        AR.Age BETWEEN $MinAge AND $MaxAge
                        OR (
                              MOV.IMDB_id_AgeRating_Chosen_Country IS NULL AND MOV.IMDB_MinAge >= $MinAge AND MOV.IMDB_MaxAge <= $MaxAge
                        )
                  )
          )
        `,
          payload
        );
      } catch (e) {
        logger.error(e);
      }

      logger.log("numMovies:", this.numMovies);
    },

    onButtonClick(eventName) {
      this.$emit(eventName, {
        dontAskAgain: this.dontAskAgainValue,
        textValue: this.textValueLocal,
      });

      this.resetData();
    },

    async scrapeData() {
      logger.log("VideoQualityDialog SCRAPE!");
      this.isScraping = true;
      this.isScraping = false;
    },

    onCloseClick() {
      this.$emit("close");
    },

    async onFilterClick() {
      const limits = {
        $Min_Age: this.getMinAge(this.Age_Rating),
        $Max_Age: this.getMaxAge(this.Age_Rating),
      };

      const setFilter = {
        filterAgeRatings: this.$shared.filters.filterAgeRatings.filter(
          (ageRating) => {
            return (
              ageRating.Age >= limits.$Min_Age &&
              ageRating.Age <= limits.$Max_Age
            );
          }
        ),
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
            filterAgeRatings: [
              { Age: -1, Selected: false },
              ...this.$shared.filters.filterAgeRatings
                .filter((item) => {
                  return (
                    item.Age >= this.getMinAge(this.Age_Rating) &&
                    item.Age <= this.getMaxAge(this.Age_Rating)
                  );
                })
                .map((item) => {
                  return {
                    Age: item.Age,
                    Selected: true,
                  };
                }),
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
