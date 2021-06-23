<template>
  <v-dialog
    v-model="show"
    persistent
    max-width="1000px"
    v-on:keydown.escape="onEscapePressed"
    scrollable
  >
    <v-card dark flat v-bind:ripple="false">
      <v-card-title>
        {{ $t(`Edit {typeDisplaytext}`, { typeDisplayText }) }} : {{ mediaItem.Name }}
      </v-card-title>

      <v-card-text>
        <div v-on:click.stop="toggleShowMovies()">
          <v-row
            v-if="numMovies !== null"
            class="mk-clickable"
            style="margin: 8px 6px 8px 4px"
          >
            {{
              numMovies +
              " " +
              $t(numMovies === 1 ? "movie" : "movies") +
              (!showMovies ? " »" : "")
            }}
          </v-row>
          <div v-if="showMovies" class="mk-clickable-white">
            <div v-for="(movie, index) in movies" v-bind:key="index">
              <v-row
                style="margin-left: 20px; margin-right: 6px; margin-bottom: 0px"
              >
                {{ movie.Name }}
                {{ movie.Name2 ? " | " + movie.Name2 : "" }}
                {{ movie.yearDisplay }}
              </v-row>
            </div>
          </div>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-btn
          class="xs-fullwidth"
          color="secondary"
          v-on:click.native="onCancelClick"
          style="margin-left: 8px"
          >{{ $t("Cancel") }}</v-btn
        >
        <v-btn
          class="xs-fullwidth"
          color="primary"
          v-on:click.stop="onOKClick"
          style="margin-left: 8px"
        >
          OK
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import * as store from "@/store";
const logger = require("loglevel");
import { eventBus } from "@/main";

export default {
  props: ["show", "type", "typeDisplayText", "mediaItem"],

  data() {
    return {
    };
  },

  watch: {
  },

  methods: {
    onOKClick() {
      this.$emit('ok');
    },
    
    onCancelClick() {
        this.$emit('cancel');
    },

    onEscapePressed() {
      this.onCancelClick();
    },
  },

  // ### Lifecycle Hooks ###
  created() {},
};
</script>

<style scoped>
.btn {
  margin: 2px;
}

.input-group--text-field {
  padding-left: 16px;
  /* padding-top: 0px; */
}

@media screen and (max-width: 599px) {
  .input-group--text-field {
    padding-left: 16px;
    padding-top: 0px;
  }
}
</style>
