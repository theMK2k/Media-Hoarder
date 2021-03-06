<template>
  <v-dialog v-model="show" persistent max-width="1000px" transition="fab-transition" scrollable>
    <v-card>
      <v-card-title>
        <v-row class="headline" style="width: 100%; font-size: 1.17em">
          <div
            class="headline mk-clickable"
            v-on:click="showQuote = !showQuote"
          >{{$shared.appName}} v{{$shared.currentVersion}} - {{$shared.currentName}}</div>
          <v-spacer></v-spacer>

          <v-btn text v-on:click="$emit('close')">{{$t('Close')}}</v-btn>
        </v-row>

        <v-row
          v-if="showQuote"
          class="mk-clickable-dark-grey"
          style="line-height: 1.5"
          v-on:click="showQuote = false"
        >
          <i>{{ quote }}</i>
          <br />
          -- {{ quoteSource }}
        </v-row>

        <div class="v-card__text" style="padding: 0px">
          <div v-if="isLoadingHistory" style="margin-bottom: 16px">
            {{$t('Checking for Updates')}}
            <v-progress-linear color="red accent-0" indeterminate rounded height="6"></v-progress-linear>
          </div>

          <v-alert
            v-if="!isLoadingHistory"
            v-bind:type="isNewVersionAvailable ? 'info' : (isUpToDate ? 'success' : 'warning')"
            colored-border
            border="left"
            dense
            style="margin-top: 8px"
          >
            <span v-if="isNewVersionAvailable">
              <strong>{{`${$shared.appName} v${latestVersion} - ${latestName}`}}</strong>
              {{$t('is available_ Get it at', {appName: $shared.appName, latestVersion: latestVersion, latestName: latestName})}}
              <a
                v-on:click.stop="openLink('https://github.com/theMK2k/Media-Hoarder/releases')"
              >https://github.com/theMK2k/Media-Hoarder/releases</a>
            </span>
            <span v-if="isUpToDate">{{$t('you are up to date')}}</span>
            <span
              v-if="!isNewVersionAvailable && !isUpToDate"
            >{{$t('unable to determine if you are up to date')}}</span>
          </v-alert>

          <div class="mk-light-grey">
            {{$t('Visit')}}
            <a
              v-on:click.stop="openLink('https://media.hoarder.software')"
            >https://media.hoarder.software</a>
            {{$t('for a better features overview_')}}
          </div>

          <div v-if="history && history.length > 0" style="font-size: 16px; margin-top: 16px">
            {{$t('Version History')}}
            <v-btn
              text
              class="xs-fullwidth"
              style="margin-right: 8px"
              v-bind:disabled="infoPosition + 1 >= history.length"
              v-on:click="infoPosition++"
            >&lt;</v-btn>
            v{{history[infoPosition].version}} - {{history[infoPosition].name}}
            <v-btn
              text
              class="xs-fullwidth"
              v-bind:disabled="infoPosition === 0"
              v-on:click="infoPosition--"
            >&gt;</v-btn>
          </div>

          <div
            v-if="isLoadingVersionInfo"
            style="margin-left: 24px; margin-right:24px; margin-bottom: 16px"
          >
            <v-progress-linear color="red accent-0" indeterminate rounded height="6"></v-progress-linear>
          </div>
        </div>
      </v-card-title>

      <v-card-text v-if="!isLoadingVersionInfo">
        <div v-html="versionInfo"></div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
// import Vue from "vue";
// import router from "@/router"; // workaround in order to access router.app.$t
import * as marked from "marked";

const logger = require("loglevel");
const semver = require("semver");
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

      showQuote: false,
      quote: null,
      quoteSource: null,

      history: [],
      latestVersion: null,
      latestName: null,

      infoPosition: 0,
    };
  },

  watch: {
    infoPosition: function (newValue) {
      this.updateVersionInfo(newValue);
    },
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
          const localVersionInfoMD = localVersionInfo.toString();

          logger.log(
            "VersionDialog updateVersionInfo loadLocalHistory localVersionInfoMD:",
            localVersionInfoMD
          );
          this.versionInfo = marked(localVersionInfoMD);
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
        this.$shared.currentVersion = objLocalHistory[0].version;
        this.$shared.currentName = objLocalHistory[0].name;
        this.quote = objLocalHistory[0].quote;
        this.quoteSource = objLocalHistory[0].quoteSource;

        const resRemoteHistory = await fetch(
          "https://raw.githubusercontent.com/theMK2k/Media-Hoarder/master/public/history/history.json"
        );

        const remoteHistory = await resRemoteHistory.json();

        logger.log("VersionDialog checkVersion remoteHistory:", remoteHistory);

        this.latestVersion = remoteHistory[0].version;
        this.latestName = remoteHistory[0].name;

        if (semver.gt(this.latestVersion, this.$shared.currentVersion)) {
          this.history = remoteHistory;
          this.isNewVersionAvailable = true;
        } else {
          this.isUpToDate = true;
        }

        this.updateVersionInfo(0);
      } catch (e) {
        logger.error(e);
      } finally {
        this.isLoadingHistory = false;
      }
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
