<template>
  <div style="width: 100%; margin-left: 8px">
    <h1>
      <v-btn text v-on:click="$router.go(-1)">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>Settings
    </h1>

    <v-tabs>
      <v-tab>General</v-tab>
      <v-tab>Movies</v-tab>
      <v-tab>Series</v-tab>
      <v-tab>Duplicates</v-tab>

      <v-tab-item style="padding: 8px">
        <v-row style="margin: 0px">
          <v-text-field
            readonly
            label="Media Player Path (e.g. path to VLC executable)"
            v-model="MediaplayerPath"
          ></v-text-field>
          <v-btn
            v-on:click="browseMediaplayerPath()"
            text
            small
            color="primary"
            style="margin-top: 16px"
          >Browse</v-btn>
        </v-row>

        <v-row style="margin: 0px">
          <v-text-field
            readonly
            label="Mediainfo CLI Path (i.e. path to Mediainfo CLI executable from mediaarea.net or mediainfo-rar from lundman.net)"
            v-model="MediainfoPath"
          ></v-text-field>
          <v-btn
            v-on:click="browseMediainfoPath()"
            text
            small
            color="primary"
            style="margin-top: 16px"
          >Browse</v-btn>
        </v-row>

        <v-row style="margin: 0px">
          <v-text-field
            type="number"
            label="Number of seconds a medium should run until 'last access' is updated"
            v-model="minimumWaitForSetAccess"
          ></v-text-field>
        </v-row>

        <v-btn text small color="primary" v-on:click="openDevTools">Open DevTools</v-btn>
      </v-tab-item>

      <v-tab-item style="padding: 8px">
        <h3>Movies - Source Paths</h3>
        <div v-if="moviesSourcePaths.length == 0">no paths defined</div>

        <div
          v-for="sourcePath in moviesSourcePaths"
          v-bind:key="sourcePath.id_SourcePaths"
          style="margin: 8px"
        >
          <mk-sourcepath
            v-bind:value="sourcePath"
            v-on:edit-description="onSourcePathEditDescription"
            v-on:delete="onSourcePathDelete"
          ></mk-sourcepath>
        </div>

        <v-btn text small color="primary" v-on:click="addSource('movies')">Add Source Path</v-btn>
      </v-tab-item>

      <v-tab-item style="padding: 8px">
        <h3>Series - Sourcepaths</h3>
        <div v-if="tvSourcePaths.length == 0">no paths defined</div>

        <div
          v-for="sourcePath in tvSourcePaths"
          v-bind:key="sourcePath.id_SourcePaths"
          style="margin: 8px"
        >
          <mk-sourcepath
            v-bind:value="sourcePath"
            v-on:edit-description="onSourcePathEditDescription"
            v-on:delete="onSourcePathDelete"
          ></mk-sourcepath>
        </div>

        <v-btn text small color="primary" v-on:click="addSource('tv')">Add Source Path</v-btn>
      </v-tab-item>

      <v-tab-item style="padding: 8px">
        <p>These settings describe how MediaBox should handle duplicates.</p>

        <v-card style="width: 100%; margin-top:8px">
          <h3>Actual Duplicates</h3>
          <p>An actual duplicate is identified by the same filename and filesize.</p>
          <p>With actual duplicates, MediaBox should also ...</p>

          <v-checkbox
            label="relink IMDB"
            style="margin: 0px"
            color="dark-grey"
            dense
            v-model="$shared.duplicatesHandling.actualDuplicate.relinkIMDB"
            v-on:click.native="duplicatesHandlingChanged"
          ></v-checkbox>
          <v-checkbox
            label="add to list"
            style="margin: 0px"
            color="dark-grey"
            dense
            v-model="$shared.duplicatesHandling.actualDuplicate.addToList"
            v-on:click.native="duplicatesHandlingChanged"
          ></v-checkbox>
          <v-checkbox
            label="update title"
            style="margin: 0px"
            color="dark-grey"
            dense
            v-model="$shared.duplicatesHandling.actualDuplicate.updateTitle"
            v-on:click.native="duplicatesHandlingChanged"
          ></v-checkbox>
          <v-checkbox
            label="update sub-title"
            style="margin: 0px"
            color="dark-grey"
            dense
            v-model="$shared.duplicatesHandling.actualDuplicate.updateSubTitle"
            v-on:click.native="duplicatesHandlingChanged"
          ></v-checkbox>
          <v-checkbox
            label="update rating"
            style="margin: 0px"
            color="dark-grey"
            dense
            v-model="$shared.duplicatesHandling.actualDuplicate.updateRating"
            v-on:click.native="duplicatesHandlingChanged"
          ></v-checkbox>
          <v-checkbox
            label="update last access"
            style="margin: 0px"
            color="dark-grey"
            dense
            v-model="$shared.duplicatesHandling.actualDuplicate.updateLastAccess"
            v-on:click.native="duplicatesHandlingChanged"
          ></v-checkbox>
        </v-card>

        <v-card style="width: 100%; margin-top:8px">
          <h3>Actual Duplicates</h3>
          <p>A meta duplicate is identified by having the same IMDB link. This can happen if you have the same movie with different format (HD vs. SD).</p>
          <p>With meta duplicates, MediaBox should also ...</p>

          <v-checkbox
            label="add to list"
            style="margin: 0px"
            color="dark-grey"
            dense
            v-model="$shared.duplicatesHandling.metaDuplicate.addToList"
            v-on:click.native="duplicatesHandlingChanged"
          ></v-checkbox>
          <v-checkbox
            label="update rating"
            style="margin: 0px"
            color="dark-grey"
            dense
            v-model="$shared.duplicatesHandling.metaDuplicate.updateRating"
            v-on:click.native="duplicatesHandlingChanged"
          ></v-checkbox>
        </v-card>
      </v-tab-item>
    </v-tabs>

    <mk-sourcepath-description-dialog
      ref="sourcePathDescriptionDialog"
      v-bind:show="sourcePathDescriptionDialog.show"
      title="Edit Description"
      v-bind:question="`Please provide a description for the source path ${sourcePathDescriptionDialog.Path} (${sourcePathDescriptionDialog.MediaTypeUpper})`"
      enterTextValue="true"
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
import * as _ from "lodash";

import { eventBus } from "@/main";
import * as store from "@/store";
import SourcePath from "@/components/shared/SourcePath";
import Dialog from "./shared/Dialog.vue";
import * as helpers from "@/helpers/helpers";

export default {
  components: {
    "mk-sourcepath": SourcePath,
    "mk-sourcepath-description-dialog": Dialog,
    "mk-sourcepath-remove-dialog": Dialog
  },

  data: () => ({
    MediaplayerPath: null,
    MediainfoPath: null,
    minimumWaitForSetAccess: 5,

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

  watch: {
    minimumWaitForSetAccess: function(newValue, oldValue) {
      if (this.debouncedUpdateMinimumWaitForSetAccess) {
        this.debouncedUpdateMinimumWaitForSetAccess();
      }
    }
  },

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
    browseMediaplayerPath() {
      const filters = helpers.isWindows
        ? [
            { name: "Executables", extensions: ["exe"] },
            { name: "All Files", extensions: ["*"] }
          ]
        : [{ name: "All Files", extensions: ["*"] }];

      dialog.showOpenDialog(
        {
          title: "Path to your media player (e.g. VLC)",
          properties: ["openFile"],
          filters,
          defaultPath: this.MediaplayerPath || ""
        },
        path => {
          if (!path || path.length === 0) {
            return;
          }

          this.MediaplayerPath = path[0];

          store.setSetting("MediaplayerPath", this.MediaplayerPath);
        }
      );
    },

    browseMediainfoPath() {
      const filters = helpers.isWindows
        ? [
            { name: "Executables", extensions: ["exe"] },
            { name: "All Files", extensions: ["*"] }
          ]
        : [{ name: "All Files", extensions: ["*"] }];

      dialog.showOpenDialog(
        {
          title: "Path to mediainfo (get it from mediaarea.net)",
          properties: ["openFile"],
          filters,
          defaultPath: this.MediainfoPath || ""
        },
        path => {
          if (!path || path.length === 0) {
            return;
          }

          this.MediainfoPath = path[0];

          store.setSetting("MediainfoPath", this.MediainfoPath);
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
        eventBus.showSnackbar("error", err);
      }
      // })();
    },

    onSourcePathEditDescription(sourcePathItem) {
      this.sourcePathDescriptionDialog.id_SourcePaths =
        sourcePathItem.id_SourcePaths;
      this.sourcePathDescriptionDialog.Path = sourcePathItem.Path;
      this.sourcePathDescriptionDialog.MediaTypeUpper = sourcePathItem.MediaType.toUpperCase();
      this.sourcePathDescriptionDialog.Description = sourcePathItem.Description;

      this.$refs.sourcePathDescriptionDialog.initTextValue(
        sourcePathItem.Description
      );

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

          eventBus.showSnackbar("success", `Source path removed.`);
        } catch (err) {
          eventBus.showSnackbar("error", err);
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

          eventBus.showSnackbar("success", `Description updated.`);
        } catch (err) {
          eventBus.showSnackbar("error", err);
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
            `${this.sourcePathDescriptionDialog.Path} added to ${this.sourcePathDescriptionDialog.MediaTypeUpper} source directories`
          );
        } catch (err) {
          eventBus.showSnackbar("error", err);
        }
      })();
    },

    updateMinimumWaitForSetAccess: function() {
      logger.log(
        "updating minimumWaitForSetAccess setting:",
        this.minimumWaitForSetAccess
      );
      store.setSetting("minimumWaitForSetAccess", this.minimumWaitForSetAccess);
    },

    duplicatesHandlingChanged() {
      logger.log('$shared.duplicatesHandling:', this.$shared.duplicatesHandling);
      store.setSetting('duplicatesHandling', JSON.stringify(this.$shared.duplicatesHandling));
    }
  },

  // ### LifeCycle Hooks ###
  async created() {
    await this.fetchSourcePaths();
    this.MediaplayerPath = await store.getSetting("MediaplayerPath");
    this.MediainfoPath = await store.getSetting("MediainfoPath");
    this.minimumWaitForSetAccess = await store.getSetting(
      "minimumWaitForSetAccess"
    );

    // lodash debounced functions
    this.debouncedUpdateMinimumWaitForSetAccess = _.debounce(
      this.updateMinimumWaitForSetAccess,
      500
    );
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.v-messages {
  min-height: 0px !important;
}
</style>
