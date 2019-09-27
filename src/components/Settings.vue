<template>
  <div>
    <h1>
      <v-btn text v-on:click="$router.go(-1)">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>Settings
    </h1>

    <v-row style="margin: 0px">
      <v-text-field readonly label="VLC Path" v-model="VLCPath"></v-text-field>
      <v-btn v-on:click="browseVLCPath()" text small color="primary" style="margin-top: 16px">Browse</v-btn>
    </v-row>

    <h3>Movies - Source Paths</h3>
    <div v-if="moviesSourcePaths.length == 0">no paths defined</div>

    <div v-for="sourcePath in moviesSourcePaths" v-bind:key="sourcePath.id_SourcePaths">
      <mk-sourcepath
        v-bind:value="sourcePath"
        v-on:edit-description="onSourcePathEditDescription"
        v-on:delete="onSourcePathDelete"
      ></mk-sourcepath>
    </div>

    <v-btn text small color="primary" v-on:click="addSource('movies')">Add Source Path</v-btn>

    <h3>TV - Sourcepaths</h3>
    <div v-if="tvSourcePaths.length == 0">no paths defined</div>

    <div v-for="sourcePath in tvSourcePaths" v-bind:key="sourcePath.id_SourcePaths">
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
      ok="OK"
      cancel="Cancel"
      cancelColor="secondary"
      v-on:ok="onSourcePathDescriptionDialogOK"
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
const logger = require("loglevel");

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
    VLCPath: null,

    sourcePaths: [],

    sourcePathDescriptionDialog: {
      show: false,
      id_SourcePaths: null,
      MediaType: null,
      MediaTypeUpper: null,
      Path: null,
      Description: null
    },

    sourcePathRemoveDialog: {
      show: false,
      id_SourcePaths: null,
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
    browseVLCPath() {
      dialog.showOpenDialog(
        {
          properties: ["openFile"],
          filters: [
            { name: "Executables", extensions: ["exe"] },
            { name: "All Files", extensions: ["*"] }
          ]
        },
        path => {
          if (!path || path.length === 0) {
            return;
          }

          this.VLCPath = path[0];

          store.setSetting('VLCPath', this.VLCPath);
        }
      );
    },

    addSource(MediaType) {
      dialog.showOpenDialog(
        {
          properties: ["openDirectory"]
        },
        folderposition => {
          if (!folderposition || folderposition.length === 0) {
            return;
          }

          const chosenPath = folderposition[0];
          const chosenPathLower = chosenPath.toLowerCase();

          let isAlreadyInUse = false;
          this.sourcePaths.forEach(sourcePath => {
            const pathLower = sourcePath.Path.toLowerCase();

            if (chosenPathLower.includes(pathLower)) {
              isAlreadyInUse = true;
            }
          });

          if (isAlreadyInUse) {
            return eventBus.showSnackbar(
              "error",
              6000,
              `The chosen path is already in use.`
            );
          }

          this.sourcePathDescriptionDialog.id_SourcePaths = null;
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

    async fetchSourcePaths() {
      // (async () => {
      try {
        const paths = await store.fetchSourcePaths();
        this.sourcePaths = paths;
        logger.log(this.sourcePaths);
      } catch (err) {
        eventBus.showSnackbar("error", 6000, err);
      }
      // })();
    },

    onSourcePathEditDescription(sourcePathItem) {
      this.sourcePathDescriptionDialog.id_SourcePaths =
        sourcePathItem.id_SourcePaths;
      this.sourcePathDescriptionDialog.Path = sourcePathItem.Path;
      this.sourcePathDescriptionDialog.MediaTypeUpper = sourcePathItem.MediaType.toUpperCase();
      this.sourcePathDescriptionDialog.Description = sourcePathItem.Description;

      this.sourcePathDescriptionDialog.show = true;
    },

    onSourcePathDelete(sourcePathItem) {
      this.sourcePathRemoveDialog.id_SourcePaths =
        sourcePathItem.id_SourcePaths;
      this.sourcePathRemoveDialog.Path = sourcePathItem.Path;
      this.sourcePathRemoveDialog.MediaTypeUpper = sourcePathItem.MediaType.toUpperCase();

      this.sourcePathRemoveDialog.show = true;
    },

    onSourcePathRemoveDialogCancel() {
      this.sourcePathRemoveDialog.show = false;
    },

    onSourcePathRemoveDialogOK() {
      (async () => {
        try {
          this.sourcePathRemoveDialog.show = false;

          await store.db.fireProcedure(
            `DELETE FROM tbl_SourcePaths WHERE id_SourcePaths = $id_SourcePaths`,
            {
              $id_SourcePaths: this.sourcePathRemoveDialog.id_SourcePaths
            }
          );

          await store.db.fireProcedure(
            `DELETE FROM tbl_Movies WHERE id_SourcePaths NOT IN (SELECT id_SourcePaths FROM tbl_SourcePaths)`,
            []
          );

          await this.fetchSourcePaths();

          eventBus.showSnackbar("success", 6000, `Source path removed.`);
        } catch (err) {
          eventBus.showSnackbar("error", 6000, err);
        }
      })();
    },

    onSourcePathDescriptionDialogCancel() {
      this.sourcePathDescriptionDialog.show = false;
    },

    onSourcePathDescriptionDialogOK(dialogResult) {
      this.sourcePathDescriptionDialog.show = false;

      if (this.sourcePathDescriptionDialog.id_SourcePaths) {
        return this.saveSourcePathDescriptionEdit(dialogResult);
      }

      return this.saveNewSourcePath(dialogResult);
    },

    saveSourcePathDescriptionEdit(dialogResult) {
      (async () => {
        try {
          await store.db.fireProcedure(
            `UPDATE tbl_SourcePaths SET Description = $Description WHERE id_SourcePaths = $id_SourcePaths`,
            {
              $id_SourcePaths: this.sourcePathDescriptionDialog.id_SourcePaths,
              $Description: dialogResult.textValue
            }
          );

          await this.fetchSourcePaths();

          eventBus.showSnackbar("success", 6000, `Description updated.`);
        } catch (err) {
          eventBus.showSnackbar("error", 6000, err);
        }
      })();
    },

    saveNewSourcePath(dialogResult) {
      (async () => {
        try {
          await store.db.fireProcedure(
            `INSERT INTO tbl_SourcePaths (MediaType, Path, Description, created_at) VALUES ($MediaType, $Path, $Description, DATETIME('now'))`,
            {
              $MediaType: this.sourcePathDescriptionDialog.MediaType,
              $Path: this.sourcePathDescriptionDialog.Path,
              $Description: dialogResult.textValue
            }
          );

          await this.fetchSourcePaths();

          eventBus.showSnackbar(
            "success",
            6000,
            `${this.sourcePathDescriptionDialog.Path} added to ${this.sourcePathDescriptionDialog.MediaTypeUpper} source directories`
          );
        } catch (err) {
          eventBus.showSnackbar("error", 6000, err);
        }
      })();
    }
  },

  // ### LifeCycle Hooks ###
  async created() {
    await this.fetchSourcePaths();
    this.VLCPath = await store.getSetting("VLCPath");
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
