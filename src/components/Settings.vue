<template>
  <div style="width: 100%; margin-left: 8px">
    <h1>
      <v-btn text v-on:click="$router.go(-1)">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      {{ $t("Settings") }}
    </h1>

    <v-tabs color="white">
      <v-tab>{{ $t("General") }}</v-tab>
      <v-tab>{{ $t("Movies") }}</v-tab>
      <!-- <v-tab>{{$t("Series")}}</v-tab> -->
      <v-tab>{{ $t("Duplicates") }}</v-tab>
      <v-tab>{{ $t("Regions") }}</v-tab>
      <v-tab>{{ $t("Languages") }}</v-tab>
      <v-tab>{{ $t("Title Types") }}</v-tab>
      <v-tab>{{ $t("Release Attributes") }}</v-tab>

      <!-- GENERAL -->
      <v-tab-item style="padding: 8px">
        <v-row class="settings-row">
          <h3>{{ $t("Media Player Path") }}</h3>

          <v-card-text class="mk-light-grey">
            {{
              $t(
                "{appName} needs the path to a media player of your choice for media playback_ We recommend the VLC media player, you can get it at_",
                { appName: $shared.appName }
              )
            }}
            <a v-on:click="openURL('https://www.videolan.org/vlc/index.html')"
              >https://www.videolan.org/vlc/index.html</a
            >
          </v-card-text>

          <v-text-field
            readonly
            v-bind:label="$t('Media Player Path')"
            v-model="MediaplayerPath"
            style="margin-left: 16px"
          ></v-text-field>

          <v-btn
            v-on:click="browseMediaplayerPath()"
            text
            small
            color="primary"
            style="margin-top: 16px"
            >{{ $t("Browse") }}</v-btn
          >
          <v-btn
            v-on:click="showEditMediaplayerPathDialog()"
            text
            small
            color="primary"
            style="margin-top: 16px"
            >{{ $t("Edit") }}</v-btn
          >
        </v-row>

        <v-row class="settings-row">
          <h3>{{ $t("Mediainfo CLI Path") }}</h3>

          <v-card-text class="mk-light-grey">
            {{
              $t(
                "{appName} needs the path to Mediainfo CLI in order to determine duration, video resolution and languages of your media_ You can get Mediainfo CLI at_",
                { appName: $shared.appName }
              )
            }}
            <a v-on:click="openURL('https://mediaarea.net/en/MediaInfo')"
              >https://mediaarea.net/en/MediaInfo</a
            >
          </v-card-text>

          <v-text-field
            readonly
            v-bind:label="$t('Mediainfo CLI Path')"
            v-model="MediainfoPath"
            style="margin-left: 16px"
          ></v-text-field>

          <v-btn
            v-on:click="browseMediainfoPath()"
            text
            small
            color="primary"
            style="margin-top: 16px"
            >{{ $t("Browse") }}</v-btn
          >
          <v-btn
            v-on:click="showEditMediainfoPathDialog()"
            text
            small
            color="primary"
            style="margin-top: 16px"
            >{{ $t("Edit") }}</v-btn
          >
        </v-row>

        <v-row class="settings-row">
          <h3>{{ $t("Last Access Grace Period") }}</h3>

          <v-card-text class="mk-light-grey">{{
            $t(
              "{appName} provides the date and time of the last access for any medium_ In order to prevent unwanted updates, you can define a grace period in seconds where a medium can be played until the update is performed_",
              { appName: $shared.appName }
            )
          }}</v-card-text>

          <v-text-field
            type="number"
            v-bind:label="$t('Last Access Grace Period')"
            v-model="minimumWaitForSetAccess"
            style="margin-left: 16px"
          ></v-text-field>
        </v-row>

        <v-row class="settings-row">
          <h3>{{ $t("IMDB Rating Demographic") }}</h3>

          <v-card-text class="mk-light-grey">{{
            $t(
              "{appName} provides the IMDB score and number of votes for each medium _where applicable__ By default these are the numbers of all IMDB users_ You can, however, decide if you wish to see those of a certain demographic, e_g_ by gender or age_",
              { appName: $shared.appName }
            )
          }}</v-card-text>

          <v-select
            class="mk-v-select-dynamic-width"
            v-bind:label="$t('IMDB Rating Demographic')"
            item-text="long_translated"
            item-value="code"
            v-model="$shared.imdbRatingDemographic"
            v-bind:items="$shared.imdbRatingDemographics"
            style="margin-left: 16px"
          ></v-select>
        </v-row>

        <v-row class="settings-row">
          <h3>{{ $t("Log Level") }}</h3>

          <v-card-text class="mk-light-grey">{{
            $t(
              "{appName} logs certain events during runtime_ You can view these logs by pressing the _Open DevTools_ button below_ With the log level you decide which event severity should be logged_",
              { appName: $shared.appName }
            )
          }}</v-card-text>

          <v-select
            class="mk-v-select-dynamic-width"
            v-bind:label="$t('Log Level')"
            item-text="name"
            item-value="level"
            v-model="$shared.logLevel"
            v-bind:items="logLevels"
            style="margin-left: 16px"
          ></v-select>
        </v-row>

        <v-btn text small color="primary" v-on:click="openVersionDialog">{{
          $t("Show Version Info")
        }}</v-btn>
        <v-btn
          text
          small
          color="primary"
          v-on:click="openCheckIMDBScraperDialog"
          >{{ $t("Check IMDB Scraper") }}</v-btn
        >
        <v-btn text small color="primary" v-on:click="openDevTools">{{
          $t("Open DevTools")
        }}</v-btn>
      </v-tab-item>

      <!-- MOVIES -->
      <v-tab-item style="padding: 8px">
        <h3>{{ $t("Movies") }} - {{ $t("Source Paths") }}</h3>
        <v-alert
          type="warning"
          colored-border
          border="left"
          v-if="moviesSourcePaths.length == 0"
          >{{ $t("no paths defined") }}</v-alert
        >

        <div
          v-for="sourcePath in moviesSourcePaths"
          v-bind:key="sourcePath.id_SourcePaths"
          style="margin: 8px"
        >
          <mk-sourcepath
            v-bind:value="sourcePath"
            v-on:edit-description="onSourcePathEditDescription"
            v-on:delete="openRemoveSourcePathDialog"
            v-on:edit-path="onSourcePathEditPath"
          ></mk-sourcepath>
        </div>

        <v-btn text small color="primary" v-on:click="addSource('movies')">{{
          $t("Add Source Path")
        }}</v-btn>
      </v-tab-item>

      <!-- SERIES -->
      <!-- not yet implemented
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
            v-on:delete="openRemoveSourcePathDialog"
            v-on:edit-path="onSourcePathEditPath"
          ></mk-sourcepath>
        </div>

        <v-btn text small color="primary" v-on:click="addSource('series')">{{$t("Add Source Path")}}</v-btn>
      </v-tab-item>
      -->

      <!-- DUPLICATES -->
      <v-tab-item style="padding: 8px">
        <v-card-text class="mk-light-grey">
          <p>
            {{
              $t(
                "These settings describe how {appName} should handle duplicates",
                { appName: $shared.appName }
              )
            }}
          </p>
          <p>{{ $t("You may have duplicates in the following scenarios") }}:</p>
          <ul>
            <li>
              {{ $t("same file on a remote server and the local machine") }}
            </li>
            <li>{{ $t("same media but in different formats") }}</li>
          </ul>
        </v-card-text>

        <v-card style="width: 100%; margin-top: 8px">
          <h3>{{ $t("Actual Duplicates") }}</h3>
          <v-card-text>
            <p>
              {{
                $t(
                  "An actual duplicate is identified by the same filename and filesize"
                )
              }}
            </p>
          </v-card-text>
          <div style="margin-left: 16px">
            <p>
              {{
                $t("With actual duplicates, {appName} should also", {
                  appName: $shared.appName,
                })
              }}
            </p>

            <v-checkbox
              v-bind:label="$t('relink IMDB')"
              style="margin: 0px"
              color="mk-dark-grey"
              dense
              v-model="$shared.duplicatesHandling.actualDuplicate.relinkIMDB"
              v-on:click.native="duplicatesHandlingChanged"
            ></v-checkbox>
            <v-checkbox
              v-bind:label="$t('add to list')"
              style="margin: 0px"
              color="mk-dark-grey"
              dense
              v-model="$shared.duplicatesHandling.actualDuplicate.addToList"
              v-on:click.native="duplicatesHandlingChanged"
            ></v-checkbox>
            <v-checkbox
              v-bind:label="$t('update primary title')"
              style="margin: 0px"
              color="mk-dark-grey"
              dense
              v-model="$shared.duplicatesHandling.actualDuplicate.updateTitle"
              v-on:click.native="duplicatesHandlingChanged"
            ></v-checkbox>
            <v-checkbox
              v-bind:label="$t('update secondary title')"
              style="margin: 0px"
              color="mk-dark-grey"
              dense
              v-model="
                $shared.duplicatesHandling.actualDuplicate.updateSubTitle
              "
              v-on:click.native="duplicatesHandlingChanged"
            ></v-checkbox>
            <v-checkbox
              v-bind:label="$t('update rating')"
              style="margin: 0px"
              color="mk-dark-grey"
              dense
              v-model="$shared.duplicatesHandling.actualDuplicate.updateRating"
              v-on:click.native="duplicatesHandlingChanged"
            ></v-checkbox>
            <v-checkbox
              v-bind:label="$t('update last access')"
              style="margin: 0px"
              color="mk-dark-grey"
              dense
              v-model="
                $shared.duplicatesHandling.actualDuplicate.updateLastAccess
              "
              v-on:click.native="duplicatesHandlingChanged"
            ></v-checkbox>
          </div>
        </v-card>

        <v-card style="width: 100%; margin-top: 8px">
          <h3>{{ $t("Meta Duplicates") }}</h3>
          <v-card-text class="mk-light-grey">
            <p>
              {{
                $t(
                  "A meta duplicate is identified by having the same IMDB link_ This can happen if you have the same movie in different formats"
                )
              }}
            </p>
          </v-card-text>
          <div style="margin-left: 16px">
            <p>
              {{
                $t("With meta duplicates, {appName} should also", {
                  appName: $shared.appName,
                })
              }}
            </p>

            <v-checkbox
              v-bind:label="$t('add to list')"
              style="margin: 0px"
              color="mk-dark-grey"
              dense
              v-model="$shared.duplicatesHandling.metaDuplicate.addToList"
              v-on:click.native="duplicatesHandlingChanged"
            ></v-checkbox>
            <v-checkbox
              v-bind:label="$t('update rating')"
              style="margin: 0px"
              color="mk-dark-grey"
              dense
              v-model="$shared.duplicatesHandling.metaDuplicate.updateRating"
              v-on:click.native="duplicatesHandlingChanged"
            ></v-checkbox>
          </div>
        </v-card>
      </v-tab-item>

      <!-- REGIONS -->
      <v-tab-item style="padding: 8px">
        <v-card-text class="mk-light-grey">
          <p>
            {{
              $t(
                "The regions and their sequence defined here will be used for the Primary Title of the media as well as the age rating"
              )
            }}
          </p>
          <p>
            {{
              $t(
                "If a particular movie does not have a title for one of these regions, the Original Title of the movie is used Else, the Original Title will be used as Secondary Title if it is different"
              )
            }}
          </p>
        </v-card-text>

        <v-alert
          type="warning"
          colored-border
          border="left"
          v-if="$shared.regions.length === 0"
        >
          <span v-if="$shared.regions.length === 0 && $shared.fallbackRegion"
            >{{
              $t(
                "You currently don_t have a region set up_ {appName} will fall back to your system_s locale",
                { appName: $shared.appName }
              )
            }}: {{ $shared.fallbackRegion.name }}.</span
          >
          <span
            v-if="$shared.regions.length === 0 && !$shared.fallbackRegion"
            >{{
              $t(
                "You currently don_t have a region set up_ {appName} will fall back to the original title_",
                { appName: $shared.appName }
              )
            }}</span
          >
        </v-alert>

        <draggable
          v-model="$shared.regions"
          group="regions"
          v-on:end="onRegionsDragEnd"
        >
          <div v-for="region in $shared.regions" v-bind:key="region.code">
            <v-row style="margin: 8px">
              <v-card style="width: 100%">
                <v-list-item two-line style="cursor: grab">
                  <v-list-item-content>
                    <v-list-item-title>
                      {{ region.nameTranslated }}
                      <v-icon
                        class="mk-clickable-red"
                        v-on:click="openRemoveRegionDialog(region)"
                        >mdi-delete</v-icon
                      >
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-card>
            </v-row>
          </div>
        </draggable>

        <v-btn text small color="primary" v-on:click="openAddRegionsDialog">{{
          $t("Add Regions")
        }}</v-btn>
      </v-tab-item>

      <!-- LANGUAGES -->
      <v-tab-item style="padding: 8px">
        <h3>{{ $t("Language of the Application") }}</h3>
        <v-card-text class="mk-light-grey">
          <p>{{ $t("Change the language of the application here_") }}</p>
        </v-card-text>

        <v-row class="settings-row">
          <v-select
            class="mk-v-select-dynamic-width"
            item-text="name"
            item-value="code"
            v-model="$shared.uiLanguage"
            v-bind:items="availableLanguages"
            style="margin-top: -16px; margin-bottom: 16px; margin-left: 16px"
          ></v-select>
        </v-row>

        <h3>{{ $t("Languages of the Primary Title") }}</h3>

        <v-card-text class="mk-light-grey">
          <p>
            {{
              $t(
                "The languages and their sequence defined here will be used for the Primary Title of the media_"
              )
            }}
          </p>
          <p>
            <strong>{{ $t("Important_") }}</strong>
            {{
              $t(
                "If you want, for example, to see THISLANGUAGE titles, you must also add the THISREGION region in _REGIONS__"
              )
            }}
          </p>
        </v-card-text>

        <v-alert
          type="warning"
          colored-border
          border="left"
          v-if="
            !$shared.languagesPrimaryTitle ||
            $shared.languagesPrimaryTitle.length === 0
          "
        >
          <span v-if="$shared.fallbackLanguage"
            >{{
              $t(
                "You currently don_t have a language for the Primary Title set up_ {appName} will fall back to your system_s locale",
                { appName: $shared.appName }
              )
            }}: {{ $shared.fallbackLanguage.DisplayText }}.</span
          >
          <span v-if="!$shared.fallbackLanguage">{{
            $t(
              "You currently don_t have a language for the Primary Title set up_ {appName} will fall back to the original title_",
              { appName: $shared.appName }
            )
          }}</span>
        </v-alert>

        <draggable
          v-model="$shared.languagesPrimaryTitle"
          group="languagesPrimaryTitle"
          v-on:end="onLanguagesDragEnd('languagesPrimaryTitle')"
        >
          <div
            v-for="language in $shared.languagesPrimaryTitle"
            v-bind:key="language.code"
          >
            <v-row style="margin: 8px">
              <v-card style="width: 100%">
                <v-list-item two-line style="cursor: grab">
                  <v-list-item-content>
                    <v-list-item-title>
                      {{ language.DisplayText }}
                      <v-icon
                        class="mk-clickable-red"
                        v-on:click="
                          openRemoveLanguageDialog(
                            language,
                            'languagesPrimaryTitle'
                          )
                        "
                        >mdi-delete</v-icon
                      >
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-card>
            </v-row>
          </div>
        </draggable>

        <v-btn
          text
          small
          color="primary"
          v-on:click="openAddLanguagesDialog('languagesPrimaryTitle')"
          >{{ $t("Add Languages") }}</v-btn
        >

        <div style="height: 16px"></div>

        <h3>{{ $t("Languages for Audio and Subtitles") }}</h3>

        <v-card-text class="mk-light-grey">
          <p>
            {{
              $t(
                "The languages and their sequence defined here will be used to show which audio and subtitle languages your media contain_"
              )
            }}
          </p>
        </v-card-text>

        <v-alert
          type="warning"
          colored-border
          border="left"
          v-if="
            !$shared.languagesAudioSubtitles ||
            $shared.languagesAudioSubtitles.length === 0
          "
        >
          <span v-if="$shared.fallbackLanguage"
            >{{
              $t(
                "You currently don_t have a language for Audio and Subtitles set up_ {appName} will fall back to your system_s locale",
                { appName: $shared.appName }
              )
            }}: {{ $shared.fallbackLanguage.DisplayText }}.</span
          >
          <span v-if="!$shared.fallbackLanguage">{{
            $t(
              "You currently don_t have a language for Audio and Subtitles set up. {appName} will fall back to the original title_",
              { appName: $shared.appName }
            )
          }}</span>
        </v-alert>

        <draggable
          v-model="$shared.languagesAudioSubtitles"
          group="languagesAudioSubtitles"
          v-on:end="onLanguagesDragEnd('languagesAudioSubtitles')"
        >
          <div
            v-for="language in $shared.languagesAudioSubtitles"
            v-bind:key="language.code"
          >
            <v-row style="margin: 8px">
              <v-card style="width: 100%">
                <v-list-item two-line style="cursor: grab">
                  <v-list-item-content>
                    <v-list-item-title>
                      {{ language.DisplayText }}
                      <v-icon
                        class="mk-clickable-red"
                        v-on:click="
                          openRemoveLanguageDialog(
                            language,
                            'languagesAudioSubtitles'
                          )
                        "
                        >mdi-delete</v-icon
                      >
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-card>
            </v-row>
          </div>
        </draggable>

        <v-btn
          text
          small
          color="primary"
          v-on:click="openAddLanguagesDialog('languagesAudioSubtitles')"
          >{{ $t("Add Languages") }}</v-btn
        >
      </v-tab-item>

      <!-- TITLE TYPES -->
      <v-tab-item style="padding: 8px">
        <v-card-text class="mk-light-grey">
          <p>
            {{
              $t(
                "In _Regions_ you provided the regions to be used for the Primary Title_ However, many titles in IMDB have a special title type_ {appName} skips all special title types by default_ You can add title types here, so that they are actually used instead of being skipped_",
                { appName: $shared.appName }
              )
            }}
          </p>
        </v-card-text>

        <v-alert
          colored-border
          border="left"
          v-if="$shared.imdbTitleTypesWhitelist.length === 0"
          >{{ $t("No title types added, this is fine_") }}</v-alert
        >

        <mk-title-type
          v-for="item in $shared.imdbTitleTypesWhitelist"
          v-bind:key="item.TitleType"
          v-bind:value="item"
          v-bind:showRemove="true"
          v-on:removeTitleType="openRemoveTitleTypeDialog"
        ></mk-title-type>

        <v-btn
          text
          small
          color="primary"
          v-on:click="openAddTitleTypeDialog"
          style="margin-top: 16px"
          >{{ $t("Add Title Type") }}</v-btn
        >
      </v-tab-item>

      <!-- RELEASE ATTRIBUTES -->
      <v-tab-item style="padding: 8px">
        <v-card-text class="mk-light-grey">
          <p>
            {{
              $t(
                "Here you can set up which release attributes should be searched for in the file/directory names and how they should be displayed_"
              )
            }}
          </p>
          <p>
            {{
              $t(
                "The search term is case insensitive and must contain whole words within the file/directory name_"
              )
            }}
          </p>
        </v-card-text>

        <v-data-table
          ref="releaseAttributesTable"
          v-bind:headers="[
            { text: $t('Search Term'), value: 'searchTerm', sortable: false },
            { text: $t('Display As'), value: 'displayAs', sortable: false },
            { text: '', value: 'actions', sortable: false },
            {
              text: '',
              value: 'deleted',
              visible: false,
              filter: releaseAttributesFilter,
              align: 'd-none',
            },
          ]"
          v-bind:items="$shared.releaseAttributes"
          class="elevation-1"
          hide-default-footer
          v-bind:items-per-page="1000"
        >
          <template v-slot:body="{ items }">
            <draggable
              v-bind:list="items"
              tag="tbody"
              v-on:end="onReleaseAttributesDragEnd"
            >
              <tr
                v-for="(item, index) in items"
                v-bind:key="index"
                style="cursor: grab"
              >
                <td>{{ item.searchTerm }}</td>
                <td>{{ item.displayAs }}</td>
                <td>
                  <v-icon
                    small
                    class="mr-2 mk-clickable"
                    @click="onEditReleaseAttribute(item)"
                    >mdi-pencil</v-icon
                  >
                  <v-icon
                    small
                    class="mr-2 mk-clickable-red"
                    @click="openRemoveReleaseAttributeDialog(item)"
                    >mdi-delete</v-icon
                  >
                </td>
              </tr></draggable
            >
          </template>
          <!-- <template v-slot:item.actions="{ item }"> </template> -->
        </v-data-table>
        <v-btn
          v-on:click="onAddReleaseAttribute()"
          text
          small
          color="primary"
          style="margin-top: 16px"
          >{{ $t("Add") }}</v-btn
        >
      </v-tab-item>
    </v-tabs>

    <mk-sourcepath-description-dialog
      ref="sourcePathDescriptionDialog"
      v-bind:show="sourcePathDescriptionDialog.show"
      v-bind:title="$t('Edit Description')"
      v-bind:question="
        $t(
          'Please provide a description for the source path {Path} _{MediaTypeUpper}_',
          {
            Path: sourcePathDescriptionDialog.Path,
            MediaTypeUpper: sourcePathDescriptionDialog.MediaTypeUpper,
          }
        )
      "
      enterTextValue="true"
      v-bind:ok="$t('OK')"
      v-bind:cancel="$t('Cancel')"
      cancelColor="secondary"
      v-on:ok="onSourcePathDescriptionDialogOK"
      v-on:cancel="onSourcePathDescriptionDialogCancel"
    ></mk-sourcepath-description-dialog>
    <mk-remove-sourcepath-dialog
      v-bind:show="removeSourcePathDialog.show"
      v-bind:title="$t('Remove Source Path')"
      v-bind:question="
        $t(
          'Do you really want to remove the source path {Path} _{MediaTypeUpper}_ including all associated media_',
          {
            Path: removeSourcePathDialog.Path,
            MediaTypeUpper: removeSourcePathDialog.MediaTypeUpper,
          }
        )
      "
      v-bind:yes="$t('YES_ Remove')"
      v-bind:cancel="$t('Cancel')"
      yesColor="error"
      cancelColor="secondary"
      v-on:yes="onRemoveSourcePathDialogOK"
      v-on:cancel="onRemoveSourcePathDialogCancel"
    ></mk-remove-sourcepath-dialog>
    <mk-add-regions-dialog
      ref="addRegionsDialog"
      v-bind:show="addRegionsDialog.show"
      v-on:cancel="onAddRegionsDialogCancel"
      v-on:ok="onAddRegionsDialogOK"
    ></mk-add-regions-dialog>
    <mk-remove-region-dialog
      v-bind:show="removeRegionDialog.show"
      v-bind:title="$t('Remove Region')"
      v-bind:question="
        $t('Do you really want to remove the region {Region}_', {
          Region: removeRegionDialog.Region,
        })
      "
      v-bind:yes="$t('YES_ Remove')"
      v-bind:cancel="$t('Cancel')"
      yesColor="error"
      cancelColor="secondary"
      v-on:yes="onRemoveRegionDialogOK"
      v-on:cancel="onRemoveRegionDialogCancel"
    ></mk-remove-region-dialog>
    <mk-add-languages-dialog
      ref="addLanguagesDialog"
      v-bind:show="addLanguagesDialog.show"
      v-bind:languageType="addLanguagesDialog.languageType"
      v-on:cancel="onAddLanguagesDialogCancel"
      v-on:ok="onAddLanguagesDialogOK"
    ></mk-add-languages-dialog>
    <mk-remove-language-dialog
      v-bind:show="removeLanguageDialog.show"
      v-bind:title="$t('Remove Language')"
      v-bind:question="
        $t('Do you really want to remove the language {Language}_', {
          Language: removeLanguageDialog.Language,
        })
      "
      v-bind:yes="$t('YES_ Remove')"
      v-bind:cancel="$t('Cancel')"
      yesColor="error"
      cancelColor="secondary"
      v-on:yes="onRemoveLanguageDialogOK"
      v-on:cancel="onRemoveLanguageDialogCancel"
    ></mk-remove-language-dialog>
    <mk-add-title-type-dialog
      ref="addTitleTypeDialog"
      v-bind:show="addTitleTypeDialog.show"
      v-on:close="onAddTitleTypeDialogClose"
      v-on:addTitleType="onAddTitleType"
    ></mk-add-title-type-dialog>
    <mk-remove-title-type-dialog
      v-bind:show="removeTitleTypeDialog.show"
      v-bind:title="$t('Remove Title Type')"
      v-bind:question="
        $t('Do you really want to remove the title type {TitleType}_', {
          TitleType: removeTitleTypeDialog.TitleType,
        })
      "
      v-bind:yes="$t('YES_ Remove')"
      v-bind:cancel="$t('Cancel')"
      yesColor="error"
      cancelColor="secondary"
      v-on:yes="onRemoveTitleTypeDialogOK"
      v-on:cancel="onRemoveTitleTypeDialogCancel"
    ></mk-remove-title-type-dialog>
    <mk-edit-release-attribute-dialog
      ref="editReleaseAttributeDialog"
      v-bind:show="editReleaseAttributeDialog.show"
      v-bind:title="editReleaseAttributeDialog.title"
      v-on:cancel="onEditReleaseAttributeDialogClose"
      v-on:ok="onEditReleaseAttributeDialogOK"
    ></mk-edit-release-attribute-dialog>
    <mk-remove-release-attribute-dialog
      v-bind:show="removeReleaseAttributeDialog.show"
      v-bind:title="$t('Remove Release Attribute')"
      v-bind:question="
        $t(
          'Do you really want to remove the release attribute {ReleaseAttribute}_',
          { ReleaseAttribute: removeReleaseAttributeDialog.ReleaseAttribute }
        )
      "
      v-bind:yes="$t('YES_ Remove')"
      v-bind:cancel="$t('Cancel')"
      yesColor="error"
      cancelColor="secondary"
      v-on:yes="onRemoveReleaseAttributeDialogOK"
      v-on:cancel="onRemoveReleaseAttributeDialogCancel"
    ></mk-remove-release-attribute-dialog>
    <mk-edit-mediaplayer-path-dialog
      ref="editMediaplayerPathDialog"
      v-bind:show="editMediaplayerPathDialog.show"
      v-bind:title="$t('Edit Media Player Path')"
      v-bind:question="$t('Please provide the path to your media player_')"
      enterTextValue="true"
      v-bind:ok="$t('OK')"
      v-bind:cancel="$t('Cancel')"
      cancelColor="secondary"
      v-on:ok="onEditMediaplayerPathDialogOK"
      v-on:cancel="onEditMediaplayerPathDialogCancel"
    ></mk-edit-mediaplayer-path-dialog>
    <mk-edit-mediainfo-path-dialog
      ref="editMediainfoPathDialog"
      v-bind:show="editMediainfoPathDialog.show"
      v-bind:title="$t('Edit MediaInfo CLI Path')"
      v-bind:question="$t('Please provide the path to MediaInfo CLI_')"
      enterTextValue="true"
      v-bind:ok="$t('OK')"
      v-bind:cancel="$t('Cancel')"
      cancelColor="secondary"
      v-on:ok="onEditMediainfoPathDialogOK"
      v-on:cancel="onEditMediainfoPathDialogCancel"
    ></mk-edit-mediainfo-path-dialog>
  </div>
</template>

<script>
const { dialog, BrowserWindow, shell } = require("electron").remote;
import * as _ from "lodash";
import draggable from "vuedraggable";

const logger = require("../helpers/logger");

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

const { languageCodeNameMapping } = require("@/languages");

export default {
  components: {
    draggable,
    "mk-sourcepath": SourcePath,
    "mk-sourcepath-description-dialog": Dialog,
    "mk-remove-sourcepath-dialog": Dialog,
    "mk-add-regions-dialog": AddRegionsDialog,
    "mk-remove-region-dialog": Dialog,
    "mk-add-languages-dialog": AddLanguagesDialog,
    "mk-remove-language-dialog": Dialog,
    "mk-add-title-type-dialog": AddTitleTypeDialog,
    "mk-remove-title-type-dialog": Dialog,
    "mk-edit-release-attribute-dialog": EditReleaseAttributeDialog,
    "mk-remove-release-attribute-dialog": Dialog,
    "mk-title-type": TitleType,
    "mk-edit-mediaplayer-path-dialog": Dialog,
    "mk-edit-mediainfo-path-dialog": Dialog,
  },

  data: () => ({
    logLevels: [
      {
        level: 0,
        name: "Trace",
      },
      {
        level: 1,
        name: "Debug",
      },
      {
        level: 2,
        name: "Info",
      },
      {
        level: 3,
        name: "Warn",
      },
      {
        level: 4,
        name: "Error",
      },
      {
        level: 5,
        name: "Silent",
      },
    ],

    MediaplayerPath: null,
    MediainfoPath: null,
    minimumWaitForSetAccess: 60,

    sourcePaths: [],

    sourcePathDescriptionDialog: {
      show: false,
      id_SourcePaths: null,
      MediaType: null,
      MediaTypeUpper: null,
      Path: null,
      Description: null,
    },

    removeSourcePathDialog: {
      show: false,
      id_SourcePaths: null,
      MediaType: null,
      MediaTypeUpper: null,
      Path: null,
    },

    editMediaplayerPathDialog: {
      show: false,
    },

    editMediainfoPathDialog: {
      show: false,
    },

    addRegionsDialog: {
      show: false,
    },

    removeRegionDialog: {
      show: false,
      item: null,
      Region: null,
    },

    addLanguagesDialog: {
      show: false,
      languageType: null,
    },

    removeLanguageDialog: {
      show: false,
      item: null,
      type: null,
      Language: null,
    },

    addTitleTypeDialog: {
      show: false,
    },

    removeTitleTypeDialog: {
      show: false,
      item: null,
      TitleType: null,
    },

    removeReleaseAttributeDialog: {
      show: false,
      item: null,
      ReleaseAttribute: null,
    },

    tmpPath: "",

    editReleaseAttributeDialog: {
      show: false,
      title: "",
      oldItem: null,
    },

    availableLanguages: [],
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

    shared_logLevel: function (newValue) {
      (async () => {
        store.setLogLevel(newValue);
        await store.setSetting("LogLevel", newValue);
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

    shared_logLevel() {
      return this.$shared.logLevel;
    },
  },

  methods: {
    openURL(url) {
      shell.openExternal(url);
    },

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

      logger.log("folderposition:", folderposition);

      const chosenPath = folderposition.filePaths[0];
      const chosenPathLower = chosenPath.toLowerCase();

      let isAlreadyInUse = false;
      this.sourcePaths.forEach((sourcePath) => {
        const pathLower = sourcePath.Path.toLowerCase();

        if (chosenPathLower == pathLower) {
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

    async onSourcePathEditPath(sourcePath) {
      logger.log("onSourcePathEditPath sourcePath:", sourcePath);

      const folderposition = await dialog.showOpenDialog({
        defaultPath: sourcePath.Path,
        properties: ["openDirectory"],
      });

      if (folderposition.canceled) {
        return;
      }

      logger.log("folderposition:", folderposition);

      const chosenPath = folderposition.filePaths[0];
      const chosenPathLower = chosenPath.toLowerCase();

      let isAlreadyInUse = false;
      this.sourcePaths.forEach((sp) => {
        const pathLower = sp.Path.toLowerCase();

        if (sourcePath !== sp && chosenPathLower == pathLower) {
          isAlreadyInUse = true;
        }
      });

      if (isAlreadyInUse) {
        return eventBus.showSnackbar(
          "error",
          this.$t("The chosen path is already in use_")
        );
      }

      try {
        await store.db.fireProcedure(
          `UPDATE tbl_SourcePaths SET Path = $Path WHERE id_SourcePaths = $id_SourcePaths`,
          {
            $id_SourcePaths: sourcePath.id_SourcePaths,
            $Path: chosenPath,
          }
        );

        await this.fetchSourcePaths();

        eventBus.showSnackbar("success", this.$t("Path updated_"));
      } catch (err) {
        eventBus.showSnackbar("error", err);
      }
    },

    showEditMediaplayerPathDialog() {
      this.$refs.editMediaplayerPathDialog.initTextValue(this.MediaplayerPath);
      this.editMediaplayerPathDialog.show = true;
    },

    async onEditMediaplayerPathDialogOK(result) {
      if (!(await helpers.existsAsync(result.textValue))) {
        eventBus.showSnackbar(
          "error",
          this.$t(`The path _{path}_ cannot be found_`, {
            path: result.textValue,
          })
        );
        this.editMediaplayerPathDialog.show = false;
        return;
      }

      this.MediaplayerPath = result.textValue;

      store.setSetting("MediaplayerPath", this.MediaplayerPath);

      this.editMediaplayerPathDialog.show = false;

      eventBus.showSnackbar(
        "success",
        this.$t(`Media Player path changed to _{path}__`, {
          path: result.textValue,
        })
      );
    },

    onEditMediaplayerPathDialogCancel() {
      this.editMediaplayerPathDialog.show = false;
    },

    showEditMediainfoPathDialog() {
      this.$refs.editMediainfoPathDialog.initTextValue(this.MediainfoPath);
      this.editMediainfoPathDialog.show = true;
    },

    async onEditMediainfoPathDialogOK(result) {
      if (!(await helpers.existsAsync(result.textValue))) {
        eventBus.showSnackbar(
          "error",
          this.$t(`The path _{path}_ cannot be found_`, {
            path: result.textValue,
          })
        );
        this.editMediainfoPathDialog.show = false;
        return;
      }

      this.MediainfoPath = result.textValue;

      store.setSetting("MediainfoPath", this.MediainfoPath);

      this.editMediainfoPathDialog.show = false;

      eventBus.showSnackbar(
        "success",
        this.$t(`MediaInfo CLI path changed to _{path}__`, {
          path: result.textValue,
        })
      );
    },

    onEditMediainfoPathDialogCancel() {
      this.editMediainfoPathDialog.show = false;
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
      this.sourcePathDescriptionDialog.MediaTypeUpper =
        sourcePathItem.MediaType.toUpperCase();
      this.sourcePathDescriptionDialog.Description = sourcePathItem.Description;

      this.$refs.sourcePathDescriptionDialog.initTextValue(
        sourcePathItem.Description
      );

      this.sourcePathDescriptionDialog.show = true;
    },

    openRemoveSourcePathDialog(sourcePathItem) {
      this.removeSourcePathDialog.id_SourcePaths =
        sourcePathItem.id_SourcePaths;
      this.removeSourcePathDialog.Path = sourcePathItem.Path;
      this.removeSourcePathDialog.MediaTypeUpper =
        sourcePathItem.MediaType.toUpperCase();

      this.removeSourcePathDialog.show = true;
    },

    onRemoveSourcePathDialogCancel() {
      this.removeSourcePathDialog.show = false;
    },

    onRemoveSourcePathDialogOK() {
      (async () => {
        try {
          eventBus.showLoadingOverlay(true);

          this.removeSourcePathDialog.show = false;

          await store.db.fireProcedure(
            `DELETE FROM tbl_SourcePaths WHERE id_SourcePaths = $id_SourcePaths`,
            {
              $id_SourcePaths: this.removeSourcePathDialog.id_SourcePaths,
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

    openRemoveRegionDialog(item) {
      this.removeRegionDialog.item = item;
      this.removeRegionDialog.Region = item.nameTranslated;
      this.removeRegionDialog.show = true;
    },

    onRemoveRegionDialogOK() {
      this.removeRegion(this.removeRegionDialog.item);
      this.removeRegionDialog.show = false;
      eventBus.showSnackbar("success", this.$t("Region removed_"));
    },

    onRemoveRegionDialogCancel() {
      this.removeRegionDialog.show = false;
    },

    onAddRegionsDialogCancel() {
      this.addRegionsDialog.show = false;
    },

    onAddLanguagesDialogCancel() {
      this.addLanguagesDialog.show = false;
    },

    async onAddRegionsDialogOK(result) {
      result.forEach((region) => this.$shared.regions.push(region));

      await store.setSetting("regions", JSON.stringify(this.$shared.regions));

      this.addRegionsDialog.show = false;
    },

    async onAddLanguagesDialogOK(result) {
      const languages =
        this.addLanguagesDialog.languageType === "languagesPrimaryTitle"
          ? this.$shared.languagesPrimaryTitle
          : this.$shared.languagesAudioSubtitles;

      result.forEach((language) => languages.push(language));

      await store.setSetting(
        this.addLanguagesDialog.languageType,
        JSON.stringify(languages)
      );

      this.addLanguagesDialog.show = false;
    },

    async removeRegion(region) {
      this.$shared.regions.splice(
        this.$shared.regions.findIndex((region2) => region2 === region),
        1
      );
      await store.setSetting("regions", JSON.stringify(this.$shared.regions));
    },

    async removeLanguage(language, languageType) {
      const languages =
        languageType === "languagesPrimaryTitle"
          ? this.$shared.languagesPrimaryTitle
          : this.$shared.languagesAudioSubtitles;

      languages.splice(
        languages.findIndex((language2) => language2 === language),
        1
      );
      await store.setSetting(languageType, JSON.stringify(languages));
    },

    async onRegionsDragEnd() {
      await store.setSetting("regions", JSON.stringify(this.$shared.regions));
    },

    async onReleaseAttributesDragEnd() {
      // We use the internal data from the data table (they hold the current sequence but don't contain items marked as deleted)
      const releaseAttributes = JSON.parse(
        JSON.stringify(
          this.$refs.releaseAttributesTable._data.internalCurrentItems
        )
      );

      this.$shared.releaseAttributes.forEach((ra) => {
        if (
          !releaseAttributes.find(
            (ra2) =>
              ra2.searchTerm === ra.searchTerm && ra2.displayAs === ra.displayAs
          )
        ) {
          releaseAttributes.push(ra);
        }
      });

      this.$shared.releaseAttributes = releaseAttributes;

      await store.setSetting(
        "ReleaseAttributes",
        JSON.stringify(releaseAttributes)
      );
    },

    async onLanguagesDragEnd(languageType) {
      const languages =
        languageType === "languagesPrimaryTitle"
          ? this.$shared.languagesPrimaryTitle
          : this.$shared.languagesAudioSubtitles;

      await store.setSetting(languageType, JSON.stringify(languages));
    },

    openRemoveLanguageDialog(item, type) {
      this.removeLanguageDialog.item = item;
      this.removeLanguageDialog.type = type;
      this.removeLanguageDialog.Language = item.DisplayText;
      this.removeLanguageDialog.show = true;
    },

    onRemoveLanguageDialogOK() {
      this.removeLanguage(
        this.removeLanguageDialog.item,
        this.removeLanguageDialog.type
      );
      this.removeLanguageDialog.show = false;
      eventBus.showSnackbar("success", this.$t("Language removed_"));
    },

    onRemoveLanguageDialogCancel() {
      this.removeLanguageDialog.show = false;
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

    openRemoveTitleTypeDialog(titleType) {
      logger.log("openRemoveTitleTypeDialog titleType:", titleType);

      this.removeTitleTypeDialog.item = titleType;
      this.removeTitleTypeDialog.TitleType = titleType.TitleType;
      this.removeTitleTypeDialog.show = true;
    },

    async onRemoveTitleTypeDialogOK() {
      await this.removeTitleType(this.removeTitleTypeDialog.item);
      this.removeTitleTypeDialog.show = false;
    },

    onRemoveTitleTypeDialogCancel() {
      this.removeTitleTypeDialog.show = false;
    },

    async removeTitleType(titleType) {
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
          });
        } else {
          foundItem.displayAs = displayAs;
          foundItem.deleted = false;
        }

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

    openRemoveReleaseAttributeDialog(item) {
      this.removeReleaseAttributeDialog.item = item;
      this.removeReleaseAttributeDialog.ReleaseAttribute = `${item.searchTerm} - ${item.displayAs}`;
      this.removeReleaseAttributeDialog.show = true;
    },

    async onRemoveReleaseAttributeDialogOK() {
      await this.removeReleaseAttribute(this.removeReleaseAttributeDialog.item);
      this.removeReleaseAttributeDialog.show = false;
    },

    onRemoveReleaseAttributeDialogCancel() {
      this.removeReleaseAttributeDialog.show = false;
    },

    async removeReleaseAttribute(item) {
      try {
        item.deleted = true;

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

    releaseAttributesFilter(value /*, search, item*/) {
      return !value;
    },
  },

  // ### LifeCycle Hooks ###
  async created() {
    logger.groupCollapsed("[Initialize Settings]");
    this.$shared.imdbRatingDemographics.forEach((demographic) => {
      demographic.long_translated = this.$t(
        `RatingDemographics.${demographic.long}`
      );
    });

    logger.log(
      "this.$shared.imdbRatingDemographics:",
      this.$shared.imdbRatingDemographics
    );

    await this.fetchSourcePaths();

    const regions = await store.getSetting("regions");

    if (regions) {
      this.$shared.regions = JSON.parse(regions);

      this.$shared.regions.forEach((item) => {
        item.nameTranslated = this.$t(
          `RegionNames.${item.name.replace(/\./g, "_")}`
        );
      });
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
    this.minimumWaitForSetAccess = await store.getMinimumWaitForSetAccess();

    // translate language names
    if (this.$shared.languagesPrimaryTitle) {
      this.$shared.languagesPrimaryTitle.forEach((item) => {
        item.nameTranslated = this.$t(
          `LanguageNames.${item.name.replace(/\./g, "_")}`
        );
        item.DisplayText = `${item.nameTranslated} (${item.code})`;
      });
    }
    if (this.$shared.languagesAudioSubtitles) {
      this.$shared.languagesAudioSubtitles.forEach((item) => {
        item.nameTranslated = this.$t(
          `LanguageNames.${item.name.replace(/\./g, "_")}`
        );
        item.DisplayText = `${item.nameTranslated} (${item.code})`;
      });
    }

    this.availableLanguages = this.$i18n.availableLocales.map((locale) => {
      return {
        code: locale,
        name: this.$i18n._vm.messages[locale].LanguageNames[
          languageCodeNameMapping[helpers.uppercaseEachWord(locale)]
        ],
      };
    });

    logger.log(
      "Settings.create this.availableLanguages:",
      this.availableLanguages
    );

    logger.log(
      "this.$shared.releaseAttributes:",
      this.$shared.releaseAttributes
    );

    // lodash debounced functions
    this.debouncedUpdateMinimumWaitForSetAccess = _.debounce(
      this.updateMinimumWaitForSetAccess,
      500
    );

    logger.groupEnd();
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
