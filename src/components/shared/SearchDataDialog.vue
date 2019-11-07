<template>
  <v-dialog v-model="show" persistent max-width="1000px">
    <v-card dark flat v-bind:ripple="false">
      <v-list-item-title class="headline mb-2" style="margin-bottom: 0px!important">
        {{ title }}
      </v-list-item-title>
    </v-card>
  </v-dialog>
</template>

<script>
/*
    SELECT
        Company_Name
        , (SELECT COUNT(1) FROM (SELECT DISTINCT id_Movies FROM tbl_Movies_IMDB_Companies MC2 WHERE MC2.Company_Name = MC.Company_Name)) AS NumMovies
    FROM tbl_Movies_IMDB_Companies MC
    GROUP BY Company_Name
*/

import * as store from "@/store";
import * as helpers from "@/helpers/helpers";
const logger = require("loglevel");

export default {
  props: ["show", "title", "searchMode"],

  data() {
    return {
      items: []
    };
  },

  methods: {
    async init() {
      this.items = [];
    }
  }
};
</script>

<style>
</style>