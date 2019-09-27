<template>
  <div>
    <h1>
      <v-btn text v-on:click="$router.go(-1)">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      {{ mediatype.toUpperCase() }}
      <v-container class="pa-2" fluid>
        <v-row v-for="(item, i) in items" :key="i">
          <v-col>
            <v-card dark flat hover v-on:click="selectItem(item)">
              <v-list-item three-line style="padding-left: 0px">
                <v-list-item-avatar tile style="margin: 6px; height: 150px; width: 120px">
                  <v-img contain gradient v-bind:src="item.IMDB_posterSmall_URL"></v-img>
                  <!-- TODO: implement lazy-src -->
                </v-list-item-avatar>
                <v-list-item-content
                  class="align-self-start"
                  style="padding-top: 6px; padding-bottom: 6px"
                >
                  <v-row>
                    <div style="margin-left: 16px">
                      <v-list-item-title
                        class="headline mb-2"
                      >{{ item.Name }} {{ item.yearDisplay }}</v-list-item-title>

                      <v-list-item-subtitle>{{ item.Name2 }}</v-list-item-subtitle>
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
                  <v-row v-if="item.selected" style="margin-left: 4px; margin-right: 6px">
                    <div style="font-size: .875rem; font-weight: normal"
                    >After the devastating events of Avengers: Infinity War (2018), the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos' actions and restore balance to the universe.</div>
                  </v-row>
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
// import { eventBus } from "@/main";
// import * as helpers from "@/helpers/helpers";

const logger = require("loglevel");

export default {
  data: () => ({
    smallPosterImgSrc: null,
    items: []
  }),

  props: ["mediatype"],

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
    }
  },

  created() {
    (async () => {
      this.items = await store.fetchMedia(this.mediatype);
      logger.log("items:", this.items);
    })();
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
