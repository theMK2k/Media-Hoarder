<template>
  <v-card
    dark
    flat
    hover
    v-bind:ripple="false"
    v-on:click="allowMediaItemClick && emitMediaItemEvent('selectMediaItem', { mediaItem })"
    v-bind:style="{ cursor: allowMediaItemClick ? 'pointer' : 'default!important' }"
  >
    <v-list-item three-line style="padding-left: 0px; padding-right: 0px">
      <!-- Poster -->
      <div
        v-on:mouseover="emitMediaItemEvent('setItemHovered', { mediaItem, section: 'avatar', value: true })"
        v-on:mouseleave="emitMediaItemEvent('setItemHovered', { mediaItem, section: 'avatar', value: false })"
      >
        <v-list-item-avatar
          tile
          style="margin: 6px; height: 190px; width: 130px; cursor: pointer"
          v-on:click.stop="emitMediaItemEvent('launch', { mediaItem })"
        >
          <img
            v-show="mediaItem.specificMediaType !== 'Series' && mediaItem.avatarHovered"
            style="height: 190px; width: 130px; position: absolute; z-index: 1; opacity: 0.5; border-radius: 6px"
            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAACWCAYAAAAVKkwgAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAXYSURBVHhe7dx/TNR1HMfxu+OH44cBGpACZ1JkNWor15orfgSJm2nR+tPNidEfNv/gD1s2FAbh0uUfbTT7sdVyYf9Q8586ySUTJdO2pDVlCdHgvCuUwQHHyf3i7PP58j12FBHIhfd5fV+PjX2/fO87/3nu3vf5fv0eZpPJZBU/BMqibwkUA4NjYHAMDI6BwTEwOAYGx8DgGBgcA4NjYHAMDI6BwTEwOAYGx8DgGBgcA4NjYHAMDI6BwTEwOAYGx8DgGBgcA4NjYHAMDI6BwTEwOAYGx8DgGBgcA4NjYHAMDI6BwTEwOAYGx8DgGBgcA4NjYHAMDI6BwTEwuDjxkza9q4bz7edKs7OyPZ0XOm/ph2geSv296BuOwYNZmVnVoVDI1z/Qf+S5zWXH7dftQf1lmoOSI9pisazIX59f19vdY2v7uu0p/TDNQanAAX9gQm49Hk/H1NTUeGJi4oYtmyu+HLkx/N7+N/ZnaifRLEoFHh0bc8itCFsQFxd3j3bQZJrKSM94uanh7fa+X3971ZpnjdePk4Cwio4T7+YJGZxj+58gLpNE3FS5FYuvSY7t2SACh4nFV5K+y7GtgwocgWNbp1TgQMDvk1uzoB2YB8f2NKUCj7hcN/XdBY9co49t1BE9F0OObSMFNuTYNlTgsL+P7UONTR0Dvf2vI45tQwaOoI1tETzFarW+Kcb26bPfnX1Wfw2CUoGHh4fH5VYsohO0A1EQMbZvibH9QElR8YnRm67mhrqGNdoJilMqsP26XQssRH2Uindxsr4bTEtLe/HAW7VnEMa20Uf0XOKRxjYDzwFpbDPwPBDGNgMvjLJjW6nArV+1DsmtGKHhd9ayUXVsK/XQnXTbFxrQd+82+bBfvAjucTgc7xeVFX8ciw8AckTfOSXGNgMvgQpjm4GjILzaDt0OydX2Czk5Ocu+Rvg3DBxd4s0cCjqdzpj51oVygQOBgPbobCyRI1puLWZLotvt/lY7GCOUW0X7J3zfJyQk5Oq/3lVikeUWn8Mr5b7X6+2+cPGHhvIt5Re1F2MER/QdEO/YSbmRcUXkkZ7entoNhQ9vj7W4EgMvkojrE4sq+cBAaGho6Piu6qoSEbclVr8Ex8ALJN6pHrkVcVd4PJ7OTz77tCIrN7uu5YuW8H9hxiTlPoN9bm+7vObUf/3fyZsZ4etdscDr/6nrcuOmok1ntBcVoOIqWrsfvUyCMq6IPG63248UlRVXqBRX4oieg76IkuJdLlfrgfqDZesK7j926cdL2oP3KmHgCHIcy61cRE1OTnZ9c8pWueq+1fsOv3t4OadGVDGwoC+g5GVPajAYHLpy9UpNcnpK5bbKbV3TZ6jL8IHl/WMRNkWM5YDzD2fzS69Uljz25OMn9ZeVp1xgEWJM310S8e9MX/aYLfFj42O2Dz76sCJ3fd5RW5tNO45CucBihC7pujPiczbF7/df6zh/bkd6ZsaevTV7+7UTwBhmROsr45nLnr7f++oKHn1oa+nzpZ3TZ2AyRGARN3x7UX47omVXddUzDz5SYIi/sQUdWF8dz9xe/PxEy9Z712bWxvrtxWiCDBz+nJWrY3l78fLPXXtSV63csXP3zmvaCQaiXGCfz/dfNx20z1m5SnY4HUfl7cWNT2+06a8ZjnKBxbvTr+/Ooi+ipHjXqOtk0zuHyvPyrc0q3l6MJuVHdMRlT5LX6/1Fu72YvbqmvrH+T+0Eg1M2sAg7LDYztxevdnfvS0pL3o5wezGalA1sNpvl52xgcHDwWNVru8sKnyhs1V+iCMoGdk+4T8vbi2vWrT1ipMuexVLuiQ5aHOUXWTQ/BgbHwOAYGBwDg2NgcAwMjoHBMTA4BgbHwOAYGBwDg2NgcAwMjoHBMTA4BgbHwOAYGBwDg2NgcAwMjoHBMTA4BgbHwOAYGBwDg2NgcAwMjoHBMTA4BgbHwOAYGBwDg2NgcAwMjoHBMTA4BgbHwOAYGBwDg2NgcAwMjoHBMTA4BgbHwOAYGJrJ9BeV/2YuhRswVQAAAABJRU5ErkJggg=="
          />

          <div
            v-show="mediaItem.specificMediaType == 'Series' && mediaItem.avatarHovered"
            style="
              height: 190px;
              width: 130px;
              position: absolute;
              z-index: 1;
              opacity: 0.9;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
            "
          >
            <!-- <v-btn>open</v-btn> -->
            <div class="series-open-overlay-container">
              <span class="text-overlay">{{ $t("Open") }}</span>
            </div>
          </div>

          <v-img
            contain
            v-if="mediaItem.IMDB_posterSmall_URL || mediaItem.SeriesOwner_IMDB_posterSmall_URL"
            v-bind:src="mediaItem.IMDB_posterSmall_URL || mediaItem.SeriesOwner_IMDB_posterSmall_URL"
            style="border-radius: 6px; background-size: cover"
          ></v-img>
          <v-icon
            v-if="!(mediaItem.IMDB_posterSmall_URL || mediaItem.SeriesOwner_IMDB_posterSmall_URL)"
            disabled
            x-large
          >
            mdi-filmstrip
          </v-icon>

          <div class="duration-overlay-container" v-if="mediaItem.specificMediaType !== 'Series' && mediaItem.Duration">
            <span class="text-overlay">{{ mediaItem.Duration }}</span>
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
                v-on:mouseover="
                  allowEditButtons && emitMediaItemEvent('setItemHovered', { mediaItem, section: 'name', value: true })
                "
                v-on:mouseleave="
                  allowEditButtons && emitMediaItemEvent('setItemHovered', { mediaItem, section: 'name', value: false })
                "
              >
                <div style="display: flex; min-height: 30px">
                  <div v-if="mediaItem.last_access_at">
                    <v-tooltip bottom>
                      <template v-slot:activator="{ on }">
                        <span v-on="on">
                          <v-icon style="margin-right: 8px; margin-bottom: 3px">mdi-eye-check-outline</v-icon>
                        </span>
                      </template>
                      <span>{{ $t("Last Access") }}: {{ lastAccessHumanized(mediaItem) }}</span>
                    </v-tooltip>
                  </div>

                  <div style="overflow: hidden; text-overflow: ellipsis">
                    <span v-if="mediaItem.Series_Season_Displaytext" style="font-weight: 400; color: lightgray">
                      {{ mediaItem.Series_Season_Displaytext
                      }}{{
                        `${mediaItem.Series_Season_Displaytext ? "." : ""}${mediaItem.Series_Episodes_Displaytext}`
                      }}
                    </span>
                    <word-highlighter v-bind:query="searchText || ''">
                      {{ mediaItem.Name }}
                    </word-highlighter>
                    <span>
                      <span
                        v-bind:class="{
                          'mk-search-highlight': $shared.filterYearsActive,
                        }"
                      >
                        {{ mediaItem.yearDisplay }}
                      </span>
                      <span v-show="mediaItem.NumExtras">+{{ mediaItem.NumExtras }}</span>
                    </span>
                  </div>

                  <!-- all the edit buttons -->
                  <div v-if="allowEditButtons">
                    <v-tooltip bottom>
                      <template v-slot:activator="{ on }">
                        <span v-on="on">
                          <v-icon
                            v-show="mediaItem.nameHovered || mediaItem.selected"
                            class="mk-clickable"
                            v-on:click.stop="emitMediaItemEvent('openEditMediaItemDialog', { mediaItem })"
                            style="margin-left: 8px; margin-bottom: 3px"
                            >mdi-pencil</v-icon
                          >
                        </span>
                      </template>
                      <span style="margin-left:">{{ $t("Edit Movie") }}</span>
                    </v-tooltip>

                    <v-tooltip bottom>
                      <template v-slot:activator="{ on }">
                        <span v-on="on">
                          <v-icon
                            v-show="mediaItem.nameHovered || mediaItem.selected"
                            class="mk-clickable"
                            v-on:click.stop="emitMediaItemEvent('rescanItem', { mediaItem })"
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
                            v-show="mediaItem.nameHovered || mediaItem.selected"
                            class="mk-clickable"
                            v-on:click.stop="emitMediaItemEvent('openLinkIMDBDialog', { mediaItem })"
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
                            v-show="mediaItem.nameHovered || mediaItem.selected"
                            class="mk-clickable-red"
                            v-on:click.stop="emitMediaItemEvent('showDeleteMediaDialog', { mediaItem })"
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
                v-on:mouseover="
                  allowEditButtons && emitMediaItemEvent('setItemHovered', { mediaItem, section: 'name2', value: true })
                "
                v-on:mouseleave="
                  allowEditButtons &&
                  emitMediaItemEvent('setItemHovered', { mediaItem, section: 'name2', value: false })
                "
              >
                <!-- v-if="mediaItem.Name2 || mediaItem.selected" -->
                <word-highlighter v-bind:query="searchText || ''"> {{ mediaItem.Name2 }} </word-highlighter
                ><span
                  v-if="
                    mediaItem.specificMediaType == 'Series' &&
                    !mediaItem.Series_id_Movies_Owner &&
                    (mediaItem.Series_Num_Seasons || mediaItem.Series_Num_Episodes)
                  "
                >
                  <span v-if="mediaItem.Name2">·</span>
                  <span v-if="mediaItem.Series_Num_Seasons">
                    {{ mediaItem.Series_Num_Seasons }}
                    {{ $t(mediaItem.Series_Num_Seasons == 1 ? "season" : "seasons") }}</span
                  ><span v-if="mediaItem.Series_Num_Episodes"
                    >{{ mediaItem.Series_Num_Seasons ? ", " : "" }}
                    {{ mediaItem.Series_Num_Episodes }}
                    {{ $t(mediaItem.Series_Num_Episodes == 1 ? "episode" : "episodes") }}</span
                  >
                  <span v-if="mediaItem.Series_Num_Bonus"
                    >{{ mediaItem.Series_Num_Seasons || mediaItem.Series_Num_Episodes ? ", " : "" }}
                    {{ mediaItem.Series_Num_Bonus }}
                    {{ $t(mediaItem.Series_Num_Bonus == 1 ? "bonus episode" : "bonus episodes") }}
                  </span>
                </span>
              </v-list-item-subtitle>

              <div style="font-size: 0.875rem; font-weight: normal">
                <span v-if="mediaItem.MI_Qualities">
                  <span
                    v-for="(MI_Qualities_Item, index) in mediaItem.MI_Qualities"
                    v-bind:key="MI_Qualities_Item.MI_Quality"
                  >
                    <span>{{ index > 0 ? ", " : "" }}</span>
                    <span
                      class="mk-clickable"
                      v-bind:class="{
                        'mk-search-highlight': $shared.filterQualitiesAppliedContains(MI_Qualities_Item.MI_Quality),
                      }"
                      v-on:click.stop="
                        emitMediaItemEvent('videoQualityClicked', {
                          mediaItem,
                          MI_Qualities_Item,
                          isInDialog,
                        })
                      "
                      >{{ MI_Qualities_Item.MI_Quality }}</span
                    >
                  </span>
                </span>
                <span v-if="mediaItem.AgeRating">
                  <span v-if="mediaItem.MI_Qualities"> | </span>
                  <span
                    class="mk-clickable"
                    v-bind:class="{
                      'mk-search-highlight': $shared.filterAgeRatingsActive,
                    }"
                    v-on:click.stop="
                      emitMediaItemEvent('ageRatingClicked', { mediaItem, AgeRating: mediaItem.AgeRating, isInDialog })
                    "
                    >{{ mediaItem.AgeRating }}</span
                  >
                </span>
                <span v-if="mediaItem.Genres">
                  |
                  <span v-for="(genre, index) in mediaItem.Genres" v-bind:key="genre.name">
                    <span>{{ index > 0 ? ", " : "" }}</span>
                    <span
                      class="mk-clickable"
                      v-bind:class="{
                        'mk-search-highlight': $shared.filterGenresAppliedContains(genre.translated),
                      }"
                      v-on:click.stop="emitMediaItemEvent('genreClicked', { mediaItem, genre, isInDialog })"
                      >{{ genre.translated }}</span
                    >
                  </span>
                </span>

                <span v-if="mediaItem.AudioLanguages">
                  |
                  <v-icon small>mdi-comment-outline</v-icon>
                  <span v-for="(lang, index) in mediaItem.AudioLanguages" v-bind:key="lang">
                    <span>{{ index > 0 ? ", " : " " }}</span>
                    <span
                      class="mk-clickable"
                      v-bind:class="{
                        'mk-search-highlight': $shared.filterAudioLanguagesAppliedContains(
                          lang,
                          mediaItem.AudioLanguages,
                          mediaItem.Audio_Languages
                        ),
                      }"
                      v-on:click.stop="onLanguageClicked(mediaItem, lang, 'audio', isInDialog)"
                      >{{ lang }}</span
                    >
                  </span>
                </span>

                <span v-if="mediaItem.SubtitleLanguages">
                  |
                  <v-icon small style="margin-top: -3px">mdi-subtitles-outline</v-icon>
                  <span v-for="(lang, index) in mediaItem.SubtitleLanguages" v-bind:key="lang">
                    <span>{{ index > 0 ? ", " : " " }}</span>
                    <span
                      class="mk-clickable"
                      v-bind:class="{
                        'mk-search-highlight': $shared.filterSubtitleLanguagesAppliedContains(
                          lang,
                          mediaItem.AudioLanguages,
                          mediaItem.Audio_Languages
                        ),
                      }"
                      v-on:click.stop="onLanguageClicked(mediaItem, lang, 'subtitle', isInDialog)"
                      >{{ lang }}</span
                    >
                  </span>
                </span>

                <span v-if="mediaItem.Video_Encoder_Display">
                  |
                  <span v-for="(videoEncoder, index) in mediaItem.Video_Encoder_Display" v-bind:key="index">
                    <span>{{ index > 0 ? ", " : " " }}</span>
                    <span
                      class="mk-clickable"
                      v-bind:class="{
                        'mk-search-highlight': $shared.filterVideoEncodersAppliedContains(videoEncoder),
                      }"
                      v-on:click.stop="
                        emitMediaItemEvent('videoEncoderClicked', { mediaItem, videoEncoder, isInDialog })
                      "
                      >{{ videoEncoder }}</span
                    >
                  </span>
                </span>

                <span v-if="mediaItem.Audio_Format_Display">
                  |
                  <span v-for="(audioFormat, index) in mediaItem.Audio_Format_Display" v-bind:key="index">
                    <span>{{ index > 0 ? ", " : " " }}</span>
                    <span
                      class="mk-clickable"
                      v-bind:class="{
                        'mk-search-highlight': $shared.filterAudioFormatsAppliedContains(audioFormat),
                      }"
                      v-on:click.stop="emitMediaItemEvent('audioFormatClicked', { mediaItem, audioFormat, isInDialog })"
                      >{{ audioFormat }}</span
                    >
                  </span>
                </span>

                <span v-if="mediaItem.ReleaseAttributes">
                  |
                  <span v-for="(releaseAttribute, index) in mediaItem.ReleaseAttributes" v-bind:key="releaseAttribute">
                    <span>{{ index > 0 ? ", " : " " }}</span>
                    <span
                      class="mk-clickable"
                      v-bind:class="{
                        'mk-search-highlight': $shared.filterReleaseAttributesAppliedContains(releaseAttribute),
                      }"
                      v-on:click.stop="
                        emitMediaItemEvent('releaseAttributeClicked', { mediaItem, releaseAttribute, isInDialog })
                      "
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
                v-if="mediaItem.IMDB_rating_defaultDisplay"
              >
                <v-icon small color="amber" style="padding-bottom: 4px">mdi-star</v-icon>
                <!--
                          #rip-rating-demographics
                          <a class="headline mb-2 mk-clickable" v-on:click.stop="emitMediaItemEvent('showRatingDemographicsDialog', { mediaItem })">{{ mediaItem.IMDB_rating_defaultDisplay }}</a>
                        -->
                <span v-if="mediaItem.specificMediaType !== 'Series'" class="headline mb-2">{{
                  mediaItem.IMDB_rating_defaultDisplay
                }}</span>
                <a
                  v-if="mediaItem.specificMediaType == 'Series'"
                  class="headline mb-2 mk-clickable"
                  v-on:click.stop="emitMediaItemEvent('showSeriesIMDBRatingHeatmapDialog', { mediaItem })"
                  >{{ mediaItem.IMDB_rating_defaultDisplay }}</a
                >

                <span
                  v-if="mediaItem.IMDB_metacriticScore"
                  v-bind:class="helpers.getMetaCriticClass(mediaItem.IMDB_metacriticScore)"
                  style="padding: 4px; margin-left: 4px"
                  >{{ mediaItem.IMDB_metacriticScore }}</span
                >
              </div>
              <v-row style="margin: 0px -12px 0px 0px">
                <div class="flex-grow-1"></div>

                <div v-on:click.stop="">
                  <star-rating
                    v-bind:increment="0.5"
                    v-bind:max-rating="5"
                    v-bind:star-size="16"
                    v-model="mediaItem.Rating"
                    v-bind:clearable="true"
                    v-bind:show-rating="false"
                    inactive-color="grey"
                    active-color="#ffc107"
                    style="margin-right: 26px; padding: 0px !important"
                    v-bind:star-points="[7, 3, 6, 6, 2, 6, 5, 8, 4, 12, 7, 10, 10, 12, 9, 8, 12, 6, 8, 6]"
                    v-bind:glow="1"
                    v-on:rating-selected="emitMediaItemEvent('changeRating', { mediaItem })"
                  ></star-rating>
                </div>
              </v-row>
            </div>
          </v-row>

          <v-row v-if="mediaItem.plotSummary" style="margin: 4px 6px 8px 4px">
            <div v-show="!mediaItem.selected" style="font-size: 0.875rem; font-weight: normal">
              <word-highlighter v-bind:query="searchText || ''">
                {{ mediaItem.plotSummary }}
              </word-highlighter>
            </div>
            <div v-show="mediaItem.selected" style="font-size: 0.875rem; font-weight: normal">
              {{ mediaItem.plotSummaryFull || mediaItem.plotSummary }}
            </div>
          </v-row>

          <v-row v-if="mediaItem.IMDB_Top_Directors" class="mk-main-detail-row">
            <div style="font-size: 0.875rem; font-weight: normal">
              <div style="float: left; width: 100px; overflow: hidden">
                <strong class="CreditCategory">{{ $t("Directed by") }}:</strong>
              </div>
              <div style="overflow: hidden">
                <span v-for="(credit, i) in mediaItem.IMDB_Top_Directors" v-bind:key="credit.id_Movies_IMDB_Credits">
                  <span v-if="i > 0">,&nbsp;</span>
                  <a
                    class="mk-clickable"
                    v-bind:class="{
                      'mk-search-highlight': $shared.filterPersonsAppliedContains(credit),
                    }"
                    v-on:click.stop="emitMediaItemEvent('creditClicked', { mediaItem, credit, isInDialog })"
                    >{{ credit.name }}</a
                  >
                </span>
              </div>
            </div>
          </v-row>

          <v-row v-if="mediaItem.IMDB_Top_Writers" class="mk-main-detail-row">
            <div style="font-size: 0.875rem; font-weight: normal">
              <div style="float: left; width: 100px; overflow: hidden">
                <strong class="CreditCategory">{{ $t("Written by") }}:</strong>
              </div>
              <div style="overflow: hidden">
                <span v-for="(credit, i) in mediaItem.IMDB_Top_Writers" v-bind:key="credit.id_Movies_IMDB_Credits">
                  <span v-if="i > 0">,&nbsp;</span>
                  <a
                    class="mk-clickable"
                    v-bind:class="{
                      'mk-search-highlight': $shared.filterPersonsAppliedContains(credit),
                    }"
                    v-on:click.stop="emitMediaItemEvent('creditClicked', { mediaItem, credit, isInDialog })"
                    >{{ credit.name }}</a
                  >
                </span>
              </div>
            </div>
          </v-row>

          <v-row v-if="mediaItem.IMDB_Top_Cast" class="mk-main-detail-row">
            <div style="font-size: 0.875rem; font-weight: normal">
              <div style="float: left; width: 100px; overflow: hidden">
                <strong class="CreditCategory">{{ $t("Cast") }}:</strong>
              </div>
              <div style="overflow: hidden">
                <span v-for="(credit, i) in mediaItem.IMDB_Top_Cast" v-bind:key="credit.id_Movies_IMDB_Credits">
                  <span v-if="i > 0">,&nbsp;</span>
                  <a
                    class="mk-clickable"
                    v-bind:class="{
                      'mk-search-highlight': $shared.filterPersonsAppliedContains(credit),
                    }"
                    v-on:click.stop="emitMediaItemEvent('creditClicked', { mediaItem, credit, isInDialog })"
                    >{{ credit.name }}</a
                  >
                </span>
              </div>
            </div>
          </v-row>

          <v-row v-if="mediaItem.IMDB_Top_Production_Companies" class="mk-main-detail-row">
            <div style="font-size: 0.875rem; font-weight: normal">
              <div style="float: left; width: 100px; overflow: hidden">
                <strong class="CreditCategory">{{ $t("Production") }}:</strong>
              </div>
              <div style="overflow: hidden">
                <span v-for="(company, i) in mediaItem.IMDB_Top_Production_Companies" v-bind:key="i">
                  <span v-if="i > 0">,&nbsp;</span>
                  <a
                    class="mk-clickable"
                    v-bind:class="{
                      'mk-search-highlight': $shared.filterCompaniesAppliedContains(company),
                    }"
                    v-on:click.stop="emitMediaItemEvent('companyClicked', { mediaItem, company, isInDialog })"
                    >{{ company.name }}</a
                  >
                </span>
              </div>
            </div>
          </v-row>
        </v-col>
      </v-list-item-content>
    </v-list-item>

    <v-row v-if="mediaItem.scanErrors && Object.keys(mediaItem.scanErrors).length" style="margin: 8px">
      <v-alert type="warning" dense colored-border border="left">
        <span class="mk-clickable" v-on:click.stop="mediaItem.showScanErrors = !mediaItem.showScanErrors"
          >{{ $t("Errors were encountered during the scan, consider a re-scan_") }}
        </span>
        <v-btn small text color="primary" v-on:click.stop="emitMediaItemEvent('clearScanErrors', { mediaItem })">{{
          $t("Clear this message")
        }}</v-btn>
        <v-row v-if="mediaItem.showScanErrors" style="margin: 0px">
          <ul style="font-size: 0.875rem; margin-left: 4px; margin-top: 8px">
            <li
              v-for="(val, key) in mediaItem.scanErrors"
              v-bind:key="key"
              v-on:click.stop="mediaItem.showScanErrors = !mediaItem.showScanErrors"
            >
              {{ $t(key) }}:
              {{ val.message ? $t(val.message, val.data) : val }}
            </li>
          </ul>
        </v-row>
      </v-alert>
    </v-row>

    <v-col v-if="mediaItem.selected" style="min-width: 100%">
      <v-row class="mk-detail-row">
        <v-col class="detailLabel"
          ><strong>{{ $t("Full Path") }}:</strong></v-col
        >
        <v-col class="detailContent">
          <word-highlighter
            v-bind:query="searchText || ''"
            v-bind:class="{
              'mk-search-highlight': $shared.filterSourcePathsActive,
            }"
            >{{ mediaItem.SourcePath }}{{ pathSeparator }}</word-highlighter
          ><word-highlighter v-bind:query="searchText || ''">{{ mediaItem.RelativePath }}</word-highlighter></v-col
        >
      </v-row>
      <v-row class="mk-detail-row">
        <v-col class="detailLabel"
          ><strong
            >{{ mediaItem.specificMediaType == "Series" ? $t("Imported / Updated") : $t("Imported") }}:</strong
          ></v-col
        >
        <v-col class="detailContent">
          <v-tooltip right>
            <template v-slot:activator="{ on }">
              <span v-on="on">{{ createdHumanized(mediaItem) }}</span>
            </template>
            <span>{{ createdDisplayText(mediaItem) }}</span>
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
              <span v-on="on">{{ lastAccessHumanized(mediaItem) }}</span>
            </template>
            <span>{{ lastAccessDisplayText(mediaItem) }}</span>
          </v-tooltip>
        </v-col>
      </v-row>
      <v-row class="mk-detail-row">
        <v-col class="detailLabel"
          ><strong>{{ $t("Size") }}:</strong></v-col
        >
        <v-col v-if="mediaItem.Size" class="detailContent">{{ Humanize().fileSize(mediaItem.Size) }}</v-col>
      </v-row>
      <v-row class="mk-detail-row">
        <v-col class="detailLabel"
          ><strong>{{ $t("File Created at") }}:</strong></v-col
        >
        <v-col v-if="mediaItem.file_created_at" class="detailContent">{{
          moment().utc(parseInt(mediaItem.file_created_at)).local().format("YYYY-MM-DD HH:mm:ss")
        }}</v-col>
      </v-row>
      <v-row class="mk-detail-row">
        <v-col class="detailLabel"
          ><strong>{{ $t("IMDB ID") }}:</strong></v-col
        >
        <v-col class="detailContent">
          <word-highlighter v-bind:query="searchText || ''">
            {{ mediaItem.IMDB_tconst || notAvailableText }}
          </word-highlighter>
          <v-btn
            v-if="mediaItem.IMDB_tconst"
            class="mk-btn-small"
            text
            small
            color="primary"
            v-on:click.stop="emitMediaItemEvent('copyImdbTconst', { mediaItem })"
            style="margin-top: -1px"
            ><v-icon small>mdi-content-copy</v-icon></v-btn
          >
        </v-col>
      </v-row>
      <v-row class="mk-detail-row">
        <v-col class="detailLabel"
          ><strong>{{ $t("In Lists") }}:</strong></v-col
        >
        <v-col class="detailContent">
          <span v-if="mediaItem.lists && mediaItem.lists.length > 0">
            <span v-for="(list, index) in mediaItem.lists" v-bind:key="index">
              <span v-if="index > 0">,&nbsp;</span>
              <span
                v-bind:class="{
                  'mk-search-highlight': $shared.filterListsAppliedContains(list.Name),
                }"
                >{{ list.Name }}</span
              >
            </span>
          </span>
          <span v-if="!mediaItem.lists || mediaItem.lists.length === 0">&lt;{{ $t("not in any list") }}&gt;</span>
          <v-btn
            class="mk-btn-small"
            text
            small
            color="primary"
            v-on:click.stop="emitMediaItemEvent('addToList', { mediaItem })"
            style="margin-top: -1px"
            >{{ $t("Add") }}</v-btn
          >
          <v-btn
            v-if="mediaItem.lists && mediaItem.lists.length > 0"
            class="mk-btn-small"
            text
            small
            color="primary"
            v-on:click.stop="emitMediaItemEvent('removeFromList', { mediaItem })"
            style="margin-top: -1px"
            >{{ $t("Remove") }}</v-btn
          >
        </v-col>
      </v-row>

      <!-- Extras -->
      <div v-if="mediaItem.NumExtras">
        <v-row style="padding-left: 16px; padding-top: 8px; align-items: flex-end">
          <span style="font-size: 20px">{{ $t("Extras") }}&nbsp;</span>
        </v-row>

        <v-row
          v-for="extra in mediaItem.extras"
          v-bind:key="extra.fullPath"
          class="mk-clickable"
          style="padding-left: 24px; padding-top: 4px; align-items: flex-end"
          v-on:click.stop="emitMediaItemEvent('launch', { mediaItem: extra })"
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
          v-on:click.stop="emitMediaItemEvent('showCredits', { mediaItem, value: !mediaItem.showCredits })"
        >
          <span class="mk-item-detailcategory-header"
            >{{ $t("Credits") + (!mediaItem.showCredits ? " »" : "") }}&nbsp;</span
          >
        </v-row>

        <div
          class="mk-item-detailcategory-content"
          v-if="mediaItem.showCredits"
          v-on:click.stop="emitMediaItemEvent('showCredits', { mediaItem, value: false })"
        >
          <v-row v-if="!mediaItem.credits || mediaItem.credits.length === 0" style="margin-top: 8px; margin-left: 16px">
            {{ $t("none provided") }}
          </v-row>

          <div
            v-for="creditCategory in mediaItem.credits"
            v-bind:key="creditCategory.Category"
            style="margin-left: 24px"
          >
            <v-row style="margin-top: 12px">
              <strong>{{ $t(`CreditCategories.${creditCategory.category}`) }}</strong>
            </v-row>
            <v-row
              v-for="credit in creditCategory.items"
              v-bind:key="credit.id_Movies_IMDB_Credits"
              class="mk-highlightable-row"
            >
              <v-col sm="4" class="creditsLabel">
                <a
                  class="mk-clickable"
                  v-bind:class="{
                    'mk-search-highlight': $shared.filterPersonsAppliedContains(credit),
                  }"
                  v-on:click.stop="emitMediaItemEvent('creditClicked', { mediaItem, credit, isInDialog })"
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
          v-on:click.stop="emitMediaItemEvent('showCompanies', { mediaItem, value: !mediaItem.showCompanies })"
        >
          <span class="mk-item-detailcategory-header"
            >{{ $t("Companies") + (!mediaItem.showCompanies ? " »" : "") }}&nbsp;</span
          >
        </v-row>

        <div
          class="mk-item-detailcategory-content"
          v-if="mediaItem.showCompanies"
          v-on:click.stop="emitMediaItemEvent('showCompanies', { mediaItem, value: false })"
        >
          <v-row
            v-if="!mediaItem.companies || mediaItem.companies.length === 0"
            style="margin-top: 8px; margin-left: 16px"
          >
            {{ $t("none provided") }}
          </v-row>

          <div
            v-for="companyCategory in mediaItem.companies"
            v-bind:key="companyCategory.Category"
            style="margin-left: 24px"
          >
            <v-row style="margin-top: 12px">
              <strong>{{ $t(`CompanyCategories.${companyCategory.category}`) }}</strong>
            </v-row>
            <v-row
              v-for="company in companyCategory.items"
              v-bind:key="company.id_Movies_IMDB_Credits"
              class="mk-highlightable-row"
            >
              <v-col sm="4" class="creditsLabel">
                <a
                  class="mk-clickable"
                  v-bind:class="{
                    'mk-search-highlight': $shared.filterCompaniesAppliedContains(company),
                  }"
                  v-on:click.stop="emitMediaItemEvent('companyClicked', { mediaItem, company, isInDialog })"
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
          v-on:click.stop="
            emitMediaItemEvent('showContentAdvisory', { mediaItem, value: !mediaItem.showContentAdvisory })
          "
        >
          <span class="mk-item-detailcategory-header"
            >{{ $t("Content Advisory") + (!mediaItem.showContentAdvisory ? " »" : "") }}&nbsp;</span
          >
        </v-row>

        <div
          class="mk-item-detailcategory-content"
          v-if="mediaItem.showContentAdvisory"
          v-on:click.stop="emitMediaItemEvent('showContentAdvisory', { mediaItem, value: false })"
          style="margin-left: 8px"
        >
          <v-row
            v-for="category in $shared.contentAdvisoryCategories"
            v-bind:key="category.Name"
            class="mk-highlightable-row"
            style="margin-top: 12px; margin-left: 6px"
          >
            <v-col sm="4" class="creditsContent" style="padding-left: 12px">{{
              $t(`ParentalAdvisoryCategories.${category.Name}`)
            }}</v-col>
            <v-col sm="1" class="creditsContent">
              <!-- <span v-if="company.role">...</span> -->
            </v-col>
            <v-col
              class="creditsContent"
              v-bind:class="{
                'mk-search-highlight': $shared.filterParentalAdvisoryAppliedContains(
                  category.Name,
                  mediaItem[`IMDB_Parental_Advisory_${category.Name}`]
                ),
              }"
              >{{ contentAdvisorySeverityDisplayText(mediaItem[`IMDB_Parental_Advisory_${category.Name}`]) }}</v-col
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
          v-on:click.stop="emitMediaItemEvent('showPlotKeywords', { mediaItem, value: !mediaItem.showPlotKeywords })"
        >
          <span class="mk-item-detailcategory-header"
            >{{ $t("Plot Keywords (Spoilers ahead!)") + (!mediaItem.showPlotKeywords ? " »" : "") }}&nbsp;</span
          >
        </v-row>

        <div
          class="mk-item-detailcategory-content"
          v-if="mediaItem.showPlotKeywords"
          v-on:click.stop="emitMediaItemEvent('showPlotKeywords', { mediaItem, value: false })"
        >
          <v-row
            v-if="!mediaItem.plotKeywords || mediaItem.plotKeywords.length === 0"
            style="margin-top: 8px; margin-left: 16px"
          >
            {{ $t("none provided") }}
          </v-row>

          <v-row
            v-for="plotKeyword in mediaItem.plotKeywords"
            v-bind:key="plotKeyword.Keyword"
            style="margin-top: 12px; margin-left: 24px"
          >
            <a
              class="mk-clickable"
              v-bind:class="{
                'mk-search-highlight': $shared.filterIMDBPlotKeywordsAppliedContains(plotKeyword.Keyword),
              }"
              v-on:click.stop="emitMediaItemEvent('plotKeywordClicked', { mediaItem, plotKeyword, isInDialog })"
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
          v-on:click.stop="
            emitMediaItemEvent('showFilmingLocations', { mediaItem, value: !mediaItem.showFilmingLocations })
          "
        >
          <span class="mk-item-detailcategory-header"
            >{{ $t("Filming Locations") + (!mediaItem.showFilmingLocations ? " »" : "") }}&nbsp;</span
          >
        </v-row>

        <div
          class="mk-item-detailcategory-content"
          v-if="mediaItem.showFilmingLocations"
          v-on:click.stop="emitMediaItemEvent('showFilmingLocations', { mediaItem, value: false })"
        >
          <v-row
            v-if="!mediaItem.filmingLocations || mediaItem.filmingLocations.length === 0"
            style="margin-top: 8px; margin-left: 16px"
          >
            {{ $t("none provided") }}
          </v-row>

          <v-row
            v-for="filmingLocation in mediaItem.filmingLocations"
            v-bind:key="filmingLocation.id_IMDB_Filming_Locations"
            style="margin-top: 12px; margin-left: 24px"
          >
            <a
              class="mk-clickable"
              v-bind:class="{
                'mk-search-highlight': $shared.filterIMDBFilmingLocationsAppliedContains(filmingLocation.Location),
              }"
              v-on:click.stop="emitMediaItemEvent('filmingLocationClicked', { mediaItem, filmingLocation, isInDialog })"
              >{{ filmingLocation.Location }}</a
            >
          </v-row>
        </div>
      </div>

      <v-row style="margin-top: 16px"> </v-row>
    </v-col>

    <v-card-actions v-if="isInDialog || mediaItem.selected">
      <v-btn
        v-if="showCloseButton"
        class="xs-fullwidth"
        color="secondary"
        v-on:click.native.stop="$emit('close')"
        style="margin-left: 8px"
        >{{ $t("Close") }}</v-btn
      >
      <v-btn text color="primary" v-on:click.stop="emitMediaItemEvent('copyInfo', { mediaItem })">{{
        $t("Copy Info")
      }}</v-btn>
      <v-btn
        v-if="mediaItem.IMDB_Trailer_URL"
        text
        color="primary"
        v-on:click.stop="emitMediaItemEvent('showTrailer', { mediaItem })"
        >{{ $t("Trailer") }}</v-btn
      >
      <v-btn
        text
        v-bind:disabled="!mediaItem.IMDB_tconst"
        color="primary"
        v-on:click.stop="emitMediaItemEvent('openIMDB', { mediaItem })"
      >
        <v-icon small>mdi-web</v-icon>&nbsp;IMDB
      </v-btn>
      <v-btn
        text
        v-if="mediaItem.specificMediaType == 'Series' || mediaItem.specificMediaType == 'Episodes'"
        v-bind:disabled="
          (mediaItem.specificMediaType == 'Series' && !mediaItem.IMDB_tconst) ||
          (mediaItem.specificMediaType == 'Episodes' && !mediaItem.SeriesOwner_IMDB_tconst)
        "
        color="primary"
        v-on:click.stop="emitMediaItemEvent('openWhatToWatchOnTV', { mediaItem })"
      >
        <v-icon small>mdi-web</v-icon>&nbsp;w2wTV
      </v-btn>
      <v-btn
        text
        v-if="mediaItem.specificMediaType == 'Movies'"
        v-bind:disabled="!mediaItem.IMDB_tconst"
        color="primary"
        v-on:click.stop="emitMediaItemEvent('openLetterboxd', { mediaItem })"
      >
        <v-icon small>mdi-web</v-icon>&nbsp;Letterboxd
      </v-btn>
      <v-btn
        text
        v-bind:disabled="!mediaItem.IMDB_tconst"
        color="primary"
        v-on:click.stop="emitMediaItemEvent('openMovieChat', { mediaItem })"
      >
        <v-icon small>mdi-web</v-icon>&nbsp;MovieChat
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
<script>
import path from "path";
import moment from "moment";

import logger from "@helpers/logger.js";

import WordHighlighter from "vue-word-highlighter";
import StarRating from "vue-star-rating";
import * as Humanize from "humanize-plus";

import * as helpers from "@helpers/helpers.js";
import * as store from "@/store.js";

export default {
  props: ["mediaItem", "isScanning", "showCloseButton", "allowMediaItemClick", "allowEditButtons", "isInDialog"],
  components: { "word-highlighter": WordHighlighter, "star-rating": StarRating },
  data() {
    return {};
  },
  computed: {
    helpers() {
      return helpers;
    },

    pathSeparator() {
      return path.sep;
    },

    searchText() {
      if (this.mediaItem && this.mediaItem.specificMediaType == "Episodes") {
        // we don't filter and don't highlight searchText if we're listing Episodes
        return null;
      }
      return this.$shared.searchText;
    },

    notAvailableText() {
      // we can't use "<" or ">" in template without irritating the formatter/linter
      return this.$t("<not available>");
    },
  },
  methods: {
    moment() {
      return moment;
    },

    Humanize() {
      return Humanize;
    },

    emitMediaItemEvent(eventName, payload) {
      // a generic event called mediaItemEvent that just provides the eventName and mediaItem as payload
      this.$emit("mediaItemEvent", Object.assign(payload, { eventName }));
    },

    createdDisplayText(mediaItem) {
      if (mediaItem.specificMediaType == "Series") {
        if (!mediaItem.updated_at) {
          return "";
        }

        if (!mediaItem.updatedMoment) {
          mediaItem.updatedMoment = moment(mediaItem.updated_at);
        }

        return moment.utc(mediaItem.updatedMoment).local().format("YYYY-MM-DD HH:mm:ss");
      } else {
        if (!mediaItem.created_at) {
          return "";
        }

        if (!mediaItem.createdMoment) {
          mediaItem.createdMoment = moment(mediaItem.created_at);
        }

        return moment.utc(mediaItem.createdMoment).local().format("YYYY-MM-DD HH:mm:ss");
      }
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

    lastAccessHumanized(movie) {
      if (!movie.last_access_at) {
        return "none";
      }

      if (!movie.lastAccessMoment) {
        movie.lastAccessMoment = moment(movie.last_access_at);
      }

      return movie.lastAccessMoment.fromNow();
    },

    createdHumanized(mediaItem) {
      if (mediaItem.specificMediaType == "Series") {
        if (!mediaItem.updated_at) {
          return "none";
        }

        if (!mediaItem.updatedMoment) {
          mediaItem.updatedMoment = moment(mediaItem.updated_at);
        }

        return mediaItem.updatedMoment.fromNow();
      } else {
        if (!mediaItem.created_at) {
          return "none";
        }

        if (!mediaItem.createdMoment) {
          mediaItem.createdMoment = moment(mediaItem.created_at);
        }

        return mediaItem.createdMoment.fromNow();
      }
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

    async onLanguageClicked(mediaItem, lang, type, isInDialog) {
      logger.log("[onLanguageClicked]:", lang, type);

      if (/\+\d/.test(lang)) {
        // clicked language is expandable, e.g. "+4"
        await this.expandLanguages(mediaItem, type);
        return;
      }

      this.emitMediaItemEvent("languageClicked", { mediaItem, code: lang, type, isInDialog });
    },

    async expandLanguages(item, type) {
      logger.log("[expandLanguages] item:", item, "type:", type);
      if (type === "audio") {
        item.AudioLanguages = store.generateLanguageArray(item.Audio_Languages, 9999);
      } else {
        item.SubtitleLanguages = store.generateLanguageArray(item.Subtitle_Languages, 9999);
      }
    },
  },
};
</script>

<style scoped>
.CreditCategory {
  display: block;
  float: left;
  width: 100px;
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

.series-open-overlay-container {
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
  right: 0px;
  text-shadow:
    #000 0px 0px 2px,
    #000 0px 0px 2px,
    #000 0px 0px 2px,
    #000 0px 0px 2px,
    #000 0px 0px 2px,
    #000 0px 0px 2px;
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
  text-shadow:
    #000 0px 0px 2px,
    #000 0px 0px 2px,
    #000 0px 0px 2px,
    #000 0px 0px 2px,
    #000 0px 0px 2px,
    #000 0px 0px 2px;
}

.text-overlay {
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
