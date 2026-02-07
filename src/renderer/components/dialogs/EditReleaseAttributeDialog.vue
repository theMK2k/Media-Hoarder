<template>
  <v-dialog
    :model-value="show"
    @update:model-value="$emit('update:show', $event)"
    persistent
    max-width="1000px"
  >
    <v-card>
      <v-card-title>
        <div class="text-h5" style="width: 100%; font-size: 1.17em">
          {{ title }}
        </div>
      </v-card-title>

      <div style="margin-left: 24px">
        <v-text-field v-model="searchTerm" v-bind:label="$t('Search Term')" v-bind:disabled="isEdit" variant="underlined"></v-text-field>
        <v-text-field v-model="displayAs" v-bind:label="$t('Display As')" variant="underlined"></v-text-field>
      </div>

      <v-card-actions>
        <v-btn class="xs-fullwidth" color="secondary" v-on:click.native="onButtonClick('cancel')">{{
          $t("Cancel")
        }}</v-btn>
        <v-btn class="xs-fullwidth" color="primary" v-on:click.native="onButtonClick('ok')">{{ $t("OK") }}</v-btn>
        <!-- v-bind:disabled="enterTextValue && !textValueEmptyAllowed && !textValueLocal" -->
        <!-- </v-row> -->
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
// import Vue from "vue";
// import router from "@/router"; // workaround in order to access router.app.$t
// const logger = require("../../helpers/logger");

import { eventBus } from "@/eventBus";

export default {
  props: ["show", "title"],

  emits: ["update:show"],

  data() {
    return {
      isEdit: false,
      searchTerm: "",
      displayAs: "",
    };
  },

  computed: {},

  watch: {},

  methods: {
    init(searchTerm, displayAs) {
      this.searchTerm = searchTerm;
      this.displayAs = displayAs;

      if (searchTerm) {
        this.isEdit = true;
      } else {
        this.isEdit = false;
      }
    },

    onButtonClick(eventName) {
      if (eventName === "ok") {
        if (!this.searchTerm) {
          eventBus.showSnackbar("error", this.$t("Search Term is missing_"));
          return;
        }
        if (!this.displayAs) {
          eventBus.showSnackbar("error", this.$t('"Display As" is missing_'));
          return;
        }
      }

      this.$emit(eventName, {
        searchTerm: this.searchTerm,
        displayAs: this.displayAs,
      });
    },

    onEscapePressed() {
      this.onButtonClick("cancel");
    },

    onEnterPressed() {
      this.onButtonClick("ok");
    },
  },

  // ### Lifecycle Hooks ###
  created() {},

  beforeDestroy() {},
};
</script>
