<template>
  <v-dialog v-model="show" persistent max-width="100%" v-on:keydown.escape="onEscapePressed">
    <!--  style="min-height: 600px!important" -->
    <v-card dark flat v-bind:ripple="false">
      <!--
      <p>videoURL: {{ videoURL }}</p>
      <p>mimeType: {{ mimeType }}</p>
      <p>slateURL: {{ slateURL }}</p>
      -->
      <!--  style="min-height: 600px!important" -->
      <video
        id="mk-video-player"
        class="video-js"
        controls
        preload="auto"
        data-setup="{}"
        v-bind:poster="slateURL"
        autoplay
        style="width: 100%; min-height: 600px!important; background-color: black; border-color: black; outline-color: black;"
      >
        <source v-bind:src="videoURL" v-bind:type="mimeType" />
      </video>
      <v-col sm="12">
        <v-row style="margin-top: 8px">
          <v-btn
            class="xs-fullwidth"
            color="secondary"
            v-on:click.native="onCloseClick"
            style="margin-left: 8px;"
          >{{$t('Close')}}</v-btn>
        </v-row>
      </v-col>
    </v-card>
  </v-dialog>
</template>

<script>
// const logger = require("loglevel");
const videojs = require("video.js");

// import { eventBus } from "@/main";

export default {
  props: ["show", "videoURL", "mimeType", "slateURL"],

  methods: {
    onCloseClick() {
      this.$emit("close");
    },

    init() {
      const options = {};
      videojs(
        "mk-video-player",
        options,
        function onPlayerReady() {
          videojs.log("Your player is ready!");

          // In this context, `this` is the player that was created by Video.js.
          this.play();

          // How about an event listener?
          this.on("ended", function() {
            videojs.log("Awww...over so soon?!");
          });
        }
      );
    },
    
    onEscapePressed() {
      this.onCloseClick();
    }
  },

  // ### Lifecycle Hooks ###
  created() {}
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
