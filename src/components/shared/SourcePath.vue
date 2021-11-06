<template>
  <div v-on:mouseover="isHovered = true" v-on:mouseleave="isHovered = false">
    <v-row style="margin: 0px">
      <v-card style="width: 100%">
        <v-list-item two-line>
          <v-list-item-content>
            <v-list-item-title>
              {{ value.Description }}
              <v-icon
                class="mk-clickable"
                v-show="isHovered"
                small
                v-on:click="onEditDescription"
                >mdi-pencil</v-icon
              >
              <v-icon
                class="mk-clickable-red"
                v-show="isHovered"
                small
                v-on:click="onDelete"
                >mdi-delete</v-icon
              >
            </v-list-item-title>
            <v-list-item-subtitle style="min-height: 28px">
              {{ value.Path }}
              <v-icon
                class="mk-clickable"
                v-show="isHovered"
                small
                v-on:click="onEditPath"
                >mdi-pencil</v-icon
              >
            </v-list-item-subtitle>

            <v-checkbox
              dense
              v-model="value.checkRemovedFiles"
              color="mk-dark-grey"
              v-bind:label="$t('remove missing entries on _re-_scan')"
              style="margin-top: 0px"
              v-on:click.native="toggleCheckRemovedFiles"
            ></v-checkbox>
          </v-list-item-content>
        </v-list-item>
      </v-card>
    </v-row>
  </div>
</template>

<script>
const logger = require("../../helpers/logger");

import * as store from "@/store";
import { eventBus } from "@/main";

export default {
  props: ["value"],

  data: () => ({
    isHovered: false,
  }),

  methods: {
    onEditDescription() {
      this.$emit("edit-description", this.value);
    },

    onDelete() {
      this.$emit("delete", this.value);
    },

    onEditPath() {
      this.$emit("edit-path", this.value);
    },

    async toggleCheckRemovedFiles() {
      logger.log("checkRemovedFiles:", this.value.checkRemovedFiles);
      await store.db.fireProcedure(
        `UPDATE tbl_SourcePaths SET checkRemovedFiles = $checkRemovedFiles WHERE id_SourcePaths = $id_SourcePaths`,
        {
          $checkRemovedFiles: this.value.checkRemovedFiles,
          $id_SourcePaths: this.value.id_SourcePaths,
        }
      );

      if (this.value.checkRemovedFiles) {
        eventBus.showSnackbar(
          "success",
          this.$t(
            "OK, during _re-_scan, any missing file in the source path will lead to removal of the entry"
          )
        );
      } else {
        eventBus.showSnackbar(
          "success",
          this.$t(
            "OK, during _re-_scan, no entry removal is performed - regardless if the file is available or not"
          )
        );
      }
    },
  },
};
</script>

<style></style>
