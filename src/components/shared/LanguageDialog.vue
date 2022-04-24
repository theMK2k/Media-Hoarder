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
        {{ Type === "audio" ? $t("Audio Language") : $t("Subtitle Language") }}:
        {{ Language ? `${$t(`LanguageNames.${Language}`)} (${Code})` : Code }}
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
              <v-row class="mk-movie-list-row">
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
          {{ $t("Filter by this language") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import * as store from "@/store";
import * as helpers from "@/helpers/helpers";
const logger = require("../../helpers/logger");

const { languageCodeNameMapping } = require("@/languages");

import { eventBus } from "@/main";

export default {
  props: ["show", "Type", "Code"],

  data() {
    return {
      isScraping: false,
      numMovies: null,
      isLoadingMovies: false,
      movies: [],
      showMovies: false,
    };
  },

  computed: {
    Language() {
      const codeTransformed = this.Code
        ? helpers.uppercaseEachWord(this.Code.toLowerCase())
        : "";
      return languageCodeNameMapping[codeTransformed];
    },
  },

  watch: {
    Code: function (newVal) {
      this.init(newVal, this.Type);
    },
    Type: function (newVal) {
      this.init(this.Code, newVal);
    },
  },

  methods: {
    async init($Code, $Type) {
      this.movies = [];
      this.showMovies = false;
      this.numMovies = null;

      this.numMovies = await store.db.fireProcedureReturnScalar(
        `
        SELECT COUNT(1) FROM
        (
          SELECT DISTINCT
            MOV.Name || ' ' || IFNULL(MOV.startYear, 'xxx')
          FROM tbl_Movies MOV
          WHERE (MOV.id_Movies IN (SELECT id_Movies FROM tbl_Movies_Languages WHERE Type = $Type AND UPPER(Language) = $Code))
          AND (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
        )
      `,
        { $Code, $Type }
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
      const setFilter = {};

      if (this.Type === "audio") {
        setFilter.filterAudioLanguages = [
          helpers.uppercaseEachWord(this.Code.toLowerCase()),
        ];
      } else {
        setFilter.filterSubtitleLanguages = [
          helpers.uppercaseEachWord(this.Code.toLowerCase()),
        ];
      }

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

        const filters = {
          filterSettings: {},
        };

        if (this.Type === "audio") {
          filters.filterAudioLanguages = [
            {
              Language: "<none>",
              Selected: false,
            },
            {
              Language: helpers.uppercaseEachWord(this.Code.toLowerCase()),
              Selected: true,
            },
          ];
        } else {
          filters.filterSubtitleLanguages = [
            {
              Language: "<none>",
              Selected: false,
            },
            {
              Language: helpers.uppercaseEachWord(this.Code.toLowerCase()),
              Selected: true,
            },
          ];
        }

        logger.log("[toggleShowMovies] filters:", filters);

        const movies = (
          await store.fetchMedia("movies", null, true, this.$t, filters)
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
