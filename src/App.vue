<template>
  <v-app>
    <!-- SIDEBAR -->
    <v-navigation-drawer
      v-model="$shared.sidenav"
      app
      clipped
      style="z-index: 20"
      v-bind:width="320"
    >
      <!-- SIDEBAR OVERLAY -->
      <v-overlay style="z-index: 1000" v-bind:value="showSidebarLoadingOverlay">
        <div style="text-align: center">
          <v-progress-circular
            indeterminate
            color="red"
            size="70"
            width="7"
          ></v-progress-circular>
        </div>
      </v-overlay>

      <v-list dense>
        <v-list-item
          v-on:click="onRescan"
          v-bind:disabled="store.doAbortRescan"
        >
          <v-list-item-action>
            <v-icon v-show="!isScanning">mdi-reload-alert</v-icon>
            <v-icon v-show="isScanning">mdi-cancel</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title v-show="!isScanning">{{
              $t("Scan Media")
            }}</v-list-item-title>
            <v-list-item-title v-show="isScanning && !store.doAbortRescan">{{
              $t("Cancel Scan")
            }}</v-list-item-title>
            <v-list-item-title v-show="isScanning && store.doAbortRescan">{{
              $t("Cancelling___")
            }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-divider></v-divider>

        <v-list-item v-bind:to="'/settings'">
          <v-list-item-action>
            <v-icon>mdi-settings</v-icon>
          </v-list-item-action>
          <v-list-item-title>{{ $t("Settings") }}</v-list-item-title>
        </v-list-item>

        <v-divider></v-divider>

        <!-- Movies, Series -->
        <v-list-item
          v-for="appSection in appSections"
          :key="appSection.text"
          v-bind:to="sectionRoute(appSection.id)"
        >
          <v-list-item-action>
            <v-icon>{{ appSection.icon }}</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>{{
              $t(`${appSection.text}`)
            }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <!-- Filters -->
        <div v-show="currentRoute && currentRoute.name === 'medialist'">
          <v-divider></v-divider>

          <v-subheader
            style="margin: 0px !important; font-size: 16px"
            v-on:mouseover="filterHeaderHovered = true"
            v-on:mouseleave="filterHeaderHovered = false"
          >
            {{ $t("Filters") }}
            <v-spacer></v-spacer>
            <v-btn
              v-if="filterHeaderHovered && !editFilters.isEditFilters"
              text
              v-on:click="onResetFilters"
              >{{ $t("RESET") }}</v-btn
            >

            <v-tooltip
              v-if="filterHeaderHovered && !editFilters.isEditFilters"
              bottom
            >
              <template v-slot:activator="{ on }">
                <span v-on="on">
                  <v-btn text v-on:click="onEditFilters"
                    ><v-icon>mdi-pencil</v-icon></v-btn
                  >
                </span>
              </template>
              <span>{{ $t("Edit Filters") }}</span>
            </v-tooltip>

            <v-btn
              v-if="editFilters.isEditFilters"
              text
              color="primary"
              v-on:click="onEditFiltersOK"
              >{{ $t("OK") }}</v-btn
            >
            <v-btn
              v-if="editFilters.isEditFilters"
              text
              v-on:click="onEditFiltersCancel"
              >{{ $t("Cancel") }}</v-btn
            >
          </v-subheader>
          <div
            v-if="!$shared.isLoadingFilter"
            style="height: 3px; width: 100%"
          ></div>
          <v-progress-linear
            v-if="$shared.isLoadingFilter"
            v-model="$shared.loadingFilterProgress"
            color="white accent-0"
            rounded
            height="3"
            style="margin-left: 8px; width: 298px"
          ></v-progress-linear>

          <v-expansion-panels accordion multiple v-model="expandedFilterGroups">
            <draggable
              v-model="$shared.filterGroups"
              group="filters"
              v-on:end="onFilterDragEnd"
              v-bind:disabled="!editFilters.isEditFilters"
            >
              <div
                v-for="filterGroup in $shared.filterGroups"
                v-bind:key="filterGroup.name"
              >
                <!-- FILTER SOURCE PATHS -->
                <v-expansion-panel
                  v-bind:readonly="editFilters.isEditFilters"
                  v-if="filterGroup.name === 'filterSourcePaths'"
                  v-show="editFilters.isEditFilters || filterGroup.visible"
                  style="padding: 0px !important; width: 316px"
                  xxx-v-bind:disabled="
                    $shared.loadingFilter === 'filterSourcePaths'
                  "
                >
                  <v-expansion-panel-header style="padding: 8px !important">
                    <div
                      v-bind:class="{
                        'mk-grab': editFilters.isEditFilters,
                        'mk-dark-grey': !filterGroup.visible,
                      }"
                      style="display: flex; align-items: center"
                    >
                      <span class="mk-filter-icon-container">
                        <v-icon
                          v-show="$shared.loadingFilter !== 'filterSourcePaths'"
                          v-bind:class="{
                            'mk-dark-grey': !filterGroup.visible,
                          }"
                          >mdi-folder-outline</v-icon
                        >
                        <v-progress-circular
                          class="mk-filter-spinner"
                          v-show="$shared.loadingFilter === 'filterSourcePaths'"
                          v-bind:size="16"
                          v-bind:width="3"
                          color="white"
                          indeterminate
                        >
                        </v-progress-circular>
                      </span>
                      {{ $t("Source Paths") }} {{ filterSourcePathsTitle }}
                    </div>
                    <template v-slot:actions>
                      <v-icon v-if="!editFilters.isEditFilters">
                        $expand
                      </v-icon>
                      <v-tooltip
                        bottom
                        v-if="editFilters.isEditFilters"
                        style="z-index: 21"
                      >
                        <template v-slot:activator="{ on }">
                          <span v-on="on">
                            <v-switch
                              v-model="filterGroup.visible"
                              dense
                              style="margin-top: 0px"
                            ></v-switch>
                          </span>
                        </template>
                        <span>{{ $t("Show/Hide this filter") }}</span>
                      </v-tooltip>
                    </template>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <v-row style="margin-bottom: 8px">
                      <v-btn text v-on:click="setAllSourcePaths(false)">{{
                        $t("SET NONE")
                      }}</v-btn>
                      <v-btn text v-on:click="setAllSourcePaths(true)">{{
                        $t("SET ALL")
                      }}</v-btn>
                    </v-row>
                    <v-checkbox
                      v-for="sourcePath in $shared.filters.filterSourcePaths"
                      v-bind:key="sourcePath.Description"
                      v-bind:label="
                        sourcePath.Description +
                        ' (' +
                        sourcePath.NumMovies +
                        ')'
                      "
                      v-model="sourcePath.Selected"
                      v-on:click.native="
                        filtersChanged(
                          $shared.filters.filterSourcePaths,
                          sourcePath,
                          sourcePath.Description,
                          setAllSourcePaths
                        )
                      "
                      style="margin: 0px"
                      color="mk-dark-grey"
                    ></v-checkbox>
                  </v-expansion-panel-content>
                </v-expansion-panel>

                <!-- FILTER VIDEO QUALITIES -->
                <v-expansion-panel
                  v-bind:readonly="editFilters.isEditFilters"
                  v-if="filterGroup.name === 'filterQualities'"
                  v-show="editFilters.isEditFilters || filterGroup.visible"
                  style="padding: 0px !important; width: 316px"
                  xxx-v-bind:disabled="$shared.loadingFilter === 'filterQualities'"
                >
                  <v-expansion-panel-header style="padding: 8px !important">
                    <div
                      v-bind:class="{
                        'mk-grab': editFilters.isEditFilters,
                        'mk-dark-grey': !filterGroup.visible,
                      }"
                      style="display: flex; align-items: center"
                    >
                      <span class="mk-filter-icon-container">
                        <v-icon
                          v-show="$shared.loadingFilter !== 'filterQualities'"
                          v-bind:class="{
                            'mk-dark-grey': !filterGroup.visible,
                          }"
                          >mdi-video-outline</v-icon
                        >
                        <v-progress-circular
                          class="mk-filter-spinner"
                          v-show="$shared.loadingFilter === 'filterQualities'"
                          v-bind:size="16"
                          v-bind:width="3"
                          color="white"
                          indeterminate
                        >
                        </v-progress-circular>
                      </span>
                      {{ $t("Video Quality") }} {{ filterQualitiesTitle }}
                    </div>
                    <template v-slot:actions>
                      <v-icon v-if="!editFilters.isEditFilters">
                        $expand
                      </v-icon>
                      <v-tooltip
                        bottom
                        v-if="editFilters.isEditFilters"
                        style="z-index: 21"
                      >
                        <template v-slot:activator="{ on }">
                          <span v-on="on">
                            <v-switch
                              v-model="filterGroup.visible"
                              dense
                              style="margin-top: 0px"
                            ></v-switch>
                          </span>
                        </template>
                        <span>{{ $t("Show/Hide this filter") }}</span>
                      </v-tooltip>
                    </template>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <v-row style="margin-bottom: 8px">
                      <v-btn text v-on:click="setAllQualities(false)">{{
                        $t("SET NONE")
                      }}</v-btn>
                      <v-btn text v-on:click="setAllQualities(true)">{{
                        $t("SET ALL")
                      }}</v-btn>
                    </v-row>
                    <v-checkbox
                      v-for="quality in $shared.filters.filterQualities"
                      v-bind:key="quality.MI_Quality"
                      v-bind:label="
                        getFilterQualityLabel(
                          quality.MI_Quality,
                          quality.NumMovies
                        )
                      "
                      v-model="quality.Selected"
                      v-on:click.native="filtersChanged"
                      style="margin: 0px"
                      color="mk-dark-grey"
                    ></v-checkbox>
                  </v-expansion-panel-content>
                </v-expansion-panel>

                <!-- FILTER AUDIO LANGUAGES -->
                <v-expansion-panel
                  v-bind:readonly="editFilters.isEditFilters"
                  v-if="filterGroup.name === 'filterAudioLanguages'"
                  v-show="editFilters.isEditFilters || filterGroup.visible"
                  style="padding: 0px !important; width: 316px"
                  xxx-v-bind:disabled="
                    $shared.loadingFilter === 'filterAudioLanguages'
                  "
                >
                  <v-expansion-panel-header style="padding: 8px !important">
                    <div
                      v-bind:class="{
                        'mk-grab': editFilters.isEditFilters,
                        'mk-dark-grey': !filterGroup.visible,
                      }"
                      style="display: flex; align-items: center"
                    >
                      <span class="mk-filter-icon-container">
                        <v-icon
                          v-show="
                            $shared.loadingFilter !== 'filterAudioLanguages'
                          "
                          v-bind:class="{
                            'mk-dark-grey': !filterGroup.visible,
                          }"
                          >mdi-comment-outline</v-icon
                        >
                        <v-progress-circular
                          class="mk-filter-spinner"
                          v-show="
                            $shared.loadingFilter === 'filterAudioLanguages'
                          "
                          v-bind:size="16"
                          v-bind:width="3"
                          color="white"
                          indeterminate
                        >
                        </v-progress-circular>
                      </span>
                      {{ $t("Audio Languages") }}
                      {{ filterAudioLanguagesTitle }}
                    </div>
                    <template v-slot:actions>
                      <v-icon v-if="!editFilters.isEditFilters">
                        $expand
                      </v-icon>
                      <v-tooltip
                        bottom
                        v-if="editFilters.isEditFilters"
                        style="z-index: 21"
                      >
                        <template v-slot:activator="{ on }">
                          <span v-on="on">
                            <v-switch
                              v-model="filterGroup.visible"
                              dense
                              style="margin-top: 0px"
                            ></v-switch>
                          </span>
                        </template>
                        <span>{{ $t("Show/Hide this filter") }}</span>
                      </v-tooltip>
                    </template>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <v-row style="margin-bottom: 8px">
                      <v-btn text v-on:click="setAllAudioLanguages(false)">{{
                        $t("SET NONE")
                      }}</v-btn>
                      <v-btn text v-on:click="setAllAudioLanguages(true)">{{
                        $t("SET ALL")
                      }}</v-btn>
                    </v-row>
                    <v-checkbox
                      v-for="audioLanguage in $shared.filters
                        .filterAudioLanguages"
                      v-bind:key="audioLanguage.Language"
                      v-bind:label="
                        audioLanguage.DisplayText +
                        ' (' +
                        audioLanguage.NumMovies +
                        ')'
                      "
                      v-model="audioLanguage.Selected"
                      v-on:click.native="filtersChanged"
                      style="margin: 0px"
                      color="mk-dark-grey"
                    ></v-checkbox>
                  </v-expansion-panel-content>
                </v-expansion-panel>

                <!-- FILTER SUBTITLE LANGUAGES -->
                <v-expansion-panel
                  v-bind:readonly="editFilters.isEditFilters"
                  v-if="filterGroup.name === 'filterSubtitleLanguages'"
                  v-show="editFilters.isEditFilters || filterGroup.visible"
                  style="padding: 0px !important; width: 316px"
                  xxx-v-bind:disabled="
                    $shared.loadingFilter === 'filterSubtitleLanguages'
                  "
                >
                  <v-expansion-panel-header style="padding: 8px !important">
                    <div
                      v-bind:class="{
                        'mk-grab': editFilters.isEditFilters,
                        'mk-dark-grey': !filterGroup.visible,
                      }"
                      style="display: flex; align-items: center"
                    >
                      <span class="mk-filter-icon-container">
                        <v-icon
                          v-show="
                            $shared.loadingFilter !== 'filterSubtitleLanguages'
                          "
                          v-bind:class="{
                            'mk-dark-grey': !filterGroup.visible,
                          }"
                          >mdi-subtitles-outline</v-icon
                        >
                        <v-progress-circular
                          class="mk-filter-spinner"
                          v-show="
                            $shared.loadingFilter === 'filterSubtitleLanguages'
                          "
                          v-bind:size="16"
                          v-bind:width="3"
                          color="white"
                          indeterminate
                        >
                        </v-progress-circular>
                      </span>
                      {{ $t("Subtitle Languages") }}
                      {{ filterSubtitleLanguagesTitle }}
                    </div>
                    <template v-slot:actions>
                      <v-icon v-if="!editFilters.isEditFilters">
                        $expand
                      </v-icon>
                      <v-tooltip
                        bottom
                        v-if="editFilters.isEditFilters"
                        style="z-index: 21"
                      >
                        <template v-slot:activator="{ on }">
                          <span v-on="on">
                            <v-switch
                              v-model="filterGroup.visible"
                              dense
                              style="margin-top: 0px"
                            ></v-switch>
                          </span>
                        </template>
                        <span>{{ $t("Show/Hide this filter") }}</span>
                      </v-tooltip>
                    </template>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <v-row style="margin-bottom: 8px">
                      <v-btn text v-on:click="setAllSubtitleLanguages(false)">{{
                        $t("SET NONE")
                      }}</v-btn>
                      <v-btn text v-on:click="setAllSubtitleLanguages(true)">{{
                        $t("SET ALL")
                      }}</v-btn>
                    </v-row>
                    <v-checkbox
                      v-for="subtitleLanguage in $shared.filters
                        .filterSubtitleLanguages"
                      v-bind:key="subtitleLanguage.Language"
                      v-bind:label="
                        subtitleLanguage.DisplayText +
                        ' (' +
                        subtitleLanguage.NumMovies +
                        ')'
                      "
                      v-model="subtitleLanguage.Selected"
                      v-on:click.native="filtersChanged"
                      style="margin: 0px"
                      color="mk-dark-grey"
                    ></v-checkbox>
                  </v-expansion-panel-content>
                </v-expansion-panel>

                <!-- FILTER RELEASE ATTRIBUTES -->
                <v-expansion-panel
                  v-bind:readonly="editFilters.isEditFilters"
                  v-if="filterGroup.name === 'filterReleaseAttributes'"
                  v-show="editFilters.isEditFilters || filterGroup.visible"
                  style="padding: 0px !important; width: 316px"
                  xxx-v-bind:disabled="
                    $shared.loadingFilter === 'filterReleaseAttributes'
                  "
                >
                  <v-expansion-panel-header style="padding: 8px !important">
                    <div
                      v-bind:class="{
                        'mk-grab': editFilters.isEditFilters,
                        'mk-dark-grey': !filterGroup.visible,
                      }"
                      style="display: flex; align-items: center"
                    >
                      <span class="mk-filter-icon-container">
                        <v-icon
                          v-show="
                            $shared.loadingFilter !== 'filterReleaseAttributes'
                          "
                          v-bind:class="{
                            'mk-dark-grey': !filterGroup.visible,
                          }"
                          >mdi-package-variant</v-icon
                        >
                        <v-progress-circular
                          class="mk-filter-spinner"
                          v-show="
                            $shared.loadingFilter === 'filterReleaseAttributes'
                          "
                          v-bind:size="16"
                          v-bind:width="3"
                          color="white"
                          indeterminate
                        >
                        </v-progress-circular>
                      </span>
                      {{ $t("Release Attributes") }}
                      {{
                        $shared.filters.filterSettings
                          .filterReleaseAttributesAND
                          ? "߷"
                          : ""
                      }}
                      {{ filterReleaseAttributesTitle }}
                    </div>
                    <template v-slot:actions>
                      <v-icon v-if="!editFilters.isEditFilters">
                        $expand
                      </v-icon>
                      <v-tooltip
                        bottom
                        v-if="editFilters.isEditFilters"
                        style="z-index: 21"
                      >
                        <template v-slot:activator="{ on }">
                          <span v-on="on">
                            <v-switch
                              v-model="filterGroup.visible"
                              dense
                              style="margin-top: 0px"
                            ></v-switch>
                          </span>
                        </template>
                        <span>{{ $t("Show/Hide this filter") }}</span>
                      </v-tooltip>
                    </template>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <v-row style="margin-bottom: 8px">
                      <v-btn text v-on:click="setAllReleaseAttributes(false)">{{
                        $t("SET NONE")
                      }}</v-btn>
                      <v-btn text v-on:click="setAllReleaseAttributes(true)">{{
                        $t("SET ALL")
                      }}</v-btn>
                    </v-row>
                    <v-switch
                      v-bind:label="
                        $shared.filters.filterSettings
                          .filterReleaseAttributesAND
                          ? $t('all selected must apply')
                          : $t('one selected must apply')
                      "
                      color="red"
                      v-model="
                        $shared.filters.filterSettings
                          .filterReleaseAttributesAND
                      "
                      v-on:click.native="filtersChanged"
                    ></v-switch>
                    <v-checkbox
                      v-for="filterReleaseAttribute in filterReleaseAttributes"
                      v-bind:key="filterReleaseAttribute.ReleaseAttribute"
                      v-bind:label="
                        filterReleaseAttribute.ReleaseAttribute +
                        ' (' +
                        filterReleaseAttribute.NumMovies +
                        ')'
                      "
                      v-model="filterReleaseAttribute.Selected"
                      v-on:click.native="filtersChanged"
                      style="margin: 0px"
                      color="mk-dark-grey"
                    ></v-checkbox>
                  </v-expansion-panel-content>
                </v-expansion-panel>

                <!-- FILTER LISTS -->
                <v-expansion-panel
                  v-bind:readonly="editFilters.isEditFilters"
                  v-if="filterGroup.name === 'filterLists'"
                  v-show="editFilters.isEditFilters || filterGroup.visible"
                  style="padding: 0px !important; width: 316px"
                  xxx-v-bind:disabled="$shared.loadingFilter === 'filterLists'"
                >
                  <v-expansion-panel-header style="padding: 8px !important">
                    <div
                      v-bind:class="{
                        'mk-grab': editFilters.isEditFilters,
                        'mk-dark-grey': !filterGroup.visible,
                      }"
                      style="display: flex; align-items: center"
                    >
                      <span class="mk-filter-icon-container">
                        <v-icon
                          v-show="$shared.loadingFilter !== 'filterLists'"
                          v-bind:class="{
                            'mk-dark-grey': !filterGroup.visible,
                          }"
                          >mdi-clipboard-list-outline</v-icon
                        >
                        <v-progress-circular
                          class="mk-filter-spinner"
                          v-show="$shared.loadingFilter === 'filterLists'"
                          v-bind:size="16"
                          v-bind:width="3"
                          color="white"
                          indeterminate
                        >
                        </v-progress-circular>
                      </span>
                      {{ $t("My Lists") }} {{ filterListsTitle }}
                    </div>
                    <template v-slot:actions>
                      <v-icon v-if="!editFilters.isEditFilters">
                        $expand
                      </v-icon>
                      <v-tooltip
                        bottom
                        v-if="editFilters.isEditFilters"
                        style="z-index: 21"
                      >
                        <template v-slot:activator="{ on }">
                          <span v-on="on">
                            <v-switch
                              v-model="filterGroup.visible"
                              dense
                              style="margin-top: 0px"
                            ></v-switch>
                          </span>
                        </template>
                        <span>{{ $t("Show/Hide this filter") }}</span>
                      </v-tooltip>
                    </template>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <v-row style="margin-bottom: 8px">
                      <v-btn text v-on:click="setAllLists(false)">{{
                        $t("SET NONE")
                      }}</v-btn>
                      <v-btn text v-on:click="setAllLists(true)">{{
                        $t("SET ALL")
                      }}</v-btn>
                    </v-row>
                    <v-row
                      v-for="list in $shared.filters.filterLists"
                      v-bind:key="list.id_Lists"
                    >
                      <v-checkbox
                        v-bind:label="list.Name + ' (' + list.NumMovies + ')'"
                        v-model="list.Selected"
                        v-on:click.native="filtersChanged"
                        style="margin: 0px"
                        color="mk-dark-grey"
                      ></v-checkbox>
                      <v-spacer></v-spacer>
                      <v-icon
                        class="mk-clickable-red"
                        v-if="list.id_Lists"
                        style="align-items: flex-start; padding-top: 4px"
                        v-on:click="
                          showDeleteDialog(
                            list,
                            deleteList,
                            'Delete List',
                            'Do you really want to delete the list {name}?',
                            list.Name
                          )
                        "
                        >mdi-delete</v-icon
                      >
                    </v-row>
                  </v-expansion-panel-content>
                </v-expansion-panel>

                <!-- FILTER MY RATINGS -->
                <v-expansion-panel
                  v-bind:readonly="editFilters.isEditFilters"
                  v-if="filterGroup.name === 'filterRatings'"
                  v-show="editFilters.isEditFilters || filterGroup.visible"
                  style="padding: 0px !important; width: 316px"
                  xxx-v-bind:disabled="$shared.loadingFilter === 'filterRatings'"
                >
                  <v-expansion-panel-header style="padding: 8px !important">
                    <div
                      v-bind:class="{
                        'mk-grab': editFilters.isEditFilters,
                        'mk-dark-grey': !filterGroup.visible,
                      }"
                      style="display: flex; align-items: center"
                    >
                      <span class="mk-filter-icon-container">
                        <v-icon
                          v-show="$shared.loadingFilter !== 'filterRatings'"
                          v-bind:class="{
                            'mk-dark-grey': !filterGroup.visible,
                          }"
                          >mdi-star-outline</v-icon
                        >
                        <v-progress-circular
                          class="mk-filter-spinner"
                          v-show="$shared.loadingFilter === 'filterRatings'"
                          v-bind:size="16"
                          v-bind:width="3"
                          color="white"
                          indeterminate
                        >
                        </v-progress-circular>
                      </span>
                      {{ $t("My Ratings") }} {{ filterRatingsTitle }}
                    </div>
                    <template v-slot:actions>
                      <v-icon v-if="!editFilters.isEditFilters">
                        $expand
                      </v-icon>
                      <v-tooltip
                        bottom
                        v-if="editFilters.isEditFilters"
                        style="z-index: 21"
                      >
                        <template v-slot:activator="{ on }">
                          <span v-on="on">
                            <v-switch
                              v-model="filterGroup.visible"
                              dense
                              style="margin-top: 0px"
                            ></v-switch>
                          </span>
                        </template>
                        <span>{{ $t("Show/Hide this filter") }}</span>
                      </v-tooltip>
                    </template>
                  </v-expansion-panel-header>
                  <!--  {{ filterRatingsTitle }} -->
                  <v-expansion-panel-content>
                    <v-row style="margin-bottom: 8px">
                      <v-btn text v-on:click="setAllRatings(false)">{{
                        $t("SET NONE")
                      }}</v-btn>
                      <v-btn text v-on:click="setAllRatings(true)">{{
                        $t("SET ALL")
                      }}</v-btn>
                    </v-row>
                    <v-checkbox
                      v-for="rating in $shared.filters.filterRatings"
                      v-bind:key="rating.Rating"
                      v-bind:label="
                        getFilterRatingLabel(rating.Rating, rating.NumMovies)
                      "
                      v-model="rating.Selected"
                      v-on:click.native="filtersChanged"
                      style="margin: 0px"
                      color="mk-dark-grey"
                    >
                      <v-icon
                        small
                        v-for="i in 5"
                        v-bind:key="i"
                        v-bind:color="
                          rating.Rating > i - 1
                            ? 'amber'
                            : rating.Rating > 0
                            ? 'white'
                            : 'grey'
                        "
                        >mdi-star</v-icon
                      >
                    </v-checkbox>
                  </v-expansion-panel-content>
                </v-expansion-panel>

                <!-- FILTER Metacritic Score -->
                <v-expansion-panel
                  v-bind:readonly="editFilters.isEditFilters"
                  v-if="filterGroup.name === 'filterMetacriticScore'"
                  v-show="editFilters.isEditFilters || filterGroup.visible"
                  style="padding: 0px !important; width: 316px"
                  xxx-v-bind:disabled="
                    $shared.loadingFilter === 'filterMetacriticScore'
                  "
                >
                  <v-expansion-panel-header style="padding: 8px !important">
                    <div
                      v-bind:class="{
                        'mk-grab': editFilters.isEditFilters,
                        'mk-dark-grey': !filterGroup.visible,
                      }"
                      style="display: flex; align-items: center"
                    >
                      <span class="mk-filter-icon-container">
                        <v-icon
                          v-show="
                            $shared.loadingFilter !== 'filterMetacriticScore'
                          "
                          v-bind:class="{
                            'mk-dark-grey': !filterGroup.visible,
                          }"
                          >mdi-numeric-10-box</v-icon
                        >
                        <v-progress-circular
                          class="mk-filter-spinner"
                          v-show="
                            $shared.loadingFilter === 'filterMetacriticScore'
                          "
                          v-bind:size="16"
                          v-bind:width="3"
                          color="white"
                          indeterminate
                        >
                        </v-progress-circular>
                      </span>
                      {{ $t("Metacritic Scores") }}
                      {{ filterMetacriticScoreTitle }}
                    </div>
                    <template v-slot:actions>
                      <v-icon v-if="!editFilters.isEditFilters">
                        $expand
                      </v-icon>
                      <v-tooltip
                        bottom
                        v-if="editFilters.isEditFilters"
                        style="z-index: 21"
                      >
                        <template v-slot:activator="{ on }">
                          <span v-on="on">
                            <v-switch
                              v-model="filterGroup.visible"
                              dense
                              style="margin-top: 0px"
                            ></v-switch>
                          </span>
                        </template>
                        <span>{{ $t("Show/Hide this filter") }}</span>
                      </v-tooltip>
                    </template>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <v-range-slider
                      v-model="$shared.filters.filterMetacriticScore"
                      :max="100"
                      :min="0"
                      hide-details
                      class="align-center"
                      v-on:change="filtersChanged"
                    >
                      <template v-slot:prepend>{{
                        $shared.filters.filterMetacriticScore[0]
                      }}</template>
                      <template v-slot:append>{{
                        $shared.filters.filterMetacriticScore[1]
                      }}</template>
                    </v-range-slider>
                    <v-checkbox
                      v-bind:label="
                        $t('include entries with no Metacritic score')
                      "
                      v-model="$shared.filters.filterMetacriticScoreNone"
                      v-on:click.native="filtersChanged"
                      style="margin: 0px"
                      color="mk-dark-grey"
                    ></v-checkbox>
                  </v-expansion-panel-content>
                </v-expansion-panel>

                <!-- FILTER IMDB Ratings -->
                <v-expansion-panel
                  v-bind:readonly="editFilters.isEditFilters"
                  v-if="filterGroup.name === 'filterIMDBRating'"
                  v-show="editFilters.isEditFilters || filterGroup.visible"
                  style="padding: 0px !important; width: 316px"
                  xxx-v-bind:disabled="
                    $shared.loadingFilter === 'filterIMDBRatings'
                  "
                >
                  <v-expansion-panel-header style="padding: 8px !important">
                    <div
                      v-bind:class="{
                        'mk-grab': editFilters.isEditFilters,
                        'mk-dark-grey': !filterGroup.visible,
                      }"
                      style="display: flex; align-items: center"
                    >
                      <span class="mk-filter-icon-container">
                        <v-icon
                          v-show="$shared.loadingFilter !== 'filterIMDBRatings'"
                          v-bind:class="{
                            'mk-dark-grey': !filterGroup.visible,
                          }"
                          >mdi-surround-sound-7-1</v-icon
                        >
                        <v-progress-circular
                          class="mk-filter-spinner"
                          v-show="$shared.loadingFilter === 'filterIMDBRatings'"
                          v-bind:size="16"
                          v-bind:width="3"
                          color="white"
                          indeterminate
                        >
                        </v-progress-circular>
                      </span>
                      {{ $t("IMDB Ratings") }} {{ filterIMDBRatingTitle }}
                    </div>
                    <template v-slot:actions>
                      <v-icon v-if="!editFilters.isEditFilters">
                        $expand
                      </v-icon>
                      <v-tooltip
                        bottom
                        v-if="editFilters.isEditFilters"
                        style="z-index: 21"
                      >
                        <template v-slot:activator="{ on }">
                          <span v-on="on">
                            <v-switch
                              v-model="filterGroup.visible"
                              dense
                              style="margin-top: 0px"
                            ></v-switch>
                          </span>
                        </template>
                        <span>{{ $t("Show/Hide this filter") }}</span>
                      </v-tooltip>
                    </template>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <v-range-slider
                      v-model="$shared.filters.filterIMDBRating"
                      :max="10"
                      :min="0"
                      hide-details
                      class="align-center"
                      v-on:change="filtersChanged"
                    >
                      <template v-slot:prepend>{{
                        $shared.filters.filterIMDBRating[0]
                      }}</template>
                      <template v-slot:append>{{
                        $shared.filters.filterIMDBRating[1]
                      }}</template>
                    </v-range-slider>
                    <v-checkbox
                      v-bind:label="$t('include entries with no IMDB rating')"
                      v-model="$shared.filters.filterIMDBRatingNone"
                      v-on:click.native="filtersChanged"
                      style="margin: 0px"
                      color="mk-dark-grey"
                    ></v-checkbox>
                  </v-expansion-panel-content>
                </v-expansion-panel>

                <!-- FILTER GENRES -->
                <v-expansion-panel
                  v-bind:readonly="editFilters.isEditFilters"
                  v-if="filterGroup.name === 'filterGenres'"
                  v-show="editFilters.isEditFilters || filterGroup.visible"
                  style="padding: 0px !important; width: 316px"
                  xxx-v-bind:disabled="$shared.loadingFilter === 'filterGenres'"
                >
                  <v-expansion-panel-header style="padding: 8px !important">
                    <div
                      v-bind:class="{
                        'mk-grab': editFilters.isEditFilters,
                        'mk-dark-grey': !filterGroup.visible,
                      }"
                      style="display: flex; align-items: center"
                    >
                      <span class="mk-filter-icon-container">
                        <v-icon
                          v-show="$shared.loadingFilter !== 'filterGenres'"
                          v-bind:class="{
                            'mk-dark-grey': !filterGroup.visible,
                          }"
                          >mdi-drama-masks</v-icon
                        >
                        <v-progress-circular
                          class="mk-filter-spinner"
                          v-show="$shared.loadingFilter === 'filterGenres'"
                          v-bind:size="16"
                          v-bind:width="3"
                          color="white"
                          indeterminate
                        >
                        </v-progress-circular>
                      </span>
                      {{ $t("Genres") }}
                      {{
                        $shared.filters.filterSettings.filterGenresAND
                          ? "߷"
                          : ""
                      }}
                      {{ filterGenresTitle }}
                    </div>
                    <template v-slot:actions>
                      <v-icon v-if="!editFilters.isEditFilters">
                        $expand
                      </v-icon>
                      <v-tooltip
                        bottom
                        v-if="editFilters.isEditFilters"
                        style="z-index: 21"
                      >
                        <template v-slot:activator="{ on }">
                          <span v-on="on">
                            <v-switch
                              v-model="filterGroup.visible"
                              dense
                              style="margin-top: 0px"
                            ></v-switch>
                          </span>
                        </template>
                        <span>{{ $t("Show/Hide this filter") }}</span>
                      </v-tooltip>
                    </template>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <v-row style="margin-bottom: 8px">
                      <v-btn text v-on:click="setAllGenres(false)">{{
                        $t("SET NONE")
                      }}</v-btn>
                      <v-btn text v-on:click="setAllGenres(true)">{{
                        $t("SET ALL")
                      }}</v-btn>
                    </v-row>
                    <v-switch
                      v-bind:label="
                        $shared.filters.filterSettings.filterGenresAND
                          ? $t('all selected must apply')
                          : $t('one selected must apply')
                      "
                      color="red"
                      v-model="$shared.filters.filterSettings.filterGenresAND"
                      v-on:click.native="filtersChanged"
                    ></v-switch>
                    <v-checkbox
                      v-for="genre in $shared.filters.filterGenres"
                      v-bind:key="genre.id_Genres"
                      v-bind:label="genre.Name + ' (' + genre.NumMovies + ')'"
                      v-model="genre.Selected"
                      v-on:click.native="filtersChanged"
                      style="margin: 0px"
                      color="mk-dark-grey"
                    ></v-checkbox>
                  </v-expansion-panel-content>
                </v-expansion-panel>

                <!-- FILTER AGE RATINGS -->
                <v-expansion-panel
                  v-bind:readonly="editFilters.isEditFilters"
                  v-if="filterGroup.name === 'filterAgeRatings'"
                  v-show="editFilters.isEditFilters || filterGroup.visible"
                  style="padding: 0px !important; width: 316px"
                  xxx-v-bind:disabled="$shared.loadingFilter === 'filterAgeRatings'"
                >
                  <v-expansion-panel-header style="padding: 8px !important">
                    <div
                      v-bind:class="{
                        'mk-grab': editFilters.isEditFilters,
                        'mk-dark-grey': !filterGroup.visible,
                      }"
                      style="display: flex; align-items: center"
                    >
                      <span class="mk-filter-icon-container">
                        <v-icon
                          v-show="$shared.loadingFilter !== 'filterAgeRatings'"
                          v-bind:class="{
                            'mk-dark-grey': !filterGroup.visible,
                          }"
                          >mdi-human-female-boy</v-icon
                        >
                        <v-progress-circular
                          class="mk-filter-spinner"
                          v-show="$shared.loadingFilter === 'filterAgeRatings'"
                          v-bind:size="16"
                          v-bind:width="3"
                          color="white"
                          indeterminate
                        >
                        </v-progress-circular>
                      </span>
                      {{ $t("Age Ratings") }} {{ filterAgeRatingsTitle }}
                    </div>
                    <template v-slot:actions>
                      <v-icon v-if="!editFilters.isEditFilters">
                        $expand
                      </v-icon>
                      <v-tooltip
                        bottom
                        v-if="editFilters.isEditFilters"
                        style="z-index: 21"
                      >
                        <template v-slot:activator="{ on }">
                          <span v-on="on">
                            <v-switch
                              v-model="filterGroup.visible"
                              dense
                              style="margin-top: 0px"
                            ></v-switch>
                          </span>
                        </template>
                        <span>{{ $t("Show/Hide this filter") }}</span>
                      </v-tooltip>
                    </template>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <v-row style="margin-bottom: 8px">
                      <v-btn text v-on:click="setAllAgeRatings(false)">{{
                        $t("SET NONE")
                      }}</v-btn>
                      <v-btn text v-on:click="setAllAgeRatings(true)">{{
                        $t("SET ALL")
                      }}</v-btn>
                    </v-row>
                    <v-checkbox
                      v-for="ageRating in $shared.filters.filterAgeRatings"
                      v-bind:key="ageRating.Age"
                      v-bind:label="
                        (ageRating.Age === -1
                          ? `<${$t('undetermined')}>`
                          : ageRating.Age) +
                        ' (' +
                        ageRating.NumMovies +
                        ')'
                      "
                      v-model="ageRating.Selected"
                      v-on:click.native="filtersChanged"
                      style="margin: 0px"
                      color="mk-dark-grey"
                    ></v-checkbox>
                  </v-expansion-panel-content>
                </v-expansion-panel>

                <!-- FILTER GROUP: CONTENT ADVISORY -->
                <v-expansion-panel
                  v-bind:readonly="editFilters.isEditFilters"
                  v-if="filterGroup.name === 'filterParentalAdvisory'"
                  v-show="editFilters.isEditFilters || filterGroup.visible"
                  style="padding: 0px !important; width: 316px"
                  xxx-v-bind:disabled="
                    $shared.loadingFilter === 'filterParentalAdvisory'
                  "
                >
                  <v-expansion-panel-header style="padding: 8px !important">
                    <div
                      v-bind:class="{
                        'mk-grab': editFilters.isEditFilters,
                        'mk-dark-grey': !filterGroup.visible,
                      }"
                      style="display: flex; align-items: center"
                    >
                      <span class="mk-filter-icon-container">
                        <v-icon
                          v-show="
                            $shared.loadingFilter !== 'filterParentalAdvisory'
                          "
                          v-bind:class="{
                            'mk-dark-grey': !filterGroup.visible,
                          }"
                          >mdi-movie-filter-outline</v-icon
                        >
                        <v-progress-circular
                          class="mk-filter-spinner"
                          v-show="
                            $shared.loadingFilter === 'filterParentalAdvisory'
                          "
                          v-bind:size="16"
                          v-bind:width="3"
                          color="white"
                          indeterminate
                        >
                        </v-progress-circular>
                      </span>
                      {{ $t("Content Advisories") }}
                      {{ filterContentAdvisoryTitle }}
                    </div>
                    <template v-slot:actions>
                      <v-icon v-if="!editFilters.isEditFilters">
                        $expand
                      </v-icon>
                      <v-tooltip
                        bottom
                        v-if="editFilters.isEditFilters"
                        style="z-index: 21"
                      >
                        <template v-slot:activator="{ on }">
                          <span v-on="on">
                            <v-switch
                              v-model="filterGroup.visible"
                              dense
                              style="margin-top: 0px"
                            ></v-switch>
                          </span>
                        </template>
                        <span>{{ $t("Show/Hide this filter") }}</span>
                      </v-tooltip>
                    </template>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <v-expansion-panels accordion multiple>
                      <v-expansion-panel
                        v-for="category in filterParentalAdvisoryCategories"
                        v-bind:key="category.Name"
                        v-show="
                          $shared.filters.filterParentalAdvisory[
                            category.Name
                          ] &&
                          $shared.filters.filterParentalAdvisory[category.Name]
                            .length > 0
                        "
                        style="padding: 0px !important; width: 316px"
                      >
                        <v-expansion-panel-header
                          style="padding: 8px !important"
                          >{{
                            $t(`ParentalAdvisoryCategories.${category.Name}`)
                          }}
                          {{
                            filterParentalAdvisoryCategoryTitle(category)
                          }}</v-expansion-panel-header
                        >
                        <v-expansion-panel-content>
                          <v-row style="margin-bottom: 8px">
                            <v-btn
                              text
                              v-on:click="
                                setAllParentalAdvisory(category, false)
                              "
                              >{{ $t("SET NONE") }}</v-btn
                            >
                            <v-btn
                              text
                              v-on:click="
                                setAllParentalAdvisory(category, true)
                              "
                              >{{ $t("SET ALL") }}</v-btn
                            >
                          </v-row>
                          <v-row
                            v-for="paItem in $shared.filters
                              .filterParentalAdvisory[category.Name]"
                            v-bind:key="paItem.Severity"
                          >
                            <v-checkbox
                              v-bind:label="
                                $t(`${paItem.DisplayText}`) +
                                ' (' +
                                paItem.NumMovies +
                                ')'
                              "
                              v-model="paItem.Selected"
                              v-on:click.native="filtersChanged"
                              style="margin: 0px"
                              color="mk-dark-grey"
                            ></v-checkbox>
                          </v-row>
                        </v-expansion-panel-content>
                      </v-expansion-panel>
                    </v-expansion-panels>
                  </v-expansion-panel-content>
                </v-expansion-panel>

                <!-- FILTER People -->
                <v-expansion-panel
                  v-bind:readonly="editFilters.isEditFilters"
                  v-if="filterGroup.name === 'filterPersons'"
                  v-show="editFilters.isEditFilters || filterGroup.visible"
                  style="padding: 0px !important; width: 316px"
                  xxx-v-bind:disabled="$shared.loadingFilter === 'filterPersons'"
                >
                  <v-expansion-panel-header style="padding: 8px !important">
                    <div
                      v-bind:class="{
                        'mk-grab': editFilters.isEditFilters,
                        'mk-dark-grey': !filterGroup.visible,
                      }"
                      style="display: flex; align-items: center"
                    >
                      <span class="mk-filter-icon-container">
                        <v-icon
                          v-show="$shared.loadingFilter !== 'filterPersons'"
                          v-bind:class="{
                            'mk-dark-grey': !filterGroup.visible,
                          }"
                          >mdi-human-male-male</v-icon
                        >
                        <v-progress-circular
                          class="mk-filter-spinner"
                          v-show="$shared.loadingFilter === 'filterPersons'"
                          v-bind:size="16"
                          v-bind:width="3"
                          color="white"
                          indeterminate
                        >
                        </v-progress-circular>
                      </span>
                      {{ $t("People") }}
                      {{
                        $shared.filters.filterSettings.filterPersonsAND
                          ? "߷"
                          : ""
                      }}
                      {{ filterPersonsTitle }}
                    </div>
                    <template v-slot:actions>
                      <v-icon v-if="!editFilters.isEditFilters">
                        $expand
                      </v-icon>
                      <v-tooltip
                        bottom
                        v-if="editFilters.isEditFilters"
                        style="z-index: 21"
                      >
                        <template v-slot:activator="{ on }">
                          <span v-on="on">
                            <v-switch
                              v-model="filterGroup.visible"
                              dense
                              style="margin-top: 0px"
                            ></v-switch>
                          </span>
                        </template>
                        <span>{{ $t("Show/Hide this filter") }}</span>
                      </v-tooltip>
                    </template>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <v-row style="margin-bottom: 8px">
                      <v-btn text v-on:click="setAllPersons(false)">{{
                        $t("SET NONE")
                      }}</v-btn>
                      <v-btn text v-on:click="setAllPersons(true)">{{
                        $t("SET ALL")
                      }}</v-btn>
                      <v-btn text v-on:click="addPerson()">{{
                        $t("FIND")
                      }}</v-btn>
                    </v-row>
                    <v-switch
                      v-bind:label="
                        $shared.filters.filterSettings.filterPersonsAND
                          ? $t('all selected must apply')
                          : $t('one selected must apply')
                      "
                      color="red"
                      v-model="$shared.filters.filterSettings.filterPersonsAND"
                      v-on:click.native="filtersChanged"
                      style="margin-bottom: 8px; margin-left: -10px"
                    ></v-switch>
                    <v-row
                      v-for="person in filterPersons"
                      v-bind:key="person.IMDB_Person_ID"
                    >
                      <v-checkbox
                        v-bind:label="
                          person.Person_Name + ' (' + person.NumMovies + ')'
                        "
                        v-model="person.Selected"
                        v-on:click.native="filtersChanged"
                        style="margin: 0px"
                        color="mk-dark-grey"
                      ></v-checkbox>
                      <v-spacer></v-spacer>
                      <v-icon
                        class="mk-clickable-red"
                        style="align-items: flex-start; padding-top: 4px"
                        v-if="person.id_Filter_Persons"
                        v-on:click="
                          showDeleteDialog(
                            person,
                            deletePerson,
                            'Remove Person',
                            'Do you really want to remove {name} from the filter list?',
                            person.Person_Name
                          )
                        "
                        >mdi-delete</v-icon
                      >
                    </v-row>
                  </v-expansion-panel-content>
                </v-expansion-panel>

                <!-- FILTER Companies -->
                <v-expansion-panel
                  v-bind:readonly="editFilters.isEditFilters"
                  v-if="filterGroup.name === 'filterCompanies'"
                  v-show="editFilters.isEditFilters || filterGroup.visible"
                  style="padding: 0px !important; width: 316px"
                  xxx-v-bind:disabled="$shared.loadingFilter === 'filterCompanies'"
                >
                  <v-expansion-panel-header style="padding: 8px !important">
                    <div
                      v-bind:class="{
                        'mk-grab': editFilters.isEditFilters,
                        'mk-dark-grey': !filterGroup.visible,
                      }"
                      style="display: flex; align-items: center"
                    >
                      <span class="mk-filter-icon-container">
                        <v-icon
                          v-show="$shared.loadingFilter !== 'filterCompanies'"
                          v-bind:class="{
                            'mk-dark-grey': !filterGroup.visible,
                          }"
                          >mdi-factory</v-icon
                        >
                        <v-progress-circular
                          class="mk-filter-spinner"
                          v-show="$shared.loadingFilter === 'filterCompanies'"
                          v-bind:size="16"
                          v-bind:width="3"
                          color="white"
                          indeterminate
                        >
                        </v-progress-circular>
                      </span>
                      {{ $t("Companies") }}
                      {{
                        $shared.filters.filterSettings.filterCompaniesAND
                          ? "߷"
                          : ""
                      }}
                      {{ filterCompaniesTitle }}
                    </div>
                    <template v-slot:actions>
                      <v-icon v-if="!editFilters.isEditFilters">
                        $expand
                      </v-icon>
                      <v-tooltip
                        bottom
                        v-if="editFilters.isEditFilters"
                        style="z-index: 21"
                      >
                        <template v-slot:activator="{ on }">
                          <span v-on="on">
                            <v-switch
                              v-model="filterGroup.visible"
                              dense
                              style="margin-top: 0px"
                            ></v-switch>
                          </span>
                        </template>
                        <span>{{ $t("Show/Hide this filter") }}</span>
                      </v-tooltip>
                    </template>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <v-row style="margin-bottom: 8px">
                      <v-btn text v-on:click="setAllCompanies(false)">{{
                        $t("SET NONE")
                      }}</v-btn>
                      <v-btn text v-on:click="setAllCompanies(true)">{{
                        $t("SET ALL")
                      }}</v-btn>
                      <v-btn text v-on:click="addCompany()">{{
                        $t("FIND")
                      }}</v-btn>
                    </v-row>
                    <v-switch
                      v-bind:label="
                        $shared.filters.filterSettings.filterCompaniesAND
                          ? $t('all selected must apply')
                          : $t('one selected must apply')
                      "
                      color="red"
                      v-model="
                        $shared.filters.filterSettings.filterCompaniesAND
                      "
                      v-on:click.native="filtersChanged"
                      style="margin-bottom: 8px; margin-left: -10px"
                    ></v-switch>
                    <v-row
                      v-for="company in filterCompanies"
                      v-bind:key="company.Company_Name"
                    >
                      <v-checkbox
                        v-bind:label="
                          company.Company_Name + ' (' + company.NumMovies + ')'
                        "
                        v-model="company.Selected"
                        v-on:click.native="filtersChanged"
                        style="margin: 0px"
                        color="mk-dark-grey"
                      ></v-checkbox>
                      <v-spacer></v-spacer>
                      <v-icon
                        class="mk-clickable-red"
                        style="align-items: flex-start; padding-top: 4px"
                        v-if="company.id_Filter_Companies"
                        v-on:click="
                          showDeleteDialog(
                            company,
                            deleteCompany,
                            'Remove Company',
                            'Do you really want to remove {name} from the filter list?',
                            company.Company_Name
                          )
                        "
                        >mdi-delete</v-icon
                      >
                    </v-row>
                  </v-expansion-panel-content>
                </v-expansion-panel>

                <!-- FILTER RELEASE YEARS -->
                <v-expansion-panel
                  v-bind:readonly="editFilters.isEditFilters"
                  v-if="filterGroup.name === 'filterYears'"
                  v-show="editFilters.isEditFilters || filterGroup.visible"
                  style="padding: 0px !important; width: 316px"
                  xxx-v-bind:disabled="$shared.loadingFilter === 'filterYears'"
                >
                  <v-expansion-panel-header style="padding: 8px !important">
                    <div
                      v-bind:class="{
                        'mk-grab': editFilters.isEditFilters,
                        'mk-dark-grey': !filterGroup.visible,
                      }"
                      style="display: flex; align-items: center"
                    >
                      <span class="mk-filter-icon-container">
                        <v-icon
                          v-show="$shared.loadingFilter !== 'filterYears'"
                          v-bind:class="{
                            'mk-dark-grey': !filterGroup.visible,
                          }"
                          >mdi-calendar-month-outline</v-icon
                        >
                        <v-progress-circular
                          class="mk-filter-spinner"
                          v-show="$shared.loadingFilter === 'filterYears'"
                          v-bind:size="16"
                          v-bind:width="3"
                          color="white"
                          indeterminate
                        >
                        </v-progress-circular>
                      </span>
                      {{ $t("Release Years") }} {{ filterYearsTitle }}
                    </div>
                    <template v-slot:actions>
                      <v-icon v-if="!editFilters.isEditFilters">
                        $expand
                      </v-icon>
                      <v-tooltip
                        bottom
                        v-if="editFilters.isEditFilters"
                        style="z-index: 21"
                      >
                        <template v-slot:activator="{ on }">
                          <span v-on="on">
                            <v-switch
                              v-model="filterGroup.visible"
                              dense
                              style="margin-top: 0px"
                            ></v-switch>
                          </span>
                        </template>
                        <span>{{ $t("Show/Hide this filter") }}</span>
                      </v-tooltip>
                    </template>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <v-row style="margin-bottom: 8px">
                      <v-btn text v-on:click="setAllYears(false)">{{
                        $t("SET NONE")
                      }}</v-btn>
                      <v-btn text v-on:click="setAllYears(true)">{{
                        $t("SET ALL")
                      }}</v-btn>
                      <v-btn text v-on:click="showYearsRangeInput">{{
                        $t("SET RANGE")
                      }}</v-btn>
                    </v-row>
                    <div v-if="yearsRangeInput.show">
                      <v-row v-if="yearsRangeInput.show">
                        <v-range-slider
                          v-model="yearsRangeInput.range"
                          :max="yearsRangeInput.max"
                          :min="yearsRangeInput.min"
                          hide-details
                          class="align-center"
                        >
                          <template v-slot:prepend>{{
                            yearsRangeInput.range[0]
                          }}</template>
                          <template v-slot:append>{{
                            yearsRangeInput.range[1]
                          }}</template>
                        </v-range-slider>
                      </v-row>
                      <v-row>
                        <v-spacer></v-spacer>
                        <v-btn text v-on:click="onYearsRangeInputCancel">{{
                          $t("Cancel")
                        }}</v-btn>
                        <v-btn text v-on:click="onYearsRangeInputOK">{{
                          $t("OK")
                        }}</v-btn>
                      </v-row>
                    </div>

                    <v-checkbox
                      v-for="year in $shared.filters.filterYears"
                      v-bind:key="year.startYear"
                      v-bind:label="
                        getFilterYearLabel(year.startYear, year.NumMovies)
                      "
                      v-model="year.Selected"
                      v-on:click.native="filtersChanged"
                      style="margin: 0px"
                      color="mk-dark-grey"
                    ></v-checkbox>
                  </v-expansion-panel-content>
                </v-expansion-panel>

                <!-- FILTER IMDB Plot Keywords -->
                <v-expansion-panel
                  v-bind:readonly="editFilters.isEditFilters"
                  v-if="filterGroup.name === 'filterIMDBPlotKeywords'"
                  v-show="editFilters.isEditFilters || filterGroup.visible"
                  style="padding: 0px !important; width: 316px"
                  xxx-v-bind:disabled="
                    $shared.loadingFilter === 'filterIMDBPlotKeywords'
                  "
                >
                  <v-expansion-panel-header style="padding: 8px !important">
                    <div
                      v-bind:class="{
                        'mk-grab': editFilters.isEditFilters,
                        'mk-dark-grey': !filterGroup.visible,
                      }"
                      style="display: flex; align-items: center"
                    >
                      <span class="mk-filter-icon-container">
                        <v-icon
                          v-show="
                            $shared.loadingFilter !== 'filterIMDBPlotKeywords'
                          "
                          v-bind:class="{
                            'mk-dark-grey': !filterGroup.visible,
                          }"
                          >mdi-book-open-outline</v-icon
                        >
                        <v-progress-circular
                          class="mk-filter-spinner"
                          v-show="
                            $shared.loadingFilter === 'filterIMDBPlotKeywords'
                          "
                          v-bind:size="16"
                          v-bind:width="3"
                          color="white"
                          indeterminate
                        >
                        </v-progress-circular>
                      </span>
                      {{ $t("Plot Keywords") }}
                      {{
                        $shared.filters.filterSettings.filterIMDBPlotKeywordsAND
                          ? "߷"
                          : ""
                      }}
                      {{ filterIMDBPlotKeywordsTitle }}
                    </div>
                    <template v-slot:actions>
                      <v-icon v-if="!editFilters.isEditFilters">
                        $expand
                      </v-icon>
                      <v-tooltip
                        bottom
                        v-if="editFilters.isEditFilters"
                        style="z-index: 21"
                      >
                        <template v-slot:activator="{ on }">
                          <span v-on="on">
                            <v-switch
                              v-model="filterGroup.visible"
                              dense
                              style="margin-top: 0px"
                            ></v-switch>
                          </span>
                        </template>
                        <span>{{ $t("Show/Hide this filter") }}</span>
                      </v-tooltip>
                    </template>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <v-row>
                      <v-btn text v-on:click="setAllIMDBPlotKeywords(false)">{{
                        $t("SET NONE")
                      }}</v-btn>
                      <v-btn text v-on:click="setAllIMDBPlotKeywords(true)">{{
                        $t("SET ALL")
                      }}</v-btn>
                      <v-btn text v-on:click="addIMDBPlotKeyword()">{{
                        $t("FIND")
                      }}</v-btn>
                    </v-row>
                    <v-switch
                      v-bind:label="
                        $shared.filters.filterSettings.filterIMDBPlotKeywordsAND
                          ? $t('all selected must apply')
                          : $t('one selected must apply')
                      "
                      color="red"
                      v-model="
                        $shared.filters.filterSettings.filterIMDBPlotKeywordsAND
                      "
                      v-on:click.native="filtersChanged"
                      style="margin-bottom: 8px; margin-left: -10px"
                    ></v-switch>
                    <v-row
                      v-for="plotKeyword in filterIMDBPlotKeywords"
                      v-bind:key="plotKeyword.id_Filter_IMDB_Plot_Keywords"
                    >
                      <v-checkbox
                        v-bind:label="
                          plotKeyword.Keyword +
                          ' (' +
                          plotKeyword.NumMovies +
                          ')'
                        "
                        v-model="plotKeyword.Selected"
                        v-on:click.native="filtersChanged"
                        style="margin: 0px"
                        color="mk-dark-grey"
                      ></v-checkbox>
                      <v-spacer></v-spacer>
                      <v-icon
                        class="mk-clickable-red"
                        style="align-items: flex-start; padding-top: 4px"
                        v-if="plotKeyword.id_Filter_IMDB_Plot_Keywords"
                        v-on:click="
                          showDeleteDialog(
                            plotKeyword,
                            deleteFilterIMDBPlotKeyword,
                            'Remove Plot Keyword',
                            'Do you really want to remove {name} from the filter list?',
                            plotKeyword.Keyword
                          )
                        "
                        >mdi-delete</v-icon
                      >
                    </v-row>
                  </v-expansion-panel-content>
                </v-expansion-panel>

                <!-- FILTER IMDB Filming Locations -->
                <v-expansion-panel
                  v-bind:readonly="editFilters.isEditFilters"
                  v-if="filterGroup.name === 'filterIMDBFilmingLocations'"
                  v-show="editFilters.isEditFilters || filterGroup.visible"
                  style="padding: 0px !important; width: 316px"
                  xxx-v-bind:disabled="
                    $shared.loadingFilter === 'filterIMDBFilmingLocations'
                  "
                >
                  <v-expansion-panel-header style="padding: 8px !important">
                    <div
                      v-bind:class="{
                        'mk-grab': editFilters.isEditFilters,
                        'mk-dark-grey': !filterGroup.visible,
                      }"
                      style="display: flex; align-items: center"
                    >
                      <span class="mk-filter-icon-container">
                        <v-icon
                          v-show="
                            $shared.loadingFilter !==
                            'filterIMDBFilmingLocations'
                          "
                          v-bind:class="{
                            'mk-dark-grey': !filterGroup.visible,
                          }"
                          >mdi-map-marker-outline</v-icon
                        >
                        <v-progress-circular
                          class="mk-filter-spinner"
                          v-show="
                            $shared.loadingFilter ===
                            'filterIMDBFilmingLocations'
                          "
                          v-bind:size="16"
                          v-bind:width="3"
                          color="white"
                          indeterminate
                        >
                        </v-progress-circular>
                      </span>
                      {{ $t("Filming Locations") }}
                      {{
                        $shared.filters.filterSettings
                          .filterIMDBFilmingLocationsAND
                          ? "߷"
                          : ""
                      }}
                      {{ filterIMDBFilmingLocationsTitle }}
                    </div>
                    <template v-slot:actions>
                      <v-icon v-if="!editFilters.isEditFilters">
                        $expand
                      </v-icon>
                      <v-tooltip
                        bottom
                        v-if="editFilters.isEditFilters"
                        style="z-index: 21"
                      >
                        <template v-slot:activator="{ on }">
                          <span v-on="on">
                            <v-switch
                              v-model="filterGroup.visible"
                              dense
                              style="margin-top: 0px"
                            ></v-switch>
                          </span>
                        </template>
                        <span>{{ $t("Show/Hide this filter") }}</span>
                      </v-tooltip>
                    </template>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <v-row>
                      <v-btn
                        text
                        v-on:click="setAllIMDBFilmingLocations(false)"
                        >{{ $t("SET NONE") }}</v-btn
                      >
                      <v-btn
                        text
                        v-on:click="setAllIMDBFilmingLocations(true)"
                        >{{ $t("SET ALL") }}</v-btn
                      >
                      <v-btn text v-on:click="addIMDBFilmingLocation()">{{
                        $t("FIND")
                      }}</v-btn>
                    </v-row>
                    <v-switch
                      v-bind:label="
                        $shared.filters.filterSettings
                          .filterIMDBFilmingLocationsAND
                          ? $t('all selected must apply')
                          : $t('one selected must apply')
                      "
                      color="red"
                      v-model="
                        $shared.filters.filterSettings
                          .filterIMDBFilmingLocationsAND
                      "
                      v-on:click.native="filtersChanged"
                      style="margin-bottom: 8px; margin-left: -10px"
                    ></v-switch>
                    <v-row
                      v-for="filmingLocation in filterIMDBFilmingLocations"
                      v-bind:key="
                        filmingLocation.id_Filter_IMDB_Filming_Locations
                      "
                    >
                      <v-checkbox
                        v-bind:label="
                          filmingLocation.Location +
                          ' (' +
                          filmingLocation.NumMovies +
                          ')'
                        "
                        v-model="filmingLocation.Selected"
                        v-on:click.native="filtersChanged"
                        style="margin: 0px"
                        color="mk-dark-grey"
                      ></v-checkbox>
                      <v-spacer></v-spacer>
                      <v-icon
                        class="mk-clickable-red"
                        style="align-items: flex-start; padding-top: 4px"
                        v-if="filmingLocation.id_Filter_IMDB_Filming_Locations"
                        v-on:click="
                          showDeleteDialog(
                            filmingLocation,
                            deleteFilterIMDBFilmingLocation,
                            'Remove Filming Location',
                            'Do you really want to remove {name} from the filter list?',
                            filmingLocation.Location
                          )
                        "
                        >mdi-delete</v-icon
                      >
                    </v-row>
                  </v-expansion-panel-content>
                </v-expansion-panel>

                <!-- FILTER DATA QUALITY -->
                <v-expansion-panel
                  v-bind:readonly="editFilters.isEditFilters"
                  v-if="filterGroup.name === 'filterDataQuality'"
                  v-show="editFilters.isEditFilters || filterGroup.visible"
                  style="padding: 0px !important; width: 316px"
                  xxx-v-bind:disabled="
                    $shared.loadingFilter === 'filterDataQuality'
                  "
                >
                  <v-expansion-panel-header style="padding: 8px !important">
                    <div
                      v-bind:class="{
                        'mk-grab': editFilters.isEditFilters,
                        'mk-dark-grey': !filterGroup.visible,
                      }"
                      style="display: flex; align-items: center"
                    >
                      <span class="mk-filter-icon-container">
                        <v-icon
                          v-show="$shared.loadingFilter !== 'filterDataQuality'"
                          v-bind:class="{
                            'mk-dark-grey': !filterGroup.visible,
                          }"
                          >mdi-check-box-outline</v-icon
                        >
                        <v-progress-circular
                          class="mk-filter-spinner"
                          v-show="$shared.loadingFilter === 'filterDataQuality'"
                          v-bind:size="16"
                          v-bind:width="3"
                          color="white"
                          indeterminate
                        >
                        </v-progress-circular>
                      </span>
                      {{ $t("Data Quality") }}
                      {{
                        $shared.filters.filterSettings.filterDataQualityAND
                          ? "߷"
                          : ""
                      }}
                      {{ filterDataQualityTitle }}
                    </div>
                    <template v-slot:actions>
                      <v-icon v-if="!editFilters.isEditFilters">
                        $expand
                      </v-icon>
                      <v-tooltip
                        bottom
                        v-if="editFilters.isEditFilters"
                        style="z-index: 21"
                      >
                        <template v-slot:activator="{ on }">
                          <span v-on="on">
                            <v-switch
                              v-model="filterGroup.visible"
                              dense
                              style="margin-top: 0px"
                            ></v-switch>
                          </span>
                        </template>
                        <span>{{ $t("Show/Hide this filter") }}</span>
                      </v-tooltip>
                    </template>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <v-row>
                      <v-btn text v-on:click="setAllDataQuality(false)">{{
                        $t("SET NONE")
                      }}</v-btn>
                      <v-btn text v-on:click="setAllDataQuality(true)">{{
                        $t("SET ALL")
                      }}</v-btn>
                    </v-row>
                    <v-switch
                      v-bind:label="
                        $shared.filters.filterSettings.filterDataQualityAND
                          ? $t('all selected must apply')
                          : $t('one selected must apply')
                      "
                      color="red"
                      v-model="
                        $shared.filters.filterSettings.filterDataQualityAND
                      "
                      v-on:click.native="filtersChanged"
                      style="margin-bottom: 8px; margin-left: -10px"
                    ></v-switch>
                    <v-row
                      v-for="dataQuality in $shared.filters.filterDataQuality"
                      v-bind:key="dataQuality.Name"
                    >
                      <v-checkbox
                        v-bind:key="dataQuality.Name"
                        v-bind:label="
                          $t(dataQuality.DisplayText) +
                          ' (' +
                          dataQuality.NumMovies +
                          ')'
                        "
                        v-model="dataQuality.Selected"
                        v-on:click.native="filtersChanged"
                        style="margin: 0px"
                        color="mk-dark-grey"
                      ></v-checkbox>
                    </v-row>
                  </v-expansion-panel-content>
                </v-expansion-panel>
              </div>
            </draggable>
          </v-expansion-panels>
        </div>

        <v-divider style="margin-top: 4px"></v-divider>

        <v-list-item @click="quit">
          <v-list-item-action>
            <v-icon>mdi-power</v-icon>
          </v-list-item-action>
          <v-list-item-title>{{ $t("Quit") }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- TOP BAR -->
    <v-app-bar app clipped-left color="red" dense>
      <v-app-bar-nav-icon
        @click.stop="$shared.sidenav = !$shared.sidenav"
      ></v-app-bar-nav-icon>
      <v-toolbar-title class="mr-12 align-center mk-noshrink">
        <span class="title">
          {{ $shared.appName }}
          {{ $shared.isDevelopment ? ` (DEV)` : "" }}
          {{ $shared.isPORTABLE ? ` - Portable` : "" }}
        </span>
      </v-toolbar-title>
      <!-- <div class="flex-grow-1"></div> -->
      <v-spacer></v-spacer>
      <v-row
        align-content="end"
        justify="end"
        style="text-align: right !important"
      >
        <v-text-field
          :append-icon-cb="() => {}"
          v-show="currentRoute && currentRoute.name === 'medialist'"
          v-bind:placeholder="$t('Search') + '...'"
          single-line
          clearable
          append-icon="mdi-magnify"
          color="white"
          hide-details
          v-model="searchText"
        ></v-text-field>
      </v-row>

      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <span v-on="on">
            <v-btn
              text
              style="margin-left: 16px; margin-right: -8px"
              v-on:click="toggleFullScreen"
            >
              <v-icon v-show="isFullScreen">mdi-fullscreen-exit</v-icon>
              <v-icon v-show="!isFullScreen">mdi-fullscreen</v-icon>
            </v-btn>
          </span>
        </template>
        <span>{{
          $t("Toggle Fullscreen (you can also use F11 on your keyboard)")
        }}</span>
      </v-tooltip>
    </v-app-bar>

    <!-- CONTENT -->
    <v-main>
      <v-container
        style="
          display: flex;
          max-width: 100% !important;
          padding: 0px !important;
        "
      >
        <router-view></router-view>

        <mk-version-dialog
          ref="versionDialog"
          v-bind:show="versionDialog.show"
          v-on:close="versionDialog.show = false"
        ></mk-version-dialog>

        <mk-delete-dialog
          v-bind:show="deleteDialog.show"
          v-bind:title="$t(deleteDialog.Title)"
          v-bind:question="
            $t(deleteDialog.Message, { name: deleteDialog.ItemName })
          "
          v-bind:yes="$t('YES DELETE')"
          v-bind:no="$t('No')"
          yesColor="error"
          noColor="secondary"
          v-on:yes="onDeleteDialogOK"
          v-on:no="onDeleteDialogCancel"
        ></mk-delete-dialog>

        <mk-search-companies-dialog
          ref="searchCompaniesDialog"
          v-bind:show="searchCompaniesDialog.show"
          v-bind:title="$t('Find Company')"
          searchMode="companies"
          v-on:cancel="onSearchCompaniesDialogCancel"
        ></mk-search-companies-dialog>

        <mk-search-plot-keywords-dialog
          ref="searchPlotKeywordsDialog"
          v-bind:show="searchPlotKeywordsDialog.show"
          v-bind:title="$t('Find Plot Keyword')"
          searchMode="plot-keywords"
          v-on:cancel="onSearchPlotKeywordsDialogCancel"
        ></mk-search-plot-keywords-dialog>

        <mk-search-filming-locations-dialog
          ref="searchFilmingLocationsDialog"
          v-bind:show="searchFilmingLocationsDialog.show"
          v-bind:title="$t('Find Filming Location')"
          searchMode="filming-locations"
          v-on:cancel="onSearchFilmingLocationsDialogCancel"
        ></mk-search-filming-locations-dialog>

        <mk-search-persons-dialog
          ref="searchPersonsDialog"
          v-bind:show="searchPersonsDialog.show"
          v-bind:title="$t('Find Person')"
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

        <mk-check-imdb-scraper-dialog
          ref="checkIMDBScraperDialog"
          v-bind:show="checkIMDBScraperDialog.show"
          v-on:close="onCheckIMDBScraperDialogClose"
          v-on:ok="onCheckIMDBScraperDialogOK"
        ></mk-check-imdb-scraper-dialog>

        <!-- BOTTOM BAR -->
        <v-bottom-navigation
          fixed
          dark
          v-show="scanInfo.show"
          style="height: auto; padding: 4px 8px 4px 8px; z-index: 100"
        >
          <!-- v-model="bottomNav" -->
          <v-row
            align-content="start"
            justify="start"
            style="margin-top: 0px; margin-bottom: 0px; max-width: 100%"
          >
            <!--  style="text-align: right!important" -->
            <div v-if="scanInfo.show" style="flex: 1">
              <p style="margin: 0px !important">
                {{ scanInfo.header }}
              </p>
              <p style="margin: 0px !important; font-size: 12px">
                {{ scanInfo.details }}
              </p>
            </div>
            <!-- <div class="flex-grow-1"></div> -->
            <v-btn
              text
              v-on:click="cancelRescan"
              v-bind:disabled="store.doAbortRescan"
              style="flex: 0 0 80px"
            >
              <v-icon v-if="!store.doAbortRescan">mdi-cancel</v-icon>
              <span v-if="store.doAbortRescan">{{ $t("Cancelling___") }}</span>
            </v-btn>
          </v-row>
        </v-bottom-navigation>
      </v-container>
    </v-main>

    <!-- SNACK BAR -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
    >
      <div>
        <strong v-if="snackbar.details && snackbar.details.length > 0">{{
          snackbar.text
        }}</strong>
        <div v-if="!snackbar.details || snackbar.details.length === 0">
          {{ snackbar.text }}
        </div>
        <div
          v-for="(snackbardetail, index) in snackbar.details"
          v-bind:key="index"
          style="padding-left: 8px"
        >
          {{ snackbardetail }}
        </div>
      </div>
      <v-spacer />
      <v-btn dark text @click="snackbar.show = false">{{ $t("Close") }}</v-btn>
    </v-snackbar>

    <!-- MAIN LOADING OVERLAY -->
    <v-overlay style="z-index: 1000" v-bind:value="showLoadingOverlay">
      <div style="text-align: center">
        <!-- <p style="text-shadow: 0 0 4px #FFFFFF; margin: 0px">loading</p> -->
        <v-progress-circular
          indeterminate
          color="red"
          size="70"
          width="7"
        ></v-progress-circular>
      </div>
    </v-overlay>
  </v-app>
</template>

<script>
import * as _ from "lodash";
const remote = require("electron").remote;
const logger = require("loglevel");
const moment = require("moment");

import * as store from "@/store";
import { shared } from "@/shared";
import { eventBus } from "@/main";
import * as helpers from "@/helpers/helpers";
import draggable from "vuedraggable";

import Dialog from "@/components/shared/Dialog.vue";
import SearchDataDialog from "@/components/shared/SearchDataDialog.vue";
import ScanOptionsDialog from "@/components/shared/ScanOptionsDialog.vue";
import VersionDialog from "@/components/shared/VersionDialog.vue";
import CheckIMDBScraperDialog from "@/components/shared/CheckIMDBScraperDialog.vue";

export default {
  components: {
    draggable,
    "mk-delete-dialog": Dialog,
    "mk-search-companies-dialog": SearchDataDialog,
    "mk-search-persons-dialog": SearchDataDialog,
    "mk-search-plot-keywords-dialog": SearchDataDialog,
    "mk-search-filming-locations-dialog": SearchDataDialog,
    "mk-scan-options-dialog": ScanOptionsDialog,
    "mk-version-dialog": VersionDialog,
    "mk-check-imdb-scraper-dialog": CheckIMDBScraperDialog,
  },

  props: {
    source: String,
  },
  data: () => ({
    isFullScreen: true,
    showLoadingOverlay: false,
    showSidebarLoadingOverlay: false,
    filterHeaderHovered: false,
    editFilters: {
      isEditFilters: false,
      oldFilterGroups: null,
      oldExpandedFilterGroups: null,
    },
    expandedFilterGroups: [],
    searchText: null,
    appSections: [
      { icon: "mdi-movie", text: "Movies", id: "movies" },
      // not yet implemented: { icon: "mdi-television", text: "Series", id: "series" }
    ],

    scanInfo: {
      show: false,
      header: "",
      details: "",
    },

    scanOptions: {
      onlyNew: false,
    },

    snackbar: {
      show: false,
      color: "",
      timeout: 6000,
      text: "",
      details: [],
    },

    deleteDialog: {
      show: false,
      item: null,
      deleteFunction: null,
      Title: null,
      Message: null,
      ItemName: null,
    },

    filterParentalAdvisoryCategories: [
      {
        Name: "Nudity",
      },
      {
        Name: "Violence",
      },
      {
        Name: "Profanity",
      },
      {
        Name: "Alcohol",
      },
      {
        Name: "Frightening",
      },
    ],

    searchCompaniesDialog: {
      show: false,
    },

    searchPersonsDialog: {
      show: false,
    },

    searchPlotKeywordsDialog: {
      show: false,
    },

    searchFilmingLocationsDialog: {
      show: false,
    },

    scanOptionsDialog: {
      show: false,
      showMediaInfoWarning: false,
    },

    versionDialog: {
      show: true,
    },

    checkIMDBScraperDialog: {
      show: false,
      settings: null,
    },

    yearsRangeInput: {
      show: false,
      min: 0,
      max: 0,
      range: [0, 0],
    },
  }),

  watch: {
    // LEARNING: there is a difference with "this" in name: function(){} and name: () => {}
    searchText: function (newValue, oldValue) {
      logger.log("searchText old:", oldValue, "new:", newValue);
      this.debouncedEventBusSearchTextChanged(newValue);
    },

    shared_uiLanguage: function (newValue, oldValue) {
      logger.log("shared_uiLanguage changed from", oldValue, "to", newValue);

      this.$i18n.locale = newValue;
      this.$root.$i18n.locale = newValue;

      logger.log("this.$i18n:", this.$i18n);
      logger.log("this.$i18n.locale:", this.$i18n.locale);
      logger.log("this.$root.$i18n.locale:", this.$root.$i18n.locale);

      moment.locale(newValue);
    },
  },

  computed: {
    store() {
      return store;
    },

    isScanning() {
      return this.$shared.isScanning;
    },

    filterSourcePathsTitle() {
      if (
        !this.$shared.filters.filterSourcePaths.find(
          (filter) => !filter.Selected
        )
      ) {
        return `(${this.$t("ALL")})`;
      }

      if (
        !this.$shared.filters.filterSourcePaths.find(
          (filter) => filter.Selected
        )
      ) {
        return `(${this.$t("NONE")})`;
      }

      return (
        "(" +
        this.$shared.filters.filterSourcePaths.filter(
          (filter) => filter.Selected
        ).length +
        "/" +
        this.$shared.filters.filterSourcePaths.length +
        ")"
      );
    },

    filterDataQualityTitle() {
      if (
        !this.$shared.filters.filterDataQuality.find(
          (filter) => !filter.Selected
        )
      ) {
        return `(${this.$t("ALL")})`;
      }

      if (
        !this.$shared.filters.filterDataQuality.find(
          (filter) => filter.Selected
        )
      ) {
        return `(${this.$t("NONE")})`;
      }

      return (
        "(" +
        this.$shared.filters.filterDataQuality.filter(
          (filter) => filter.Selected
        ).length +
        "/" +
        this.$shared.filters.filterDataQuality.length +
        ")"
      );
    },

    filterGenresTitle() {
      if (
        !this.$shared.filters.filterGenres.find((filter) => !filter.Selected)
      ) {
        return `(${this.$t("ALL")})`;
      }

      if (
        !this.$shared.filters.filterGenres.find((filter) => filter.Selected)
      ) {
        return `(${this.$t("NONE")})`;
      }

      return (
        "(" +
        this.$shared.filters.filterGenres.filter((filter) => filter.Selected)
          .length +
        "/" +
        this.$shared.filters.filterGenres.length +
        ")"
      );
    },

    filterAgeRatingsTitle() {
      if (
        !this.$shared.filters.filterAgeRatings.find(
          (filter) => !filter.Selected
        )
      ) {
        return `(${this.$t("ALL")})`;
      }

      if (
        !this.$shared.filters.filterAgeRatings.find((filter) => filter.Selected)
      ) {
        return `(${this.$t("NONE")})`;
      }

      return (
        "(" +
        this.$shared.filters.filterAgeRatings.filter(
          (filter) => filter.Selected
        ).length +
        "/" +
        this.$shared.filters.filterAgeRatings.length +
        ")"
      );
    },

    filterRatingsTitle() {
      if (
        !this.$shared.filters.filterRatings.find((filter) => !filter.Selected)
      ) {
        return `(${this.$t("ALL")})`;
      }

      if (
        !this.$shared.filters.filterRatings.find((filter) => filter.Selected)
      ) {
        return `(${this.$t("NONE")})`;
      }

      return (
        "(" +
        this.$shared.filters.filterRatings.filter((filter) => filter.Selected)
          .length +
        "/" +
        this.$shared.filters.filterRatings.length +
        ")"
      );
    },

    filterYearsTitle() {
      if (
        !this.$shared.filters.filterYears.find((filter) => !filter.Selected)
      ) {
        return `(${this.$t("ALL")})`;
      }

      if (!this.$shared.filters.filterYears.find((filter) => filter.Selected)) {
        return `(${this.$t("NONE")})`;
      }

      return (
        "(" +
        this.$shared.filters.filterYears.filter((filter) => filter.Selected)
          .length +
        "/" +
        this.$shared.filters.filterYears.length +
        ")"
      );
    },

    filterQualitiesTitle() {
      if (
        !this.$shared.filters.filterQualities.find((filter) => !filter.Selected)
      ) {
        return `(${this.$t("ALL")})`;
      }

      if (
        !this.$shared.filters.filterQualities.find((filter) => filter.Selected)
      ) {
        return `(${this.$t("NONE")})`;
      }

      return (
        "(" +
        this.$shared.filters.filterQualities.filter((filter) => filter.Selected)
          .length +
        "/" +
        this.$shared.filters.filterQualities.length +
        ")"
      );
    },

    filterListsTitle() {
      if (
        !this.$shared.filters.filterLists.find((filter) => !filter.Selected)
      ) {
        return `(${this.$t("ALL")})`;
      }

      if (!this.$shared.filters.filterLists.find((filter) => filter.Selected)) {
        return `(${this.$t("NONE")})`;
      }

      return (
        "(" +
        this.$shared.filters.filterLists.filter((filter) => filter.Selected)
          .length +
        "/" +
        this.$shared.filters.filterLists.length +
        ")"
      );
    },

    filterPersons() {
      return this.$shared.filters.filterPersons.filter(
        (fp) =>
          !this.$shared.filters.filterSettings.filterPersonsAND ||
          fp.IMDB_Person_ID
      );
    },

    filterPersonsTitle() {
      if (
        !this.$shared.filters.filterPersons.find(
          (filter) =>
            !filter.Selected &&
            (!this.$shared.filters.filterSettings.filterPersonsAND ||
              filter.IMDB_Person_ID)
        )
      ) {
        return `(${this.$t("ALL")})`;
      }

      if (
        !this.$shared.filters.filterPersons.find(
          (filter) =>
            filter.Selected &&
            (!this.$shared.filters.filterSettings.filterPersonsAND ||
              filter.IMDB_Person_ID)
        )
      ) {
        return `(${this.$t("NONE")})`;
      }

      return (
        "(" +
        this.$shared.filters.filterPersons.filter(
          (filter) =>
            filter.Selected &&
            (!this.$shared.filters.filterSettings.filterPersonsAND ||
              filter.IMDB_Person_ID)
        ).length +
        "/" +
        this.$shared.filters.filterPersons.filter(
          (filter) =>
            !this.$shared.filters.filterSettings.filterPersonsAND ||
            filter.IMDB_Person_ID
        ).length +
        ")"
      );
    },

    filterCompanies() {
      return this.$shared.filters.filterCompanies.filter(
        (fp) =>
          !this.$shared.filters.filterSettings.filterCompaniesAND ||
          fp.id_Filter_Companies
      );
    },

    filterCompaniesTitle() {
      if (
        !this.$shared.filters.filterCompanies.find(
          (filter) =>
            !filter.Selected &&
            (!this.$shared.filters.filterSettings.filterCompaniesAND ||
              filter.id_Filter_Companies)
        )
      ) {
        return `(${this.$t("ALL")})`;
      }

      if (
        !this.$shared.filters.filterCompanies.find(
          (filter) =>
            filter.Selected &&
            (!this.$shared.filters.filterSettings.filterCompaniesAND ||
              filter.id_Filter_Companies)
        )
      ) {
        return `(${this.$t("NONE")})`;
      }

      return (
        "(" +
        this.$shared.filters.filterCompanies.filter(
          (filter) =>
            filter.Selected &&
            (!this.$shared.filters.filterSettings.filterCompaniesAND ||
              filter.id_Filter_Companies)
        ).length +
        "/" +
        this.$shared.filters.filterCompanies.filter(
          (filter) =>
            !this.$shared.filters.filterSettings.filterCompaniesAND ||
            filter.id_Filter_Companies
        ).length +
        ")"
      );
    },

    filterIMDBPlotKeywords() {
      return this.$shared.filters.filterIMDBPlotKeywords.filter(
        (fp) =>
          !this.$shared.filters.filterSettings.filterIMDBPlotKeywordsAND ||
          fp.id_Filter_IMDB_Plot_Keywords
      );
    },

    filterIMDBFilmingLocations() {
      return this.$shared.filters.filterIMDBFilmingLocations.filter(
        (fl) =>
          !this.$shared.filters.filterSettings.filterIMDBFilmingLocationsAND ||
          fl.id_Filter_IMDB_Filming_Locations
      );
    },

    filterReleaseAttributes() {
      return this.$shared.filters.filterReleaseAttributes.filter(
        (fra) =>
          !this.$shared.filters.filterSettings.filterReleaseAttributesAND ||
          !fra.isAny
      );
    },

    filterIMDBPlotKeywordsTitle() {
      if (
        !this.$shared.filters.filterIMDBPlotKeywords.find(
          (filter) =>
            !filter.Selected &&
            (!this.$shared.filters.filterSettings.filterIMDBPlotKeywordsAND ||
              filter.id_Filter_IMDB_Plot_Keywords)
        )
      ) {
        return `(${this.$t("ALL")})`;
      }

      if (
        !this.$shared.filters.filterIMDBPlotKeywords.find(
          (filter) =>
            filter.Selected &&
            (!this.$shared.filters.filterSettings.filterIMDBPlotKeywordsAND ||
              filter.id_Filter_IMDB_Plot_Keywords)
        )
      ) {
        return `(${this.$t("NONE")})`;
      }

      return (
        "(" +
        this.$shared.filters.filterIMDBPlotKeywords.filter(
          (filter) =>
            filter.Selected &&
            (!this.$shared.filters.filterSettings.filterIMDBPlotKeywordsAND ||
              filter.id_Filter_IMDB_Plot_Keywords)
        ).length +
        "/" +
        this.$shared.filters.filterIMDBPlotKeywords.filter(
          (filter) =>
            !this.$shared.filters.filterSettings.filterIMDBPlotKeywordsAND ||
            filter.id_Filter_IMDB_Plot_Keywords
        ).length +
        ")"
      );
    },

    filterIMDBFilmingLocationsTitle() {
      if (
        !this.$shared.filters.filterIMDBFilmingLocations.find(
          (filter) =>
            !filter.Selected &&
            (!this.$shared.filters.filterSettings
              .filterIMDBFilmingLocationsAND ||
              filter.id_Filter_IMDB_Filming_Locations)
        )
      ) {
        return `(${this.$t("ALL")})`;
      }

      if (
        !this.$shared.filters.filterIMDBFilmingLocations.find(
          (filter) =>
            filter.Selected &&
            (!this.$shared.filters.filterSettings
              .filterIMDBFilmingLocationsAND ||
              filter.id_Filter_IMDB_Filming_Locations)
        )
      ) {
        return `(${this.$t("NONE")})`;
      }

      return (
        "(" +
        this.$shared.filters.filterIMDBFilmingLocations.filter(
          (filter) =>
            filter.Selected &&
            (!this.$shared.filters.filterSettings
              .filterIMDBFilmingLocationsAND ||
              filter.id_Filter_IMDB_Filming_Locations)
        ).length +
        "/" +
        this.$shared.filters.filterIMDBFilmingLocations.filter(
          (filter) =>
            !this.$shared.filters.filterSettings
              .filterIMDBFilmingLocationsAND ||
            filter.id_Filter_IMDB_Filming_Locations
        ).length +
        ")"
      );
    },

    filterAudioLanguagesTitle() {
      if (
        !this.$shared.filters.filterAudioLanguages.find(
          (filter) => !filter.Selected
        )
      ) {
        return `(${this.$t("ALL")})`;
      }

      if (
        !this.$shared.filters.filterAudioLanguages.find(
          (filter) => filter.Selected
        )
      ) {
        return `(${this.$t("NONE")})`;
      }

      return (
        "(" +
        this.$shared.filters.filterAudioLanguages.filter(
          (filter) => filter.Selected
        ).length +
        "/" +
        this.$shared.filters.filterAudioLanguages.length +
        ")"
      );
    },

    filterSubtitleLanguagesTitle() {
      if (
        !this.$shared.filters.filterSubtitleLanguages.find(
          (filter) => !filter.Selected
        )
      ) {
        return `(${this.$t("ALL")})`;
      }

      if (
        !this.$shared.filters.filterSubtitleLanguages.find(
          (filter) => filter.Selected
        )
      ) {
        return `(${this.$t("NONE")})`;
      }

      return (
        "(" +
        this.$shared.filters.filterSubtitleLanguages.filter(
          (filter) => filter.Selected
        ).length +
        "/" +
        this.$shared.filters.filterSubtitleLanguages.length +
        ")"
      );
    },

    filterReleaseAttributesTitle() {
      if (
        !this.$shared.filters.filterReleaseAttributes.find(
          (filter) => !filter.Selected
        )
      ) {
        return `(${this.$t("ALL")})`;
      }

      if (
        !this.$shared.filters.filterReleaseAttributes.find(
          (filter) => filter.Selected
        )
      ) {
        return `(${this.$t("NONE")})`;
      }

      return (
        "(" +
        this.$shared.filters.filterReleaseAttributes.filter(
          (filter) => filter.Selected
        ).length +
        "/" +
        this.$shared.filters.filterReleaseAttributes.length +
        ")"
      );
    },

    filterMetacriticScoreTitle() {
      if (
        this.$shared.filters.filterMetacriticScore[0] == 0 &&
        this.$shared.filters.filterMetacriticScore[1] == 100
      ) {
        return `(${this.$t("ALL")}${
          this.$shared.filters.filterMetacriticScoreNone ? "" : "*"
        })`;
      }

      return `(${this.$shared.filters.filterMetacriticScore[0]} - ${
        this.$shared.filters.filterMetacriticScore[1]
      }${this.$shared.filters.filterMetacriticScoreNone ? "" : "*"})`;
    },

    // filterReleaseYearsTitle() {
    //   if (
    //     this.$shared.filters.filterReleaseYears[0] == this.$shared.filters.filterReleaseYearsMin &&
    //     this.$shared.filters.filterReleaseYears[1] == this.$shared.filters.filterReleaseYearsMax
    //   ) {
    //     return `(${this.$t("ALL")}${
    //       this.$shared.filters.filterReleaseYearsNone ? "" : "*"
    //     })`;
    //   }

    //   return `(${this.$shared.filters.filterReleaseYears[0]} - ${
    //     this.$shared.filters.filterReleaseYears[1]
    //   }${this.$shared.filters.filterReleaseYearsNone ? "" : "*"})`;
    // },

    filterIMDBRatingTitle() {
      if (
        this.$shared.filters.filterIMDBRating[0] == 0 &&
        this.$shared.filters.filterIMDBRating[1] == 10
      ) {
        return `(${this.$t("ALL")}${
          this.$shared.filters.filterIMDBRatingNone ? "" : "*"
        })`;
      }

      return `(${this.$shared.filters.filterIMDBRating[0]} - ${
        this.$shared.filters.filterIMDBRating[1]
      }${this.$shared.filters.filterIMDBRatingNone ? "" : "*"})`;
    },

    filterContentAdvisoryTitle() {
      if (
        !Object.keys(this.$shared.filters.filterParentalAdvisory).find(
          (category) =>
            this.$shared.filters.filterParentalAdvisory[category].find(
              (filter) => !filter.Selected
            )
        )
      ) {
        return `(${this.$t("ALL")})`;
      }

      if (
        !Object.keys(this.$shared.filters.filterParentalAdvisory).find(
          (category) =>
            this.$shared.filters.filterParentalAdvisory[category].find(
              (filter) => filter.Selected
            )
        )
      ) {
        return `(${this.$t("NONE")})`;
      }

      let numSelected = 0;
      let numAll = 0;
      Object.keys(this.$shared.filters.filterParentalAdvisory).find(
        (category) =>
          this.$shared.filters.filterParentalAdvisory[category].forEach(
            (filter) => {
              numAll++;
              if (filter.Selected) {
                numSelected++;
              }
            }
          )
      );

      return `(${numSelected}/${numAll})`;
    },

    shared_uiLanguage() {
      return this.$shared.uiLanguage;
    },

    currentRoute() {
      logger.log("currentRoute:", this.$route);
      return this.$route;
    },
  },

  methods: {
    $local_t(key, payload) {
      return this.$t(key, payload);
    },

    sectionRoute(itemid) {
      if (itemid == "movies") {
        return "/medialist/movies";
      }

      if (itemid == "series") {
        return "/medialist/series";
      }

      return "";
    },

    cancelRescan() {
      store.abortRescan();
    },

    eventBusSearchTextChanged: function (searchText) {
      this.$shared.searchText = searchText;
      eventBus.searchTextChanged(searchText);
    },

    eventBusRefetchMedia: function (setPage) {
      eventBus.refetchMedia(setPage);
    },

    filtersChanged: function (
      filterCollection,
      filterItem,
      filterItemID,
      setAllFunction
    ) {
      if (
        filterCollection &&
        filterItem &&
        filterItemID &&
        setAllFunction &&
        filterCollection.length > 1 &&
        !filterItem.Selected
      ) {
        if (
          !filterCollection.find(
            (item) => item !== filterItem && !item.Selected
          )
        ) {
          // all items were selected, deselect them and keep the clicked one
          setAllFunction(false, [filterItemID]);
        }
      }

      logger.log("filters changed this.$shared:", this.$shared);
      this.debouncedEventBusRefetchMedia();
    },

    setAllSourcePaths: function (value, exclusionList) {
      this.$shared.filters.filterSourcePaths.forEach((sp) => {
        if (
          exclusionList &&
          exclusionList.find((val) => sp.Description === val.Description)
        ) {
          sp.Selected = !value;
          return;
        }

        sp.Selected = value;
      });

      this.filtersChanged();
    },

    setAllGenres: function (value, exclusionList) {
      this.$shared.filters.filterGenres.forEach((genre) => {
        if (
          exclusionList &&
          exclusionList.find((val) => genre.Name === val.translated)
        ) {
          genre.Selected = !value;
          return;
        }

        genre.Selected = value;
      });

      this.filtersChanged();
    },

    setAllAgeRatings: function (value, exclusionList) {
      logger.log("setAllAgeRatings exclusionList:", exclusionList);

      this.$shared.filters.filterAgeRatings.forEach((ar) => {
        if (exclusionList && exclusionList.find((val) => ar.Age == val.Age)) {
          ar.Selected = !value;
          return;
        }

        ar.Selected = value;
      });

      this.filtersChanged();
    },

    setAllRatings: function (value) {
      this.$shared.filters.filterRatings.forEach((rating) => {
        rating.Selected = value;
      });

      this.filtersChanged();
    },

    setAllYears: function (value) {
      this.$shared.filters.filterYears.forEach((year) => {
        year.Selected = value;
      });

      this.filtersChanged();
    },

    setAllLists: function (value) {
      this.$shared.filters.filterLists.forEach((list) => {
        list.Selected = value;
      });

      this.filtersChanged();
    },

    setAllParentalAdvisory: function (category, value) {
      this.$shared.filters.filterParentalAdvisory[category.Name].forEach(
        (paItem) => {
          paItem.Selected = value;
        }
      );

      this.filtersChanged();
    },

    setAllPersons: function (value, exclusionList) {
      this.$shared.filters.filterPersons.forEach((sp) => {
        if (
          exclusionList &&
          exclusionList.find((val) => sp.IMDB_Person_ID === val)
        ) {
          sp.Selected = !value;
          return;
        }

        sp.Selected = value;
      });

      this.filtersChanged();
    },

    setAllCompanies: function (value, exclusionList) {
      logger.log("setAllCompanies:", { value, exclusionList });

      this.$shared.filters.filterCompanies.forEach((sp) => {
        if (
          exclusionList &&
          exclusionList.find((val) => sp.Company_Name === val)
        ) {
          sp.Selected = !value;
          return;
        }

        sp.Selected = value;
      });

      this.filtersChanged();
    },

    setAllQualities: function (value, exclusionList) {
      this.$shared.filters.filterQualities.forEach((quality) => {
        if (
          exclusionList &&
          exclusionList.find((val) => quality.MI_Quality === val)
        ) {
          quality.Selected = !value;
          return;
        }

        quality.Selected = value;
      });

      this.filtersChanged();
    },

    setAllAudioLanguages: function (value, exclusionList) {
      this.$shared.filters.filterAudioLanguages.forEach((lang) => {
        if (
          exclusionList &&
          exclusionList.find((val) => lang.Language === val)
        ) {
          lang.Selected = !value;
          return;
        }

        lang.Selected = value;
      });

      this.filtersChanged();
    },

    setAllSubtitleLanguages: function (value, exclusionList) {
      this.$shared.filters.filterSubtitleLanguages.forEach((lang) => {
        if (
          exclusionList &&
          exclusionList.find((val) => lang.Language === val)
        ) {
          lang.Selected = !value;
          return;
        }

        lang.Selected = value;
      });

      this.filtersChanged();
    },

    setAllReleaseAttributes: function (value, exclusionList) {
      this.$shared.filters.filterReleaseAttributes.forEach((ra) => {
        if (
          exclusionList &&
          exclusionList.find((val) => ra.ReleaseAttribute === val)
        ) {
          ra.Selected = !value;
          return;
        }

        ra.Selected = value;
      });

      this.filtersChanged();
    },

    setAllIMDBPlotKeywords: function (value, exclusionList) {
      this.$shared.filters.filterIMDBPlotKeywords.forEach((pk) => {
        if (
          exclusionList &&
          exclusionList.find((val) => pk.id_IMDB_Plot_Keywords === val)
        ) {
          pk.Selected = !value;
          return;
        }

        pk.Selected = value;
      });

      this.filtersChanged();
    },

    setAllIMDBFilmingLocations: function (value, exclusionList) {
      this.$shared.filters.filterIMDBFilmingLocations.forEach((fl) => {
        if (
          exclusionList &&
          exclusionList.find((val) => fl.id_IMDB_Filming_Locations === val)
        ) {
          fl.Selected = !value;
          return;
        }

        fl.Selected = value;
      });

      this.filtersChanged();
    },

    setAllDataQuality: function (value, exclusionList) {
      this.$shared.filters.filterDataQuality.forEach((dq) => {
        if (exclusionList && exclusionList.find((val) => dq.Name === val)) {
          dq.Selected = !value;
          return;
        }

        dq.Selected = value;
      });

      this.filtersChanged();
    },

    getFilterRatingLabel(rating, numMovies) {
      let label = "";

      if (rating) {
        label += helpers.getStarRatingString(rating);

        // for (let i = 1; i < 6; i++) {
        //   const diff = rating - (i - 1);

        //   if (diff >= 1) {
        //     label += "★";
        //   }
        //   if (diff == 0.5) {
        //     label += "½"; // we have to wait until unicode 2BEA is available (http://www.fileformat.info/info/unicode/char/002BEA/index.htm)
        //   }
        //   if (diff <= 0) {
        //     label += "☆";
        //   }
        // }
      } else {
        label += `<${this.$t("not yet rated")}>`;
      }

      label += " (" + numMovies + ")";

      return label;
    },

    getFilterYearLabel(startYear, NumMovies) {
      if (startYear < 0) {
        return `<${this.$t("none provided")}> (${NumMovies})`;
      }

      return `${startYear} (${NumMovies})`;
    },

    getFilterQualityLabel(quality, NumMovies) {
      if (!quality) {
        return `<${this.$t("none provided")}> (${NumMovies})`;
      }

      return `${quality} (${NumMovies})`;
    },

    showDeleteDialog(item, deleteFunction, Title, Message, ItemName) {
      this.deleteDialog.item = item;
      this.deleteDialog.deleteFunction = deleteFunction;
      this.deleteDialog.Title = Title;
      this.deleteDialog.Message = Message;
      this.deleteDialog.ItemName = ItemName;
      this.deleteDialog.show = true;
    },

    async onDeleteDialogOK() {
      await this.deleteDialog.deleteFunction(this.deleteDialog.item);
      this.deleteDialog.show = false;
    },

    onDeleteDialogCancel() {
      this.deleteDialog.show = false;
    },

    async deleteList() {
      (async () => {
        try {
          logger.log("DELETE LIST");

          await store.db.fireProcedure(
            `DELETE FROM tbl_Lists WHERE id_Lists = $id_Lists`,
            {
              $id_Lists: this.deleteDialog.item.id_Lists,
            }
          );

          logger.log("DELETE LISTS MOVIES");

          await store.db.fireProcedure(
            `DELETE FROM tbl_Lists_Movies WHERE id_Lists NOT IN (SELECT id_Lists FROM tbl_Lists)`,
            []
          );

          eventBus.refetchFilters({ filterLists: null });
          eventBus.refetchMedia(this.$shared.currentPage);

          eventBus.showSnackbar(
            "success",
            `${this.$t("List {name} deleted_", {
              name: this.deleteDialog.ItemName,
            })}`
          );
        } catch (err) {
          eventBus.showSnackbar("error", err);
        }
      })();
    },

    async deletePerson(person) {
      await store.deleteFilterPerson(person.id_Filter_Persons);
      eventBus.showSnackbar(
        "success",
        `${this.$t("Person {name} removed_", {
          name: this.deleteDialog.ItemName,
        })}`
      );
      this.$shared.filters.filterPersons.splice(
        this.$shared.filters.filterPersons.findIndex(
          (filterPerson) =>
            filterPerson.id_Filter_Persons === person.id_Filter_Persons
        ),
        1
      );
      eventBus.refetchMedia({ filterPersons: null });
    },

    async deleteFilterIMDBPlotKeyword(filterIMDBPlotKeyword) {
      await store.deleteFilterIMDBPlotKeyword(
        filterIMDBPlotKeyword.id_Filter_IMDB_Plot_Keywords
      );
      eventBus.showSnackbar(
        "success",
        `${this.$t("Plot Keyword {name} removed_", {
          name: this.deleteDialog.ItemName,
        })}`
      );
      this.$shared.filters.filterIMDBPlotKeywords.splice(
        this.$shared.filters.filterIMDBPlotKeywords.findIndex(
          (plotKeyword) =>
            plotKeyword.id_Filter_IMDB_Plot_Keywords ===
            filterIMDBPlotKeyword.id_Filter_IMDB_Plot_Keywords
        ),
        1
      );
      eventBus.refetchMedia({ filterIMDBPlotKeywords: null });
    },

    async deleteFilterIMDBFilmingLocation(filterIMDBFilmingLocation) {
      await store.deleteFilterIMDBFilmingLocation(
        filterIMDBFilmingLocation.id_Filter_IMDB_Filming_Locations
      );
      eventBus.showSnackbar(
        "success",
        `${this.$t("Filming Location {name} removed_", {
          name: this.deleteDialog.ItemName,
        })}`
      );
      this.$shared.filters.filterIMDBFilmingLocations.splice(
        this.$shared.filters.filterIMDBFilmingLocations.findIndex(
          (filmingLocation) =>
            filmingLocation.id_Filter_IMDB_Filming_Locations ===
            filterIMDBFilmingLocation.id_Filter_IMDB_Filming_Locations
        ),
        1
      );
      eventBus.refetchMedia({ filterIMDBFilmingLocations: null });
    },

    async deleteCompany(filterCompany) {
      await store.deleteFilterCompany(filterCompany.id_Filter_Companies);
      eventBus.showSnackbar(
        "success",
        `${this.$t("Company {name} removed_", {
          name: this.deleteDialog.ItemName,
        })}`
      );
      this.$shared.filters.filterCompanies.splice(
        this.$shared.filters.filterCompanies.findIndex(
          (company) =>
            company.id_Filter_Companies === filterCompany.id_Filter_Companies
        ),
        1
      );
      eventBus.refetchMedia({ filterCompanies: null });
    },

    async onRescan() {
      if (this.$shared.isScanning) {
        store.abortRescan();
        return;
      }

      this.$refs.scanOptionsDialog.init();

      this.scanOptionsDialog.show = true;
    },

    onScanOptionsDialogCancel() {
      this.scanOptionsDialog.show = false;
    },

    onScanOptionsDialogOK({ radioGroup, performCheck }) {
      const onlyNew = radioGroup === 1; // radioGroup is the chosen method

      logger.log("chosen Scan Option:", radioGroup, "onlyNew:", onlyNew);

      this.scanOptionsDialog.show = false;

      if (!performCheck) {
        // just rescan without IMDB Scraper Check
        store.rescan(onlyNew, this.$local_t);
        return;
      }

      // perform IMDB Scraper Check before scan
      const settings = {
        userScanOptions: shared.userScanOptions,
      };

      this.scanOptions.onlyNew = onlyNew;

      this.showCheckIMDBScraperDialog(settings);
    },

    filterParentalAdvisoryCategoryTitle(category) {
      if (
        !this.$shared.filters.filterParentalAdvisory[category.Name].find(
          (filter) => !filter.Selected
        )
      ) {
        return `(${this.$t("ALL")})`;
      }
      if (
        !this.$shared.filters.filterParentalAdvisory[category.Name].find(
          (filter) => filter.Selected
        )
      ) {
        return `(${this.$t("NONE")})`;
      }
      return (
        "(" +
        this.$shared.filters.filterParentalAdvisory[category.Name].filter(
          (filter) => filter.Selected
        ).length +
        "/" +
        this.$shared.filters.filterParentalAdvisory[category.Name].length +
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

    addIMDBPlotKeyword() {
      this.searchPlotKeywordsDialog.show = true;
      this.$refs.searchPlotKeywordsDialog.init();
    },

    addIMDBFilmingLocation() {
      this.searchFilmingLocationsDialog.show = true;
      this.$refs.searchFilmingLocationsDialog.init();
    },

    onSearchPlotKeywordsDialogCancel() {
      this.searchPlotKeywordsDialog.show = false;
    },

    onSearchFilmingLocationsDialogCancel() {
      this.searchFilmingLocationsDialog.show = false;
    },

    quit() {
      remote.getCurrentWindow().close();
    },

    checkVersion() {
      logger.log("App checkVersion START");
      setTimeout(() => {
        this.$refs.versionDialog.checkVersion();
      });
    },

    showCheckIMDBScraperDialog(settings) {
      setTimeout(() => {
        if (this.$refs.checkIMDBScraperDialog) {
          this.$refs.checkIMDBScraperDialog.init(settings);
        }
        this.checkIMDBScraperDialog.show = true;
      });
    },

    onCheckIMDBScraperDialogClose() {
      this.checkIMDBScraperDialog.show = false;
    },

    onCheckIMDBScraperDialogOK() {
      this.checkIMDBScraperDialog.show = false;
      store.rescan(this.scanOptions.onlyNew, this.$local_t);
      return;
    },

    onResetFilters() {
      store.resetFilters();
      this.filtersChanged();
    },

    onEditFilters() {
      this.editFilters.oldExpandedFilterGroups = JSON.parse(
        JSON.stringify(this.expandedFilterGroups)
      );
      this.editFilters.oldFilterGroups = JSON.parse(
        JSON.stringify(this.$shared.filterGroups)
      );

      this.expandedFilterGroups = [];
      this.editFilters.isEditFilters = true;
    },

    async onEditFiltersOK() {
      await store.setSetting(
        "filterGroups",
        JSON.stringify(this.$shared.filterGroups)
      );
      this.editFilters.isEditFilters = false;
      this.expandedFilterGroups = JSON.parse(
        JSON.stringify(this.editFilters.oldExpandedFilterGroups)
      );
    },

    async onEditFiltersCancel() {
      this.editFilters.isEditFilters = false;
      this.expandedFilterGroups = JSON.parse(
        JSON.stringify(this.editFilters.oldExpandedFilterGroups)
      );
      this.$shared.filterGroups = JSON.parse(
        JSON.stringify(this.editFilters.oldFilterGroups)
      );
    },

    showYearsRangeInput() {
      if (this.yearsRangeInput.show) {
        this.yearsRangeInput.show = false;
        return;
      }

      let minYear = 9999;
      this.$shared.filters.filterYears.forEach((year) => {
        if (year.startYear != -1 && year.startYear < minYear) {
          minYear = year.startYear;
        }
      });

      let maxYear = 0;
      this.$shared.filters.filterYears.forEach((year) => {
        if (year.startYear != -1 && year.startYear > maxYear) {
          maxYear = year.startYear;
        }
      });

      this.yearsRangeInput.min = minYear;
      this.yearsRangeInput.max = maxYear;
      this.yearsRangeInput.range = [minYear, maxYear];
      this.yearsRangeInput.show = true;
    },

    onYearsRangeInputCancel() {
      this.yearsRangeInput.show = false;
    },

    onYearsRangeInputOK() {
      this.$shared.filters.filterYears.forEach((year) => {
        if (year.startYear === -1) {
          return;
        }

        if (
          year.startYear >= this.yearsRangeInput.range[0] &&
          year.startYear <= this.yearsRangeInput.range[1]
        ) {
          year.Selected = true;
        } else {
          year.Selected = false;
        }
      });

      this.filtersChanged();

      this.yearsRangeInput.show = false;
    },

    toggleFullScreen() {
      this.isFullScreen = !remote.getCurrentWindow().isFullScreen();

      remote
        .getCurrentWindow()
        .setFullScreen(!remote.getCurrentWindow().isFullScreen());
    },

    onKeyDown(e) {
      if (e.key === "F11") {
        logger.log("toggleFullScreen requested");
        this.toggleFullScreen();
      }
    },

    onFilterDragEnd() {
      logger.log(
        "onFilterDragEnd this.editFilters.oldExpandedFilterGroups:",
        this.editFilters.oldExpandedFilterGroups
      );
    },
  },

  // ### LifeCycleHooks ###
  created() {
    logger.log("this.$vuetify.theme:", this.$vuetify.theme);

    document.onkeydown = this.onKeyDown;

    this.$vuetify.theme.dark = true;

    if (this.$route.path !== "/") {
      store.routeTo(this.$router, "/");
    }

    this.checkVersion();

    this.searchText = this.$shared.searchText;

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
      } else if (textOrErrorObject.translateMe) {
        this.snackbar.text = this.$t(
          textOrErrorObject.translateMe.text,
          textOrErrorObject.translateMe.payload
        );
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
            textOrErrorObject.error.details.forEach((detail) => {
              if (typeof detail === "string" || detail instanceof String) {
                this.snackbar.details.push(detail);
              }
            });
          }
        }
      } else if (textOrErrorObject.message) {
        this.snackbar.text = textOrErrorObject.message;
      } else {
        this.snackbar.text = `<${this.$t("unknown text")}>`;
      }

      this.snackbar.show = true;
    });

    eventBus.$on("scanInfoShow", ({ header, details }) => {
      this.scanInfo = {
        header,
        details,
        show: true,
      };
    });

    eventBus.$on("rescanStarted", () => {
      this.$shared.isScanning = true;
    });

    eventBus.$on("rescanStopped", () => {
      this.$shared.isScanning = false;
      store.resetAbortRescan();
    });

    eventBus.$on("scanInfoOff", () => {
      this.scanInfo.show = false;
    });

    eventBus.$on("filtersChanged", () => {
      this.filtersChanged();
    });

    eventBus.$on("showLoadingOverlay", (value) => {
      this.showLoadingOverlay = value;
    });

    eventBus.$on("showSidebarLoadingOverlay", (value) => {
      this.showSidebarLoadingOverlay = value;
    });

    eventBus.$on("setFilter", (setFilter) => {
      if (!setFilter) {
        return;
      }

      if (setFilter.filterCompanies) {
        this.setAllCompanies(false, setFilter.filterCompanies);
        this.$shared.filterGroups.find(
          (fg) => fg.name === "filterCompanies"
        ).visible = true;
      }

      if (setFilter.filterPersons) {
        this.setAllPersons(false, setFilter.filterPersons);
        this.$shared.filterGroups.find(
          (fg) => fg.name === "filterPersons"
        ).visible = true;
      }

      if (setFilter.filterIMDBPlotKeywords) {
        this.setAllIMDBPlotKeywords(false, setFilter.filterIMDBPlotKeywords);
        this.$shared.filterGroups.find(
          (fg) => fg.name === "filterIMDBPlotKeywords"
        ).visible = true;
      }

      if (setFilter.filterIMDBFilmingLocations) {
        this.setAllIMDBFilmingLocations(
          false,
          setFilter.filterIMDBFilmingLocations
        );
        this.$shared.filterGroups.find(
          (fg) => fg.name === "filterIMDBFilmingLocations"
        ).visible = true;
      }

      if (setFilter.filterQualities) {
        this.setAllQualities(false, setFilter.filterQualities);
        this.$shared.filterGroups.find(
          (fg) => fg.name === "filterQualities"
        ).visible = true;
      }

      if (setFilter.filterAgeRatings) {
        this.setAllAgeRatings(false, setFilter.filterAgeRatings);
        this.$shared.filterGroups.find(
          (fg) => fg.name === "filterAgeRatings"
        ).visible = true;
      }

      if (setFilter.filterGenres) {
        this.setAllGenres(false, setFilter.filterGenres);
        this.$shared.filterGroups.find(
          (fg) => fg.name === "filterGenres"
        ).visible = true;
      }

      if (setFilter.filterAudioLanguages) {
        this.setAllAudioLanguages(false, setFilter.filterAudioLanguages);
        this.$shared.filterGroups.find(
          (fg) => fg.name === "filterAudioLanguages"
        ).visible = true;
      }

      if (setFilter.filterSubtitleLanguages) {
        this.setAllSubtitleLanguages(false, setFilter.filterSubtitleLanguages);
        this.$shared.filterGroups.find(
          (fg) => fg.name === "filterSubtitleLanguages"
        ).visible = true;
      }

      if (setFilter.filterReleaseAttributes) {
        this.setAllReleaseAttributes(false, setFilter.filterReleaseAttributes);
        this.$shared.filterGroups.find(
          (fg) => fg.name === "filterReleaseAttributes"
        ).visible = true;
      }
    });

    eventBus.$on("openVersionDialog", () => {
      this.checkVersion();
      this.versionDialog.show = true;
    });

    eventBus.$on("openCheckIMDBScraperDialog", (settings) => {
      this.showCheckIMDBScraperDialog(settings);
    });

    eventBus.$on(
      "rescanFinished",
      ({ rescanAddedMovies, rescanRemovedMovies }) => {
        eventBus.showSnackbar(
          "success",
          `${this.$local_t(
            "_Re-_scan finished_"
          )} ${rescanAddedMovies} ${this.$local_t(
            "added"
          )}, ${rescanRemovedMovies} ${this.$local_t("removed")}.`
        );
      }
    );

    // lodash debounced functions
    this.debouncedEventBusSearchTextChanged = _.debounce(
      this.eventBusSearchTextChanged,
      500
    );

    this.debouncedEventBusRefetchMedia = _.debounce(
      this.eventBusRefetchMedia,
      1000
    );
  },
};
</script>
<style>
h1 {
  margin-bottom: 16px;
}

.mk-light-grey {
  color: lightgrey !important;
}

.mk-dark-grey {
  color: darkgrey !important;
}

.mk-noshrink {
  flex-shrink: 0 !important;
}

*::-webkit-scrollbar {
  width: 8px !important; /* width of the entire scrollbar */
}
*::-webkit-scrollbar-track {
  background: #646464 !important; /* color of the tracking area */
}
*::-webkit-scrollbar-thumb {
  background-color: #424242 !important; /* color of the scroll thumb */
  border-radius: 10px !important; /* roundness of the scroll thumb */
  border: 2px solid #646464 !important; /* creates padding around scroll thumb */
}

.mk-scrollcontainer {
  overflow-y: auto;
  overflow-x: hidden;
}

.mk-scrollcontainer::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  background-color: #f5f5f5;
}

.mk-scrollcontainer::-webkit-scrollbar {
  width: 5px;
  background-color: #f5f5f5;
}

.mk-scrollcontainer::-webkit-scrollbar-thumb {
  background-color: #000000;
  border: 1px solid #555555;
}

.mk-clickable {
  font-size: 0.875rem;
  font-weight: normal;
  color: white !important;
  cursor: pointer;
}

.mk-clickable:hover {
  color: #2196f3 !important;
}

.mk-clickable-red {
  font-size: 0.875rem;
  font-weight: normal;
  color: white !important;
  cursor: pointer;
}

.mk-clickable-red:hover {
  color: red !important;
}

.mk-clickable-dark-grey {
  font-size: 0.875rem;
  font-weight: normal;
  color: darkgrey !important;
  cursor: pointer;
}

.mk-clickable-dark-grey:hover {
  color: #2196f3 !important;
}

.mk-clickable-white {
  font-size: 0.875rem;
  font-weight: normal;
  color: white !important;
  cursor: pointer;
}

.mk-clickable-white:hover {
  color: white !important;
}

.mk-grab {
  cursor: grab !important;
}

.mk-item-detailcategory-content {
  margin-bottom: 8px;
}

.mk-item-detailcategory-header {
  font-size: 16px;
}

.mk-btn-small {
  height: 20px !important;
}

.mk-main-detail-row {
  margin-top: 12px !important;
  margin-right: 6px !important;
  margin-bottom: 8px !important;
  margin-left: 4px !important;
}

.mk-detail-row {
  margin-bottom: -6px;
}

.mk-highlightable-row:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
}

.mk-filter-spinner {
  margin-left: 5px;
  margin-right: 2px;
}

.mk-filter-icon-container {
  width: 28px;
  height: 24px;
  display: inline-block;
}

/* ### Vuetify overrides ### */
.v-expansion-panel-header {
  font-size: 16px;
}

.v-alert {
  font-size: 14px;
}

.v-list-item__title {
  font-size: 16px !important;
}

/* ### Vuetify fixes ### */

/* this is part of v-select and makes it unneccessarily high */
.v-text-field__details {
  display: none !important;
}

/* this is part of v-switch and makes it unneccessarily high */
div.v-messages {
  min-height: 0px !important;
  visibility: hidden;
}

/* this is part of v-switch and makes it unneccessarily high */
/* .v-input
  .v-input--dense
  .theme--dark
  .v-input--selection-controls
  .v-input--switch
  .primary--text {
  margin-top: 0px;
} */

.mk-v-select-dynamic-width .v-input__slot {
  margin-top: 0px !important;
}

.mk-v-select-dynamic-width .v-select__selections > input {
  max-width: 0px !important;
}

.v-icon.mdi-delete:hover {
  color: red !important;
}

/* ### marked overrides ### */
code {
  background-color: rgba(0, 0, 0, 0) !important;
  color: rgba(255, 255, 255, 0.7) !important;
}
</style>
