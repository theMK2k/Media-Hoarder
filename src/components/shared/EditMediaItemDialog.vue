<template>
  <v-dialog
    v-if="mediaItem"
    v-model="show"
    persistent
    max-width="1000px"
    v-on:keydown.escape="onEscapePressed"
    scrollable
  >
    <v-card dark flat v-bind:ripple="false">
      <v-card-title>
        {{ $t(caption) }}: {{ mediaItemBackup.Name }}
        {{ mediaItemBackup.yearDisplay }}
      </v-card-title>

      <v-card-text>
        <v-text-field
          v-bind:label="$t('Primary Title')"
          v-model="mediaItem.Name"
        ></v-text-field>
        <v-text-field
          v-bind:label="$t('Secondary Title')"
          v-model="mediaItem.Name2"
        ></v-text-field>
        <v-text-field
          v-bind:label="$t('Release Year')"
          v-model="mediaItem.startYear"
        ></v-text-field>
        <v-select
          v-bind:label="$t('Video Quality')"
          v-bind:items="$shared.videoQualities.map((item) => item.name)"
          v-model="mediaItem.MI_Quality"
        >
        </v-select>
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
  props: ["show", "type", "caption", "mediaItem"],

  data() {
    return {
      mediaItemBackup: {},
    };
  },

  watch: {
    mediaItem(newValue) {
      this.mediaItemBackup = newValue
        ? JSON.parse(JSON.stringify(newValue))
        : {};
    },
  },

  methods: {
    onOKClick() {
      // TODO: check if changes have been made (compare mediaItemBackup with mediaItem)
      let hasChanges = false;

      this.$emit("ok", hasChanges);
    },

    onCancelClick() {
      this.$emit("cancel");
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
