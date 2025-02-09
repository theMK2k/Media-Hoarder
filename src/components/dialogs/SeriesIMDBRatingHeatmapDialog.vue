<template>
  <v-dialog v-model="show" scrollable persistent v-on:keydown.escape="onCloseClick">
    <v-card dark flat v-bind:ripple="false">
      <v-card-title>
        <div class="headline" style="width: 100%; font-size: 1.17em">{{ $t("IMDB Ratings for") }} {{ title }}</div>
        <v-progress-linear v-if="isLoading" color="red accent-0" indeterminate rounded height="3"></v-progress-linear>
      </v-card-title>
      <v-card-text>
        <table v-if="data" style="margin-left: auto; margin-right: auto">
          <!-- header row "   S01 S02 S03" -->
          <thead>
            <tr>
              <th></th>
              <th
                v-for="season of data.seasons"
                v-bind:key="season.displayText"
                style="font-weight: bold; color: white"
                v-bind:style="{
                  color: season.season === hoveredSeason ? '#2196f3' : 'white',
                }"
              >
                {{ season.displayText }}
              </th>
            </tr>
          </thead>
          <tbody>
            <!-- Rows: Bonus Episodes -->
            <tr v-for="bonusEpisode of data.bonusEpisodes" v-bind:key="bonusEpisode.displayText">
              <!-- First Column: label, e.g. "B01", "B02" -->
              <td
                style="font-weight: bold"
                v-bind:style="{
                  color: `B${bonusEpisode.bonusEpisode}` === hoveredEpisode ? '#2196f3' : 'white',
                }"
              >
                {{ bonusEpisode.displayText }}
              </td>
              <!-- Other Columns: the actual bonus episodes -->
              <td v-for="season of data.seasons" v-bind:key="season.displayText">
                <v-menu
                  v-if="
                    data.mediaItems[season.season] && data.mediaItems[season.season][`B${bonusEpisode.bonusEpisode}`]
                  "
                  v-model="data.mediaItems[season.season][`B${bonusEpisode.bonusEpisode}`].showDetails"
                  v-bind:close-on-click="false"
                  v-bind:close-on-content-click="false"
                  bottom
                  right
                  transition="scale-transition"
                  origin="top left"
                >
                  <template v-slot:activator="{ on }">
                    <div
                      v-on="on"
                      v-on:click="
                        onShowMediaItemDetails(data.mediaItems[season.season][`B${bonusEpisode.bonusEpisode}`])
                      "
                      v-on:mouseenter="setHoveredSeasonEpisode(season.season, `B${bonusEpisode.bonusEpisode}`)"
                      v-on:mouseleave="debouncedSetHoveredSeasonEpisode(null, null)"
                      v-bind:class="
                        getEpisodeClasses(
                          data.mediaItems[season.season][`B${bonusEpisode.bonusEpisode}`].IMDB_rating_default,
                          data.mediaItems[season.season][`B${bonusEpisode.bonusEpisode}`].last_access_at
                        )
                      "
                    >
                      {{
                        data.mediaItems[season.season][`B${bonusEpisode.bonusEpisode}`].IMDB_rating_defaultFormatted ||
                        "-"
                      }}
                    </div>
                  </template>
                  <v-card>
                    <v-list-item three-line style="padding-left: 0px; padding-right: 0px">
                      <mk-media-item-card
                        v-bind:mediaItem="data.mediaItems[season.season][`B${bonusEpisode.bonusEpisode}`]"
                        v-bind:isScanning="false"
                        v-bind:isInDialog="true"
                        v-bind:showCloseButton="true"
                        v-on:close="data.mediaItems[season.season][`B${bonusEpisode.bonusEpisode}`].showDetails = false"
                        v-on:mediaItemEvent="onMICmediaItemEvent"
                      ></mk-media-item-card>
                    </v-list-item>
                  </v-card>
                </v-menu>
              </td>
            </tr>
            <tr v-if="data.bonusEpisodes.length">
              <td v-bind:colspan="data.seasons.length + 1">
                <v-divider></v-divider>
              </td>
            </tr>

            <!-- Rows: Episodes -->
            <tr v-for="episode of data.episodes" v-bind:key="episode.displayText">
              <!-- First Column: label, e.g. "E01", "E02" ... -->
              <td
                style="font-weight: bold"
                v-bind:style="{
                  color: `E${episode.episode}` === hoveredEpisode ? '#2196f3' : 'white',
                }"
              >
                {{ episode.displayText }}
              </td>
              <!-- Other Columns: the actual episodes -->
              <td v-for="season of data.seasons" v-bind:key="season.displayText">
                <v-menu
                  v-if="data.mediaItems[season.season] && data.mediaItems[season.season][episode.episode]"
                  v-model="data.mediaItems[season.season][episode.episode].showDetails"
                  v-bind:close-on-click="false"
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
                      v-on:mouseenter="setHoveredSeasonEpisode(season.season, `E${episode.episode}`)"
                      v-on:mouseleave="debouncedSetHoveredSeasonEpisode(null, null)"
                      v-bind:class="
                        getEpisodeClasses(
                          data.mediaItems[season.season][episode.episode].IMDB_rating_default,
                          data.mediaItems[season.season][episode.episode].last_access_at
                        )
                      "
                    >
                      {{ data.mediaItems[season.season][episode.episode].IMDB_rating_defaultFormatted || "-" }}
                    </div>
                  </template>
                  <v-card>
                    <v-list-item three-line style="padding-left: 0px; padding-right: 0px">
                      <mk-media-item-card
                        v-bind:mediaItem="data.mediaItems[season.season][episode.episode]"
                        v-bind:isScanning="false"
                        v-bind:isInDialog="true"
                        v-bind:showCloseButton="true"
                        v-on:close="data.mediaItems[season.season][episode.episode].showDetails = false"
                        v-on:mediaItemEvent="onMICmediaItemEvent"
                      ></mk-media-item-card>
                    </v-list-item>
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
import * as _ from "lodash";

import * as helpers from "@/helpers/helpers";
import * as store from "@/store";

import MediaItemCard from "@/components/shared/MediaItemCard.vue";

export default {
  components: {
    "mk-media-item-card": MediaItemCard,
  },

  props: ["show", "isLoading", "data", "title"],

  data() {
    return {
      hoveredSeason: null,
      hoveredEpisode: null,
    };
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
        $MediaType: mediaItem.MediaType,
        arr_id_Movies: [mediaItem.id_Movies],
        minimumResultSet: false,
        $t: this.$local_t,
        filters: { filterSettings: {} },
        arr_IMDB_tconst: null,
        Series_id_Movies_Owner: mediaItem.Series_id_Movies_Owner,
        specificMediaType: mediaItem.specificMediaType,
      });

      logger.log("[onShowMediaItemDetails] result:", result);

      if (!result || !result.length) return;

      Object.keys(result[0]).forEach((key) => {
        mediaItem[key] = result[0][key];
      });
    },

    async onMICmediaItemEvent(payload) {
      logger.log("[SeriesIMDBRatingHeatmapDialog.onMICmediaItemEvent] payload:", payload);
      this.$emit("mediaItemEvent", payload);
    },

    setHoveredSeasonEpisode(season, episode) {
      this.hoveredSeason = season;
      this.hoveredEpisode = episode;
      this.debouncedSetHoveredSeasonEpisode.cancel();
    },

    getEpisodeClasses(IMDB_rating, last_access_at) {
      const cssClasses = {
        episode: true,
        "mk-clickable-lightgrey-white": true,
      };

      if (!IMDB_rating) {
        cssClasses.IMDBRatingNone = true;
      } else if (IMDB_rating < 5) {
        cssClasses.IMDBRatingRed = true;
      } else if (IMDB_rating < 6) {
        cssClasses.IMDBRatingOrangeRed = true;
      } else if (IMDB_rating < 7) {
        cssClasses.IMDBRatingOrange = true;
      } else if (IMDB_rating < 8) {
        cssClasses.IMDBRatingOrangeGreen = true;
      } else if (IMDB_rating < 9) {
        cssClasses.IMDBRatingGreenOrange = true;
      } else if (IMDB_rating < 9.5) {
        cssClasses.IMDBRatingGreen = true;
      } else {
        cssClasses.IMDBRatingDarkGreen = true;
      }

      if (last_access_at) {
        cssClasses.watched = true;
      }

      return cssClasses;
    },
  },

  // ### Lifecycle Hooks ###
  created() {
    // lodash debounced functions
    this.debouncedSetHoveredSeasonEpisode = _.debounce(this.setHoveredSeasonEpisode, 100);
  },
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

.episode {
  height: 22px;
  padding-top: 1px;
}

.episode.watched {
  background-image: repeating-linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.2) 0,
    rgba(255, 255, 255, 0.2) 2px,
    transparent 4px,
    transparent 8px
  );
  background-blend-mode: overlay;
}
</style>
