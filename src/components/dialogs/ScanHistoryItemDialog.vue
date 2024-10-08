<!-- This is a generalized dialog for properties like age rating, audio format, genre etc. -->
<template>
  <v-dialog
    v-model="show"
    persistent
    max-width="90%"
    v-on:keydown.escape="onEscapePressed"
    scrollable
    style="z-index: 300 !important"
  >
    <v-card dark flat v-bind:ripple="false">
      <v-card-title>
        {{ $t("Media Scan Details") }}
        <v-progress-linear v-if="isLoading" color="red accent-0" indeterminate rounded height="3"></v-progress-linear>
      </v-card-title>

      <v-card-text v-if="scanProcessData.scanProcessDetailsArray">
        <div v-if="scanProcessData.scanProcessDetailsArray.length === 0">
          {{ $t("no changes") }}
        </div>
        <div
          v-for="actionType of scanProcessData.scanProcessDetailsArray"
          v-bind:key="actionType.actionType"
          style="margin-bottom: 4px"
        >
          <div class="mk-clickable-lightgrey-white" v-on:click="toggleBoolean(actionType, 'showDetails')">
            <!-- Added/Removed/Updated Movies/Series: 5-->
            {{
              $t(`ScanProcessSummaryCategories.${actionType.actionType}`) +
              ": " +
              actionType.items.length +
              (!actionType.showDetails ? " »" : "")
            }}
          </div>
          <div v-if="actionType.showDetails" style="margin-left: 8px">
            <div v-for="actionItem of actionType.items" v-bind:key="actionItem.Path">
              <div
                v-bind:class="{ 'mk-clickable-lightgrey-white': totalCountSubItems(actionItem) }"
                v-on:click="toggleBoolean(actionItem, 'showDetails')"
              >
                <!-- Path of series/movie -->
                {{ actionItem.Path + (totalCountSubItems(actionItem) && !actionItem.showDetails ? " »" : "") }}
              </div>
              <div v-if="actionItem.showDetails">
                <div v-for="childItem of actionItem.ADD_EPISODE" v-bind:key="childItem.Path" style="margin-left: 8px">
                  {{ $t("added") + ": " + childItem.ShortPath }}
                </div>
                <div
                  v-for="childItem of actionItem.REMOVE_EPISODE"
                  v-bind:key="childItem.Path"
                  style="margin-left: 8px"
                >
                  {{ $t("removed") + ": " + childItem.ShortPath }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </v-card-text>

      <v-card-actions>
        <!-- Button: Close -->
        <v-btn class="xs-fullwidth" color="secondary" v-on:click.native="onCloseClick" style="margin-left: 8px">{{
          $t("Close")
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
//const sqlString = require("sqlstring-sqlite");
//const { shell } = require("@electron/remote");

import * as _ from "lodash";

import * as store from "@/store";
//import * as helpers from "@/helpers/helpers";
const logger = require("../../helpers/logger");

export default {
  props: ["show", "id_Scan_Processes"],

  components: {},

  computed: {},

  watch: {
    id_Scan_Processes: function () {
      this.init();
    },
  },

  data() {
    return {
      isLoading: false,
      scanProcessData: {},
    };
  },

  methods: {
    async init() {
      try {
        logger.log(`[ScanHistoryItemDialog init] START, this.id_Scan_Processes:`, this.id_Scan_Processes);

        this.isLoading = true;

        if (!this.id_Scan_Processes) {
          this.scanProcessData = {};
          return;
        }

        this.scanProcessData = await store.getScanProcessDetails(this.id_Scan_Processes);

        logger.log(`[ScanHistoryItemDialog init] this.scanProcessData:`, this.scanProcessData);
      } catch (error) {
        logger.error(`[ScanHistoryItemDialog init] Error:`, error);
      } finally {
        this.isLoading = false;
      }
    },

    onCloseClick() {
      this.$emit("close");
    },

    onEscapePressed() {
      this.onCloseClick();
    },

    $local_t(key, payload) {
      return this.$t(key, payload);
    },

    toggleBoolean(item, key) {
      logger.log(`[ScanHistoryItemDialog toggleBoolean]`, { item, key });
      this.$set(item, key, !item[key]);
    },

    totalCountSubItems(item) {
      let totalCountSubItems = 0;
      for (const actionType of [
        "ADD_EXTRA",
        "ADD_EPISODE",
        "ADD_EPISODE_EXTRA",
        "REMOVE_EXTRA",
        "REMOVE_EPISODE",
        "REMOVE_EPISODE_EXTRA",
      ]) {
        if (item[actionType]) {
          totalCountSubItems += item[actionType].length;
        }
      }

      return totalCountSubItems;
    },
  },

  // ### Lifecycle Hooks ###
  created() {
    // lodash debounced functions
    this.debouncedInit = _.debounce(this.init, 10);
  },
};
</script>

<style scoped>
.btn {
  margin: 2px;
}

.input-group--text-field {
  padding-left: 16px;
  /* padding-top: 0px; */
}

@media screen and (max-width: 599px) {
  .input-group--text-field {
    padding-left: 16px;
    padding-top: 0px;
  }
}
</style>
