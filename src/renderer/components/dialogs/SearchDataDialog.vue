<template>
  <v-dialog
    :model-value="show"
    @update:model-value="$emit('update:show', $event)"
    persistent
    max-width="1000px"
    scrollable
  >
    <v-card dark flat v-bind:ripple="false">
      <v-card-title>
        <div class="text-h5" style="width: 100%; font-size: 1.17em">
          {{ title }}
        </div>
        <v-row style="margin-top: 8px">
          <v-text-field
            v-bind:placeholder="$t(`Search___ (use '*' to list all)`)"
            variant="underlined"
            color="white"
            hide-details
            v-model="searchText"
            v-bind:loading="isLoading"
            v-on:keydown.enter="runSearch"
            style="padding-top: 0px; margin-left: 12px"
          ></v-text-field>
          <v-btn variant="text" v-on:click="runSearch">{{ $t("Search") }}</v-btn>
        </v-row>
      </v-card-title>
      <v-card-text>
        <v-checkbox
          v-model="sortByNumMovies"
          v-bind:label="
            $t(`Sort by number of ${mediaType === 'series' && Series_id_Movies_Owner ? 'episodes' : mediaType}`)
          "
          v-on:change="sortItems(items)"
          style="margin: 0px; margin-top: 12px"
          color="mk-dark-grey"
        ></v-checkbox>

        <v-row
          class="item mk-clickable"
          style="width: 100%; margin-bottom: 4px"
          v-for="item in items"
          v-bind:key="item.id"
          v-on:click.stop="onItemClicked(item)"
          >{{ item.name }} ({{ item.NumMovies }})</v-row
        >
      </v-card-text>

      <v-card-actions>
        <v-btn class="xs-fullwidth" color="secondary" v-on:click="onCancelClick()">{{ $t("Close") }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
// import * as _ from "lodash";

import * as store from "@/store.js";
import * as helpers from "@helpers/helpers.js";
import logger from "@helpers/logger.js";
import sqlString from "sqlstring-sqlite";

import { eventBus } from "@/eventBus.js";

export default {
  props: ["show", "title", "searchMode", "mediaType", "Series_id_Movies_Owner"],

  emits: ["update:show", "ok", "cancel"],

  data() {
    return {
      items: [],
      searchText: "",
      sortByNumMovies: false,
      isLoading: false,
    };
  },

  methods: {
    async init() {
      this.items = [];
      this.searchText = "";
    },

    onOKClick() {
      this.$emit("ok", {});
    },

    onCancelClick() {
      this.$emit("cancel");
    },

    async runSearch() {
      if (!this.searchText) {
        this.items = [];
        return;
      }

      let searchText = this.searchText;

      searchText = searchText.replace(/\*/g, "%");
      searchText = sqlString.escape(searchText);
      searchText = searchText.substring(1, searchText.length - 1); // remove start and trailing "'"

      this.isLoading = true;

      let sql = "";
      if (this.searchMode === "companies") {
        // todo filter: (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
        sql = `
				SELECT
              Company_Name AS id
              , Company_Name AS name
							, (SELECT COUNT(1) FROM (
									SELECT DISTINCT
										MOV.Name || ' ' || IFNULL(MOV.startYear, 'xxx')
                  FROM tbl_Movies_IMDB_Companies MC2
                  INNER JOIN tbl_Movies MOV ON MC2.id_Movies = MOV.id_Movies
                  INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths
									WHERE SP.MediaType = $MediaType
                        AND MC2.Company_Name = MC.Company_Name
                				AND (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
                        AND CASE WHEN $Series_id_Movies_Owner IS NOT NULL THEN MOV.Series_id_Movies_Owner = $Series_id_Movies_Owner ELSE MOV.Series_id_Movies_Owner IS NULL END
								)) AS NumMovies
					FROM tbl_Movies_IMDB_Companies MC
					WHERE Company_Name LIKE '%${searchText}%'
                AND NumMovies > 0
          GROUP BY Company_Name
          ${this.sortByNumMovies ? "ORDER BY NumMovies DESC" : "ORDER BY name ASC"}
          `;
      }

      if (this.searchMode === "persons") {
        // todo filter: (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
        sql = `
				SELECT
							Person_Name AS name
							, IMDB_Person_ID AS id
							, (SELECT COUNT(1) FROM (
									SELECT DISTINCT
										MOV.Name || ' ' || IFNULL(MOV.startYear, 'xxx')
                  FROM tbl_Movies_IMDB_Credits MC2
                  INNER JOIN tbl_Movies MOV ON MC2.id_Movies = MOV.id_Movies
                  INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths
									WHERE SP.MediaType = $MediaType
                        AND MC2.IMDB_Person_ID = MC.IMDB_Person_ID
                				AND (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
                        AND CASE WHEN $Series_id_Movies_Owner IS NOT NULL THEN MOV.Series_id_Movies_Owner = $Series_id_Movies_Owner ELSE MOV.Series_id_Movies_Owner IS NULL END
								)) AS NumMovies
					FROM tbl_Movies_IMDB_Credits MC
					WHERE Person_Name LIKE '%${searchText}%'
                AND NumMovies > 0
          GROUP BY IMDB_Person_ID
          ${this.sortByNumMovies ? "ORDER BY NumMovies DESC" : "ORDER BY name ASC"}
          `;
      }

      if (this.searchMode === "plot-keywords") {
        // todo filter: (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
        sql = `
          SELECT
            PK.id_IMDB_Plot_Keywords AS id
            , Keyword AS name
            , (
                SELECT COUNT(1)
                FROM (
                  SELECT DISTINCT
                    MOV.Name || ' ' || IFNULL(MOV.startYear, 'xxx')
                  FROM tbl_Movies_IMDB_Plot_Keywords MPK
                  INNER JOIN tbl_Movies MOV ON MPK.id_Movies = MOV.id_Movies
                  INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths
									WHERE SP.MediaType = $MediaType
                        AND PK.id_IMDB_Plot_Keywords = MPK.id_IMDB_Plot_Keywords
                        AND (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
                        AND CASE WHEN $Series_id_Movies_Owner IS NOT NULL THEN MOV.Series_id_Movies_Owner = $Series_id_Movies_Owner ELSE MOV.Series_id_Movies_Owner IS NULL END
                )
              ) AS NumMovies
          FROM tbl_IMDB_Plot_Keywords PK
          WHERE PK.Keyword LIKE '%${searchText}%'
                AND NumMovies > 0
          ${this.sortByNumMovies ? "ORDER BY NumMovies DESC" : "ORDER BY Keyword ASC"}
          `;
      }

      if (this.searchMode === "filming-locations") {
        // todo filter: (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
        sql = `
          SELECT
            FL.id_IMDB_Filming_Locations AS id
            , Location AS name
            , (
                SELECT COUNT(1)
                FROM (
                  SELECT DISTINCT
                    MOV.Name || ' ' || IFNULL(MOV.startYear, 'xxx')
                  FROM tbl_Movies_IMDB_Filming_Locations MFL
                  INNER JOIN tbl_Movies MOV ON MFL.id_Movies = MOV.id_Movies
                  INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths
									WHERE SP.MediaType = $MediaType
                        AND FL.id_IMDB_Filming_Locations = MFL.id_IMDB_Filming_Locations
                        AND (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
                        AND CASE WHEN $Series_id_Movies_Owner IS NOT NULL THEN MOV.Series_id_Movies_Owner = $Series_id_Movies_Owner ELSE MOV.Series_id_Movies_Owner IS NULL END
              )
            ) AS NumMovies
          FROM tbl_IMDB_Filming_Locations FL
          WHERE FL.Location LIKE '%${searchText}%'
                AND NumMovies > 0
          ${this.sortByNumMovies ? "ORDER BY NumMovies DESC" : "ORDER BY Location ASC"}
          `;
      }

      logger.log("[runSearch] search query:", sql);

      const items = await store.db.fireProcedureReturnAll(sql, {
        $MediaType: this.mediaType,
        $Series_id_Movies_Owner: this.Series_id_Movies_Owner,
      });
      this.sortItems(items);
      this.items = items;

      this.isLoading = false;
    },

    onItemClicked(item) {
      logger.log("[onItemClicked] this.searchMode:", this.searchMode, "item:", item);

      if (this.searchMode === "companies") {
        eventBus.showCompanyDialog(item);
      }

      if (this.searchMode === "persons") {
        eventBus.showPersonDialog(item);
      }

      if (this.searchMode === "plot-keywords") {
        eventBus.showPlotKeywordDialog({
          id_IMDB_Plot_Keywords: item.id,
          Keyword: item.name,
        });
      }

      if (this.searchMode === "filming-locations") {
        eventBus.showFilmingLocationDialog({
          id_IMDB_Filming_Locations: item.id,
          Location: item.name,
        });
      }
    },

    sortItems(items) {
      logger.log("[sortItems] items:", items);
      items.sort((a, b) => {
        const valA = this.sortByNumMovies ? a.NumMovies : a.name.toLowerCase();
        const valB = this.sortByNumMovies ? b.NumMovies : b.name.toLowerCase();

        const reverse = this.sortByNumMovies;

        return helpers.compare(valA, valB, reverse);
      });
      logger.log("[sortItems] items (sorted):", items);
    },
  },

  created() {
    // lodash debounced functions
    eventBus.on("personDialogConfirm", () => {
      this.onCancelClick();
    });
    eventBus.on("companyDialogConfirm", () => {
      this.onCancelClick();
    });
    eventBus.on("plotKeywordDialogConfirm", () => {
      this.onCancelClick();
    });
    eventBus.on("filmingLocationDialogConfirm", () => {
      this.onCancelClick();
    });
  },

  beforeDestroy() {
    eventBus.off("personDialogConfirm");
  },
};
</script>

<style scoped>
.item {
  margin-left: 0px;
  margin-top: 4px;
}
</style>
