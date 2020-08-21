<template>
  <!--
    #
    # This is LinkIMDBDialog which uses the IMDB Find API
    # it supports also non-latin characters, e.g.
    #
    # 天気の子 (aka title for "Weathering with you")
    #
  -->
  <v-dialog
    v-model="show"
    persistent
    max-width="1000px"
    v-on:keydown.escape="onCancelClick"
    scrollable
  >
    <v-card dark flat v-bind:ripple="false">
      <v-card-title>
        <div class="headline" style="width: 100%; font-size: 1.17em">{{$t('Link with IMDB entry')}}</div>
        <v-list-item-subtitle class="grey--text caption">{{ filePath }}</v-list-item-subtitle>
        <v-row style="padding-left: 16px; margin-bottom: 8px">
          <v-text-field
            :append-icon-cb="() => {}"
            v-bind:placeholder="`${$t('Enter a title')}...`"
            single-line
            append-icon="mdi-magnify"
            color="white"
            hide-details
            v-model="searchText"
            v-on:keydown.enter="onSearchClick"
          ></v-text-field>
        </v-row>

        <v-select
          v-bind:items="titleTypes"
          item-text="name"
          item-value="id"
          v-model="chosenTitleType"
          v-bind:label="$t('Title Types')"
          style="margin-left: 4px; margin-right: -12px; margin-top: 16px; height: 40px"
        >
          <template v-slot:selection="{ item }">
            <span>{{ $t(item.name) }}</span>
          </template>
        </v-select>

        <v-row style="margin-top: 16px">
          <v-btn text v-bind:loading="isLoading" v-on:click.native="onSearchClick">{{$t('Search')}}</v-btn>
        </v-row>
      </v-card-title>
      <v-card-text>
        <v-row v-for="(item, i) in searchResults" :key="i">
          <v-col style="padding: 2px; margin-left: 16px">
            <v-card
              dark
              flat
              hover
              v-bind:ripple="false"
              v-on:mouseover="setItemHovered(item, 'item', true)"
              v-on:mouseleave="setItemHovered(item, 'item', false)"
            >
              <v-list-item three-line style="padding-left: 0px">
                <div>
                  <v-list-item-avatar tile style="margin: 6px; height: 44px; width: 32px">
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
                    <!-- <v-row>
                      <v-list-item-title
                        style="margin-bottom: 4px!important; font-size: 16px; margin-left: 12px"
                      >{{ item.resultText }}</v-list-item-title>
                    </v-row>-->

                    <v-list-item-subtitle
                      v-if="item.resultText"
                      style="margin-bottom: 4px"
                    >{{ item.resultText }}</v-list-item-subtitle>

                    <v-row style="margin-top: 8px">
                      <v-btn
                        v-show="item.itemHovered || isLinking"
                        text
                        color="primary"
                        v-bind:loading="isLinking"
                        v-on:click.stop="onSelectClick(item)"
                      >{{$t('Select for linking')}}</v-btn>
                    </v-row>
                  </v-col>
                </v-list-item-content>
              </v-list-item>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions>
        <v-btn
          class="xs-fullwidth"
          color="secondary"
          v-on:click.native="onCancelClick()"
        >{{$t('Close')}}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
// import * as store from "@/store";
import { scrapeIMDBFind } from "@/imdb-scraper";

// import * as helpers from "@/helpers/helpers";
const logger = require("loglevel");

import { eventBus } from "@/main";

export default {
  props: ["show", "filePath"],

  data() {
    return {
      items: [],
      searchText: "",
      showTitleTypes: false,
      isLoading: false,
      isLinking: false,

      titleTypes: [
        {
          id: "all",
          name: "All",
        },
        {
          id: "tt",
          name: "Titles",
        },
        {
          id: "ep",
          name: "Episodes",
        },
      ],

      chosenTitleType: "all",

      searchResults: [],
    };
  },

  methods: {
    async init() {
      this.items = [];
      this.searchText = "";
      this.showTitleTypes = false;
      this.searchResults = [];
      this.isLoading = false;
      this.isLinking = false;

      this.titleTypes.forEach(
        (titleType) =>
          (titleType.nameTranslated = this.$t(
            `IMDBTitleTypes.${titleType.name}`
          ))
      );
    },

    setAllTitleTypes(value) {
      this.titleTypes.forEach((titleType) => {
        titleType.checked = value;
      });
    },

    onCancelClick() {
      this.$emit("close");
    },

    titleTypesTitle() {
      if (!this.titleTypes.find((titleType) => titleType.checked)) {
        return `(${this.$t("NONE")})`;
      }

      if (!this.titleTypes.find((titleType) => !titleType.checked)) {
        return `(${this.$t("ALL")})`;
      }

      return `(${
        this.titleTypes.filter((titleType) => titleType.checked).length
      }/${this.titleTypes.length})`;
    },

    async onSearchClick() {
      logger.log("onSearchClick");

      this.isLoading = true;

      if (!this.searchText) {
        eventBus.showSnackbar("error", this.$t("title is missing"));
        this.isLoading = false;
        return;
      }

      const titleType =
        this.chosenTitleType && this.chosenTitleType !== "all"
          ? this.chosenTitleType
          : "";

      try {
        this.searchResults = await scrapeIMDBFind(this.searchText, titleType);

        logger.log("searchResults:", this.searchResults);
      } catch (err) {
        eventBus.showSnackbar("error", err);
      } finally {
        this.isLoading = false;
      }
    },

    onSelectClick(item) {
      logger.log("onSelectClick item:", item);

      if (!item.tconst) {
        return eventBus.showSnackbar("error", this.$t("identifier missing"));
      }

      this.searchResults = [item];

      this.isLinking = true;

      this.$emit("selected", item.tconst);
    },

    setItemHovered(item, section, value) {
      this.$set(item, `${section}Hovered`, value);
    },
  },

  created() {},
};
</script>

<style scoped>
.item {
  margin-left: 0px;
  margin-top: 4px;
}
</style>