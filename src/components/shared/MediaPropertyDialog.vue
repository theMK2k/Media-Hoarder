<!-- This is a generalized dialog for properties like age rating, audio format, genre etc. -->
<template>
  <v-dialog v-model="show" persistent max-width="1000px" v-on:keydown.escape="onEscapePressed" scrollable>
    <v-card dark flat v-bind:ripple="false">
      <v-card-title>
        {{ $t(propertyType.title) }}: {{ propertyValueDisplayText }}
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
          <v-list-item-content class="align-self-start" style="padding-top: 6px; padding-bottom: 6px">
            <div v-on:click.stop="toggleShowMovies()">
              <v-row v-if="numMovies !== null" class="mk-clickable mk-compact-movie-list-title">
                {{
                  numMovies +
                  " " +
                  $t(
                    numMovies === 1
                      ? mediaType == "movies"
                        ? "movie"
                        : Series_id_Movies_Owner
                        ? "episode"
                        : "series_singular"
                      : mediaType == "movies"
                      ? "movies"
                      : Series_id_Movies_Owner
                      ? "episodes"
                      : "series_plural"
                  ) +
                  (!showMovies ? " »" : "")
                }}
              </v-row>
              <div v-if="showMovies" class="mk-clickable-white">
                <div v-for="(movie, index) in movies" v-bind:key="index">
                  <mk-compact-movie-list-row v-bind:movie="movie" />
                </div>
              </div>
            </div>
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
          v-if="['company'].includes(propertyTypeKey)"
          class="xs-fullwidth"
          color="primary"
          v-on:click.stop="openIMDB()"
          style="margin-left: 8px"
        >
          <v-icon small>mdi-web</v-icon>&nbsp;IMDB
        </v-btn>
        <!-- Button: Filter by this... -->
        <v-btn
          v-if="!Series_id_Movies_Owner && numMovies !== null"
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
const { shell } = require("@electron/remote");

import * as _ from "lodash";

import * as store from "@/store";
// import * as helpers from "@/helpers/helpers";
const logger = require("../../helpers/logger");

import { eventBus } from "@/main";

import CompactMovieListRow from "@/components/shared/CompactMovieListRow.vue";

export default {
  props: [
    "show",
    "propertyTypeKey",
    "propertyValue",
    "propertyValueDisplayText",
    "imdbTconst",
    "mediaType",
    "Series_id_Movies_Owner",
  ],

  components: {
    "mk-compact-movie-list-row": CompactMovieListRow,
  },

  computed: {
    propertyType() {
      return this.propertyTypes[this.propertyTypeKey];
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
      },

      isScraping: false,
      numMovies: null,
      isLoadingMovies: false,
      movies: [],
      showMovies: false,
    };
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

    async init() {
      this.movies = [];
      this.showMovies = false;
      this.numMovies = null;

      const queryParams = {
        $MediaType: this.mediaType,
      };

      switch (this.propertyTypeKey) {
        case "age-rating":
          queryParams.$MinAge = this.getMinAge(this.propertyValue);
          queryParams.$MaxAge = this.getMaxAge(this.propertyValue);
          break;
        case "audio-format":
          queryParams.$Audio_Format = this.propertyValue;
          break;
        case "company":
          queryParams.$CompanyName = this.propertyValue;
          break;
        case "filming-location":
          queryParams.$id_IMDB_Filming_Locations = this.propertyValue;
          break;
      }

      logger.log(`[MediaPropertyDialog ${this.propertyTypeKey}] queryParams:`, queryParams);

      try {
        this.numMovies = await store.db.fireProcedureReturnScalar(
          `
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
                : ``
            }

            WHERE SP.MediaType = $MediaType
                  AND (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
                  ${
                    this.mediaType === "series" && !this.Series_id_Movies_Owner
                      ? `AND MOV.Series_id_Movies_Owner IS NULL`
                      : ""
                  }
                  ${
                    this.mediaType === "series" && this.Series_id_Movies_Owner
                      ? `AND MOV.Series_id_Movies_Owner = ${this.Series_id_Movies_Owner}`
                      : ""
                  }
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
          )
        `,
          queryParams
        );
      } catch (error) {
        logger.error(`[MediaPropertyDialog ${this.propertyTypeKey}] ERROR:`, error);
      }

      logger.log(`[MediaPropertyDialog ${this.propertyTypeKey}] numMovies:`, this.numMovies);
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
      }

      eventBus.refetchSpecificFilter(setFilter);

      this.$emit("close");
    },

    openIMDB() {
      if (!this.imdbTconst) {
        return;
      }

      if (this.propertyTypeKey == "company") {
        shell.openExternal(`https://www.imdb.com/company/${this.imdbTconst}`);
      }
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
        }

        const movies = (
          await store.fetchMedia({
            $MediaType: this.mediaType,
            arr_id_Movies: null,
            minimumResultSet: true,
            $t: this.$t,
            filters,
            Series_id_Movies_Owner: this.Series_id_Movies_Owner,
          })
        ).sort((a, b) => {
          if (this.Series_id_Movies_Owner) {
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

        this.movies = movies.filter((item, index) => {
          return (
            movies.findIndex((item2) => {
              return `${item2.Name} ${item2.yearDisplay}` === `${item.Name} ${item.yearDisplay}`;
            }) === index
          );
        });

        this.isLoadingMovies = false;
      }

      this.showMovies = true;
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
