<template>
  <v-dialog v-model="show" persistent max-width="100%" v-on:keydown.escape="onCloseClick">
    <!--  style="min-height: 600px!important" -->
    <v-card dark flat v-bind:ripple="false">
      <!--  style="min-height: 600px!important" -->
      <webview
        v-if="show"
        v-bind:src="src"
        nodeintegration
        style="width: 100%; min-height: 600px!important"
      ></webview>
      <v-col sm="12">
        <v-row style="margin-top: 8px">
          <v-btn
            class="xs-fullwidth"
            color="secondary"
            v-on:click.native="onCloseClick"
            style="margin-left: 8px;"
          >Close</v-btn>
        </v-row>
      </v-col>
    </v-card>
  </v-dialog>
</template>

<script>
// const logger = require("loglevel");

// import { eventBus } from "@/main";

export default {
  props: ["show", "src"],

  methods: {
    onCloseClick() {
      this.$emit("close");
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
