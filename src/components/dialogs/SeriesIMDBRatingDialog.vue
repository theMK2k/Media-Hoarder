<template>
  <v-dialog v-model="show" scrollable persistent v-on:keydown.escape="onCloseClick">
    <v-card dark flat v-bind:ripple="false">
      <v-card-title>
        <div class="headline" style="width: 100%; font-size: 1.17em">{{ $t("IMDB Ratings for") }} {{ title }}</div>
        <v-progress-linear v-if="isLoading" color="red accent-0" indeterminate rounded height="3"></v-progress-linear>
      </v-card-title>
      <v-card-text>
        <table v-if="data" style="margin-left: auto; margin-right: auto">
          <thead>
            <tr>
              <th></th>
              <th
                v-for="season of data.seasons"
                v-bind:key="season.displayText"
                style="font-weight: bold; color: white"
              >
                {{ season.displayText }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="episode of data.episodes" v-bind:key="episode.displayText">
              <td style="font-weight: bold">
                {{ episode.displayText }}
              </td>
              <td v-for="season of data.seasons" v-bind:key="season.displayText">
                <v-menu
                  v-if="
                    data.mediaItems[season.season] &&
                    data.mediaItems[season.season][episode.episode] &&
                    data.mediaItems[season.season][episode.episode].IMDB_rating_defaultFormatted
                  "
                  v-model="data.mediaItems[season.season][episode.episode].showDetails"
                  v-bind:close-on-click="true"
                  v-bind:close-on-content-click="false"
                  bottom
                  right
                  transition="scale-transition"
                  origin="top left"
                >
                  <template v-slot:activator="{ on }">
                    <div
                      v-on="on"
                      v-on:click="onShowMediaItemDetails(data.mediaItems[season.season][episode.episode])"
                      v-bind:class="
                        helpers.getIMDBRatingClass(data.mediaItems[season.season][episode.episode].IMDB_rating_default)
                      "
                      class="mk-clickable-white"
                    >
                      {{ data.mediaItems[season.season][episode.episode].IMDB_rating_defaultFormatted }}
                    </div>
                  </template>
                  <v-card>
                    <v-list-item three-line style="padding-left: 0px; padding-right: 0px">
                      <mk-media-item-card
                        v-bind:mediaItem="data.mediaItems[season.season][episode.episode]"
                      ></mk-media-item-card>
                    </v-list-item>

                    <v-card-actions>
                      <v-spacer></v-spacer>
                      <v-btn
                        color="secondary"
                        v-on:click.stop="data.mediaItems[season.season][episode.episode].showDetails = false"
                        >{{ $t("Close") }}</v-btn
                      >
                    </v-card-actions>
                  </v-card>
                </v-menu>
              </td>
            </tr>
          </tbody>
        </table>
      </v-card-text>
      <v-card-actions>
        <v-col sm="12">
          <v-row style="margin-top: 8px">
            <v-btn class="xs-fullwidth" color="secondary" v-on:click.native="onCloseClick" style="margin-left: 8px">{{
              $t("Close")
            }}</v-btn>
          </v-row>
        </v-col>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
// import { eventBus } from "@/main";
const logger = require("../../helpers/logger");
import * as helpers from "@/helpers/helpers";
import * as store from "@/store";

import MediaItemCard from "@/components/shared/MediaItemCard.vue";

export default {
  components: {
    "mk-media-item-card": MediaItemCard,
  },

  props: ["show", "isLoading", "data", "title"],

  data() {
    return {};
  },

  computed: {
    helpers() {
      return helpers;
    },
  },

  methods: {
    onCloseClick() {
      this.$emit("close");
    },

    $local_t(key, payload) {
      return this.$t(key, payload);
    },

    async onShowMediaItemDetails(mediaItem) {
      // completely fetch mediaItem details
      const result = await store.fetchMedia({
        $MediaType: "series",
        arr_id_Movies: [mediaItem.id_Movies],
        minimumResultSet: false,
        $t: this.$local_t,
        filters: { filterSettings: {} },
        arr_IMDB_tconst: null,
        Series_id_Movies_Owner: mediaItem.Series_id_Movies_Owner,
        specificMediaType: "Episodes",
      });

      logger.log("[onShowMediaItemDetails] result:", result);

      if (!result || !result.length) return;

      Object.keys(result[0]).forEach((key) => {
        mediaItem[key] = result[0][key];
      });
    },
  },

  // ### Lifecycle Hooks ###
  created() {},
};
</script>

<style scoped>
table {
  margin-top: 0px;
}

td {
  min-width: 40px;
  min-height: 40px;
  color: white;
  text-align: center;
}

.rating-demographics-content {
  text-align: center;
}

.rating-demographics-header {
  text-align: center;
  color: white;
  min-height: 30px;
  min-width: 60px;
}

.three-columns {
  min-width: 130px;
}

.btn {
  margin: 2px;
}

.input-group--text-field {
  padding-left: 16px;
  /* padding-top: 0px; */
}
</style>
