<template>
  <v-dialog v-model="show" persistent max-width="1000px">
    <v-card>
      <v-card-title>
        <div class="headline" style="width: 100%; font-size: 1.17em">Welcome!</div>
      </v-card-title>

      <div v-if="isLoadingHistory" style="margin-left: 24px; margin-right:24px; margin-bottom: 16px">
        Loading your version info
        <v-progress-linear color="red accent-0" indeterminate rounded height="6"></v-progress-linear>
      </div>
      
      <div
        v-if="!isLoadingHistory"
      >

      </div>

      <v-alert
        v-bind:type="showNewVersionInfo ? 'info' : 'success'"
        colored-border
        border="left"
        style="margin-left: 24px"
      >
        Your current version is {{"v6.66"}} -
        <span v-if="showNewVersionInfo">
          A new version is available - get it at
          <a
            v-on:click.stop="openLink('https://github.com/theMK2k/MediaBox/releases')"
          >https://github.com/theMK2k/MediaBox/releases</a>
        </span>
        <span v-if="!showNewVersionInfo">you are up to date</span>
      </v-alert>

      <div style="margin-left: 24px">
        Visit
        <a>todo-website.net</a> for a better overview.
      </div>

      <v-card-actions style="margin-left: 16px">
        <v-btn class="xs-fullwidth" v-bind:color="cancelColor" style="margin-right: 8px">&lt;</v-btn>version 1.0
        <v-btn class="xs-fullwidth" v-bind:color="cancelColor">&gt;</v-btn>
      </v-card-actions>

      <v-card-text style="color: white">
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
      showNewVersionInfo: true,
      isLoadingHistory: true
    };
  },

  methods: {
    openLink(link) {
      shell.openExternal(link);
    },

    checkVersion() {
      // load local history.json
      // fetch remote history.json
      // compare them and set showNewVersionInfo accordingly
      // if available use remote history.json for navigation
    }
  },

  // ### Lifecycle Hooks ###
  created() {
    (async () => {
      this.versionInfo = await store.loadVersionInfo("version-0.9.html");
    })();
  }
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
