<template>
  <v-dialog
    v-if="mediaItem"
    :model-value="show"
    @update:model-value="$emit('update:show', $event)"
    persistent
    max-width="1000px"
    scrollable
    max-height="90vh"
  >
    <v-card dark flat v-bind:ripple="false">
      <v-card-title>
        {{ $t(caption) }}: {{ mediaItemBackup.Name }}
        {{ mediaItemBackup.yearDisplay }}
      </v-card-title>

      <v-card-text style="padding-top: 0px; padding-bottom: 0px">
        <div>
          <div style="display: flex; gap: 24px; align-items: flex-start">
            <!-- Poster (left column) -->
            <div style="flex: 0 0 auto">
            <v-row style="margin-top: 8px; margin-left: 0px; margin-bottom: 0px">
              <div style="font-size: 14px; margin-top: 10px">
                {{ $t("Poster") }}
              </div>
            </v-row>
            <div style="margin-top: 8px; margin-bottom: 8px">
              <v-menu v-model="posterMenu.show" location="bottom start" transition="scale-transition">
                <template v-slot:activator="{ props: menuProps }">
                  <div
                    style="position: relative; height: 180px; width: 120px; cursor: pointer"
                    v-on:mouseenter="posterHovered = true"
                    v-on:mouseleave="posterHovered = false"
                    v-bind="menuProps"
                  >
                <v-img
                  v-if="displayedPosterSmallUrl"
                  cover
                  v-bind:src="displayedPosterSmallUrl"
                  style="border-radius: 6px; height: 180px; width: 120px"
                ></v-img>
                <v-icon
                  v-else
                  disabled
                  size="48"
                  style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%)"
                >
                  mdi-filmstrip
                </v-icon>
                <div
                  v-show="posterHovered"
                  style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 180px;
                    width: 120px;
                    border-radius: 6px;
                    background-color: rgba(0, 0, 0, 0.55);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    pointer-events: none;
                  "
                >
                  <span
                    style="
                      color: #fff;
                      font-size: 13px;
                      font-weight: 500;
                      letter-spacing: 0.5px;
                      text-align: center;
                      padding: 0 6px;
                      text-shadow: #000 0 0 2px, #000 0 0 2px;
                    "
                  >
                    {{ $t("click for menu") }}
                  </span>
                </div>
                <v-tooltip
                  v-if="displayedPosterSmallUrl && !displayedPosterLargeUrl"
                  location="top"
                >
                  <template v-slot:activator="{ props }">
                    <v-icon
                      v-bind="props"
                      color="warning"
                      size="20"
                      style="position: absolute; top: 4px; right: 4px; background-color: rgba(0,0,0,0.55); border-radius: 50%; padding: 2px"
                    >
                      mdi-alert
                    </v-icon>
                  </template>
                  <span>{{ $t("The high resolution variant of this poster is missing_") }}</span>
                </v-tooltip>
                  </div>
                </template>
                <v-list dark>
                  <v-list-item
                    v-if="displayedPosterLargeUrl || displayedPosterSmallUrl"
                    v-on:click="onPosterMenuShowPreview"
                  >
                    <v-list-item-title>{{ $t("Show Preview") }}</v-list-item-title>
                  </v-list-item>
                  <v-list-item v-on:click="onPosterMenuAddReplace">
                    <v-list-item-title>
                      {{ displayedPosterLargeUrl || displayedPosterSmallUrl ? $t("Replace Poster") : $t("Add Poster") }}
                    </v-list-item-title>
                  </v-list-item>
                  <v-list-item v-if="isUserPoster" v-on:click="onPosterMenuRemove">
                    <v-list-item-title>{{ $t("Remove Poster") }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </div>

            <!-- Titles (right column) -->
            <div style="flex: 1 1 auto; min-width: 0">
              <!-- Primary Title -->
              <v-row style="margin-top: 8px; margin-left: 0px; margin-bottom: -16px">
                <div style="font-size: 14px; margin-top: 10px">
                  {{ $t("Primary Title") }}
                </div>
              </v-row>
              <v-text-field v-model="mediaItem.Name" variant="underlined"></v-text-field>

              <!-- Secondary Title -->
              <v-row style="margin-top: 8px; margin-left: 0px; margin-bottom: -16px">
                <div style="font-size: 14px; margin-top: 10px">
                  {{ $t("Secondary Title") }}
                </div>
              </v-row>
              <v-text-field v-model="mediaItem.Name2" variant="underlined"></v-text-field>

              <!-- Release Year -->
              <v-row style="margin-top: 8px; margin-left: 0px; margin-bottom: -16px">
                <div style="font-size: 14px; margin-top: 10px">
                  {{ $t("Release Year") }}
                </div>
              </v-row>
              <v-text-field v-model="mediaItem.startYear" variant="underlined"></v-text-field>
            </div>
          </div>

          <!-- Description -->
          <v-row style="margin-top: 8px; margin-left: 0px; margin-bottom: 0px">
            <div style="font-size: 14px; margin-top: 10px">
              {{ $t("Description") }}
            </div>
          </v-row>
          <v-textarea
            v-model="mediaItem.plotSummaryFull"
            variant="underlined"
            style="margin-top: -16px"
            auto-grow
            :rows="3"
          ></v-textarea>

          <!-- Video Quality (Movie or Episode) -->
          <!--
          <div v-if="mediaItem.specificMediaType !== 'Series'">
            <v-row style="margin-top: 8px; margin-left: 0px">
              <div style="font-size: 14px; margin-top: 10px">{{ $t("Video Quality") }}</div>
            </v-row>
            <v-select v-bind:items="$shared.videoQualities.map((item) => item.name)" v-model="mediaItem.MI_Quality">
            </v-select>
          </div>
          -->

          <!-- Video Qualities -->
          <div>
            <!--  v-if="mediaItem.specificMediaType == 'Series'" -->
            <v-row style="margin-top: 8px; margin-left: 0px">
              <div style="font-size: 14px; margin-top: 11px">
                {{ $t("Video Qualities") }}
              </div>
              <v-menu
                v-model="showAddVideoQualityDialog"
                v-bind:close-on-click="false"
                v-bind:close-on-content-click="false"
                bottom
                right
                transition="scale-transition"
                origin="top left"
              >
                <template v-slot:activator="{ props }">
                  <v-btn
                    color="primary"
                    variant="text"
                    size="small"
                    style="margin-left: 12px; margin-right: 4px; margin-bottom: 4px; margin-top: 8px"
                    v-bind="props"
                    v-on:click="onShowAddVideoQualityDialog"
                    >{{ $t("Add") }}</v-btn
                  >
                </template>
                <v-card style="min-width: 260px">
                  <v-card-title>
                    {{ $t("Add Video Quality") }}
                  </v-card-title>
                  <v-card-text>
                    <v-select
                      variant="underlined"
                      v-bind:items="videoQualities"
                      v-model="selectedVideoQuality"
                    ></v-select>
                  </v-card-text>
                  <v-card-actions style="justify-content: flex-end">
                    <v-btn variant="tonal" color="secondary" v-on:click.stop="showAddVideoQualityDialog = false">{{
                      $t("Cancel")
                    }}</v-btn>
                    <v-btn variant="tonal" color="primary" v-on:click.stop="onAddVideoQualityDialogOK">{{
                      $t("OK")
                    }}</v-btn>
                  </v-card-actions>
                </v-card>
              </v-menu>
            </v-row>

            <div style="margin-top: 8px">
              <v-chip
                v-for="(quality, index) in mediaItem.MI_Qualities"
                v-bind:key="index"
                label
                variant="outlined"
                draggable
                closable
                close-icon="mdi-delete"
                style="margin-right: 4px; margin-bottom: 4px"
                v-on:click:close="onRemoveVideoQuality(index)"
              >
                {{ quality.MI_Quality }}
              </v-chip>
            </div>
            <div v-if="!mediaItem.MI_Qualities || mediaItem.MI_Qualities.length === 0">
              <p>{{ $t("none") }}</p>
            </div>
          </div>

          <!-- Audio Languages -->
          <div>
            <v-row style="margin-top: 8px; margin-left: 0px">
              <div style="font-size: 14px; margin-top: 11px">
                {{ $t("Audio Languages") }}
              </div>
              <v-menu
                v-model="showAddAudioLanguageDialog"
                v-bind:close-on-click="false"
                v-bind:close-on-content-click="false"
                bottom
                right
                transition="scale-transition"
                origin="top left"
              >
                <template v-slot:activator="{ props }">
                  <v-btn
                    color="primary"
                    variant="text"
                    size="small"
                    style="margin-left: 12px; margin-right: 4px; margin-bottom: 4px; margin-top: 8px"
                    v-bind="props"
                    v-on:click="onShowAddAudioLanguageDialog"
                    >{{ $t("Add") }}</v-btn
                  >
                </template>
                <v-card style="min-width: 260px">
                  <v-card-title>
                    {{ $t("Add Audio Language") }}
                  </v-card-title>
                  <v-card-text>
                    <v-select
                      variant="underlined"
                      v-bind:items="audioLanguages"
                      v-model="selectedAudioLanguage"
                      item-title="displayText"
                      item-value="languageCodeUpperCase"
                    ></v-select>
                  </v-card-text>
                  <v-card-actions style="justify-content: flex-end">
                    <v-btn variant="tonal" color="secondary" v-on:click.stop="showAddAudioLanguageDialog = false">{{
                      $t("Cancel")
                    }}</v-btn>
                    <v-btn variant="tonal" color="primary" v-on:click.stop="onAddAudioLanguageDialogOK">{{
                      $t("OK")
                    }}</v-btn>
                  </v-card-actions>
                </v-card>
              </v-menu>
            </v-row>

            <div style="margin-top: 8px">
              <v-chip
                v-for="(audioLanguage, index) in mediaItem.AudioLanguages"
                v-bind:key="index"
                label
                variant="outlined"
                draggable
                closable
                close-icon="mdi-delete"
                style="margin-right: 4px; margin-bottom: 4px"
                v-on:click:close="onRemoveAudioLanguage(index)"
              >
                {{ audioLanguage }}
              </v-chip>
            </div>
            <div v-if="!mediaItem.AudioLanguages || mediaItem.AudioLanguages.length === 0">
              <p>{{ $t("none") }}</p>
            </div>
          </div>

          <!-- Subtitle Languages -->
          <div>
            <v-row style="margin-top: 8px; margin-left: 0px">
              <div style="font-size: 14px; margin-top: 11px">
                {{ $t("Subtitle Languages") }}
              </div>
              <v-menu
                v-model="showAddSubtitleLanguageDialog"
                v-bind:close-on-click="false"
                v-bind:close-on-content-click="false"
                bottom
                right
                transition="scale-transition"
                origin="top left"
              >
                <template v-slot:activator="{ props }">
                  <v-btn
                    color="primary"
                    variant="text"
                    size="small"
                    style="margin-left: 12px; margin-right: 4px; margin-bottom: 4px; margin-top: 8px"
                    v-bind="props"
                    v-on:click="onShowAddSubtitleLanguageDialog"
                    >{{ $t("Add") }}</v-btn
                  >
                </template>
                <v-card style="min-width: 260px">
                  <v-card-title>
                    {{ $t("Add Subtitle Language") }}
                  </v-card-title>
                  <v-card-text>
                    <v-select
                      variant="underlined"
                      v-bind:items="subtitleLanguages"
                      v-model="selectedSubtitleLanguage"
                      item-title="displayText"
                      item-value="languageCodeUpperCase"
                    ></v-select>
                  </v-card-text>
                  <v-card-actions style="justify-content: flex-end">
                    <v-btn variant="tonal" color="secondary" v-on:click.stop="showAddSubtitleLanguageDialog = false">{{
                      $t("Cancel")
                    }}</v-btn>
                    <v-btn variant="tonal" color="primary" v-on:click.stop="onAddSubtitleLanguageDialogOK">{{
                      $t("OK")
                    }}</v-btn>
                  </v-card-actions>
                </v-card>
              </v-menu>
            </v-row>

            <div style="margin-top: 8px">
              <v-chip
                v-for="(subtitleLanguage, index) in mediaItem.SubtitleLanguages"
                v-bind:key="index"
                label
                variant="outlined"
                draggable
                closable
                close-icon="mdi-delete"
                style="margin-right: 4px; margin-bottom: 4px"
                v-on:click:close="onRemoveSubtitleLanguage(index)"
              >
                {{ subtitleLanguage }}
              </v-chip>
            </div>
            <div v-if="!mediaItem.SubtitleLanguages || mediaItem.SubtitleLanguages.length === 0">
              <p>{{ $t("none") }}</p>
            </div>
          </div>

          <!-- Genres -->
          <v-row style="margin-top: 8px; margin-left: 0px">
            <div style="font-size: 14px; margin-top: 11px">
              {{ $t("Genres") }}
            </div>
            <v-menu
              v-model="showAddGenreDialog"
              v-bind:close-on-click="false"
              v-bind:close-on-content-click="false"
              bottom
              right
              transition="scale-transition"
              origin="top left"
            >
              <template v-slot:activator="{ props }">
                <v-btn
                  color="primary"
                  variant="text"
                  size="small"
                  style="margin-left: 12px; margin-right: 4px; margin-bottom: 4px; margin-top: 8px"
                  v-bind="props"
                  v-on:click="onShowAddGenreDialog"
                  >{{ $t("Add") }}</v-btn
                >
              </template>
              <v-card style="min-width: 260px">
                <v-card-title>
                  {{ $t("Add Genre") }}
                </v-card-title>
                <v-card-text>
                  <v-select
                    variant="underlined"
                    v-bind:items="genres"
                    v-model="selectedGenre"
                    item-title="Name"
                    item-value="GenreID"
                  ></v-select>
                </v-card-text>
                <v-card-actions style="justify-content: flex-end">
                  <v-btn variant="tonal" color="secondary" v-on:click.stop="showAddGenreDialog = false">{{
                    $t("Cancel")
                  }}</v-btn>
                  <v-btn variant="tonal" color="primary" v-on:click.stop="onAddGenreDialogOK">{{ $t("OK") }}</v-btn>
                </v-card-actions>
              </v-card>
            </v-menu>
          </v-row>

          <div style="margin-top: 8px">
            <v-chip
              v-for="(genre, index) in mediaItem.Genres"
              v-bind:key="index"
              label
              variant="outlined"
              draggable
              closable
              close-icon="mdi-delete"
              style="margin-right: 4px; margin-bottom: 4px"
              v-on:click:close="onRemoveGenre(index)"
            >
              {{ genre.translated }}
            </v-chip>
            <div v-if="!mediaItem.Genres || mediaItem.Genres.length === 0">
              <p>{{ $t("none") }}</p>
            </div>
          </div>

          <!-- Release Attributes -->
          <v-row style="margin-top: 8px; margin-left: 0px">
            <div style="font-size: 14px; margin-top: 11px">
              {{ $t("Release Attributes") }}
            </div>
            <v-menu
              v-model="showAddReleaseAttributeDialog"
              v-bind:close-on-click="false"
              v-bind:close-on-content-click="false"
              bottom
              right
              transition="scale-transition"
              origin="top left"
            >
              <template v-slot:activator="{ props }">
                <v-btn
                  color="primary"
                  variant="text"
                  size="small"
                  style="margin-left: 12px; margin-right: 4px; margin-bottom: 4px; margin-top: 8px"
                  v-bind="props"
                  v-on:click="onShowAddReleaseAttributeDialog"
                  >{{ $t("Add") }}</v-btn
                >
              </template>
              <v-card style="min-width: 260px">
                <v-card-title>
                  {{ $t("Add Release Attribute") }}
                </v-card-title>
                <v-card-text>
                  <v-select
                    variant="underlined"
                    v-bind:items="releaseAttributes"
                    v-model="selectedReleaseAttribute"
                    item-title="displayAs"
                    item-value="searchTerm"
                  ></v-select>
                </v-card-text>
                <v-card-actions style="justify-content: flex-end">
                  <v-btn variant="tonal" color="secondary" v-on:click.stop="showAddReleaseAttributeDialog = false">{{
                    $t("Cancel")
                  }}</v-btn>
                  <v-btn variant="tonal" color="primary" v-on:click.stop="onAddReleaseAttributeDialogOK">{{
                    $t("OK")
                  }}</v-btn>
                </v-card-actions>
              </v-card>
            </v-menu>
          </v-row>

          <div style="margin-top: 8px">
            <v-chip
              v-for="(raSearchTerm, index) in arrayReleaseAttributesSearchTerms"
              v-bind:key="index"
              label
              variant="outlined"
              draggable
              closable
              close-icon="mdi-delete"
              style="margin-right: 4px; margin-bottom: 4px"
              v-on:click:close="onRemoveReleaseAttribute(index)"
            >
              {{ getReleaseAttribute(raSearchTerm) }}
            </v-chip>
            <div v-if="!mediaItem.ReleaseAttributesSearchTerms">
              <p>{{ $t("none") }}</p>
            </div>
          </div>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-btn class="xs-fullwidth" variant="tonal" color="secondary" v-on:click="onCancelClick">{{
          $t("Cancel")
        }}</v-btn>
        <v-btn class="xs-fullwidth" variant="tonal" color="primary" v-on:click.stop="onOKClick"> OK </v-btn>
      </v-card-actions>
    </v-card>

    <mk-poster-preview-dialog
      v-bind:show="posterPreviewDialog.show"
      v-bind:posterUrl="posterPreviewDialog.fullPosterUrl"
      v-on:update:show="posterPreviewDialog.show = $event"
    ></mk-poster-preview-dialog>

    <mk-poster-input-dialog
      v-bind:show="posterInputDialog.show"
      v-bind:hasCurrentPoster="!!posterInputDialog.fullPosterUrl"
      v-on:update:show="posterInputDialog.show = $event"
      v-on:confirm="onPosterInputConfirm"
      v-on:cancel="posterInputDialog.show = false"
    ></mk-poster-input-dialog>

    <mk-remove-poster-dialog
      v-bind:show="removePosterDialog.show"
      v-bind:title="$t('Remove poster')"
      v-bind:question="removePosterDialog.question"
      v-bind:yes="$t('YES, REMOVE')"
      v-bind:no="$t('No')"
      yesColor="error"
      noColor="secondary"
      v-on:update:show="removePosterDialog.show = $event"
      v-on:yes="onConfirmRemovePoster"
      v-on:no="removePosterDialog.show = false"
    ></mk-remove-poster-dialog>
  </v-dialog>
</template>

<script>
import fs from "fs";

import logger from "@helpers/logger.js";
import * as _ from "lodash";

import * as helpers from "@helpers/helpers.js";
import * as store from "@/store.js";
import { eventBus } from "@renderer/eventBus.js";
import i18n from "@renderer/i18n.js";
const $t = i18n.global.t;

import { languageCodeNameMapping } from "@/languages.js";
import { deepDiffMapper } from "@helpers/deep-diff-mapper.js";

import PosterInputDialog from "@renderer/components/dialogs/PosterInputDialog.vue";
import PosterPreviewDialog from "@renderer/components/dialogs/PosterPreviewDialog.vue";
import Dialog from "@renderer/components/dialogs/Dialog.vue";

export default {
  components: {
    "mk-poster-input-dialog": PosterInputDialog,
    "mk-poster-preview-dialog": PosterPreviewDialog,
    "mk-remove-poster-dialog": Dialog,
  },

  props: ["show", "type", "caption", "mediaItem"],

  emits: ["update:show", "ok", "cancel"],

  data() {
    return {
      mediaItemBackup: {},
      showAddGenreDialog: false,
      selectedGenre: null,
      showAddVideoQualityDialog: false,
      selectedVideoQuality: null,
      showAddReleaseAttributeDialog: false,
      selectedReleaseAttribute: null,
      showAddAudioLanguageDialog: false,
      selectedAudioLanguage: null,
      showAddSubtitleLanguageDialog: false,
      selectedSubtitleLanguage: null,
      posterPreviewDialog: {
        show: false,
        fullPosterUrl: null,
      },
      posterInputDialog: {
        show: false,
        fullPosterUrl: null,
      },
      removePosterDialog: {
        show: false,
        question: null,
      },
      posterMenu: {
        show: false,
      },
      stagedPoster: null,
      removeUserPoster: false,
      posterHovered: false,
    };
  },

  watch: {
    mediaItem(newValue) {
      logger.log("[mediaItem] changed:", newValue);

      this.mediaItemBackup = newValue ? JSON.parse(JSON.stringify(newValue)) : {};
      this.stagedPoster = null;
      this.removeUserPoster = false;
    },
  },

  computed: {
    displayedPosterSmallUrl() {
      if (this.stagedPoster) return this.stagedPoster.previewUrl;
      if (this.removeUserPoster) return this.mediaItem.IMDB_posterSmall_URL;
      return this.mediaItem.posterSmall_URL || this.mediaItem.IMDB_posterSmall_URL;
    },

    displayedPosterLargeUrl() {
      if (this.stagedPoster) return this.stagedPoster.previewUrl;
      if (this.removeUserPoster) return this.mediaItem.IMDB_posterLarge_URL;
      return this.mediaItem.posterLarge_URL || this.mediaItem.IMDB_posterLarge_URL;
    },

    isUserPoster() {
      if (this.stagedPoster) return true;
      if (this.removeUserPoster) return false;
      return !!(this.mediaItem.posterSmall_URL || this.mediaItem.posterLarge_URL);
    },

    languages() {
      return Object.keys(languageCodeNameMapping)
        .map((languageCode) => {
          return {
            displayText: `${$t(
              `LanguageNames.${languageCodeNameMapping[languageCode].replace(/\./g, "_").replace(/'/g, "_")}`
            )} (${languageCode.toUpperCase()})`,
            languageCode,
            languageCodeUpperCase: languageCode.toUpperCase(),
          };
        })
        .sort((a, b) => helpers.compare(a.displayText, b.displayText, false));
    },

    i18nCurrentMessages() {
      logger.log(
        "[i18nCurrentMessages] this.$i18n.messages[this.$i18n.locale]:",
        this.$i18n.messages[this.$i18n.locale]
      );
      let messages = this.$i18n.messages[this.$i18n.locale];
      return messages || this.$i18n.messages["en"];
    },

    genres() {
      return Object.keys(this.i18nCurrentMessages.GenreNames)
        .map((key) => {
          return {
            GenreID: key,
            Name: this.i18nCurrentMessages.GenreNames[key],
          };
        })
        .sort((a, b) => helpers.compare(a.Name, b.Name, false))
        .filter(
          (item) => !this.mediaItem.Genres || !this.mediaItem.Genres.find((genre) => genre.name === item.GenreID)
        );
    },

    videoQualities() {
      return Object.keys(this.$shared.videoQualities).filter(
        (item) =>
          !this.mediaItem.MI_Qualities || !this.mediaItem.MI_Qualities.find((quality) => quality.MI_Quality === item)
      );
    },

    audioLanguages() {
      return this.languages.filter(
        (language) =>
          !this.mediaItem.AudioLanguages ||
          !this.mediaItem.AudioLanguages.find((lang) => lang === language.languageCodeUpperCase)
      );
    },

    subtitleLanguages() {
      return this.languages.filter(
        (language) =>
          !this.mediaItem.SubtitleLanguages ||
          !this.mediaItem.SubtitleLanguages.find((lang) => lang === language.languageCodeUpperCase)
      );
    },

    arrayReleaseAttributesSearchTerms() {
      if (!this.mediaItem.ReleaseAttributesSearchTerms) {
        return [];
      }

      return this.mediaItem.ReleaseAttributesSearchTerms.split(";").filter((item) => !!item);
    },

    releaseAttributes() {
      const raHave = this.arrayReleaseAttributesSearchTerms.map((searchTerm) => {
        return {
          searchTerm,
          displayAs: this.getReleaseAttribute(searchTerm),
          deleted: false,
          sort: null,
        };
      });

      return this.$shared.releaseAttributes
        .filter((item) => {
          return !item.deleted && !raHave.find((have) => have.displayAs === item.displayAs);
        })
        .map((item) => {
          return {
            searchTerm: item.searchTerm,
            displayAs: `${item.displayAs} [${item.searchTerm}]`,
            deleted: item.deleted,
            sort: item.sort,
          };
        });
    },
  },

  methods: {
    async onOKClick() {
      // Check some fields
      if (!this.mediaItem.Name) {
        return eventBus.showSnackbar("error", $t("Primary Title is missing_"));
      }
      if (this.mediaItem.startYear && !/\d\d\d\d/.test(this.mediaItem.startYear)) {
        return eventBus.showSnackbar("error", $t("Year is malformed_"));
      }

      let hasChanges = false;
      const diff = deepDiffMapper.prune(deepDiffMapper.map(this.mediaItem, this.mediaItemBackup));

      logger.log("[MediaItemDialog.onOKClick] diff:", diff);
      logger.log("[MediaItemDialog.onOKClick] Object.keys(diff):", Object.keys(diff));

      if (Object.keys(diff).length > 0) {
        logger.log("[MediaItemDialog.onOKClick] EditMediaItemDialog has changes!");
        hasChanges = true;
      }

      if (Object.keys(diff).find((key) => key === "Name")) {
        await store.updateMediaRecordField(this.mediaItem.id_Movies, "Name", this.mediaItem.Name);
      }

      if (Object.keys(diff).find((key) => key === "Name2")) {
        await store.updateMediaRecordField(this.mediaItem.id_Movies, "Name2", this.mediaItem.Name2);
      }

      if (Object.keys(diff).find((key) => key === "startYear")) {
        await store.updateMediaRecordField(this.mediaItem.id_Movies, "startYear", this.mediaItem.startYear);
      }

      if (Object.keys(diff).find((key) => key === "MI_Quality")) {
        await store.updateMediaRecordField(this.mediaItem.id_Movies, "MI_Quality", this.mediaItem.MI_Quality);
      }

      if (Object.keys(diff).find((key) => key === "MI_Qualities")) {
        await store.updateMovieVideoQualities(this.mediaItem.id_Movies, this.mediaItem.MI_Qualities);
      }

      if (Object.keys(diff).find((key) => key === "Genres")) {
        await store.updateMovieGenres(
          this.mediaItem.id_Movies,
          this.mediaItem.Genres.map((item) => item.name.toLowerCase())
        );
      }

      if (Object.keys(diff).find((key) => key === "ReleaseAttributesSearchTerms")) {
        await store.updateMovieReleaseAttribues(this.mediaItem.id_Movies, this.mediaItem.ReleaseAttributesSearchTerms);
      }

      if (Object.keys(diff).find((key) => key === "AudioLanguages")) {
        await store.updateMovieLanguages(
          this.mediaItem.id_Movies,
          "audio",
          this.mediaItem.AudioLanguages.map((item) => {
            return this.languages.find((lang) => lang.languageCodeUpperCase === item).languageCode;
          })
        );
      }

      if (Object.keys(diff).find((key) => key === "SubtitleLanguages")) {
        await store.updateMovieLanguages(
          this.mediaItem.id_Movies,
          "subtitle",
          this.mediaItem.SubtitleLanguages.map((item) => {
            return this.languages.find((lang) => lang.languageCodeUpperCase === item).languageCode;
          })
        );
      }

      if (Object.keys(diff).find((key) => key === "plotSummaryFull")) {
        const plotSummaryFull = this.mediaItem.plotSummaryFull;
        let plotSummary = _.truncate(this.mediaItem.plotSummaryFull, {
          length: 400,
          separator: " ",
          omission: " ...",
        });

        await store.updateMediaRecordField(this.mediaItem.id_Movies, "plotSummary", plotSummary);
        await store.updateMediaRecordField(this.mediaItem.id_Movies, "plotSummaryFull", plotSummaryFull);
      }

      if (this.removeUserPoster) {
        const userSmallRel = `extras/id_Movies_${this.mediaItem.id_Movies}_posterSmall.jpg`;
        const userLargeRel = `extras/id_Movies_${this.mediaItem.id_Movies}_posterLarge.jpg`;

        try {
          const userSmallAbs = helpers.getDataPath(userSmallRel);
          const userLargeAbs = helpers.getDataPath(userLargeRel);
          if (fs.existsSync(userSmallAbs)) fs.unlinkSync(userSmallAbs);
          if (fs.existsSync(userLargeAbs)) fs.unlinkSync(userLargeAbs);
        } catch (err) {
          logger.error("[onOKClick] failed to delete user poster files:", err);
        }

        await store.updateMediaRecordField(this.mediaItem.id_Movies, "posterSmall_URL", null);
        await store.updateMediaRecordField(this.mediaItem.id_Movies, "posterLarge_URL", null);

        this.mediaItem.posterSmall_URL = null;
        this.mediaItem.posterLarge_URL = null;

        this.removeUserPoster = false;
        hasChanges = true;
      }

      if (this.stagedPoster) {
        if (!this.mediaItem.id_Movies) {
          return eventBus.showSnackbar("error", $t("Cannot save poster_ this item has no identifier_"));
        }

        const largePath = this.posterRelativePath("Large");
        const smallPath = this.posterRelativePath("Small");

        try {
          const base64 = this.stagedPoster.source.dataUrl.split(",")[1] || "";
          const largeBuffer = Buffer.from(base64, "base64");

          const smallDataUrl = await this.resizeImageToDataUrl(this.stagedPoster.source.dataUrl, 300, 400);
          const smallBuffer = Buffer.from(smallDataUrl.split(",")[1] || "", "base64");

          await helpers.writeBinaryFileToDataPath(largePath, largeBuffer);
          await helpers.writeBinaryFileToDataPath(smallPath, smallBuffer);
        } catch (err) {
          logger.error("[onOKClick] failed to write poster:", err);
          return eventBus.showSnackbar("error", $t("Failed to save poster_"));
        }

        await store.updateMediaRecordField(this.mediaItem.id_Movies, "posterLarge_URL", largePath);
        await store.updateMediaRecordField(this.mediaItem.id_Movies, "posterSmall_URL", smallPath);

        const ts = Date.now();
        this.mediaItem.posterLarge_URL =
          "local-resource://" + helpers.getDataPath(largePath).replace(/\\/g, "\\\\") + "?t=" + ts;
        this.mediaItem.posterSmall_URL =
          "local-resource://" + helpers.getDataPath(smallPath).replace(/\\/g, "\\\\") + "?t=" + ts;

        hasChanges = true;

        this.stagedPoster = null;
      }

      // /!\ Important /!\
      // If new fields are added to this dialog, also enhance store.deleteIMDBData

      // store fields that have been (re-)defined by the user
      let definedByUser = await store.fetchMovieFieldsDefinedByUser(this.mediaItem.id_Movies);
      const definedByUserOld = JSON.stringify(definedByUser);

      logger.log("[MediaItemDialog.onOKClick] definedByUser (from db):", definedByUser);

      Object.keys(diff).forEach((key) => {
        if (!definedByUser.find((item) => item === key)) {
          definedByUser.push(key);
        }
      });

      logger.log("[MediaItemDialog.onOKClick] definedByUser (new):", definedByUser);

      if (definedByUserOld !== JSON.stringify(definedByUser)) {
        await store.updateMediaRecordField(
          this.mediaItem.id_Movies,
          "DefinedByUser",
          definedByUser.map((item) => `|${item}|`).join(",")
        );
      }

      this.$emit("ok", hasChanges);
    },

    onCancelClick() {
      this.$emit("cancel");
    },

    onEscapePressed() {
      this.onCancelClick();
    },

    onRemoveGenre(index) {
      logger.log("[onRemoveGenre] genre array (before):", this.mediaItem.Genres);

      this.mediaItem.Genres.splice(index, 1);

      logger.log("[onRemoveGenre] genre array (after):", this.mediaItem.Genres);
    },

    onShowFullPoster(url) {
      this.posterPreviewDialog.fullPosterUrl = url;
      this.posterPreviewDialog.show = true;
    },

    onPosterMenuShowPreview() {
      this.onShowFullPoster(this.displayedPosterLargeUrl || this.displayedPosterSmallUrl);
    },

    onPosterMenuAddReplace() {
      this.posterInputDialog.fullPosterUrl = this.displayedPosterLargeUrl || this.displayedPosterSmallUrl;
      this.posterInputDialog.show = true;
    },

    onPosterMenuRemove() {
      this.onRequestRemovePoster();
    },

    onRequestRemovePoster() {
      let question = $t("Are you sure you want to remove the user-provided poster_");

      if (this.mediaItem.IMDB_posterSmall_URL || this.mediaItem.IMDB_posterLarge_URL) {
        question += " " + $t("This will recover the IMDB-provided poster_");
      }

      this.removePosterDialog.question = question;
      this.removePosterDialog.show = true;
    },

    onConfirmRemovePoster() {
      logger.log("[onConfirmRemovePoster] staging removal for id_Movies:", this.mediaItem.id_Movies);

      this.removePosterDialog.show = false;
      this.stagedPoster = null;
      this.removeUserPoster = true;

      this.posterPreviewDialog.fullPosterUrl = this.displayedPosterLargeUrl || this.displayedPosterSmallUrl;
      this.posterPreviewDialog.show = false;
    },

    onPosterInputConfirm(payload) {
      logger.log("[onPosterInputConfirm] payload:", payload);

      const { source } = payload;
      if (!source) {
        this.posterInputDialog.show = false;
        return;
      }

      this.stagedPoster = { source, previewUrl: source.dataUrl };
      this.removeUserPoster = false;
      this.posterPreviewDialog.fullPosterUrl = source.dataUrl;
      this.posterInputDialog.show = false;
      this.posterPreviewDialog.show = false;
    },

    posterRelativePath(variant) {
      return `extras/id_Movies_${this.mediaItem.id_Movies}_poster${variant}.jpg`;
    },

    resizeImageToDataUrl(sourceUrl, maxWidth, maxHeight) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(maxWidth / img.naturalWidth, maxHeight / img.naturalHeight, 1);
          const w = Math.max(1, Math.round(img.naturalWidth * scale));
          const h = Math.max(1, Math.round(img.naturalHeight * scale));
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          try {
            resolve(canvas.toDataURL("image/jpeg", 0.85));
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = (err) => reject(err || new Error("Image load failed"));
        img.src = sourceUrl;
      });
    },

    onShowAddGenreDialog() {
      this.selectedGenre = this.genres.length > 0 ? this.genres[0].GenreID : null;
    },

    onAddGenreDialogOK() {
      if (this.selectedGenre) {
        if (!this.mediaItem.Genres) {
          this.mediaItem.Genres = [];
        }

        this.mediaItem.Genres.push({
          name: this.selectedGenre,
          translated: this.genres.find((genre) => genre.GenreID === this.selectedGenre).Name,
        });
      }

      this.showAddGenreDialog = false;
    },

    onRemoveVideoQuality(index) {
      logger.log("[onRemoveVideoQuality] array (before):", this.mediaItem.MI_Qualities);

      this.mediaItem.MI_Qualities.splice(index, 1);

      logger.log("[onRemoveVideoQuality] array (after):", this.mediaItem.MI_Qualities);
    },

    onShowAddVideoQualityDialog() {
      this.selectedVideoQuality = this.videoQualities.length > 0 ? this.videoQualities[0] : null;
    },

    onAddVideoQualityDialogOK() {
      if (this.selectedVideoQuality) {
        if (!this.mediaItem.MI_Qualities) {
          this.mediaItem.MI_Qualities = [];
        }

        logger.log("[onAddVideoQualityDialogOK] selectedVideoQuality:", this.selectedVideoQuality);

        this.mediaItem.MI_Qualities.push({
          MI_Quality: this.selectedVideoQuality,
          Category_Name: this.$shared.videoQualities[this.selectedVideoQuality].Category_Name,
        });
      }

      this.showAddVideoQualityDialog = false;
    },

    onRemoveAudioLanguage(index) {
      logger.log("[onRemoveAudioLanguage] array (before):", this.mediaItem.AudioLanguages);

      this.mediaItem.AudioLanguages.splice(index, 1);

      logger.log("[onRemoveAudioLanguage] array (after):", this.mediaItem.AudioLanguages);
    },

    onShowAddAudioLanguageDialog() {
      this.selectedAudioLanguage = this.audioLanguages.length > 0 ? this.audioLanguages[0].languageCodeUpperCase : null;
    },

    onAddAudioLanguageDialogOK() {
      logger.log("[onAddAudioLanguageDialogOK] selectedAudioLanguage:", this.selectedAudioLanguage);

      if (this.selectedAudioLanguage) {
        if (!this.mediaItem.AudioLanguages) {
          this.mediaItem.AudioLanguages = [];
        }

        this.mediaItem.AudioLanguages.push(this.selectedAudioLanguage);
      }

      this.showAddAudioLanguageDialog = false;
    },

    onRemoveSubtitleLanguage(index) {
      logger.log("[onRemoveSubtitleLanguage] array (before):", this.mediaItem.SubtitleLanguages);

      this.mediaItem.SubtitleLanguages.splice(index, 1);

      logger.log("[onRemoveSubtitleLanguage] array (after):", this.mediaItem.SubtitleLanguages);
    },

    onShowAddSubtitleLanguageDialog() {
      this.selectedSubtitleLanguage =
        this.subtitleLanguages.length > 0 ? this.subtitleLanguages[0].languageCodeUpperCase : null;
    },

    onAddSubtitleLanguageDialogOK() {
      logger.log("[onAddSubtitleLanguageDialogOK] selectedSubtitleLanguage:", this.selectedSubtitleLanguage);

      if (this.selectedSubtitleLanguage) {
        if (!this.mediaItem.SubtitleLanguages) {
          this.mediaItem.SubtitleLanguages = [];
        }

        this.mediaItem.SubtitleLanguages.push(this.selectedSubtitleLanguage);
      }

      this.showAddSubtitleLanguageDialog = false;
    },

    getReleaseAttribute(searchTerm) {
      logger.log("[getReleaseAttribute] searchTerm:", searchTerm);
      logger.log(
        "[getReleaseAttribute] EditMediaItemDialog this.$shared.releaseAttributes",
        this.$shared.releaseAttributes
      );
      return this.$shared.releaseAttributes.find((ra) => ra.searchTerm === searchTerm).displayAs;
    },

    onRemoveReleaseAttribute(index) {
      const arr = this.arrayReleaseAttributesSearchTerms;
      logger.log("[onRemoveReleaseAttribute] arr:", arr);

      arr.splice(index, 1);
      logger.log("[onRemoveReleaseAttribute] spliced:", arr);

      const joined = arr.join(";");
      logger.log("[onRemoveReleaseAttribute] joined:", joined);

      this.mediaItem.ReleaseAttributesSearchTerms = joined;
    },

    onShowAddReleaseAttributeDialog() {
      this.selectedReleaseAttribute = this.releaseAttributes.length > 0 ? this.releaseAttributes[0].searchTerm : null;
    },

    onAddReleaseAttributeDialogOK() {
      if (this.selectedReleaseAttribute) {
        this.mediaItem.ReleaseAttributesSearchTerms =
          (this.mediaItem.ReleaseAttributesSearchTerms ? this.mediaItem.ReleaseAttributesSearchTerms + ";" : "") +
          this.selectedReleaseAttribute;
      }

      this.showAddReleaseAttributeDialog = false;
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
