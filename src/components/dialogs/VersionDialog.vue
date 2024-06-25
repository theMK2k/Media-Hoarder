<template>
  <v-dialog v-model="show" persistent max-width="1000px" transition="fab-transition" scrollable>
    <v-card>
      <v-card-title>
        <v-row class="headline" style="width: 100%; font-size: 1.17em; margin-left: 0px">
          <div class="headline mk-clickable" v-on:click="showQuote = !showQuote">
            {{ $shared.appName }} v{{ $shared.currentVersion }} -
            {{ $shared.currentName }}
          </div>
          <v-spacer></v-spacer>

          <v-btn text v-on:click="$emit('close')">{{ $t("Close") }}</v-btn>
        </v-row>

        <v-row
          v-if="showQuote"
          class="mk-clickable-dark-grey"
          style="line-height: 1.5; margin-left: 0px; margin-bottom: 0px; word-break: initial"
          v-on:click="showQuote = false"
        >
          <i>{{ quote }}</i>
          <br />
          -- {{ quoteSource }}
        </v-row>

        <div class="v-card__text" style="padding: 0px">
          <div v-if="isLoadingHistory" style="margin-bottom: 16px">
            {{ $t("Checking for Updates") }}
            <v-progress-linear color="red accent-0" indeterminate rounded height="6"></v-progress-linear>
          </div>

          <v-alert
            v-if="!isLoadingHistory"
            v-bind:type="isNewVersionAvailable ? 'info' : isUpToDate ? 'success' : 'warning'"
            colored-border
            border="left"
            dense
            style="margin-top: 12px"
          >
            <span v-if="isNewVersionAvailable">
              <strong>{{ `${$shared.appName} v${latestVersion} - ${latestName}` }}</strong>
              {{
                $t("is available_ Get it at", {
                  appName: $shared.appName,
                  latestVersion: latestVersion,
                  latestName: latestName,
                })
              }}
              <a v-bind:href="downloadURL" target="_blank" rel="noreferrer noopener nofollow">{{ downloadURL }}</a>
            </span>
            <span v-if="isUpToDate">{{ $t("you are up to date") }}</span>
            <span v-if="!isNewVersionAvailable && !isUpToDate">{{
              $t("unable to determine if you are up to date")
            }}</span>
          </v-alert>

          <div class="mk-light-grey">
            {{ $t("Visit") }}
            <a href="https://media.hoarder.software" target="_blank" rel="noreferrer noopener nofollow"
              >https://media.hoarder.software</a
            >
            {{ $t("for a better features overview_") }}
          </div>

          <div v-if="history && history.length > 0" style="font-size: 16px; margin-top: 16px">
            <span
              v-if="!showHistory"
              class="mk-clickable"
              v-on:click="showHistory = !showHistory"
              style="font-size: 1.17em"
              >{{ $t("Show Version History") }}</span
            >
            <span
              v-if="showHistory"
              class="mk-clickable"
              v-on:click="showHistory = !showHistory"
              style="font-size: 1.17em"
              >{{ $t("Version History") }}</span
            >
            <span v-if="showHistory">
              <v-btn
                v-if="showHistory"
                text
                class="xs-fullwidth"
                style="margin-right: 8px"
                v-bind:disabled="infoPosition + 1 >= history.length"
                v-on:click="infoPosition++"
                >&lt;</v-btn
              >
              v{{ history[infoPosition].version }} -
              {{ history[infoPosition].name }}
              <v-btn text class="xs-fullwidth" v-bind:disabled="infoPosition === 0" v-on:click="infoPosition--"
                >&gt;</v-btn
              >
            </span>
          </div>

          <div v-if="isLoadingVersionInfo" style="margin-left: 24px; margin-right: 24px; margin-bottom: 16px">
            <v-progress-linear color="red accent-0" indeterminate rounded height="6"></v-progress-linear>
          </div>
        </div>
      </v-card-title>

      <v-card-text v-if="!isLoadingVersionInfo && showHistory">
        <div v-html="versionInfo"></div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
// import Vue from "vue";
// import router from "@/router"; // workaround in order to access router.app.$t
// import * as marked from "marked";
import { marked } from "marked";

const logger = require("../../helpers/logger");
const semver = require("semver");

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

      showHistory: false,
      history: [],
      latestVersion: null,
      latestName: null,

      infoPosition: 0,
    };
  },

  computed: {
    downloadURL() {
      return process.env.VUE_APP_DOWNLOAD_URL || "https://media.hoarder.software/downloads";
    },
  },

  watch: {
    infoPosition: function (newValue) {
      this.updateVersionInfo(newValue);
    },
  },

  methods: {
    async updateVersionInfo(infoPosition) {
      logger.log("[updateVersionInfo] START");

      this.versionInfo = null;

      this.isLoadingVersionInfo = true;

      const fileName = this.history[infoPosition].description;

      try {
        logger.log("[updateVersionInfo] loadLocalHistory fileName:", fileName);

        const localVersionInfo = await store.loadLocalHistory(fileName);

        if (localVersionInfo) {
          const localVersionInfoMD = localVersionInfo.toString();

          logger.log("[updateVersionInfo] loadLocalHistory localVersionInfoMD:", localVersionInfoMD);

          this.versionInfo = marked(localVersionInfoMD);
          logger.log("[updateVersionInfo] this.versionInfo:", this.versionInfo);
        } else {
          logger.log("[updateVersionInfo] loadLocalHistory NO localVersionInfo found!");
        }
      } catch (e) {
        logger.error(e);
      }

      if (!this.versionInfo) {
        try {
          logger.log("[updateVersionInfo] fetchRemoteHistory");

          const resRemoteVersionInfo = await fetch(
            `${
              process.env.VUE_APP_HISTORY_BASE_URL ||
              "https://raw.githubusercontent.com/theMK2k/Media-Hoarder/master/public/history"
            }/${fileName}`
          );

          const remoteVersionInfo = await resRemoteVersionInfo.text();

          const remoteVersionInfoText = remoteVersionInfo.toString();

          logger.log("[updateVersionInfo] fetchRemoteHistory remoteVersionInfoText:", remoteVersionInfoText);

          this.versionInfo = marked(remoteVersionInfo);
        } catch (e) {
          logger.error(e);
        }
      }

      this.isLoadingVersionInfo = false;
    },

    async checkVersion() {
      logger.log("[checkVersion] START");

      this.isLoadingHistory = true;

      try {
        const localVersionInfo = await store.loadLocalHistory("history.json");

        const objLocalHistory = JSON.parse(localVersionInfo);

        logger.log("[checkVersion] objLocalHistory:", objLocalHistory);

        this.history = objLocalHistory;
        this.$shared.currentVersion = objLocalHistory[0].version;
        this.$shared.currentName = objLocalHistory[0].name;
        this.quote = objLocalHistory[0].quote;
        this.quoteSource = objLocalHistory[0].quoteSource;

        const resRemoteHistory = await fetch(
          `${
            process.env.VUE_APP_HISTORY_BASE_URL ||
            "https://raw.githubusercontent.com/theMK2k/Media-Hoarder/master/public/history"
          }/history.json`
        );

        const remoteHistory = await resRemoteHistory.json();

        logger.log("[checkVersion] remoteHistory:", remoteHistory);

        this.latestVersion = remoteHistory[0].version;
        this.latestName = remoteHistory[0].name;

        if (semver.gt(this.latestVersion, this.$shared.currentVersion)) {
          this.history = remoteHistory;
          this.isNewVersionAvailable = true;
          this.showHistory = true;
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
  created() {
    // add target="_blank" to external links so that they are opened with the browser and not the app itself (see also background.js Ctrl+F "win.webContents")
    const renderer = new marked.Renderer();
    const linkRenderer = renderer.link;
    renderer.link = (href, title, text) => {
      const localLink = href.startsWith(`${location.protocol}//${location.hostname}`);
      const html = linkRenderer.call(renderer, href, title, text);
      return localLink ? html : html.replace(/^<a /, `<a target="_blank" rel="noreferrer noopener nofollow" `);
    };

    // insert a blank line after (un)ordered lists
    const listRenderer = renderer.list;
    renderer.list = (body, ordered, start) => {
      const html = listRenderer.call(renderer, body, ordered, start);
      return html.replace(/<\/ul>/, `</ul><p />`).replace(/<\/ol>/, `</ol><p />`);
    };

    const headingRenderer = renderer.heading;
    renderer.heading = (text, level, raw, slugger) => {
      // remove level 1 header (this is already part of blog-articles.json)
      if (level === 1) {
        return "";
      }

      // don't render "##" as <h2>, instead render it as <h3>
      if (level === 2) {
        return headingRenderer.call(renderer, text, 3, raw, slugger);
      }

      return headingRenderer.call(renderer, text, level, raw, slugger);
    };

    marked.setOptions({
      renderer: renderer,
    });
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
