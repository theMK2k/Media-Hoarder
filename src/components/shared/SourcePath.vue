<template>
  <div v-on:mouseover="isHovered = true" v-on:mouseleave="isHovered = false">
    <v-row>
      <v-card style="width: 100%">
        <v-list-item two-line>
          <v-list-item-content>
            <v-list-item-title>
              {{value.Description}}
              <v-icon
                v-show="isHovered"
                small
                style="cursor: pointer"
                v-on:click="onEditDescription"
              >mdi-pencil</v-icon>
              <v-icon
                v-show="isHovered"
                small
                color="red"
                style="cursor: pointer"
                v-on:click="onDelete"
              >mdi-delete</v-icon>
            </v-list-item-title>
            <v-list-item-subtitle>{{value.Path}}</v-list-item-subtitle>
            
			<v-checkbox
              dense
              v-model="value.checkRemovedFiles"
              color="dark-grey"
              :label="`remove missing entries on (re-)scan`"
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
const logger = require("loglevel");

import * as store from "@/store";
import { eventBus } from "@/main";

export default {
  props: ["value"],

  data: () => ({
    isHovered: false
  }),

  methods: {
    onEditDescription() {
      this.$emit("edit-description", this.value);
    },

    onDelete() {
      this.$emit("delete", this.value);
	},
	
	async toggleCheckRemovedFiles() {
		logger.log('checkRemovedFiles:', this.value.checkRemovedFiles);
		await store.db.fireProcedure(`UPDATE tbl_SourcePaths SET checkRemovedFiles = $checkRemovedFiles WHERE id_SourcePaths = $id_SourcePaths`, { $checkRemovedFiles: this.value.checkRemovedFiles, $id_SourcePaths: this.value.id_SourcePaths });

		if (this.value.checkRemovedFiles) {
			eventBus.showSnackbar(
            "success",
            `OK, during (re-)scan, any missing file in the source path will lead to removal of the entry`
          );
		} else {
			eventBus.showSnackbar(
            "success",
            `OK, during (re-)scan, no entry removal is performed - regardless if the file is available or not`
          );
		}
	}
  }
};
</script>

<style>
</style>