<template>
  <v-dialog
    :model-value="show"
    @update:model-value="$emit('update:show', $event)"
    persistent
    max-width="1000px"
    scrollable
  >
    <v-card style="min-height: 500px">
      <v-card-title>
        <v-row class="headline" style="width: 100%; font-size: 1.17em">
          {{ $t("IMDB Scraper Check") }}
          <v-spacer></v-spacer>

          <v-btn variant="text" v-on:click="onRunChecksPressed" v-bind:loading="isRunning" v-if="!settings">{{
            $t("Run Checks")
          }}</v-btn>
          <v-btn variant="text" v-if="!settings" v-bind:disabled="isRunning" v-on:click="$emit('close')">{{ $t("Close") }}</v-btn>
        </v-row>
      </v-card-title>

      <v-card-text>
        <div style="margin-top: 12px; margin-bottom: 12px">
          {{
            $t(
              "The imdb_com web scraper is tested using a test-set of example data_ This way we can assure that the data from imdb_com will be correctly scraped_"
            )
          }}
        </div>
        <v-row v-for="check in imdbScraperChecksFiltered" v-bind:key="check.key" style="align-items: center">
          <v-btn
            class="ma-2"
            v-bind:ripple="false"
            variant="text"
            v-bind:loading="check.isRunning"
            icon
            v-bind:color="check.color || 'blue lighten-2'"
            style="margin: 4px 8px 4px 8px !important; cursor: default"
          >
            <v-icon>{{ check.icon }}</v-icon>
          </v-btn>
          <span style="color: white">{{ $t(check.description) }}</span>
          <div v-if="check.result && check.result.log">
            <li v-for="(logEntry, index) in check.result.log" v-bind:key="index" style="margin-left: 52px">
              {{ logEntry }}
            </li>
          </div>
        </v-row>

        <div v-if="!isRunning" style="margin-left: -14px">
          <v-alert type="success" colored-border border="start" v-if="checkResult === 0">{{
            $t("All checks successful!")
          }}</v-alert>
          <v-alert type="warning" colored-border border="start" v-if="checkResult === 1">{{
            $t("Checks with warning detected!")
          }}</v-alert>
          <v-alert type="error" colored-border border="start" v-if="checkResult === 2">{{
            $t("Checks with error detected!")
          }}</v-alert>
          <v-alert type="error" colored-border border="start" v-if="checkResult === 3">{{
            $t("Checks with exceptions detected!")
          }}</v-alert>
        </div>
      </v-card-text>

      <v-card-actions v-if="settings && !isRunning">
        <v-btn variant="text" v-on:click="$emit('close')">{{ $t("Cancel") }}</v-btn>
        <v-btn variant="text" v-on:click="$emit('ok')">{{ okButtonText }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
// import Vue from "vue";
// import router from "@/router"; // workaround in order to access router.app.$t

import logger from "@helpers/logger.js";
import * as imdbScraperTests from "@/tests/imdb-scraper-tests.js";

// import * as store from "@/store.js";

// import { eventBus } from "@/main";

export default {
  props: ["show"],

  emits: ["update:show", "close", "ok"],

  data() {
    return {
      settings: null,
      isRunning: false,
      okButtonText: null,
      checkResult: null,
    };
  },

  computed: {
    imdbScraperChecksFiltered() {
      return this.$shared.imdbScraperChecks.filter((check) => check.enabled);
    },
  },

  methods: {
    init(settings) {
      this.settings = settings;
      this.isRunning = false;
      this.okButtonText = this.$t("OK");
      this.checkResult = null;

      this.$shared.imdbScraperChecks.forEach((check) => {
        check.enabled = this.settings
          ? check.alwaysEnabled ||
            this.settings.userScanOptions.find(
              (userScanOption) => userScanOption.key === check.key && userScanOption.enabled
            )
          : true;
        check.icon = null;
        check.color = null;
        check.isRunning = false;
        check.result = null;
      });

      if (this.settings && !this.isRunning) {
        this.runChecks();
      }
    },

    onRunChecksPressed() {
      this.init(this.settings);
      this.runChecks();
    },

    async runChecks() {
      this.isRunning = true;

      // for (let i = 0; i < this.imdbScraperChecksFiltered.length; i++) {
      for (const check of this.imdbScraperChecksFiltered) {
        check.isRunning = true;

        let result = null;
        for (const checkFunction of check.checkFunctions) {
          result = await checkFunction();

          if (result.status !== imdbScraperTests.status.SUCCESS) {
            break;
          }
        }
        check.result = result;

        logger.log("[runChecks] check result:", check.result);

        if (check.result.status === imdbScraperTests.status.SUCCESS) {
          check.color = "green";
          check.icon = "mdi-check-circle-outline";

          if (!this.checkResult) {
            this.checkResult = imdbScraperTests.status.SUCCESS;
            this.okButtonText = this.$t("OK - Scan Media Now");
          }
        }
        if (check.result.status === imdbScraperTests.status.WARNING) {
          check.color = "yellow";
          check.icon = "mdi-alert-circle-outline";

          if (this.checkResult !== imdbScraperTests.status.ERROR) {
            this.checkResult = imdbScraperTests.status.WARNING;
            this.okButtonText = this.$t("Ignore Warning - Scan Media Now");
          }
        }
        if (check.result.status === imdbScraperTests.status.ERROR) {
          check.color = "red";
          check.icon = "mdi-alert-circle-outline";

          this.checkResult = imdbScraperTests.status.ERROR;
          this.okButtonText = this.$t("Ignore Error - Scan Media Now");
        }
        if (check.result.status === imdbScraperTests.status.EXCEPTION) {
          check.color = "red";
          check.icon = "mdi-alert-circle-outline";

          this.checkResult = imdbScraperTests.status.EXCEPTION;
          this.okButtonText = this.$t("Ignore Exception - Scan Media Now");
        }

        check.isRunning = false;
      }

      this.isRunning = false;
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
