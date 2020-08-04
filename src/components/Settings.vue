<template>
  <div style="width: 100%; margin-left: 8px">
    <h1>
      <v-btn text v-on:click="$router.go(-1)">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      {{$t("Settings")}}
    </h1>

    <v-tabs color="white">
      <v-tab>{{$t("General")}}</v-tab>
      <v-tab>{{$t("Movies")}}</v-tab>
      <v-tab>{{$t("Series")}}</v-tab>
      <v-tab>{{$t("Duplicates")}}</v-tab>
      <v-tab>{{$t("Regions")}}</v-tab>
      <v-tab>{{$t("Languages")}}</v-tab>
      <v-tab>{{$t("Title Types")}}</v-tab>
      <v-tab>{{$t("Release Attributes")}}</v-tab>

      <!-- GENERAL -->
      <v-tab-item style="padding: 8px">
        <v-row class="settings-row">
          <v-text-field readonly v-bind:label="$t('Media Player Path')" v-model="MediaplayerPath"></v-text-field>
          <v-btn
            v-on:click="browseMediaplayerPath()"
            text
            small
            color="primary"
            style="margin-top: 16px"
          >{{$t("Browse")}}</v-btn>
        </v-row>

        <v-row class="settings-row">
          <v-text-field readonly v-bind:label="$t('Mediainfo CLI Path')" v-model="MediainfoPath"></v-text-field>
          <v-btn
            v-on:click="browseMediainfoPath()"
            text
            small
            color="primary"
            style="margin-top: 16px"
          >{{$t("Browse")}}</v-btn>
        </v-row>

        <v-row class="settings-row">
          <v-text-field
            type="number"
            v-bind:label="$t('Number of seconds a medium should run until last access is updated')"
            v-model="minimumWaitForSetAccess"
          ></v-text-field>
        </v-row>

        <v-row class="settings-row">
          <v-select
            v-bind:label="$t('IMDB Rating Demographic')"
            item-text="long"
            item-value="code"
            v-model="$shared.imdbRatingDemographic"
            v-bind:items="$shared.imdbRatingDemographics"
          ></v-select>
        </v-row>

        <v-btn text small color="primary" v-on:click="openVersionDialog">{{$t("Show Version Info")}}</v-btn>
        <v-btn
          text
          small
          color="primary"
          v-on:click="openCheckIMDBScraperDialog"
        >{{$t("Check IMDB Scraper")}}</v-btn>
        <v-btn text small color="primary" v-on:click="openDevTools">{{$t("Open DevTools")}}</v-btn>
      </v-tab-item>

      <!-- MOVIES -->
      <v-tab-item style="padding: 8px">
        <h3>{{$t("Movies")}} - {{$t("Source Paths")}}</h3>
        <v-alert
          type="warning"
          colored-border
          border="left"
          v-if="moviesSourcePaths.length == 0"
        >{{$t("no paths defined")}}</v-alert>

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

        <v-btn text small color="primary" v-on:click="addSource('movies')">{{$t("Add Source Path")}}</v-btn>
      </v-tab-item>

      <!-- SERIES -->
      <v-tab-item style="padding: 8px">
        <h3>{{$t("Series")}} - {{$t("Source Paths")}}</h3>
        <v-alert
          type="warning"
          colored-border
          border="left"
          v-if="tvSourcePaths.length == 0"
        >{{$t("no paths defined")}}</v-alert>

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

        <v-btn text small color="primary" v-on:click="addSource('series')">{{$t("Add Source Path")}}</v-btn>
      </v-tab-item>

      <!-- DUPLICATES -->
      <v-tab-item style="padding: 8px">
        <i>
          <p>{{$t('These settings describe how {appName} should handle duplicates', {appName: $t('appName')})}}</p>
          <p>{{$t('You may have duplicates in the following scenarios')}}:</p>
          <ul>
            <li>{{$t('same file on a remote server and the local machine')}}</li>
            <li>{{$t('same media but in different formats')}}</li>
          </ul>
        </i>

        <v-card style="width: 100%; margin-top:8px">
          <h3>{{$t('Actual Duplicates')}}</h3>
          <i>
            <p>{{$t('An actual duplicate is identified by the same filename and filesize')}}</p>
          </i>
          <p>{{$t('With actual duplicates, {appName} should also', {appName: $t('appName')})}}</p>

          <v-checkbox
            v-bind:label="$t('relink IMDB')"
            style="margin: 0px"
            color="dark-grey"
            dense
            v-model="$shared.duplicatesHandling.actualDuplicate.relinkIMDB"
            v-on:click.native="duplicatesHandlingChanged"
          ></v-checkbox>
          <v-checkbox
            v-bind:label="$t('add to list')"
            style="margin: 0px"
            color="dark-grey"
            dense
            v-model="$shared.duplicatesHandling.actualDuplicate.addToList"
            v-on:click.native="duplicatesHandlingChanged"
          ></v-checkbox>
          <v-checkbox
            v-bind:label="$t('update primary title')"
            style="margin: 0px"
            color="dark-grey"
            dense
            v-model="$shared.duplicatesHandling.actualDuplicate.updateTitle"
            v-on:click.native="duplicatesHandlingChanged"
          ></v-checkbox>
          <v-checkbox
            v-bind:label="$t('update secondary title')"
            style="margin: 0px"
            color="dark-grey"
            dense
            v-model="$shared.duplicatesHandling.actualDuplicate.updateSubTitle"
            v-on:click.native="duplicatesHandlingChanged"
          ></v-checkbox>
          <v-checkbox
            v-bind:label="$t('update rating')"
            style="margin: 0px"
            color="dark-grey"
            dense
            v-model="$shared.duplicatesHandling.actualDuplicate.updateRating"
            v-on:click.native="duplicatesHandlingChanged"
          ></v-checkbox>
          <v-checkbox
            v-bind:label="$t('update last access')"
            style="margin: 0px"
            color="dark-grey"
            dense
            v-model="$shared.duplicatesHandling.actualDuplicate.updateLastAccess"
            v-on:click.native="duplicatesHandlingChanged"
          ></v-checkbox>
        </v-card>

        <v-card style="width: 100%; margin-top:8px">
          <h3>{{$t('Meta Duplicates')}}</h3>
          <i>
            <p>{{$t('A meta duplicate is identified by having the same IMDB link_ This can happen if you have the same movie in different formats')}}</p>
          </i>
          <p>{{$t('With meta duplicates, {appName} should also', {appName: $t('appName')})}}</p>

          <v-checkbox
            v-bind:label="$t('add to list')"
            style="margin: 0px"
            color="dark-grey"
            dense
            v-model="$shared.duplicatesHandling.metaDuplicate.addToList"
            v-on:click.native="duplicatesHandlingChanged"
          ></v-checkbox>
          <v-checkbox
            v-bind:label="$t('update rating')"
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
        <i>
          <p>{{$t('The regions and their sequence defined here will be used for the Primary Title of the media as well as the age rating')}}</p>
          <p>{{$t('If a particular movie does not have a title for one of these regions, the Original Title of the movie is used Else, the Original Title will be used as Secondary Title if it is different')}}</p>
        </i>

        <v-alert type="warning" colored-border border="left" v-if="$shared.regions.length === 0">
          <span
            v-if="$shared.regions.length === 0 && $shared.fallbackRegion"
          >{{$t('You currently don_t have a region set up_ {appName} will fall back to your system_s locale', {appName: $t('appName')})}}: {{ $shared.fallbackRegion.name }}.</span>
          <span
            v-if="$shared.regions.length === 0 && !$shared.fallbackRegion"
          >{{$t('You currently don_t have a region set up_ {appName} will fall back to the original title_', {appName: $t('appName')})}}</span>
        </v-alert>

        <div>
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
        </div>

        <v-btn text small color="primary" v-on:click="openAddRegionsDialog">{{$t('Add Regions')}}</v-btn>
      </v-tab-item>

      <!-- LANGUAGES -->
      <v-tab-item style="padding: 8px">
        <h3>{{$t('Language of the Application')}}</h3>
        <i>
          <p>{{$t('Change the language of the application here_')}}</p>
        </i>

        <v-row class="settings-row">
          <v-select
            item-text="name"
            item-value="code"
            v-model="$shared.uiLanguage"
            v-bind:items="$shared.supportedLanguages"
            style="margin-top: -16px; margin-bottom: 16px"
          ></v-select>
        </v-row>

        <h3>{{$t('Languages of the Primary Title')}}</h3>

        <i>
          <p>{{$t('The languages and their sequence defined here will be used for the Primary Title of the media_')}}</p>
        </i>

        <v-alert
          type="warning"
          colored-border
          border="left"
          v-if="!$shared.languagesPrimaryTitle || $shared.languagesPrimaryTitle.length === 0"
        >
          <span
            v-if="$shared.fallbackLanguage"
          >{{$t('You currently don_t have a language for the Primary Title set up_ {appName} will fall back to your system_s locale', {appName: $t('appName')})}}: {{ $shared.fallbackLanguage.DisplayText }}.</span>
          <span
            v-if="!$shared.fallbackLanguage"
          >{{$t('You currently don_t have a language for the Primary Title set up_ {appName} will fall back to the original title_', {appName: $t('appName')})}}</span>
        </v-alert>

        <div>
          <div v-for="language in $shared.languagesPrimaryTitle" v-bind:key="language.code">
            <v-row style="margin: 8px">
              <v-card style="width: 100%">
                <v-list-item two-line>
                  <v-list-item-content>
                    <v-list-item-title>
                      {{ language.DisplayText }}
                      <v-icon
                        color="red"
                        style="cursor: pointer"
                        v-on:click="onDeleteLanguage(language, 'languagesPrimaryTitle')"
                      >mdi-delete</v-icon>
                      <v-icon
                        v-if="!isTopLanguage(language, 'languagesPrimaryTitle')"
                        style="cursor: pointer"
                        v-on:click="onLanguageMoveUp(language, 'languagesPrimaryTitle')"
                      >mdi-arrow-up</v-icon>
                      <v-icon
                        v-if="!isBottomLanguage(language, 'languagesPrimaryTitle')"
                        style="cursor: pointer"
                        v-on:click="onLanguageMoveDown(language, 'languagesPrimaryTitle')"
                      >mdi-arrow-down</v-icon>
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-card>
            </v-row>
          </div>
        </div>

        <v-btn
          text
          small
          color="primary"
          v-on:click="openAddLanguagesDialog('languagesPrimaryTitle')"
        >{{$t('Add Languages')}}</v-btn>

        <h3>{{$t('Languages for Audio and Subtitles')}}</h3>

        <i>
          <p>{{$t('The languages and their sequence defined here will be used to show which audio and subtitle languages your media contain_')}}</p>
        </i>

        <v-alert
          type="warning"
          colored-border
          border="left"
          v-if="!$shared.languagesAudioSubtitles || $shared.languagesAudioSubtitles.length === 0"
        >
          <span
            v-if="$shared.fallbackLanguage"
          >{{$t('You currently don_t have a language for Audio and Subtitles set up_ {appName} will fall back to your system_s locale', {appName: $t('appName') })}}: {{ $shared.fallbackLanguage.DisplayText }}.</span>
          <span
            v-if="!$shared.fallbackLanguage"
          >{{$t('You currently don_t have a language for Audio and Subtitles set up. {appName} will fall back to the original title_', {appName: $t('appName')})}}</span>
        </v-alert>

        <div>
          <div v-for="language in $shared.languagesAudioSubtitles" v-bind:key="language.code">
            <v-row style="margin: 8px">
              <v-card style="width: 100%">
                <v-list-item two-line>
                  <v-list-item-content>
                    <v-list-item-title>
                      {{ language.DisplayText }}
                      <v-icon
                        color="red"
                        style="cursor: pointer"
                        v-on:click="onDeleteLanguage(language, 'languagesAudioSubtitles')"
                      >mdi-delete</v-icon>
                      <v-icon
                        v-if="!isTopLanguage(language, 'languagesAudioSubtitles')"
                        style="cursor: pointer"
                        v-on:click="onLanguageMoveUp(language, 'languagesAudioSubtitles')"
                      >mdi-arrow-up</v-icon>
                      <v-icon
                        v-if="!isBottomLanguage(language, 'languagesAudioSubtitles')"
                        style="cursor: pointer"
                        v-on:click="onLanguageMoveDown(language, 'languagesAudioSubtitles')"
                      >mdi-arrow-down</v-icon>
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-card>
            </v-row>
          </div>
        </div>

        <v-btn
          text
          small
          color="primary"
          v-on:click="openAddLanguagesDialog('languagesAudioSubtitles')"
        >{{$t('Add Languages')}}</v-btn>
      </v-tab-item>

      <!-- TITLE TYPES -->
      <v-tab-item style="padding: 8px">
        <p>{{$t('In _Regions_ you provided the regions to be used for the Primary Title_ However, many titles in IMDB have a special title type_ {appName} skips all special title types by default_ You can add title types here, so that they are actually used instead of being skipped_', {appName: $t('appName')})}}</p>

        <v-alert
          colored-border
          border="left"
          v-if="$shared.imdbTitleTypesWhitelist.length === 0"
        >{{$t('No title types added, this is fine_')}}</v-alert>

        <mk-title-type
          v-for="item in $shared.imdbTitleTypesWhitelist"
          v-bind:key="item.TitleType"
          v-bind:value="item"
          v-bind:showRemove="true"
          v-on:removeTitleType="onRemoveTitleType"
        ></mk-title-type>

        <v-btn
          text
          small
          color="primary"
          v-on:click="openAddTitleTypeDialog"
        >{{$t('Add Title Type')}}</v-btn>
      </v-tab-item>

      <!-- RELEASE ATTRIBUTES -->
      <v-tab-item style="padding: 8px">
        <p>{{$t('Here you can set up which release attributes should be searched for in the file/directory names and how they should be displayed_')}}</p>
        <p>{{$t('The search term is case insensitive and must contain whole words within the file/directory name_')}}</p>

        <v-data-table
          v-bind:headers="[{ text: $t('Search Term'), value: 'searchTerm'}, { text: $t('Display As'), value: 'displayAs'}, { text: '', value: 'actions', sortable: false }]"
          v-bind:items="shared_releaseAttributesFiltered"
          class="elevation-1"
          hide-default-footer
          v-bind:items-per-page="1000"
        >
          <template v-slot:item.actions="{ item }">
            <v-icon small class="mr-2" @click="onEditReleaseAttribute(item)">mdi-pencil</v-icon>
            <v-icon
              small
              class="mr-2"
              color="red"
              @click="onDeleteReleaseAttribute(item)"
            >mdi-delete</v-icon>
            <v-icon
              small
              class="mr-2"
              v-bind:disabled="item.sort === 1"
              @click="onReleaseAttributeUp(item)"
            >mdi-arrow-up</v-icon>
            <v-icon
              small
              class="mr-2"
              v-bind:disabled="item.sort === releaseAttributesMaxSort"
              @click="onReleaseAttributeDown(item)"
            >mdi-arrow-down</v-icon>
          </template>
        </v-data-table>
        <v-btn
          v-on:click="onAddReleaseAttribute()"
          text
          small
          color="primary"
          style="margin-top: 16px"
        >{{$t("Add")}}</v-btn>
      </v-tab-item>
    </v-tabs>

    <mk-sourcepath-description-dialog
      ref="sourcePathDescriptionDialog"
      v-bind:show="sourcePathDescriptionDialog.show"
      v-bind:title="$t('Edit Description')"
      v-bind:question="$t('Please provide a description for the source path {Path} _{MediaTypeUpper}_', {Path: sourcePathDescriptionDialog.Path, MediaTypeUpper: sourcePathDescriptionDialog.MediaTypeUpper})"
      enterTextValue="true"
      v-bind:ok="$t('OK')"
      v-bind:cancel="$t('Cancel')"
      cancelColor="secondary"
      v-on:ok="onSourcePathDescriptionDialogOK"
      v-on:cancel="onSourcePathDescriptionDialogCancel"
    ></mk-sourcepath-description-dialog>
    <mk-sourcepath-remove-dialog
      v-bind:show="sourcePathRemoveDialog.show"
      v-bind:title="$t('Remove Source Path')"
      v-bind:question="$t('Do you really want to remove the source path {Path} _{MediaTypeUpper}_ including all associated media_')"
      v-bind:yes="$t('YES_ Remove')"
      v-bind:cancel="$t('Cancel')"
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
    <mk-add-languages-dialog
      ref="addLanguagesDialog"
      v-bind:show="addLanguagesDialog.show"
      v-bind:languageType="addLanguagesDialog.languageType"
      v-on:cancel="onAddLanguagesDialogCancel"
      v-on:ok="onAddLanguagesDialogOK"
    ></mk-add-languages-dialog>
    <mk-add-title-type-dialog
      ref="addTitleTypeDialog"
      v-bind:show="addTitleTypeDialog.show"
      v-on:close="onAddTitleTypeDialogClose"
      v-on:addTitleType="onAddTitleType"
    ></mk-add-title-type-dialog>
    <mk-edit-release-attribute-dialog
      ref="editReleaseAttributeDialog"
      v-bind:show="editReleaseAttributeDialog.show"
      v-bind:title="editReleaseAttributeDialog.title"
      v-on:cancel="onEditReleaseAttributeDialogClose"
      v-on:ok="onEditReleaseAttributeDialogOK"
    ></mk-edit-release-attribute-dialog>
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
import AddLanguagesDialog from "@/components/shared/AddLanguagesDialog.vue";
import AddTitleTypeDialog from "@/components/shared/AddTitleTypeDialog.vue";
import EditReleaseAttributeDialog from "@/components/shared/EditReleaseAttributeDialog";
import TitleType from "@/components/shared/TitleType.vue";

import * as helpers from "@/helpers/helpers";

export default {
  components: {
    "mk-sourcepath": SourcePath,
    "mk-sourcepath-description-dialog": Dialog,
    "mk-sourcepath-remove-dialog": Dialog,
    "mk-add-regions-dialog": AddRegionsDialog,
    "mk-add-languages-dialog": AddLanguagesDialog,
    "mk-add-title-type-dialog": AddTitleTypeDialog,
    "mk-edit-release-attribute-dialog": EditReleaseAttributeDialog,
    "mk-title-type": TitleType,
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
      Description: null,
    },

    sourcePathRemoveDialog: {
      show: false,
      id_SourcePaths: null,
      MediaType: null,
      MediaTypeUpper: null,
      Path: null,
    },

    addRegionsDialog: {
      show: false,
    },

    addLanguagesDialog: {
      show: false,
      languageType: null,
    },

    addTitleTypeDialog: {
      show: false,
    },

    tmpPath: "",

    editReleaseAttributeDialog: {
      show: false,
      title: "",
      oldItem: null,
    },
  }),

  watch: {
    minimumWaitForSetAccess: function () {
      if (this.debouncedUpdateMinimumWaitForSetAccess) {
        this.debouncedUpdateMinimumWaitForSetAccess();
      }
    },

    imdbRatingDemographic: function () {
      store.setSetting("IMDBRatingDemographic", this.imdbRatingDemographic);
    },

    shared_uiLanguage: function (newValue) {
      (async () => {
        await store.setSetting("uiLanguage", newValue);

        eventBus.showSnackbar(
          "success",
          this.$t("Application Language saved_")
        );
      })();
    },
  },

  computed: {
    tvSourcePaths() {
      return this.sourcePaths.filter((sourcePath) => {
        return sourcePath.MediaType === "series";
      });
    },

    moviesSourcePaths() {
      return this.sourcePaths.filter((sourcePath) => {
        return sourcePath.MediaType === "movies";
      });
    },

    imdbRatingDemographic() {
      return this.$shared.imdbRatingDemographic;
    },

    shared_uiLanguage() {
      return this.$shared.uiLanguage;
    },

    shared_releaseAttributesFiltered() {
      return this.$shared.releaseAttributes.filter((attrib) => !attrib.deleted);
    },

    releaseAttributesMaxSort() {
      return Math.max(
        ...this.$shared.releaseAttributes
          .filter((item) => !item.deleted)
          .map((item) => item.sort)
      );
    },
  },

  methods: {
    async browseMediaplayerPath() {
      const filters = helpers.isWindows
        ? [
            { name: this.$t("Executables"), extensions: ["exe"] },
            { name: this.$t("All Files"), extensions: ["*"] },
          ]
        : [{ name: this.$t("All Files"), extensions: ["*"] }];

      const path = await dialog.showOpenDialog({
        title: this.$t("Path to your media player _e_g_ VLC_"),
        properties: ["openFile"],
        filters,
        defaultPath: this.MediaplayerPath || "",
      });

      logger.log("path:", path);

      if (path.canceled) {
        return;
      }

      this.MediaplayerPath = path.filePaths[0];

      store.setSetting("MediaplayerPath", this.MediaplayerPath);
    },

    async browseMediainfoPath() {
      const filters = helpers.isWindows
        ? [
            { name: this.$t("Executables"), extensions: ["exe"] },
            { name: this.$t("All Files"), extensions: ["*"] },
          ]
        : [{ name: this.$t("All Files"), extensions: ["*"] }];

      const path = await dialog.showOpenDialog({
        title: this.$t("Path to mediainfo _get it from mediaarea_net_"),
        properties: ["openFile"],
        filters,
        defaultPath: this.MediainfoPath || "",
      });

      if (path.canceled) {
        return;
      }

      this.MediainfoPath = path.filePaths[0];

      store.setSetting("MediainfoPath", this.MediainfoPath);
    },

    async addSource(MediaType) {
      const folderposition = await dialog.showOpenDialog({
        properties: ["openDirectory"],
      });

      if (folderposition.canceled) {
        return;
      }

      logger.log('folgerposition:', folderposition);

      const chosenPath = folderposition.filePaths[0];
      const chosenPathLower = chosenPath.toLowerCase();

      let isAlreadyInUse = false;
      this.sourcePaths.forEach((sourcePath) => {
        const pathLower = sourcePath.Path.toLowerCase();

        if (chosenPathLower.includes(pathLower)) {
          isAlreadyInUse = true;
        }
      });

      if (isAlreadyInUse) {
        return eventBus.showSnackbar(
          "error",
          this.$t("The chosen path is already in use_")
        );
      }

      this.sourcePathDescriptionDialog.id_SourcePaths = null;
      this.sourcePathDescriptionDialog.MediaType = MediaType;
      this.sourcePathDescriptionDialog.MediaTypeUpper = MediaType.toUpperCase();
      this.sourcePathDescriptionDialog.Path = chosenPath;
      this.sourcePathDescriptionDialog.Description = null;

      this.$refs.sourcePathDescriptionDialog.initTextValue(
        helpers.getDirectoryName(chosenPath)
      );

      this.sourcePathDescriptionDialog.show = true;
    },

    openDevTools() {
      BrowserWindow.getFocusedWindow().webContents.openDevTools();
    },

    async fetchSourcePaths() {
      try {
        const paths = await store.fetchSourcePaths();
        this.sourcePaths = paths;
        logger.log(this.sourcePaths);
      } catch (err) {
        eventBus.showSnackbar("error", err);
      }
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
              $id_SourcePaths: this.sourcePathRemoveDialog.id_SourcePaths,
            }
          );

          await store.db.fireProcedure(
            `DELETE FROM tbl_Movies WHERE id_SourcePaths NOT IN (SELECT id_SourcePaths FROM tbl_SourcePaths)`,
            []
          );

          await store.ensureMovieDeleted();

          await this.fetchSourcePaths();

          eventBus.showLoadingOverlay(false);

          eventBus.showSnackbar("success", this.$t("Source path removed_"));
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
              $Description: dialogResult.textValue,
            }
          );

          await this.fetchSourcePaths();

          eventBus.showSnackbar("success", this.$t("Description updated_"));
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
              $Description: dialogResult.textValue,
            }
          );

          await this.fetchSourcePaths();

          eventBus.showSnackbar(
            "success",
            this.$t("{Path} added to {MediaTypeUpper} source directories_", {
              Path: this.sourcePathDescriptionDialog.Path,
              MediaTypeUpper: this.$t(
                this.sourcePathDescriptionDialog.MediaTypeUpper
              ),
            })
          );
        } catch (err) {
          eventBus.showSnackbar("error", err);
        }
      })();
    },

    updateMinimumWaitForSetAccess: function () {
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

    openAddLanguagesDialog(languageType) {
      this.addLanguagesDialog.languageType = languageType;
      this.addLanguagesDialog.show = true;

      this.$refs.addLanguagesDialog.init();
    },

    onAddRegionsDialogCancel() {
      this.addRegionsDialog.show = false;
    },

    onAddLanguagesDialogCancel() {
      this.addLanguagesDialog.show = false;
    },

    async onAddRegionsDialogOK(result) {
      logger.log("result:", result);

      let maxSort = 0;

      this.$shared.regions.forEach(
        (region) => (maxSort = Math.max(maxSort, region.sort))
      );

      maxSort++;

      result.forEach((region) =>
        this.$shared.regions.push(Object.assign(region, { sort: maxSort++ }))
      );

      await store.setSetting("regions", JSON.stringify(this.$shared.regions));

      this.addRegionsDialog.show = false;
    },

    async onAddLanguagesDialogOK(result) {
      logger.log("result:", result);

      const languages =
        this.addLanguagesDialog.languageType === "languagesPrimaryTitle"
          ? this.$shared.languagesPrimaryTitle
          : this.$shared.languagesAudioSubtitles;

      let maxSort = 0;

      languages.forEach(
        (language) => (maxSort = Math.max(maxSort, language.sort))
      );

      maxSort++;

      result.forEach((language) =>
        languages.push(Object.assign(language, { sort: maxSort++ }))
      );

      await store.setSetting(
        this.addLanguagesDialog.languageType,
        JSON.stringify(languages)
      );

      this.addLanguagesDialog.show = false;
    },

    isTopRegion(region) {
      return (
        this.$shared.regions.findIndex(
          (region2) => region2.sort < region.sort
        ) === -1
      );
    },

    isTopLanguage(language, languageType) {
      const languages =
        languageType === "languagesPrimaryTitle"
          ? this.$shared.languagesPrimaryTitle
          : this.$shared.languagesAudioSubtitles;
      return (
        languages.findIndex((language2) => language2.sort < language.sort) ===
        -1
      );
    },

    isBottomRegion(region) {
      return (
        this.$shared.regions.findIndex(
          (region2) => region2.sort > region.sort
        ) === -1
      );
    },

    isBottomLanguage(language, languageType) {
      const languages =
        languageType === "languagesPrimaryTitle"
          ? this.$shared.languagesPrimaryTitle
          : this.$shared.languagesAudioSubtitles;
      return (
        languages.findIndex((language2) => language2.sort > language.sort) ===
        -1
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

    async onLanguageMoveUp(language, languageType) {
      const languages =
        languageType === "languagesPrimaryTitle"
          ? this.$shared.languagesPrimaryTitle
          : this.$shared.languagesAudioSubtitles;

      for (let i = 0; i < languages.length; i++) {
        if (languages[i].sort === language.sort - 1) {
          languages[i].sort++;
          language.sort--;
          logger.log(languages);

          languages.sort((a, b) => a.sort - b.sort);
          await store.setSetting(languageType, JSON.stringify(languages));
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

    async onLanguageMoveDown(language, languageType) {
      const languages =
        languageType === "languagesPrimaryTitle"
          ? this.$shared.languagesPrimaryTitle
          : this.$shared.languagesAudioSubtitles;

      for (let i = 0; i < languages.length; i++) {
        if (languages[i].sort === language.sort + 1) {
          languages[i].sort--;
          language.sort++;
          logger.log(languages);

          languages.sort((a, b) => a.sort - b.sort);
          await store.setSetting(languageType, JSON.stringify(languages));
          return;
        }
      }
    },

    async onDeleteRegion(region) {
      const sort = region.sort;
      this.$shared.regions.splice(
        this.$shared.regions.findIndex((region2) => region2 === region),
        1
      );
      this.$shared.regions.forEach(
        (region) =>
          (region.sort = region.sort > sort ? region.sort - 1 : region.sort)
      );
      await store.setSetting("regions", JSON.stringify(this.$shared.regions));
    },

    async onDeleteLanguage(language, languageType) {
      const languages =
        languageType === "languagesPrimaryTitle"
          ? this.$shared.languagesPrimaryTitle
          : this.$shared.languagesAudioSubtitles;

      const sort = language.sort;

      languages.splice(
        languages.findIndex((language2) => language2 === language),
        1
      );
      languages.forEach(
        (language) =>
          (language.sort =
            language.sort > sort ? language.sort - 1 : language.sort)
      );
      await store.setSetting(languageType, JSON.stringify(languages));
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
        this.$t("Title Type _{TitleType}_ added_", {
          TitleType: titleType.TitleType,
        })
      );
    },

    async onRemoveTitleType(titleType) {
      this.$shared.imdbTitleTypesWhitelist.splice(
        this.$shared.imdbTitleTypesWhitelist.findIndex(
          (item) => item.TitleType === titleType.TitleType
        ),
        1
      );

      await store.setSetting(
        "IMDBTitleTypeWhitelist",
        JSON.stringify(this.$shared.imdbTitleTypesWhitelist)
      );

      eventBus.showSnackbar(
        "success",
        this.$t("Title Type _{TitleType}_ removed_", {
          TitleType: titleType.TitleType,
        })
      );
    },

    openVersionDialog() {
      eventBus.openVersionDialog();
    },

    openCheckIMDBScraperDialog() {
      eventBus.openCheckIMDBScraperDialog();
    },

    onEditReleaseAttribute(item) {
      this.editReleaseAttributeDialog.title = this.$t("Edit Release Attribute");
      this.editReleaseAttributeDialog.oldItem = item;
      this.$refs.editReleaseAttributeDialog.init(
        item.searchTerm,
        item.displayAs
      );
      this.editReleaseAttributeDialog.show = true;
    },

    onAddReleaseAttribute() {
      this.editReleaseAttributeDialog.title = this.$t("Add Release Attribute");
      this.editReleaseAttributeDialog.oldItem = null;
      this.$refs.editReleaseAttributeDialog.init("", "");
      this.editReleaseAttributeDialog.show = true;
    },

    async onReleaseAttributeUp(item) {
      const nextSort = Math.max(
        ...this.$shared.releaseAttributes
          .map((ra) => ra.sort)
          .filter((ra) => ra < item.sort)
      );

      if (nextSort) {
        const ra = this.$shared.releaseAttributes.find(
          (ra) => ra.sort === nextSort
        );

        ra.sort = item.sort;
        item.sort = nextSort;

        store.sortReleaseAttributes();

        await store.setSetting(
          "ReleaseAttributes",
          JSON.stringify(this.$shared.releaseAttributes)
        );

        // HACK: update view
        const temp = this.$shared.releaseAttributes;
        this.$shared.releaseAttributes = null;
        this.$shared.releaseAttributes = temp;
      }
    },

    async onReleaseAttributeDown(item) {
      const nextSort = Math.min(
        ...this.$shared.releaseAttributes
          .map((ra) => ra.sort)
          .filter((ra) => ra > item.sort)
      );

      if (nextSort) {
        const ra = this.$shared.releaseAttributes.find(
          (ra) => ra.sort === nextSort
        );

        ra.sort = item.sort;
        item.sort = nextSort;

        store.sortReleaseAttributes();

        await store.setSetting(
          "ReleaseAttributes",
          JSON.stringify(this.$shared.releaseAttributes)
        );

        // HACK: update view
        const temp = this.$shared.releaseAttributes;
        this.$shared.releaseAttributes = null;
        this.$shared.releaseAttributes = temp;
      }
    },

    onEditReleaseAttributeDialogClose() {
      this.editReleaseAttributeDialog.show = false;
    },

    async onEditReleaseAttributeDialogOK(item) {
      try {
        const searchTerm = item.searchTerm.toLowerCase();
        const displayAs = item.displayAs;

        let foundItem = this.editReleaseAttributeDialog.oldItem;

        if (!foundItem) {
          foundItem = this.$shared.releaseAttributes.find(
            (item2) => item2.searchTerm === searchTerm && item2.deleted
          );
        }

        if (!foundItem) {
          this.$shared.releaseAttributes.push({
            searchTerm,
            displayAs,
            deleted: false,
            sort: this.editReleaseAttributeDialog.oldItem
              ? this.editReleaseAttributeDialog.oldItem.sort
              : this.releaseAttributesMaxSort
              ? this.releaseAttributesMaxSort
              : 99999,
          });
        } else {
          foundItem.displayAs = displayAs;
          foundItem.deleted = false;

          if (this.editReleaseAttributeDialog.oldItem) {
            foundItem.sort = this.editReleaseAttributeDialog.oldItem.sort;
          }
        }

        store.sortReleaseAttributes();

        await store.setSetting(
          "ReleaseAttributes",
          JSON.stringify(this.$shared.releaseAttributes)
        );

        eventBus.showSnackbar(
          "success",
          this.$t("Release Attribute saved successfully_")
        );
      } catch (e) {
        eventBus.showSnackbar("error", e);
      }

      this.editReleaseAttributeDialog.show = false;
    },

    async onDeleteReleaseAttribute(item) {
      try {
        item.deleted = true;

        store.sortReleaseAttributes();

        await store.setSetting(
          "ReleaseAttributes",
          JSON.stringify(this.$shared.releaseAttributes)
        );

        // HACK: update view
        const temp = this.$shared.releaseAttributes;
        this.$shared.releaseAttributes = null;
        this.$shared.releaseAttributes = temp;

        eventBus.showSnackbar(
          "success",
          this.$t("Release Attribute removed successfully_")
        );
      } catch (e) {
        eventBus.showSnackbar("error", e);
      }
    },
  },

  // ### LifeCycle Hooks ###
  async created() {
    await this.fetchSourcePaths();

    const regions = await store.getSetting("regions");
    if (regions) {
      this.$shared.regions = JSON.parse(regions);
    }

    // await store.fetchLanguageSettings();

    logger.log("this.$shared.regions:", this.$shared.regions);

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
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.v-messages {
  min-height: 0px !important;
  visibility: hidden;
}

.settings-row {
  margin: 0px 0px 16px 0px;
}
</style>
