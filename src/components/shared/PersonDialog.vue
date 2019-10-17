<template>
  <v-dialog v-model="show" persistent max-width="1000px">
    <v-card dark flat hover v-bind:ripple="false">
      <v-list-item three-line style="padding-left: 0px">
        <div>
          <v-list-item-avatar tile style="margin: 6px; height: 150px; width: 120px">
            <v-img v-if="false" contain v-bind:src="null" style="border-radius: 6px;"></v-img>
          </v-list-item-avatar>
        </div>
        <v-list-item-content class="align-self-start" style="padding-top: 6px; padding-bottom: 6px">
          <v-col style="padding: 0px!important" sm="12">
            <v-row>
              <div style="margin-left: 16px">
                <v-list-item-title
                  class="headline mb-2"
                  style="margin-bottom: 0px!important"
                >{{ Person_Name }}</v-list-item-title>
              </div>

              <v-list-item-subtitle style="margin-left: 16px; margin-bottom: 4px">some subtitle</v-list-item-subtitle>
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
            v-on:click.native="onFilterClick"
            style="margin-left: 8px;"
          >Filter by this person</v-btn>
        </v-row>
      </v-col>
    </v-card>
  </v-dialog>
</template>

<script>
// import Vue from "vue";
// import router from "@/router"; // workaround in order to access router.app.$t
const logger = require("loglevel");

// import { eventBus } from "@/main";

export default {
  props: ["show", "IMDB_Person_ID", "Person_Name"],

  data() {
    return {
      isScraping: false
    };
  },

  methods: {
    resetData() {
      this.dontAskAgainValue = false;
      this.textValueLocal = null;
    },

    onButtonClick(eventName) {
      this.$emit(eventName, {
        dontAskAgain: this.dontAskAgainValue,
        textValue: this.textValueLocal
      });

      this.resetData();
    },

    async scrapeData() {
      // TODO: scrape from IMDB.com
      this.isScraping = true;

      this.isScraping = false;
    },

    init() {
      // TODO: fetch data for this person from DB
      // TODO: if no data available, try to scrape it
    },

    onCloseClick() {
      this.$emit("close");
    },

    onFilterClick() {
      this.$emit("filter");
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
