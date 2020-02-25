<template>
  <div style="width: 100%; margin-left: 8px">
    <h1>
      <v-btn text v-on:click="$router.go(-1)">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>Settings
    </h1>

    <v-tabs color="white">
      <v-tab>General</v-tab>
      <v-tab>Movies</v-tab>
      <v-tab>Series</v-tab>
      <v-tab>Duplicates</v-tab>
      <v-tab>Regions</v-tab>
      <v-tab>Languages</v-tab>
      <v-tab>Title Types</v-tab>

      <!-- GENERAL -->
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

      <!-- MOVIES -->
      <v-tab-item style="padding: 8px">
        <h3>Movies - Source Paths</h3>
        <v-alert
          type="warning"
          colored-border
          border="left"
          v-if="moviesSourcePaths.length == 0"
        >no paths defined</v-alert>

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

      <!-- SERIES -->
      <v-tab-item style="padding: 8px">
        <h3>Series - Sourcepaths</h3>
        <v-alert
          type="warning"
          colored-border
          border="left"
          v-if="tvSourcePaths.length == 0"
        >no paths defined</v-alert>

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

      <!-- DUPLICATES -->
      <v-tab-item style="padding: 8px">
        <p>These settings describe how MediaBox should handle duplicates.</p>
        <p>You may have duplicates in the following scenarios:</p>
        <ul>
          <li>same file on a remote server and the local machine</li>
          <li>same movie but in different formats (e.g. SD, HD and 4k)</li>
        </ul>

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
            label="update secondary title"
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
          <h3>Meta Duplicates</h3>
          <p>A meta duplicate is identified by having the same IMDB link. This can happen if you have the same movie in different formats (e.g. SD, HD, 4k).</p>
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

      <!-- REGIONS -->
      <v-tab-item style="padding: 8px">
        <p>Define the Regions which should be used for the title of the movies.</p>
        <p>If a particular movie does not have a title for one of these regions, the Original Title of the movie is used. Else, the Original Title will be used as Secondary Title if it is different.</p>

        <v-alert type="warning" colored-border border="left" v-if="$shared.regions.length === 0">
          <span
            v-if="$shared.regions.length === 0 && $shared.fallbackRegion"
          >You currently don't have a region set up. MediaBox will fall back to your system's locale: {{ $shared.fallbackRegion.name }}.</span>
          <span
            v-if="$shared.regions.length === 0 && !$shared.fallbackRegion"
          >You currently don't have a region set up. MediaBox will fall back to the original title.</span>
        </v-alert>

        <div v-for="region in $shared.regions" v-bind:key="region.code">
          <v-row style="margin: 8px">
            <v-card style="width: 100%">
              <v-list-item two-line>
                <v-list-item-content>
                  <v-list-item-title>
                    {{ region.name }}
                    <v-icon
                      color="red"
                      style="cursor: pointer"
                      v-on:click="onDeleteRegion(region)"
                    >mdi-delete</v-icon>
                    <v-icon
                      v-if="!isTopRegion(region)"
                      style="cursor: pointer"
                      v-on:click="onRegionMoveUp(region)"
                    >mdi-arrow-up</v-icon>
                    <v-icon
                      v-if="!isBottomRegion(region)"
                      style="cursor: pointer"
                      v-on:click="onRegionMoveDown(region)"
                    >mdi-arrow-down</v-icon>
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-card>
          </v-row>
        </div>

        <v-btn text small color="primary" v-on:click="openAddRegionsDialog">Add Regions</v-btn>
      </v-tab-item>

      <!-- LANGUAGES -->
      <v-tab-item style="padding: 8px">
        <h3>Language of the Primary Title</h3>

        <v-alert
          type="warning"
          colored-border
          border="left"
          v-if="$shared.imdbTitleTypesWhitelist.length === 0"
        >Please provide at least one language to use for the Primary Title.</v-alert>

        <mk-title-type
          v-for="item in $shared.imdbTitleTypesWhitelist"
          v-bind:key="item.TitleType"
          v-bind:value="item"
          v-bind:showRemove="true"
          v-on:removeTitleType="onRemoveTitleType"
        ></mk-title-type>

        <v-btn text small color="primary" v-on:click="openAddTitleTypeDialog">Add Title Type</v-btn> -->
      </v-tab-item>


      <!-- TITLE TYPES -->
      <v-tab-item style="padding: 8px">
        <p>In "Regions" you provided the regions to be used for the Primary Title. However, many titles in IMDB have a special title type. MediaBox skips all special title types by default. You can add title types here, so that they are actually used instead of being skipped.</p>

        <v-alert
          colored-border
          border="left"
          v-if="$shared.imdbTitleTypesWhitelist.length === 0"
        >No title types added, this is fine.</v-alert>

        <mk-title-type
          v-for="item in $shared.imdbTitleTypesWhitelist"
          v-bind:key="item.TitleType"
          v-bind:value="item"
          v-bind:showRemove="true"
          v-on:removeTitleType="onRemoveTitleType"
        ></mk-title-type>

        <v-btn text small color="primary" v-on:click="openAddTitleTypeDialog">Add Title Type</v-btn>
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
    <mk-add-regions-dialog
      ref="addRegionsDialog"
      v-bind:show="addRegionsDialog.show"
      v-on:cancel="onAddRegionsDialogCancel"
      v-on:ok="onAddRegionsDialogOK"
    ></mk-add-regions-dialog>
    <mk-add-title-type-dialog
      ref="addTitleTypeDialog"
      v-bind:show="addTitleTypeDialog.show"
      v-on:close="onAddTitleTypeDialogClose"
      v-on:addTitleType="onAddTitleType"
    ></mk-add-title-type-dialog>
  </div>
</template>

<script>
const { dialog, BrowserWindow } = require("electron").remote;
const logger = require("loglevel");
import * as _ from "lodash";

import { eventBus } from "@/main";
import * as store from "@/store";
import SourcePath from "@/components/shared/SourcePath";
import Dialog from "@/components/shared/Dialog.vue";
import AddRegionsDialog from "@/components/shared/AddRegionsDialog.vue";
import AddTitleTypeDialog from "@/components/shared/AddTitleTypeDialog.vue";
import TitleType from "@/components/shared/TitleType.vue";
import * as helpers from "@/helpers/helpers";

export default {
  components: {
    "mk-sourcepath": SourcePath,
    "mk-sourcepath-description-dialog": Dialog,
    "mk-sourcepath-remove-dialog": Dialog,
    "mk-add-regions-dialog": AddRegionsDialog,
    "mk-add-title-type-dialog": AddTitleTypeDialog,
    "mk-title-type": TitleType
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

    addRegionsDialog: {
      show: false
    },

    addTitleTypeDialog: {
      show: false
    },

    tmpPath: ""
  }),

  watch: {
    minimumWaitForSetAccess: function() {
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

          this.$refs.sourcePathDescriptionDialog.initTextValue(
            helpers.getDirectoryName(folderposition[0])
          );

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
          eventBus.showLoadingOverlay(true);

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

          await store.ensureMovieDeleted();

          await this.fetchSourcePaths();

          eventBus.showLoadingOverlay(false);

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
            `INSERT INTO tbl_SourcePaths (MediaType, Path, Description, checkRemovedFiles, created_at) VALUES ($MediaType, $Path, $Description, 1, DATETIME('now'))`,
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
      logger.log(
        "$shared.duplicatesHandling:",
        this.$shared.duplicatesHandling
      );
      store.setSetting(
        "duplicatesHandling",
        JSON.stringify(this.$shared.duplicatesHandling)
      );
    },

    openAddRegionsDialog() {
      this.addRegionsDialog.show = true;

      this.$refs.addRegionsDialog.init();
    },

    onAddRegionsDialogCancel() {
      this.addRegionsDialog.show = false;
    },

    async onAddRegionsDialogOK(result) {
      logger.log("result:", result);

      let maxSort = 0;

      this.$shared.regions.forEach(
        region => (maxSort = Math.max(maxSort, region.sort))
      );

      maxSort++;

      result.forEach(region =>
        this.$shared.regions.push(Object.assign(region, { sort: maxSort++ }))
      );

      await store.setSetting("regions", JSON.stringify(this.$shared.regions));

      this.addRegionsDialog.show = false;
    },

    isTopRegion(region) {
      return (
        this.$shared.regions.findIndex(
          region2 => region2.sort < region.sort
        ) === -1
      );
    },

    isBottomRegion(region) {
      return (
        this.$shared.regions.findIndex(
          region2 => region2.sort > region.sort
        ) === -1
      );
    },

    async onRegionMoveUp(region) {
      for (let i = 0; i < this.$shared.regions.length; i++) {
        if (this.$shared.regions[i].sort === region.sort - 1) {
          this.$shared.regions[i].sort++;
          region.sort--;
          logger.log(this.$shared.regions);

          this.$shared.regions.sort((a, b) => a.sort - b.sort);
          await store.setSetting(
            "regions",
            JSON.stringify(this.$shared.regions)
          );
          return;
        }
      }
    },

    async onRegionMoveDown(region) {
      for (let i = 0; i < this.$shared.regions.length; i++) {
        if (this.$shared.regions[i].sort === region.sort + 1) {
          this.$shared.regions[i].sort--;
          region.sort++;
          logger.log(this.$shared.regions);

          this.$shared.regions.sort((a, b) => a.sort - b.sort);
          await store.setSetting(
            "regions",
            JSON.stringify(this.$shared.regions)
          );
          return;
        }
      }
    },

    async onDeleteRegion(region) {
      const sort = region.sort;
      this.$shared.regions.splice(
        this.$shared.regions.findIndex(region2 => region2 === region),
        1
      );
      this.$shared.regions.forEach(
        region =>
          (region.sort = region.sort > sort ? region.sort - 1 : region.sort)
      );
      await store.setSetting("regions", JSON.stringify(this.$shared.regions));
    },

    openAddTitleTypeDialog() {
      this.addTitleTypeDialog.show = true;

      this.$refs.addTitleTypeDialog.init();
    },

    onAddTitleTypeDialogClose() {
      this.addTitleTypeDialog.show = false;
    },

    async onAddTitleType(titleType) {
      this.$shared.imdbTitleTypesWhitelist.push(titleType);
      this.addTitleTypeDialog.show = false;

      await store.setSetting(
        "IMDBTitleTypeWhitelist",
        JSON.stringify(this.$shared.imdbTitleTypesWhitelist)
      );

      eventBus.showSnackbar(
        "success",
        `title type "${titleType.TitleType}" added`
      );
    },

    async onRemoveTitleType(titleType) {
      this.$shared.imdbTitleTypesWhitelist.splice(
        this.$shared.imdbTitleTypesWhitelist.findIndex(
          item => item.TitleType === titleType.TitleType
        ),
        1
      );

      await store.setSetting(
        "IMDBTitleTypeWhitelist",
        JSON.stringify(this.$shared.imdbTitleTypesWhitelist)
      );

      eventBus.showSnackbar(
        "success",
        `title type "${titleType.TitleType}" removed`
      );
    }
  },

  // ### LifeCycle Hooks ###
  async created() {
    await this.fetchSourcePaths();

    const regions = await store.getSetting("regions");
    if (regions) {
      this.$shared.regions = JSON.parse(regions);
    }

    logger.log('this.$shared.regions:', this.$shared.regions);

    const imdbTitleTypesWhitelist = await store.getSetting(
      "IMDBTitleTypeWhitelist"
    );
    if (imdbTitleTypesWhitelist) {
      this.$shared.imdbTitleTypesWhitelist = JSON.parse(
        imdbTitleTypesWhitelist
      );
    }

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
  visibility: hidden;
}
</style>
