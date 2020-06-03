<template>
  <v-dialog v-model="show" persistent max-width="1000px">
    <v-card style="min-height: 500px">
      <v-card-title>
        <v-row class="headline" style="width: 100%; font-size: 1.17em">
          IMDB Scraper Check
          <v-spacer></v-spacer>

          <v-btn text v-on:click="runChecks"
            v-bind:loading="isRunning"
            v-if="!settings"
          >
            Run Checks
          </v-btn>
          <v-btn text v-on:click="$emit('close')">Close</v-btn>
        </v-row>
      </v-card-title>

      <v-card-text>
        <v-row
          v-for="check in imdbScraperChecksFiltered"
          v-bind:key="check.key"
          class="Clickable"
          style="align-items: center"
        >
          <v-btn
            class="ma-2"
            text
            v-bind:loading="check.isRunning"
            icon
            v-bind:color="check.color || 'blue lighten-2'"
          >
            <v-icon>{{check.icon}}</v-icon>
          </v-btn>
          {{check.description}}
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
// import Vue from "vue";
// import router from "@/router"; // workaround in order to access router.app.$t

const logger = require("loglevel");
// const { shell } = require("electron").remote;

const imdbScraperTests = require('@/imdb-scraper-tests');

// import * as store from "@/store";

// import { eventBus } from "@/main";

export default {
  props: ["show"],

  data() {
    return {
      settings: null,
      isRunning: false
    };
  },

  computed: {
    imdbScraperChecksFiltered() {
      return this.$shared.imdbScraperChecks.filter(check => check.enabled);
    }
  },

  methods: {
    init(settings) {
      this.settings = settings;
      this.isRunning = false;

      this.$shared.imdbScraperChecks.forEach(check => {
        check.enabled = true;
        check.icon = null;
        check.color = null;
        check.isRunning = false;
        check.result = null;
      });

      // TODO: set enabled = false if settings are available
    },

    async runChecks() {
      this.init(this.settings);
      
      this.isRunning = true;

      for (let i = 0; i < this.imdbScraperChecksFiltered.length; i++) {
        const check = this.imdbScraperChecksFiltered[i];
        
        check.isRunning = true;
        
        check.result = await check.checkFunction();

        logger.log('check result:', check.result);

        if (check.result.status === imdbScraperTests.status.SUCCESS) {
          check.color = 'green';
          check.icon = 'mdi-check-circle-outline';
        }
        if (check.result.status === imdbScraperTests.status.WARNING) {
          check.color = 'yellow';
          check.icon = 'mdi-alert-circle-outline';
        }
        if (check.result.status === imdbScraperTests.status.ERROR) {
          check.color = 'red';
          check.icon = 'mdi-close-circle-outline';
        }

        check.isRunning = false;
      }

      this.isRunning = false;
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
