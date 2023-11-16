<template>
  <v-dialog v-model="show" persistent max-width="1000px" v-on:keydown.escape="onCancelClick" scrollable>
    <v-card dark flat v-bind:ripple="false">
      <v-card-title>
        <div class="headline" style="width: 100%; font-size: 1.17em">
          <v-row style="margin: 0px">
            {{ $t("Link with IMDB entry") }}
            <v-spacer />
            <v-tooltip bottom>
              <template v-slot:activator="{ on }">
                <span v-on="on">
                  <v-btn v-if="showUnlink" text color="error" v-on:click.stop="onUnlinkClick()">{{ $t("UNLINK") }}</v-btn>
                </span>
              </template>
              <span>{{ $t("Remove the link to the current IMDB entry for this medium_") }}</span>
            </v-tooltip>
          </v-row>
        </div>

        <v-row style="padding-left: 16px; margin-top: 16px; margin-bottom: 24px; width: 100%">
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

        <!--
        <v-expansion-panels>
          <v-expansion-panel style="padding: 0px !important; margin-bottom: 24px">
            <v-expansion-panel-header style="padding: 16px !important">{{ $t("Media Types") }} {{ titleTypesTitle() }}</v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-row style="margin-bottom: 8px">
                <v-btn text v-on:click="setAllTitleTypes(false)">{{ $t("NONE") }}</v-btn>
                <v-btn text v-on:click="setAllTitleTypes(true)">{{ $t("ALL") }}</v-btn>
              </v-row>
              <v-checkbox
                v-for="titleType in titleTypes"
                v-bind:key="titleType.id"
                v-model="titleType.checked"
                v-bind:label="titleType.nameTranslated"
                style="margin: 0px"
                color="mk-dark-grey"
              ></v-checkbox>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      -->

        <v-row style="margin-bottom: 16px">
          <v-btn text v-bind:loading="isLoading" v-on:click.native="onSearchClick">{{ $t("Search") }}</v-btn>
        </v-row>
      </v-card-title>

      <!-- Results -->
      <v-card-text v-if="firstSearchCompleted" style="padding-right: 28px">
        <div v-if="searchResults.length === 0">{{ $t("No results") }}</div>
        <div v-if="searchResults.length > 0">
          <!-- Top Pagination -->
          <div v-if="Math.ceil(searchResults.length / searchResultsPerPage) > 1" style="margin-bottom: 24px; color: white">
            <v-btn small v-bind:disabled="currentPage == 1" v-on:click="onPrevClicked" style="margin-right: 16px">&lt;</v-btn>
            {{ currentPage }} / {{ Math.ceil(searchResults.length / searchResultsPerPage) }}
            <v-btn
              small
              v-bind:disabled="currentPage >= Math.ceil(searchResults.length / searchResultsPerPage)"
              v-on:click="onNextClicked"
              style="margin-left: 16px"
              >&gt;</v-btn
            >
          </div>

          <!-- Result Items -->
          <v-row v-for="(item, i) in searchResultsPaginated" :key="i">
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
                      <v-img contain v-if="item.imageURL" v-bind:src="item.imageURL" style="border-radius: 6px"></v-img>
                    </v-list-item-avatar>
                  </div>
                  <v-list-item-content class="align-self-start" style="padding-top: 6px; padding-bottom: 6px">
                    <v-col style="padding: 0px !important">
                      <v-row style="margin-bottom: 8px">
                        <v-list-item-title style="margin-bottom: 4px !important; font-size: 16px; margin-left: 12px; margin-top: 8px"
                          >{{ item.title }} <span v-if="item.year">({{ item.year }})</span></v-list-item-title
                        >
                      </v-row>

                      <v-list-item-subtitle v-if="item.detailInfo" style="margin-top: -8px; margin-bottom: 4px">{{ item.detailInfo }}</v-list-item-subtitle>

                      <v-row style="margin-top: 8px">
                        <v-btn v-show="item.itemHovered || isLinking" text color="primary" v-bind:loading="isLinking" v-on:click.stop="onSelectClick(item)">{{
                          $t("Select for linking")
                        }}</v-btn>
                      </v-row>
                    </v-col>
                  </v-list-item-content>
                </v-list-item>
              </v-card>
            </v-col>
          </v-row>

          <!-- Bottom Pagination -->
          <div v-if="Math.ceil(searchResults.length / searchResultsPerPage) > 1" style="margin-top: 16px; margin-bottom: 24px; color: white">
            <v-btn small v-bind:disabled="currentPage == 1" v-on:click="onPrevClicked" style="margin-right: 16px">&lt;</v-btn>
            {{ currentPage }} / {{ Math.ceil(searchResults.length / searchResultsPerPage) }}
            <v-btn
              small
              v-bind:disabled="currentPage >= Math.ceil(searchResults.length / searchResultsPerPage)"
              v-on:click="onNextClicked"
              style="margin-left: 16px"
              >&gt;</v-btn
            >
          </div>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-btn class="xs-fullwidth" color="secondary" v-on:click.native="onCancelClick()">{{ $t("Close") }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
// import * as store from "@/store";
import { scrapeIMDBAdvancedTitleSearchV3, scrapeIMDBFindPageSearchV3 } from "@/imdb-scraper";

// import * as helpers from "@/helpers/helpers";
const logger = require("../../helpers/logger");

import { eventBus } from "@/main";

export default {
  props: ["show", "showUnlink"],

  data() {
    return {
      firstSearchCompleted: false,
      searchResultsPerPage: 20,
      currentPage: 1,
      searchResults: [],
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
    };
  },

  computed: {
    searchResultsPaginated() {
      return this.searchResults.slice((this.currentPage - 1) * this.searchResultsPerPage, this.currentPage * this.searchResultsPerPage);
    },
  },

  methods: {
    async init() {
      this.items = [];
      this.searchText = "";
      this.showTitleTypes = false;
      this.searchResults = [];
      this.isLoading = false;
      this.isLinking = false;

      this.titleTypes.forEach((titleType) => (titleType.nameTranslated = this.$t(`IMDBTitleTypes.${titleType.name}`)));
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

      return `(${this.titleTypes.filter((titleType) => titleType.checked).length}/${this.titleTypes.length})`;
    },

    /**
     * We merge the results of the advanced title search and the find search
     */
    async onSearchClick() {
      logger.log("[onSearchClick] START");

      this.isLoading = true;
      this.currentPage = 1;

      if (!this.searchText) {
        eventBus.showSnackbar("error", this.$t("title is missing"));
        this.isLoading = false;
        return;
      }

      // 天気の子
      let advancedTitleSearchResults = null;
      try {
        advancedTitleSearchResults = await scrapeIMDBAdvancedTitleSearchV3(this.searchText, this.titleTypes);
      } catch (err) {
        logger.error("[onSearchClick] ERROR:", err);
      }

      let findResults = null;
      try {
        findResults = await scrapeIMDBFindPageSearchV3(this.searchText, null);
      } catch (err) {
        logger.error(err);
      }

      logger.log("[onSearchClick] advancedTitleSearchResults:", advancedTitleSearchResults);
      logger.log("[onSearchClick] findResults:", findResults);

      this.searchResults = advancedTitleSearchResults || [];

      if (findResults) {
        findResults.forEach((result) => {
          if (result.type !== "Title") {
            return;
          }
          if (!this.searchResults.find((result2) => result.tconst === result2.tconst)) {
            this.searchResults.push(result);
          }
        });
      }

      this.isLoading = false;
      this.firstSearchCompleted = true;
    },

    onSelectClick(item) {
      logger.log("[onSelectClick]  item:", item);

      if (!item.tconst) {
        return eventBus.showSnackbar("error", this.$t("identifier missing"));
      }

      this.searchResults = [item];

      this.isLinking = true;

      this.$emit("selected", item.tconst);
    },

    onUnlinkClick() {
      logger.log("[onUnlinkClick]");

      this.isLinking = true;

      this.$emit("unlink");
    },

    setItemHovered(item, section, value) {
      this.$set(item, `${section}Hovered`, value);
    },

    onPrevClicked() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    },

    onNextClicked() {
      if (this.currentPage < Math.ceil(this.searchResults.length / this.searchResultsPerPage)) {
        this.currentPage++;
      }
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
