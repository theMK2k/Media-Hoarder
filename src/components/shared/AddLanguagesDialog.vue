<template>
  <v-dialog v-model="show" persistent max-width="1000px" v-on:keydown.escape="onCancelClick">
    <v-card dark flat v-bind:ripple="false">
      <v-card-title>
        <div class="headline" style="width: 100%; font-size: 1.17em">Add Languages</div>
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

        <v-checkbox
          v-for="item in filteredItems"
          v-bind:key="item.code"
          v-bind:label="item.DisplayText"
          v-model="item.selected"
          style="margin: 0px"
          color="dark-grey"
        ></v-checkbox>
      </v-card-text>

      <v-card-actions>
        <v-btn class="xs-fullwidth" color="secondary" v-on:click.native="onCancelClick()">Cancel</v-btn>
        <v-btn
          v-bind:disabled="!canConfirm"
          class="xs-fullwidth"
          color="primary"
          v-on:click.native="onOKClick()"
        >OK</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import * as _ from "lodash";

import * as store from "@/store";
// import * as helpers from "@/helpers/helpers";
const logger = require("loglevel");

import { eventBus } from "@/main";

export default {
  props: ["show", "languageType"],

  data() {
    return {
      items: [],
      searchText: "",
      filter: ""
    };
  },

  watch: {
    searchText: function(newValue) {
      this.debouncedSearchTextChanged(newValue);
    }
  },

  computed: {
    languages() {
      return (this.languageType === 'languagesPrimaryTitle') ? this.$shared.languagesPrimaryTitle : this.$shared.languagesAudioSubtitles;
    },

    filteredItems() {
      return this.items.filter(item => {
        if (this.languages.findIndex(used => used.code === item.code) !== -1) {
          return false;
        }
        
        if (!this.filter) {
          return true;
        }

        return item.DisplayText.toLowerCase().includes(this.filter.toLowerCase());
      });
    },

    canConfirm() {
      return (this.items.findIndex(item => item.selected) !== -1);
    }
  },

  methods: {
    onCancelClick() {
      this.$emit("cancel");
    },

    onOKClick() {
      logger.log('this.items.filter(item => item.selected):', this.items.filter(item => item.selected));
      this.$emit("ok", this.items.filter(item => item.selected));
    },

    async searchTextChanged(searchText) {
      this.filter = searchText;
    },

    async init() {
      this.searchText = "";

      if (this.items.length === 0) {
        try {
          this.items = await store.getIMDBLanguages();
          logger.log("languages this.items:", this.items);
        } catch (e) {
          eventBus.showSnackbar("error", e);
        }
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
.v-messages {
  min-height: 0px !important;
}
</style>