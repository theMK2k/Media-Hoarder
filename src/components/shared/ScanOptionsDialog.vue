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
        >Warning: Mediainfo CLI Path is not set. Please go to Settings and provide one. You can get Mediainfo CLI from www.mediaarea.net</v-alert>

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

        <v-alert
          type="warning"
          colored-border
          border="left"
          v-if="missingSourcePaths && missingSourcePaths.length > 0"
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
              v-bind:loading="isLoading"
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
  props: ["show", "showMediaInfoWarning"],

  data() {
    return {
      isLoading: true,
      radioGroup: 1,
      missingSourcePaths: []
    };
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
      
      const missingSourcePaths = await store.findMissingSourcePaths();

      logger.log('missingSourcePaths:', missingSourcePaths);

      this.missingSourcePaths = missingSourcePaths.filter(
        msp => msp.checkRemovedFiles
      );

      logger.log('this.missingSourcePaths:', this.missingSourcePaths);

      this.isLoading = false;
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
