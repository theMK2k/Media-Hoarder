<template>
  <v-dialog
    v-model="show"
    persistent
    max-width="1000px"
    v-on:keydown.escape="onCancelClick"
  >
    <v-card dark flat v-bind:ripple="false">
      <v-card-title>
        <div class="headline" style="width: 100%; font-size: 1.17em">Add Regions</div>
      </v-card-title>
      <v-card-text>
        <v-text-field
          :append-icon-cb="() => {}"
          placeholder="Search..."
          single-line
          append-icon="mdi-magnify"
          color="white"
          hide-details
          v-model="searchText"
        ></v-text-field>

        <v-row
          class="item Clickable"
          style="width: 100%"
          v-for="item in items"
          v-bind:key="item.name"
          v-on:click.stop="onItemClicked(item)"
        >{{ item.name }}</v-row>
      </v-card-text>

      <v-card-actions>
        <v-btn class="xs-fullwidth" color="secondary" v-on:click.native="onCancelClick()">Cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import * as _ from "lodash";

import * as store from "@/store";
import * as helpers from "@/helpers/helpers";
const logger = require("loglevel");

import { eventBus } from "@/main";

export default {
  props: ["show"],

  data() {
    return {
      items: [],
      searchText: ""
    };
  },

  watch: {
    searchText: function(newValue, oldValue) {
      this.debouncedSearchTextChanged(newValue);
    }
  },

  methods: {
    async init() {
      this.items = [];
      this.searchText = "";
    },

    onOKClick() {
      this.$emit("ok", items);
    },

    onCancelClick() {
      this.$emit("cancel");
    },

    async searchTextChanged(searchText) {
      
    },

    onItemClicked(item) {

    },

    async init() {
        if (this.items.length < 0) {
          logger.log('TODO: fetch Countries from https://www.imdb.com/search/title/');
        }

      this.items.forEach(item => {
        item.selected = false;
      });
    }
  },

  created() {
    // lodash debounced functions
    this.debouncedSearchTextChanged = _.debounce(this.searchTextChanged, 500);
  }
};
</script>

<style scoped>
.item {
  margin-left: 0px;
  margin-top: 4px;
}
</style>