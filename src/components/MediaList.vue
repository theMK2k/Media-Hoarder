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
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <span v-on="on">
            <v-btn text v-on:click="$router.go(-1)" style="padding: 0px; margin-top: 6px; margin-left: 0px">
              <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
          </span>
        </template>
        <span>{{ $t("Go Back") }}</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <span v-on="on">
            <v-btn text v-on:click="onReload" style="padding: 0px; margin-top: 6px; margin-left: 0px">
              <v-icon>mdi-reload</v-icon>
            </v-btn>
          </span>
        </template>
        <span>{{ $t("Reload List") }}</span>
      </v-tooltip>
      <h1 style="margin-bottom: 0px; margin-top: 0px">
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
        v-bind:items="sortAbles"
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
        <mk-pagination v-bind:length="numPages" v-bind:pages="paginationItems" v-model="$shared.currentPage"></mk-pagination>

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
                  style="height: 38px !important; width: 38px !important; margin: 10px 8px 0px 0px !important; background-color: #424242"
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
    </v-row>

    <!-- mk-scrollcontainer -->
    <v-container class="pa-2" style="max-width: 100% !important; margin-top: 60px">
      <v-row v-for="(item, i) in itemsFilteredPaginated" v-bind:key="i">
        <v-col style="padding-bottom: 0px">
          <v-card dark flat hover v-bind:ripple="false" v-on:click="selectItem(item)">
            <v-list-item three-line style="padding-left: 0px; padding-right: 0px">
              <div v-on:mouseover="setItemHovered(item, 'avatar', true)" v-on:mouseleave="setItemHovered(item, 'avatar', false)">
                <v-list-item-avatar tile style="margin: 6px; height: 190px; width: 130px" v-on:click.stop="launch(item)">
                  <img
                    v-show="item.avatarHovered"
                    style="height: 190px; width: 130px; position: absolute; z-index: 1; opacity: 0.5; border-radius: 6px"
                    src="data:image/png;base64,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"
                  />

                  <v-img contain v-if="item.IMDB_posterSmall_URL" v-bind:src="item.IMDB_posterSmall_URL" style="border-radius: 6px"></v-img>
                  <v-icon v-if="!item.IMDB_posterSmall_URL" disabled x-large> mdi-filmstrip </v-icon>

                  <div class="duration-overlay-container" v-if="item.Duration">
                    <span class="duration-overlay">{{ item.Duration }}</span>
                  </div>
                </v-list-item-avatar>
              </div>
              <v-list-item-content class="align-self-start" style="padding: 0px">
                <v-col style="padding: 0px !important; margin-top: 16px">
                  <v-row style="margin: 0px">
                    <div style="margin-left: 4px; max-width: -webkit-fill-available">
                      <v-list-item-title
                        class="headline mb-2"
                        style="margin-bottom: 0px !important"
                        v-on:mouseover="setItemHovered(item, 'name', true)"
                        v-on:mouseleave="setItemHovered(item, 'name', false)"
                      >
                        <div style="display: flex; min-height: 30px">
                          <div style="overflow: hidden; text-overflow: ellipsis">
                            <word-highlighter v-bind:query="$shared.searchText || ''">
                              {{ item.Name }}
                            </word-highlighter>
                            <span>
                              <span
                                v-bind:class="{
                                  'mk-search-highlight': $shared.filterYearsActive,
                                }"
                              >
                                {{ item.yearDisplay }}
                              </span>
                              <span v-show="item.NumExtras">+{{ item.NumExtras }}</span>
                            </span>
                          </div>

                          <div>
                            <v-tooltip bottom>
                              <template v-slot:activator="{ on }">
                                <span v-on="on">
                                  <v-icon
                                    v-show="item.nameHovered || item.selected"
                                    class="mk-clickable"
                                    v-on:click.stop="onOpenEditMediaItemDialog(item)"
                                    style="margin-left: 8px; margin-bottom: 3px"
                                    >mdi-pencil</v-icon
                                  >
                                </span>
                              </template>
                              <span style="margin-left: ">{{ $t("Edit Movie") }}</span>
                            </v-tooltip>

                            <v-tooltip bottom>
                              <template v-slot:activator="{ on }">
                                <span v-on="on">
                                  <v-icon
                                    v-show="item.nameHovered || item.selected"
                                    class="mk-clickable"
                                    v-on:click.stop="onRescanItems([item])"
                                    style="margin-left: 8px; margin-bottom: 3px"
                                    v-bind:disabled="isScanning"
                                    >mdi-reload-alert</v-icon
                                  >
                                </span>
                              </template>
                              <span>
                                {{ $t("Rescan Meta Data") }}
                                <span v-if="isScanning">
                                  <br />
                                  {{ $t("scan already in progress") }}
                                </span>
                              </span>
                            </v-tooltip>

                            <v-tooltip bottom>
                              <template v-slot:activator="{ on }">
                                <span v-on="on">
                                  <v-icon
                                    v-show="item.nameHovered || item.selected"
                                    class="mk-clickable"
                                    v-on:click.stop="onOpenLinkIMDBDialog(item)"
                                    style="margin-left: 8px; margin-bottom: 3px"
                                    v-bind:disabled="isScanning"
                                    >mdi-link</v-icon
                                  >
                                </span>
                              </template>
                              <span>
                                {{ $t("Link with IMDB entry") }}
                                <span v-if="isScanning">
                                  <br />
                                  {{ $t("scan already in progress") }}
                                </span>
                              </span>
                            </v-tooltip>

                            <v-tooltip bottom>
                              <template v-slot:activator="{ on }">
                                <span v-on="on">
                                  <v-icon
                                    v-show="item.nameHovered || item.selected"
                                    class="mk-clickable-red"
                                    v-on:click.stop="onShowDeleteMediaDialog(item)"
                                    style="margin-left: 8px; margin-bottom: 3px"
                                    v-bind:disabled="isScanning"
                                    >mdi-delete</v-icon
                                  >
                                </span>
                              </template>
                              <span>
                                {{ $t("Delete") }}
                                <span v-if="isScanning">
                                  <br />
                                  {{ $t("scan already in progress") }}
                                </span>
                              </span>
                            </v-tooltip>
                          </div>
                        </div>
                      </v-list-item-title>

                      <v-list-item-subtitle
                        style="margin-bottom: 4px; min-height: 18px"
                        v-on:mouseover="setItemHovered(item, 'name2', true)"
                        v-on:mouseleave="setItemHovered(item, 'name2', false)"
                      >
                        <!-- v-if="item.Name2 || item.selected" -->
                        <word-highlighter v-bind:query="$shared.searchText || ''">
                          {{ item.Name2 }}
                        </word-highlighter>
                      </v-list-item-subtitle>

                      <div style="font-size: 0.875rem; font-weight: normal">
                        <span v-if="item.MI_Quality">
                          <span
                            class="mk-clickable"
                            v-bind:class="{
                              'mk-search-highlight': $shared.filterQualitiesAppliedContains(item.MI_Quality),
                            }"
                            v-on:click.stop="onVideoQualityClicked(item.MI_Quality)"
                            >{{ item.MI_Quality }}</span
                          >
                        </span>
                        <span v-if="item.AgeRating">
                          |
                          <span
                            class="mk-clickable"
                            v-bind:class="{
                              'mk-search-highlight': $shared.filterAgeRatingsActive,
                            }"
                            v-on:click.stop="onAgeRatingClicked(item.AgeRating)"
                            >{{ item.AgeRating }}</span
                          >
                        </span>
                        <span v-if="item.Genres">
                          |
                          <span v-for="(genre, index) in item.Genres" v-bind:key="genre.name">
                            <span>{{ index > 0 ? ", " : "" }}</span>
                            <span
                              class="mk-clickable"
                              v-bind:class="{
                                'mk-search-highlight': $shared.filterGenresAppliedContains(genre.translated),
                              }"
                              v-on:click.stop="onGenreClicked(genre)"
                              >{{ genre.translated }}</span
                            >
                          </span>
                        </span>

                        <span v-if="item.AudioLanguages">
                          |
                          <v-icon small>mdi-comment-outline</v-icon>
                          <span v-for="(lang, index) in item.AudioLanguages" v-bind:key="lang">
                            <span>{{ index > 0 ? ", " : " " }}</span>
                            <span
                              class="mk-clickable"
                              v-bind:class="{
                                'mk-search-highlight': $shared.filterAudioLanguagesAppliedContains(lang, item.AudioLanguages, item.Audio_Languages),
                              }"
                              v-on:click.stop="onLanguageClicked(lang, 'audio', item)"
                              >{{ lang }}</span
                            >
                          </span>
                        </span>

                        <span v-if="item.SubtitleLanguages">
                          |
                          <v-icon small style="margin-top: -3px">mdi-subtitles-outline</v-icon>
                          <span v-for="(lang, index) in item.SubtitleLanguages" v-bind:key="lang">
                            <span>{{ index > 0 ? ", " : " " }}</span>
                            <span
                              class="mk-clickable"
                              v-bind:class="{
                                'mk-search-highlight': $shared.filterSubtitleLanguagesAppliedContains(lang, item.AudioLanguages, item.Audio_Languages),
                              }"
                              v-on:click.stop="onLanguageClicked(lang, 'subtitle', item)"
                              >{{ lang }}</span
                            >
                          </span>
                        </span>

                        <span v-if="item.Video_Encoder_Display">
                          |
                          <span v-for="(videoEncoder, index) in item.Video_Encoder_Display" v-bind:key="index">
                            <span>{{ index > 0 ? ", " : " " }}</span>
                            <span
                              class="mk-clickable"
                              v-bind:class="{
                                'mk-search-highlight': $shared.filterVideoEncodersAppliedContains(videoEncoder),
                              }"
                              v-on:click.stop="onVideoEncoderClicked(videoEncoder, item)"
                              >{{ videoEncoder }}</span
                            >
                          </span>
                        </span>

                        <span v-if="item.Audio_Format_Display">
                          |
                          <span v-for="(audioFormat, index) in item.Audio_Format_Display" v-bind:key="index">
                            <span>{{ index > 0 ? ", " : " " }}</span>
                            <span
                              class="mk-clickable"
                              v-bind:class="{
                                'mk-search-highlight': $shared.filterAudioFormatsAppliedContains(audioFormat),
                              }"
                              v-on:click.stop="onAudioFormatClicked(audioFormat, item)"
                              >{{ audioFormat }}</span
                            >
                          </span>
                        </span>

                        <span v-if="item.ReleaseAttributes">
                          |
                          <span v-for="(releaseAttribute, index) in item.ReleaseAttributes" v-bind:key="releaseAttribute">
                            <span>{{ index > 0 ? ", " : " " }}</span>
                            <span
                              class="mk-clickable"
                              v-bind:class="{
                                'mk-search-highlight': $shared.filterReleaseAttributesAppliedContains(releaseAttribute),
                              }"
                              v-on:click.stop="onShowReleaseAttributeDialog(releaseAttribute, item)"
                              >{{ releaseAttribute }}</span
                            >
                          </span>
                        </span>
                      </div>
                    </div>
                    <div class="flex-grow-1"></div>
                    <div>
                      <div
                        class="headline mb-2"
                        style="margin-right: 16px; margin-left: 0px; margin-bottom: 0px !important"
                        v-if="item.IMDB_rating_defaultDisplay"
                      >
                        <v-icon small color="amber" style="padding-bottom: 4px">mdi-star</v-icon>
                        <!--
                          #rip-rating-demographics
                          <a class="headline mb-2 mk-clickable" v-on:click.stop="onShowRatingDemographicsDialog(item)">{{ item.IMDB_rating_defaultDisplay }}</a>
                        -->
                        <span class="headline mb-2">{{ item.IMDB_rating_defaultDisplay }}</span>
                        <span
                          v-if="item.IMDB_metacriticScore"
                          v-bind:class="helpers.getMetaCriticClass(item.IMDB_metacriticScore)"
                          style="padding: 4px; margin-left: 4px"
                          >{{ item.IMDB_metacriticScore }}</span
                        >
                      </div>
                      <v-row style="margin: 0px -12px">
                        <div class="flex-grow-1"></div>

                        <div v-on:click.stop="">
                          <star-rating
                            v-bind:increment="0.5"
                            v-bind:max-rating="5"
                            v-bind:star-size="16"
                            v-model="item.Rating"
                            v-bind:clearable="true"
                            v-bind:show-rating="false"
                            inactive-color="grey"
                            active-color="#ffc107"
                            style="margin-right: 26px; padding: 0px !important"
                            v-bind:star-points="[7, 3, 6, 6, 2, 6, 5, 8, 4, 12, 7, 10, 10, 12, 9, 8, 12, 6, 8, 6]"
                            v-bind:glow="1"
                            v-on:rating-selected="changeRating(item)"
                          ></star-rating>
                        </div>
                      </v-row>
                    </div>
                  </v-row>

                  <v-row v-if="item.plotSummary" style="margin: 4px 6px 8px 4px">
                    <div v-show="!item.selected" style="font-size: 0.875rem; font-weight: normal">
                      <word-highlighter v-bind:query="$shared.searchText || ''">
                        {{ item.plotSummary }}
                      </word-highlighter>
                    </div>
                    <div v-show="item.selected" style="font-size: 0.875rem; font-weight: normal">
                      {{ item.plotSummaryFull || item.plotSummary }}
                    </div>
                  </v-row>

                  <v-row v-if="item.IMDB_Top_Directors" class="mk-main-detail-row">
                    <div style="font-size: 0.875rem; font-weight: normal">
                      <div style="float: left; width: 100px; overflow: hidden">
                        <strong class="CreditCategory">{{ $t("Directed by") }}:</strong>
                      </div>
                      <div style="overflow: hidden">
                        <span v-for="(credit, i) in item.IMDB_Top_Directors" v-bind:key="credit.id_Movies_IMDB_Credits">
                          <span v-if="i > 0">,&nbsp;</span>
                          <a
                            class="mk-clickable"
                            v-bind:class="{
                              'mk-search-highlight': $shared.filterPersonsAppliedContains(credit),
                            }"
                            v-on:click.stop="onCreditClicked(credit)"
                            >{{ credit.name }}</a
                          >
                        </span>
                      </div>
                    </div>
                  </v-row>

                  <v-row v-if="item.IMDB_Top_Writers" class="mk-main-detail-row">
                    <div style="font-size: 0.875rem; font-weight: normal">
                      <div style="float: left; width: 100px; overflow: hidden">
                        <strong class="CreditCategory">{{ $t("Written by") }}:</strong>
                      </div>
                      <div style="overflow: hidden">
                        <span v-for="(credit, i) in item.IMDB_Top_Writers" v-bind:key="credit.id_Movies_IMDB_Credits">
                          <span v-if="i > 0">,&nbsp;</span>
                          <a
                            class="mk-clickable"
                            v-bind:class="{
                              'mk-search-highlight': $shared.filterPersonsAppliedContains(credit),
                            }"
                            v-on:click.stop="onCreditClicked(credit)"
                            >{{ credit.name }}</a
                          >
                        </span>
                      </div>
                    </div>
                  </v-row>

                  <v-row v-if="item.IMDB_Top_Cast" class="mk-main-detail-row">
                    <div style="font-size: 0.875rem; font-weight: normal">
                      <div style="float: left; width: 100px; overflow: hidden">
                        <strong class="CreditCategory">{{ $t("Cast") }}:</strong>
                      </div>
                      <div style="overflow: hidden">
                        <span v-for="(credit, i) in item.IMDB_Top_Cast" v-bind:key="credit.id_Movies_IMDB_Credits">
                          <span v-if="i > 0">,&nbsp;</span>
                          <a
                            class="mk-clickable"
                            v-bind:class="{
                              'mk-search-highlight': $shared.filterPersonsAppliedContains(credit),
                            }"
                            v-on:click.stop="onCreditClicked(credit)"
                            >{{ credit.name }}</a
                          >
                        </span>
                      </div>
                    </div>
                  </v-row>

                  <v-row v-if="item.IMDB_Top_Production_Companies" class="mk-main-detail-row">
                    <div style="font-size: 0.875rem; font-weight: normal">
                      <div style="float: left; width: 100px; overflow: hidden">
                        <strong class="CreditCategory">{{ $t("Production") }}:</strong>
                      </div>
                      <div style="overflow: hidden">
                        <span v-for="(company, i) in item.IMDB_Top_Production_Companies" v-bind:key="i">
                          <span v-if="i > 0">,&nbsp;</span>
                          <a
                            class="mk-clickable"
                            v-bind:class="{
                              'mk-search-highlight': $shared.filterCompaniesAppliedContains(company),
                            }"
                            v-on:click.stop="onCompanyClicked(company)"
                            >{{ company.name }}</a
                          >
                        </span>
                      </div>
                    </div>
                  </v-row>
                </v-col>
              </v-list-item-content>
            </v-list-item>

            <v-row v-if="item.scanErrors && Object.keys(item.scanErrors).length" style="margin: 8px">
              <v-alert type="warning" dense colored-border border="left">
                <span class="mk-clickable" v-on:click.stop="item.showScanErrors = !item.showScanErrors"
                  >{{ $t("Errors were encountered during the scan, consider a re-scan_") }}
                </span>
                <v-btn small text color="primary" v-on:click.stop="clearScanErrors(item)">{{ $t("Clear this message") }}</v-btn>
                <v-row v-if="item.showScanErrors" style="margin: 0px">
                  <ul style="font-size: 0.875rem; margin-left: 4px; margin-top: 8px">
                    <li v-for="(val, key) in item.scanErrors" v-bind:key="key" v-on:click.stop="item.showScanErrors = !item.showScanErrors">
                      {{ $t(key) }}:
                      {{ val.message ? $t(val.message, val.data) : val }}
                    </li>
                  </ul>
                </v-row>
              </v-alert>
            </v-row>

            <v-col v-if="item.selected" style="min-width: 100%">
              <v-row class="mk-detail-row">
                <v-col class="detailLabel"
                  ><strong>{{ $t("Full Path") }}:</strong></v-col
                >
                <v-col class="detailContent">
                  <word-highlighter
                    v-bind:query="$shared.searchText || ''"
                    v-bind:class="{
                      'mk-search-highlight': $shared.filterSourcePathsActive,
                    }"
                    >{{ item.SourcePath }}{{ pathSeparator }}</word-highlighter
                  ><word-highlighter v-bind:query="$shared.searchText || ''">{{ item.RelativePath }}</word-highlighter></v-col
                >
              </v-row>
              <v-row class="mk-detail-row">
                <v-col class="detailLabel"
                  ><strong>{{ $t("Imported") }}:</strong></v-col
                >
                <v-col class="detailContent">
                  <v-tooltip right>
                    <template v-slot:activator="{ on }">
                      <span v-on="on">{{ createdHumanized(item) }}</span>
                    </template>
                    <span>{{ createdDisplayText(item) }}</span>
                  </v-tooltip>
                </v-col>
              </v-row>
              <v-row class="mk-detail-row">
                <v-col class="detailLabel"
                  ><strong>{{ $t("Last Access") }}:</strong></v-col
                >
                <v-col class="detailContent">
                  <v-tooltip right>
                    <template v-slot:activator="{ on }">
                      <span v-on="on">{{ lastAccessHumanized(item) }}</span>
                    </template>
                    <span>{{ lastAccessDisplayText(item) }}</span>
                  </v-tooltip>
                </v-col>
              </v-row>
              <v-row class="mk-detail-row">
                <v-col class="detailLabel"
                  ><strong>{{ $t("Size") }}:</strong></v-col
                >
                <v-col v-if="item.Size" class="detailContent">{{ Humanize().fileSize(item.Size) }}</v-col>
              </v-row>
              <v-row class="mk-detail-row">
                <v-col class="detailLabel"
                  ><strong>{{ $t("File Created at") }}:</strong></v-col
                >
                <v-col v-if="item.file_created_at" class="detailContent">{{
                  moment().utc(parseInt(item.file_created_at)).local().format("YYYY-MM-DD HH:mm:ss")
                }}</v-col>
              </v-row>
              <v-row class="mk-detail-row">
                <v-col class="detailLabel"
                  ><strong>{{ $t("IMDB ID") }}:</strong></v-col
                >
                <v-col class="detailContent">
                  <word-highlighter v-bind:query="$shared.searchText || ''">
                    {{ item.IMDB_tconst || notAvailableText }}
                  </word-highlighter>
                </v-col>
              </v-row>
              <v-row class="mk-detail-row">
                <v-col class="detailLabel"
                  ><strong>{{ $t("In Lists") }}:</strong></v-col
                >
                <v-col class="detailContent">
                  <span v-if="item.lists && item.lists.length > 0">
                    <span v-for="(list, index) in item.lists" v-bind:key="index">
                      <span v-if="index > 0">,&nbsp;</span>
                      <span
                        v-bind:class="{
                          'mk-search-highlight': $shared.filterListsAppliedContains(list.Name),
                        }"
                        >{{ list.Name }}</span
                      >
                    </span>
                  </span>
                  <span v-if="!item.lists || item.lists.length === 0">&lt;{{ $t("not in any list") }}&gt;</span>
                  <v-btn class="mk-btn-small" text small color="primary" v-on:click.stop="addToList(item)" style="margin-top: -1px">{{ $t("Add") }}</v-btn>
                  <v-btn
                    v-if="item.lists && item.lists.length > 0"
                    class="mk-btn-small"
                    text
                    small
                    color="primary"
                    v-on:click.stop="removeFromList(item)"
                    style="margin-top: -1px"
                    >{{ $t("Remove") }}</v-btn
                  >
                </v-col>
              </v-row>

              <!-- Extras -->
              <div v-if="item.NumExtras">
                <v-row style="padding-left: 16px; padding-top: 8px; align-items: flex-end">
                  <span style="font-size: 20px">{{ $t("Extras") }}&nbsp;</span>
                </v-row>

                <v-row
                  v-for="extra in item.extras"
                  v-bind:key="extra.fullPath"
                  class="mk-clickable"
                  style="padding-left: 24px; padding-top: 4px; align-items: flex-end"
                  v-on:click.stop="launch(extra)"
                  >{{ extra.Name }}</v-row
                >
              </div>

              <!-- FULL CREDITS -->
              <div style="margin-top: 16px">
                <v-row
                  class="mk-item-detailcategory-header-row mk-clickable"
                  v-bind:class="{
                    'mk-search-highlight': $shared.filterPersonsActive,
                  }"
                  v-on:click.stop="showCredits(item, !item.showCredits)"
                >
                  <span class="mk-item-detailcategory-header">{{ $t("Credits") + (!item.showCredits ? " »" : "") }}&nbsp;</span>
                </v-row>

                <div class="mk-item-detailcategory-content" v-if="item.showCredits" v-on:click.stop="showCredits(item, false)">
                  <v-row v-if="!item.credits || item.credits.length === 0" style="margin-top: 8px; margin-left: 16px">
                    {{ $t("none provided") }}
                  </v-row>

                  <div v-for="creditCategory in item.credits" v-bind:key="creditCategory.Category" style="margin-left: 24px">
                    <v-row style="margin-top: 12px">
                      <strong>{{ $t(`CreditCategories.${creditCategory.category}`) }}</strong>
                    </v-row>
                    <!--  v-on:mouseover="setItemHovered(credit, 'credit', true)"
                    v-on:mouseleave="setItemHovered(credit, 'credit', false)"
                  -->
                    <v-row v-for="credit in creditCategory.items" v-bind:key="credit.id_Movies_IMDB_Credits" class="mk-highlightable-row">
                      <v-col sm="4" class="creditsLabel">
                        <a
                          class="mk-clickable"
                          v-bind:class="{
                            'mk-search-highlight': $shared.filterPersonsAppliedContains(credit),
                          }"
                          v-on:click.stop="onCreditClicked(credit)"
                          >{{ credit.name }}</a
                        >
                      </v-col>
                      <v-col sm="1" class="creditsContent">
                        <span v-if="credit.credit">...</span>
                      </v-col>
                      <v-col class="creditsContent">{{ credit.credit }}</v-col>
                    </v-row>
                  </div>
                </div>
              </div>

              <!-- COMPANIES -->
              <div style="margin-top: 4px">
                <v-row
                  class="mk-item-detailcategory-header-row mk-clickable"
                  v-bind:class="{
                    'mk-search-highlight': $shared.filterCompaniesActive,
                  }"
                  v-on:click.stop="showCompanies(item, !item.showCompanies)"
                >
                  <span class="mk-item-detailcategory-header">{{ $t("Companies") + (!item.showCompanies ? " »" : "") }}&nbsp;</span>
                </v-row>

                <div class="mk-item-detailcategory-content" v-if="item.showCompanies" v-on:click.stop="showCompanies(item, false)">
                  <v-row v-if="!item.companies || item.companies.length === 0" style="margin-top: 8px; margin-left: 16px">
                    {{ $t("none provided") }}
                  </v-row>

                  <div v-for="companyCategory in item.companies" v-bind:key="companyCategory.Category" style="margin-left: 24px">
                    <v-row style="margin-top: 12px">
                      <strong>{{ $t(`CompanyCategories.${companyCategory.category}`) }}</strong>
                    </v-row>
                    <v-row v-for="company in companyCategory.items" v-bind:key="company.id_Movies_IMDB_Credits" class="mk-highlightable-row">
                      <v-col sm="4" class="creditsLabel">
                        <a
                          class="mk-clickable"
                          v-bind:class="{
                            'mk-search-highlight': $shared.filterCompaniesAppliedContains(company),
                          }"
                          v-on:click.stop="onCompanyClicked(company)"
                          >{{ company.name }}</a
                        >
                      </v-col>
                      <v-col sm="1" class="creditsContent">
                        <!-- <span v-if="company.role">...</span> -->
                      </v-col>
                      <v-col class="creditsContent">{{ company.role }}</v-col>
                    </v-row>
                  </div>
                </div>
              </div>

              <!-- CONTENT/PARENTAL ADVISORIES -->
              <div style="margin-top: 4px">
                <v-row
                  class="mk-item-detailcategory-header-row mk-clickable"
                  v-bind:class="{
                    'mk-search-highlight': $shared.filterParentalAdvisoryActive,
                  }"
                  v-on:click.stop="showContentAdvisory(item, !item.showContentAdvisory)"
                >
                  <span class="mk-item-detailcategory-header">{{ $t("Content Advisory") + (!item.showContentAdvisory ? " »" : "") }}&nbsp;</span>
                </v-row>

                <div
                  class="mk-item-detailcategory-content"
                  v-if="item.showContentAdvisory"
                  v-on:click.stop="showContentAdvisory(item, false)"
                  style="margin-left: 8px"
                >
                  <v-row
                    v-for="category in $shared.contentAdvisoryCategories"
                    v-bind:key="category.Name"
                    class="mk-highlightable-row"
                    style="margin-top: 12px; margin-left: 6px"
                  >
                    <v-col sm="4" class="creditsContent" style="padding-left: 12px">{{ $t(`ParentalAdvisoryCategories.${category.Name}`) }}</v-col>
                    <v-col sm="1" class="creditsContent">
                      <!-- <span v-if="company.role">...</span> -->
                    </v-col>
                    <v-col
                      class="creditsContent"
                      v-bind:class="{
                        'mk-search-highlight': $shared.filterParentalAdvisoryAppliedContains(category.Name, item[`IMDB_Parental_Advisory_${category.Name}`]),
                      }"
                      >{{ contentAdvisorySeverityDisplayText(item[`IMDB_Parental_Advisory_${category.Name}`]) }}</v-col
                    >
                  </v-row>
                </div>
              </div>

              <!-- PLOT KEYWORDS -->
              <div style="margin-top: 4px">
                <v-row
                  class="mk-item-detailcategory-header-row mk-clickable"
                  v-bind:class="{
                    'mk-search-highlight': $shared.filterIMDBPlotKeywordsActive,
                  }"
                  v-on:click.stop="showPlotKeywords(item, !item.showPlotKeywords)"
                >
                  <span class="mk-item-detailcategory-header">{{ $t("Plot Keywords (Spoilers ahead!)") + (!item.showPlotKeywords ? " »" : "") }}&nbsp;</span>
                </v-row>

                <div class="mk-item-detailcategory-content" v-if="item.showPlotKeywords" v-on:click.stop="showPlotKeywords(item, false)">
                  <v-row v-if="!item.plotKeywords || item.plotKeywords.length === 0" style="margin-top: 8px; margin-left: 16px">
                    {{ $t("none provided") }}
                  </v-row>

                  <v-row v-for="plotKeyword in item.plotKeywords" v-bind:key="plotKeyword.Keyword" style="margin-top: 12px; margin-left: 24px">
                    <a
                      class="mk-clickable"
                      v-bind:class="{
                        'mk-search-highlight': $shared.filterIMDBPlotKeywordsAppliedContains(plotKeyword.Keyword),
                      }"
                      v-on:click.stop="onIMDBPlotKeywordClicked(plotKeyword)"
                      >{{ plotKeyword.Keyword }}</a
                    >

                    <!-- <v-col sm="4" class="creditsLabel">{{ plotKeyword.Keyword }}</v-col>
                    <v-col
                      class="creditsContent"
                    >{{ `${plotKeyword.NumVotes ? plotKeyword.NumRelevant + ' of ' + plotKeyword.NumVotes : 'no votes'}` }}</v-col>-->
                  </v-row>
                </div>
              </div>

              <!-- FILMING LOCATIONS -->
              <div style="margin-top: 4px">
                <v-row
                  class="mk-item-detailcategory-header-row mk-clickable"
                  v-bind:class="{
                    'mk-search-highlight': $shared.filterIMDBFilmingLocationsActive,
                  }"
                  v-on:click.stop="showFilmingLocations(item, !item.showFilmingLocations)"
                >
                  <span class="mk-item-detailcategory-header">{{ $t("Filming Locations") + (!item.showFilmingLocations ? " »" : "") }}&nbsp;</span>
                </v-row>

                <div class="mk-item-detailcategory-content" v-if="item.showFilmingLocations" v-on:click.stop="showFilmingLocations(item, false)">
                  <v-row v-if="!item.filmingLocations || item.filmingLocations.length === 0" style="margin-top: 8px; margin-left: 16px">
                    {{ $t("none provided") }}
                  </v-row>

                  <v-row
                    v-for="filmingLocation in item.filmingLocations"
                    v-bind:key="filmingLocation.id_IMDB_Filming_Locations"
                    style="margin-top: 12px; margin-left: 24px"
                  >
                    <a
                      class="mk-clickable"
                      v-bind:class="{
                        'mk-search-highlight': $shared.filterIMDBFilmingLocationsAppliedContains(filmingLocation.Location),
                      }"
                      v-on:click.stop="onIMDBFilmingLocationClicked(filmingLocation)"
                      >{{ filmingLocation.Location }}</a
                    >
                  </v-row>
                </div>
              </div>

              <v-row style="margin-top: 16px">
                <v-btn text color="primary" v-on:click.stop="copyInfo([item])">{{ $t("Copy Info") }}</v-btn>
                <v-btn v-if="item.IMDB_Trailer_URL" text color="primary" v-on:click.stop="showTrailerLocal(item)">{{ $t("Trailer") }}</v-btn>
                <v-btn text v-bind:disabled="!item.IMDB_tconst" color="primary" v-on:click.stop="openIMDB(item)">
                  <v-icon small>mdi-web</v-icon>&nbsp;IMDB
                </v-btn>
                <v-btn text v-bind:disabled="!item.IMDB_tconst" color="primary" v-on:click.stop="openLetterboxd(item)">
                  <v-icon small>mdi-web</v-icon>&nbsp;Letterboxd
                </v-btn>
                <v-btn text v-bind:disabled="!item.IMDB_tconst" color="primary" v-on:click.stop="openMovieChat(item)">
                  <v-icon small>mdi-web</v-icon>&nbsp;MovieChat
                </v-btn>
              </v-row>
            </v-col>
          </v-card>
        </v-col>
      </v-row>

      <!-- BOTTOM PAGINATION -->
      <v-row style="margin-bottom: 0px">
        <v-spacer></v-spacer>
        <div v-if="numPages" style="margin-right: 4px">
          <!-- <v-pagination v-bind:length="numPages" v-model="$shared.currentPage" total-visible="7"></v-pagination> -->
          <mk-pagination v-bind:length="numPages" v-bind:pages="paginationItems" v-model="$shared.currentPage" style="margin-right: 4px"></mk-pagination>
        </div>
      </v-row>
    </v-container>

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

    <mk-person-dialog
      ref="personDialog"
      v-bind:show="personDialog.show"
      v-bind:IMDB_Person_ID="personDialog.IMDB_Person_ID"
      v-bind:Person_Name="personDialog.Person_Name"
      v-on:close="onPersonDialogClose"
    ></mk-person-dialog>

    <mk-company-dialog
      ref="companyDialog"
      v-bind:show="companyDialog.show"
      v-bind:IMDB_Company_ID="companyDialog.IMDB_Company_ID"
      v-bind:Company_Name="companyDialog.Company_Name"
      v-on:close="onCompanyDialogClose"
    ></mk-company-dialog>

    <mk-video-quality-dialog
      ref="videoQualityDialog"
      v-bind:show="videoQualityDialog.show"
      v-bind:Video_Quality="videoQualityDialog.Video_Quality"
      v-on:close="onVideoQualityDialogClose"
    ></mk-video-quality-dialog>

    <mk-video-encoder-dialog
      ref="videoEncoderDialog"
      v-bind:show="videoEncoderDialog.show"
      v-bind:Video_Encoder="videoEncoderDialog.Video_Encoder"
      v-on:close="onVideoEncoderDialogClose"
    ></mk-video-encoder-dialog>

    <mk-audio-format-dialog
      ref="audioFormatDialog"
      v-bind:show="audioFormatDialog.show"
      v-bind:Audio_Format="audioFormatDialog.Audio_Format"
      v-on:close="onAudioFormatDialogClose"
    ></mk-audio-format-dialog>

    <mk-genre-dialog ref="genreDialog" v-bind:show="genreDialog.show" v-bind:Genre="genreDialog.Genre" v-on:close="onGenreDialogClose"></mk-genre-dialog>

    <mk-language-dialog
      ref="languageDialog"
      v-bind:show="languageDialog.show"
      v-bind:Type="languageDialog.Type"
      v-bind:Code="languageDialog.Code"
      v-bind:Language="languageDialog.Language"
      v-on:close="onLanguageDialogClose"
    ></mk-language-dialog>

    <mk-age-rating-dialog
      ref="ageRatingDialog"
      v-bind:show="ageRatingDialog.show"
      v-bind:Age_Rating="ageRatingDialog.Age_Rating"
      v-on:close="onAgeRatingDialogClose"
    ></mk-age-rating-dialog>

    <mk-plot-keyword-dialog
      ref="plotKeywordDialog"
      v-bind:show="plotKeywordDialog.show"
      v-bind:id_IMDB_Plot_Keywords="plotKeywordDialog.id_IMDB_Plot_Keywords"
      v-bind:Keyword="plotKeywordDialog.Keyword"
      v-on:close="onPlotKeywordDialogClose"
    ></mk-plot-keyword-dialog>

    <mk-filming-location-dialog
      ref="filmingLocationDialog"
      v-bind:show="filmingLocationDialog.show"
      v-bind:id_IMDB_Filming_Locations="filmingLocationDialog.id_IMDB_Filming_Locations"
      v-bind:Location="filmingLocationDialog.Location"
      v-on:close="onFilmingLocationDialogClose"
    ></mk-filming-location-dialog>

    <mk-video-player-dialog
      v-bind:show="videoPlayerDialog.show"
      v-bind:src="videoPlayerDialog.videoURL"
      v-on:close="onVideoPlayerDialogClose"
    ></mk-video-player-dialog>

    <mk-local-video-player-dialog
      v-if="localVideoPlayerDialog.instantiated"
      v-bind:show="localVideoPlayerDialog.show"
      v-bind:videoURL="localVideoPlayerDialog.videoURL"
      v-bind:slateURL="localVideoPlayerDialog.slate"
      v-bind:mimeType="localVideoPlayerDialog.mimeType"
      v-on:close="onLocalVideoPlayerDialogClose"
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

    <mk-release-attribute-dialog
      ref="releaseAttributeDialog"
      v-bind:show="releaseAttributeDialog.show"
      v-bind:ReleaseAttribute="releaseAttributeDialog.ReleaseAttribute"
      v-on:close="releaseAttributeDialog.show = false"
      v-on:delete="onReleaseAttributesDialogDelete"
    ></mk-release-attribute-dialog>

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
  </div>
</template>

<script>
const path = require("path");

const fs = require("fs-extra");

import StarRating from "vue-star-rating";
import * as Humanize from "humanize-plus";

import * as store from "@/store";
import { eventBus } from "@/main";
import { scrapeIMDBTrailerMediaURLs } from "@/imdb-scraper";
import WordHighlighter from "vue-word-highlighter";
import EditMediaItemDialog from "@/components/shared/EditMediaItemDialog.vue";
import ListDialog from "@/components/shared/ListDialog.vue";
import PersonDialog from "@/components/shared/PersonDialog.vue";
import CompanyDialog from "@/components/shared/CompanyDialog.vue";
import VideoQualityDialog from "@/components/shared/VideoQualityDialog.vue";
import VideoEncoderDialog from "@/components/shared/VideoEncoderDialog.vue";
import AudioFormatDialog from "@/components/shared/AudioFormatDialog.vue";
import GenreDialog from "@/components/shared/GenreDialog.vue";
import LanguageDialog from "@/components/shared/LanguageDialog.vue";
import AgeRatingDialog from "@/components/shared/AgeRatingDialog.vue";
import PlotKeywordDialog from "@/components/shared/PlotKeywordDialog.vue";
import FilmingLocationDialog from "@/components/shared/FilmingLocationDialog.vue";
import VideoPlayerDialog from "@/components/shared/VideoPlayerDialog.vue";
import LocalVideoPlayerDialog from "@/components/shared/LocalVideoPlayerDialog.vue";
import LinkIMDBDialog from "@/components/shared/LinkIMDBDialog.vue";
import Pagination from "@/components/shared/Pagination.vue";
import RatingDemographicsDialog from "@/components/shared/RatingDemographicsDialog";
import ReleaseAttributeDialog from "@/components/shared/ReleaseAttributeDialog";
import Dialog from "@/components/shared/Dialog.vue";

const { shell } = require("@electron/remote");

const moment = require("moment");

import * as helpers from "@/helpers/helpers";

const logger = require("../helpers/logger");

export default {
  components: {
    "star-rating": StarRating,
    "word-highlighter": WordHighlighter,
    "mk-list-dialog": ListDialog,
    "mk-person-dialog": PersonDialog,
    "mk-company-dialog": CompanyDialog,
    "mk-video-quality-dialog": VideoQualityDialog,
    "mk-video-encoder-dialog": VideoEncoderDialog,
    "mk-audio-format-dialog": AudioFormatDialog,
    "mk-genre-dialog": GenreDialog,
    "mk-language-dialog": LanguageDialog,
    "mk-age-rating-dialog": AgeRatingDialog,
    "mk-plot-keyword-dialog": PlotKeywordDialog,
    "mk-filming-location-dialog": FilmingLocationDialog,
    "mk-video-player-dialog": VideoPlayerDialog,
    "mk-local-video-player-dialog": LocalVideoPlayerDialog,
    "mk-link-imdb-dialog": LinkIMDBDialog,
    "mk-pagination": Pagination,
    "mk-rating-demographics-dialog": RatingDemographicsDialog,
    "mk-release-attribute-dialog": ReleaseAttributeDialog,
    "mk-edit-media-item-dialog": EditMediaItemDialog,
    "mk-delete-media-dialog": Dialog,
    "mk-rescan-current-list-dialog": Dialog,
  },

  data: () => ({
    items: [],
    sortAbles: [
      {
        Field: "Name",
        Description: "Title",
      },
      {
        Field: "IMDB_rating_default",
        Description: "IMDB Rating",
      },
      {
        Field: "IMDB_metacriticScore",
        Description: "Metacritic Score",
      },
      {
        Field: "Rating",
        Description: "My Rating",
      },
      {
        Field: "startYear",
        Description: "Release Year",
      },
      {
        Field: "created_at",
        Description: "Imported at",
      },
      {
        Field: "last_access_at",
        Description: "Last Access at",
      },
    ],

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

    personDialog: {
      show: false,
      IMDB_Person_ID: null,
      Person_Name: null,
    },

    companyDialog: {
      show: false,
      IMDB_Company_ID: null,
      Company_Name: null,
    },

    videoQualityDialog: {
      show: false,
      Video_Quality: null,
    },

    videoEncoderDialog: {
      show: false,
      Video_Encoder: null,
    },

    audioFormatDialog: {
      show: false,
      Audio_Format: null,
    },

    genreDialog: {
      show: false,
      Video_Quality: null,
    },

    languageDialog: {
      show: false,
      Type: null,
      Code: null,
    },

    ageRatingDialog: {
      show: false,
      Age_Rating: null,
    },

    plotKeywordDialog: {
      show: false,
      id_IMDB_Plot_Keywords: null,
      Keyword: null,
    },

    filmingLocationDialog: {
      show: false,
      id_IMDB_Filming_Locations: null,
      Location: null,
    },

    videoPlayerDialog: {
      show: false,
      videoURL: null,
    },

    localVideoPlayerDialog: {
      instantiated: false,
      show: false,
      videoURL: null,
      slateURL: null,
      mimeType: null,
    },

    editItemDialog: {
      show: false,
      title: null,
      item: {},
      attributeName: null,
      attributeDisplayText: null,
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

    releaseAttributeDialog: {
      show: false,
      ReleaseAttribute: null,
      movie: null,
    },

    deleteMediaDialog: {
      show: false,
      item: null,
      Title: null,
      Message: null,
      ItemName: null,
      loading: false,
    },

    rescanCurrentListDialog: {
      show: false,
    },

    itemsPerPage: 20,

    currentTime: moment(),

    editMediaItemDialog: {
      show: false,
      mediaItem: null,
    },

    loadFilterValuesFromStorage: false,

    fetchFiltersIteration: 0, // detect another fetch even when one is already running
  }),

  watch: {
    currentPage(newValue, oldValue) {
      logger.log("[currentPage] newValue:", newValue, "oldValue:", oldValue);

      if (!newValue) {
        this.$shared.currentPage = oldValue || 1;
        return;
      }
      store.saveCurrentPage(this.mediatype);

      this.completelyFetchMedia();

      window.scrollTo(0, 0);
    },

    sortField() {
      this.completelyFetchMedia();
    },
  },

  props: ["mediatype"],

  computed: {
    helpers() {
      return helpers;
    },

    pathSeparator() {
      return path.sep;
    },

    notAvailableText() {
      // we can't use "<" or ">" in template without irritating the formatter/linter
      return this.$t("<not available>");
    },

    isScanning() {
      return this.$shared.isScanning;
    },

    searchText() {
      return this.$shared.searchText;
    },

    numPages() {
      return Math.ceil(this.itemsFiltered.length / this.itemsPerPage);
    },

    sortField() {
      return this.$shared.sortField;
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
          case "last_access_at":
            detailInfo = currentItem.last_access_at ? currentItem.last_access_at.replace(/\d+:\d+:\d+/, "") : "";
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
      return this.itemsFiltered.slice((this.$shared.currentPage - 1) * this.itemsPerPage, this.$shared.currentPage * this.itemsPerPage);
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
        filtersList.push(`${this.$t("Companies")}${this.$shared.filters.filterSettings.filterCompaniesAND ? " ߷" : ""}`);
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
        filtersList.push(`${this.$t("Release Attributes")}${this.$shared.filters.filterSettings.filterReleaseAttributesAND ? " ߷" : ""}`);
      }

      if (this.$shared.filterIMDBPlotKeywordsActive) {
        filtersList.push(`${this.$t("Plot Keywords")}${this.$shared.filters.filterSettings.filterIMDBPlotKeywordsAND ? " ߷" : ""}`);
      }

      if (this.$shared.filterIMDBFilmingLocationsActive) {
        filtersList.push(`${this.$t("Filming Locations")}${this.$shared.filters.filterSettings.filterIMDBFilmingLocationsAND ? " ߷" : ""}`);
      }

      if (this.$shared.filterMetacriticScoreActive) {
        filtersList.push(this.$t("Metacritic Score"));
      }

      if (this.$shared.filterIMDBRatingsActive) {
        filtersList.push(this.$t("IMDB Ratings"));
      }

      if (this.$shared.filterDataQualityActive) {
        filtersList.push(`${this.$t("Data Quality")}${this.$shared.filters.filterSettings.filterDataQualityAND ? " ߷" : ""}`);
      }

      return filtersList;
    },

    itemsFiltered() {
      return this.items
        .filter((item) => {
          let isGood = true;

          if (this.searchText) {
            const searchTextLower = this.searchText.toLowerCase();
            const searchTextFiltered = /tt\d+/.test(searchTextLower) ? searchTextLower.match(/tt\d+/)[0] : searchTextLower;
            isGood = item.SearchSpace.includes(searchTextFiltered);
          }

          return isGood;
        })
        .sort((a, b) => {
          if (!this.$shared.sortField) {
            return 0; // nothing to sort
          }

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
  },

  methods: {
    moment() {
      return moment;
    },

    Humanize() {
      return Humanize;
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

    async launch(movie) {
      const start = moment();

      await store.launchMovie(movie);

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

      const arr_id_Movies = await store.setLastAccess(movie.id_Movies);
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

    showTrailer(item) {
      const trailerURL = item.IMDB_Trailer_URL.replace("https://www.imdb.com", "");
      this.videoPlayerDialog.videoURL = `https://www.imdb.com${trailerURL}`;
      logger.log("[showTrailer] this.videoPlayerDialog.videoURL:", this.videoPlayerDialog.videoURL);
      this.videoPlayerDialog.show = true;
    },

    async showTrailerLocal(item) {
      try {
        const trailerURL = item.IMDB_Trailer_URL.replace("https://www.imdb.com", "");

        const trailerMediaURLs = await scrapeIMDBTrailerMediaURLs(`https://www.imdb.com${trailerURL}`);

        logger.log("[showTrailer] trailerMediaURLs:", trailerMediaURLs);

        const dontUseLocalPlayer = false; // TODO: we can scrape mediaURLs, but we get a 403 Forbidden if we access them with our media player

        if (dontUseLocalPlayer || !trailerMediaURLs || !trailerMediaURLs.mediaURLs || trailerMediaURLs.mediaURLs.length == 0) {
          return this.showTrailer(item); // Fallback to the more general player showing the IMDB site
        }

        const trailerMediaURL = store.selectBestQualityMediaURL(trailerMediaURLs.mediaURLs);

        logger.log("[showTrailerLocal] selected best quality trailerMediaURL:", trailerMediaURL);

        this.localVideoPlayerDialog.videoURL = trailerMediaURL.mediaURL;
        this.localVideoPlayerDialog.mimeType = trailerMediaURL.mimeType;
        this.localVideoPlayerDialog.slateURL = trailerMediaURLs.slateURL;
        this.localVideoPlayerDialog.instantiated = true;
        this.localVideoPlayerDialog.show = true;
      } catch (err) {
        eventBus.showSnackbar("error", err);
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

            eventBus.refetchMedia(this.$shared.currentPage);

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

    $local_t(key, payload) {
      return this.$t(key, payload);
    },

    /**
     * @param {Object} setFilter:
     *                 key has value null: the filter will be refetched early
     *                 key has values: the filter items will be enabled
     * @param {Boolean} specificBySetFilter ONLY refetch the filter specified in setFilter
     */
    async fetchFilters(setFilter, specificBySetFilter) {
      logger.group("[Fetch Filters]");

      try {
        // eventBus.showSidebarLoadingOverlay(true);

        const currentFetchFiltersIteration = ++this.fetchFiltersIteration;

        this.$shared.isLoadingFilter = true;

        let filterGroups = JSON.parse(JSON.stringify(this.$shared.filterGroups));

        // put any filter in setFilter on top of the list (filters in setFilter are ones provided by dialogs, e.g. GenreDialog)
        logger.log("[fetchFilters] setFilter:", setFilter);
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
          logger.log("[fetchFilters] this.$shared.lastChangedFilter:", this.$shared.lastChangedFilter);
          logger.log("[fetchFilters] filterGroups before:", filterGroups);
          if (this.$shared.lastChangedFilter) {
            const index = filterGroups.findIndex((item) => item.name === this.$shared.lastChangedFilter);

            logger.log("[fetchFilters] index:", index);

            const item = filterGroups[index];

            logger.log("[fetchFilters] item:", item);

            filterGroups.splice(index, 1); // remove the item in-place
            filterGroups = [item, ...filterGroups];
          }
          this.$shared.lastChangedFilter = null; // we only need this once
        }

        logger.log("[fetchFilters] filterGroups:", filterGroups);

        for (let i = 0; i < filterGroups.length; i++) {
          if (currentFetchFiltersIteration !== this.fetchFiltersIteration) {
            break;
          }

          const filter = filterGroups[i];

          this.$shared.loadingFilterProgress = 100 * (i / filterGroups.length);

          switch (filter.name) {
            case "filterSettings":
              await store.fetchFilterSettings(this.mediatype, this.loadFilterValuesFromStorage);
              break;
            case "filterSourcePaths":
              await store.fetchFilterSourcePaths(this.mediatype, this.loadFilterValuesFromStorage);
              break;
            case "filterGenres":
              await store.fetchFilterGenres(this.mediatype, this.$local_t, this.loadFilterValuesFromStorage);
              break;
            case "filterAgeRatings":
              await store.fetchFilterAgeRatings(this.mediatype, this.loadFilterValuesFromStorage);
              break;
            case "filterRatings":
              await store.fetchFilterRatings(this.mediatype, this.loadFilterValuesFromStorage);
              break;
            case "filterLists":
              await store.fetchFilterLists(this.mediatype, this.$local_t, this.loadFilterValuesFromStorage);
              break;
            case "filterParentalAdvisory":
              await store.fetchFilterParentalAdvisory(this.mediatype, this.loadFilterValuesFromStorage);
              break;
            case "filterPersons":
              await store.fetchFilterPersons(this.mediatype, this.$local_t, this.loadFilterValuesFromStorage);
              break;
            case "filterCompanies":
              await store.fetchFilterCompanies(this.mediatype, this.$local_t, this.loadFilterValuesFromStorage);
              break;
            case "filterIMDBPlotKeywords":
              await store.fetchFilterIMDBPlotKeywords(this.mediatype, this.$local_t, this.loadFilterValuesFromStorage);
              break;
            case "filterIMDBFilmingLocations":
              await store.fetchFilterIMDBFilmingLocations(this.mediatype, this.$local_t, this.loadFilterValuesFromStorage);
              break;
            case "filterYears":
              // await store.fetchFilterReleaseYears(this.mediatype, this.loadFilterValuesFromStorage);
              await store.fetchFilterYears(this.mediatype, this.loadFilterValuesFromStorage);
              break;
            case "filterQualities":
              await store.fetchFilterQualities(this.mediatype, this.loadFilterValuesFromStorage);
              break;
            case "filterAudioLanguages":
              await store.fetchFilterLanguages(this.mediatype, "audio", this.$local_t, this.loadFilterValuesFromStorage);
              break;
            case "filterSubtitleLanguages":
              await store.fetchFilterLanguages(this.mediatype, "subtitle", this.$local_t, this.loadFilterValuesFromStorage);
              break;
            case "filterIMDBRating":
              await store.fetchFilterIMDBRating(this.mediatype, this.loadFilterValuesFromStorage);
              break;
            case "filterMetacriticScore":
              await store.fetchFilterMetacriticScore(this.mediatype, this.loadFilterValuesFromStorage);
              break;
            case "filterReleaseAttributes":
              await store.fetchFilterReleaseAttributes(this.mediatype, this.loadFilterValuesFromStorage);
              break;
            case "filterDataQuality":
              await store.fetchFilterDataQuality(this.mediatype, this.loadFilterValuesFromStorage);
              break;
            case "filterVideoEncoders":
              await store.fetchFilterVideoEncoders(this.mediatype, this.loadFilterValuesFromStorage);
              break;
            case "filterAudioFormats":
              await store.fetchFilterAudioFormats(this.mediatype, this.loadFilterValuesFromStorage);
              break;
            default:
              throw new Error("Unsupported filter type:", filter.name);
          }
        }

        if (setFilter) {
          eventBus.setFilter(setFilter);
        }

        if (currentFetchFiltersIteration !== this.fetchFiltersIteration) {
          // another fetch has been initiated
          logger.groupEnd();
          return;
        }

        this.$shared.loadingFilterProgress = 100;

        await store.fetchSortValues(this.mediatype);

        await store.fetchCurrentPage(this.mediatype);

        // eventBus.showSidebarLoadingOverlay(false);

        this.$shared.isLoadingFilter = false;
      } catch (err) {
        logger.error(err);
      }

      logger.groupEnd();
    },

    onCreditClicked(credit) {
      logger.log("[onCreditClicked] credit:", credit);

      this.personDialog.show = true;
      this.personDialog.IMDB_Person_ID = credit.id;
      this.personDialog.Person_Name = credit.name;
      // this.$refs.personDialog.init();

      return;
    },

    onCompanyClicked(company) {
      logger.log("[onCompanyClicked]:", company);

      this.companyDialog.show = true;
      this.companyDialog.IMDB_Company_ID = company.id;
      this.companyDialog.Company_Name = company.name;
      // this.$refs.personDialog.init();

      return;
    },

    onVideoQualityClicked(videoQuality) {
      logger.log("[onVideoQualityClicked]:", videoQuality);

      this.videoQualityDialog.show = true;
      this.videoQualityDialog.Video_Quality = videoQuality;

      return;
    },

    onVideoEncoderClicked(videoEncoder) {
      logger.log("[onVideoEncoderClicked]:", videoEncoder);

      this.videoEncoderDialog.show = true;
      this.videoEncoderDialog.Video_Encoder = videoEncoder;

      return;
    },

    onAudioFormatClicked(audioFormat) {
      logger.log("[onAudioFormatClicked]:", audioFormat);

      this.audioFormatDialog.show = true;
      this.audioFormatDialog.Audio_Format = audioFormat;

      return;
    },

    onGenreClicked(genre) {
      logger.log("[onGenreClicked]:", genre);

      this.genreDialog.show = true;
      this.genreDialog.Genre = genre;

      return;
    },

    async onLanguageClicked(code, type, item) {
      logger.log("[onLanguageClicked]:", code, type);

      if (/\+\d/.test(code)) {
        // clicked language is expandable, e.g. "+4"
        await this.expandLanguages(item, type);
        return;
      }

      // clicked language is a standard language code, e.g. "De"
      this.languageDialog.Type = type;
      this.languageDialog.Code = code;
      this.languageDialog.show = true;

      return;
    },

    async expandLanguages(item, type) {
      if (type === "audio") {
        item.AudioLanguages = store.generateLanguageArray(item.MI_Audio_Languages, 9999);
      } else {
        item.SubtitleLanguages = store.generateLanguageArray(item.MI_Subtitle_Languages, 9999);
      }
    },

    onAgeRatingClicked(ageRating) {
      logger.log("[onAgeRatingClicked]:", ageRating);

      this.ageRatingDialog.show = true;
      this.ageRatingDialog.Age_Rating = ageRating;

      return;
    },

    onIMDBPlotKeywordClicked(plotKeyword) {
      logger.log("[onPlotKeywordClicked]:", plotKeyword);

      this.plotKeywordDialog.show = true;
      this.plotKeywordDialog.id_IMDB_Plot_Keywords = plotKeyword.id_IMDB_Plot_Keywords;
      this.plotKeywordDialog.Keyword = plotKeyword.Keyword;

      return;
    },

    onIMDBFilmingLocationClicked(filmingLocation) {
      logger.log("[onIMDBFilmingLocationClicked]:", filmingLocation);

      this.filmingLocationDialog.show = true;
      this.filmingLocationDialog.id_IMDB_Filming_Locations = filmingLocation.id_IMDB_Filming_Locations;
      this.filmingLocationDialog.Location = filmingLocation.Location;

      return;
    },

    lastAccessHumanized(movie) {
      if (!movie.last_access_at) {
        return "none";
      }

      if (!movie.lastAccessMoment) {
        movie.lastAccessMoment = moment(movie.last_access_at);
      }

      return this.$t("{duration} ago", {
        timespan: moment.duration(movie.lastAccessMoment.diff(this.currentTime)).humanize(),
      });
    },

    createdHumanized(movie) {
      if (!movie.created_at) {
        return "none";
      }

      if (!movie.createdMoment) {
        movie.createdMoment = moment(movie.created_at);
      }

      return this.$t("{duration} ago", {
        timespan: moment.duration(movie.createdMoment.diff(this.currentTime)).humanize(),
      });
    },

    lastAccessDisplayText(movie) {
      if (!movie.last_access_at) {
        return "";
      }

      if (!movie.lastAccessMoment) {
        movie.lastAccessMoment = moment(movie.last_access_at);
      }

      return moment.utc(movie.lastAccessMoment).local().format("YYYY-MM-DD HH:mm:ss");
    },

    async updateCurrentTime() {
      this.currentTime = moment(await store.getCurrentTime());
    },

    createdDisplayText(movie) {
      if (!movie.created_at) {
        return "";
      }

      if (!movie.createdMoment) {
        movie.createdMoment = moment(movie.created_at);
      }

      return moment.utc(movie.createdMoment).local().format("YYYY-MM-DD HH:mm:ss");
    },

    openIMDB(movie) {
      shell.openExternal(`https://www.imdb.com/title/${movie.IMDB_tconst}/`);
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

    onLanguageDialogClose() {
      this.languageDialog.show = false;
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
    },

    onLocalVideoPlayerDialogClose() {
      this.localVideoPlayerDialog.show = false;
      setTimeout(() => {
        this.localVideoPlayerDialog.instantiated = false;
      }, 250);
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

        await store.assignIMDB(this.linkIMDBDialog.item.id_Movies, tconst, false, null, this.$local_t);

        eventBus.rescanStopped();

        eventBus.refetchMedia(this.$shared.currentPage);

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

        await store.deleteIMDBData(this.linkIMDBDialog.item.id_Movies);

        eventBus.refetchMedia(this.$shared.currentPage);

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

        eventBus.refetchMedia(this.$shared.currentPage, this.$local_t);

        eventBus.showSnackbar("success", this.$t(`${items.length === 1 ? "entry" : "entries"} successfully rescanned`));
      } catch (err) {
        logger.log("[onRescanItem] error:", JSON.stringify(err));
        eventBus.showSnackbar("error", err);
      }
    },

    setItemHovered(item, section, value) {
      this.$set(item, `${section}Hovered`, value);
    },

    async onEditItemDialogOK(result) {
      logger.log("[onEditItemDialogOK] EDIT NAME DIALOG OK result:", result);
      this.editItemDialog.show = false;

      const useActualDuplicates =
        (this.editItemDialog.attributeName == "Name" && this.$shared.duplicatesHandling.actualDuplicate.updateTitle) ||
        (this.editItemDialog.attributeName == "Name2" && this.$shared.duplicatesHandling.actualDuplicate.updateSubTitle);

      const arr_id_Movies = await store.updateMovieAttribute(
        this.editItemDialog.item.id_Movies,
        this.editItemDialog.attributeName,
        result.textValue,
        useActualDuplicates,
        false
      );

      this.items.forEach((mov) => {
        if (arr_id_Movies.findIndex((id_Movies) => mov.id_Movies === id_Movies) !== -1) {
          this.$set(mov, this.editItemDialog.attributeName, result.textValue);
        }
      });

      eventBus.showSnackbar(
        "success",
        this.$t("{something} successfully changed_", {
          something: this.editItemDialog.attributeDisplayText,
        })
      );
    },

    onEditItemDialogCancel() {
      this.editItemDialog.show = false;
    },

    contentAdvisorySeverityDisplayText(severity) {
      if (severity == 0) {
        return this.$t("None");
      } else if (severity == 1) {
        return this.$t("Mild");
      } else if (severity == 2) {
        return this.$t("Moderate");
      } else if (severity == 3) {
        return this.$t("Severe");
      }

      return this.$t("<not available>");
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

    onSortChanged() {
      store.saveSortValues(this.mediatype);
    },

    onReload() {
      logger.log("[onReload]");
      eventBus.refetchMedia();
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

        logger.group("[Fetch Media Details]");

        const result = await store.fetchMedia(this.mediatype, arr_id_Movies, false, this.$local_t, this.$shared.filters);

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

      logger.groupEnd();
    },

    onShowRatingDemographicsDialog(item) {
      this.ratingDemographicsDialog.title = item.Name;

      this.$refs.ratingDemographicsDialog.init(item.id_Movies);

      this.ratingDemographicsDialog.show = true;
    },

    onShowReleaseAttributeDialog(releaseAttribute, movie) {
      this.releaseAttributeDialog.ReleaseAttribute = releaseAttribute;
      this.releaseAttributeDialog.movie = movie;

      this.$refs.releaseAttributeDialog.init(releaseAttribute);

      this.releaseAttributeDialog.show = true;
    },

    onShowDeleteMediaDialog(item) {
      logger.log("[onShowDeleteMediaDialog] item:", item);

      this.deleteMediaDialog.item = item;
      this.deleteMediaDialog.Title = "Delete Media";
      this.deleteMediaDialog.Message =
        "This will delete '{ItemName}' and all the files associated to it on your hard drive_ Do you really want to delete the media?";
      this.deleteMediaDialog.ItemName = item.Name;
      this.deleteMediaDialog.alertType = null;
      this.deleteMediaDialog.alertText = null;

      this.deleteMediaDialog.show = true;
    },

    async onReleaseAttributesDialogDelete() {
      try {
        await store.removeReleaseAttributeFromMovie(this.releaseAttributeDialog.movie.id_Movies, this.releaseAttributeDialog.ReleaseAttribute);

        eventBus.refetchMedia();

        eventBus.showSnackbar(
          "success",
          this.$t('Release Attribute "{ReleaseAttribute}" successfully removed from selected movie_', {
            ReleaseAttribute: this.releaseAttributeDialog.ReleaseAttribute,
          })
        );
      } catch (error) {
        eventBus.showSnackbar("error", error);
      }
    },

    onOpenEditMediaItemDialog(item) {
      logger.log("[onOpenEditMediaItemDialog] item:", item);
      this.editMediaItemDialog.mediaItem = JSON.parse(JSON.stringify(item)); // we don't allow direct manipulation of the item itself
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

        if (this.deleteMediaDialog.item.isDirectoryBased) {
          if (await this.checkPathExistence(this.deleteMediaDialog.item.fullDirectory, checkRemovedFiles)) {
            logger.log("[onDeleteMediaDialogYes] deleting directory:", this.deleteMediaDialog.item.fullDirectory);
            await fs.rm(this.deleteMediaDialog.item.fullDirectory, {
              recursive: true,
              force: true,
            });
          }
        } else {
          if (await this.checkPathExistence(this.deleteMediaDialog.item.fullPath, checkRemovedFiles)) {
            logger.log("[onDeleteMediaDialogYes] deleting file:", this.deleteMediaDialog.item.fullDirectory);
            await fs.rm(this.deleteMediaDialog.item.fullPath);
          }
        }

        // remove media entries from DB (use isRemoved?)
        for (const extra of this.deleteMediaDialog.item.extras || []) {
          await store.db.fireProcedure(`UPDATE tbl_Movies SET isRemoved = 1 WHERE id_Movies = $id_Movies`, { $id_Movies: extra.id_Movies });
        }
        await store.db.fireProcedure(`UPDATE tbl_Movies SET isRemoved = 1 WHERE id_Movies = $id_Movies`, { $id_Movies: this.deleteMediaDialog.item.id_Movies });

        eventBus.showSnackbar(
          "success",
          this.$t("'{ItemName}' has been deleted_", {
            ItemName: this.deleteMediaDialog.item.Name,
          })
        );

        eventBus.refetchMedia();

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
      if (this.deleteMediaDialog.item.isDirectoryBased) {
        shell.showItemInFolder(this.deleteMediaDialog.item.fullDirectory);
      } else {
        shell.showItemInFolder(this.deleteMediaDialog.item.fullPath);
      }
    },

    async onDeleteMediaDialogCancel() {
      this.deleteMediaDialog.show = false;
    },

    async onRescanCurrentListDialogOK() {
      this.rescanCurrentListDialog.show = false;

      // TODO: properly handle array for the rescan (total time etc.)
      this.onRescanItems(this.items);
    },

    async onListActionCopyInfo() {},
  },

  // ### LifeCycle Hooks ###
  created() {
    logger.log("[created] MediaList created");

    // Register eventBus events
    eventBus.$on("searchTextChanged", () => {
      this.$shared.currentPage = 1;
      store.saveCurrentPage(this.mediatype);
      this.completelyFetchMedia();
    });

    eventBus.$on("refetchMedia", (setPage, $t, setFilter) => {
      logger.group("[Fetch Media List]");
      (async () => {
        eventBus.showLoadingOverlay(true);

        this.items = [];
        this.items = await store.fetchMedia(this.mediatype, null, true, $t, this.$shared.filters);

        this.$shared.currentPage = setPage && setPage <= this.numPages ? setPage : 1;
        store.saveCurrentPage(this.mediatype);

        await this.completelyFetchMedia();

        eventBus.showLoadingOverlay(false);

        await this.fetchFilters(setFilter);

        this.loadFilterValuesFromStorage = false; // only load filter values from storage initially
      })();
      logger.groupEnd();
    });

    eventBus.$on("refetchFilters", (setFilter) => {
      this.fetchFilters(setFilter);
    });

    eventBus.$on("refetchSpecificFilter", (setFilter) => {
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
      this.onCreditClicked(value);
    });

    eventBus.$on("showPlotKeywordDialog", (value) => {
      this.onIMDBPlotKeywordClicked(value);
    });

    eventBus.$on("showFilmingLocationDialog", (value) => {
      this.onIMDBFilmingLocationClicked(value);
    });

    eventBus.$on("showCompanyDialog", (value) => {
      this.onCompanyClicked(value);
    });

    eventBus.$on("rescanFinished", ({ rescanAddedMovies, rescanRemovedMovies }) => {
      if (rescanAddedMovies || rescanRemovedMovies) {
        (async () => {
          // // Reset after Rescan -> else we get fuckups with filterYears' range
          // store.resetFilters();
          // await store.saveFilterValues(this.mediatype);
          this.onReload();
        })();
      }
    });
    (async () => {
      eventBus.refetchMedia();

      this.$shared.currentPage = await store.fetchCurrentPage(this.mediatype);

      logger.log("[created] this.items:", this.items);
    })();

    this.sortAbles.forEach((sortAble) => {
      sortAble.DescriptionTranslated = this.$t(sortAble.Description);
    });

    this.updateCurrentTime();

    setInterval(() => {
      this.updateCurrentTime();
    }, 10000);
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
.CreditCategory {
  display: block;
  float: left;
  width: 100px;
}

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

.detailLabel {
  font-size: 14px;
  padding-left: 16px;
  padding-right: 0px;
  padding-top: 0px;
  padding-bottom: 0px;
  width: 146px !important;
  max-width: 146px !important;
  min-width: 146px !important;
}

.detailContent {
  font-size: 14px;
  padding-left: 0px;
  padding-right: 0px;
  padding-top: 0px;
  padding-bottom: 0px;
  width: 100% !important;
}

.creditsLabel {
  padding-left: 14px;
  padding-right: 0px;
  padding-top: 0px;
  padding-bottom: 0px;
}

.creditsContent {
  font-size: 14px;
  padding-left: 0px;
  padding-right: 0px;
  padding-top: 0px;
  padding-bottom: 0px;
}

.avatarHovered {
  background-color: rgba(0, 0, 0, 0.5);
  /* mask-image: url("data:image/png;base64,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"); */
  mask-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAACWCAIAAACaSNt3AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAARuSURBVHhe7dpdTBxVFMBxXDawWZaPtzaxiVVrQ5GStAlNILWpTcGPpA8+0LSkaDH6gBGtD0aJJJpICtaPvqCiPhShFlMTbYwfaYva1BeqFVuKgBYTmlSlgbaz7Ee3sKDH3MlmLakJ292ZO7P/Hzd3ZueSDZzcPXPO7uYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADADXLNo60erH0gHI7Ij/kYmfDWvjf/vr5wLRjd0/ysN9drXkXaqUCrcW5waGP1RnPBXTzm0T4zMzMyHz121DCM8nvLv//uZO+BnuXLlqtVpM3uhsdkL184P6E2dTw6J/PVS1dclkns39E3yM3NlT1eUlKy/439P/846JpMol2gRVFRkczRaNRNmUTHQCt+v1/m+fn5XfW7RodGnJ5J9A204ppMYn+gY7GYzB7PTf8SV2YSG2zetFnKjL8u/Kmqjv8fzq1JdE8dN3BuJnFYoIVDM4nzAq0k1yTnR3578fkXNM8kTg20ojJJIBBob2s/Nzi0dctWc0E/9gfaMAyZ8/Ly1MOlUpkkEomUlpYe//pYX++hFbevUEv4j5V3rJRCIjhlJEqLlMdcZFbm0OUZ/TOJDdIYaBmJ5xk9O6JVJnF2jl5M20zitkArBQUFMsfj8R3bd4wOjeiQSdwZaMXr9TqlJrGCL98nKXX+Wlzl1kyM8JWQOsn2miQRkYwOe2uS28yjreT/N88yTDKJuluOjY01P/dM/7f96roF3JyjF7OxJsmuHZ1sbm7O4/GUr1s79uuYeSmTsmtHJ1tYWJBYh8MWfT1Ki0BPTEyYZ5aQ1CFzfn7+kc+PqCsWyK4dHQwGZZZ25szZM/fXbNnZUH/xj4tqKdOyJdDRaFRyRXFx8fT0dNPTTZVVG06cPGGuWSIrAh2Lxfx+vwS6853Oe8pWd33wXnw+bq5ZxeWBDoVCMvt8vv5v+teur5Da2Qj++/a39bQItPrGQXpJbyJzYWHh+Pj4tke21Txca00ZdzNaBHry0qR5libxeFx6E8MwWlpbZCN/8dWX5oJ93JY65KYns9fr7e7pXlNR1vH6a7Hr6X+5pMA9gVa5Qm56A6cGqu6rbnzy8bS/UG6FGwItdzypKCRXTE5ONuxuqNpUPfDDgLmmDccHWtpouePNzs627W2T0u1g30fmAhb77PCn6i3jJY3Q5Rl18smhw6vuXmU+l6602NFLrW1VOg4EAsO/DNc8VFtXv33893G1pC2HpQ4pKhKlW/Oe5nWV66188/5WOCnQqpOWk673u+5cfVfnu29b30mnzBmBTu6kZRc3NT9lVyedMt0DndxJ1+2sk056eGRYLWHJ2l/dm6glkkfic+vWlpd8+T7zt5GyV1pfTo6vjMjVsDrpPdDjjm9iaJc6Ep306Z9OSyfd0PioZR+CZJRGgZ6amkp00o1PNFZWb9Cwk06ZRoFWnXTHvo41FWXdvR+aV5FGKkd/fLBP/04aAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAyLScnH8AoYbYBz4q4FQAAAAASUVORK5CYII=");
}

.duration-overlay-container {
  align-items: center;
  background-color: rgba(0, 0, 0, 0.4);
  border-bottom-left-radius: 2px;
  border-bottom-right-radius: 4px;
  border-top-left-radius: 2px;
  border-top-right-radius: 2px;
  bottom: 0px;
  color: rgb(255, 255, 255);
  cursor: pointer;
  display: flex;
  flex-direction: row;
  font-family: Roboto, Arial, sans-serif;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.5px;
  line-height: 12px;
  margin-bottom: 2px;
  margin-left: 4px;
  margin-right: 1px;
  margin-top: 4px;
  padding-bottom: 2px;
  padding-left: 4px;
  padding-right: 4px;
  padding-top: 2px;
  position: absolute;
  right: 0px;
  text-shadow: #000 0px 0px 2px, #000 0px 0px 2px, #000 0px 0px 2px, #000 0px 0px 2px, #000 0px 0px 2px, #000 0px 0px 2px;
}

.duration-overlay {
  background-attachment: scroll;
  background-clip: border-box;
  background-color: rgba(0, 0, 0, 0);
  background-image: none;
  background-origin: padding-box;
  background-position: 0% 0%;
  background-position-x: 0%;
  background-position-y: 0%;
  background-repeat: repeat;
  background-size: auto;
  border-bottom-color: rgb(255, 255, 255);
  border-bottom-style: none;
  border-bottom-width: 0px;
  border-image-outset: 0;
  border-image-repeat: stretch;
  border-image-slice: 100%;
  border-image-source: none;
  border-image-width: 1;
  border-left-color: rgb(255, 255, 255);
  border-left-style: none;
  border-left-width: 0px;
  border-right-color: rgb(255, 255, 255);
  border-right-style: none;
  border-right-width: 0px;
  border-top-color: rgb(255, 255, 255);
  border-top-style: none;
  border-top-width: 0px;
  color: rgb(255, 255, 255);
  cursor: pointer;
  font-family: Roboto, Arial, sans-serif;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.5px;
  line-height: 12px;
  margin-bottom: 0px;
  margin-left: 0px;
  margin-right: 0px;
  margin-top: 0px;
  padding-bottom: 0px;
  padding-left: 0px;
  padding-right: 0px;
  padding-top: 0px;
}
</style>
