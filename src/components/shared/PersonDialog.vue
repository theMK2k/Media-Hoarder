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
        {{ Person_Name }}
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
          <div>
            <v-list-item-avatar
              tile
              style="margin: 6px; height: 150px; width: 120px"
            >
              <!-- v-if="!isScraping" -->
              <v-img
                v-if="personData.Photo_URL"
                contain
                v-bind:src="personData.Photo_URL"
                style="border-radius: 6px"
              ></v-img>
              <v-icon
                v-if="!personData.Photo_URL && !isScraping"
                disabled
                x-large
                loading
              >
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
          <v-list-item-content
            class="align-self-start"
            style="padding-top: 6px; padding-bottom: 6px"
          >
            <v-col style="padding: 0px !important" sm="12">
              <v-row style="margin: 0px 6px 8px 4px">
                <div
                  v-if="!showLongBio"
                  style="font-size: 0.875rem; font-weight: normal"
                  class="mk-clickable"
                  v-on:click.stop="showLongBio = true"
                >
                  {{ personData.ShortBio }}
                </div>
                <div
                  v-if="showLongBio"
                  style="font-size: 0.875rem; font-weight: normal"
                  class="mk-clickable-white"
                  v-on:click.stop="showLongBio = false"
                >
                  <p
                    v-for="(line, index) in personData.LongBio.split('\n')"
                    v-bind:key="index"
                  >
                    {{ line }}
                  </p>
                </div>
              </v-row>
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
                        margin-top: 8px;
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
      </v-card-text>

      <v-card-actions>
        <v-col sm="12">
          <v-row style="margin-top: 8px">
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
              {{ $t("Filter by this person") }}
            </v-btn>
          </v-row>
        </v-col>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import * as store from "@/store";
import * as helpers from "@/helpers/helpers";
import { scrapeIMDBPersonData } from "@/imdb-scraper";
const logger = require("../../helpers/logger");

const { shell } = require("@electron/remote");

import { eventBus } from "@/main";

export default {
  props: ["show", "IMDB_Person_ID", "Person_Name"],

  data() {
    return {
      isScraping: false,
      personData: {},
      showLongBio: false,
      numMovies: null,
      isLoadingMovies: false,
      movies: [],
      showMovies: false,
    };
  },

  watch: {
    IMDB_Person_ID: function (newVal) {
      this.init(newVal);
    },
  },

  methods: {
    onButtonClick(eventName) {
      this.$emit(eventName, {
        dontAskAgain: this.dontAskAgainValue,
        textValue: this.textValueLocal,
      });

      this.resetData();
    },

    async scrapeData() {
      logger.log("[scrapeData] START");
      this.isScraping = true;

      try {
        const personData = await scrapeIMDBPersonData(
          this.IMDB_Person_ID,
          helpers.downloadFile
        );

        store.saveIMDBPersonData(personData);

        logger.log("[scrapeData] personData:", personData);

        this.personData = {
          IMDB_Person_ID: personData.$IMDB_Person_ID,
          Photo_URL: personData.$Photo_URL
            ? "local-resource://" +
              helpers.getDataPath(personData.$Photo_URL).replace(/\\/g, "\\\\")
            : personData.$Photo_URL,
          ShortBio: personData.$ShortBio,
          LongBio: personData.$LongBio,
        };

        logger.log("[scrapeData] this.personData:", this.personData);
      } catch (err) {
        logger.log(err);
        eventBus.showSnackbar("error", err);
      }

      this.isScraping = false;
    },

    async init($IMDB_Person_ID) {
      logger.log("[init] START");

      this.personData = {};
      this.showLongBio = false;
      this.movies = [];
      this.showMovies = false;
      this.numMovies = null;

      this.numMovies = await store.db.fireProcedureReturnScalar(
        `
          SELECT COUNT(1) FROM
          (
            SELECT DISTINCT
              MOV.Name || ' ' || IFNULL(MOV.startYear, 'xxx')
            FROM tbl_Movies_IMDB_Credits MC
            INNER JOIN tbl_Movies MOV ON MC.id_Movies = MOV.id_Movies
            WHERE MC.IMDB_Person_ID = $IMDB_Person_ID
                  AND (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
          )
      `,
        { $IMDB_Person_ID }
      );

      let personData = await store.fetchIMDBPerson($IMDB_Person_ID);

      logger.log("[init] fetched personData:", personData);

      if (!personData || personData.length === 0) {
        await this.scrapeData();
        return;
      }

      personData = personData[0];

      personData.Photo_URL = personData.Photo_URL
        ? "local-resource://" +
          helpers.getDataPath(personData.Photo_URL).replace(/\\/g, "\\\\")
        : null;

      this.personData = personData;

      logger.log("[init] this.personData:", this.personData);
    },

    onCloseClick() {
      this.$emit("close");
    },

    async onFilterClick() {
      await store.addFilterPerson(this.IMDB_Person_ID, this.Person_Name);

      const setFilter = {
        filterPersons: [this.IMDB_Person_ID],
      };

      eventBus.personDialogConfirm(setFilter);

      eventBus.refetchSpecificFilter(setFilter);

      this.$emit("close");
    },

    openIMDB() {
      shell.openExternal(`https://www.imdb.com/name/${this.IMDB_Person_ID}/`);
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
            filterPersons: [
              {
                id_Filter_Persons: 0,
                Selected: false,
              },
              {
                id_Filter_Persons: 666,
                Selected: true,
                IMDB_Person_ID: this.IMDB_Person_ID,
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
