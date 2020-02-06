<template>
  <v-app id="inspire">
    <!-- SIDEBAR -->
    <v-navigation-drawer v-model="drawer" app clipped style="z-index: 20">
      <v-list dense>
        <v-list-item @click="openSettings">
          <v-list-item-action>
            <v-icon style="color: lightgrey">mdi-settings</v-icon>
          </v-list-item-action>
          <v-list-item-title style="color: lightgrey">Settings</v-list-item-title>
        </v-list-item>

        <v-list-item v-on:click="onRescan">
          <v-list-item-action>
            <v-icon v-show="!isScanning">mdi-reload</v-icon>
            <v-icon v-show="isScanning">mdi-cancel</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title v-show="!isScanning">Scan Media</v-list-item-title>
            <v-list-item-title v-show="isScanning">Cancel Scan</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <!-- <v-list-item v-on:click="toggleRescan(false)">
          <v-list-item-action>
            <v-icon v-show="!isScanning">mdi-reload</v-icon>
            <v-icon v-show="isScanning">mdi-cancel</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title v-show="!isScanning">Rescan all media</v-list-item-title>
            <v-list-item-title v-show="isScanning">Cancel Scan</v-list-item-title>
          </v-list-item-content>
        </v-list-item>-->

        <v-divider></v-divider>

        <v-list-item v-for="item in items" :key="item.text" @click="goto(item.id)">
          <v-list-item-action>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>{{ item.text }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <!-- Filters -->
        <div
          v-if="($shared.filterSourcePaths && $shared.filterSourcePaths.length > 0) || ($shared.filterGenres && $shared.filterGenres.length > 0) || ($shared.filterAgeRatings && $shared.filterAgeRatings.length > 0) || ($shared.filterLists && $shared.filterLists.length > 0) || ($shared.filterAudioLanguages && $shared.filterAudioLanguages.length > 0) || ($shared.filterSubtitleLanguages && $shared.filterSubtitleLanguages.length > 0)"
        >
          <v-divider></v-divider>

          <v-subheader class="mt-4" style="margin: 0px!important">FILTERS</v-subheader>

          <v-expansion-panels accordion multiple>
            <!-- FILTER SOURCE PATHS -->
            <v-expansion-panel
              v-show="$shared.filterSourcePaths && $shared.filterSourcePaths.length > 0"
              style="padding: 0px!important"
            >
              <v-expansion-panel-header
                style="padding: 8px!important"
              >Source Paths {{filterSourcePathsTitle}}</v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-row>
                  <v-btn text v-on:click="setAllSourcePaths(false)">NONE</v-btn>
                  <v-btn text v-on:click="setAllSourcePaths(true)">ALL</v-btn>
                </v-row>
                <v-checkbox
                  v-for="sourcePath in $shared.filterSourcePaths"
                  v-bind:key="sourcePath.Description"
                  v-bind:label="sourcePath.Description + ' (' + sourcePath.NumMovies + ')'"
                  v-model="sourcePath.Selected"
                  v-on:click.native="filtersChanged"
                  style="margin: 0px"
                  color="dark-grey"
                ></v-checkbox>
              </v-expansion-panel-content>
            </v-expansion-panel>

            <!-- FILTER QUALITIES -->
            <v-expansion-panel
              v-show="$shared.filterQualities && $shared.filterQualities.length > 0"
              style="padding: 0px!important"
            >
              <v-expansion-panel-header
                style="padding: 8px!important"
              >Video Quality {{filterQualitiesTitle}}</v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-row>
                  <v-btn text v-on:click="setAllQualities(false)">NONE</v-btn>
                  <v-btn text v-on:click="setAllQualities(true)">ALL</v-btn>
                </v-row>
                <v-checkbox
                  v-for="quality in $shared.filterQualities"
                  v-bind:key="quality.MI_Quality"
                  v-bind:label="getFilterQualityLabel(quality.MI_Quality, quality.NumMovies)"
                  v-model="quality.Selected"
                  v-on:click.native="filtersChanged"
                  style="margin: 0px"
                  color="dark-grey"
                ></v-checkbox>
              </v-expansion-panel-content>
            </v-expansion-panel>

            <!-- FILTER AUDIO LANGUAGES -->
            <v-expansion-panel
              v-show="$shared.filterAudioLanguages && $shared.filterAudioLanguages.length > 0"
              style="padding: 0px!important"
            >
              <v-expansion-panel-header
                style="padding: 8px!important"
              >Audio Languages {{ filterAudioLanguagesTitle }}</v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-row>
                  <v-btn text v-on:click="setAllAudioLanguages(false)">NONE</v-btn>
                  <v-btn text v-on:click="setAllAudioLanguages(true)">ALL</v-btn>
                </v-row>
                <v-checkbox
                  v-for="audioLanguage in $shared.filterAudioLanguages"
                  v-bind:key="audioLanguage.Language"
                  v-bind:label="audioLanguage.DisplayText + ' (' + audioLanguage.NumMovies + ')'"
                  v-model="audioLanguage.Selected"
                  v-on:click.native="filtersChanged"
                  style="margin: 0px"
                  color="dark-grey"
                ></v-checkbox>
              </v-expansion-panel-content>
            </v-expansion-panel>

            <!-- FILTER SUBTITLE LANGUAGES -->
            <v-expansion-panel
              v-show="$shared.filterSubtitleLanguages && $shared.filterSubtitleLanguages.length > 0"
              style="padding: 0px!important"
            >
              <v-expansion-panel-header
                style="padding: 8px!important"
              >Subtitle Languages {{ filterSubtitleLanguagesTitle }}</v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-row>
                  <v-btn text v-on:click="setAllSubtitleLanguages(false)">NONE</v-btn>
                  <v-btn text v-on:click="setAllSubtitleLanguages(true)">ALL</v-btn>
                </v-row>
                <v-checkbox
                  v-for="subtitleLanguage in $shared.filterSubtitleLanguages"
                  v-bind:key="subtitleLanguage.Language"
                  v-bind:label="subtitleLanguage.DisplayText + ' (' + subtitleLanguage.NumMovies + ')'"
                  v-model="subtitleLanguage.Selected"
                  v-on:click.native="filtersChanged"
                  style="margin: 0px"
                  color="dark-grey"
                ></v-checkbox>
              </v-expansion-panel-content>
            </v-expansion-panel>

            <!-- FILTER LISTS -->
            <v-expansion-panel
              v-show="$shared.filterLists && $shared.filterLists.length > 0"
              style="padding: 0px!important"
            >
              <v-expansion-panel-header style="padding: 8px!important">My Lists {{filterListsTitle}}</v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-row>
                  <v-btn text v-on:click="setAllLists(false)">NONE</v-btn>
                  <v-btn text v-on:click="setAllLists(true)">ALL</v-btn>
                </v-row>
                <v-row v-for="list in $shared.filterLists" v-bind:key="list.id_Lists">
                  <v-checkbox
                    v-bind:label="list.Name + ' (' + list.NumMovies + ')'"
                    v-model="list.Selected"
                    v-on:click.native="filtersChanged"
                    style="margin: 0px"
                    color="dark-grey"
                  ></v-checkbox>
                  <v-spacer></v-spacer>
                  <v-icon
                    v-if="list.id_Lists"
                    style="align-items: flex-start; padding-top: 4px; cursor: pointer"
                    v-on:click="deleteList(list)"
                  >mdi-delete</v-icon>
                </v-row>
              </v-expansion-panel-content>
            </v-expansion-panel>

            <!-- FILTER (USER) RATINGS -->
            <v-expansion-panel
              v-show="$shared.filterRatings && $shared.filterRatings.length > 0"
              style="padding: 0px!important"
            >
              <v-expansion-panel-header
                style="padding: 8px!important"
              >My Ratings {{filterRatingsTitle}}</v-expansion-panel-header>
              <!--  {{ filterRatingsTitle }} -->
              <v-expansion-panel-content>
                <v-row>
                  <v-btn text v-on:click="setAllRatings(false)">NONE</v-btn>
                  <v-btn text v-on:click="setAllRatings(true)">ALL</v-btn>
                </v-row>
                <v-checkbox
                  v-for="rating in $shared.filterRatings"
                  v-bind:key="rating.Rating"
                  v-bind:label="getFilterRatingLabel(rating.Rating, rating.NumMovies)"
                  v-model="rating.Selected"
                  v-on:click.native="filtersChanged"
                  style="margin: 0px"
                  color="dark-grey"
                >
                  <v-icon
                    small
                    v-for="i in 5"
                    v-bind:key="i"
                    v-bind:color="(rating.Rating > (i - 1) ? 'amber' : (rating.Rating > 0 ? 'white' : 'grey'))"
                  >mdi-star</v-icon>
                </v-checkbox>
              </v-expansion-panel-content>
            </v-expansion-panel>

            <!-- FILTER Metacritic Score -->
            <v-expansion-panel style="padding: 0px!important">
              <v-expansion-panel-header
                style="padding: 8px!important"
              >Metacritic Score {{filterMetacriticScoreTitle}}</v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-range-slider
                  v-model="$shared.filterMetacriticScore"
                  :max="100"
                  :min="0"
                  hide-details
                  class="align-center"
                  v-on:change="filtersChanged"
                >
                  <template v-slot:prepend>{{$shared.filterMetacriticScore[0]}}</template>
                  <template v-slot:append>{{$shared.filterMetacriticScore[1]}}</template>
                </v-range-slider>
                <v-checkbox
                  label="include entries with no metacritic score"
                  v-model="$shared.filterMetacriticScoreNone"
                  v-on:click.native="filtersChanged"
                  style="margin: 0px"
                  color="dark-grey"
                ></v-checkbox>
              </v-expansion-panel-content>
            </v-expansion-panel>

            <!-- FILTER IMDB Rating -->
            <v-expansion-panel style="padding: 0px!important">
              <v-expansion-panel-header
                style="padding: 8px!important"
              >IMDB Rating {{filterIMDBRatingTitle}}</v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-range-slider
                  v-model="$shared.filterIMDBRating"
                  :max="10"
                  :min="0"
                  hide-details
                  class="align-center"
                  v-on:change="filtersChanged"
                >
                  <template v-slot:prepend>{{$shared.filterIMDBRating[0]}}</template>
                  <template v-slot:append>{{$shared.filterIMDBRating[1]}}</template>
                </v-range-slider>
                <v-checkbox
                  label="include entries with no IMDB rating"
                  v-model="$shared.filterIMDBRatingNone"
                  v-on:click.native="filtersChanged"
                  style="margin: 0px"
                  color="dark-grey"
                ></v-checkbox>
              </v-expansion-panel-content>
            </v-expansion-panel>

            <!-- FILTER GENRES -->
            <v-expansion-panel
              v-show="$shared.filterGenres && $shared.filterGenres.length > 0"
              style="padding: 0px!important"
            >
              <v-expansion-panel-header
                style="padding: 8px!important"
              >Genres {{ filterGenresTitle }}</v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-row>
                  <v-btn text v-on:click="setAllGenres(false)">NONE</v-btn>
                  <v-btn text v-on:click="setAllGenres(true)">ALL</v-btn>
                </v-row>
                <v-checkbox
                  v-for="genre in $shared.filterGenres"
                  v-bind:key="genre.id_Genres"
                  v-bind:label="genre.Name + ' (' + genre.NumMovies + ')'"
                  v-model="genre.Selected"
                  v-on:click.native="filtersChanged"
                  style="margin: 0px"
                  color="dark-grey"
                ></v-checkbox>
              </v-expansion-panel-content>
            </v-expansion-panel>

            <!-- FILTER AGE RATINGS -->
            <v-expansion-panel
              v-show="$shared.filterAgeRatings && $shared.filterAgeRatings.length > 0"
              style="padding: 0px!important"
            >
              <v-expansion-panel-header
                style="padding: 8px!important"
              >Ages {{ filterAgeRatingsTitle }}</v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-row>
                  <v-btn text v-on:click="setAllAgeRatings(false)">NONE</v-btn>
                  <v-btn text v-on:click="setAllAgeRatings(true)">ALL</v-btn>
                </v-row>
                <v-checkbox
                  v-for="ageRating in $shared.filterAgeRatings"
                  v-bind:key="ageRating.Age"
                  v-bind:label="(ageRating.Age === -1 ? 'undetermined' : ageRating.Age) + ' (' + ageRating.NumMovies + ')'"
                  v-model="ageRating.Selected"
                  v-on:click.native="filtersChanged"
                  style="margin: 0px"
                  color="dark-grey"
                ></v-checkbox>
              </v-expansion-panel-content>
            </v-expansion-panel>

            <!-- FILTER GROUP: PARENTAL ADVISORY -->
            <v-expansion-panel
              v-show="($shared.filterParentalAdvisory.Nudity && $shared.filterParentalAdvisory.Nudity.length > 0) || ($shared.filterParentalAdvisory.Violence && $shared.filterParentalAdvisory.Violence.length > 0) || ($shared.filterParentalAdvisory.Profanity && $shared.filterParentalAdvisory.Profanity.length > 0) || ($shared.filterParentalAdvisory.Alcohol && $shared.filterParentalAdvisory.Alcohol.length > 0) || ($shared.filterParentalAdvisory.Frightening && $shared.filterParentalAdvisory.Frightening.length > 0)"
              style="padding: 0px!important"
            >
              <v-expansion-panel-header style="padding: 8px!important">Content Advisory</v-expansion-panel-header>

              <v-expansion-panel-content>
                <v-expansion-panels accordion multiple>
                  <v-expansion-panel
                    v-for="category in filterParentalAdvisoryCategories"
                    v-bind:key="category.Name"
                    v-show="$shared.filterParentalAdvisory[category.Name] && $shared.filterParentalAdvisory[category.Name].length > 0"
                    style="padding: 0px!important"
                  >
                    <v-expansion-panel-header
                      style="padding: 8px!important"
                    >{{category.DisplayText}} {{filterParentalAdvisoryCategoryTitle(category)}}</v-expansion-panel-header>
                    <v-expansion-panel-content>
                      <v-row>
                        <v-btn text v-on:click="setAllParentalAdvisory(category, false)">NONE</v-btn>
                        <v-btn text v-on:click="setAllParentalAdvisory(category, true)">ALL</v-btn>
                      </v-row>
                      <v-row
                        v-for="paItem in $shared.filterParentalAdvisory[category.Name]"
                        v-bind:key="paItem.Severity"
                      >
                        <v-checkbox
                          v-bind:label="paItem.DisplayText + ' (' + paItem.NumMovies + ')'"
                          v-model="paItem.Selected"
                          v-on:click.native="filtersChanged"
                          style="margin: 0px"
                          color="dark-grey"
                        ></v-checkbox>
                      </v-row>
                    </v-expansion-panel-content>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-expansion-panel-content>
            </v-expansion-panel>

            <!-- FILTER Persons -->
            <v-expansion-panel style="padding: 0px!important">
              <v-expansion-panel-header
                style="padding: 8px!important"
              >Persons {{filterPersonsTitle}}</v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-row>
                  <v-btn text v-on:click="setAllPersons(false)">NONE</v-btn>
                  <v-btn text v-on:click="setAllPersons(true)">ALL</v-btn>
                  <v-btn text v-on:click="addPerson()">FIND</v-btn>
                </v-row>
                <v-row v-for="person in $shared.filterPersons" v-bind:key="person.IMDB_Person_ID">
                  <v-checkbox
                    v-bind:label="person.Person_Name + ' (' + person.NumMovies + ')'"
                    v-model="person.Selected"
                    v-on:click.native="filtersChanged"
                    style="margin: 0px"
                    color="dark-grey"
                  ></v-checkbox>
                  <v-spacer></v-spacer>
                  <v-icon
                    style="align-items: flex-start; padding-top: 4px; cursor: pointer"
                    v-if="person.id_Filter_Persons"
                    v-on:click="deletePerson(person)"
                  >mdi-delete</v-icon>
                </v-row>
              </v-expansion-panel-content>
            </v-expansion-panel>

            <!-- FILTER Companies -->
            <v-expansion-panel style="padding: 0px!important">
              <v-expansion-panel-header
                style="padding: 8px!important"
              >Companies {{filterCompaniesTitle}}</v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-row>
                  <v-btn text v-on:click="setAllCompanies(false)">NONE</v-btn>
                  <v-btn text v-on:click="setAllCompanies(true)">ALL</v-btn>
                  <v-btn text v-on:click="addCompany()">FIND</v-btn>
                </v-row>
                <v-row v-for="company in $shared.filterCompanies" v-bind:key="company.Company_Name">
                  <v-checkbox
                    v-bind:label="company.Company_Name + ' (' + company.NumMovies + ')'"
                    v-model="company.Selected"
                    v-on:click.native="filtersChanged"
                    style="margin: 0px"
                    color="dark-grey"
                  ></v-checkbox>
                  <v-spacer></v-spacer>
                  <v-icon
                    style="align-items: flex-start; padding-top: 4px; cursor: pointer"
                    v-if="company.id_Filter_Companies"
                    v-on:click="deleteCompany(company)"
                  >mdi-delete</v-icon>
                </v-row>
              </v-expansion-panel-content>
            </v-expansion-panel>

            <!-- FILTER YEARS -->
            <v-expansion-panel
              v-show="$shared.filterYears && $shared.filterYears.length > 0"
              style="padding: 0px!important"
            >
              <v-expansion-panel-header style="padding: 8px!important">Years {{filterYearsTitle}}</v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-row>
                  <v-btn text v-on:click="setAllYears(false)">NONE</v-btn>
                  <v-btn text v-on:click="setAllYears(true)">ALL</v-btn>
                </v-row>
                <v-checkbox
                  v-for="year in $shared.filterYears"
                  v-bind:key="year.startYear"
                  v-bind:label="getFilterYearLabel(year.startYear, year.NumMovies)"
                  v-model="year.Selected"
                  v-on:click.native="filtersChanged"
                  style="margin: 0px"
                  color="dark-grey"
                ></v-checkbox>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>

        <v-divider style="margin-top: 4px"></v-divider>

        <v-list-item @click="quit">
          <v-list-item-action>
            <v-icon style="color: lightgrey">mdi-power</v-icon>
          </v-list-item-action>
          <v-list-item-title style="color: lightgrey">Quit</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- TOP BAR -->
    <v-app-bar app clipped-left color="red" dense>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title class="mr-12 align-center noshrink">
        <span class="title">MediaBox</span>
      </v-toolbar-title>
      <div class="flex-grow-1"></div>
      <v-row align-content="end" justify="end" style="text-align: right!important">
        <v-text-field
          :append-icon-cb="() => {}"
          placeholder="Search..."
          single-line
          append-icon="mdi-magnify"
          color="white"
          hide-details
          v-model="searchText"
        ></v-text-field>
      </v-row>
    </v-app-bar>

    <!-- CONTENT -->
    <v-content>
      <v-container style="display: flex; max-width: 100%!important; padding: 0px!important">
        <router-view></router-view>

        <mk-delete-list-dialog
          v-bind:show="deleteListDialog.show"
          title="Delete List"
          v-bind:question="`Do you really want to delete the list '${deleteListDialog.Name}'?`"
          yes="YES, Delete"
          cancel="Cancel"
          yesColor="error"
          cancelColor="secondary"
          v-on:yes="onDeleteListDialogOK"
          v-on:cancel="onDeleteListDialogCancel"
        ></mk-delete-list-dialog>

        <mk-search-companies-dialog
          ref="searchCompaniesDialog"
          v-bind:show="searchCompaniesDialog.show"
          title="Find Company"
          searchMode="companies"
          v-on:cancel="onSearchCompaniesDialogCancel"
        ></mk-search-companies-dialog>

        <mk-search-persons-dialog
          ref="searchPersonsDialog"
          v-bind:show="searchPersonsDialog.show"
          title="Find Person"
          searchMode="persons"
          v-on:cancel="onSearchPersonsDialogCancel"
        ></mk-search-persons-dialog>

        <mk-scan-options-dialog
          ref="scanOptionsDialog"
          v-bind:show="scanOptionsDialog.show"
          v-bind:showMediaInfoWarning="scanOptionsDialog.showMediaInfoWarning"
          v-on:cancel="onScanOptionsDialogCancel"
          v-on:ok="onScanOptionsDialogOK"
        ></mk-scan-options-dialog>

        <!-- BOTTOM BAR -->
        <v-bottom-navigation
          fixed
          dark
          v-show="scanInfo.show"
          style="height: auto; padding: 4px 8px 4px 20px; z-index: 100"
        >
          <!-- v-model="bottomNav" -->
          <v-row align-content="start" justify="start">
            <!--  style="text-align: right!important" -->
            <div v-if="scanInfo.show">
              <p style="margin: 0px!important">{{scanInfo.header}}</p>
              <p
                style="margin: 0px!important; font-size: 12px;text-overflow: ellipsis; white-space: nowrap; overflow: hidden;"
              >{{scanInfo.details}}</p>
            </div>
            <div class="flex-grow-1"></div>
            <v-btn text v-on:click="cancelRescan">
              <v-icon>mdi-cancel</v-icon>
            </v-btn>
          </v-row>
        </v-bottom-navigation>
      </v-container>
    </v-content>

    <!-- SNACK BAR -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout">
      <div>
        <strong v-if="snackbar.details && snackbar.details.length > 0">{{ snackbar.text }}</strong>
        <div v-if="!snackbar.details || snackbar.details.length === 0">{{ snackbar.text }}</div>
        <div
          v-for="(snackbardetail, index) in snackbar.details"
          v-bind:key="index"
          style="padding-left: 8px"
        >{{snackbardetail}}</div>
      </div>
      <v-spacer />
      <v-btn dark text @click="snackbar.show = false">Close</v-btn>
    </v-snackbar>

    <!-- LOADING OVERLAY -->
    <v-overlay style="z-index: 1000;" v-bind:value="showLoadingOverlay">
      <span style="text-shadow: 0 0 4px #FFFFFF;">loading</span>
      <v-progress-linear indeterminate color="white" class="mb-0" style="text-shadow: 0 0 4px #FFFFFF; width: 200px"></v-progress-linear>
    </v-overlay>
  </v-app>
</template>

<script>
import * as _ from "lodash";

const remote = require("electron").remote;
const logger = require("loglevel");

// eslint-disable-next-line no-unused-var
import * as store from "@/store";
import { shared } from "@/shared";
import { eventBus } from "@/main";
import * as helpers from "@/helpers/helpers";

import Dialog from "@/components/shared/Dialog.vue";
import SearchDataDialog from "@/components/shared/SearchDataDialog.vue";
import ScanOptionsDialog from "@/components/shared/ScanOptionsDialog.vue";

export default {
  components: {
    "mk-delete-list-dialog": Dialog,
    "mk-search-companies-dialog": SearchDataDialog,
    "mk-search-persons-dialog": SearchDataDialog,
    "mk-scan-options-dialog": ScanOptionsDialog
  },

  props: {
    source: String
  },
  data: () => ({
    showLoadingOverlay: false,
    shared,
    drawer: null,
    items: [
      { icon: "mdi-movie", text: "Movies", id: "movies" },
      { icon: "mdi-television", text: "Series", id: "tv" }
    ],

    searchText: null,

    isScanning: false,

    scanInfo: {
      show: false,
      header: "",
      details: ""
    },

    snackbar: {
      show: false,
      color: "",
      timeout: 6000,
      text: "",
      details: []
    },

    deleteListDialog: {
      show: false,
      id_Lists: null,
      Name: null
    },

    filterParentalAdvisoryCategories: [
      {
        Name: "Nudity",
        DisplayText: "Sex & Nudity"
      },
      {
        Name: "Violence",
        DisplayText: "Violence & Gore"
      },
      {
        Name: "Profanity",
        DisplayText: "Profanity"
      },
      {
        Name: "Alcohol",
        DisplayText: "Alcohol, Drugs & Smoking"
      },
      {
        Name: "Frightening",
        DisplayText: "Frightening & Intense Scenes"
      }
    ],

    searchCompaniesDialog: {
      show: false
    },

    searchPersonsDialog: {
      show: false
    },

    scanOptionsDialog: {
      show: false,
      showMediaInfoWarning: false
    }
  }),

  watch: {
    // LEARNING: there is a difference with "this" in name: function(){} and name: () => {}
    searchText: function(newValue, oldValue) {
      logger.log("searchText old:", oldValue, "new:", newValue);
      this.debouncedEventBusSearchTextChanged(newValue);
    }
  },

  computed: {
    filterSourcePathsTitle() {
      if (!this.$shared.filterSourcePaths.find(filter => !filter.Selected)) {
        return "(ALL)";
      }

      if (!this.$shared.filterSourcePaths.find(filter => filter.Selected)) {
        return "(NONE)";
      }

      return (
        "(" +
        this.$shared.filterSourcePaths.filter(filter => filter.Selected)
          .length +
        "/" +
        this.$shared.filterSourcePaths.length +
        ")"
      );
    },

    filterGenresTitle() {
      if (!this.$shared.filterGenres.find(filter => !filter.Selected)) {
        return "(ALL)";
      }

      if (!this.$shared.filterGenres.find(filter => filter.Selected)) {
        return "(NONE)";
      }

      return (
        "(" +
        this.$shared.filterGenres.filter(filter => filter.Selected).length +
        "/" +
        this.$shared.filterGenres.length +
        ")"
      );
    },

    filterAgeRatingsTitle() {
      if (!this.$shared.filterAgeRatings.find(filter => !filter.Selected)) {
        return "(ALL)";
      }

      if (!this.$shared.filterAgeRatings.find(filter => filter.Selected)) {
        return "(NONE)";
      }

      return (
        "(" +
        this.$shared.filterAgeRatings.filter(filter => filter.Selected).length +
        "/" +
        this.$shared.filterAgeRatings.length +
        ")"
      );
    },

    filterRatingsTitle() {
      if (!this.$shared.filterRatings.find(filter => !filter.Selected)) {
        return "(ALL)";
      }

      if (!this.$shared.filterRatings.find(filter => filter.Selected)) {
        return "(NONE)";
      }

      return (
        "(" +
        this.$shared.filterRatings.filter(filter => filter.Selected).length +
        "/" +
        this.$shared.filterRatings.length +
        ")"
      );
    },

    filterYearsTitle() {
      if (!this.$shared.filterYears.find(filter => !filter.Selected)) {
        return "(ALL)";
      }

      if (!this.$shared.filterYears.find(filter => filter.Selected)) {
        return "(NONE)";
      }

      return (
        "(" +
        this.$shared.filterYears.filter(filter => filter.Selected).length +
        "/" +
        this.$shared.filterYears.length +
        ")"
      );
    },

    filterQualitiesTitle() {
      if (!this.$shared.filterQualities.find(filter => !filter.Selected)) {
        return "(ALL)";
      }

      if (!this.$shared.filterQualities.find(filter => filter.Selected)) {
        return "(NONE)";
      }

      return (
        "(" +
        this.$shared.filterQualities.filter(filter => filter.Selected).length +
        "/" +
        this.$shared.filterQualities.length +
        ")"
      );
    },

    filterListsTitle() {
      if (!this.$shared.filterLists.find(filter => !filter.Selected)) {
        return "(ALL)";
      }

      if (!this.$shared.filterLists.find(filter => filter.Selected)) {
        return "(NONE)";
      }

      return (
        "(" +
        this.$shared.filterLists.filter(filter => filter.Selected).length +
        "/" +
        this.$shared.filterLists.length +
        ")"
      );
    },

    filterPersonsTitle() {
      if (!this.$shared.filterPersons.find(filter => !filter.Selected)) {
        return "(ALL)";
      }

      if (!this.$shared.filterPersons.find(filter => filter.Selected)) {
        return "(NONE)";
      }

      return (
        "(" +
        this.$shared.filterPersons.filter(filter => filter.Selected).length +
        "/" +
        this.$shared.filterPersons.length +
        ")"
      );
    },

    filterCompaniesTitle() {
      if (!this.$shared.filterCompanies.find(filter => !filter.Selected)) {
        return "(ALL)";
      }

      if (!this.$shared.filterCompanies.find(filter => filter.Selected)) {
        return "(NONE)";
      }

      return (
        "(" +
        this.$shared.filterCompanies.filter(filter => filter.Selected).length +
        "/" +
        this.$shared.filterCompanies.length +
        ")"
      );
    },

    filterAudioLanguagesTitle() {
      if (!this.$shared.filterAudioLanguages.find(filter => !filter.Selected)) {
        return "(ALL)";
      }

      if (!this.$shared.filterAudioLanguages.find(filter => filter.Selected)) {
        return "(NONE)";
      }

      return (
        "(" +
        this.$shared.filterAudioLanguages.filter(filter => filter.Selected)
          .length +
        "/" +
        this.$shared.filterAudioLanguages.length +
        ")"
      );
    },

    filterSubtitleLanguagesTitle() {
      if (
        !this.$shared.filterSubtitleLanguages.find(filter => !filter.Selected)
      ) {
        return "(ALL)";
      }

      if (
        !this.$shared.filterSubtitleLanguages.find(filter => filter.Selected)
      ) {
        return "(NONE)";
      }

      return (
        "(" +
        this.$shared.filterSubtitleLanguages.filter(filter => filter.Selected)
          .length +
        "/" +
        this.$shared.filterSubtitleLanguages.length +
        ")"
      );
    },

    filterMetacriticScoreTitle() {
      if (
        this.$shared.filterMetacriticScore[0] == 0 &&
        this.$shared.filterMetacriticScore[1] == 100
      ) {
        return `(ALL${this.$shared.filterMetacriticScoreNone ? "" : "*"})`;
      }

      return `(${this.$shared.filterMetacriticScore[0]} - ${
        this.$shared.filterMetacriticScore[1]
      }${this.$shared.filterMetacriticScoreNone ? "" : "*"})`;
    },

    filterIMDBRatingTitle() {
      if (
        this.$shared.filterIMDBRating[0] == 0 &&
        this.$shared.filterIMDBRating[1] == 10
      ) {
        return `(ALL${this.$shared.filterIMDBRatingNone ? "" : "*"})`;
      }

      return `(${this.$shared.filterIMDBRating[0]} - ${
        this.$shared.filterIMDBRating[1]
      }${this.$shared.filterIMDBRatingNone ? "" : "*"})`;
    }
  },

  methods: {
    goto(itemid) {
      if (!itemid) {
        return;
      }

      if (itemid == "movies") {
        return this.$router.push("/medialist/movies");
      }

      if (itemid == "tv") {
        return this.$router.push("/medialist/tv");
      }
    },
    openSettings() {
      return this.$router.push("/settings");
    },

    toggleRescan(onlyNew) {
      if (!store.isScanning) {
        store.rescan(onlyNew);
      } else {
        store.abortRescan();
      }
    },

    cancelRescan() {
      store.abortRescan();
    },

    eventBusSearchTextChanged: function(searchText) {
      eventBus.searchTextChanged(searchText);
    },

    eventBusRefetchMedia: function(setPage) {
      eventBus.refetchMedia(setPage);
    },

    filtersChanged: function() {
      logger.log("filters changed this.$shared:", this.$shared);
      this.debouncedEventBusRefetchMedia();
    },

    setAllSourcePaths: function(value) {
      this.$shared.filterSourcePaths.forEach(sp => {
        sp.Selected = value;
      });

      this.filtersChanged();
    },

    setAllGenres: function(value) {
      this.$shared.filterGenres.forEach(genre => {
        genre.Selected = value;
      });

      this.filtersChanged();
    },

    setAllAgeRatings: function(value) {
      this.$shared.filterAgeRatings.forEach(ar => {
        ar.Selected = value;
      });

      this.filtersChanged();
    },

    setAllRatings: function(value) {
      this.$shared.filterRatings.forEach(rating => {
        rating.Selected = value;
      });

      this.filtersChanged();
    },

    setAllYears: function(value) {
      this.$shared.filterYears.forEach(year => {
        year.Selected = value;
      });

      this.filtersChanged();
    },

    setAllLists: function(value) {
      this.$shared.filterLists.forEach(list => {
        list.Selected = value;
      });

      this.filtersChanged();
    },

    setAllParentalAdvisory: function(category, value) {
      this.$shared.filterParentalAdvisory[category.Name].forEach(paItem => {
        paItem.Selected = value;
      });

      this.filtersChanged();
    },

    setAllPersons: function(value, exclusionList) {
      this.$shared.filterPersons.forEach(sp => {
        if (
          exclusionList &&
          exclusionList.find(val => sp.IMDB_Person_ID === val)
        ) {
          sp.Selected = !value;
          return;
        }

        sp.Selected = value;
      });

      this.filtersChanged();
    },

    setAllCompanies: function(value, exclusionList) {
      logger.log("setAllCompanies:", { value, exclusionList });

      this.$shared.filterCompanies.forEach(sp => {
        if (
          exclusionList &&
          exclusionList.find(val => sp.Company_Name === val)
        ) {
          sp.Selected = !value;
          return;
        }

        sp.Selected = value;
      });

      this.filtersChanged();
    },

    setAllQualities: function(value) {
      this.$shared.filterQualities.forEach(quality => {
        quality.Selected = value;
      });

      this.filtersChanged();
    },

    setAllAudioLanguages: function(value) {
      this.$shared.filterAudioLanguages.forEach(lang => {
        lang.Selected = value;
      });

      this.filtersChanged();
    },

    setAllSubtitleLanguages: function(value) {
      this.$shared.filterSubtitleLanguages.forEach(lang => {
        lang.Selected = value;
      });

      this.filtersChanged();
    },

    getFilterRatingLabel(rating, numMovies) {
      let label = "";

      if (rating) {
        for (let i = 0; i < rating; i++) {
          label += "★";
        }

        for (let i = 5; i > rating; i--) {
          label += "☆";
        }
      } else {
        label += "<not yet rated>";
      }

      label += " (" + numMovies + ")";

      return label;
    },

    getFilterYearLabel(startYear, NumMovies) {
      if (startYear < 0) {
        return `<none provided> (${NumMovies})`;
      }

      return `${startYear} (${NumMovies})`;
    },

    getFilterQualityLabel(quality, NumMovies) {
      if (!quality) {
        return `<none provided> (${NumMovies})`;
      }

      return `${quality} (${NumMovies})`;
    },

    deleteList(list) {
      this.deleteListDialog.id_Lists = list.id_Lists;
      this.deleteListDialog.Name = list.Name;
      this.deleteListDialog.show = true;
    },

    onDeleteListDialogOK() {
      (async () => {
        try {
          this.deleteListDialog.show = false;

          logger.log("DELETE LIST");

          await store.db.fireProcedure(
            `DELETE FROM tbl_Lists WHERE id_Lists = $id_Lists`,
            {
              $id_Lists: this.deleteListDialog.id_Lists
            }
          );

          logger.log("DELETE LISTS MOVIES");

          await store.db.fireProcedure(
            `DELETE FROM tbl_Lists_Movies WHERE id_Lists NOT IN (SELECT id_Lists FROM tbl_Lists)`,
            []
          );

          eventBus.refetchFilters();

          eventBus.showSnackbar(
            "success",
            `List '${this.deleteListDialog.Name}' removed.`
          );
        } catch (err) {
          eventBus.showSnackbar("error", err);
        }
      })();
    },

    deletePerson(person) {
      store.deleteFilterPerson(person.id_Filter_Persons);
      eventBus.refetchFilters();
    },

    deleteCompany(company) {
      store.deleteFilterCompany(company.id_Filter_Companies);
      eventBus.refetchFilters();
    },

    onDeleteListDialogCancel() {
      this.deleteListDialog.show = false;
    },

    async onRescan() {
      if (store.isScanning) {
        store.abortRescan();
        return;
      }

      this.scanOptionsDialog.showMediaInfoWarning = (await store.getSetting(
        "MediainfoPath"
      ))
        ? false
        : true;

      this.scanOptionsDialog.show = true;
    },

    onScanOptionsDialogCancel() {
      this.scanOptionsDialog.show = false;
    },

    onScanOptionsDialogOK(chosenMethod) {
      const onlyNew = chosenMethod === 1;

      // TODO: run scan
      logger.log("chosen Scan Option:", chosenMethod, "onlyNew:", onlyNew);

      store.rescan(onlyNew);

      this.scanOptionsDialog.show = false;
    },

    filterParentalAdvisoryCategoryTitle(category) {
      if (
        !this.$shared.filterParentalAdvisory[category.Name].find(
          filter => !filter.Selected
        )
      ) {
        return "(ALL)";
      }

      if (
        !this.$shared.filterParentalAdvisory[category.Name].find(
          filter => filter.Selected
        )
      ) {
        return "(NONE)";
      }

      return (
        "(" +
        this.$shared.filterParentalAdvisory[category.Name].filter(
          filter => filter.Selected
        ).length +
        "/" +
        this.$shared.filterParentalAdvisory[category.Name].length +
        ")"
      );
    },

    addPerson() {
      this.searchPersonsDialog.show = true;
      this.$refs.searchPersonsDialog.init();
    },

    onSearchPersonsDialogCancel() {
      this.searchPersonsDialog.show = false;
    },

    addCompany() {
      this.searchCompaniesDialog.show = true;
      this.$refs.searchCompaniesDialog.init();
    },

    onSearchCompaniesDialogCancel() {
      this.searchCompaniesDialog.show = false;
    },

    quit() {
      remote.getCurrentWindow().close();
    }
  },

  // ### LifeCycleHooks ###
  created() {
    logger.log("shared:", this.shared);

    this.$vuetify.theme.dark = true;

    eventBus.$on("showSnackbar", ({ color, textOrErrorObject, timeout }) => {
      logger.debug("snackbar called:", textOrErrorObject);
      this.snackbar.details = [];
      this.snackbar.color = color;
      this.snackbar.timeout = timeout;

      if (
        typeof textOrErrorObject === "string" ||
        textOrErrorObject instanceof String
      ) {
        this.snackbar.text = textOrErrorObject;
      } else if (textOrErrorObject.syscall && textOrErrorObject.code) {
        // fetch error
        this.snackbar.text =
          textOrErrorObject.syscall +
          " " +
          textOrErrorObject.code +
          (textOrErrorObject.address ? " " + textOrErrorObject.address : "") +
          (textOrErrorObject.port ? ":" + textOrErrorObject.port : "");
      } else if (textOrErrorObject.errno && textOrErrorObject.code) {
        // SQLite error
        this.snackbar.text = `SQLite error: ${textOrErrorObject.code} (${textOrErrorObject.errno})`;
      } else if (textOrErrorObject.error) {
        // our self-defined error object with message and optional details
        this.snackbar.text = textOrErrorObject.error.message;

        if (
          typeof textOrErrorObject.error.details === "string" ||
          textOrErrorObject.error.details instanceof String
        ) {
          this.snackbar.details.push(textOrErrorObject.error.details);
        } else {
          if (Array.isArray(textOrErrorObject.error.details)) {
            textOrErrorObject.error.details.forEach(detail => {
              if (
                typeof textOrErrorObject.error.details === "string" ||
                textOrErrorObject.error.details instanceof String
              ) {
                this.snackbar.details.push(detail);
              }
            });
          }
        }
      } else {
        this.snackbar.text = "<unknown text>";
      }

      this.snackbar.show = true;
    });

    eventBus.$on("scanInfoShow", ({ header, details }) => {
      this.scanInfo = {
        header,
        details,
        show: true
      };
    });

    eventBus.$on("rescanStarted", () => {
      this.isScanning = true;
    });

    eventBus.$on("rescanStopped", () => {
      this.isScanning = false;
    });

    eventBus.$on("scanInfoOff", () => {
      this.scanInfo.show = false;
    });

    eventBus.$on("filtersChanged", () => {
      this.filtersChanged();
    });

    eventBus.$on("showLoadingOverlay", value => {
      this.showLoadingOverlay = value;
    });

    eventBus.$on("setFilter", setFilter => {
      if (!setFilter) {
        return;
      }

      if (setFilter.filterCompanies) {
        this.setAllCompanies(false, setFilter.filterCompanies);
      }

      if (setFilter.filterPersons) {
        this.setAllPersons(false, setFilter.filterPersons);
      }
    });

    // eventBus.scanInfoShow('KILLME', 'Asterix und das Geheimnis des Zaubertranks ~ Astérix - Le secret de la potion magique (De)(BD)[2018][Adventure, Animation, Comedy][6.9 @ 3074][tt8001346].mkv');

    // lodash debounced functions
    this.debouncedEventBusSearchTextChanged = _.debounce(
      this.eventBusSearchTextChanged,
      500
    );

    this.debouncedEventBusRefetchMedia = _.debounce(
      this.eventBusRefetchMedia,
      1000
    );
  }
};
</script>
<style>
h1 {
  margin-bottom: 16px;
}

.noshrink {
  flex-shrink: 0 !important;
}

.scrollcontainer {
  overflow-y: auto;
  overflow-x: hidden;
}

.scrollcontainer::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  background-color: #f5f5f5;
}

.scrollcontainer::-webkit-scrollbar {
  width: 5px;
  background-color: #f5f5f5;
}

.scrollcontainer::-webkit-scrollbar-thumb {
  background-color: #000000;
  border: 1px solid #555555;
}

.Clickable {
  font-size: 0.875rem;
  font-weight: normal;
  color: #fff !important;
  cursor: pointer;
}

.Clickable:hover {
  color: #2196f3 !important;
}
</style>