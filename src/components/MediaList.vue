<template>
  <div>
    <h1>
      <v-btn text v-on:click="$router.go(-1)">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      {{ mediatype.toUpperCase() }}
      <v-container class="pa-2" fluid>
        <v-row v-for="(item, i) in itemsFiltered" :key="i">
          <v-col>
            <v-card dark flat hover v-bind:ripple="false" v-on:click="selectItem(item)">
              <v-list-item three-line style="padding-left: 0px">
                <div>
                  <v-list-item-avatar
                    tile
                    style="margin: 6px; height: 150px; width: 120px"
                    v-on:click.stop="launch(item)"
                  >
                    <v-img contain v-bind:src="item.IMDB_posterSmall_URL"></v-img>
                    <!-- TODO: implement lazy-src -->
                  </v-list-item-avatar>
                </div>
                <v-list-item-content
                  class="align-self-start"
                  style="padding-top: 6px; padding-bottom: 6px"
                >
                  <v-col style="padding: 0px!important">
                  <v-row>
                    <div style="margin-left: 16px">
                      <v-list-item-title
                        class="headline mb-2"
                        style="margin-bottom: 0px!important"
                      >{{ item.Name }} {{ item.yearDisplay }}</v-list-item-title>

                      <v-list-item-subtitle
                        v-if="item.Name2"
                        style="margin-bottom: 4px"
                      >{{ item.Name2 }}</v-list-item-subtitle>

                      <div style="font-size: .875rem; font-weight: normal">
                        <span v-if="item.MI_Quality">{{ item.MI_Quality }} | </span>
                        <span v-if="item.AgeRating">{{ item.AgeRating }} | </span>
                        <span v-if="item.Genres">{{ item.Genres }} | </span>
                        <span v-if="item.AudioLanguages"><v-icon small>mdi-comment-outline</v-icon> {{ item.AudioLanguages }} | </span>
                        <span v-if="item.SubtitleLanguages"><v-icon small>mdi-subtitles-outline</v-icon> {{ item.SubtitleLanguages }} | </span>
                      </div>
                    </div>
                    <div class="flex-grow-1"></div>
                    <div>
                      <div
                        class="headline mb-2"
                        style="margin-right: 16px; margin-left: 16px; margin-bottom: 0px!important"
                      >
                        <v-icon small color="amber" style="padding-bottom: 4px">mdi-star</v-icon>
                        {{item.IMDB_ratingDisplay}}
                      </div>
                      <v-row>
                        <div class="flex-grow-1"></div>
                        <div style="margin-right: 26px; padding: 0px!important">
                          <v-icon
                            small
                            v-for="i in 5"
                            v-bind:key="i"
                            v-bind:color="(item.Rating > (i - 1) ? 'amber' : (item.Rating > 0 ? 'white' : 'grey'))"
                            v-on:click.stop="changeRating(item, i)"
                          >mdi-star</v-icon>
                        </div>
                      </v-row>
                    </div>
                  </v-row>

                  <!-- <v-row style="margin-left: 4px; margin-right: 6px">
                    <div style="font-size: .875rem; font-weight: normal"
                    >{{ item.Genres }}</div>
                  </v-row>-->

                  <v-row v-if="item.IMDB_plotSummary" style="margin-left: 4px; margin-right: 6px">
                    <div style="font-size: .875rem; font-weight: normal">{{ item.IMDB_plotSummary }}</div>
                  </v-row>
                  </v-col>
                </v-list-item-content>
              </v-list-item>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </h1>
  </div>
</template>

<script>
import * as store from "@/store";
import { eventBus } from "@/main";
// import * as helpers from "@/helpers/helpers";

const logger = require("loglevel");

export default {
  data: () => ({
    smallPosterImgSrc: null,
    items: [],
    searchText: null
  }),

  props: ["mediatype"],

  computed: {
    itemsFiltered() {
      return this.items.filter(item => {
        let isGood = true;

        if (this.searchText) {
          const searchTextLower = this.searchText.toLowerCase();
          isGood = item.SearchSpace.includes(searchTextLower);
        }

        return isGood;
      });
    }
  },

  methods: {
    changeRating(movie, i) {
      (async () => {
        if (movie.Rating == i) {
          await store.clearRating(movie.id_Movies);
          movie.Rating = null;
        } else {
          await store.setRating(movie.id_Movies, i);
          movie.Rating = i;
        }
      })();
    },

    selectItem(movie) {
      // eventBus.showSnackbar('error', 6000, 'KILLME');
      
      if (movie.selected) {
        movie.selected = false;
      } else {
        this.items.forEach(item => {
          item.selected = false;
        });
        movie.selected = true;
      }

      // TODO: currently needed for changedetection of item.selected (interesting)
      const items = this.items;
      this.items = [];
      this.items = items;
    },

    async launch(movie) {
      await store.launchMovie(movie);
    }
  },

  created() {
    (async () => {
      await store.fetchSourcePathFilter(this.mediatype);
      this.items = await store.fetchMedia(this.mediatype);
      logger.log("items:", this.items);
    })();

    eventBus.$on("searchTextChanged", ({ searchText }) => {
      this.searchText = searchText;
    });
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
