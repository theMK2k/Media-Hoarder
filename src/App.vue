<template>
  <v-app id="inspire">
    <v-navigation-drawer v-model="drawer" app clipped>
      <v-list dense>
        <v-list-item v-for="item in items" :key="item.text" @click="goto(item.id)">
          <v-list-item-action>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>{{ item.text }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-subheader class="mt-4 grey--text text--darken-1">FILTERS (TODO)</v-subheader>

        <!--
        <v-subheader class="mt-4 grey--text text--darken-1">SUBSCRIPTIONS</v-subheader>
        <v-list>
          <v-list-item
            v-for="item in items2"
            :key="item.text"
            @click=""
          >
            <v-list-item-avatar>
              <img
                :src="`https://randomuser.me/api/portraits/men/${item.picture}.jpg`"
                alt=""
              >
            </v-list-item-avatar>
            <v-list-item-title v-text="item.text"></v-list-item-title>
          </v-list-item>
        </v-list>
        -->
        <!--
				<v-list-item
          class="mt-4"
          @click=""
        >
          <v-list-item-action>
            <v-icon color="grey darken-1">mdi-plus-circle-outline</v-icon>
          </v-list-item-action>
          <v-list-item-title class="grey--text text--darken-1">Browse Channels</v-list-item-title>
        </v-list-item>
        -->
        <v-list-item @click="openSettings">
          <v-list-item-action>
            <v-icon color="grey darken-1">mdi-settings</v-icon>
          </v-list-item-action>
          <v-list-item-title class="grey--text text--darken-1">Settings</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar app clipped-left color="red" dense>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-icon class="mx-4">fab fa-youtube</v-icon>
      <v-toolbar-title class="mr-12 align-center">
        <span class="title">MediaBox</span>
      </v-toolbar-title>
      <div class="flex-grow-1"></div>
      <v-row
        align-content="end"
        justify="end"
        style="max-width: 650px; text-align: right!important"
      >
        <div v-if="scanInfo.show">
          <p style="margin: 0px!important">{{scanInfo.header}}</p>
          <p style="margin: 0px!important; font-size: 12px">{{scanInfo.text}}</p>
        </div>

        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn text v-on:click="rescan">
              <v-icon>mdi-reload</v-icon>
            </v-btn>
          </template>
          <span>Tooltip</span>
        </v-tooltip>

        <!-- <v-text-field
          :append-icon-cb="() => {}"
          placeholder="Search..."
          single-line
          append-icon="mdi-magnify"
          color="white"
          hide-details
        ></v-text-field>-->
      </v-row>
    </v-app-bar>

    <v-content>
      <!-- <v-container class="fill-height">
        <v-row justify="center" align="center">
          <v-col class="shrink">
            <router-view></router-view>
          </v-col>
        </v-row>
      </v-container>-->
      <v-container style="max-width: 100%!important">
        <router-view></router-view>
      </v-container>
    </v-content>

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
  </v-app>
</template>

<script>
// eslint-disable-next-line no-unused-var
import * as store from "@/store";
import { eventBus } from "@/main";
const logger = require("loglevel");

export default {
  props: {
    source: String
  },
  data: () => ({
    drawer: null,
    items: [
      { icon: "mdi-movie", text: "Movies", id: "movies" },
      { icon: "mdi-television", text: "TV", id: "tv" }
    ],

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
		
		rescan() {
			store.default.rescan(true);
		}
  },

  // ### LifeCycleHooks ###
  created() {
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
			this.scanInfo.header = header;
			this.scanInfo.details = details;
			this.scanInfo.show = true;
		});

		eventBus.$on("scanInfoOff", () => {
			this.scanInfo.show = false;
		});
	}
};
</script>
<style>
h1 {
  margin-bottom: 16px;
}
</style>