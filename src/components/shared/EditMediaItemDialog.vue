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
        <!-- Primary Title -->
        <v-text-field
          v-bind:label="$t('Primary Title')"
          v-model="mediaItem.Name"
        ></v-text-field>

        <!-- Secondary Title -->
        <v-text-field
          v-bind:label="$t('Secondary Title')"
          v-model="mediaItem.Name2"
        ></v-text-field>

        <!-- Release Year -->
        <v-text-field
          v-bind:label="$t('Release Year')"
          v-model="mediaItem.startYear"
        ></v-text-field>

        <!-- Video Quality -->
        <v-select
          v-bind:label="$t('Video Quality')"
          v-bind:items="$shared.videoQualities.map((item) => item.name)"
          v-model="mediaItem.MI_Quality"
        >
        </v-select>

        <!-- Description -->
        <v-textarea
          v-bind:label="$t('Description')"
          v-model="mediaItem.plotSummaryFull"
        >
        </v-textarea>

        <!-- Genres -->
        <div>
          <h2 style="margin-top: 8px; margin-bottom: 8px">
            {{ $t("Genres") }}
          </h2>
          <v-chip
            v-for="(genre, index) in mediaItem.Genres"
            v-bind:key="index"
            label
            outlined
            draggable
            close
            close-icon="mdi-delete"
            style="margin-right: 4px; margin-bottom: 4px"
            v-on:click:close="onRemoveGenre(index)"
          >
            {{ genre.translated }}
          </v-chip>
          <div v-if="!mediaItem.Genres || mediaItem.Genres.length === 0">
            <p>{{ $t("none") }}</p>
          </div>

          <v-row align="center">
            <v-menu
              v-model="showAddGenreDialog"
              v-bind:close-on-click="false"
              v-bind:close-on-content-click="false"
              bottom
              right
              transition="scale-transition"
              origin="top left"
            >
              <template v-slot:activator="{ on }">
                <v-btn
                  color="primary"
                  text
                  small
                  style="
                    margin-left: 12px;
                    margin-right: 4px;
                    margin-bottom: 4px;
                    margin-top: 8px;
                  "
                  v-on="on"
                  v-on:click="onShowAddGenreDialog"
                  >{{ $t("Add Genre") }}</v-btn
                >
              </template>
              <v-card>
                <v-card-title>
                  {{ $t("Add Genre") }}
                </v-card-title>
                <v-card-text>
                  <v-select
                    v-bind:items="genres"
                    v-model="selectedGenre"
                    item-text="Name"
                    item-value="GenreID"
                  ></v-select>
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn
                    color="secondary"
                    v-on:click.stop="showAddGenreDialog = false"
                    >{{ $t("Cancel") }}</v-btn
                  >
                  <v-btn color="primary" v-on:click.stop="onAddGenreDialogOK">{{
                    $t("OK")
                  }}</v-btn>
                </v-card-actions>
              </v-card>
            </v-menu>
          </v-row>
        </div>

        <!-- Release Attributes -->
        <div>
          <h2 style="margin-top: 8px; margin-bottom: 8px">
            {{ $t("Release Attributes") }}
          </h2>
          <v-chip
            v-for="(raSearchTerm, index) in arrayReleaseAttributesSearchTerms"
            v-bind:key="index"
            label
            outlined
            draggable
            close
            close-icon="mdi-delete"
            style="margin-right: 4px; margin-bottom: 4px"
            v-on:click:close="onRemoveReleaseAttribute(index)"
          >
            {{ getReleaseAttribute(raSearchTerm) }}
          </v-chip>
          <div v-if="!mediaItem.ReleaseAttributesSearchTerms">
            <p>{{ $t("none") }}</p>
          </div>

          <v-row align="center">
            <v-menu
              v-model="showAddReleaseAttributeDialog"
              v-bind:close-on-click="false"
              v-bind:close-on-content-click="false"
              bottom
              right
              transition="scale-transition"
              origin="top left"
            >
              <template v-slot:activator="{ on }">
                <v-btn
                  color="primary"
                  text
                  small
                  style="
                    margin-left: 12px;
                    margin-right: 4px;
                    margin-bottom: 4px;
                    margin-top: 8px;
                  "
                  v-on="on"
                  v-on:click="onShowAddReleaseAttributeDialog"
                  >{{ $t("Add Release Attribute") }}</v-btn
                >
              </template>
              <v-card>
                <v-card-title>
                  {{ $t("Add Release Attribute") }}
                </v-card-title>
                <v-card-text>
                  <v-select
                    v-bind:items="releaseAttributes"
                    v-model="selectedReleaseAttribute"
                    item-text="displayAs"
                    item-value="searchTerm"
                  ></v-select>
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn
                    color="secondary"
                    v-on:click.stop="showAddReleaseAttributeDialog = false"
                    >{{ $t("Cancel") }}</v-btn
                  >
                  <v-btn
                    color="primary"
                    v-on:click.stop="onAddReleaseAttributeDialogOK"
                    >{{ $t("OK") }}</v-btn
                  >
                </v-card-actions>
              </v-card>
            </v-menu>
          </v-row>
        </div>
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
const logger = require("loglevel");
import * as _ from "lodash";

import * as helpers from "@/helpers/helpers";
import * as store from "@/store";
import { eventBus } from "@/main";

const { deepDiffMapper } = require("@/helpers/deep-diff-mapper");

export default {
  props: ["show", "type", "caption", "mediaItem"],

  data() {
    return {
      mediaItemBackup: {},
      showAddGenreDialog: false,
      selectedGenre: null,
      showAddReleaseAttributeDialog: false,
      selectedReleaseAttribute: null,
    };
  },

  watch: {
    mediaItem(newValue) {
      logger.log('EditMediaItemDialog mediaItem changed:', newValue);

      this.mediaItemBackup = newValue
        ? JSON.parse(JSON.stringify(newValue))
        : {};
    },
  },

  computed: {
    i18nCurrentMessages() {
      logger.log(
        "EditMediaItemDialog this.$i18n.messages[this.$i18n.locale]:",
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
          (item) =>
            !this.mediaItem.Genres || !this.mediaItem.Genres.find((genre) => genre.name === item.GenreID)
        );
    },

    arrayReleaseAttributesSearchTerms() {
      if (!this.mediaItem.ReleaseAttributesSearchTerms) {
        return [];
      }
      
      return this.mediaItem.ReleaseAttributesSearchTerms.split(";").filter(
        (item) => !!item
      );
    },

    releaseAttributes() {
      const raHave = this.arrayReleaseAttributesSearchTerms.map(
        (searchTerm) => {
          return {
            searchTerm,
            displayAs: this.getReleaseAttribute(searchTerm),
            deleted: false,
            sort: null,
          };
        }
      );

      return this.$shared.releaseAttributes
        .filter((item) => {
          return (
            !item.deleted &&
            !raHave.find((have) => have.displayAs === item.displayAs)
          );
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
        return eventBus.showSnackbar("error", this.$t('Primary Title is missing_'));
      }

      let hasChanges = false;
      const diff = deepDiffMapper.prune(
        deepDiffMapper.map(this.mediaItem, this.mediaItemBackup)
      );

      logger.log('EditMediaItemDialog diff:', diff);
      logger.log('EditMediaItemDialog Object.keys(diff):', Object.keys(diff));

      if (Object.keys(diff).length > 0) {
        logger.log('EditMediaItemDialog has changes!');
        hasChanges = true;
      }

      if (Object.keys(diff).find(key => key === 'Name')) {
        await store.updateMediaRecordField(this.mediaItem.id_Movies, 'Name', this.mediaItem.Name);
      }

      if (Object.keys(diff).find(key => key === 'Name2')) {
        await store.updateMediaRecordField(this.mediaItem.id_Movies, 'Name2', this.mediaItem.Name2);
      }

      if (Object.keys(diff).find(key => key === 'startYear')) {
        await store.updateMediaRecordField(this.mediaItem.id_Movies, 'startYear', this.mediaItem.startYear);
      }

      if (Object.keys(diff).find(key => key === 'MI_Quality')) {
        await store.updateMediaRecordField(this.mediaItem.id_Movies, 'MI_Quality', this.mediaItem.MI_Quality);
      }

      if (Object.keys(diff).find(key => key === 'Genres')) {
        await store.updateMovieGenres(this.mediaItem.id_Movies, this.mediaItem.Genres.map(item => item.name.toLowerCase()));
      }

      if (Object.keys(diff).find(key => key === 'ReleaseAttributesSearchTerms')) {
        await store.updateMovieReleaseAttribues(this.mediaItem.id_Movies, this.mediaItem.ReleaseAttributesSearchTerms);
      }

      if (Object.keys(diff).find(key => key === 'plotSummaryFull')) {
        const plotSummaryFull = this.mediaItem.plotSummaryFull;
        let plotSummary = _.truncate(this.mediaItem.plotSummaryFull, { length: 400, separator: ' ', omission: ' ...'});

        await store.updateMediaRecordField(this.mediaItem.id_Movies, 'plotSummary', plotSummary);
        await store.updateMediaRecordField(this.mediaItem.id_Movies, 'plotSummaryFull', plotSummaryFull);
      }

      // store fields that have been (re-)defined by the user
      let definedByUser = await store.fetchMovieFieldsDefinedByUser(this.mediaItem.id_Movies);
      const definedByUserOld = JSON.stringify(definedByUser);
      
      logger.log('definedByUser (from db):', definedByUser);

      Object.keys(diff).forEach(key => {
        if (!definedByUser.find(item => item === key)) {
          definedByUser.push(key);
        }
      })

      logger.log('definedByUser (new):', definedByUser);

      if (definedByUserOld !== JSON.stringify(definedByUser)) {
        await store.updateMediaRecordField(this.mediaItem.id_Movies, 'DefinedByUser', definedByUser.map(item => `|${item}|`).join(','));
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
      const genre = this.mediaItem.Genres[index];

      logger.log("EditMediaItemDialog genre array (before):", this.mediaItem.Genres);

      this.mediaItem.Genres.splice(index, 1);

      logger.log("EditMediaItemDialog genre array (after):", this.mediaItem.Genres);

      eventBus.showSnackbar(
        "success",
        this.$t('Genre "{genre}" removed_', { genre: genre.translated })
      );
    },

    onShowAddGenreDialog() {
      this.selectedGenre =
        this.genres.length > 0 ? this.genres[0].GenreID : null;
    },

    onAddGenreDialogOK() {
      if (this.selectedGenre) {
        if (!this.mediaItem.Genres) {
          this.mediaItem.Genres = [];
        }
        
        this.mediaItem.Genres.push({
          name: this.selectedGenre,
          translated: this.genres.find(
            (genre) => genre.GenreID === this.selectedGenre
          ).Name,
        });
      }

      this.showAddGenreDialog = false;
    },

    getReleaseAttribute(searchTerm) {
      logger.log("EditMediaItemDialog searchTerm:", searchTerm);
      logger.log(
        "EditMediaItemDialog this.$shared.releaseAttributes",
        this.$shared.releaseAttributes
      );
      return this.$shared.releaseAttributes.find(
        (ra) => ra.searchTerm === searchTerm
      ).displayAs;
    },

    onRemoveReleaseAttribute(index) {
      const ra = this.getReleaseAttribute(
        this.arrayReleaseAttributesSearchTerms[index]
      );

      const arr = this.arrayReleaseAttributesSearchTerms;
      logger.log("EditMediaItemDialog arr:", arr);

      arr.splice(index, 1);
      logger.log("EditMediaItemDialog spliced:", arr);

      const joined = arr.join(";");
      logger.log("EditMediaItemDialog joined:", joined);

      this.mediaItem.ReleaseAttributesSearchTerms = joined;

      eventBus.showSnackbar(
        "success",
        this.$t('Release Attribute "{releaseAttribute}" removed_', {
          releaseAttribute: ra,
        })
      );
    },

    onShowAddReleaseAttributeDialog() {
      this.selectedReleaseAttribute =
        this.releaseAttributes.length > 0
          ? this.releaseAttributes[0].searchTerm
          : null;
    },

    onAddReleaseAttributeDialogOK() {
      if (this.selectedReleaseAttribute) {
        this.mediaItem.ReleaseAttributesSearchTerms = (this.mediaItem.ReleaseAttributesSearchTerms ? this.mediaItem.ReleaseAttributesSearchTerms + ';' : '') + this.selectedReleaseAttribute
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
