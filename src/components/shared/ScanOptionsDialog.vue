<template>
  <v-dialog
    v-model="show"
    persistent
    max-width="100%"
    v-on:keydown.escape="onCloseClick"
    v-on:keydown.enter="onOKClick"
  >
    <v-card dark flat v-bind:ripple="false">
      <v-card-title>
        <div class="headline" style="width: 100%; font-size: 1.17em">Scan Media</div>
      </v-card-title>
      <v-card-text>
        <v-alert
          type="warning"
          colored-border
          border="left"
          v-if="showMediaInfoWarning"
          dense
        >Warning: Mediainfo CLI Path is not set. Please go to <a v-on:click="openSettings">Settings</a> and provide one. You can get Mediainfo CLI from www.mediaarea.net</v-alert>

        <v-radio-group v-model="radioGroup">
          <v-radio label="Quick Scan" v-bind:value="1" color="dark-grey"></v-radio>
          <v-radio label="Complete Rescan" v-bind:value="2" color="dark-grey"></v-radio>
        </v-radio-group>

        <div v-if="radioGroup == 1">
          <ul>
            <li>Filescan in every Source Path</li>
            <li>If a file is missing, remove it from the collection</li>
            <li>If a new file is found, gather IMDB and mediainfo metadata</li>
            <li>If a file is already known, don't gather any metadata</li>
          </ul>
        </div>

        <div v-if="radioGroup == 2">
          <ul>
            <li>Filescan in every Source Path</li>
            <li>If a file is missing, remove it from the collection</li>
            <li>If a file is new or already known, gather IMDB and mediainfo metadata</li>
            <li>This can take a while depending on your collection and internet connection</li>
          </ul>
        </div>

        <v-expansion-panels accordion>
          <v-expansion-panel style="padding: 0px!important">
              <v-expansion-panel-header
                style="padding: 8px!important"
              >IMDB Scraper Options {{imdbOptionsTitle}}</v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-col>
                  <v-checkbox v-for="userScanOption in $shared.userScanOptions" v-bind:key="userScanOption.key"
                    v-model="userScanOption.enabled"
                    v-bind:label="userScanOption.description"
                    style="margin: 0px"
                    color="dark-grey"
                  ></v-checkbox>
                </v-col>
              </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>


        <div style="height: 16px"></div>

        <v-alert
          type="warning"
          colored-border
          border="left"
          v-if="missingSourcePaths && missingSourcePaths.length > 0"
          dense
        >
          Warning: the following source path{{missingSourcePaths.length > 1 ? 's are ' : ' is '}}currently not available and all entries will be removed! (check Settings)
          <ul>
            <li v-for="msp in missingSourcePaths" v-bind:key="msp.id_SourcePaths">{{msp.Path}}</li>
          </ul>
        </v-alert>
      </v-card-text>

      <v-card-actions>
        <v-col sm="12">
          <v-row style="margin-top: 8px">
            <v-btn
              class="xs-fullwidth"
              color="secondary"
              v-on:click.native="onCloseClick"
              style="margin-left: 8px;"
            >Cancel</v-btn>
            <v-btn
              class="xs-fullwidth"
              v-bind:color="(missingSourcePaths && missingSourcePaths.length > 0) ? 'red' : 'primary'"
              v-on:click.native="onOKClick"
              v-bind:loading="isLoading"
              style="margin-left: 8px;"
            >OK <span v-if="missingSourcePaths && missingSourcePaths.length > 0">, I take the risk</span></v-btn>
          </v-row>
        </v-col>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
const logger = require("loglevel");

import * as store from "@/store";

// import { eventBus } from "@/main";

export default {
  props: ["show"],

  data() {
    return {
      isLoading: true,
      radioGroup: 1,
      missingSourcePaths: [],
      showMediaInfoWarning: false
    };
  },

  computed: {
    imdbOptionsTitle() {
      logger.log('imdbOptionsTitle START');
      
      if (
        this.$shared.userScanOptions.findIndex(
          scanOption => !scanOption.enabled
        ) === -1
      ) {
        return "(ALL)";
      }

      if (
        this.$shared.userScanOptions.findIndex(
          scanOption => scanOption.enabled
        ) === -1
      ) {
        return "(NONE)";
      }

      return (
        "(" +
        this.$shared.userScanOptions.filter(
          scanOption => scanOption.enabled
        ).length +
        "/" +
        this.$shared.userScanOptions.length +
        ")"
      );
    }
  },

  methods: {
    onCloseClick() {
      this.$emit("cancel");
    },

    onOKClick() {
      this.$emit("ok", this.radioGroup);
    },

    async init() {
      this.isLoading = true;
      
      store.resetUserScanOptions();
      
      this.missingSourcePaths = await store.findMissingSourcePaths();

      logger.log('this.missingSourcePaths:', this.missingSourcePaths);

      this.showMediaInfoWarning =  (await store.getSetting(
        "MediainfoPath"
      ))
        ? false
        : true;

      this.isLoading = false;
    },

    openSettings() {
      this.$emit("cancel");
      this.$router.push("/settings");
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
</style>
