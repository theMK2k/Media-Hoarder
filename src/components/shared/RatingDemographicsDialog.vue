<template>
  <v-dialog
    v-model="show"
    persistent
    v-on:keydown.escape="onCloseClick"
  >
    <v-card dark flat v-bind:ripple="false">
      <v-card-title>
        <div class="headline" style="width: 100%; font-size: 1.17em">{{$t("Rating Demographics for")}} {{title}}</div>
      </v-card-title>
      <v-card-text>
        <strong>{{$t("Hint")}}:</strong> {{$t("you can change your default rating demographic (shown in the main list) in the")}} <a v-on:click="openSettings">{{$t('Settings')}}</a>.
        
        <v-alert
          type="info"
          colored-border
          border="left"
          v-if="!isLoading && !ratingDemographics"
          dense
        >{{$t("No rating demographics found for")}} {{title}}</v-alert>
        <div v-if="ratingDemographics">
          <table>
            <tr>
              <td></td>
              <td><div class="rating-demographics-header">{{$t("All Ages")}}</div></td>
              <td><div class="rating-demographics-header">&lt;18</div></td>
              <td><div class="rating-demographics-header">18-29</div></td>
              <td><div class="rating-demographics-header">30-44</div></td>
              <td><div class="rating-demographics-header">45+</div></td>
            </tr>
            <tr>
              <td><div class="rating-demographics-header">{{$t("All")}}</div></td>
              <td><div class="rating-demographics-content" v-if="ratingDemographics.IMDB_rating">{{ratingDemographics.IMDB_rating_formatted}}<br>{{ratingDemographics.IMDB_numVotes_formatted}}</div></td>
              <td><div class="rating-demographics-content" v-if="ratingDemographics.IMDB_rating_aged_under_18">{{ratingDemographics.IMDB_rating_aged_under_18_formatted}}<br>{{ratingDemographics.IMDB_numVotes_aged_under_18_formatted}}</div></td>
              <td><div class="rating-demographics-content" v-if="ratingDemographics.IMDB_rating_aged_18_29">{{ratingDemographics.IMDB_rating_aged_18_29_formatted}}<br>{{ratingDemographics.IMDB_numVotes_aged_18_29_formatted}}</div></td>
              <td><div class="rating-demographics-content" v-if="ratingDemographics.IMDB_rating_aged_30_44">{{ratingDemographics.IMDB_rating_aged_30_44_formatted}}<br>{{ratingDemographics.IMDB_numVotes_aged_30_44_formatted}}</div></td>
              <td><div class="rating-demographics-content" v-if="ratingDemographics.IMDB_rating_aged_45_plus">{{ratingDemographics.IMDB_rating_aged_45_plus_formatted}}<br>{{ratingDemographics.IMDB_numVotes_aged_45_plus_formatted}}</div></td>
            </tr>
            <tr>
              <td><div class="rating-demographics-header">{{$t("Females")}}</div></td>
              <td><div class="rating-demographics-content" v-if="ratingDemographics.IMDB_rating_females">{{ratingDemographics.IMDB_rating_females_formatted}}<br>{{ratingDemographics.IMDB_numVotes_females_formatted}}</div></td>
              <td><div class="rating-demographics-content" v-if="ratingDemographics.IMDB_rating_females_aged_under_18">{{ratingDemographics.IMDB_rating_females_aged_under_18_formatted}}<br>{{ratingDemographics.IMDB_numVotes_females_aged_under_18_formatted}}</div></td>
              <td><div class="rating-demographics-content" v-if="ratingDemographics.IMDB_rating_females_aged_18_29">{{ratingDemographics.IMDB_rating_females_aged_18_29_formatted}}<br>{{ratingDemographics.IMDB_numVotes_females_aged_18_29_formatted}}</div></td>
              <td><div class="rating-demographics-content" v-if="ratingDemographics.IMDB_rating_females_aged_30_44">{{ratingDemographics.IMDB_rating_females_aged_30_44_formatted}}<br>{{ratingDemographics.IMDB_numVotes_females_aged_30_44_formatted}}</div></td>
              <td><div class="rating-demographics-content" v-if="ratingDemographics.IMDB_rating_females_aged_45_plus">{{ratingDemographics.IMDB_rating_females_aged_45_plus_formatted}}<br>{{ratingDemographics.IMDB_numVotes_females_aged_45_plus_formatted}}</div></td>
            </tr>
            <tr>
              <td><div class="rating-demographics-header">{{$t("Males")}}</div></td>
              <td><div class="rating-demographics-content" v-if="ratingDemographics.IMDB_rating_males">{{ratingDemographics.IMDB_rating_males_formatted}}<br>{{ratingDemographics.IMDB_numVotes_males_formatted}}</div></td>
              <td><div class="rating-demographics-content" v-if="ratingDemographics.IMDB_rating_males_aged_under_18">{{ratingDemographics.IMDB_rating_males_aged_under_18_formatted}}<br>{{ratingDemographics.IMDB_numVotes_males_aged_under_18_formatted}}</div></td>
              <td><div class="rating-demographics-content" v-if="ratingDemographics.IMDB_rating_males_aged_18_29">{{ratingDemographics.IMDB_rating_males_aged_18_29_formatted}}<br>{{ratingDemographics.IMDB_numVotes_males_aged_18_29_formatted}}</div></td>
              <td><div class="rating-demographics-content" v-if="ratingDemographics.IMDB_rating_males_aged_30_44">{{ratingDemographics.IMDB_rating_males_aged_30_44_formatted}}<br>{{ratingDemographics.IMDB_numVotes_males_aged_30_44_formatted}}</div></td>
              <td><div class="rating-demographics-content" v-if="ratingDemographics.IMDB_rating_males_aged_45_plus">{{ratingDemographics.IMDB_rating_males_aged_45_plus_formatted}}<br>{{ratingDemographics.IMDB_numVotes_males_aged_45_plus_formatted}}</div></td>
            </tr>
          </table>

          <table>
            <tr>
              <td><div class="rating-demographics-header three-columns">{{$t("Top 1000 Voters")}}</div></td>
              <td><div class="rating-demographics-header three-columns">{{$t("Non-US Users")}}</div></td>
              <td><div class="rating-demographics-header three-columns">{{$t("US Users")}}</div></td>
            </tr>
            <tr>
              <td><div class="rating-demographics-content" v-if="ratingDemographics.IMDB_rating_top_1000_voters">{{ratingDemographics.IMDB_rating_top_1000_voters_formatted}}<br>{{ratingDemographics.IMDB_numVotes_top_1000_voters_formatted}}</div></td>
              <td><div class="rating-demographics-content" v-if="ratingDemographics.IMDB_rating_non_us_users">{{ratingDemographics.IMDB_rating_non_us_users_formatted}}<br>{{ratingDemographics.IMDB_numVotes_non_us_users_formatted}}</div></td>
              <td><div class="rating-demographics-content" v-if="ratingDemographics.IMDB_rating_us_users">{{ratingDemographics.IMDB_rating_us_users_formatted}}<br>{{ratingDemographics.IMDB_numVotes_us_users_formatted}}</div></td>
            </tr>
          </table>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-col sm="12">
          <v-row style="margin-top: 8px">
            <v-btn
              class="xs-fullwidth"
              color="secondary"
              v-on:click.native="onCloseClick"
              style="margin-left: 8px;"
            >{{$t("Close")}}</v-btn>
          </v-row>
        </v-col>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
const logger = require("loglevel");

import * as store from "@/store";

// import { eventBus } from "@/main";

export default {
  props: ["show", "id_Movies", "title"],

  data() {
    return {
      isLoading: true,
      ratingDemographics: null
    };
  },

  computed: {
  },

  methods: {
    onCloseClick() {
      this.$emit("close");
    },

    async init(id_Movies) {
      this.isLoading = true;
      
      this.ratingDemographics = await store.fetchRatingDemographics(id_Movies);

      logger.log('ratingDemographics:', this.ratingDemographics);

      this.isLoading = false;
    },

    openSettings() {
      return this.$router.push("/settings");
    },
  },

  // ### Lifecycle Hooks ###
  created() {}
};
</script>

<style scoped>
table {
  margin-top: 16px;
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
