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
      <v-row align="center" style="max-width: 650px; align: right">
        <!-- <v-text-field
          :append-icon-cb="() => {}"
          placeholder="Search..."
          single-line
          append-icon="mdi-magnify"
          color="white"
          hide-details
        ></v-text-field> -->
				scanning...
      </v-row>
    </v-app-bar>

    <v-content>
      <!-- <v-container class="fill-height">
        <v-row justify="center" align="center">
          <v-col class="shrink">
            <router-view></router-view>
          </v-col>
        </v-row>
      </v-container> -->
      <v-container style="max-width: 100%!important">
        <router-view></router-view>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
import * as store from './store';

const fs = require("fs");

export default {
  props: {
    source: String
  },
  data: () => ({
    drawer: null,
    items: [
      { icon: "mdi-movie", text: "My Movies", id: "movies" },
      { icon: "mdi-television", text: "My TV Shows", id: "tv" }
      /*
				{ icon: 'history', text: 'History' },
        { icon: 'featured_play_list', text: 'Playlists' },
				{ icon: 'watch_later', text: 'Watch Later' },
*/
    ],
    items2: [
      { picture: 28, text: "Joseph" },
      { picture: 38, text: "Apple" },
      { picture: 48, text: "Xbox Ahoy" },
      { picture: 58, text: "Nokia" },
      { picture: 78, text: "MKBHD" }
    ]
  }),

  methods: {
		goto(itemid) {
			if (!itemid) {
				return;
			}

			if (itemid == 'movies') {
	      return this.$router.push("/medialist/movies");
			}

			if (itemid == 'tv') {
	      return this.$router.push("/medialist/tv");
			}
		},
		openSettings() {
      return this.$router.push("/settings");
    }
  },

  // ### LifeCycleHooks ###
  created() {
    this.$vuetify.theme.dark = true;

    // const result = fs.readdirSync("c:\\");
    // console.log(result);
  }
};
</script>
