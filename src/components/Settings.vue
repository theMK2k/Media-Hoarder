<template>
  <div>
    <h1>
      <v-btn text v-on:click="$router.go(-1)">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>Settings
    </h1>

    <h3>Movies - Source Paths</h3>
    <div v-if="moviesSourcePaths.length == 0">no paths defined</div>

    <div v-for="sourcePath in moviesSourcePaths" v-bind:key="sourcePath.id_SourcePath">
      <mk-sourcepath
        v-bind:value="sourcePath"
        v-on:edit-description="onSourcePathEditDescription"
        v-on:delete="onSourcePathDelete"
      ></mk-sourcepath>
    </div>

    <v-btn text small color="primary" v-on:click="addSource('movies')">Add Source Path</v-btn>

    <h3>TV - Sourcepaths</h3>
    <div v-if="tvSourcePaths.length == 0">no paths defined</div>

    <div v-for="sourcePath in tvSourcePaths" v-bind:key="sourcePath.id_SourcePath">
      <mk-sourcepath
        v-bind:value="sourcePath"
        v-on:edit-description="onSourcePathEditDescription"
        v-on:delete="onSourcePathDelete"
      ></mk-sourcepath>
    </div>

    <v-btn text small color="primary" v-on:click="addSource('tv')">Add Source Path</v-btn>

    <v-btn text small color="primary" v-on:click="openDevTools">Open DevTools</v-btn>

    <mk-sourcepath-description-dialog
      v-bind:show="sourcePathDescriptionDialog.show"
      title="Edit Description"
      v-bind:question="`Please provide a description for the source path ${sourcePathDescriptionDialog.Path} (${sourcePathDescriptionDialog.MediaTypeUpper})`"
			enterTextValue="true"
			v-bind:textValue="sourcePathDescriptionDialog.Description"
      yes="OK"
      cancel="Cancel"
      yesColor="primary"
      cancelColor="secondary"
      v-on:yes="onSourcePathDescriptionDialogOK"
      v-on:cancel="onSourcePathDescriptionDialogCancel"
    ></mk-sourcepath-description-dialog>
    <mk-sourcepath-remove-dialog
      v-bind:show="sourcePathRemoveDialog.show"
      title="Remove Source Path"
      v-bind:question="`Do you really want to remove the source path ${sourcePathRemoveDialog.Path} (${sourcePathRemoveDialog.MediaTypeUpper}) including all associated media?`"
      yes="YES, Remove"
      cancel="Cancel"
      yesColor="error"
      cancelColor="secondary"
      v-on:yes="onSourcePathRemoveDialogOK"
      v-on:cancel="onSourcePathRemoveDialogCancel"
    ></mk-sourcepath-remove-dialog>
  </div>
</template>

<script>
const { dialog, BrowserWindow } = require("electron").remote;
import { eventBus } from "@/main";
import * as store from "@/store";
import SourcePath from "@/components/shared/SourcePath";
import Dialog from "./shared/Dialog.vue";

export default {
  components: {
    "mk-sourcepath": SourcePath,
    "mk-sourcepath-description-dialog": Dialog,
    "mk-sourcepath-remove-dialog": Dialog
  },

  data: () => ({
    sourcePaths: [],

    sourcePathDescriptionDialog: {
      show: false,
      id_SourcePath: null,
      MediaType: null,
      MediaTypeUpper: null,
			Path: null,
			Description: null
    },

    sourcePathRemoveDialog: {
      show: false,
      id_SourcePath: null,
      MediaType: null,
      MediaTypeUpper: null,
      Path: null
    },

    tmpPath: ""
  }),

  computed: {
    tvSourcePaths() {
      return this.sourcePaths.filter(sourcePath => {
        return sourcePath.MediaType === "tv";
      });
    },
    moviesSourcePaths() {
      return this.sourcePaths.filter(sourcePath => {
        return sourcePath.MediaType === "movies";
      });
    }
  },

  methods: {
    addSource(MediaType) {
      dialog.showOpenDialog(
        {
          properties: ["openDirectory"]
        },
        folderposition => {
          if (!folderposition || folderposition.length === 0) {
            return;
          }

          this.sourcePathDescriptionDialog.id_SourcePath = null;
          this.sourcePathDescriptionDialog.MediaType = MediaType;
          this.sourcePathDescriptionDialog.MediaTypeUpper = MediaType.toUpperCase();
					this.sourcePathDescriptionDialog.Path = folderposition[0];
					this.sourcePathDescriptionDialog.Description = null;

          this.sourcePathDescriptionDialog.show = true;
        }
      );
    },

    openDevTools() {
      BrowserWindow.getFocusedWindow().webContents.openDevTools();
    },

    fetchSourcePaths() {
      (async () => {
        try {
          const paths = await store.default.fetchSourcePaths();
          this.sourcePaths = paths;
          console.log(this.sourcePaths);
        } catch (err) {
          eventBus.showSnackbar("error", 6000, err);
        }
      })();
    },

    onSourcePathEditDescription(sourcePathItem) {
      this.sourcePathDescriptionDialog.id_SourcePath =
        sourcePathItem.id_SourcePath;
      this.sourcePathDescriptionDialog.Path = sourcePathItem.Path;
      this.sourcePathDescriptionDialog.MediaTypeUpper = sourcePathItem.MediaType.toUpperCase();
			this.sourcePathDescriptionDialog.Description = sourcePathItem.Description;

      this.sourcePathDescriptionDialog.show = true;
    },

    onSourcePathDelete(sourcePathItem) {
      this.sourcePathRemoveDialog.id_SourcePath = sourcePathItem.id_SourcePath;
      this.sourcePathRemoveDialog.Path = sourcePathItem.Path;
      this.sourcePathRemoveDialog.MediaTypeUpper = sourcePathItem.MediaType.toUpperCase();

      this.sourcePathRemoveDialog.show = true;
    },

    onSourcePathRemoveDialogCancel() {
      this.sourcePathRemoveDialog.show = false;
    },

    onSourcePathRemoveDialogOK() {
      this.sourcePathRemoveDialog.show = false;
      eventBus.showSnackbar("error", 6000, `TODO!`);
    },

    onSourcePathDescriptionDialogCancel() {
      this.sourcePathDescriptionDialog.show = false;
    },

    onSourcePathDescriptionDialogOK() {
      this.sourcePathDescriptionDialog.show = false;

      eventBus.showSnackbar(
        "success",
        6000,
        `${folderposition[0]} added to ${
          this.sourcePathDescriptionDialog.MediaTypeUpper
        } source directories`
      );
    }
  },

  // ### LifeCycle Hooks ###
  created() {
    this.fetchSourcePaths();
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
