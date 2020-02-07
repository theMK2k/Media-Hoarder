<template>
  <v-dialog
    v-model="show"
    persistent
    max-width="1000px"
    v-on:keydown.escape="onCancelClick"
  >
    <v-card dark flat v-bind:ripple="false">
      <v-card-title>
        <div class="headline" style="width: 100%; font-size: 1.17em">{{ title }}</div>
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
        >{{ item.name }} ({{item.NumMovies}})</v-row>
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
// import * as helpers from "@/helpers/helpers";
const logger = require("loglevel");

import { eventBus } from "@/main";

export default {
  props: ["show", "title", "searchMode"],

  data() {
    return {
      items: [],
      searchText: ""
    };
  },

  watch: {
    searchText: function(newValue) {
      this.debouncedSearchTextChanged(newValue);
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

    async searchTextChanged(searchText) {
      if (!searchText) {
        this.items = [];
        return;
      }

      let sql = "";
      if (this.searchMode === "companies") {
        // todo filter: (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
        sql = `
				SELECT
							Company_Name AS name
							, (SELECT COUNT(1) FROM (
									SELECT DISTINCT
										id_Movies
									FROM tbl_Movies_IMDB_Companies MC2
									WHERE MC2.Company_Name = MC.Company_Name
								)) AS NumMovies
					FROM tbl_Movies_IMDB_Companies MC
					WHERE Company_Name LIKE '${searchText}%'
					GROUP BY Company_Name`;
      }

      if (this.searchMode === "persons") {
        // todo filter: (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
        sql = `
				SELECT
							Person_Name AS name
							, IMDB_Person_ID AS id
							, (SELECT COUNT(1) FROM (
									SELECT DISTINCT
										id_Movies
									FROM tbl_Movies_IMDB_Credits MC2
									WHERE MC2.Person_Name = MC.Person_Name
								)) AS NumMovies
					FROM tbl_Movies_IMDB_Credits MC
					WHERE Person_Name LIKE '${searchText}%'
					GROUP BY Person_Name`;
      }

      logger.log("search query:", sql);

      this.items = await store.db.fireProcedureReturnAll(sql, []);
    },

    onItemClicked(item) {
      if (this.searchMode === "companies") {
        eventBus.showCompanyDialog(item);
      }

      if (this.searchMode === "persons") {
        eventBus.showPersonDialog(item);
      }
    }
  },

  created() {
    // lodash debounced functions
    this.debouncedSearchTextChanged = _.debounce(this.searchTextChanged, 500);

    eventBus.$on("personDialogConfirm", () => {
      this.onCancelClick();
    });
  }
};
</script>

<style scoped>
.item {
  margin-left: 0px;
  margin-top: 4px;
}
</style>