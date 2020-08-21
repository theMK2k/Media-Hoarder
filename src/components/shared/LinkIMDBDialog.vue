<template>
  <!--
    #
    # This is the old LinkIMDBDialog which uses the IMDB Advanced Title Search
    # Unfortunately the Advanced Title Search does not support non-latin characters, e.g.
    #
    # 天気の子 (aka title for "Weathering with you") won't yield any results
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

        <v-expansion-panels>
          <v-expansion-panel style="padding: 0px!important; margin-bottom: 8px">
            <v-expansion-panel-header
              style="padding: 8px!important"
            >{{$t('Media Types')}} {{titleTypesTitle()}}</v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-row>
                <v-btn text v-on:click="setAllTitleTypes(false)">{{$t('NONE')}}</v-btn>
                <v-btn text v-on:click="setAllTitleTypes(true)">{{$t('ALL')}}</v-btn>
              </v-row>
              <v-checkbox
                v-for="titleType in titleTypes"
                v-bind:key="titleType.id"
                v-model="titleType.checked"
                v-bind:label="titleType.nameTranslated"
                style="margin: 0px"
                color="dark-grey"
              ></v-checkbox>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>

        <v-row>
          <v-btn text v-bind:loading="isLoading" v-on:click.native="onSearchClick">{{$t('Search')}}</v-btn>
        </v-row>
      </v-card-title>
      <v-card-text style="padding-right: 28px;">
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
import { scrapeIMDBAdvancedTitleSearch } from "@/imdb-scraper";

// import * as helpers from "@/helpers/helpers";
const logger = require("loglevel");

import { eventBus } from "@/main";

export default {
  props: ["show"],

  data() {
    return {
      items: [],
      searchText: "",
      showTitleTypes: false,
      isLoading: false,
      isLinking: false,

      titleTypes: [
        {
          id: "feature",
          name: "Feature Film",
          checked: true,
        },
        {
          id: "tv_movie",
          name: "TV Movie",
          checked: true,
        },
        {
          id: "tv_series",
          name: "TV Series",
          checked: true,
        },
        {
          id: "tv_episode",
          name: "TV Episode",
          checked: true,
        },
        {
          id: "tv_special",
          name: "TV Special",
          checked: true,
        },
        {
          id: "tv_miniseries",
          name: "Mini-Series",
          checked: true,
        },
        {
          id: "documentary",
          name: "Documentary",
          checked: true,
        },
        {
          id: "short",
          name: "Short Film",
          checked: true,
        },
        {
          id: "video",
          name: "Video",
          checked: true,
        },
        {
          id: "tv_short",
          name: "TV Short",
          checked: true,
        },
      ],

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

      try {
        this.searchResults = await scrapeIMDBAdvancedTitleSearch(
          this.searchText,
          this.titleTypes
        );
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