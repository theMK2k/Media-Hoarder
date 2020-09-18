<template>
  <v-dialog v-model="show" persistent max-width="1000px" v-on:keydown.escape="onCancelClick" scrollable>
    <v-card dark flat v-bind:ripple="false">
      <v-card-title>
        <div class="headline" style="width: 100%; font-size: 1.17em">{{ title }}</div>
        <v-row>
          <v-text-field
            :append-icon-cb="() => {}"
            v-bind:placeholder="$t(`Search___ (use '%' to list all)`)"
            single-line
            append-icon="mdi-magnify"
            color="white"
            hide-details
            v-model="searchText"
            v-bind:loading="isLoading"
            v-on:keydown.enter="runSearch"
            style="padding-top: 0px; margin-left: 12px"
          ></v-text-field>
          <v-btn text v-on:click="runSearch">{{$t('Search')}}</v-btn>
        </v-row>
      </v-card-title>
      <v-card-text>
        <v-checkbox
          v-model="sortByNumMovies"
          v-bind:label="$t('Sort by number of movies')"
          style="margin: 0px; margin-top: 12px"
          color="mk-dark-grey"

        ></v-checkbox>

        <v-row
          class="item mk-clickable"
          style="width: 100%"
          v-for="item in items"
          v-bind:key="item.id"
          v-on:click.stop="onItemClicked(item)"
        >{{ item.name }} ({{item.NumMovies}})</v-row>
      </v-card-text>

      <v-card-actions>
        <v-btn class="xs-fullwidth" color="secondary" v-on:click.native="onCancelClick()">{{$t('Close')}}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
// import * as _ from "lodash";

import * as store from "@/store";
// import * as helpers from "@/helpers/helpers";
const logger = require("loglevel");

import { eventBus } from "@/main";

export default {
  props: ["show", "title", "searchMode"],

  data() {
    return {
      items: [],
      searchText: "",
      sortByNumMovies: false,
      isLoading: false
    };
  },

  watch: {
    sortByNumMovies: function() {
      this.runSearch();
    }
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
										MC2.id_Movies
                  FROM tbl_Movies_IMDB_Companies MC2
                  INNER JOIN tbl_Movies MOV ON MC2.id_Movies = MOV.id_Movies
									WHERE MC2.Company_Name = MC.Company_Name
                				AND (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
								)) AS NumMovies
					FROM tbl_Movies_IMDB_Companies MC
					WHERE Company_Name LIKE '${this.searchText}%'
          GROUP BY Company_Name
          ${this.sortByNumMovies ? 'ORDER BY NumMovies DESC' : 'ORDER BY name ASC'}
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
										MC2.id_Movies
                  FROM tbl_Movies_IMDB_Credits MC2
                  INNER JOIN tbl_Movies MOV ON MC2.id_Movies = MOV.id_Movies
                  WHERE MC2.IMDB_Person_ID = MC.IMDB_Person_ID
                				AND (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
								)) AS NumMovies
					FROM tbl_Movies_IMDB_Credits MC
					WHERE Person_Name LIKE '${this.searchText}%'
          GROUP BY IMDB_Person_ID
          ${this.sortByNumMovies ? 'ORDER BY NumMovies DESC' : 'ORDER BY name ASC'}
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
                FROM tbl_Movies_IMDB_Plot_Keywords MPK
                INNER JOIN tbl_Movies MOV ON MPK.id_Movies = MOV.id_Movies
                WHERE PK.id_IMDB_Plot_Keywords = MPK.id_IMDB_Plot_Keywords
               				AND (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
              ) AS NumMovies
          FROM tbl_IMDB_Plot_Keywords PK
          WHERE PK.Keyword LIKE '%${this.searchText}%'
          ${this.sortByNumMovies ? 'ORDER BY NumMovies DESC' : 'ORDER BY Keyword ASC'}
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
              FROM tbl_Movies_IMDB_Filming_Locations MFL
              INNER JOIN tbl_Movies MOV ON MFL.id_Movies = MOV.id_Movies
              WHERE FL.id_IMDB_Filming_Locations = MFL.id_IMDB_Filming_Locations
             				AND (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
            ) AS NumMovies
          FROM tbl_IMDB_Filming_Locations FL
          WHERE FL.Location LIKE '%${this.searchText}%'
          ${this.sortByNumMovies ? 'ORDER BY NumMovies DESC' : 'ORDER BY Location ASC'}
          `;
      }

      logger.log("search query:", sql);

      this.items = await store.db.fireProcedureReturnAll(sql, []);

      this.isLoading = false;
    },

    onItemClicked(item) {
      if (this.searchMode === "companies") {
        eventBus.showCompanyDialog(item);
      }

      if (this.searchMode === "persons") {
        eventBus.showPersonDialog(item);
      }

      if (this.searchMode === "plot-keywords") {
        eventBus.showPlotKeywordDialog({
          id_IMDB_Plot_Keywords: item.id,
          Keyword: item.name
        });
      }

      if (this.searchMode === "filming-locations") {
        eventBus.showFilmingLocationDialog({
          id_IMDB_Filming_Locations: item.id,
          Location: item.name
        });
      }
    }
  },

  created() {
    // lodash debounced functions
    eventBus.$on("personDialogConfirm", () => {
      this.onCancelClick();
    });
    eventBus.$on("companyDialogConfirm", () => {
      this.onCancelClick();
    });
    eventBus.$on("plotKeywordDialogConfirm", () => {
      this.onCancelClick();
    });
    eventBus.$on("filmingLocationDialogConfirm", () => {
      this.onCancelClick();
    });
  },

  beforeDestroy() {
    eventBus.$off("personDialogConfirm");
  }
};
</script>

<style scoped>
.item {
  margin-left: 0px;
  margin-top: 4px;
}
</style>