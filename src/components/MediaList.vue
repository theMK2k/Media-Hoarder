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
            <v-card dark flat hover>
              <v-list-item three-line>
                <v-list-item-avatar size="125" tile>
                  <v-img v-bind:src="item.IMDB_posterSmall_URL"></v-img>
                </v-list-item-avatar>

                <v-list-item-content class="align-self-start">
                  <v-row>
                    <div style="margin-left: 16px">
                      <v-list-item-title
                        class="headline mb-2"
                      >{{ item.Name }} {{ item.yearDisplay }}</v-list-item-title>

                      <v-list-item-subtitle>{{ item.Name2 }}</v-list-item-subtitle>
                    </div>
                    <div class="flex-grow-1"></div>
                    <div>
                      <div class="headline mb-2" style="margin-right: 16px; margin-left: 16px; margin-bottom: 0px!important">
                        <v-icon small color="amber" style="padding-bottom: 4px">mdi-star</v-icon>
                        {{item.IMDB_ratingDisplay}}
                      </div>
                      <v-row>
                        <div class="flex-grow-1"></div>
                        <div style="margin-right: 26px; padding: 0px!important">
                          <v-icon small v-for="i in 5" v-bind:key="i" v-bind:color="(item.Rating > (i - 1) ? 'amber' : (item.Rating > 0 ? 'white' : 'grey'))" v-on:click="changeRating(item, i)">mdi-star</v-icon>
                        </div>
                      </v-row>
                    </div>
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
import { eventBus } from "@/main";
import * as helpers from "@/helpers/helpers";

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
