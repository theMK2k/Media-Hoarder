<template>
  <v-row
    class="mk-compact-movie-list-row mk-highlightable-row"
    v-bind:class="isClickable ? 'mk-clickable-white' : ''"
    style="padding-top: 4px; padding-bottom: 2px; margin-top: 2px"
    v-on:click="onClick"
  >
    <div style="display: flex; justify-content: space-between; width: 100%">
      <!-- Name, Details (left) -->
      <div id="name-and-details" style="flex-grow: 1">
        <span v-if="movie.Series_Season_Displaytext" style="font-weight: 400; color: lightgray; margin-right: 4px">
          {{ movie.Series_Season_Displaytext
          }}{{ `${movie.Series_Season_Displaytext ? "." : ""}${movie.Series_Episodes_Displaytext}` }}
        </span>
        {{ movie.Name }}
        {{ movie.Name2 ? " | " + movie.Name2 : "" }}
        {{ movie.yearDisplay }}
        {{ isClickable && showExpandIndicator && isCollapsed ? " »" : "" }}

        <div v-if="movie.propertyDetails" class="mk-light-grey" style="margin-top: 2px">
          <span v-for="(detail, index) in movie.propertyDetails" v-bind:key="index">
            <span v-if="index > 0"> | </span>
            <span v-if="detail.Category || detail.CategoryToTranslate">
              {{ detail.CategoryToTranslate ? $t(detail.CategoryToTranslate) : detail.Category
              }}<span v-if="detail.Value">: </span>
            </span>
            <span v-if="detail.Value">{{ detail.Value }}</span>
          </span>
        </div>
      </div>

      <!-- Rating (right) -->
      <div id="rating" style="flex-shrink: 0; margin-left: 16px">
        <span v-if="movie.IMDB_rating_defaultDisplay">
          <v-icon small color="amber" style="padding-bottom: 4px; width: 12px; height: 12px">mdi-star</v-icon>
          {{ movie.IMDB_rating_defaultDisplay }}</span
        >
        <span
          v-if="movie.IMDB_metacriticScore"
          v-bind:class="helpers.getMetaCriticClass(movie.IMDB_metacriticScore)"
          class="mk-compact-movie-list-metacritic-block"
          >{{ movie.IMDB_metacriticScore }}</span
        >
        <span v-if="!movie.IMDB_metacriticScore" class="mk-compact-movie-list-metacritic-block"> &nbsp;</span>
      </div>
    </div>
  </v-row>
</template>

<script>
// const logger = require("../../helpers/logger");
import * as helpers from "@/helpers/helpers";

export default {
  props: ["movie", "isClickable", "showExpandIndicator", "isCollapsed"],
  computed: {
    helpers() {
      return helpers;
    },
  },
  methods: {
    onClick(e) {
      if (this.isClickable) {
        this.$emit("click", e);
      }

      if (e.stopPropagation) {
        e.stopPropagation();
      }
    },
  },
};
</script>

<style></style>
