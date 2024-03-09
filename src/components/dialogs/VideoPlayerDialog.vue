<template>
  <v-dialog v-model="show" persistent fullscreen max-width="100%" v-on:keydown.escape="onCloseClick">
    <!--  style="min-height: 600px!important" -->
    <v-card
      dark
      flat
      v-bind:ripple="false"
      style="
        border-radius: 0px;
        background-color: black;
        display: -webkit-flex;
        display: flex;
        -webkit-flex-direction: column;
        flex-direction: column;
        -webkit-flex-wrap: nowrap;
        flex-wrap: nowrap;
        -webkit-justify-content: center;
        justify-content: center;
        -webkit-align-content: stretch;
        align-content: stretch;
        -webkit-align-items: flex-start;
        align-items: flex-start;
      "
    >
      <!--  style="min-height: 600px!important" -->
      <webview
        v-if="showActualPlayer"
        v-bind:src="src"
        nodeintegration
        style="
          width: 100%;
          min-height: calc(100vh - 160px) !important;
          max-height: calc(100vh - 160px) !important;
          background-color: black;
          border-color: black;
          outline-color: black;
          -webkit-order: 0;
          order: 0;
          -webkit-flex: 1 1 auto;
          flex: 1 1 auto;
          -webkit-align-self: stretch;
          align-self: stretch;
        "
      ></webview>
      <div
        v-bind:style="controlsStyle"
        v-on:mouseover="controlsHovered = true"
        v-on:mouseleave="controlsHovered = false"
      >
        <v-list-item-content
          v-if="trailerShow"
          class="align-self-start"
          style="padding-top: 6px; padding-bottom: 6px; padding-left: 8px"
        >
          <v-row class="mk-compact-movie-list-title"> {{ $t("Trailer Show") }}: </v-row>
          <div v-if="trailerShow.current">
            <v-menu
              v-model="trailerShow.current.showDetails"
              v-bind:close-on-click="false"
              v-bind:close-on-content-click="false"
              bottom
              right
              transition="scale-transition"
              origin="top left"
            >
              <template v-slot:activator="{ on }">
                <mk-compact-movie-list-row
                  v-on="on"
                  v-on:click="onShowMediaItemDetails(trailerShow.current)"
                  v-bind:movie="trailerShow.current"
                  v-bind:isClickable="true"
                />
              </template>
              <v-card>
                <v-list-item three-line style="padding-left: 0px; padding-right: 0px">
                  <mk-media-item-card
                    v-bind:mediaItem="trailerShow.current"
                    v-bind:isScanning="false"
                    v-bind:isInDialog="true"
                    v-bind:showCloseButton="true"
                    v-on:close="trailerShow.current.showDetails = false"
                    v-on:mediaItemEvent="onMICmediaItemEvent"
                  ></mk-media-item-card>
                </v-list-item>
              </v-card>
            </v-menu>
          </div>
        </v-list-item-content>

        <v-row style="max-width: 100%; margin-top: 8px; padding-left: 8px">
          <v-btn
            class="xs-fullwidth"
            outlined
            color="white"
            v-on:click.native="$emit('close')"
            style="margin-left: 8px"
            >{{ $t("Close") }}</v-btn
          >
          <v-spacer></v-spacer>
          <div v-if="trailerShow" style="padding-right: 8px">
            <v-pagination v-if="false"></v-pagination>
            <!-- we have to use this, else we don't get v-pagination* classes -->
            <button
              type="button"
              class="v-pagination__navigation"
              v-bind:class="prevClass"
              v-bind:disabled="trailerShow.history.length == 0 || isLoading"
              v-on:click="$emit('trailer-show-previous')"
              style="
                height: 38px !important;
                width: 38px !important;
                margin: 0px 8px 0px 0px !important;
                display: inline-block;
              "
            >
              <i aria-hidden="true" class="v-icon notranslate mdi mdi-chevron-left theme--dark"></i>
            </button>

            {{ trailerShow.history.length + 1 }} / {{ trailerShow.history.length + trailerShow.remaining.length + 1 }}

            <button
              type="button"
              class="v-pagination__navigation"
              v-bind:class="nextClass"
              v-bind:disabled="trailerShow.remaining.length == 0 || isLoading"
              v-on:click="$emit('trailer-show-next')"
              style="
                height: 38px !important;
                width: 38px !important;
                margin: 0px 0px 0px 8px !important;
                display: inline-block;
              "
            >
              <i aria-hidden="true" class="v-icon notranslate mdi mdi-chevron-right theme--dark"></i>
            </button>
            <v-btn
              class="xs-fullwidth"
              outlined
              color="primary"
              v-on:click.native="$emit('trailer-show-add-movie-to-list')"
              style="margin-left: 8px"
              >{{ $t("Add Movie to List") }}</v-btn
            >
            <v-btn
              class="xs-fullwidth"
              outlined
              color="primary"
              v-on:click.native="$emit('trailer-show-close-and-search-movie')"
              style="margin-left: 8px"
              >{{ $t("Close and Search Movie") }}</v-btn
            >
          </div>
        </v-row>
      </div>
    </v-card>
  </v-dialog>
</template>

<script>
const logger = require("../../helpers/logger");
import * as store from "@/store";

// import { eventBus } from "@/main";
import CompactMovieListRow from "@/components/shared/CompactMovieListRow.vue";
import MediaItemCard from "@/components/shared/MediaItemCard.vue";

export default {
  components: {
    "mk-compact-movie-list-row": CompactMovieListRow,
    "mk-media-item-card": MediaItemCard,
  },

  props: ["show", "src", "trailerShow", "showActualPlayer", "isLoading"],

  data: () => ({
    controlsHovered: false,
  }),

  computed: {
    prevClass() {
      return {
        "v-pagination__navigation--disabled": this.trailerShow.history.length == 0 || this.isLoading,
      };
    },

    nextClass() {
      return {
        "v-pagination__navigation--disabled": this.trailerShow.remaining.length == 0 || this.isLoading,
      };
    },

    controlsStyle() {
      return {
        "-webkit-order": 0,
        order: 0,
        "-webkit-flex": "0 1 auto",
        flex: "0 1 auto",
        "-webkit-align-self": "stretch",
        "align-self": "stretch",

        // transition: this.controlsHovered ? "opacity 200ms ease-in-out" : "opacity 1000ms ease-in-out",
        // opacity: this.controlsHovered ? 1 : 0,

        opacity: 1,
      };
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
      logger.log("[onShowMediaItemDetails] mediaItem:", mediaItem);

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
      logger.log("[VideoPlayerDialog.onMICmediaItemEvent] payload:", payload);
      this.$emit("mediaItemEvent", payload);
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
</style>
