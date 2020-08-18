<template>
  <v-dialog v-model="show" persistent max-width="1000px" transition="fab-transition">
    <v-card style="min-height: 500px">
      <v-card-title>
        <v-row class="headline" style="width: 100%; font-size: 1.17em">
          {{$shared.appName}} {{currentVersion}}
          <v-spacer></v-spacer>

          <v-btn text v-on:click="$emit('close')">{{$t('Close')}}</v-btn>
        </v-row>
      </v-card-title>

      <div
        v-if="isLoadingHistory"
        style="margin-left: 24px; margin-right:24px; margin-bottom: 16px"
      >
        {{$t('Checking for Updates')}}
        <v-progress-linear color="red accent-0" indeterminate rounded height="6"></v-progress-linear>
      </div>

      <v-alert
        v-if="!isLoadingHistory"
        v-bind:type="isNewVersionAvailable ? 'info' : (isUpToDate ? 'success' : 'warning')"
        colored-border
        border="left"
        style="margin-left: 24px"
        dense
      >
        <span v-if="isNewVersionAvailable">
          {{$t('Version {latestVersion} is available - get it at', {latestVersion: latestVersion})}}
          <a
            v-on:click.stop="openLink('https://github.com/theMK2k/Media-Hoarder/releases')"
          >https://github.com/theMK2k/Media-Hoarder/releases</a>
        </span>
        <span v-if="isUpToDate">{{$t('you are up to date')}}</span>
        <span
          v-if="!isNewVersionAvailable && !isUpToDate"
        >{{$t('unable to determine if you are up to date')}}</span>
      </v-alert>

      <div style="margin-left: 24px">
        {{$t('Visit')}}
        <a v-on:click.stop="openLink('https://media.hoarder.software')">https://media.hoarder.software</a> {{$t('for a better features overview_')}}
      </div>

      <v-card-actions style="margin-left: 16px" v-if="history && history.length > 0">
        {{$t('Version History')}}
        
        <v-btn
          text
          class="xs-fullwidth"
          style="margin-right: 8px"
          v-bind:disabled="infoPosition + 1 >= history.length"
          v-on:click="infoPosition++"
        >&lt;</v-btn>
        {{history[infoPosition].version}}
        <v-btn
          text
          class="xs-fullwidth"
          v-bind:disabled="infoPosition === 0"
          v-on:click="infoPosition--"
        >&gt;</v-btn>
      </v-card-actions>

      <div
        v-if="isLoadingVersionInfo"
        style="margin-left: 24px; margin-right:24px; margin-bottom: 16px"
      >
        <v-progress-linear color="red accent-0" indeterminate rounded height="6"></v-progress-linear>
      </div>

      <v-card-text v-if="!isLoadingVersionInfo" style="color: white">
        <div v-html="versionInfo"></div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
// import Vue from "vue";
// import router from "@/router"; // workaround in order to access router.app.$t
const logger = require("loglevel");
const { shell } = require("electron").remote;

import * as store from "@/store";

// import { eventBus } from "@/main";

export default {
  props: ["show"],

  data() {
    return {
      versionInfo: "",
      isNewVersionAvailable: false,
      isUpToDate: false,
      isLoadingHistory: false,
      isLoadingVersionInfo: false,

      history: [],
      currentVersion: null,
      latestVersion: null,

      infoPosition: 0
    };
  },

  watch: {
    infoPosition: function(newValue) {
      this.updateVersionInfo(newValue);
    }
  },

  methods: {
    openLink(link) {
      shell.openExternal(link);
    },

    async updateVersionInfo(infoPosition) {
      logger.log("VersionDialog updateVersionInfo START");

      this.versionInfo = null;

      this.isLoadingVersionInfo = true;

      const fileName = this.history[infoPosition].description;

      try {
        logger.log(
          "VersionDialog updateVersionInfo loadLocalHistory fileName:",
          fileName
        );

        const localVersionInfo = await store.loadLocalHistory(fileName);

        if (localVersionInfo) {
          const localVersionInfoText = localVersionInfo.toString();

          logger.log(
            "VersionDialog updateVersionInfo loadLocalHistory localVersionInfoText:",
            localVersionInfoText
          );
          this.versionInfo = localVersionInfoText;
        } else {
          logger.log(
            "VersionDialog updateVersionInfo loadLocalHistory NO localVersionInfo found!"
          );
        }
      } catch (e) {
        logger.log(e);
      }

      if (!this.versionInfo) {
        try {
          logger.log("VersionDialog updateVersionInfo fetchRemoteHistory");

          const resRemoteVersionInfo = await fetch(
            `https://raw.githubusercontent.com/theMK2k/Media-Hoarder/master/public/history/${fileName}`
          );

          const remoteVersionInfo = await resRemoteVersionInfo.text();

          const remoteVersionInfoText = remoteVersionInfo.toString();

          logger.log(
            "VersionDialog updateVersionInfo fetchRemoteHistory remoteVersionInfoText:",
            remoteVersionInfoText
          );

          this.versionInfo = remoteVersionInfo;
        } catch (e) {
          logger.log(e);
        }
      }

      this.isLoadingVersionInfo = false;
    },

    async checkVersion() {
      logger.log("VersionDialog checkVersion START");

      this.isLoadingHistory = true;

      try {
        const localVersionInfo = await store.loadLocalHistory("history.json");

        const objLocalHistory = JSON.parse(localVersionInfo);

        logger.log(
          "VersionDialog checkVersion objLocalHistory:",
          objLocalHistory
        );

        this.history = objLocalHistory;
        this.currentVersion = objLocalHistory[0].version;

        const resRemoteHistory = await fetch(
          "https://raw.githubusercontent.com/theMK2k/Media-Hoarder/master/public/history/history.json"
        );

        const remoteHistory = await resRemoteHistory.json();

        logger.log("VersionDialog checkVersion remoteHistory:", remoteHistory);

        this.history = remoteHistory;
        this.latestVersion = remoteHistory[0].version;

        if (this.currentVersion === this.latestVersion) {
          this.isUpToDate = true;
        } else {
          this.isNewVersionAvailable = true;
        }

        this.updateVersionInfo(0);
      } catch (e) {
        logger.error(e);
      } finally {
        this.isLoadingHistory = false;
      }
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
