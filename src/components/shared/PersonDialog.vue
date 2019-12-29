<template>
  <v-dialog v-model="show" persistent max-width="1000px">
    <v-card dark flat v-bind:ripple="false">
      <v-list-item three-line style="padding-left: 0px">
        <div>
          <!-- <v-skeleton-loader
            v-if="isScraping"
            ref="skeleton"
            type="avatar"
            tile
            class="mx-auto"
            style="margin: 6px; height: 150px; width: 120px"
          ></v-skeleton-loader>-->

          <v-list-item-avatar tile style="margin: 6px; height: 150px; width: 120px">
            <!-- v-if="!isScraping" -->
            <v-img
              v-if="personData.Photo_URL"
              contain
              v-bind:src="personData.Photo_URL"
              style="border-radius: 6px;"
            ></v-img>
          </v-list-item-avatar>
        </div>
        <v-list-item-content class="align-self-start" style="padding-top: 6px; padding-bottom: 6px">
          <v-col style="padding: 0px!important" sm="12">
            <v-row>
              <div style="margin-left: 16px">
                <v-list-item-title class="headline mb-2" style="margin-bottom: 0px!important">
                  {{ Person_Name }}
                  <span v-if="isScraping">(loading, please wait...)</span>
                </v-list-item-title>
              </div>
            </v-row>

            <v-row style="margin-left: 4px; margin-right: 6px; margin-bottom: 8px">
              <div
                v-if="!showLongBio"
                style="font-size: .875rem; font-weight: normal"
                class="Clickable"
                v-on:click.stop="showLongBio = true"
              >{{ personData.ShortBio }}</div>
              <div
                v-if="showLongBio"
                style="font-size: .875rem; font-weight: normal"
                class="Clickable"
                v-on:click.stop="showLongBio = false"
              >
                <p
                  v-for="(line, index) in personData.LongBio.split('\n')"
                  v-bind:key="index"
                >{{line}}</p>
              </div>
            </v-row>
          </v-col>
        </v-list-item-content>
      </v-list-item>
      <v-col sm="12">
        <v-row style="margin-top: 8px">
          <v-btn
            class="xs-fullwidth"
            color="secondary"
            v-on:click.native="onCloseClick"
            style="margin-left: 8px;"
          >Close</v-btn>
          <v-btn
            class="xs-fullwidth"
            color="primary"
            v-on:click.stop="openIMDB()"
            style="margin-left: 8px;"
          >Open IMDB</v-btn>
          <v-btn
            class="xs-fullwidth"
            color="primary"
            v-on:click.native="onFilterClick"
            style="margin-left: 8px;"
          >Filter by this person</v-btn>
        </v-row>
      </v-col>
    </v-card>
  </v-dialog>
</template>

<script>
import * as store from "@/store";
import * as helpers from "@/helpers/helpers";
const logger = require("loglevel");

const { shell } = require("electron").remote;

import { eventBus } from "@/main";

export default {
  props: ["show", "IMDB_Person_ID", "Person_Name"],

  data() {
    return {
      isScraping: false,
      personData: {},
      showLongBio: false
    };
  },

  watch: {
    IMDB_Person_ID: function(newVal) {
      this.init(newVal);
    }
  },

  methods: {
    onButtonClick(eventName) {
      this.$emit(eventName, {
        dontAskAgain: this.dontAskAgainValue,
        textValue: this.textValueLocal
      });

      this.resetData();
    },

    async scrapeData() {
      logger.log("PersonDialog SCRAPE!");
      this.isScraping = true;

      try {
        const personData = await store.scrapeIMDBPersonData(
          this.IMDB_Person_ID
        );

        logger.log("scraped personData:", personData);

        this.personData = {
          IMDB_Person_ID: personData.$IMDB_Person_ID,
          Photo_URL: personData.$Photo_URL
            ? 'file://' + helpers.getPath(personData.$Photo_URL)
            : personData.$Photo_URL,
          ShortBio: personData.$ShortBio,
          LongBio: personData.$LongBio
        };

        logger.log("this.personData:", this.personData);
      } catch (err) {
        logger.log(err);
        eventBus.showSnackbar("error", err);
      }

      this.isScraping = false;
    },

    async init(IMDB_Person_ID) {
      logger.log("PersonDialog INIT!");
      this.personData = {};
      this.showLongBio = false;

      let personData = await store.fetchIMDBPerson(IMDB_Person_ID);

      logger.log("fetched personData:", personData);

      if (!personData || personData.length === 0) {
        await this.scrapeData();
        return;
      }

      personData = personData[0];

      personData.Photo_URL = personData.Photo_URL
        ? 'file://' + helpers.getPath(personData.Photo_URL)
        : personData.Photo_URL;

      this.personData = personData;

      logger.log("this.personData:", this.personData);
    },

    onCloseClick() {
      this.$emit("close");
    },

    async onFilterClick() {
      await store.addFilterPerson(this.IMDB_Person_ID, this.Person_Name);

      eventBus.personDialogConfirm(setFilter);

      const setFilter = {
        filterPersons: [this.IMDB_Person_ID]
      };

      eventBus.refetchFilters(setFilter);

      this.$emit("close");
    },

    openIMDB() {
      shell.openExternal(`https://www.imdb.com/name/${this.IMDB_Person_ID}/`);
    }
  },

  // ### Lifecycle Hooks ###
  created() {}
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
