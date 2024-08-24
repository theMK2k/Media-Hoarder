<template>
  <div style="display: flex; flex-direction: column; width: 100%" ref="mainContainer">
    <v-row
      style="
        margin-bottom: 0px;
        margin-top: 0px;
        margin-right: 0px;
        margin-left: 0px;
        padding-bottom: 8px;
        padding-top: 8px;
        position: fixed;
        width: 100% !important;
        z-index: 10;
        background: rgb(48, 48, 48);
      "
    >
      <!-- Button: "<-" (go back) -->
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <span v-on="on">
            <v-btn text v-on:click="$router.go(-1)" style="padding: 0px; margin-top: 6px; margin-left: 8px">
              <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
          </span>
        </template>
        <span>{{ $t("Go Back") }}</span>
      </v-tooltip>

      <!-- Button: "Reload List" -->
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <span v-on="on">
            <v-btn text v-on:click="onReload" style="padding: 0px; margin-top: 6px; margin-left: 8px">
              <v-icon>mdi-reload</v-icon>
            </v-btn>
          </span>
        </template>
        <span>{{ $t("Reload List") }}</span>
      </v-tooltip>

      <!-- Top Row for Movies and Series -->
      <template v-if="!Series_id_Movies_Owner">
        <h1 style="margin-bottom: 0px; margin-top: 0px; margin-left: 9px">
          {{ $t(mediatype.toUpperCase()) }} ({{ itemsFiltered.length.toLocaleString($shared.uiLanguage) }})
          <v-tooltip bottom v-if="filtersList.length > 0">
            <template v-slot:activator="{ on }">
              <span v-on="on">*</span>
            </template>
            <span>
              {{ $t("Applied Filters") }}:
              <ul>
                <li v-for="filter in filtersList" v-bind:key="filter">
                  {{ filter }}
                </li>
              </ul>
            </span>
          </v-tooltip>
        </h1>
        <v-select
          class="mk-v-select-dynamic-width"
          solo
          clearable
          dense
          v-bind:items="sortAblesFiltered"
          item-text="DescriptionTranslated"
          item-value="Field"
          v-model="$shared.sortField"
          v-bind:label="$t('Sort')"
          style="margin-left: 8px; margin-top: 8px; max-width: 320px; height: 40px"
          v-on:change="onSortChanged"
        >
          <template v-slot:selection="{ item }">
            <span class="grey--text caption" style="margin-right: 8px">{{ $t("Sort by") }}</span>
            <span>{{ $t(item.Description) }}</span>
          </template>
        </v-select>

        <v-spacer></v-spacer>

        <!-- TOP PAGINATION -->
        <div v-if="numPages" style="display: flex; align-items: flex-start">
          <mk-pagination
            v-bind:length="numPages"
            v-bind:pages="paginationItems"
            v-model="$shared.currentPage"
          ></mk-pagination>

          <!-- LIST MENU -->
          <v-menu bottom right offset-y>
            <template v-slot:activator="{ on: menu, attrs }">
              <v-tooltip bottom>
                <template v-slot:activator="{ on: tooltip }">
                  <button
                    type="button"
                    class="v-pagination__navigation"
                    v-bind="attrs"
                    v-on="{ ...tooltip, ...menu }"
                    style="
                      height: 38px !important;
                      width: 38px !important;
                      margin: 10px 8px 0px 0px !important;
                      background-color: #424242;
                    "
                  >
                    <i aria-hidden="true" class="v-icon notranslate mdi mdi-dots-vertical theme--dark"></i>
                  </button>
                </template>
                <span>{{ $t("List Actions") }}</span>
              </v-tooltip>
            </template>

            <v-list style="margin-top: 2px; margin-right: 2px">
              <!-- <v-list-item v-if="!isScanning" v-bind:disabled="isScanning" v-on:click="rescanCurrentListDialog.show = true">
                {{ $t("Rescan Meta Data") }}
              </v-list-item> -->
              <v-tooltip left v-bind:disabled="!isScanning">
                <template v-slot:activator="{ on }">
                  <span v-on="on">
                    <v-list-item v-bind:disabled="isScanning" v-on:click="rescanCurrentListDialog.show = true">
                      {{ $t("Rescan Meta Data") }}
                    </v-list-item>
                  </span>
                </template>
                {{ $t("scan already in progress") }}
              </v-tooltip>
              <v-list-item v-on:click="copyInfo(itemsFiltered)">
                {{ $t("Copy Info") }}
              </v-list-item>
              <v-list-item v-on:click="startTrailerShow(itemsFiltered, false)">
                {{ $t("Start Trailer Show (Ordered)") }}
              </v-list-item>
              <v-list-item v-on:click="startTrailerShow(itemsFiltered, true)">
                {{ $t("Start Trailer Show (Randomized)") }}
              </v-list-item>
            </v-list>
          </v-menu>
        </div>

        <!-- workaround - else the mk-pagination would fuck off to the right when sidenav is shown -->
        <div
          v-if="$shared.sidenav"
          v-bind:style="{
            width: `${$shared.sidenav ? '320px!important' : '0px!important'}`,
          }"
        ></div>
      </template>

      <!-- Top Row for Series Episodes - showing the series title -->
      <template v-if="Series_id_Movies_Owner">
        <div
          style="
            flex-grow: 1;

            display: flex;
            flex-direction: row;
            flex-wrap: nowrap;
            justify-content: flex-start;
            align-items: center;
            align-content: center;

            margin-left: 9px;
          "
        >
          <div style="flex: 0 1 auto; flex-grow: 1; flex-shrink: 1; flex-basis: auto">
            <v-list-item-title class="headline mb-2" style="margin-bottom: 0px !important; margin-top: 8px">
              <div style="display: flex; min-height: 30px">
                <div style="overflow: hidden; text-overflow: ellipsis">
                  {{ series.item.Name }}
                  <span>
                    <span
                      v-bind:class="{
                        'mk-search-highlight': $shared.filterYearsActive,
                      }"
                    >
                      {{ series.item.yearDisplay }}
                    </span>
                  </span>
                </div>
              </div>
            </v-list-item-title>
            <v-list-item-subtitle style="margin-bottom: 4px; min-height: 18px; color: rgba(255, 255, 255, 0.7)">
              {{ series.item.Name2 }}
            </v-list-item-subtitle>
          </div>
          <v-spacer></v-spacer>
          <div>
            <div
              class="headline mb-2"
              style="margin-right: 16px; margin-left: 0px; margin-bottom: 0px !important"
              v-if="series.item.IMDB_rating_defaultDisplay"
            >
              <v-icon small color="amber" style="padding-bottom: 4px">mdi-star</v-icon>
              <a
                class="headline mb-2 mk-clickable"
                v-on:click.stop="onShowSeriesIMDBRatingHeatmapDialog(series.item)"
                >{{ series.item.IMDB_rating_defaultDisplay }}</a
              >
              <span
                v-if="series.item.IMDB_metacriticScore"
                v-bind:class="helpers.getMetaCriticClass(series.item.IMDB_metacriticScore)"
                style="padding: 4px; margin-left: 4px"
                >{{ series.item.IMDB_metacriticScore }}</span
              >
            </div>
            <v-row style="margin: 0px -12px">
              <div class="flex-grow-1"></div>

              <div v-on:click.stop="">
                <star-rating
                  v-bind:increment="0.5"
                  v-bind:max-rating="5"
                  v-bind:star-size="16"
                  v-model="series.item.Rating"
                  v-bind:clearable="true"
                  v-bind:show-rating="false"
                  inactive-color="grey"
                  active-color="#ffc107"
                  style="margin-right: 26px; padding: 0px !important"
                  v-bind:star-points="[7, 3, 6, 6, 2, 6, 5, 8, 4, 12, 7, 10, 10, 12, 9, 8, 12, 6, 8, 6]"
                  v-bind:glow="1"
                  v-on:rating-selected="changeRating(series.item)"
                ></star-rating>
              </div>
            </v-row>
          </div>
        </div>
        <!-- workaround - else the mk-pagination would fuck off to the right when sidenav is shown -->
        <div
          v-if="$shared.sidenav"
          v-bind:style="{
            width: `${$shared.sidenav ? '320px!important' : '0px!important'}`,
          }"
        ></div>
      </template>

      <!-- Second Top Row for Series Episodes - showing Sort-Select and Navigation -->
      <template v-if="Series_id_Movies_Owner">
        <div style="width: 100%; display: flex">
          <v-select
            class="mk-v-select-dynamic-width"
            solo
            clearable
            dense
            v-bind:items="sortAblesFiltered"
            item-text="DescriptionTranslated"
            item-value="Field"
            v-model="$shared.sortField"
            v-bind:label="$t('Sort')"
            style="margin-left: 150px; margin-top: 8px; max-width: 320px; height: 40px"
            v-on:change="onSortChanged"
          >
            <template v-slot:selection="{ item }">
              <span class="grey--text caption" style="margin-right: 8px">{{ $t("Sort by") }}</span>
              <span>{{ $t(item.Description) }}</span>
            </template>
          </v-select>

          <v-spacer></v-spacer>

          <!-- TOP PAGINATION -->
          <div v-if="numPages" style="display: flex; align-items: flex-start">
            <mk-pagination
              v-bind:length="numPages"
              v-bind:pages="paginationItems"
              v-model="$shared.currentPage"
            ></mk-pagination>

            <!-- LIST MENU -->
            <v-menu bottom right offset-y>
              <template v-slot:activator="{ on: menu, attrs }">
                <v-tooltip bottom>
                  <template v-slot:activator="{ on: tooltip }">
                    <button
                      type="button"
                      class="v-pagination__navigation"
                      v-bind="attrs"
                      v-on="{ ...tooltip, ...menu }"
                      style="
                        height: 38px !important;
                        width: 38px !important;
                        margin: 10px 8px 0px 0px !important;
                        background-color: #424242;
                      "
                    >
                      <i aria-hidden="true" class="v-icon notranslate mdi mdi-dots-vertical theme--dark"></i>
                    </button>
                  </template>
                  <span>{{ $t("List Actions") }}</span>
                </v-tooltip>
              </template>

              <v-list style="margin-top: 2px; margin-right: 2px">
                <!-- <v-list-item v-if="!isScanning" v-bind:disabled="isScanning" v-on:click="rescanCurrentListDialog.show = true">
                  {{ $t("Rescan Meta Data") }}
                </v-list-item> -->
                <v-tooltip left v-bind:disabled="!isScanning">
                  <template v-slot:activator="{ on }">
                    <span v-on="on">
                      <v-list-item v-bind:disabled="isScanning" v-on:click="rescanCurrentListDialog.show = true">
                        {{ $t("Rescan Meta Data") }}
                      </v-list-item>
                    </span>
                  </template>
                  {{ $t("scan already in progress") }}
                </v-tooltip>
                <v-list-item v-on:click="copyInfo(itemsFiltered)">
                  {{ $t("Copy Info") }}
                </v-list-item>
                <v-list-item v-on:click="startTrailerShow(itemsFiltered, false)">
                  {{ $t("Start Trailer Show (Ordered)") }}
                </v-list-item>
                <v-list-item v-on:click="startTrailerShow(itemsFiltered, true)">
                  {{ $t("Start Trailer Show (Randomized)") }}
                </v-list-item>
              </v-list>
            </v-menu>
          </div>

          <!-- workaround - else the mk-pagination would fuck off to the right when sidenav is shown -->
          <div
            v-if="$shared.sidenav"
            v-bind:style="{
              width: `${$shared.sidenav ? '320px!important' : '0px!important'}`,
            }"
          ></div>
        </div>
      </template>
    </v-row>

    <!-- mk-scrollcontainer -->
    <v-container
      class="pa-2"
      style="max-width: 100% !important"
      v-bind:style="{ 'margin-top': Series_id_Movies_Owner ? '122px' : '60px' }"
    >
      <v-row v-for="(mediaItem, i) in itemsFilteredPaginated" v-bind:key="i">
        <v-col style="padding-bottom: 0px">
          <mk-media-item-card
            v-bind:mediaItem="mediaItem"
            v-bind:isScanning="isScanning"
            v-bind:isInDialog="false"
            v-bind:allowMediaItemClick="true"
            v-bind:allowEditButtons="true"
            v-on:mediaItemEvent="onMICmediaItemEvent"
          ></mk-media-item-card>
        </v-col>
      </v-row>

      <!-- BOTTOM PAGINATION -->
      <v-row style="margin-bottom: 0px">
        <v-spacer></v-spacer>
        <div v-if="numPages" style="margin-right: 4px">
          <!-- <v-pagination v-bind:length="numPages" v-model="$shared.currentPage" total-visible="7"></v-pagination> -->
          <mk-pagination
            v-bind:length="numPages"
            v-bind:pages="paginationItems"
            v-model="$shared.currentPage"
            style="margin-right: 4px"
          ></mk-pagination>
        </div>
      </v-row>
    </v-container>

    <!-- MediaPropertyDialog based dialogs -->
    <mk-age-rating-dialog
      ref="ageRatingDialog"
      v-bind:mediaType="mediatype"
      v-bind:Series_id_Movies_Owner="MediaPropertyDialog_Series_id_Movies_Owner"
      v-bind:Series_Name="series.item.Name"
      v-bind:Series_Year_Display="series.item.yearDisplay"
      propertyTypeKey="age-rating"
      v-bind:show="ageRatingDialog.show"
      v-bind:isInDialog="ageRatingDialog.isInDialog"
      v-bind:propertyValue="ageRatingDialog.Age_Rating"
      v-bind:propertyValueDisplayText="ageRatingDialog.Age_Rating"
      v-on:close="onAgeRatingDialogClose"
      v-on:mediaItemEvent="onMICmediaItemEvent"
    ></mk-age-rating-dialog>

    <mk-audio-format-dialog
      ref="audioFormatDialog"
      v-bind:mediaType="mediatype"
      v-bind:Series_id_Movies_Owner="MediaPropertyDialog_Series_id_Movies_Owner"
      v-bind:Series_Name="series.item.Name"
      v-bind:Series_Year_Display="series.item.yearDisplay"
      propertyTypeKey="audio-format"
      v-bind:show="audioFormatDialog.show"
      v-bind:isInDialog="audioFormatDialog.isInDialog"
      v-bind:propertyValue="audioFormatDialog.Audio_Format"
      v-bind:propertyValueDisplayText="audioFormatDialog.Audio_Format"
      v-on:close="onAudioFormatDialogClose"
      v-on:mediaItemEvent="onMICmediaItemEvent"
    ></mk-audio-format-dialog>

    <mk-audio-language-dialog
      ref="audioLanguageDialog"
      v-bind:mediaType="mediatype"
      v-bind:Series_id_Movies_Owner="MediaPropertyDialog_Series_id_Movies_Owner"
      v-bind:Series_Name="series.item.Name"
      v-bind:Series_Year_Display="series.item.yearDisplay"
      propertyTypeKey="audio-language"
      v-bind:show="audioLanguageDialog.show"
      v-bind:isInDialog="audioLanguageDialog.isInDialog"
      v-bind:propertyValue="audioLanguageDialog.Code"
      v-bind:propertyValueDisplayText="audioLanguageDialog.Code"
      v-on:close="onAudioLanguageDialogClose"
      v-on:mediaItemEvent="onMICmediaItemEvent"
    ></mk-audio-language-dialog>

    <mk-company-dialog
      ref="companyDialog"
      v-bind:mediaType="mediatype"
      v-bind:Series_id_Movies_Owner="MediaPropertyDialog_Series_id_Movies_Owner"
      v-bind:Series_Name="series.item.Name"
      v-bind:Series_Year_Display="series.item.yearDisplay"
      propertyTypeKey="company"
      v-bind:show="companyDialog.show"
      v-bind:isInDialog="companyDialog.isInDialog"
      v-bind:propertyValue="companyDialog.Company_Name"
      v-bind:propertyValueDisplayText="companyDialog.Company_Name"
      v-bind:imdbTconst="companyDialog.IMDB_Company_ID"
      v-on:close="onCompanyDialogClose"
      v-on:mediaItemEvent="onMICmediaItemEvent"
    ></mk-company-dialog>

    <mk-filming-location-dialog
      ref="filmingLocationDialog"
      v-bind:mediaType="mediatype"
      v-bind:Series_id_Movies_Owner="MediaPropertyDialog_Series_id_Movies_Owner"
      v-bind:Series_Name="series.item.Name"
      v-bind:Series_Year_Display="series.item.yearDisplay"
      propertyTypeKey="filming-location"
      v-bind:show="filmingLocationDialog.show"
      v-bind:isInDialog="filmingLocationDialog.isInDialog"
      v-bind:propertyValue="filmingLocationDialog.id_IMDB_Filming_Locations"
      v-bind:propertyValueDisplayText="filmingLocationDialog.Location"
      v-on:close="onFilmingLocationDialogClose"
      v-on:mediaItemEvent="onMICmediaItemEvent"
    ></mk-filming-location-dialog>

    <mk-genre-dialog
      ref="genreDialog"
      v-bind:mediaType="mediatype"
      v-bind:Series_id_Movies_Owner="MediaPropertyDialog_Series_id_Movies_Owner"
      v-bind:Series_Name="series.item.Name"
      v-bind:Series_Year_Display="series.item.yearDisplay"
      propertyTypeKey="genre"
      v-bind:show="genreDialog.show"
      v-bind:isInDialog="genreDialog.isInDialog"
      v-bind:propertyValue="genreDialog.name"
      v-bind:propertyValueDisplayText="genreDialog.translated"
      v-on:close="onGenreDialogClose"
      v-on:mediaItemEvent="onMICmediaItemEvent"
    ></mk-genre-dialog>

    <mk-person-dialog
      ref="personDialog"
      v-bind:mediaType="mediatype"
      v-bind:show="personDialog.show"
      v-bind:isInDialog="personDialog.isInDialog"
      v-bind:Series_id_Movies_Owner="MediaPropertyDialog_Series_id_Movies_Owner"
      v-bind:Series_Name="series.item.Name"
      v-bind:Series_Year_Display="series.item.yearDisplay"
      propertyTypeKey="person"
      v-bind:propertyValue="personDialog.IMDB_Person_ID"
      v-bind:propertyValueDisplayText="personDialog.Person_Name"
      v-bind:imdbTconst="personDialog.IMDB_Person_ID"
      v-on:close="onPersonDialogClose"
      v-on:mediaItemEvent="onMICmediaItemEvent"
    ></mk-person-dialog>

    <mk-plot-keyword-dialog
      ref="plotKeywordDialog"
      v-bind:mediaType="mediatype"
      v-bind:Series_id_Movies_Owner="MediaPropertyDialog_Series_id_Movies_Owner"
      v-bind:Series_Name="series.item.Name"
      v-bind:Series_Year_Display="series.item.yearDisplay"
      propertyTypeKey="plot-keyword"
      v-bind:show="plotKeywordDialog.show"
      v-bind:isInDialog="plotKeywordDialog.isInDialog"
      v-bind:propertyValue="plotKeywordDialog.id_IMDB_Plot_Keywords"
      v-bind:propertyValueDisplayText="plotKeywordDialog.Keyword"
      v-on:close="onPlotKeywordDialogClose"
      v-on:mediaItemEvent="onMICmediaItemEvent"
    ></mk-plot-keyword-dialog>

    <mk-release-attribute-dialog
      ref="releaseAttributeDialog"
      v-bind:mediaType="mediatype"
      v-bind:show="releaseAttributeDialog.show"
      v-bind:isInDialog="releaseAttributeDialog.isInDialog"
      v-bind:Series_id_Movies_Owner="MediaPropertyDialog_Series_id_Movies_Owner"
      v-bind:Series_Name="series.item.Name"
      v-bind:Series_Year_Display="series.item.yearDisplay"
      propertyTypeKey="release-attribute"
      v-bind:propertyValue="releaseAttributeDialog.ReleaseAttribute"
      v-bind:propertyValueDisplayText="releaseAttributeDialog.ReleaseAttribute"
      v-on:close="releaseAttributeDialog.show = false"
      v-on:mediaItemEvent="onMICmediaItemEvent"
    ></mk-release-attribute-dialog>

    <mk-subtitle-language-dialog
      ref="subtitleLanguageDialog"
      v-bind:mediaType="mediatype"
      v-bind:Series_id_Movies_Owner="MediaPropertyDialog_Series_id_Movies_Owner"
      v-bind:Series_Name="series.item.Name"
      v-bind:Series_Year_Display="series.item.yearDisplay"
      propertyTypeKey="subtitle-language"
      v-bind:show="subtitleLanguageDialog.show"
      v-bind:isInDialog="subtitleLanguageDialog.isInDialog"
      v-bind:propertyValue="subtitleLanguageDialog.Code"
      v-bind:propertyValueDisplayText="subtitleLanguageDialog.Code"
      v-on:close="onSubtitleLanguageDialogClose"
      v-on:mediaItemEvent="onMICmediaItemEvent"
    ></mk-subtitle-language-dialog>

    <mk-video-encoder-dialog
      ref="videoEncoderDialog"
      v-bind:mediaType="mediatype"
      v-bind:show="videoEncoderDialog.show"
      v-bind:isInDialog="videoEncoderDialog.isInDialog"
      v-bind:Series_id_Movies_Owner="MediaPropertyDialog_Series_id_Movies_Owner"
      v-bind:Series_Name="series.item.Name"
      v-bind:Series_Year_Display="series.item.yearDisplay"
      propertyTypeKey="video-encoder"
      v-bind:propertyValue="videoEncoderDialog.Video_Encoder"
      v-bind:propertyValueDisplayText="videoEncoderDialog.Video_Encoder"
      v-on:close="onVideoEncoderDialogClose"
      v-on:mediaItemEvent="onMICmediaItemEvent"
    ></mk-video-encoder-dialog>

    <mk-video-quality-dialog
      ref="videoQualityDialog"
      v-bind:mediaType="mediatype"
      v-bind:show="videoQualityDialog.show"
      v-bind:isInDialog="videoQualityDialog.isInDialog"
      v-bind:Series_id_Movies_Owner="MediaPropertyDialog_Series_id_Movies_Owner"
      v-bind:Series_Name="series.item.Name"
      v-bind:Series_Year_Display="series.item.yearDisplay"
      propertyTypeKey="video-quality"
      v-bind:propertyValue="videoQualityDialog.MI_Qualities_Item"
      v-bind:propertyValueDisplayText="
        videoQualityDialog.MI_Qualities_Item ? videoQualityDialog.MI_Qualities_Item.MI_Quality : null
      "
      v-on:close="onVideoQualityDialogClose"
      v-on:mediaItemEvent="onMICmediaItemEvent"
    ></mk-video-quality-dialog>

    <!-- Other Dialogs -->
    <mk-chat-gpt-dialog
      ref="chatGPTDialog"
      v-bind:show="chatGPTDialog.show"
      v-on:close="onChatGPTDialogClose"
      v-on:ok="onChatGPTDialogOK"
      v-on:mediaItemEvent="onMICmediaItemEvent"
    ></mk-chat-gpt-dialog>

    <mk-list-dialog
      v-bind:show="listDialog.show"
      v-bind:title="listDialog.title"
      v-bind:movie="listDialog.movie"
      v-bind:lists="listDialog.lists"
      v-bind:allowUseExistingLists="listDialog.allowUseExistingLists"
      v-bind:allowCreateNewList="listDialog.allowCreateNewList"
      v-bind:createNewList="listDialog.createNewList"
      v-on:ok="onListDialogOK"
      v-on:cancel="onListDialogCancel"
    ></mk-list-dialog>

    <mk-video-player-dialog
      v-bind:show="videoPlayerDialog.show"
      v-bind:isLoading="videoPlayerDialog.isLoading"
      v-bind:showActualPlayer="videoPlayerDialog.showActualPlayer"
      v-bind:src="videoPlayerDialog.videoURL"
      v-bind:trailerShow="trailerShow"
      v-on:close="onVideoPlayerDialogClose"
      v-on:trailer-show-previous="onTrailerShowPrevious"
      v-on:trailer-show-next="onTrailerShowNext"
      v-on:trailer-show-add-movie-to-list="onTrailerShowAddMovieToList"
      v-on:trailer-show-close-and-search-movie="onTrailerShowCloseAndSearchMovie"
      v-on:mediaItemEvent="onMICmediaItemEvent"
    ></mk-video-player-dialog>

    <mk-local-video-player-dialog
      v-bind:show="localVideoPlayerDialog.show"
      v-bind:isLoading="localVideoPlayerDialog.isLoading"
      v-bind:showActualPlayer="localVideoPlayerDialog.showActualPlayer"
      v-bind:videoURL="localVideoPlayerDialog.videoURL"
      v-bind:slateURL="localVideoPlayerDialog.slate"
      v-bind:mimeType="localVideoPlayerDialog.mimeType"
      v-bind:trailerShow="trailerShow"
      v-on:close="onLocalVideoPlayerDialogClose"
      v-on:trailer-show-previous="onTrailerShowPrevious"
      v-on:trailer-show-next="onTrailerShowNext"
      v-on:trailer-show-add-movie-to-list="onTrailerShowAddMovieToList"
      v-on:trailer-show-close-and-search-movie="onTrailerShowCloseAndSearchMovie"
      v-on:mediaItemEvent="onMICmediaItemEvent"
    ></mk-local-video-player-dialog>

    <mk-link-imdb-dialog
      ref="linkIMDBDialog"
      v-bind:show="linkIMDBDialog.show"
      v-bind:showUnlink="linkIMDBDialog.showUnlink"
      v-bind:filePath="linkIMDBDialog.filePath"
      v-on:close="onLinkIMDBDialogClose"
      v-on:selected="onLinkIMDBDialogSelected"
      v-on:unlink="onLinkIMDBDialogUnlink"
    ></mk-link-imdb-dialog>

    <mk-rating-demographics-dialog
      ref="ratingDemographicsDialog"
      v-bind:show="ratingDemographicsDialog.show"
      v-bind:title="ratingDemographicsDialog.title"
      v-on:close="ratingDemographicsDialog.show = false"
    ></mk-rating-demographics-dialog>

    <mk-edit-media-item-dialog
      ref="editMediaItemDialog"
      v-bind:show="editMediaItemDialog.show"
      v-bind:mediaItem="editMediaItemDialog.mediaItem"
      v-bind:caption="'Edit Movie'"
      v-on:cancel="onEditMediaItemDialogCancel"
      v-on:ok="onEditMediaItemDialogOK"
    >
    </mk-edit-media-item-dialog>

    <mk-delete-media-dialog
      v-bind:show="deleteMediaDialog.show"
      v-bind:title="$t(deleteMediaDialog.Title)"
      v-bind:question="$t(deleteMediaDialog.Message, { ItemName: deleteMediaDialog.ItemName })"
      v-bind:additionalTextBlocks="deleteMediaDialog.additionalTextBlocks"
      v-bind:yes="$t('YES DELETE')"
      v-bind:no="$t('No')"
      v-bind:ok="$t('Open Storage Location')"
      v-bind:loading="deleteMediaDialog.loading"
      v-bind:alertText="deleteMediaDialog.alertText"
      v-bind:alertType="deleteMediaDialog.alertType"
      yesColor="error"
      noColor="secondary"
      v-on:yes="onDeleteMediaDialogYes"
      v-on:no="onDeleteMediaDialogCancel"
      v-on:ok="onDeleteMediaDialogOK"
    ></mk-delete-media-dialog>

    <mk-rescan-current-list-dialog
      v-bind:show="rescanCurrentListDialog.show"
      v-bind:title="$t('Rescan metadata of the current list')"
      v-bind:question="$t('Do you want to rescan the metadata for each entry in the current list?')"
      v-bind:cancel="$t('Cancel')"
      v-bind:ok="$t('Rescan Meta Data')"
      okColor="primary"
      cancelColor="secondary"
      v-on:ok="onRescanCurrentListDialogOK"
      v-on:cancel="rescanCurrentListDialog.show = false"
    ></mk-rescan-current-list-dialog>

    <mk-series-imdb-rating-heatmap-dialog
      ref="SeriesIMDBRatingHeatmapDialog"
      v-bind:show="SeriesIMDBRatingHeatmapDialog.show"
      v-bind:data="SeriesIMDBRatingHeatmapDialog.data"
      v-bind:isLoading="SeriesIMDBRatingHeatmapDialog.isLoading"
      v-bind:title="SeriesIMDBRatingHeatmapDialog.title"
      v-on:close="onCloseSeriesIMDBRatingHeatmapDialog"
      v-on:mediaItemEvent="onMICmediaItemEvent"
    >
    </mk-series-imdb-rating-heatmap-dialog>
  </div>
</template>

<script>
const fs = require("fs-extra");

import StarRating from "vue-star-rating";
import * as _ from "lodash";

import * as store from "@/store";
import { eventBus } from "@/main";
import { scrapeIMDBTrailerMediaURLs, scrapeIMDBmainPageData } from "@/imdb-scraper";

import MediaItemCard from "@/components/shared/MediaItemCard.vue";

import EditMediaItemDialog from "@/components/dialogs/EditMediaItemDialog.vue";
import ListDialog from "@/components/dialogs/ListDialog.vue";
import VideoPlayerDialog from "@/components/dialogs/VideoPlayerDialog.vue";
import LocalVideoPlayerDialog from "@/components/dialogs/LocalVideoPlayerDialog.vue";
import LinkIMDBDialog from "@/components/dialogs/LinkIMDBDialog.vue";
import Pagination from "@/components/shared/Pagination.vue";
import RatingDemographicsDialog from "@/components/dialogs/RatingDemographicsDialog";
import Dialog from "@/components/dialogs/Dialog.vue";
import ChatGPTDialog from "@/components/dialogs/ChatGPTDialog.vue";

import MediaPropertyDialog from "@/components/dialogs/MediaPropertyDialog.vue";
import SeriesIMDBRatingHeatmapDialog from "@/components/dialogs/SeriesIMDBRatingHeatmapDialog.vue";

const { shell } = require("@electron/remote");

const moment = require("moment");

import * as helpers from "@/helpers/helpers";

const logger = require("../helpers/logger");

export default {
  components: {
    "mk-media-item-card": MediaItemCard,

    "star-rating": StarRating,
    "mk-pagination": Pagination,

    "mk-list-dialog": ListDialog,
    "mk-video-player-dialog": VideoPlayerDialog,
    "mk-local-video-player-dialog": LocalVideoPlayerDialog,
    "mk-link-imdb-dialog": LinkIMDBDialog,
    "mk-rating-demographics-dialog": RatingDemographicsDialog,
    "mk-edit-media-item-dialog": EditMediaItemDialog,

    "mk-delete-media-dialog": Dialog,
    "mk-rescan-current-list-dialog": Dialog,

    "mk-chat-gpt-dialog": ChatGPTDialog,

    "mk-age-rating-dialog": MediaPropertyDialog,
    "mk-audio-format-dialog": MediaPropertyDialog,
    "mk-audio-language-dialog": MediaPropertyDialog,
    "mk-company-dialog": MediaPropertyDialog,
    "mk-filming-location-dialog": MediaPropertyDialog,
    "mk-genre-dialog": MediaPropertyDialog,
    "mk-person-dialog": MediaPropertyDialog,
    "mk-plot-keyword-dialog": MediaPropertyDialog,
    "mk-release-attribute-dialog": MediaPropertyDialog,
    "mk-subtitle-language-dialog": MediaPropertyDialog,
    "mk-video-encoder-dialog": MediaPropertyDialog,
    "mk-video-quality-dialog": MediaPropertyDialog,

    "mk-series-imdb-rating-heatmap-dialog": SeriesIMDBRatingHeatmapDialog,
  },

  data: () => ({
    items: [],
    itemsPerPage: 20,

    currentTime: moment(),

    loadFilterValuesFromStorage: false,

    fetchFiltersIteration: 0, // detect another fetch even when one is already running

    sortAbles: [
      { Field: "Season_and_Episode", Description: "Season and Episode", specificMediaType: ["Episodes"] },
      {
        Field: "Name",
        Description: "Title",
        specificMediaType: ["Movies", "Series", "Episodes"],
      },
      {
        Field: "IMDB_rating_default",
        Description: "IMDB Rating",
        specificMediaType: ["Movies", "Series", "Episodes"],
      },
      {
        Field: "IMDB_metacriticScore",
        Description: "Metacritic Score",
        specificMediaType: ["Movies"],
      },
      {
        Field: "Rating",
        Description: "My Rating",
        specificMediaType: ["Movies", "Series", "Episodes"],
      },
      {
        Field: "startYear",
        Description: "Release Year",
        specificMediaType: ["Movies", "Series", "Episodes"],
      },
      {
        Field: "created_at",
        Description: "Imported at",
        specificMediaType: ["Movies", "Episodes"],
      },
      {
        Field: "updated_at",
        Description: "Imported / Updated at",
        specificMediaType: ["Series"],
      },
      {
        Field: "last_access_at",
        Description: "Last Access at",
        specificMediaType: ["Movies", "Series", "Episodes"],
      },
    ],

    series: {
      isLoading: false,
      item: {},
    },

    MediaPropertyDialog_Series_id_Movies_Owner: null,

    // Dialogs based on MediaPropertyDialog
    ageRatingDialog: {
      show: false,
      Age_Rating: null,
      Series_id_Movies_Owner: null,
      isInDialog: false,
    },

    audioFormatDialog: {
      show: false,
      Audio_Format: null,
      Series_id_Movies_Owner: null,
      isInDialog: false,
    },

    audioLanguageDialog: {
      show: false,
      Code: null,
      Series_id_Movies_Owner: null,
      isInDialog: false,
    },

    companyDialog: {
      show: false,
      IMDB_Company_ID: null,
      Company_Name: null,
      Series_id_Movies_Owner: null,
      isInDialog: false,
    },

    filmingLocationDialog: {
      show: false,
      id_IMDB_Filming_Locations: null,
      Location: null,
      Series_id_Movies_Owner: null,
      isInDialog: false,
    },

    genreDialog: {
      show: false,
      name: null,
      translated: null,
      Series_id_Movies_Owner: null,
      isInDialog: false,
    },

    personDialog: {
      show: false,
      IMDB_Person_ID: null,
      Person_Name: null,
      Series_id_Movies_Owner: null,
      isInDialog: false,
    },

    plotKeywordDialog: {
      show: false,
      id_IMDB_Plot_Keywords: null,
      Keyword: null,
      Series_id_Movies_Owner: null,
      isInDialog: false,
    },

    releaseAttributeDialog: {
      show: false,
      ReleaseAttribute: null,
      movie: null,
      Series_id_Movies_Owner: null,
      isInDialog: false,
    },

    subtitleLanguageDialog: {
      show: false,
      Code: null,
      Series_id_Movies_Owner: null,
      isInDialog: false,
    },

    videoEncoderDialog: {
      show: false,
      Video_Encoder: null,
      Series_id_Movies_Owner: null,
      isInDialog: false,
    },

    videoQualityDialog: {
      show: false,
      MI_Qualities_Item: null,
      Series_id_Movies_Owner: null,
      isInDialog: false,
    },

    // other Dialogs
    chatGPTDialog: {
      show: false,
    },

    listDialog: {
      mode: "add",
      title: "",
      show: false,
      movie: null,
      lists: [],
      allowUseExistingLists: false,
      allowCreateNewList: false,
      lastChosenListID: null,
    },

    videoPlayerDialog: {
      show: false,
      isLoading: false,
      showActualPlayer: false,
      videoURL: null,
    },

    localVideoPlayerDialog: {
      show: false,
      isLoading: false,
      showActualPlayer: false,
      videoURL: null,
      slateURL: null,
      mimeType: null,
    },

    trailerShow: {
      remaining: [],
      current: null,
      history: [],
    },

    linkIMDBDialog: {
      show: false,
      showUnlink: false,
      item: {},
    },

    ratingDemographicsDialog: {
      show: false,
      title: null,
    },

    deleteMediaDialog: {
      show: false,
      item: null,
      Title: null,
      Message: null,
      ItemName: null,
      loading: false,
      location: null,
    },

    rescanCurrentListDialog: {
      show: false,
    },

    editMediaItemDialog: {
      show: false,
      mediaItem: null,
    },

    SeriesIMDBRatingHeatmapDialog: {
      show: false,
      data: null,
      title: null,
      isLoading: false,
    },
  }),

  watch: {
    async mediatype(newValue, oldValue) {
      logger.log(
        "[MediaList.mediatype] newValue:",
        newValue,
        "oldValue:",
        oldValue,
        "this.specificMediaType:",
        this.specificMediaType
      );

      // eventBus.refetchMedia();
      this.refetchMedia({ dontStoreFilters: true });
    },

    async Series_id_Movies_Owner(newValue, oldValue) {
      logger.log("[MediaList.Series_id_Movies_Owner] newValue:", newValue, "oldValue:", oldValue);

      await this.fetchSeriesOwner(newValue);

      // eventBus.refetchMedia();
      this.refetchMedia({});
    },

    currentPage(newValue, oldValue) {
      logger.log("[currentPage] newValue:", newValue, "oldValue:", oldValue);

      if (!newValue) {
        this.$shared.currentPage = oldValue || 1;
        return;
      }

      store.saveCurrentPage(this.specificMediaType, this.Series_id_Movies_Owner);

      this.completelyFetchMedia();

      window.scrollTo(0, 0);
    },

    sortField() {
      this.completelyFetchMedia();
    },
  },

  props: ["mediatype", "Series_id_Movies_Owner"],

  computed: {
    helpers() {
      return helpers;
    },

    isScanning() {
      return this.$shared.isScanning;
    },

    searchText() {
      if (this.specificMediaType == "Episodes") {
        // we don't filter and don't highlight searchText if we're listing Episodes
        return null;
      }
      return this.$shared.searchText;
    },

    numPages() {
      return Math.ceil(this.itemsFiltered.length / this.itemsPerPage);
    },

    sortField() {
      return this.$shared.sortField;
    },

    sortAblesFiltered() {
      return this.sortAbles.filter((item) => {
        return item.specificMediaType.includes(this.specificMediaType);
      });
    },

    paginationItems() {
      const result = [];

      let page = 1;

      for (let i = 0; i < this.itemsFiltered.length; i += this.itemsPerPage) {
        const currentItem = this.itemsFiltered[i];

        let detailInfo = null;

        switch (this.$shared.sortField) {
          case "Name":
            detailInfo = currentItem.Name.substring(0, 1);
            break;
          case "IMDB_rating_default":
            detailInfo = currentItem.IMDB_rating_defaultFormatted;
            break;
          case "IMDB_metacriticScore":
            detailInfo = currentItem.IMDB_metacriticScore;
            break;
          case "Rating":
            detailInfo = currentItem.Rating;
            break;
          case "startYear":
            detailInfo = currentItem.startYear;
            break;
          case "created_at":
            detailInfo = currentItem.created_at ? currentItem.created_at.replace(/\d+:\d+:\d+/, "") : "";
            break;
          case "updated_at":
            detailInfo = currentItem.updated_at ? currentItem.updated_at.replace(/\d+:\d+:\d+/, "") : "";
            break;
          case "last_access_at":
            detailInfo = currentItem.last_access_at ? currentItem.last_access_at.replace(/\d+:\d+:\d+/, "") : "";
            break;
          case "Season_and_Episode":
            detailInfo = `${currentItem.Series_Season_Displaytext}.${currentItem.Series_Episodes_Displaytext}`;
            break;
        }

        result.push({
          page,
          displayText: `${page} / ${this.numPages}${detailInfo ? " | " + detailInfo : ""}`,
          numPages: this.numPages,
          detailInfo,
        });

        page++;
      }

      logger.log("[paginationItems] result:", result);

      return result;
    },

    visiblePages() {
      return Math.min(this.numPages, 7);
    },

    currentPage() {
      return this.$shared.currentPage;
    },

    itemsFilteredPaginated() {
      return this.itemsFiltered.slice(
        (this.$shared.currentPage - 1) * this.itemsPerPage,
        this.$shared.currentPage * this.itemsPerPage
      );
    },

    filtersList() {
      // return "*" if at least one filter is set

      const filtersList = [];

      if (this.$shared.searchText) {
        filtersList.push(this.$t("Search"));
      }

      if (this.$shared.filterSourcePathsActive) {
        filtersList.push(this.$t("Source Paths"));
      }

      if (this.$shared.filterGenresActive) {
        filtersList.push(`${this.$t("Genres")}${this.$shared.filters.filterSettings.filterGenresAND ? " ߷" : ""}`);
      }

      if (this.$shared.filterAgeRatingsActive) {
        filtersList.push(this.$t("Age Ratings"));
      }

      if (this.$shared.filterRatingsActive) {
        filtersList.push(this.$t("My Ratings"));
      }

      if (this.$shared.filterListsActive) {
        filtersList.push(this.$t("My Lists"));
      }

      if (this.$shared.filterParentalAdvisoryActive) {
        filtersList.push(this.$t("Content Advisories"));
      }

      if (this.$shared.filterPersonsActive) {
        filtersList.push(`${this.$t("People")}${this.$shared.filters.filterSettings.filterPersonsAND ? " ߷" : ""}`);
      }

      if (this.$shared.filterYearsActive) {
        filtersList.push(this.$t("Release Years"));
      }

      if (this.$shared.filterQualitiesActive) {
        filtersList.push(this.$t("Video Quality"));
      }

      if (this.$shared.filterVideoEncodersActive) {
        filtersList.push(this.$t("Video Encoders"));
      }

      if (this.$shared.filterCompaniesActive) {
        filtersList.push(
          `${this.$t("Companies")}${this.$shared.filters.filterSettings.filterCompaniesAND ? " ߷" : ""}`
        );
      }

      if (this.$shared.filterAudioLanguagesActive) {
        filtersList.push(this.$t("Audio Languages"));
      }

      if (this.$shared.filterAudioFormatsActive) {
        filtersList.push(this.$t("Audio Formats"));
      }

      if (this.$shared.filterSubtitleLanguagesActive) {
        filtersList.push(this.$t("Subtitle Languages"));
      }

      if (this.$shared.filterReleaseAttributesActive) {
        filtersList.push(
          `${this.$t("Release Attributes")}${
            this.$shared.filters.filterSettings.filterReleaseAttributesAND ? " ߷" : ""
          }`
        );
      }

      if (this.$shared.filterIMDBPlotKeywordsActive) {
        filtersList.push(
          `${this.$t("Plot Keywords")}${this.$shared.filters.filterSettings.filterIMDBPlotKeywordsAND ? " ߷" : ""}`
        );
      }

      if (this.$shared.filterIMDBFilmingLocationsActive) {
        filtersList.push(
          `${this.$t("Filming Locations")}${
            this.$shared.filters.filterSettings.filterIMDBFilmingLocationsAND ? " ߷" : ""
          }`
        );
      }

      if (this.$shared.filterMetacriticScoreActive) {
        filtersList.push(this.$t("Metacritic Score"));
      }

      if (this.$shared.filterIMDBRatingsActive) {
        filtersList.push(this.$t("IMDB Ratings"));
      }

      if (this.$shared.filterDataQualityActive) {
        filtersList.push(
          `${this.$t("Data Quality")}${this.$shared.filters.filterSettings.filterDataQualityAND ? " ߷" : ""}`
        );
      }

      return filtersList;
    },

    itemsFiltered() {
      return this.items
        .filter((item) => {
          let isGood = true;

          if (this.searchText) {
            const searchTextLower = this.searchText.toLowerCase();
            const searchTextFiltered = /tt\d+/.test(searchTextLower)
              ? searchTextLower.match(/tt\d+/)[0]
              : searchTextLower;
            isGood = item.SearchSpace.includes(searchTextFiltered);
          }

          return isGood;
        })
        .sort((a, b) => {
          if (!this.$shared.sortField) {
            return 0; // nothing to sort
          }

          if (this.$shared.sortField === "Season_and_Episode") {
            // sort by Season_and_Episode
            const valA = `${a.Series_Season_Displaytext}.${a.Series_Episodes_Displaytext}`;
            const valB = `${b.Series_Season_Displaytext}.${b.Series_Episodes_Displaytext}`;

            return helpers.compare(valA, valB, false);
          }

          // Default sorting by a certain field
          const valA =
            typeof a[this.$shared.sortField] === "string" || a[this.$shared.sortField] instanceof String
              ? a[this.$shared.sortField].toLowerCase()
              : a[this.$shared.sortField];

          const valB =
            typeof b[this.$shared.sortField] === "string" || b[this.$shared.sortField] instanceof String
              ? b[this.$shared.sortField].toLowerCase()
              : b[this.$shared.sortField];

          const reverse = !(this.$shared.sortField === "Name");

          const primarySort = helpers.compare(valA, valB, reverse);

          if (!primarySort) {
            // equal by primary sort -> sort by Name
            return helpers.compare(a.Name.toLowerCase(), b.Name.toLowerCase(), false);
          }

          return primarySort;
        });
    },

    specificMediaType() {
      return this.mediatype === "series" ? (this.Series_id_Movies_Owner ? "Episodes" : "Series") : "Movies";
    },
  },

  methods: {
    moment() {
      return moment;
    },

    async fetchSeriesOwner(Series_id_Movies_Owner) {
      logger.log("[fetchSeriesOwner] Series_id_Movies_Owner:", Series_id_Movies_Owner);

      if (!Series_id_Movies_Owner) {
        this.series.item = {};
        this.series.isLoading = false;
      } else {
        try {
          this.series.isLoading = true;

          this.series.item = (
            await store.fetchMedia({
              $MediaType: "series",
              arr_id_Movies: [Series_id_Movies_Owner],
              minimumResultSet: false,
              $t: this.$local_t,
              filters: { filterSettings: {} },
              arr_IMDB_tconst: null,
              Series_id_Movies_Owner: null,
              specificMediaType: "Series",
              dontStoreFilters: true,
            })
          )[0];

          logger.log("[fetchSeriesOwner] fetched series item:", this.series.item);
        } finally {
          this.series.isLoading = false;
        }
      }
    },

    changeRating(movie) {
      logger.log("[changeRating] movie:", movie, " movie.Rating:", movie.Rating);

      const rating = movie.Rating;

      (async () => {
        if (!rating) {
          const arr_id_Movies = await store.clearRating(movie.id_Movies);

          this.items.forEach((movie) => {
            if (arr_id_Movies.findIndex((id_Movies) => movie.id_Movies === id_Movies) !== -1) {
              movie.Rating = null;
            }
          });
        } else {
          const arr_id_Movies = await store.setRating(movie.id_Movies, rating);

          this.items.forEach((movie2) => {
            if (arr_id_Movies.findIndex((id_Movies) => movie2.id_Movies === id_Movies) !== -1) {
              movie2.Rating = rating;
            }
          });
        }

        this.fetchFilters();
      })();
    },

    async ensureMovieExtras(movie) {
      if (!movie.extrasFetched) {
        const { lists, extras } = await store.getMovieDetails(movie.id_Movies);

        logger.log("[ensureMovieExtras] movie details:", { lists, extras });

        this.$set(movie, "lists", lists);
        this.$set(movie, "extras", extras);
        this.$set(movie, "extrasFetched", true);
      }
    },

    async selectItem(movie) {
      logger.log("[selectItem] movie:", movie);
      if (movie.selected) {
        movie.selected = false;
      } else {
        await this.ensureMovieExtras(movie);

        this.$set(movie, "selected", true);
      }
    },

    async launch(mediaItem) {
      if (mediaItem.specificMediaType == "Series") {
        this.$router.push(`/medialist/series/${mediaItem.id_Movies}`);
        return;
      }

      const start = moment();

      await store.launchMovie(mediaItem);

      const end = moment();

      logger.log("[launch] start:", start, "end:", end);

      logger.log("[launch] diff:", end.diff(start, "seconds"));

      let minimumWaitForSetAccess = await store.getMinimumWaitForSetAccess();

      logger.log("[launch] minimumWaitForSetAccess:", minimumWaitForSetAccess);

      if (minimumWaitForSetAccess) {
        minimumWaitForSetAccess = parseInt(minimumWaitForSetAccess);
      } else {
        minimumWaitForSetAccess = 0;
      }

      if (end.diff(start, "seconds") < minimumWaitForSetAccess) {
        logger.log("[launch] RUNTIME TOO SHORT");
        return;
      }

      logger.log("[launch] RUNTIME LONG ENOUGH");

      const arr_id_Movies = await store.setLastAccess(mediaItem.id_Movies);
      await this.updateCurrentTime();

      this.items.forEach((mov) => {
        if (arr_id_Movies.findIndex((id_Movies) => mov.id_Movies === id_Movies) !== -1) {
          this.$set(mov, "lastAccessMoment", this.currentTime.clone());
          this.$set(mov, "last_access_at", this.currentTime.toISOString());
        }
      });
    },

    copyInfo(movies) {
      const el = document.createElement("textarea");

      let info = "";

      for (const movie of movies) {
        if (info) {
          info += "\n\n";
        }

        if (movie.Rating) {
          info += helpers.getStarRatingString(movie.Rating);
          info += " ";
        }

        info += movie.Name;

        if (movie.startYear) {
          info += ` (${movie.startYear}`;

          if (movie.endYear) {
            info += `-${movie.endYear}`;
          }

          info += ")";
        }

        if (movie.IMDB_tconst) {
          info += `\nhttps://www.imdb.com/title/${movie.IMDB_tconst}`;
        }
      }

      el.value = info;
      el.setAttribute("readonly", "");
      el.style = { position: "absolute", left: "-9999px" };
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);

      eventBus.showSnackbar("info", this.$t("Info copied to clipboard"));
    },

    copyImdbTconst(mediaItem) {
      const el = document.createElement("textarea");

      el.value = mediaItem.IMDB_tconst;
      el.setAttribute("readonly", "");
      el.style = { position: "absolute", left: "-9999px" };
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);

      eventBus.showSnackbar("info", this.$t("Info copied to clipboard"));
    },

    addToList(item) {
      (async () => {
        this.listDialog.mode = "add";
        this.listDialog.lists = await store.fetchLists();

        this.listDialog.allowCreateNewList = false;
        this.listDialog.allowUseExistingLists = false;

        if (this.listDialog.lists && this.listDialog.lists.length > 0) {
          logger.log("[addToList] GOT existing lists");
          this.listDialog.allowUseExistingLists = true;

          eventBus.listDialogSetChosenMethod("useExistingLists");

          let last_chosen_id_Lists = this.listDialog.lastChosenListID;
          if (!this.listDialog.lists.find((list) => list.id_Lists === last_chosen_id_Lists)) {
            last_chosen_id_Lists = this.listDialog.lists[0].id_Lists;
          }

          eventBus.listDialogSetChosenList(last_chosen_id_Lists);
        } else {
          logger.log("[addToList] GOT NO existing lists");
          this.listDialog.allowUseExistingLists = false;
          eventBus.listDialogSetChosenMethod("createNewList");
        }

        this.listDialog.allowCreateNewList = true;

        this.listDialog.title = this.$t("Add to List");
        this.listDialog.movie = item;
        this.listDialog.show = true;
      })();
    },

    showTrailerGeneral(item) {
      // Fallback to a general dialog showing the site in an iframe
      const trailerURL = item.IMDB_Trailer_URL.replace("https://www.imdb.com", "");
      this.videoPlayerDialog.videoURL = `https://www.imdb.com${trailerURL}`;
      logger.log("[showTrailerGeneral] this.videoPlayerDialog.videoURL:", this.videoPlayerDialog.videoURL);

      this.videoPlayerDialog.showActualPlayer = false;

      // also close the local player if it is open
      this.localVideoPlayerDialog.show = false;
      this.localVideoPlayerDialog.isLoading = false;
      this.localVideoPlayerDialog.showActualPlayer = false;

      window.requestAnimationFrame(() => {
        this.videoPlayerDialog.showActualPlayer = true;
        this.videoPlayerDialog.isLoading = false;
        this.videoPlayerDialog.show = true;
      });
    },

    async showTrailer(item, trailerShow) {
      try {
        this.localVideoPlayerDialog.isLoading = true;
        this.videoPlayerDialog.isLoading = true;
        let trailerMediaURLs = await scrapeIMDBTrailerMediaURLs(
          `https://www.imdb.com${item.IMDB_Trailer_URL.replace("https://www.imdb.com", "")}`
        );

        if (trailerMediaURLs.errorcode === 404) {
          console.log("[showTrailer] IMDB_Trailer_URL yields 404, rescraping IMDB Main Page data...");
          const newIMDBMainPageData = await scrapeIMDBmainPageData(item, async () => {
            return false;
          });

          if (newIMDBMainPageData.$IMDB_Trailer_URL) {
            await store.updateMediaRecordField(
              item.id_Movies,
              "IMDB_Trailer_URL",
              newIMDBMainPageData.$IMDB_Trailer_URL
            );
            item.IMDB_Trailer_URL = newIMDBMainPageData.$IMDB_Trailer_URL;
            trailerMediaURLs = await scrapeIMDBTrailerMediaURLs(
              `https://www.imdb.com${item.IMDB_Trailer_URL.replace("https://www.imdb.com", "")}`
            );
          }
        }

        logger.log("[showTrailer] trailerMediaURLs:", trailerMediaURLs);

        const dontUseLocalPlayer = false; // set this to true in order to force an iframe player

        this.trailerShow = trailerShow;

        if (
          dontUseLocalPlayer ||
          !trailerMediaURLs ||
          !trailerMediaURLs.mediaURLs ||
          trailerMediaURLs.mediaURLs.length == 0
        ) {
          // Fallback to the more general player showing the IMDB site
          return this.showTrailerGeneral(item);
        }

        // We can show the local player and feed it an actual media URL (e.g. url to an mp4 file)
        const trailerMediaURL = store.selectBestQualityMediaURL(trailerMediaURLs.mediaURLs);

        logger.log("[showTrailer] selected best quality trailerMediaURL:", trailerMediaURL);

        this.localVideoPlayerDialog.videoURL = trailerMediaURL.mediaURL;
        this.localVideoPlayerDialog.mimeType = trailerMediaURL.mimeType;
        this.localVideoPlayerDialog.slateURL = trailerMediaURLs.slateURL;
        this.localVideoPlayerDialog.showActualPlayer = false;

        // also close the general player if it is open
        this.videoPlayerDialog.show = false;
        this.videoPlayerDialog.showActualPlayer = false;

        window.requestAnimationFrame(() => {
          this.localVideoPlayerDialog.showActualPlayer = true;
          this.localVideoPlayerDialog.show = true;
        });
      } catch (err) {
        eventBus.showSnackbar("error", err);
      } finally {
        this.localVideoPlayerDialog.isLoading = false;
        this.videoPlayerDialog.isLoading = false;
      }
    },

    removeFromList(item) {
      (async () => {
        this.listDialog.mode = "remove";
        this.listDialog.allowCreateNewList = false;
        this.listDialog.allowUseExistingLists = true;
        this.listDialog.lists = item.lists;
        this.listDialog.title = this.$t("Remove from List");
        this.listDialog.movie = item;
        this.listDialog.show = true;
        this.listDialog.lastChosenListID = null;

        eventBus.listDialogSetChosenMethod("useExistingLists");
        eventBus.listDialogSetChosenList(this.listDialog.lists[0].id_Lists);
      })();
    },

    onListDialogOK(data) {
      this.listDialog.show = false;

      logger.log("[onListDialogOK] data:", data);
      (async () => {
        try {
          if (!data.chosen_id_Lists && !data.newListName) {
            eventBus.showSnackbar("error", this.$t("list is missing"));
            return;
          }

          // Add to list
          if (this.listDialog.mode === "add") {
            if (data.chosenMethod === "createNewList") {
              data.chosen_id_Lists = await store.createList(data.newListName);
            }

            await store.addToList(data.chosen_id_Lists, this.listDialog.movie.id_Movies, false);

            const { lists } = await store.getMovieDetails(this.listDialog.movie.id_Movies);

            this.$set(this.listDialog.movie, "lists", lists);

            this.listDialog.lastChosenListID = data.chosen_id_Lists;

            eventBus.showSnackbar("success", this.$t("item added to list"));

            this.$shared.lastChangedFilter = "filterLists";
            await this.fetchFilters();
          }

          // Remove from list
          if (this.listDialog.mode == "remove") {
            if (!data.chosen_id_Lists) {
              eventBus.showSnackbar("error", this.$t("list is missing"));
              return;
            }

            await store.removeFromList(data.chosen_id_Lists, this.listDialog.movie.id_Movies);

            this.$shared.lastChangedFilter = "filterLists";

            // eventBus.refetchMedia(this.$shared.currentPage);
            this.refetchMedia({ setPage: this.$shared.currentPage });

            eventBus.showSnackbar("success", this.$t("item removed from list"));
          }
        } catch (err) {
          eventBus.showSnackbar("error", err);
        }
      })();
    },

    onListDialogCancel() {
      this.listDialog.show = false;
    },

    openChatGPTDialog() {
      if (!this.$refs.chatGPTDialog) {
        console.error("[openChatGPTDialog] this.$refs.chatGPTDialog is not available");
      } else {
        this.$refs.chatGPTDialog.init();
      }
      this.chatGPTDialog.show = true;
    },

    onChatGPTDialogClose() {
      this.chatGPTDialog.show = false;
    },

    onChatGPTDialogOK() {
      this.chatGPTDialog.show = false;
    },

    $local_t(key, payload) {
      return this.$t(key, payload);
    },

    /**
     * @param {Object} setFilter (optional):
     *                 key has value null: the filter will be refetched early
     *                 key has values: the filter items will be enabled
     * @param {Boolean} specificBySetFilter (optional) ONLY refetch the filter specified in setFilter
     * @param {Array} specificFilterNames (optional) yet another way to tell which filters to fetch; if truthy, ONLY refetch the filters specified by their name in this array
     */
    async fetchFilters(setFilter, specificBySetFilter, specificFilterNames) {
      // TODO: set a context (movies, series, episodes incl. id_series)
      //       also have this context in shared objects
      //       in the for-loop check if both contexts are the same, if not, cancel the filter fetch
      const fetchFiltersContext = JSON.stringify({
        mediatype: this.mediatype,
        specificMediaType: this.specificMediaType,
        Series_id_Movies_Owner: this.Series_id_Movies_Owner,
      });

      //logger.group("[Fetch Filters]");

      logger.debug("[fetchFilters] START, fetchFiltersContext:", fetchFiltersContext);

      try {
        // eventBus.showSidebarLoadingOverlay(true);
        const currentFetchFiltersIteration = ++this.fetchFiltersIteration;
        const logPrefix = `[fetchFilters][${currentFetchFiltersIteration}]`;

        this.$shared.isLoadingFilter = true;

        let filterGroups = JSON.parse(JSON.stringify(this.$shared.filterGroups));

        // put any filter in setFilter on top of the list (filters in setFilter are ones provided by dialogs, e.g. GenreDialog)
        logger.log(`${logPrefix} setFilter:`, setFilter);
        if (setFilter) {
          Object.keys(setFilter).forEach((filtername) => {
            const index = filterGroups.findIndex((item) => item.name === filtername);

            const item = filterGroups[index];

            filterGroups.splice(index, 1); // remove the item in-place
            filterGroups = [item, ...filterGroups];
          });

          if (specificBySetFilter) {
            filterGroups = [filterGroups[0]];
          }
        }

        // put the filter on top of the list that has been changed last
        if (!specificBySetFilter) {
          logger.log(`${logPrefix} this.$shared.lastChangedFilter:`, this.$shared.lastChangedFilter);
          logger.log(`${logPrefix} filterGroups before:`, filterGroups);
          if (this.$shared.lastChangedFilter) {
            const index = filterGroups.findIndex((item) => item.name === this.$shared.lastChangedFilter);

            logger.log(`${logPrefix} index:`, index);

            const item = filterGroups[index];

            logger.log(`${logPrefix} item:`, item);

            filterGroups.splice(index, 1); // remove the item in-place
            filterGroups = [item, ...filterGroups];
          }
          this.$shared.lastChangedFilter = null; // we only need this once
        }

        if (specificFilterNames) {
          filterGroups = filterGroups.filter((fg) => specificFilterNames.includes(fg.name));
        }

        logger.log(`${logPrefix} filterGroups:`, filterGroups);

        for (let i = 0; i < filterGroups.length; i++) {
          if (
            fetchFiltersContext !==
            JSON.stringify({
              mediatype: this.mediatype,
              specificMediaType: this.specificMediaType,
              Series_id_Movies_Owner: this.Series_id_Movies_Owner,
            })
          ) {
            logger.log(`${logPrefix} ABORT due to context mismatch`);
            return;
          }

          if (currentFetchFiltersIteration !== this.fetchFiltersIteration) {
            logger.log(`${logPrefix} ABORT due to iteration mismatch`);
            break;
          }

          const filterGroup = filterGroups[i];

          logger.log(`${logPrefix} filterGroup:`, filterGroup);

          if (!filterGroup.visible) {
            // don't load filterGroup if it isn't even visible
            logger.log(`${logPrefix} ABORT due to filterGroup not visible`);
            continue;
          }

          this.$shared.loadingFilterProgress = 100 * (i / filterGroups.filter((fg) => fg.visible).length);

          switch (filterGroup.name) {
            case "filterSettings":
              await store.fetchFilterSettings(
                this.mediatype,
                this.specificMediaType,
                this.loadFilterValuesFromStorage,
                this.Series_id_Movies_Owner
              );
              break;
            case "filterSourcePaths":
              await store.fetchFilterSourcePaths(
                this.mediatype,
                this.specificMediaType,
                this.loadFilterValuesFromStorage,
                this.Series_id_Movies_Owner
              );
              break;
            case "filterGenres":
              await store.fetchFilterGenres(
                this.mediatype,
                this.specificMediaType,
                this.$local_t,
                this.loadFilterValuesFromStorage,
                this.Series_id_Movies_Owner
              );
              break;
            case "filterAgeRatings":
              await store.fetchFilterAgeRatings(
                this.mediatype,
                this.specificMediaType,
                this.loadFilterValuesFromStorage,
                this.Series_id_Movies_Owner
              );
              break;
            case "filterRatings":
              await store.fetchFilterRatings(
                this.mediatype,
                this.specificMediaType,
                this.loadFilterValuesFromStorage,
                this.Series_id_Movies_Owner
              );
              break;
            case "filterLists":
              await store.fetchFilterLists(
                this.mediatype,
                this.specificMediaType,
                this.$local_t,
                this.loadFilterValuesFromStorage,
                this.Series_id_Movies_Owner
              );
              break;
            case "filterParentalAdvisory":
              await store.fetchFilterParentalAdvisory(
                this.mediatype,
                this.specificMediaType,
                this.loadFilterValuesFromStorage,
                this.Series_id_Movies_Owner
              );
              break;
            case "filterPersons":
              await store.fetchFilterPersons(
                this.mediatype,
                this.specificMediaType,
                this.$local_t,
                this.loadFilterValuesFromStorage,
                this.Series_id_Movies_Owner
              );
              break;
            case "filterCompanies":
              await store.fetchFilterCompanies(
                this.mediatype,
                this.specificMediaType,
                this.$local_t,
                this.loadFilterValuesFromStorage,
                this.Series_id_Movies_Owner
              );
              break;
            case "filterIMDBPlotKeywords":
              await store.fetchFilterIMDBPlotKeywords(
                this.mediatype,
                this.specificMediaType,
                this.$local_t,
                this.loadFilterValuesFromStorage,
                this.Series_id_Movies_Owner
              );
              break;
            case "filterIMDBFilmingLocations":
              await store.fetchFilterIMDBFilmingLocations(
                this.mediatype,
                this.specificMediaType,
                this.$local_t,
                this.loadFilterValuesFromStorage,
                this.Series_id_Movies_Owner
              );
              break;
            case "filterYears":
              // await store.fetchFilterReleaseYears(this.mediatype, this.loadFilterValuesFromStorage);
              await store.fetchFilterYears(
                this.mediatype,
                this.specificMediaType,
                this.loadFilterValuesFromStorage,
                this.Series_id_Movies_Owner
              );
              break;
            case "filterQualities":
              await store.fetchFilterQualities(
                this.mediatype,
                this.specificMediaType,
                this.loadFilterValuesFromStorage,
                this.Series_id_Movies_Owner
              );
              break;
            case "filterAudioLanguages":
              await store.fetchFilterLanguages(
                this.mediatype,
                this.specificMediaType,
                "audio",
                this.$local_t,
                this.loadFilterValuesFromStorage,
                this.Series_id_Movies_Owner
              );
              break;
            case "filterSubtitleLanguages":
              await store.fetchFilterLanguages(
                this.mediatype,
                this.specificMediaType,
                "subtitle",
                this.$local_t,
                this.loadFilterValuesFromStorage,
                this.Series_id_Movies_Owner
              );
              break;
            case "filterIMDBRating":
              await store.fetchFilterIMDBRating(
                this.mediatype,
                this.specificMediaType,
                this.loadFilterValuesFromStorage,
                this.Series_id_Movies_Owner
              );
              break;
            case "filterMetacriticScore":
              await store.fetchFilterMetacriticScore(
                this.mediatype,
                this.specificMediaType,
                this.loadFilterValuesFromStorage,
                this.Series_id_Movies_Owner
              );
              break;
            case "filterReleaseAttributes":
              await store.fetchFilterReleaseAttributes(
                this.mediatype,
                this.specificMediaType,
                this.loadFilterValuesFromStorage,
                this.Series_id_Movies_Owner
              );
              break;
            case "filterDataQuality":
              await store.fetchFilterDataQuality(
                this.mediatype,
                this.specificMediaType,
                this.loadFilterValuesFromStorage,
                this.Series_id_Movies_Owner
              );
              break;
            case "filterVideoEncoders":
              await store.fetchFilterVideoEncoders(
                this.mediatype,
                this.specificMediaType,
                this.loadFilterValuesFromStorage,
                this.Series_id_Movies_Owner
              );
              break;
            case "filterAudioFormats":
              await store.fetchFilterAudioFormats(
                this.mediatype,
                this.specificMediaType,
                this.loadFilterValuesFromStorage,
                this.Series_id_Movies_Owner
              );
              break;
            default:
              throw new Error("Unsupported filter type:", filterGroup.name);
          }
        }

        if (setFilter) {
          eventBus.setFilter(setFilter);
        }

        if (currentFetchFiltersIteration !== this.fetchFiltersIteration) {
          // another fetch has been initiated
          //logger.groupEnd();
          return;
        }

        this.$shared.loadingFilterProgress = 100;

        // eventBus.showSidebarLoadingOverlay(false);

        this.$shared.isLoadingFilter = false;

        logger.log(`${logPrefix} DONE`);
      } catch (err) {
        logger.error(err);
      }

      //logger.groupEnd();
    },

    // ### MediaPropteryDialog based methods
    mpdShowAgeRatingDialog(ageRating, isInDialog) {
      logger.log("[mpdOnAgeRatingClicked]:", ageRating, "isInDialog:", isInDialog);

      this.ageRatingDialog.show = true;
      this.ageRatingDialog.Age_Rating = ageRating;
      this.ageRatingDialog.isInDialog = !!isInDialog;

      return;
    },

    mpdShowAudioFormatDialog(audioFormat, isInDialog) {
      logger.log("[mpdShowAudioFormatDialog]:", audioFormat);

      this.audioFormatDialog.show = true;
      this.audioFormatDialog.Audio_Format = audioFormat;
      this.audioFormatDialog.isInDialog = !!isInDialog;

      return;
    },

    mpdShowCompanyDialog(company, isInDialog) {
      logger.log("[mpdShowCompanyDialog]:", company);

      this.companyDialog.show = true;
      this.companyDialog.IMDB_Company_ID = company.id;
      this.companyDialog.Company_Name = company.name;
      this.companyDialog.isInDialog = !!isInDialog;

      return;
    },

    mpdShowFilmingLocationDialog(filmingLocation, isInDialog) {
      logger.log("[mpdShowFilmingLocationDialog]:", filmingLocation);

      this.filmingLocationDialog.show = true;
      this.filmingLocationDialog.id_IMDB_Filming_Locations = filmingLocation.id_IMDB_Filming_Locations;
      this.filmingLocationDialog.Location = filmingLocation.Location;
      this.filmingLocationDialog.isInDialog = isInDialog;

      return;
    },

    mpdShowGenreDialog(genre, isInDialog) {
      logger.log("[mpdShowGenreDialog]:", genre);

      this.genreDialog.show = true;
      this.genreDialog.name = genre.name;
      this.genreDialog.translated = genre.translated;
      this.genreDialog.isInDialog = !!isInDialog;

      logger.log("[mpdShowGenreDialog] this.genreDialog:", this.genreDialog);

      return;
    },

    mpdShowLanguageDialog(code, type, isInDialog) {
      logger.log("[mpdShowLanguageDialog]:", { code, type });

      if (type === "audio") {
        this.audioLanguageDialog.show = true;
        this.audioLanguageDialog.Code = code;
        this.audioLanguageDialog.isInDialog = !!isInDialog;
      } else {
        this.subtitleLanguageDialog.show = true;
        this.subtitleLanguageDialog.Code = code;
        this.subtitleLanguageDialog.isInDialog = !!isInDialog;
      }
    },

    mpdShowPersonDialog(credit, isInDialog) {
      logger.log("[mpdShowPersonDialog] credit:", credit);

      this.personDialog.show = true;
      this.personDialog.IMDB_Person_ID = credit.id;
      this.personDialog.Person_Name = credit.name;
      this.personDialog.isInDialog = !!isInDialog;

      return;
    },

    mpdShowPlotKeywordDialog(plotKeyword, isInDialog) {
      logger.log("[mpdShowPlotKeywordDialog]:", plotKeyword);

      this.plotKeywordDialog.show = true;
      this.plotKeywordDialog.id_IMDB_Plot_Keywords = plotKeyword.id_IMDB_Plot_Keywords;
      this.plotKeywordDialog.Keyword = plotKeyword.Keyword;
      this.plotKeywordDialog.isInDialog = isInDialog;

      return;
    },

    mpdShowReleaseAttributeDialog(releaseAttribute, movie, isInDialog) {
      this.releaseAttributeDialog.ReleaseAttribute = releaseAttribute;
      this.releaseAttributeDialog.movie = movie;
      this.releaseAttributeDialog.isInDialog = !!isInDialog;

      this.$refs.releaseAttributeDialog.init(releaseAttribute);

      this.releaseAttributeDialog.show = true;
    },

    mpdShowVideoEncoderDialog(videoEncoder, isInDialog) {
      logger.log("[mpdShowVideoEncoderDialog]:", videoEncoder);

      this.videoEncoderDialog.show = true;
      this.videoEncoderDialog.Video_Encoder = videoEncoder;
      this.videoEncoderDialog.isInDialog = !!isInDialog;

      return;
    },

    mpdShowVideoQualityDialog(MI_Qualities_Item, isInDialog) {
      logger.log("[mpdShowVideoQualityDialog] MI_Qualities_Item:", MI_Qualities_Item);

      this.videoQualityDialog.show = true;
      this.videoQualityDialog.MI_Qualities_Item = MI_Qualities_Item;
      this.videoQualityDialog.isInDialog = !!isInDialog;

      return;
    },
    // ### End MediaPropertyDialog based methods

    async updateCurrentTime() {
      this.currentTime = moment(await store.getCurrentTime());
    },

    openIMDB(movie) {
      shell.openExternal(`https://www.imdb.com/title/${movie.IMDB_tconst}/`);
    },

    openWhatToWatchOnTV(mediaItem) {
      logger.log("[openWhatToWatchOnTV] mediaItem:", mediaItem);

      if (mediaItem.specificMediaType == "Series") {
        shell.openExternal(`https://www.whattowatchon.tv/${mediaItem.IMDB_tconst}`);
        return;
      }

      if (mediaItem.specificMediaType == "Episodes") {
        shell.openExternal(`https://www.whattowatchon.tv/${mediaItem.SeriesOwner_IMDB_tconst}`);
        return;
      }
    },

    openLetterboxd(movie) {
      shell.openExternal(`https://www.letterboxd.com/imdb/${movie.IMDB_tconst}/`);
    },

    openMovieChat(movie) {
      shell.openExternal(`https://www.moviechat.org/${movie.IMDB_tconst}/`);
    },

    async showCredits(movie, show) {
      if (!show) {
        this.$set(movie, "showCredits", false);
        return;
      }

      if (!movie.credits) {
        const credits = await store.fetchMovieCredits(movie.id_Movies);

        logger.log("[showCredits] credits:", credits);

        this.$set(movie, "credits", credits);
      }

      this.$set(movie, "showCredits", true);
    },

    async showCompanies(movie, show) {
      if (!show) {
        this.$set(movie, "showCompanies", false);
        return;
      }

      if (!movie.companies) {
        const companies = await store.fetchMovieCompanies(movie.id_Movies);

        logger.log("[showCompanies] companies:", companies);

        this.$set(movie, "companies", companies);
      }

      this.$set(movie, "showCompanies", true);
    },

    onPersonDialogClose() {
      this.personDialog.show = false;
    },

    onCompanyDialogClose() {
      this.companyDialog.show = false;
    },

    onVideoQualityDialogClose() {
      this.videoQualityDialog.show = false;
    },

    onVideoEncoderDialogClose() {
      this.videoEncoderDialog.show = false;
    },

    onAudioFormatDialogClose() {
      this.audioFormatDialog.show = false;
    },

    onGenreDialogClose() {
      this.genreDialog.show = false;
    },

    onAudioLanguageDialogClose() {
      this.audioLanguageDialog.show = false;
    },

    onSubtitleLanguageDialogClose() {
      this.subtitleLanguageDialog.show = false;
    },

    onAgeRatingDialogClose() {
      this.ageRatingDialog.show = false;
    },

    onPlotKeywordDialogClose() {
      this.plotKeywordDialog.show = false;
    },

    onFilmingLocationDialogClose() {
      this.filmingLocationDialog.show = false;
    },

    onVideoPlayerDialogClose() {
      this.videoPlayerDialog.show = false;
      setTimeout(() => {
        this.videoPlayerDialog.showActualPlayer = false;
      }, 250);
    },

    onLocalVideoPlayerDialogClose() {
      this.localVideoPlayerDialog.show = false;
      setTimeout(() => {
        this.localVideoPlayerDialog.showActualPlayer = false;
      }, 250);
    },

    async startTrailerShow(movies, randomizeMovies) {
      let moviesWithTrailers = movies.filter((movie) => movie.IMDB_Trailer_URL);

      if (!moviesWithTrailers || moviesWithTrailers.length === 0) {
        eventBus.showSnackbar("warning", this.$t("the list does not contain any movies with trailers"));
        return;
      }

      logger.log("[startTrailerShow] number of moviesWithTrailers before deduplication:", moviesWithTrailers.length);

      // deduplicate trailerURLs
      moviesWithTrailers = moviesWithTrailers.filter(
        (trailerURL, index, self) => self.findIndex((t) => t.IMDB_Trailer_URL === trailerURL.IMDB_Trailer_URL) === index
      );

      logger.log("[startTrailerShow] number of moviesWithTrailers after deduplication:", moviesWithTrailers.length);

      if (randomizeMovies) {
        moviesWithTrailers = helpers.randomizeArray(moviesWithTrailers);
      }

      const current = moviesWithTrailers.shift();

      this.trailerShow = {
        remaining: moviesWithTrailers,
        current,
        history: [],
      };

      // show trailer player (local or remote)
      await this.showTrailer(current, this.trailerShow);
    },

    async onTrailerShowPrevious() {
      const { remaining, current, history } = this.trailerShow;

      if (history.length === 0) {
        return;
      }

      const previous = history.pop();

      remaining.unshift(current);

      this.trailerShow = {
        remaining,
        current: previous,
        history,
      };

      await this.debouncedShowTrailer(previous, this.trailerShow);
    },

    async onTrailerShowNext() {
      const { remaining, current, history } = this.trailerShow;

      if (remaining.length === 0) {
        return;
      }

      history.push(current);

      const new_current = remaining.shift();

      this.trailerShow = {
        remaining,
        current: new_current,
        history,
      };

      this.debouncedShowTrailer(new_current, this.trailerShow);
    },

    async onTrailerShowAddMovieToList() {
      await this.addToList(this.trailerShow.current);
    },

    async onTrailerShowCloseAndSearchMovie() {
      if (this.videoPlayerDialog.show) {
        await this.onVideoPlayerDialogClose();
      } else {
        await this.onLocalVideoPlayerDialogClose();
      }

      logger.log(
        "[onTrailerShowCloseAndSearchMovie] this.trailerShow.current.IMDB_tconst:",
        this.trailerShow.current.IMDB_tconst
      );
      eventBus.setSearchText(`${this.trailerShow.current.Name} [${this.trailerShow.current.IMDB_tconst}]`);
    },

    onOpenLinkIMDBDialog(item) {
      this.$refs.linkIMDBDialog.init();
      this.linkIMDBDialog.filePath = item.fullPath;
      this.linkIMDBDialog.item = item;
      this.linkIMDBDialog.showUnlink = !!item.IMDB_tconst;
      this.linkIMDBDialog.show = true;
    },

    onLinkIMDBDialogClose() {
      this.linkIMDBDialog.show = false;
      this.linkIMDBDialog.item = {};
    },

    async onLinkIMDBDialogSelected(tconst) {
      try {
        store.resetUserScanOptions();

        eventBus.rescanStarted();

        await store.assignIMDB({
          $id_Movies: this.linkIMDBDialog.item.id_Movies,
          $IMDB_tconst: tconst,
          isHandlingDuplicates: false,
          mediaItem: null,
          $t: this.$local_t,
          isIMDB_tconst_userDefined: true,
        });

        eventBus.rescanStopped();

        // eventBus.refetchMedia(this.$shared.currentPage);
        this.refetchMedia({ setPage: this.$shared.currentPage });

        eventBus.showSnackbar("success", this.$t("entry linked successfully"));

        this.onLinkIMDBDialogClose();
      } catch (err) {
        logger.log("[onLinkIMDBDialogSelected] error:", JSON.stringify(err));
        eventBus.showSnackbar("error", err);
      }
    },

    async onLinkIMDBDialogUnlink() {
      try {
        store.resetUserScanOptions();

        await store.deleteIMDBData(this.linkIMDBDialog.item);

        if (this.linkIMDBDialog.item.specificMediaType === "Series") {
          // unlink all episodes
          const episodes = await store.fetchMedia({
            $MediaType: "series",
            Series_id_Movies_Owner: this.linkIMDBDialog.item.id_Movies,
            $t: this.$local_t,
            filters: { filterSettings: {} },
            arr_IMDB_tconst: null,
            arr_id_Movies: null,
            minimumResultSet: false,
            specificMediaType: "Episodes",
            dontStoreFilters: true,
          });

          const episodesFiltered = episodes.filter((episode) => {
            if (!episode.IMDB_tconst) {
              return false;
            }
            if (!episode.isDirectoryBased && episode.Filename && episode.Filename.includes(episode.IMDB_tconst)) {
              return false;
            }
            if (episode.DefinedByUser && episode.DefinedByUser.includes("|IMDB_tconst|")) {
              return false;
            }

            return true;
          });

          for (const episode of episodesFiltered) {
            await store.deleteIMDBData(episode);
          }
        }

        // eventBus.refetchMedia(this.$shared.currentPage);
        this.refetchMedia({ setPage: this.$shared.currentPage });

        eventBus.showSnackbar("success", this.$t("entry unlinked successfully"));

        this.onLinkIMDBDialogClose();
      } catch (err) {
        logger.log("[onLinkIMDBDialogUnlink] error:", JSON.stringify(err));
        eventBus.showSnackbar("error", err);
      }
    },

    async onRescanItems(items) {
      try {
        await store.rescanItems(items, this.$local_t);

        // eventBus.refetchMedia(this.$shared.currentPage, this.$local_t);
        this.refetchMedia({ setPage: this.$shared.currentPage, $t: this.$local_t });

        eventBus.showSnackbar("success", this.$t(`${items.length === 1 ? "entry" : "entries"} successfully rescanned`));
      } catch (err) {
        logger.log("[onRescanItem] error:", JSON.stringify(err));
        eventBus.showSnackbar("error", err);
      }
    },

    setItemHovered(item, section, value) {
      this.$set(item, `${section}Hovered`, value);
    },

    showContentAdvisory(movie, show) {
      this.$set(movie, "showContentAdvisory", show);
    },

    async showPlotKeywords(movie, show) {
      if (!show) {
        this.$set(movie, "showPlotKeywords", false);
        return;
      }

      if (!movie.plotKeywords) {
        const plotKeywords = await store.fetchMoviePlotKeywords(movie.id_Movies);

        logger.log("[showPlotKeywords] plotKeywords:", plotKeywords);

        this.$set(movie, "plotKeywords", plotKeywords);
      }

      this.$set(movie, "showPlotKeywords", true);
    },

    async showFilmingLocations(movie, show) {
      if (!show) {
        this.$set(movie, "showFilmingLocations", false);
        return;
      }

      if (!movie.filmingLocations) {
        const filmingLocations = await store.fetchMovieFilmingLocations(movie.id_Movies);

        logger.log("[showFilmingLocations] filmingLocations:", filmingLocations);

        this.$set(movie, "filmingLocations", filmingLocations);
      }

      this.$set(movie, "showFilmingLocations", true);
    },

    /**
     * USER changed the sort field actively
     */
    onSortChanged() {
      // logger.log("[onSortChanged] $shared.sortField:", this.$shared.sortField);
      this.$shared.currentPage = 1; // reset to first page
      store.saveSortValues(this.specificMediaType);
    },

    onReload() {
      logger.log("[onReload]");
      // eventBus.refetchMedia();
      this.refetchMedia({});
    },

    async completelyFetchMedia() {
      try {
        const arr_id_Movies = [];

        this.itemsFilteredPaginated.forEach((item) => {
          if (!item.isCompletelyFetched) {
            arr_id_Movies.push(item.id_Movies);
          }
        });

        logger.log("[completelyFetchMedia] arr_id_Movies:", arr_id_Movies);

        if (arr_id_Movies.length === 0) {
          return;
        }

        //logger.group("[Fetch Media Details]");

        logger.log("[completelyFetchMedia] this.Series_id_Movies_Owner:", this.Series_id_Movies_Owner);

        const result = !this.Series_id_Movies_Owner
          ? await store.fetchMedia({
              $MediaType: this.mediatype,
              arr_id_Movies: arr_id_Movies,
              minimumResultSet: false,
              $t: this.$local_t,
              filters: this.$shared.filters,
              arr_IMDB_tconst: null,
              Series_id_Movies_Owner: null,
              specificMediaType: this.specificMediaType,
            })
          : await store.fetchMedia({
              $MediaType: this.mediatype,
              arr_id_Movies: arr_id_Movies,
              minimumResultSet: false,
              $t: this.$local_t,
              filters: { filterSettings: {} },
              arr_IMDB_tconst: null,
              Series_id_Movies_Owner: this.Series_id_Movies_Owner,
              specificMediaType: this.specificMediaType,
            });

        logger.log("[completelyFetchMedia] result:", result);

        result.forEach((item) => {
          this.itemsFilteredPaginated.forEach((itemPaginated) => {
            if (item.id_Movies !== itemPaginated.id_Movies) {
              return;
            }

            Object.keys(itemPaginated).forEach((key) => {
              itemPaginated[key] = item[key];
            });
          });
        });
      } catch (err) {
        logger.error(err);
      }

      //logger.groupEnd();
    },

    onShowRatingDemographicsDialog(item) {
      this.ratingDemographicsDialog.title = item.Name;

      this.$refs.ratingDemographicsDialog.init(item.id_Movies);

      this.ratingDemographicsDialog.show = true;
    },

    onShowDeleteMediaDialog(item) {
      logger.log("[onShowDeleteMediaDialog] item:", item);

      this.deleteMediaDialog.item = item;
      this.deleteMediaDialog.Title = "Delete Media";
      this.deleteMediaDialog.Message =
        item.MediaType === "movies"
          ? "This will delete '{ItemName}' and all the files associated to it on your hard drive_ Do you really want to delete this movie?"
          : item.MediaType === "series" && !item.Series_id_Movies_Owner
          ? "This will delete '{ItemName}' and all the files associated to it on your hard drive_ Do you really want to delete the whole series?"
          : item.MediaType === "series" && item.Series_id_Movies_Owner
          ? "This will delete '{ItemName}' and all the files associated to it on your hard drive_ Do you really want to delete this episode?"
          : "This will delete '{ItemName}' and all the files associated to it on your hard drive_ Do you really want to delete the media?";
      this.deleteMediaDialog.ItemName = item.Name;
      this.deleteMediaDialog.alertType = null;
      this.deleteMediaDialog.alertText = null;

      this.deleteMediaDialog.location =
        item.isDirectoryBased && item.specificMediaType !== "Series" ? item.fullDirectory : item.fullPath;
      this.deleteMediaDialog.additionalTextBlocks = [
        this.$t("storage location:") + " " + this.deleteMediaDialog.location,
      ];

      this.deleteMediaDialog.show = true;
    },

    onOpenEditMediaItemDialog(item) {
      logger.log("[onOpenEditMediaItemDialog] item:", item);
      this.editMediaItemDialog.mediaItem = JSON.parse(JSON.stringify(item)); // we don't allow direct manipulation of the item itself
      this.editMediaItemDialog.mediaItem.AudioLanguages = store.generateLanguageArray(
        this.editMediaItemDialog.mediaItem.Audio_Languages,
        9999
      );
      this.editMediaItemDialog.mediaItem.SubtitleLanguages = store.generateLanguageArray(
        this.editMediaItemDialog.mediaItem.Subtitle_Languages,
        9999
      );
      this.editMediaItemDialog.show = true;
    },

    onEditMediaItemDialogCancel() {
      // nothing changed, so we can go along
      this.editMediaItemDialog.show = false;
    },

    onEditMediaItemDialogOK(hasChanges) {
      this.editMediaItemDialog.show = false;

      if (hasChanges) {
        eventBus.showSnackbar("success", this.$t("Your changes have been saved_"));

        this.onReload();
      }
    },

    async clearScanErrors(item) {
      await store.updateMediaRecordField(item.id_Movies, "scanErrors", null);
      item.scanErrors = null;
    },

    async checkPathExistence(fullPath, dontThrowError) {
      logger.log("[checkPathExistence] fullPath:", fullPath);
      if (!(await store.existsAsync(fullPath))) {
        logger.log("[checkPathExistence] NOT FOUND");
        if (!dontThrowError) {
          logger.log("[checkPathExistence] throwing error");
          throw new Error(
            this.$t('The path "{path}" cannot be found_', {
              path: fullPath,
            })
          );
        } else {
          logger.log("[checkPathExistence] not throwing error");
        }
        return false;
      }

      return true;
    },

    async onDeleteMediaDialogYes() {
      // TODO: try to delete files/directory according to item.isDirectoryBased
      this.deleteMediaDialog.loading = true;

      this.ensureMovieExtras(this.deleteMediaDialog.item);

      logger.log("[onDeleteMediaDialogYes] item after ensureMovieExtras:", this.deleteMediaDialog.item);

      try {
        // based on SourcePath's checkRemovedFiles we either ignore non-existant files/dirs or we abort with error
        const checkRemovedFiles = await store.db.fireProcedureReturnScalar(
          `SELECT checkRemovedFiles FROM tbl_SourcePaths WHERE id_SourcePaths = $id_SourcePaths`,
          { $id_SourcePaths: this.deleteMediaDialog.item.id_SourcePaths }
        );
        logger.log("[onDeleteMediaDialogYes] checkRemovedFiles:", checkRemovedFiles);

        // check SourcePath existence if checkRemovedFiles is falsy; abort with error if it does not exist
        await this.checkPathExistence(this.deleteMediaDialog.item.SourcePath, checkRemovedFiles);

        // delete extras
        for (const extra of this.deleteMediaDialog.item.extras || []) {
          if (await this.checkPathExistence(extra.fullPath, checkRemovedFiles)) {
            logger.log("[onDeleteMediaDialogYes] deleting extra file:", extra.fullPath);
            await fs.rm(extra.fullPath);
          }
        }

        if (await this.checkPathExistence(this.deleteMediaDialog.location, checkRemovedFiles)) {
          logger.log("[onDeleteMediaDialogYes] deleting:", this.deleteMediaDialog.location);

          await fs.rm(this.deleteMediaDialog.location, {
            recursive: true,
            force: true,
          });
        }

        // remove media entries from DB (use isRemoved?)
        for (const extra of this.deleteMediaDialog.item.extras || []) {
          await store.db.fireProcedure(`UPDATE tbl_Movies SET isRemoved = 1 WHERE id_Movies = $id_Movies`, {
            $id_Movies: extra.id_Movies,
          });
        }
        await store.db.fireProcedure(`UPDATE tbl_Movies SET isRemoved = 1 WHERE id_Movies = $id_Movies`, {
          $id_Movies: this.deleteMediaDialog.item.id_Movies,
        });

        // update series metadata if we just deleted an episode
        if (this.Series_id_Movies_Owner) {
          await store.updateSeriesMetadataFromEpisodes(this.Series_id_Movies_Owner);
        }

        eventBus.showSnackbar(
          "success",
          this.$t("'{ItemName}' has been deleted_", {
            ItemName: this.deleteMediaDialog.item.Name,
          })
        );

        // eventBus.refetchMedia();
        this.refetchMedia({});

        this.deleteMediaDialog.show = false;
      } catch (err) {
        this.deleteMediaDialog.alertType = "error";
        this.deleteMediaDialog.alertText = err.message;
      } finally {
        this.deleteMediaDialog.loading = false;
      }
    },

    async onDeleteMediaDialogOK() {
      // open storage location based on item.isDirectoryBased
      shell.showItemInFolder(this.deleteMediaDialog.location);
    },

    async onDeleteMediaDialogCancel() {
      this.deleteMediaDialog.show = false;
    },

    async onRescanCurrentListDialogOK() {
      this.rescanCurrentListDialog.show = false;

      // TODO: properly handle array for the rescan (total time etc.)
      this.onRescanItems(this.itemsFiltered);
    },

    async onListActionCopyInfo() {},

    async onShowSeriesIMDBRatingHeatmapDialog(mediaItem) {
      try {
        this.SeriesIMDBRatingHeatmapDialog.data = null;
        this.SeriesIMDBRatingHeatmapDialog.title = mediaItem.Name;
        this.SeriesIMDBRatingHeatmapDialog.show = true;
        this.SeriesIMDBRatingHeatmapDialog.isLoading = true;

        const mediaItems = await store.fetchMedia({
          $MediaType: "series",
          Series_id_Movies_Owner: mediaItem.id_Movies,
          $t: this.$local_t,
          filters: { filterSettings: {} },
          arr_IMDB_tconst: null,
          arr_id_Movies: null,
          minimumResultSet: true,
          specificMediaType: "Episodes",
          dontStoreFilters: true,
        });

        logger.log("[onShowSeriesIMDBRatingHeatmapDialog] mediaItems:", mediaItems);

        // TODO: init datastructure for the grid
        const data = {
          meta: {
            seasons: {
              min: 1,
              max: 1,
            },
            episodes: {
              min: 1,
              max: 1,
            },
            bonusEpisodes: {
              min: null,
              max: null,
            },
          },
          mediaItems: {},
          seasonRatings: {},
          seasons: [],
          episodes: [],
          bonusEpisodes: [],
        };

        for (const mediaItem of mediaItems) {
          logger.log("[onShowSeriesIMDBRatingHeatmapDialog] mediaItem:", mediaItem);

          if (mediaItem.Series_Season == null || isNaN(mediaItem.Series_Season)) {
            continue;
          }

          logger.log("[onShowSeriesIMDBRatingHeatmapDialog] mediaItem.Series_Season:", mediaItem.Series_Season);

          if (mediaItem.Series_Season < data.meta.seasons.min) {
            data.meta.seasons.min = mediaItem.Series_Season;
          }
          if (mediaItem.Series_Season > data.meta.seasons.max) {
            data.meta.seasons.max = mediaItem.Series_Season;
          }

          if (!data.mediaItems[mediaItem.Series_Season]) {
            data.mediaItems[mediaItem.Series_Season] = {};
          }

          if (mediaItem.Series_Bonus_Number) {
            if (data.meta.bonusEpisodes.min == null || mediaItem.Series_Bonus_Number < data.meta.bonusEpisodes.min) {
              data.meta.bonusEpisodes.min = mediaItem.Series_Bonus_Number;
            }

            if (data.meta.bonusEpisodes.max == null || mediaItem.Series_Bonus_Number > data.meta.bonusEpisodes.max) {
              data.meta.bonusEpisodes.max = mediaItem.Series_Bonus_Number;
            }

            data.mediaItems[mediaItem.Series_Season][`B${mediaItem.Series_Bonus_Number}`] = mediaItem;
          }

          if (mediaItem.SeriesEpisodesComplete) {
            for (const episode of mediaItem.SeriesEpisodesComplete) {
              data.mediaItems[mediaItem.Series_Season][episode] = mediaItem;

              if (episode < data.meta.episodes.min) {
                data.meta.episodes.min = episode;
              }
              if (episode > data.meta.episodes.max) {
                data.meta.episodes.max = episode;
              }
            }
          }
        }

        for (let season = data.meta.seasons.min; season <= data.meta.seasons.max; season++) {
          data.seasons.push({
            season,
            displayText: `S${`${season < 10 ? "0" : ""}${season}`}`,
          });
        }

        if (data.meta.bonusEpisodes.min !== null && data.meta.bonusEpisodes.max !== null) {
          for (
            let bonusEpisode = data.meta.bonusEpisodes.min;
            bonusEpisode <= data.meta.bonusEpisodes.max;
            bonusEpisode++
          ) {
            data.bonusEpisodes.push({
              bonusEpisode,
              displayText: `B${`${bonusEpisode < 10 ? "0" : ""}${bonusEpisode}`}`,
            });
          }
        }

        for (let episode = data.meta.episodes.min; episode <= data.meta.episodes.max; episode++) {
          data.episodes.push({
            episode,
            displayText: `E${`${episode < 10 ? "0" : ""}${episode}`}`,
          });
        }

        logger.log("[onShowSeriesIMDBRatingHeatmapDialog] data:", data);

        this.SeriesIMDBRatingHeatmapDialog.data = data;
      } catch (error) {
        logger.error(error);
        eventBus.showSnackbar("error", logger.error(error));
      } finally {
        this.SeriesIMDBRatingHeatmapDialog.isLoading = false;
      }
    },

    async onCloseSeriesIMDBRatingHeatmapDialog() {
      this.SeriesIMDBRatingHeatmapDialog.show = false;
    },

    // ### MediaItemCard (MIC) Events ###
    async onMICmediaItemEvent(payload) {
      // logger.log("[MediaList.onMICmediaItemEvent] payload:", payload);

      switch (payload.eventName) {
        case "launch":
          await this.launch(payload.mediaItem);
          break;
        case "selectMediaItem":
          await this.selectItem(payload.mediaItem);
          break;
        case "openEditMediaItemDialog":
          await this.onOpenEditMediaItemDialog(payload.mediaItem);
          break;
        case "rescanItem":
          await this.onRescanItems([payload.mediaItem]);
          break;
        case "openLinkIMDBDialog":
          await this.onOpenLinkIMDBDialog(payload.mediaItem);
          break;
        case "setItemHovered":
          await this.setItemHovered(payload.mediaItem, payload.section, payload.value);
          break;
        case "showDeleteMediaDialog":
          await this.onShowDeleteMediaDialog(payload.mediaItem);
          break;
        case "showRatingDemographicsDialog":
          await this.onShowRatingDemographicsDialog(payload.mediaItem);
          break;
        case "showSeriesIMDBRatingHeatmapDialog":
          await this.onShowSeriesIMDBRatingHeatmapDialog(payload.mediaItem);
          break;
        case "changeRating":
          await this.changeRating(payload.mediaItem);
          break;
        case "clearScanErrors":
          await this.clearScanErrors(payload.mediaItem);
          break;
        case "copyImdbTconst":
          await this.copyImdbTconst(payload.mediaItem);
          break;
        case "addToList":
          await this.addToList(payload.mediaItem);
          break;
        case "removeFromList":
          await this.removeFromList(payload.mediaItem);
          break;
        case "showCredits":
          await this.showCredits(payload.mediaItem, payload.value);
          break;
        case "showCompanies":
          await this.showCompanies(payload.mediaItem, payload.value);
          break;
        case "showContentAdvisory":
          await this.showContentAdvisory(payload.mediaItem, payload.value);
          break;
        case "showPlotKeywords":
          await this.showPlotKeywords(payload.mediaItem, payload.value);
          break;
        case "showFilmingLocations":
          await this.showFilmingLocations(payload.mediaItem, payload.value);
          break;
        case "copyInfo":
          await this.copyInfo([payload.mediaItem]);
          break;
        case "showTrailer":
          await this.showTrailer(payload.mediaItem);
          break;
        case "openIMDB":
          await this.openIMDB(payload.mediaItem);
          break;
        case "openWhatToWatchOnTV":
          await this.openWhatToWatchOnTV(payload.mediaItem);
          break;
        case "openLetterboxd":
          await this.openLetterboxd(payload.mediaItem);
          break;
        case "openMovieChat":
          await this.openMovieChat(payload.mediaItem);
          break;

        // MediaPropertyDialog based events
        case "ageRatingClicked":
          this.MediaPropertyDialog_Series_id_Movies_Owner = payload.mediaItem.Series_id_Movies_Owner;
          await this.mpdShowAgeRatingDialog(payload.AgeRating, payload.isInDialog);
          break;
        case "audioFormatClicked":
          this.MediaPropertyDialog_Series_id_Movies_Owner = payload.mediaItem.Series_id_Movies_Owner;
          await this.mpdShowAudioFormatDialog(payload.audioFormat, payload.isInDialog);
          break;
        case "languageClicked":
          this.MediaPropertyDialog_Series_id_Movies_Owner = payload.mediaItem.Series_id_Movies_Owner;
          await this.mpdShowLanguageDialog(payload.code, payload.type, payload.isInDialog);
          break;
        case "companyClicked":
          this.MediaPropertyDialog_Series_id_Movies_Owner = payload.mediaItem.Series_id_Movies_Owner;
          await this.mpdShowCompanyDialog(payload.company, payload.isInDialog);
          break;
        case "filmingLocationClicked":
          this.MediaPropertyDialog_Series_id_Movies_Owner = payload.mediaItem.Series_id_Movies_Owner;
          await this.mpdShowFilmingLocationDialog(payload.filmingLocation, payload.isInDialog);
          break;
        case "genreClicked":
          this.MediaPropertyDialog_Series_id_Movies_Owner = payload.mediaItem.Series_id_Movies_Owner;
          await this.mpdShowGenreDialog(payload.genre, payload.isInDialog);
          break;
        case "creditClicked":
          this.MediaPropertyDialog_Series_id_Movies_Owner = payload.mediaItem.Series_id_Movies_Owner;
          await this.mpdShowPersonDialog(payload.credit, payload.isInDialog);
          break;
        case "plotKeywordClicked":
          this.MediaPropertyDialog_Series_id_Movies_Owner = payload.mediaItem.Series_id_Movies_Owner;
          await this.mpdShowPlotKeywordDialog(payload.plotKeyword, payload.isInDialog);
          break;
        case "releaseAttributeClicked":
          this.MediaPropertyDialog_Series_id_Movies_Owner = payload.mediaItem.Series_id_Movies_Owner;
          await this.mpdShowReleaseAttributeDialog(payload.releaseAttribute, payload.mediaItem, payload.isInDialog);
          break;
        case "videoEncoderClicked":
          this.MediaPropertyDialog_Series_id_Movies_Owner = payload.mediaItem.Series_id_Movies_Owner;
          await this.mpdShowVideoEncoderDialog(payload.videoEncoder, payload.isInDialog);
          break;
        case "videoQualityClicked":
          this.MediaPropertyDialog_Series_id_Movies_Owner = payload.mediaItem.Series_id_Movies_Owner;
          await this.mpdShowVideoQualityDialog(payload.MI_Qualities_Item, payload.isInDialog);
          break;

        default:
          logger.error("[onMICmediaItemEvent] unknown eventName:", payload.eventName);
          break;
      }
    },

    async refetchMedia({ setPage, $t, setFilter, dontStoreFilters, dontLoadFiltersFromDb }) {
      //logger.group("[Fetch Media List]");

      logger.log("[refetchMedia]", { setPage, $t, setFilter, dontStoreFilters });
      logger.log("[refetchMedia] this.specificMediaType:", this.specificMediaType);
      logger.log("[refetchMedia] this.$shared.filters:", JSON.stringify(this.$shared.filters, null, 2));

      eventBus.showLoadingOverlay(true);

      await store.fetchSortValues(this.specificMediaType);

      if (!dontLoadFiltersFromDb) {
        this.$shared.filters = (await store.fetchFilterValues(this.specificMediaType, true)) || this.$shared.filters; // always fetch filter values cached in db
      }

      this.items = [];
      this.items = !this.Series_id_Movies_Owner
        ? await store.fetchMedia({
            $MediaType: this.mediatype,
            arr_id_Movies: null,
            minimumResultSet: true,
            $t: $t || this.$local_t,
            filters: this.$shared.filters,
            arr_IMDB_tconst: null,
            Series_id_Movies_Owner: null,
            specificMediaType: this.specificMediaType,
            dontStoreFilters: !!dontStoreFilters,
          })
        : await store.fetchMedia({
            $MediaType: this.mediatype,
            arr_id_Movies: null,
            minimumResultSet: true,
            $t: $t || this.$local_t,
            filters: { filterSettings: {} },
            arr_IMDB_tconst: null,
            Series_id_Movies_Owner: this.Series_id_Movies_Owner,
            specificMediaType: this.specificMediaType,
            dontStoreFilters: !!dontStoreFilters,
          });

      const lastCurrentPage = await store.loadCurrentPage(this.specificMediaType, this.Series_id_Movies_Owner);
      this.$shared.currentPage = lastCurrentPage && lastCurrentPage <= this.numPages ? lastCurrentPage : 1;
      store.saveCurrentPage(this.specificMediaType, this.Series_id_Movies_Owner);

      await this.completelyFetchMedia();

      eventBus.showLoadingOverlay(false);

      await this.fetchFilters(setFilter);

      this.loadFilterValuesFromStorage = false; // only load filter values from storage initially

      //logger.groupEnd();
    },
  },

  // ### LifeCycle Hooks ###
  created() {
    logger.log("[created] MediaList created");

    // #region Register eventBus events
    eventBus.$on("searchTextChanged", () => {
      this.$shared.currentPage = 1;
      store.saveCurrentPage(this.specificMediaType, this.Series_id_Movies_Owner);
      this.completelyFetchMedia();
    });

    eventBus.$on("refetchMedia", ({ setPage, $t, setFilter, dontLoadFiltersFromDb }) => {
      logger.log("[MediaList] eventBus.$on(refetchMedia)");
      //logger.group("[Fetch Media List]");
      (async () => {
        await this.refetchMedia({ setPage, $t, setFilter, dontLoadFiltersFromDb });
      })();
      //logger.groupEnd();
    });

    eventBus.$on("refetchFilters", async ({ setFilter, specificFilterNames }) => {
      await store.fetchSortValues(this.specificMediaType);
      this.fetchFilters(setFilter, false, specificFilterNames);
    });

    eventBus.$on("refetchSpecificFilter", async (setFilter) => {
      await store.fetchSortValues(this.specificMediaType);
      this.fetchFilters(setFilter, true);
    });

    eventBus.$on("listDialogSetUseExistingLists", (value) => {
      this.listDialog.useExistingLists = value;
      this.listDialog.createNewList = !value;
    });

    eventBus.$on("listDialogSetCreateNewList", (value) => {
      this.listDialog.createNewList = value;
      this.listDialog.useExistingLists = !value;
    });

    eventBus.$on("showPersonDialog", (value) => {
      this.mpdShowPersonDialog(value);
    });

    eventBus.$on("showPlotKeywordDialog", (value) => {
      // this.onIMDBPlotKeywordClicked(value);
      this.mpdShowPlotKeywordDialog(value);
    });

    eventBus.$on("showFilmingLocationDialog", (value) => {
      this.mpdShowFilmingLocationDialog(value);
    });

    eventBus.$on("showCompanyDialog", (value) => {
      this.mpdShowCompanyDialog(value);
    });

    eventBus.$on("rescanFinished", ({ hasChanges }) => {
      if (hasChanges) {
        (async () => {
          // // Reset after Rescan -> else we get fuckups with filterYears' range
          // store.resetFilters();
          // await store.saveFilterValues(this.mediatype);
          this.onReload();
        })();
      }
    });

    eventBus.$on("openChatGPTDialog", () => {
      this.openChatGPTDialog();
    });
    // #endregion

    (async () => {
      await this.fetchSeriesOwner(this.Series_id_Movies_Owner);

      // eventBus.refetchMedia();
      this.refetchMedia({});

      logger.log("[created] this.items:", this.items);
    })();

    this.sortAbles.forEach((sortAble) => {
      sortAble.DescriptionTranslated = this.$t(sortAble.Description);
    });

    this.updateCurrentTime();

    setInterval(() => {
      this.updateCurrentTime();
    }, 10000);

    // lodash debounced functions
    this.debouncedShowTrailer = _.debounce(this.showTrailer, 500);
  },

  beforeDestroy() {
    logger.log("[beforeDestroy] MediaList beforeDestroy START");
    this.items = [];
    eventBus.$off("searchTextChanged");
    eventBus.$off("refetchMedia");
    eventBus.$off("refetchFilters");
    eventBus.$off("listDialogSetUseExistingLists");
    eventBus.$off("listDialogSetCreateNewList");
    eventBus.$off("showPersonDialog");
    eventBus.$off("showPlotKeywordDialog");
    eventBus.$off("showFilmingLocationDialog");
    eventBus.$off("showCompanyDialog");
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.breathe-bg {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
}

.breathe-bg::after {
  background-color: rgba(255, 255, 255, 0.2);
  content: "";
  opacity: 0;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  position: absolute;
  z-index: -1;
  animation: breathe;
  animation-duration: 0.5s;
  animation-timing-function: ease-out;
  /*animation-iteration-count:infinite;*/
  /*animation-fill-mode:forwards;*/
  animation-direction: alternate;
  animation-iteration-count: infinite;
}

@keyframes breathe {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
</style>
