<template>
  <div style="width: 100%; height: 100%; display: flex; flex-direction: column">
    <div style="width: 100%; height: 100%; display: flex; flex-direction: column">
      <h1 style="margin-left: 8px">{{ $t("Home") }}</h1>
      <v-row dense style="margin-left: 4px; margin-right: 4px; flex-grow: 0">
        <v-col v-for="item in items" v-bind:key="item.id" v-on:click="onItemClick(item.id)" cols="12" lg="4" md="6">
          <v-card dark flat hover class="mk-clickable" style="min-height: 130px">
            <!-- :color="item.color" -->
            <div class="d-flex flex-no-wrap justify-space-between">
              <div>
                <v-card-title class="headline" style="padding-bottom: 8px">
                  <v-icon left>{{ item.icon }}</v-icon>
                  {{ $t(`${item.text}`) }}
                  <v-progress-linear
                    v-if="item.fetchNumMovies && item.isFetchingNumMovies"
                    color="red accent-0"
                    indeterminate
                    rounded
                    height="3"
                  ></v-progress-linear>
                </v-card-title>

                <v-card-text class="mk-light-grey" style="padding-bottom: 4px">
                  <p
                    v-if="item.id === 'movies' && item.fetchNumMovies && !item.isFetchingNumMovies"
                    style="height: 22px; margin-bottom: 22px"
                  >
                    {{ item.numMovies }}
                    {{ item.numMovies == 1 ? $t("movie") : $t("movies") }}
                  </p>
                  <p
                    v-if="item.id === 'series' && item.fetchNumMovies && !item.isFetchingNumMovies"
                    style="height: 22px; margin-bottom: 0px"
                  >
                    {{ item.numSeries }}
                    {{ item.numSeries == 1 ? $t("series_singular") : $t("series_plural") }}
                  </p>
                  <p
                    v-if="item.id === 'series' && item.fetchNumMovies && !item.isFetchingNumMovies"
                    style="height: 22px; margin-bottom: 0px"
                  >
                    {{ item.numEpisodes }}
                    {{ item.numEpisodes == 1 ? $t("episode") : $t("episodes") }}
                  </p>
                  <p v-if="item.size" style="margin-bottom: 0px">{{ Humanize().fileSize(item.size) }}</p>
                </v-card-text>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>
    <v-spacer></v-spacer>
    <div style="display: flex; justify-content: flex-end">
      <div>
        Discuss Media Hoarder on
        <a
          href="https://github.com/theMK2k/Media-Hoarder/discussions"
          target="_blank"
          rel="noreferrer noopener nofollow"
          >GitHub</a
        >
      </div>
    </div>
  </div>
</template>

<script>
import * as store from "@/store";
import { eventBus } from "@/main";

import * as Humanize from "humanize-plus";

const logger = require("../helpers/logger");

export default {
  data: () => ({
    items: [
      {
        icon: "mdi-settings",
        text: "Settings",
        id: "settings",
        fetchNumMovies: false,
        isFetchingNumMovies: false,
      },
      {
        icon: "mdi-movie",
        text: "Movies",
        id: "movies",
        size: 0,
        fetchNumMovies: true,
        numMovies: null,
        isFetchingNumMovies: true,
      },
      {
        icon: "mdi-television",
        text: "Series",
        id: "series",
        size: 0,
        fetchNumMovies: true,
        numMovies: null,
        numSeries: null,
        numEpisodes: null,
        isFetchingNumMovies: true,
      },
    ],
  }),

  methods: {
    Humanize() {
      return Humanize;
    },

    onItemClick(itemid) {
      if (!itemid) {
        return;
      }

      if (itemid == "movies") {
        return store.routeTo(this.$router, "/medialist/movies");
      }

      if (itemid == "series") {
        return store.routeTo(this.$router, "/medialist/series");
      }

      if (itemid == "settings") {
        return store.routeTo(this.$router, "/settings");
      }
    },

    async fetchNumMovies() {
      try {
        for (let i = 0; i < this.items.length; i++) {
          const item = this.items[i];

          if (item.fetchNumMovies) {
            item.isFetchingNumMovies = true;
            if (item.id == "movies") {
              item.numMovies = await store.fetchNumMovies(item.id);
            }
            if (item.id == "series") {
              const { numSeries, numEpisodes } = await store.fetchNumSeriesAndEpisodes(item.id);
              item.numSeries = numSeries;
              item.numEpisodes = numEpisodes;
            }
            item.isFetchingNumMovies = false;
          }
        }

        const collectionSizes = await store.getCollectionsSizes();
        logger.log("[fetchNumMovies] collectionSizes:", collectionSizes);
        this.items.find((item) => item.id === "movies").size = collectionSizes.Size_Movies;
        this.items.find((item) => item.id === "series").size = collectionSizes.Size_Series;
        logger.log("[fetchNumMovies] this.items:", this.items);
      } catch (e) {
        logger.log("[fetchNumMovies] ERROR:", e);
      }
    },
  },

  // Lifecycle Hooks
  created() {
    if (store.db) {
      this.fetchNumMovies();
    }

    eventBus.$on("dbInitialized", () => {
      this.fetchNumMovies();
    });

    eventBus.$on("rescanFinished", () => {
      this.fetchNumMovies();
    });
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>
