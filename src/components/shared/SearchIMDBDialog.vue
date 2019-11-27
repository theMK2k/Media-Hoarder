<template>
  <v-dialog v-model="show" persistent max-width="1000px">
    <v-card dark flat v-bind:ripple="false">
      <v-card-title>
        <div class="headline" style="width: 100%; font-size: 1.17em">Link with IMDB entry</div>
      </v-card-title>
      <v-card-text>
        <v-row style="padding-left: 16px; margin-bottom: 8px">
          <v-text-field
            :append-icon-cb="() => {}"
            placeholder="Enter a title..."
            single-line
            append-icon="mdi-magnify"
            color="white"
            hide-details
            v-model="searchText"
          ></v-text-field>
        </v-row>

        <v-expansion-panels>
          <v-expansion-panel style="padding: 0px!important; margin-bottom: 8px">
            <v-expansion-panel-header
              style="padding: 8px!important"
            >Media Types {{titleTypesTitle()}}</v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-checkbox
                v-for="titleType in titleTypes"
                v-bind:key="titleType.id"
                v-model="titleType.checked"
                v-bind:label="titleType.name"
                style="margin: 0px"
                color="dark-grey"
              ></v-checkbox>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>

        <v-row>
          <v-btn text v-bind:loading="isLoading" v-on:click.native="onSearchClick()">Search</v-btn>
        </v-row>

        <v-row v-for="(item, i) in searchResults" :key="i">
          <v-col style="padding: 2px; margin-left: 16px">
            <v-card dark flat hover v-bind:ripple="false" v-on:click="onItemClick(item)">
              <v-list-item three-line style="padding-left: 0px">
                <div>
                  <v-list-item-avatar tile style="margin: 6px; height: 100px; width: 80px">
                    <v-img
                      contain
                      v-if="item.imageURL"
                      v-bind:src="item.imageURL"
                      style="border-radius: 6px;"
                    ></v-img>
                  </v-list-item-avatar>
                </div>
                <v-list-item-content
                  class="align-self-start"
                  style="padding-top: 6px; padding-bottom: 6px"
                >
                  <v-col style="padding: 0px!important">
                    <v-row>
                      <v-list-item-title
                        style="margin-bottom: 4px!important; font-size: 16px; margin-left: 12px"
                      >{{ item.title }}</v-list-item-title>
                    </v-row>

                    <v-list-item-subtitle
                      v-if="item.detailInfo"
                      style="margin-bottom: 4px"
                    >{{ item.detailInfo }}</v-list-item-subtitle>

                    <v-row style="margin-top: 8px">
                      <v-btn text color="primary" v-on:click.stop="onSelectClick(item)">Select for linking</v-btn>
                    </v-row>
                  </v-col>
                </v-list-item-content>
              </v-list-item>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions>
        <v-btn class="xs-fullwidth" color="secondary" v-on:click.native="onCancelClick()">Close</v-btn>
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
      searchText: "flanders",
      showTitleTypes: false,
      isLoading: false,

      titleTypes: [
        {
          id: "feature",
          name: "Feature Film",
          checked: true
        },
        {
          id: "tv_movie",
          name: "TV Movie",
          checked: true
        },
        {
          id: "tv_series",
          name: "TV Series",
          checked: true
        },
        {
          id: "tv_episode",
          name: "TV Episode",
          checked: true
        },
        {
          id: "tv_special",
          name: "TV Special",
          checked: true
        },
        {
          id: "tv_miniseries",
          name: "Mini-Series",
          checked: true
        },
        {
          id: "documentary",
          name: "Documentary",
          checked: true
        },
        {
          id: "short",
          name: "Short Film",
          checked: true
        },
        {
          id: "video",
          name: "Video",
          checked: true
        },
        {
          id: "tv_short",
          name: "TV Short",
          checked: true
        }
      ],

      searchResults: []
    };
  },

  methods: {
    async init() {
      this.items = [];
      this.searchText = "flanders";
      this.showTitleTypes = false;
      this.searchResults = [];
    },

    onCancelClick() {
      this.$emit("close");
    },

    titleTypesTitle() {
      if (!this.titleTypes.find(titleType => titleType.checked)) {
        return "(NONE)";
      }

      if (!this.titleTypes.find(titleType => !titleType.checked)) {
        return "(ALL)";
      }

      return `(${
        this.titleTypes.filter(titleType => titleType.checked).length
      }/${this.titleTypes.length})`;
    },

    async onSearchClick() {
      logger.log("onSearchClick");

      this.isLoading = true;

      if (!this.searchText) {
        eventBus.showSnackbar("error", 6000, "title is missing");
        this.isLoading = false;
        return;
      }

      try {
        this.searchResults = await store.scrapeIMDBSearch(
          this.searchText,
          this.titleTypes
        );
      } catch(err) {
        this.isLoading = false;
        eventBus.showSnackbar("error", 6000, err);
      }
    }
  },

  created() {}
};
</script>

<style scoped>
.item {
  margin-left: 0px;
  margin-top: 4px;
}
</style>