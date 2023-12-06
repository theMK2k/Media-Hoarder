<template>
  <v-row
    class="mk-compact-movie-list-row mk-highlightable-row"
    style="padding-top: 4px; padding-bottom: 2px; margin-top: 2px"
  >
    {{ movie.Name }}
    {{ movie.Name2 ? " | " + movie.Name2 : "" }}
    {{ movie.yearDisplay }}
    <v-spacer />
    <span>
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
    </span>
  </v-row>
</template>

<script>
import * as helpers from "@/helpers/helpers";

export default {
  props: ["movie"],
  computed: {
    helpers() {
      return helpers;
    },
  },
};
</script>

<style></style>
