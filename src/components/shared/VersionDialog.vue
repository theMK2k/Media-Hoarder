<template>
  <v-dialog v-model="show" persistent max-width="1000px">
    <v-card>
      <v-card-title>
        <div class="headline" style="width: 100%; font-size: 1.17em">Version Dialog</div>
      </v-card-title>

      <v-alert
        type="warning"
        colored-border
        border="left"
        v-if="moviesSourcePaths.length == 0"
      >A new version is available</v-alert>

      <v-card-actions>
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

import * as store from "@/store";

// import { eventBus } from "@/main";

export default {
  props: ["show"],

  data() {
    return {
      versionInfo: ""
    };
  },

  methods: {},

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
