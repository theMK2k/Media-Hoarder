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
                <div
                  v-if="
                    data.mediaItems[season.season] &&
                    data.mediaItems[season.season][episode.episode] &&
                    data.mediaItems[season.season][episode.episode].IMDB_rating_defaultFormatted
                  "
                  v-bind:class="
                    helpers.getIMDBRatingClass(data.mediaItems[season.season][episode.episode].IMDB_rating_default)
                  "
                  class="mk-clickable-white"
                >
                  {{ data.mediaItems[season.season][episode.episode].IMDB_rating_defaultFormatted }}
                </div>
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
import * as helpers from "@/helpers/helpers";

export default {
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
