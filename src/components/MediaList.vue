<template>
  <div>
    <h1>
      <v-btn text v-on:click="$router.go(-1)">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      {{ mediatype.toUpperCase() }}
      <v-container class="pa-2" fluid>
        <v-row>
          <v-col v-for="(item, i) in items" :key="i">
            {{item.FileName}}
            <v-card dark>
              <v-list-item three-line>
                <v-list-item-content class="align-self-start">
                  <v-list-item-title class="headline mb-2" v-text="'TODO... Headline'"></v-list-item-title>

                  <v-list-item-subtitle v-text="'TODO... Subtitle'"></v-list-item-subtitle>
                </v-list-item-content>

                <v-list-item-avatar size="125" tile>
                  <v-img v-bind:src="getPath(item.IMDB_posterSmall_URL)"></v-img>
                </v-list-item-avatar>
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
import * as helpers from '@/helpers/helpers';

const logger = require("loglevel");

export default {
  data: () => ({
    smallPosterImgSrc: null,
    items: []
  }),

  props: ["mediatype"],

  methods: {
    getPath(relativePath) {
      if (!relativePath) {
        return null;
      }
      return helpers.getPath(relativePath);
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
