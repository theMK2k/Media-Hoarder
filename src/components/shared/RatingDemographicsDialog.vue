<template>
  <v-dialog
    v-model="show"
    persistent
    max-width="100%"
    v-on:keydown.escape="onCloseClick"
  >
    <v-card dark flat v-bind:ripple="false">
      <v-card-title>
        <div class="headline" style="width: 100%; font-size: 1.17em">Rating Demographics for {{title}}</div>
      </v-card-title>
      <v-card-text>
        <v-alert
          type="info"
          colored-border
          border="left"
          v-if="!isLoading && !ratingDemographics"
          dense
        >No rating demographics found for {{title}}</v-alert>
      </v-card-text>

      <v-card-actions>
        <v-col sm="12">
          <v-row style="margin-top: 8px">
            <v-btn
              class="xs-fullwidth"
              color="secondary"
              v-on:click.native="onCloseClick"
              style="margin-left: 8px;"
            >Close</v-btn>
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
  props: ["show", "id_Movies", "title"],

  data() {
    return {
      isLoading: true,
      ratingDemographics: null
    };
  },

  computed: {
  },

  methods: {
    onCloseClick() {
      this.$emit("close");
    },

    async init(id_Movies) {
      this.isLoading = true;
      
      this.ratingDemographics = await store.fetchRatingDemographics(id_Movies);

      logger.log('ratingDemographics:', this.ratingDemographics);

      this.isLoading = false;
    },
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
