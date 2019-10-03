<template>
  <v-app id="inspire">
    <!-- SIDEBAR -->
    <v-navigation-drawer v-model="drawer" app clipped>
      <v-list dense>
        <v-list-item v-on:click="toggleRescan">
          <v-list-item-action>
            <v-icon v-show="!isScanning">mdi-reload</v-icon>
            <v-icon v-show="isScanning">mdi-cancel</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title v-show="!isScanning">Rescan all media</v-list-item-title>
            <v-list-item-title v-show="isScanning">Cancel Rescan</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item v-for="item in items" :key="item.text" @click="goto(item.id)">
          <v-list-item-action>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>{{ item.text }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-subheader class="mt-4 lightgrey--text">FILTERS</v-subheader>
        <v-expansion-panels accordion multiple>
          <v-expansion-panel
            v-show="$shared.filterSourcePaths && $shared.filterSourcePaths.length > 0"
            style="padding: 0px!important"
          >
            <v-expansion-panel-header style="color: lightgrey; padding: 8px!important">Source Paths</v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-checkbox
                v-for="sourcePath in $shared.filterSourcePaths"
                v-bind:key="sourcePath.Description"
                v-bind:label="sourcePath.Description"
                v-model="sourcePath.Selected"
								v-on:click.native="filtersChanged"
                style="margin: 0px"
              ></v-checkbox>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>

        <v-list-item @click="openSettings">
          <v-list-item-action>
            <v-icon style="color: lightgrey">mdi-settings</v-icon>
          </v-list-item-action>
          <v-list-item-title style="color: lightgrey">Settings</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- TOP BAR -->
    <v-app-bar app clipped-left color="red" dense>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title class="mr-12 align-center noshrink">
        <span class="title">MediaBox</span>
      </v-toolbar-title>
      <div class="flex-grow-1"></div>
      <v-row align-content="end" justify="end" style="text-align: right!important">
        <v-text-field
          :append-icon-cb="() => {}"
          placeholder="Search..."
          single-line
          append-icon="mdi-magnify"
          color="white"
          hide-details
          v-model="searchText"
        ></v-text-field>
      </v-row>
    </v-app-bar>

    <!-- CONTENT -->
    <v-content>
      <v-container style="max-width: 100%!important">
        <router-view></router-view>
      </v-container>
    </v-content>

    <!-- SMACK BAR -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout">
      <div>
        <strong v-if="snackbar.details && snackbar.details.length > 0">{{ snackbar.text }}</strong>
        <div v-if="!snackbar.details || snackbar.details.length === 0">{{ snackbar.text }}</div>
        <div
          v-for="(snackbardetail, index) in snackbar.details"
          v-bind:key="index"
          style="padding-left: 8px"
        >{{snackbardetail}}</div>
      </div>
      <v-spacer />
      <v-btn dark text @click="snackbar.show = false">Close</v-btn>
    </v-snackbar>

    <!-- BOTTOM BAR -->
    <v-bottom-navigation
      fixed
      dark
      v-show="scanInfo.show"
      style="height: auto; padding: 4px 8px 4px 20px "
    >
      <!-- v-model="bottomNav" -->
      <v-row align-content="start" justify="start">
        <!--  style="text-align: right!important" -->
        <div v-if="scanInfo.show">
          <p style="margin: 0px!important">{{scanInfo.header}}</p>
          <p
            style="margin: 0px!important; font-size: 12px;text-overflow: ellipsis; white-space: nowrap; overflow: hidden;"
          >{{scanInfo.details}}</p>
        </div>
        <div class="flex-grow-1"></div>
        <v-btn text v-on:click="cancelRescan">
          <v-icon>mdi-cancel</v-icon>
        </v-btn>
      </v-row>
    </v-bottom-navigation>
  </v-app>
</template>

<script>
import * as _ from "lodash";
// eslint-disable-next-line no-unused-var
import * as store from "@/store";
import { shared } from "@/shared";
import { eventBus } from "@/main";
const logger = require("loglevel");

export default {
  props: {
    source: String
  },
  data: () => ({
    shared,
    drawer: null,
    items: [
      { icon: "mdi-movie", text: "Movies", id: "movies" },
      { icon: "mdi-television", text: "TV", id: "tv" }
    ],

    searchText: null,

    isScanning: false,

    scanInfo: {
      show: false,
      header: "",
      details: ""
    },

    snackbar: {
      show: false,
      color: "",
      timeout: 6000,
      text: "",
      details: []
    }
  }),

  watch: {
    // LEARNING: there is a difference with "this" in name: function(){} and name: () => {}
    searchText: function(newValue, oldValue) {
      logger.log("searchText old:", oldValue, "new:", newValue);
      this.debouncedEventBusSearchTextChanged(newValue);
    }
  },

  computed: {
    filterSourcePaths() {
      return this.$shared.filterSourcePaths;
    }
  },

  methods: {
    goto(itemid) {
      if (!itemid) {
        return;
      }

      if (itemid == "movies") {
        return this.$router.push("/medialist/movies");
      }

      if (itemid == "tv") {
        return this.$router.push("/medialist/tv");
      }
    },
    openSettings() {
      return this.$router.push("/settings");
    },
    toggleRescan() {
      if (!store.isScanning) {
        store.rescan(true);
      } else {
        store.abortRescan();
      }
    },
    cancelRescan() {
      store.abortRescan();
    },

    eventBusSearchTextChanged: function(searchText) {
      eventBus.searchTextChanged(searchText);
		},
		
    eventBusRefetchMedia: function() {
			eventBus.refetchMedia();
		},
		
		filtersChanged: function() {
			logger.log('filters changed this.$shared:', this.$shared);
			this.debouncedEventBusRefetchMedia();
		}
  },

  // ### LifeCycleHooks ###
  created() {
    logger.log("shared:", this.shared);

    this.$vuetify.theme.dark = true;

    eventBus.$on("showSnackbar", ({ color, timeout, textOrErrorObject }) => {
      logger.debug("snackbar called:", textOrErrorObject);
      this.snackbar.details = [];
      this.snackbar.color = color;
      this.snackbar.timeout = timeout;

      if (
        typeof textOrErrorObject === "string" ||
        textOrErrorObject instanceof String
      ) {
        this.snackbar.text = textOrErrorObject;
      } else if (textOrErrorObject.error) {
        this.snackbar.text = textOrErrorObject.error.message;

        if (
          typeof textOrErrorObject.error.details === "string" ||
          textOrErrorObject.error.details instanceof String
        ) {
          this.snackbar.details.push(textOrErrorObject.error.details);
        } else {
          if (Array.isArray(textOrErrorObject.error.details)) {
            textOrErrorObject.error.details.forEach(detail => {
              if (
                typeof textOrErrorObject.error.details === "string" ||
                textOrErrorObject.error.details instanceof String
              ) {
                this.snackbar.details.push(detail);
              }
            });
          }
        }
      } else {
        this.snackbar.text = "<unknown text>";
      }

      this.snackbar.show = true;
    });

    eventBus.$on("scanInfoShow", ({ header, details }) => {
      this.scanInfo = {
        header,
        details,
        show: true
      };
    });

    eventBus.$on("rescanStarted", () => {
      this.isScanning = true;
    });

    eventBus.$on("rescanStopped", () => {
      this.isScanning = false;
    });

    eventBus.$on("scanInfoOff", () => {
      this.scanInfo.show = false;
    });

    // eventBus.scanInfoShow('KILLME', 'Asterix und das Geheimnis des Zaubertranks ~ Astérix - Le secret de la potion magique (De)(BD)[2018][Adventure, Animation, Comedy][6.9 @ 3074][tt8001346].mkv');

    // lodash debounced functions
    this.debouncedEventBusSearchTextChanged = _.debounce(
      this.eventBusSearchTextChanged,
      250
		);
		
    this.debouncedEventBusRefetchMedia = _.debounce(
      this.eventBusRefetchMedia,
      1000
    );
  }
};
</script>
<style>
h1 {
  margin-bottom: 16px;
}

.noshrink {
  flex-shrink: 0 !important;
}
</style>