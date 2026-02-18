<template>
  <div style="width: 100%; margin-left: 8px">
    <h1>
      <v-btn variant="text" v-on:click="$router.go(-1)">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      {{ $t("Settings") }}
    </h1>

    <v-tabs v-model="activeTab" color="white">
      <v-tab value="general">{{ $t("General") }}</v-tab>
      <v-tab value="movies">{{ $t("Movies") }}</v-tab>
      <v-tab value="series">{{ $t("Series") }}</v-tab>
      <v-tab value="duplicates">{{ $t("Duplicates") }}</v-tab>
      <v-tab value="regions">{{ $t("Regions") }}</v-tab>
      <v-tab value="languages">{{ $t("Languages") }}</v-tab>
      <v-tab value="titletypes">{{ $t("Title Types") }}</v-tab>
      <v-tab value="releaseattributes">{{ $t("Release Attributes") }}</v-tab>
      <v-tab value="scanhistory" v-on:click="loadScanProcesses">{{ $t("Scan History") }}</v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <!-- GENERAL -->
      <v-window-item value="general" style="padding: 8px">
        <v-row class="settings-row">
          <h3>{{ $t("Media Player Path") }}</h3>

          <v-card-text class="mk-light-grey">
            {{
              $t(
                "{appName} needs the path to a media player of your choice for media playback_ We recommend the VLC media player, you can get it at:",
                {
                  appName: $shared.appName,
                }
              )
            }}
            <a href="https://www.videolan.org/vlc/index.html" target="_blank" rel="noreferrer noopener nofollow"
              >https://www.videolan.org/vlc/index.html</a
            >
          </v-card-text>

          <v-text-field
            readonly
            v-bind:label="$t('Media Player Path')"
            v-model="MediaplayerPath"
            variant="underlined"
            style="margin-left: 16px"
          ></v-text-field>

          <v-btn
            v-on:click="browseMediaplayerPath()"
            variant="text"
            size="small"
            color="primary"
            style="margin-top: 16px"
            >{{ $t("Browse") }}</v-btn
          >
          <v-btn
            v-on:click="showEditMediaplayerPathDialog()"
            variant="text"
            size="small"
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
                "{appName} needs the path to Mediainfo CLI in order to determine duration, video resolution and languages of your media_ You can get Mediainfo CLI at:",
                { appName: $shared.appName }
              )
            }}
            <a href="https://mediaarea.net/en/MediaInfo" target="_blank" rel="noreferrer noopener nofollow"
              >https://mediaarea.net/en/MediaInfo</a
            >
          </v-card-text>

          <v-text-field
            readonly
            v-bind:label="$t('Mediainfo CLI Path')"
            v-model="MediainfoPath"
            variant="underlined"
            style="margin-left: 16px"
          ></v-text-field>

          <v-btn
            v-on:click="browseMediainfoPath()"
            variant="text"
            size="small"
            color="primary"
            style="margin-top: 16px"
            >{{ $t("Browse") }}</v-btn
          >
          <v-btn
            v-on:click="showEditMediainfoPathDialog()"
            variant="text"
            size="small"
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
            variant="underlined"
            style="margin-left: 16px"
          ></v-text-field>
        </v-row>

        <!--
          #rip-rating-demographics
          
          since v1.3.0 we unfortunately have to disable this feature as imdb.com doesn't offer the rating demographics by gender, US/non-US and age anymore
          we keep the source commented-out however, if at some point in the future imdb.com decides to bring this feature back (find all occurences of #rip-rating-demographics in the code)
        -->
        <!--
          <v-row class="settings-row">
            <h3>{{ $t("IMDB Rating Demographic") }}</h3>
  
            <v-card-text class="mk-light-grey">{{
              $t(
                "{appName} provides the IMDB score and number of votes for each medium (where applicable)_ By default these are the numbers of all IMDB users_ You can, however, decide if you wish to see those of a certain demographic, e_g_ by gender or age_",
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
        -->

        <v-row class="settings-row">
          <h3>{{ $t("Log Level") }}</h3>

          <v-card-text class="mk-light-grey">{{
            $t(
              "{appName} logs certain events during runtime_ You can view these logs by pressing the 'Open DevTools' button below_ With the log level you decide which event severity should be logged_",
              { appName: $shared.appName }
            )
          }}</v-card-text>

          <v-select
            class="mk-v-select-dynamic-width"
            variant="underlined"
            v-bind:label="$t('Log Level')"
            item-title="name"
            item-value="level"
            v-model="$shared.logLevel"
            v-bind:items="logLevels"
            style="margin-left: 16px"
          ></v-select>
        </v-row>

        <v-btn variant="text" size="small" color="primary" v-on:click="openVersionDialog">{{
          $t("Show Version Info")
        }}</v-btn>
        <v-btn variant="text" size="small" color="primary" v-on:click="openCheckIMDBScraperDialog">{{
          $t("Check IMDB Scraper")
        }}</v-btn>
        <v-btn variant="text" size="small" color="primary" v-on:click="openDevTools">{{ $t("Open DevTools") }}</v-btn>
      </v-window-item>

      <!-- MOVIES -->
      <v-window-item value="movies" style="padding: 8px">
        <h3>{{ $t("Movies") }} - {{ $t("Source Paths") }}</h3>
        <v-alert type="warning" variant="tonal" border="start" v-if="moviesSourcePaths.length == 0">{{
          $t("no paths defined")
        }}</v-alert>

        <div v-for="sourcePath in moviesSourcePaths" v-bind:key="sourcePath.id_SourcePaths" style="margin: 8px">
          <mk-sourcepath
            v-bind:value="sourcePath"
            v-on:edit-description="onSourcePathEditDescription"
            v-on:delete="openRemoveSourcePathDialog"
            v-on:edit-path="onSourcePathEditPath"
          ></mk-sourcepath>
        </div>

        <v-btn variant="text" size="small" color="primary" v-on:click="addSource('movies')">{{
          $t("Add Source Path")
        }}</v-btn>
      </v-window-item>

      <!-- SERIES -->
      <v-window-item value="series" style="padding: 8px">
        <h3>{{ $t("Series") }} - {{ $t("Source Paths") }}</h3>
        <v-alert type="warning" variant="tonal" border="start" v-if="tvSourcePaths.length == 0">{{
          $t("no paths defined")
        }}</v-alert>

        <p style="color: lightgray">
          <strong>{{ $t("Important:") }}</strong>
          {{ $t("Organize your source paths so that each subdirectory of them contains exactly one series_") }}
        </p>

        <div v-for="sourcePath in tvSourcePaths" v-bind:key="sourcePath.id_SourcePaths" style="margin: 8px">
          <mk-sourcepath
            v-bind:value="sourcePath"
            v-on:edit-description="onSourcePathEditDescription"
            v-on:delete="openRemoveSourcePathDialog"
            v-on:edit-path="onSourcePathEditPath"
          ></mk-sourcepath>
        </div>

        <v-btn variant="text" size="small" color="primary" v-on:click="addSource('series')">{{
          $t("Add Source Path")
        }}</v-btn>
      </v-window-item>

      <!-- DUPLICATES -->
      <v-window-item value="duplicates" style="padding: 8px">
        <v-card-text class="mk-light-grey">
          <p>
            {{ $t("These settings describe how {appName} should handle duplicates", { appName: $shared.appName }) }}
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
              {{ $t("An actual duplicate is identified by the same filename and filesize") }}
            </p>
          </v-card-text>
          <div style="margin-left: 16px">
            <p>
              {{
                $t("With actual duplicates, {appName} should also___", {
                  appName: $shared.appName,
                })
              }}
            </p>

            <v-checkbox
              v-bind:label="$t('relink IMDB')"
              style="margin: 0px"
              color="mk-dark-grey"
              density="compact"
              v-model="$shared.duplicatesHandling.actualDuplicate.relinkIMDB"
              v-on:click="duplicatesHandlingChanged"
            ></v-checkbox>
            <v-checkbox
              v-bind:label="$t('re-use already scraped IMDB metadata')"
              style="margin: 0px"
              color="mk-dark-grey"
              density="compact"
              v-model="$shared.duplicatesHandling.actualDuplicate.reuseIMDBMetaData"
              v-on:click="duplicatesHandlingChanged"
            ></v-checkbox>
            <v-checkbox
              v-bind:label="$t('add to list')"
              style="margin: 0px"
              color="mk-dark-grey"
              density="compact"
              v-model="$shared.duplicatesHandling.actualDuplicate.addToList"
              v-on:click="duplicatesHandlingChanged"
            ></v-checkbox>
            <v-checkbox
              v-bind:label="$t('update primary title')"
              style="margin: 0px"
              color="mk-dark-grey"
              density="compact"
              v-model="$shared.duplicatesHandling.actualDuplicate.updateTitle"
              v-on:click="duplicatesHandlingChanged"
            ></v-checkbox>
            <v-checkbox
              v-bind:label="$t('update secondary title')"
              style="margin: 0px"
              color="mk-dark-grey"
              density="compact"
              v-model="$shared.duplicatesHandling.actualDuplicate.updateSubTitle"
              v-on:click="duplicatesHandlingChanged"
            ></v-checkbox>
            <v-checkbox
              v-bind:label="$t('update rating')"
              style="margin: 0px"
              color="mk-dark-grey"
              density="compact"
              v-model="$shared.duplicatesHandling.actualDuplicate.updateRating"
              v-on:click="duplicatesHandlingChanged"
            ></v-checkbox>
            <v-checkbox
              v-bind:label="$t('update last access')"
              style="margin: 0px"
              color="mk-dark-grey"
              density="compact"
              v-model="$shared.duplicatesHandling.actualDuplicate.updateLastAccess"
              v-on:click="duplicatesHandlingChanged"
            ></v-checkbox>
            <v-checkbox
              v-bind:label="$t('update description')"
              style="margin: 0px"
              color="mk-dark-grey"
              density="compact"
              v-model="$shared.duplicatesHandling.actualDuplicate.updateDescription"
              v-on:click="duplicatesHandlingChanged"
            ></v-checkbox>
            <v-checkbox
              v-bind:label="$t('update release attributes')"
              style="margin: 0px"
              color="mk-dark-grey"
              density="compact"
              v-model="$shared.duplicatesHandling.actualDuplicate.updateReleaseAttributes"
              v-on:click="duplicatesHandlingChanged"
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
                $t("With meta duplicates, {appName} should also___", {
                  appName: $shared.appName,
                })
              }}
            </p>

            <v-checkbox
              v-bind:label="$t('add to list')"
              style="margin: 0px"
              color="mk-dark-grey"
              density="compact"
              v-model="$shared.duplicatesHandling.metaDuplicate.addToList"
              v-on:click="duplicatesHandlingChanged"
            ></v-checkbox>
            <v-checkbox
              v-bind:label="$t('update rating')"
              style="margin: 0px"
              color="mk-dark-grey"
              density="compact"
              v-model="$shared.duplicatesHandling.metaDuplicate.updateRating"
              v-on:click="duplicatesHandlingChanged"
            ></v-checkbox>
          </div>
        </v-card>
      </v-window-item>

      <!-- REGIONS -->
      <v-window-item value="regions" style="padding: 8px">
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

        <v-alert type="warning" variant="tonal" border="start" v-if="$shared.regions.length === 0">
          <span v-if="$shared.regions.length === 0 && $shared.fallbackRegion"
            >{{
              $t("You currently don't have a region set up_ {appName} will fall back to your system's locale", {
                appName: $shared.appName,
              })
            }}: {{ $shared.fallbackRegion.name }}.</span
          >
          <span v-if="$shared.regions.length === 0 && !$shared.fallbackRegion">{{
            $t("You currently don't have a region set up_ {appName} will fall back to the original title_", {
              appName: $shared.appName,
            })
          }}</span>
        </v-alert>

        <!-- TODO: draggable temporarily replaced with div due to Vue 3.4+ incompatibility -->
        <div>
          <div v-for="region in $shared.regions" v-bind:key="region.code">
            <v-row style="margin: 8px">
              <v-card style="width: 100%">
                <v-list-item>
                  <v-list-item-title>
                    {{ region.nameTranslated }}
                    <v-icon class="mk-clickable-red" size="16" v-on:click="openRemoveRegionDialog(region)">mdi-delete</v-icon>
                  </v-list-item-title>
                </v-list-item>
              </v-card>
            </v-row>
          </div>
        </div>

        <v-btn variant="text" size="small" color="primary" v-on:click="openAddRegionsDialog">{{
          $t("Add Regions")
        }}</v-btn>
      </v-window-item>

      <!-- LANGUAGES -->
      <v-window-item value="languages" style="padding: 8px">
        <h3>{{ $t("Language of the Application") }}</h3>
        <v-card-text class="mk-light-grey">
          <p>{{ $t("Change the language of the application here_") }}</p>
        </v-card-text>

        <v-row class="settings-row">
          <v-select
            class="mk-v-select-dynamic-width"
            variant="underlined"
            item-title="name"
            item-value="code"
            v-model="$shared.uiLanguage"
            v-bind:items="availableLanguages"
            style="margin-top: -16px; margin-bottom: 16px; margin-left: 16px"
          ></v-select>
        </v-row>

        <h3>{{ $t("Languages of the Primary Title") }}</h3>

        <v-card-text class="mk-light-grey">
          <p>
            {{ $t("The languages and their sequence defined here will be used for the Primary Title of the media_") }}
          </p>
          <p>
            <strong>{{ $t("Important:") }}</strong>
            {{
              $t(
                `If you want, for example, to see THISLANGUAGE titles, you must also add the THISREGION region in "Regions"_`
              )
            }}
          </p>
        </v-card-text>

        <v-alert
          type="warning"
          variant="tonal"
          border="start"
          v-if="!$shared.languagesPrimaryTitle || $shared.languagesPrimaryTitle.length === 0"
        >
          <span v-if="$shared.fallbackLanguage"
            >{{
              $t(
                "You currently don't have a language for the Primary Title set up_ {appName} will fall back to your system's locale",
                {
                  appName: $shared.appName,
                }
              )
            }}: {{ $shared.fallbackLanguage.DisplayText }}.</span
          >
          <span v-if="!$shared.fallbackLanguage">{{
            $t(
              "You currently don't have a language for the Primary Title set up_ {appName} will fall back to the original title_",
              {
                appName: $shared.appName,
              }
            )
          }}</span>
        </v-alert>

        <!-- TODO: draggable temporarily replaced with div -->
        <div>
          <div v-for="language in $shared.languagesPrimaryTitle" v-bind:key="language.code">
            <v-row style="margin: 8px">
              <v-card style="width: 100%">
                <v-list-item>
                  <v-list-item-title>
                    {{ language.DisplayText }}
                    <v-icon
                      class="mk-clickable-red"
                      size="16"
                      v-on:click="openRemoveLanguageDialog(language, 'languagesPrimaryTitle')"
                      >mdi-delete</v-icon
                    >
                  </v-list-item-title>
                </v-list-item>
              </v-card>
            </v-row>
          </div>
        </div>

        <v-btn
          variant="text"
          size="small"
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
          variant="tonal"
          border="start"
          v-if="!$shared.languagesAudioSubtitles || $shared.languagesAudioSubtitles.length === 0"
        >
          <span v-if="$shared.fallbackLanguage"
            >{{
              $t(
                "You currently don't have a language for Audio and Subtitles set up_ {appName} will fall back to your system's locale",
                {
                  appName: $shared.appName,
                }
              )
            }}: {{ $shared.fallbackLanguage.DisplayText }}.</span
          >
          <span v-if="!$shared.fallbackLanguage">{{
            $t(
              "You currently don't have a language for Audio and Subtitles set up_ {appName} will fall back to the original title_",
              {
                appName: $shared.appName,
              }
            )
          }}</span>
        </v-alert>

        <!-- TODO: draggable temporarily replaced with div -->
        <div>
          <div v-for="language in $shared.languagesAudioSubtitles" v-bind:key="language.code">
            <v-row style="margin: 8px">
              <v-card style="width: 100%">
                <v-list-item>
                  <v-list-item-title>
                    {{ language.DisplayText }}
                    <v-icon
                      class="mk-clickable-red"
                      size="16"
                      v-on:click="openRemoveLanguageDialog(language, 'languagesAudioSubtitles')"
                      >mdi-delete</v-icon
                    >
                  </v-list-item-title>
                </v-list-item>
              </v-card>
            </v-row>
          </div>
        </div>

        <v-btn
          variant="text"
          size="small"
          color="primary"
          v-on:click="openAddLanguagesDialog('languagesAudioSubtitles')"
          >{{ $t("Add Languages") }}</v-btn
        >
      </v-window-item>

      <!-- TITLE TYPES -->
      <v-window-item value="titletypes" style="padding: 8px">
        <v-card-text class="mk-light-grey">
          <p>
            {{
              $t(
                'In "Regions" you provided the regions to be used for the Primary Title_ However, many titles in IMDB have a special title type_ {appName} skips all special title types by default_ You can add title types here, so that they are actually used instead of being skipped_',
                { appName: $shared.appName }
              )
            }}
          </p>
        </v-card-text>

        <v-alert variant="tonal" border="start" v-if="$shared.imdbTitleTypesWhitelist.length === 0">{{
          $t("No title types added, this is fine_")
        }}</v-alert>

        <mk-title-type
          v-for="item in $shared.imdbTitleTypesWhitelist"
          v-bind:key="item.TitleType"
          v-bind:value="item"
          v-bind:showRemove="true"
          v-on:removeTitleType="openRemoveTitleTypeDialog"
        ></mk-title-type>

        <v-btn
          variant="text"
          size="small"
          color="primary"
          v-on:click="openAddTitleTypeDialog"
          style="margin-top: 16px"
          >{{ $t("Add Title Type") }}</v-btn
        >
      </v-window-item>

      <!-- RELEASE ATTRIBUTES -->
      <v-window-item value="releaseattributes" style="padding: 8px">
        <v-card-text class="mk-light-grey">
          <p>
            {{
              $t(
                "Here you can set up which release attributes should be searched for in the file/directory names and how they should be displayed_"
              )
            }}
          </p>
          <p>
            {{ $t("The search term is case insensitive and must contain whole words within the file/directory name_") }}
          </p>
        </v-card-text>

        <v-data-table
          ref="releaseAttributesTable"
          density="comfortable"
          v-bind:headers="[
            { title: $t('Search Term'), key: 'searchTerm', sortable: false },
            { title: $t('Display As'), key: 'displayAs', sortable: false },
            { title: '', key: 'actions', sortable: false },
            {
              title: '',
              key: 'deleted',
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
            <!-- TODO: draggable temporarily replaced with tbody -->
            <tbody>
              <tr v-for="(item, index) in items" v-bind:key="index" style="height: 40px">
                <td style="padding: 0 16px">{{ item.searchTerm }}</td>
                <td style="padding: 0 16px">{{ item.displayAs }}</td>
                <td>
                  <v-icon size="16" class="mr-2 mk-clickable" @click="onEditReleaseAttribute(item)">mdi-pencil</v-icon>
                  <v-icon size="16" class="mr-2 mk-clickable-red" @click="openRemoveReleaseAttributeDialog(item)"
                    >mdi-delete</v-icon
                  >
                </td>
              </tr>
            </tbody>
          </template>
          <!-- <template v-slot:item.actions="{ item }"> </template> -->
        </v-data-table>
        <v-btn
          v-on:click="onAddReleaseAttribute()"
          variant="text"
          size="small"
          color="primary"
          style="margin-top: 16px"
          >{{ $t("Add") }}</v-btn
        >
      </v-window-item>

      <!-- SCAN HISTORY -->
      <v-window-item value="scanhistory" style="padding: 8px">
        <div style="display: flex">
          <v-spacer></v-spacer>
          <v-btn variant="text" v-on:click="loadScanProcesses" style="margin-right: 8px">
            <v-icon>mdi-refresh</v-icon>
            {{ $t("Reload") }}
          </v-btn>
        </div>
        <v-card-text v-if="scanProcesses.length == 0" class="mk-light-grey">
          <p>
            {{ $t("No previous media scan found_") }}
          </p>
        </v-card-text>

        <canvas v-if="scanProcesses.length > 0" ref="scanHistoryChart" style="margin-bottom: 16px"></canvas>

        <v-card
          v-for="scanProcess in scanProcesses"
          v-bind:key="scanProcess.id_Scan_Processes"
          style="margin-bottom: 4px"
          v-on:click="openScanHistoryItemDialog(scanProcess.id_Scan_Processes)"
        >
          <v-card-text>
            <v-list-item-title style="color: white">
              {{ $t(scanProcess.Scan_Process_Type) }} ({{ getRelativeTimeText(scanProcess.Start) }})
            </v-list-item-title>
            <div class="mk-clickable-lightgrey-white" style="margin-top: 8px">
              <div style="display: flex">
                <div style="margin-right: 4px">
                  <p style="margin-bottom: 4px">{{ $t("Start") }}:</p>
                  <p style="margin-bottom: 4px">{{ $t("End") }}:</p>
                  <p style="margin-bottom: 4px">{{ $t("Duration") }}:</p>
                </div>
                <div>
                  <p style="margin-bottom: 4px">{{ scanProcess.Start }}</p>
                  <p style="margin-bottom: 4px">{{ scanProcess.End }}</p>
                  <p style="margin-bottom: 4px">
                    {{ scanProcess.duration }}
                  </p>
                </div>
              </div>

              <v-divider style="margin-bottom: 4px"></v-divider>

              <p v-for="summaryItem in scanProcess.summary" v-bind:key="summaryItem" style="margin-bottom: 4px">
                {{ summaryItem }}
              </p>
            </div>
          </v-card-text>
        </v-card>
      </v-window-item>
    </v-window>

    <mk-sourcepath-description-dialog
      ref="sourcePathDescriptionDialog"
      v-bind:show="sourcePathDescriptionDialog.show"
      v-bind:title="$t('Edit Description')"
      v-bind:question="
        $t(`Please provide a description for the source path {Path} ({MediaTypeUpper})`, {
          Path: sourcePathDescriptionDialog.Path,
          MediaTypeUpper: sourcePathDescriptionDialog.MediaTypeUpper,
        })
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
        $t(`Do you really want to remove the source path {Path} ({MediaTypeUpper}) including all associated media_`, {
          Path: removeSourcePathDialog.Path,
          MediaTypeUpper: removeSourcePathDialog.MediaTypeUpper,
        })
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
        $t('Do you really want to remove the region {Region}?', {
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
        $t('Do you really want to remove the language {Language}?', {
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
        $t('Do you really want to remove the title type {TitleType}?', {
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
        $t('Do you really want to remove the release attribute {ReleaseAttribute}?', {
          ReleaseAttribute: removeReleaseAttributeDialog.ReleaseAttribute,
        })
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

    <mk-scan-history-item-dialog
      ref="scanHistoryItemDialog"
      v-bind:show="scanHistoryItemDialog.show"
      v-bind:id_Scan_Processes="scanHistoryItemDialog.id_Scan_Processes"
      v-on:close="scanHistoryItemDialog.show = false"
    >
    </mk-scan-history-item-dialog>
  </div>
</template>

<script>
import { dialog, BrowserWindow } from "@electron/remote";
import * as _ from "lodash";
// TODO: vuedraggable is temporarily disabled due to Vue 3.4+ incompatibility
// import draggable from "vuedraggable";
// See: https://github.com/SortableJS/vue.draggable.next/issues/238
import moment from "moment";
import * as Humanize from "humanize-plus";

import {
  Chart,
  BarController,
  LineController,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  TimeScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

Chart.defaults.backgroundColor = "#9BD0F5";
Chart.defaults.borderColor = "rgba(255, 255, 255, 0.12)";
Chart.defaults.color = "#e3e3e3";

import "chartjs-adapter-moment";

Chart.register(
  BarController,
  LineController,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  TimeScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

import logger from "@helpers/logger.js";

import { eventBus } from "@/eventBus.js";
import * as store from "@/store.js";
import SourcePath from "@/components/shared/SourcePath.vue";
import Dialog from "@/components/dialogs/Dialog.vue";
import AddRegionsDialog from "@/components/dialogs/AddRegionsDialog.vue";
import AddLanguagesDialog from "@/components/dialogs/AddLanguagesDialog.vue";
import AddTitleTypeDialog from "@/components/dialogs/AddTitleTypeDialog.vue";
import EditReleaseAttributeDialog from "@/components/dialogs/EditReleaseAttributeDialog.vue";
import ScanHistoryItemDialog from "@/components/dialogs/ScanHistoryItemDialog.vue";
import TitleType from "@/components/shared/TitleType.vue";

import * as helpers from "@helpers/helpers.js";
import { languageCodeNameMapping } from "@/languages.js";

export default {
  components: {
    // draggable, // TODO: temporarily disabled
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
    "mk-scan-history-item-dialog": ScanHistoryItemDialog,
  },

  data: () => ({
    activeTab: "general",

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

    scanProcesses: [],

    scanHistoryItemDialog: {
      show: false,
      id_Scan_Processes: null,
    },

    chartInstance: null,
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

        eventBus.showSnackbar("success", this.$t("Application Language saved_"));
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
      return this.sourcePaths
        .filter((sourcePath) => {
          return sourcePath.MediaType === "series";
        })
        .sort((a, b) => {
          return helpers.compare(a.Description, b.Description, false);
        });
    },

    moviesSourcePaths() {
      return this.sourcePaths
        .filter((sourcePath) => {
          return sourcePath.MediaType === "movies";
        })
        .sort((a, b) => {
          return helpers.compare(a.Description, b.Description, false);
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
    moment() {
      return moment;
    },

    $local_t(key, payload) {
      return this.$t(key, payload);
    },

    async browseMediaplayerPath() {
      const filters = helpers.isWindows
        ? [
            { name: this.$t("Executables"), extensions: ["exe"] },
            { name: this.$t("All Files"), extensions: ["*"] },
          ]
        : [{ name: this.$t("All Files"), extensions: ["*"] }];

      const path = await dialog.showOpenDialog({
        title: this.$t("Path to your media player (e_g_ VLC)"),
        properties: ["openFile"],
        filters,
        defaultPath: this.MediaplayerPath || "",
      });

      logger.log("[browseMediaplayerPath] path:", path);

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
        title: this.$t("Path to mediainfo (get it from mediaarea_net)"),
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

      logger.log("[addSource] folderposition:", folderposition);

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
        return eventBus.showSnackbar("error", this.$t("The chosen path is already in use_"));
      }

      this.sourcePathDescriptionDialog.id_SourcePaths = null;
      this.sourcePathDescriptionDialog.MediaType = MediaType;
      this.sourcePathDescriptionDialog.MediaTypeUpper = MediaType.toUpperCase();
      this.sourcePathDescriptionDialog.Path = chosenPath;
      this.sourcePathDescriptionDialog.Description = null;

      this.$refs.sourcePathDescriptionDialog.initTextValue(helpers.getDirectoryName(chosenPath));

      this.sourcePathDescriptionDialog.show = true;
    },

    async onSourcePathEditPath(sourcePath) {
      logger.log("[onSourcePathEditPath] sourcePath:", sourcePath);

      const folderposition = await dialog.showOpenDialog({
        defaultPath: sourcePath.Path,
        properties: ["openDirectory"],
      });

      if (folderposition.canceled) {
        return;
      }

      logger.log("[onSourcePathEditPath] folderposition:", folderposition);

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
        return eventBus.showSnackbar("error", this.$t("The chosen path is already in use_"));
      }

      try {
        await store.db.fireProcedure(`UPDATE tbl_SourcePaths SET Path = $Path WHERE id_SourcePaths = $id_SourcePaths`, {
          $id_SourcePaths: sourcePath.id_SourcePaths,
          $Path: chosenPath,
        });

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
          this.$t(`The path "{path}" cannot be found_`, {
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
        this.$t(`Media Player path changed to "{path}"_`, {
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
          this.$t(`The path "{path}" cannot be found_`, {
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
        this.$t(`MediaInfo CLI path changed to "{path}"_`, {
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
        logger.log("[fetchSourcePaths] this.sourcePaths:", this.sourcePaths);
      } catch (err) {
        eventBus.showSnackbar("error", err);
      }
    },

    onSourcePathEditDescription(sourcePathItem) {
      this.sourcePathDescriptionDialog.id_SourcePaths = sourcePathItem.id_SourcePaths;
      this.sourcePathDescriptionDialog.Path = sourcePathItem.Path;
      this.sourcePathDescriptionDialog.MediaTypeUpper = sourcePathItem.MediaType.toUpperCase();
      this.sourcePathDescriptionDialog.Description = sourcePathItem.Description;

      this.$refs.sourcePathDescriptionDialog.initTextValue(sourcePathItem.Description);

      this.sourcePathDescriptionDialog.show = true;
    },

    openRemoveSourcePathDialog(sourcePathItem) {
      this.removeSourcePathDialog.id_SourcePaths = sourcePathItem.id_SourcePaths;
      this.removeSourcePathDialog.Path = sourcePathItem.Path;
      this.removeSourcePathDialog.MediaTypeUpper = sourcePathItem.MediaType.toUpperCase();

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

          await store.db.fireProcedure(`DELETE FROM tbl_SourcePaths WHERE id_SourcePaths = $id_SourcePaths`, {
            $id_SourcePaths: this.removeSourcePathDialog.id_SourcePaths,
          });

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
              MediaTypeUpper: this.$t(this.sourcePathDescriptionDialog.MediaTypeUpper),
            })
          );
        } catch (err) {
          eventBus.showSnackbar("error", err);
        }
      })();
    },

    updateMinimumWaitForSetAccess: function () {
      logger.log("[updateMinimumWaitForSetAccess] setting:", this.minimumWaitForSetAccess);
      store.setSetting("minimumWaitForSetAccess", this.minimumWaitForSetAccess);
    },

    duplicatesHandlingChanged() {
      logger.log("[duplicatesHandlingChanged] $shared.duplicatesHandling:", this.$shared.duplicatesHandling);
      store.setSetting("duplicatesHandling", JSON.stringify(this.$shared.duplicatesHandling));
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

      await store.setSetting(this.addLanguagesDialog.languageType, JSON.stringify(languages));

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
        JSON.stringify(this.$refs.releaseAttributesTable._data.internalCurrentItems)
      );

      this.$shared.releaseAttributes.forEach((ra) => {
        if (!releaseAttributes.find((ra2) => ra2.searchTerm === ra.searchTerm && ra2.displayAs === ra.displayAs)) {
          releaseAttributes.push(ra);
        }
      });

      this.$shared.releaseAttributes = releaseAttributes;

      await store.setSetting("ReleaseAttributes", JSON.stringify(releaseAttributes));
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
      this.removeLanguage(this.removeLanguageDialog.item, this.removeLanguageDialog.type);
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

      await store.setSetting("IMDBTitleTypeWhitelist", JSON.stringify(this.$shared.imdbTitleTypesWhitelist));

      eventBus.showSnackbar(
        "success",
        this.$t(`Title Type "{TitleType}" added_`, {
          TitleType: titleType.TitleType,
        })
      );
    },

    openRemoveTitleTypeDialog(titleType) {
      logger.log("[openRemoveTitleTypeDialog] titleType:", titleType);

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
        this.$shared.imdbTitleTypesWhitelist.findIndex((item) => item.TitleType === titleType.TitleType),
        1
      );

      await store.setSetting("IMDBTitleTypeWhitelist", JSON.stringify(this.$shared.imdbTitleTypesWhitelist));

      eventBus.showSnackbar(
        "success",
        this.$t(`Title Type "{TitleType}" removed_`, {
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
      this.$refs.editReleaseAttributeDialog.init(item.searchTerm, item.displayAs);
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
          foundItem = this.$shared.releaseAttributes.find((item2) => item2.searchTerm === searchTerm && item2.deleted);
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

        await store.setSetting("ReleaseAttributes", JSON.stringify(this.$shared.releaseAttributes));

        eventBus.showSnackbar("success", this.$t("Release Attribute saved successfully_"));
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

        await store.setSetting("ReleaseAttributes", JSON.stringify(this.$shared.releaseAttributes));

        // HACK: update view
        const temp = this.$shared.releaseAttributes;
        this.$shared.releaseAttributes = null;
        this.$shared.releaseAttributes = temp;

        eventBus.showSnackbar("success", this.$t("Release Attribute removed successfully_"));
      } catch (e) {
        eventBus.showSnackbar("error", e);
      }
    },

    releaseAttributesFilter(value /*, search, item*/) {
      return !value;
    },

    async loadScanProcesses() {
      this.scanProcesses = await store.getScanProcesses(this.$local_t);
      logger.log("[loadScanProcesses] this.scanProcesses:", this.scanProcesses);

      requestAnimationFrame(() => {
        this.renderScanHistoryChart();
      });
    },

    openScanHistoryItemDialog(id_Scan_Processes) {
      this.scanHistoryItemDialog.id_Scan_Processes = id_Scan_Processes;
      this.scanHistoryItemDialog.show = true;
    },

    getRelativeTimeText(start) {
      return moment(start).fromNow();
    },

    renderScanHistoryChart() {
      const ctx = this.$refs.scanHistoryChart.getContext("2d");

      const scanProcessesReverseOrder = this.scanProcesses.slice().reverse();

      if (this.chartInstance) {
        this.chartInstance.destroy();
      }

      this.chartInstance = new Chart(ctx, {
        type: "line", // global default; each dataset specifies its type if needed
        data: {
          labels: scanProcessesReverseOrder.map((scan) => scan.End),
          datasets: [
            {
              // TV Series as a stacked area chart
              label: this.$t("Series"),
              type: "line",
              data: scanProcessesReverseOrder.map((scan) => scan.Size_After_Series || 0),
              cubicInterpolationMode: "monotone",
              borderColor: "rgba(255, 159, 64, 1)",
              backgroundColor: "rgba(255, 159, 64, 0.4)",
              //fill: true,
              fill: "origin",
              stack: "stack1",
              stacked: true,
              stepped: true,
            },
            {
              // Movies as a stacked area chart
              label: this.$t("Movies"),
              type: "line",
              data: scanProcessesReverseOrder.map((scan) => scan.Size_After_Movies || 0),
              cubicInterpolationMode: "monotone",
              borderColor: "rgba(75, 192, 192, 1)",
              backgroundColor: "rgba(75, 192, 192, 0.4)",
              fill: true,
              // fill: 1,
              stack: "stack1",
              stacked: true,
              stepped: true,
            },
            {
              // Total Size is shown as a regular line (not filled)
              label: this.$t("Total Size"),
              type: "line",
              data: scanProcessesReverseOrder.map((scan) => scan.Size_After_Total || 0),
              cubicInterpolationMode: "monotone",
              borderColor: "rgba(54, 162, 235, 1)",
              backgroundColor: "transparent",
              fill: false,
              // Do not assign a stack here so it’s drawn on top
              stepped: true,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            tooltip: {
              callbacks: {
                label: function (context) {
                  let label = context.dataset.label || "";
                  if (label) {
                    label += ": ";
                  }
                  if (context.parsed.y !== null) {
                    label += Humanize.filesize(context.parsed.y);
                  }
                  return label;
                },
              },
            },
            filler: {
              propagate: true,
            },
          },
          interaction: {
            mode: "nearest",
            axis: "x",
            intersect: false,
          },

          scales: {
            x: {
              type: "time",
              time: {
                parser: "YYYY-MM-DD HH:mm:ss",
                tooltipFormat: "YYYY-MM-DD HH:mm:ss",
                unit: "day",
                displayFormats: { day: "YYYY-MM-DD" },
              },
              distribution: "linear",
              min: scanProcessesReverseOrder[0].Start,
              max:
                scanProcessesReverseOrder[scanProcessesReverseOrder.length - 1].End !== "<unknown>"
                  ? scanProcessesReverseOrder[scanProcessesReverseOrder.length - 1].End
                  : scanProcessesReverseOrder[scanProcessesReverseOrder.length - 1].Start,
            },
            y: {
              beginAtZero: true,
              stacked: true, // Enables stacking of area fills for movies and series
              ticks: {
                callback: function (value) {
                  return Humanize.filesize(value);
                },
              },
            },
          },
        },
      });
    },
  },

  // ### LifeCycle Hooks ###
  async created() {
    //logger.group("[Initialize Settings]");
    this.$shared.imdbRatingDemographics.forEach((demographic) => {
      demographic.long_translated = this.$t(`RatingDemographics.${demographic.long}`);
    });

    logger.log("[created] Settings this.$shared.imdbRatingDemographics:", this.$shared.imdbRatingDemographics);

    await this.fetchSourcePaths();

    const regions = await store.getSetting("regions");

    if (regions) {
      this.$shared.regions = JSON.parse(regions);

      this.$shared.regions.forEach((item) => {
        item.nameTranslated = this.$t(`RegionNames.${item.name.replace(/\./g, "_")}`);
      });
    }

    // await store.fetchLanguageSettings();

    logger.log("[created] Settings this.$shared.regions:", this.$shared.regions);

    const imdbTitleTypesWhitelist = await store.getSetting("IMDBTitleTypeWhitelist");
    if (imdbTitleTypesWhitelist) {
      this.$shared.imdbTitleTypesWhitelist = JSON.parse(imdbTitleTypesWhitelist);
    }

    this.MediaplayerPath = await store.getSetting("MediaplayerPath");
    this.MediainfoPath = await store.getSetting("MediainfoPath");
    this.minimumWaitForSetAccess = await store.getMinimumWaitForSetAccess();

    // translate language names
    if (this.$shared.languagesPrimaryTitle) {
      this.$shared.languagesPrimaryTitle.forEach((item) => {
        item.nameTranslated = this.$t(`LanguageNames.${item.name.replace(/\./g, "_")}`);
        item.DisplayText = `${item.nameTranslated} (${item.code})`;
      });
    }
    if (this.$shared.languagesAudioSubtitles) {
      this.$shared.languagesAudioSubtitles.forEach((item) => {
        item.nameTranslated = this.$t(`LanguageNames.${item.name.replace(/\./g, "_")}`);
        item.DisplayText = `${item.nameTranslated} (${item.code})`;
      });
    }

    this.availableLanguages = this.$i18n.availableLocales.map((locale) => {
      return {
        code: locale,
        name: this.$i18n.getLocaleMessage(locale).LanguageNames[
          languageCodeNameMapping[helpers.uppercaseEachWord(locale)]
        ],
      };
    });

    logger.log("[created] Settings this.availableLanguages:", this.availableLanguages);

    logger.log("[created] Settings this.$shared.releaseAttributes:", this.$shared.releaseAttributes);

    // lodash debounced functions
    this.debouncedUpdateMinimumWaitForSetAccess = _.debounce(this.updateMinimumWaitForSetAccess, 500);

    //logger.groupEnd();
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
