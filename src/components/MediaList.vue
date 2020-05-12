<template>
  <div style="display: flex; flex-direction: column; width: 100%" ref="mainContainer">
    <v-row
      style="margin-bottom: 0px; margin-top: 0px; margin-right: 0px; margin-left: 0px; padding-bottom: 8px; padding-top: 8px; position: fixed; width: 100%!important; z-index: 10; background: rgb(48, 48, 48);"
    >
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <span v-on="on">
            <v-btn
              text
              v-on:click="$router.go(-1)"
              style="padding: 0px; margin-top: 6px; margin-left: 0px"
            >
              <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
          </span>
        </template>
        <span>Go back</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <span v-on="on">
            <v-btn
              text
              v-on:click="onReload"
              style="padding: 0px; margin-top: 6px; margin-left: 0px"
            >
              <v-icon>mdi-reload</v-icon>
            </v-btn>
          </span>
        </template>
        <span>Reload list</span>
      </v-tooltip>
      <h1 style="margin-bottom: 0px; margin-top: 0px;">
        {{ mediatype.toUpperCase() }} ({{ itemsFiltered.length }})
        <v-tooltip bottom v-if="filtersList.length > 0">
          <template v-slot:activator="{ on }">
            <span v-on="on">*</span>
          </template>
          <span>
            Applied Filters:
            <ul>
              <li v-for="filter in filtersList" v-bind:key="filter">{{filter}}</li>
            </ul>
          </span>
        </v-tooltip>
      </h1>
      <v-select
        solo
        clearable
        dense
        v-bind:items="sortAbles"
        item-text="Description"
        item-value="Field"
        v-model="$shared.sortField"
        label="Sort"
        style="margin-left: 8px; max-width: 260px; height: 40px"
        v-on:change="onSortChanged"
      >
        <template v-slot:selection="{ item }">
          <span class="grey--text caption" style="margin-right: 8px">Sort by</span>
          <span>{{ item.Description }}</span>
        </template>
      </v-select>

      <v-spacer></v-spacer>

      <div v-if="numPages">
        <!-- <v-pagination v-bind:length="numPages" v-model="$shared.currentPage" total-visible="7"></v-pagination> -->

        <mk-pagination
          v-bind:length="numPages"
          v-bind:pages="paginationItems"
          v-model="$shared.currentPage"
        ></mk-pagination>
      </div>

      <!-- workaround - else the mk-pagination would fuck off to the right when sidenav is shown -->
      <div
        v-if="$shared.sidenav"
        v-bind:style="{ width: `${$shared.sidenav ? '256px!important' : '0px!important'}` }"
      ></div>
    </v-row>

    <!-- scrollcontainer -->
    <v-container class="pa-2" style="max-width: 100%!important; margin-top: 48px;">
      <v-row v-for="(item, i) in itemsFilteredPaginated" :key="i">
        <v-col>
          <v-card dark flat hover v-bind:ripple="false" v-on:click="selectItem(item)">
            <v-list-item three-line style="padding-left: 0px">
              <div
                v-on:mouseover="setItemHovered(item, 'avatar', true)"
                v-on:mouseleave="setItemHovered(item, 'avatar', false)"
              >
                <v-list-item-avatar
                  tile
                  style="margin: 6px; height: 180px; width: 120px"
                  v-on:click.stop="launch(item)"
                >
                  <img
                    v-show="item.avatarHovered"
                    style="height: 150px; width: 120px; position: absolute; z-index: 1; opacity: 0.5"
                    src="data:image/png;base64,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"
                  />

                  <v-img
                    contain
                    v-if="item.IMDB_posterSmall_URL"
                    v-bind:src="item.IMDB_posterSmall_URL"
                    style="border-radius: 6px;"
                  ></v-img>

                  <div class="duration-overlay-container" v-if="item.Duration">
                    <span class="duration-overlay">{{ item.Duration }}</span>
                  </div>
                </v-list-item-avatar>
              </div>
              <v-list-item-content
                class="align-self-start"
                style="padding-top: 6px; padding-bottom: 6px"
              >
                <v-col style="padding: 0px!important">
                  <v-row>
                    <div style="margin-left: 16px">
                      <v-list-item-title
                        class="headline mb-2"
                        style="margin-bottom: 0px!important"
                        v-on:mouseover="setItemHovered(item, 'name', true)"
                        v-on:mouseleave="setItemHovered(item, 'name', false)"
                      >
                        {{ item.Name }} {{ item.yearDisplay }}
                        <span
                          v-show="item.NumExtras"
                        >+{{ item.NumExtras }}</span>

                        <v-tooltip bottom>
                          <template v-slot:activator="{ on }">
                            <span v-on="on">
                              <v-icon
                                v-show="item.nameHovered || item.selected"
                                style="cursor: pointer"
                                v-on:click.stop="onEditItem(item, 'Name', 'Title')"
                              >mdi-pencil</v-icon>
                            </span>
                          </template>
                          <span>Edit Primary Title</span>
                        </v-tooltip>

                        <v-tooltip bottom>
                          <template v-slot:activator="{ on }">
                            <span v-on="on">
                              <v-icon
                                v-show="item.nameHovered || item.selected"
                                style="cursor: pointer"
                                v-on:click.stop="onOpenLinkIMDBDialog(item)"
                              >mdi-link</v-icon>
                            </span>
                          </template>
                          <span>Link with IMDB entry</span>
                        </v-tooltip>
                      </v-list-item-title>

                      <v-list-item-subtitle
                        style="margin-bottom: 4px; min-height: 18px"
                        v-on:mouseover="setItemHovered(item, 'name2', true)"
                        v-on:mouseleave="setItemHovered(item, 'name2', false)"
                      >
                        <!-- v-if="item.Name2 || item.selected" -->
                        {{ item.Name2 }}
                        <v-tooltip bottom>
                          <template v-slot:activator="{ on }">
                            <span v-on="on">
                              <v-icon
                                v-show="item.name2Hovered || item.selected"
                                small
                                style="cursor: pointer"
                                v-on:click.stop="onEditItem(item, 'Name2', 'Secondary Title')"
                              >mdi-pencil</v-icon>
                            </span>
                          </template>
                          <span>Edit Secondary Title</span>
                        </v-tooltip>

                        <!-- <v-icon
                          v-show="item.name2Hovered"
                          small
                          style="cursor: pointer"
                          v-on:click.stop="onEditItem(item, 'Name2', 'Secondary Title')"
                        >mdi-pencil</v-icon>-->
                      </v-list-item-subtitle>

                      <div style="font-size: .875rem; font-weight: normal">
                        <span v-if="item.MI_Quality">{{ item.MI_Quality + ' | ' }}</span>
                        <span v-if="item.AgeRating">{{ item.AgeRating + ' | ' }}</span>
                        <span v-if="item.Genres">{{ item.Genres + ' | ' }}</span>
                        <span v-if="item.AudioLanguages">
                          <v-icon small>mdi-comment-outline</v-icon>
                          {{ item.AudioLanguages + (item.SubtitleLanguages ? ' | ' : '') }}
                        </span>
                        <span v-if="item.SubtitleLanguages">
                          <v-icon small>mdi-subtitles-outline</v-icon>
                          {{ item.SubtitleLanguages }}
                        </span>
                      </div>
                    </div>
                    <div class="flex-grow-1"></div>
                    <div>
                      <div
                        class="headline mb-2"
                        style="margin-right: 16px; margin-left: 16px; margin-bottom: 0px!important"
                        v-if="item.IMDB_rating_defaultDisplay"
                      >
                        <v-icon small color="amber" style="padding-bottom: 4px">mdi-star</v-icon>
                        <a class="headline mb-2 Clickable" v-on:click.stop="onShowRatingDemographicsDialog(item)">{{item.IMDB_rating_defaultDisplay}}</a>
                        <span
                          v-if="item.IMDB_metacriticScore"
                          v-bind:class="getMetaCriticClass(item.IMDB_metacriticScore)"
                          style="padding: 4px; margin-left: 4px"
                        >{{item.IMDB_metacriticScore}}</span>
                      </div>
                      <v-row>
                        <div class="flex-grow-1"></div>
                        <div style="margin-right: 26px; padding: 0px!important">
                          <v-icon
                            small
                            v-for="i in 5"
                            v-bind:key="i"
                            v-bind:color="(item.Rating > (i - 1) ? 'amber' : (item.Rating > 0 ? 'white' : 'grey'))"
                            v-on:click.stop="changeRating(item, i)"
                          >mdi-star</v-icon>
                        </div>
                      </v-row>
                    </div>
                  </v-row>

                  <v-row
                    v-if="item.IMDB_plotSummary"
                    style="margin-left: 4px; margin-right: 6px; margin-bottom: 8px"
                  >
                    <div
                      v-show="!item.selected"
                      style="font-size: .875rem; font-weight: normal"
                    >{{ item.IMDB_plotSummary }}</div>
                    <div
                      v-show="item.selected"
                      style="font-size: .875rem; font-weight: normal"
                    >{{ item.IMDB_plotSummaryFull || item.IMDB_plotSummary }}</div>
                  </v-row>

                  <v-row
                    v-if="item.IMDB_Top_Directors"
                    style="margin-left: 4px; margin-right: 6px; margin-bottom: 8px"
                  >
                    <div style="font-size: .875rem; font-weight: normal">
                      <strong class="CreditCategory">Directed by:</strong>
                      <span
                        v-for="(credit, i) in item.IMDB_Top_Directors"
                        v-bind:key="credit.IMDB_Person_ID"
                      >
                        <span v-if="i > 0">,&nbsp;</span>
                        <a
                          class="Clickable"
                          v-on:click.stop="onCreditClicked(credit)"
                        >{{ credit.name }}</a>
                      </span>
                    </div>
                  </v-row>

                  <v-row
                    v-if="item.IMDB_Top_Writers"
                    style="margin-left: 4px; margin-right: 6px; margin-bottom: 8px"
                  >
                    <div style="font-size: .875rem; font-weight: normal">
                      <strong class="CreditCategory">Written by:</strong>
                      <span
                        v-for="(credit, i) in item.IMDB_Top_Writers"
                        v-bind:key="credit.IMDB_Person_ID"
                      >
                        <span v-if="i > 0">,&nbsp;</span>
                        <a
                          class="Clickable"
                          v-on:click.stop="onCreditClicked(credit)"
                        >{{ credit.name }}</a>
                      </span>
                    </div>
                  </v-row>

                  <!-- <v-row
                    v-if="item.IMDB_Top_Producers"
                    style="margin-left: 4px; margin-right: 6px; margin-bottom: 8px"
                  >
                    <div style="font-size: .875rem; font-weight: normal">
                      <strong class="CreditCategory">Produced by:</strong>
                      <span
                        v-for="(credit, i) in item.IMDB_Top_Producers"
                        v-bind:key="credit.IMDB_Person_ID"
                      >
                        <span v-if="i > 0">,&nbsp;</span>
                        <a
                          class="Clickable"
                          v-on:click.stop="onCreditClicked(credit)"
                        >{{ credit.name }}</a>
                      </span>
                    </div>
                  </v-row>-->

                  <v-row
                    v-if="item.IMDB_Top_Cast"
                    style="margin-left: 4px; margin-right: 6px; margin-bottom: 8px"
                  >
                    <div style="font-size: .875rem; font-weight: normal">
                      <strong class="CreditCategory">Cast:</strong>
                      <span
                        v-for="(credit, i) in item.IMDB_Top_Cast"
                        v-bind:key="credit.IMDB_Person_ID"
                      >
                        <span v-if="i > 0">,&nbsp;</span>
                        <a
                          class="Clickable"
                          v-on:click.stop="onCreditClicked(credit)"
                        >{{ credit.name }}</a>
                      </span>
                    </div>
                  </v-row>

                  <v-row
                    v-if="item.IMDB_Top_Production_Companies"
                    style="margin-left: 4px; margin-right: 6px; margin-bottom: 8px"
                  >
                    <div style="font-size: .875rem; font-weight: normal">
                      <strong class="CreditCategory">Production:</strong>
                      <span
                        v-for="(company, i) in item.IMDB_Top_Production_Companies"
                        v-bind:key="i"
                      >
                        <span v-if="i > 0">,&nbsp;</span>
                        <a
                          class="Clickable"
                          v-on:click.stop="onCompanyClicked(company)"
                        >{{ company.name }}</a>
                      </span>
                    </div>
                  </v-row>
                </v-col>
              </v-list-item-content>
            </v-list-item>
            <v-col v-if="item.selected" style="min-width: 100%">
              <v-row>
                <v-col class="detailLabel">Full Path:</v-col>
                <v-col class="detailContent">{{ item.Path }}</v-col>
              </v-row>
              <v-row>
                <v-col class="detailLabel">Imported:</v-col>
                <v-col class="detailContent">
                  <v-tooltip right>
                    <template v-slot:activator="{ on }">
                      <span v-on="on">{{ createdHumanized(item) }}</span>
                    </template>
                    <span>{{ createdDisplayText(item) }}</span>
                  </v-tooltip>
                </v-col>
              </v-row>
              <v-row>
                <v-col class="detailLabel">Last Access:</v-col>
                <v-col class="detailContent">
                  <v-tooltip right>
                    <template v-slot:activator="{ on }">
                      <span v-on="on">{{ lastAccessHumanized(item) }}</span>
                    </template>
                    <span>{{ lastAccessDisplayText(item) }}</span>
                  </v-tooltip>
                </v-col>
              </v-row>
              <v-row>
                <v-col class="detailLabel">Size:</v-col>
                <v-col v-if="item.Size" class="detailContent">{{ Humanize().fileSize(item.Size) }}</v-col>
              </v-row>
              <v-row>
                <v-col class="detailLabel">File Created at:</v-col>
                <v-col
                  v-if="item.file_created_at"
                  class="detailContent"
                >{{ moment().utc(parseInt(item.file_created_at)).local().format("YYYY-MM-DD HH:mm:ss") }}</v-col>
              </v-row>

              <v-row>
                <v-col class="detailLabel">In Lists:</v-col>
                <v-col class="detailContent">
                  <span v-if="item.lists && item.lists.length > 0">
                    <span v-for="(list, index) in item.lists" v-bind:key="index">
                      <span v-if="index > 0">,&nbsp;</span>
                      <span>{{list.Name}}</span>
                    </span>
                  </span>
                  <span v-if="!item.lists || item.lists.length === 0">&lt;not in any list&gt;</span>
                  <v-btn text small color="primary" v-on:click.stop="addToList(item)">Add</v-btn>
                  <v-btn
                    v-if="item.lists && item.lists.length > 0"
                    text
                    small
                    color="primary"
                    v-on:click.stop="removeFromList(item)"
                  >Remove</v-btn>
                </v-col>
              </v-row>

              <!-- Extras -->
              <div v-if="item.NumExtras">
                <v-row style="padding-left: 16px; padding-top: 4px; align-items: flex-end;">
                  <span style="font-size: 20px">Extras&nbsp;</span>
                </v-row>

                <v-row
                  v-for="extra in item.extras"
                  v-bind:key="extra.Path"
                  class="Clickable"
                  style="padding-left: 24px; padding-top: 4px; align-items: flex-end;"
                  v-on:click.stop="launch(extra)"
                >{{ extra.Name }}</v-row>
              </div>

              <!-- FULL CREDITS -->
              <v-row
                style="padding-left: 16px; padding-top: 4px; align-items: flex-end;"
                class="Clickable"
                v-on:click.stop="showCredits(item, !item.showCredits)"
              >
                <span style="font-size: 20px">Credits&nbsp;</span>
              </v-row>

              <div v-if="item.showCredits" v-on:click.stop="showCredits(item, false)">
                <div
                  v-for="creditCategory in item.credits"
                  v-bind:key="creditCategory.Category"
                  style="margin-left: 24px"
                >
                  <v-row>
                    <strong>{{ creditCategory.category }}</strong>
                  </v-row>
                  <v-row
                    v-for="credit in creditCategory.items"
                    v-bind:key="credit.id_Movies_IMDB_Credits"
                  >
                    <v-col sm="4" class="creditsLabel">
                      <a
                        class="Clickable"
                        v-on:click.stop="onCreditClicked(credit)"
                      >{{ credit.name }}</a>
                    </v-col>
                    <v-col sm="1" class="creditsContent">
                      <span v-if="credit.credit">...</span>
                    </v-col>
                    <v-col class="creditsContent">{{ credit.credit }}</v-col>
                  </v-row>
                </div>
              </div>

              <!-- COMPANIES -->
              <v-row
                style="padding-left: 16px; padding-top: 4px; align-items: flex-end;"
                class="Clickable"
                v-on:click.stop="showCompanies(item, !item.showCompanies)"
              >
                <span style="font-size: 20px">Companies&nbsp;</span>
              </v-row>

              <div v-if="item.showCompanies" v-on:click.stop="showCompanies(item, false)">
                <div
                  v-for="companyCategory in item.companies"
                  v-bind:key="companyCategory.Category"
                  style="margin-left: 24px"
                >
                  <v-row>
                    <strong>{{ companyCategory.category }}</strong>
                  </v-row>
                  <v-row
                    v-for="company in companyCategory.items"
                    v-bind:key="company.id_Movies_IMDB_Credits"
                  >
                    <v-col sm="4" class="creditsLabel">
                      <a
                        class="Clickable"
                        v-on:click.stop="onCompanyClicked(company)"
                      >{{ company.name }}</a>
                    </v-col>
                    <v-col sm="1" class="creditsContent">
                      <!-- <span v-if="company.role">...</span> -->
                    </v-col>
                    <v-col class="creditsContent">{{ company.role }}</v-col>
                  </v-row>
                </div>
              </div>

              <!-- CONTENT ADVISORY -->
              <v-row
                style="padding-left: 16px; padding-top: 4px; align-items: flex-end;"
                class="Clickable"
                v-on:click.stop="showContentAdvisory(item, !item.showContentAdvisory)"
              >
                <span style="font-size: 20px">Content Advisory&nbsp;</span>
              </v-row>

              <div
                style="margin-left: 24px;"
                v-if="item.showContentAdvisory"
                v-on:click.stop="showContentAdvisory(item, false)"
              >
                <v-row
                  v-for="category in $shared.contentAdvisoryCategories"
                  v-bind:key="category.Name"
                >
                  <v-col sm="4" class="creditsLabel">{{ category.DisplayText }}</v-col>
                  <v-col sm="1" class="creditsContent">
                    <!-- <span v-if="company.role">...</span> -->
                  </v-col>
                  <v-col
                    class="creditsContent"
                  >{{ contentAdvisorySeverityDisplayText(item[`IMDB_Parental_Advisory_${category.Name}`]) }}</v-col>
                </v-row>
              </div>

              <!-- PLOT KEYWORDS -->
              <v-row
                style="padding-left: 16px; padding-top: 4px; align-items: flex-end;"
                class="Clickable"
                v-on:click.stop="showPlotKeywords(item, !item.showPlotKeywords)"
              >
                <span style="font-size: 20px">Plot Keywords (Spoilers ahead!)&nbsp;</span>
              </v-row>

              <div
                style="margin-left: 24px;"
                v-if="item.showPlotKeywords"
                v-on:click.stop="showPlotKeywords(item, false)"
              >
                <v-row v-for="plotKeyword in item.plotKeywords" v-bind:key="plotKeyword.Keyword">
                  <a
                    class="Clickable"
                    v-on:click.stop="onIMDBPlotKeywordClicked(plotKeyword)"
                  >{{ plotKeyword.Keyword }}</a>

                  <!-- <v-col sm="4" class="creditsLabel">{{ plotKeyword.Keyword }}</v-col>
                  <v-col
                    class="creditsContent"
                  >{{ `${plotKeyword.NumVotes ? plotKeyword.NumRelevant + ' of ' + plotKeyword.NumVotes : 'no votes'}` }}</v-col>-->
                </v-row>
              </div>

              <!-- FILMING LOCATIONS -->
              <v-row
                style="padding-left: 16px; padding-top: 4px; align-items: flex-end;"
                class="Clickable"
                v-on:click.stop="showFilmingLocations(item, !item.showFilmingLocations)"
              >
                <span style="font-size: 20px">Filming Locations&nbsp;</span>
              </v-row>

              <div
                style="margin-left: 24px;"
                v-if="item.showFilmingLocations"
                v-on:click.stop="showFilmingLocations(item, false)"
              >
                <v-row v-for="filmingLocation in item.filmingLocations" v-bind:key="filmingLocation.id_IMDB_Filming_Locations">
                  <a
                    class="Clickable"
                    v-on:click.stop="onIMDBFilmingLocationClicked(filmingLocation)"
                  >{{ filmingLocation.Location }}</a>
                </v-row>
              </div>

              <v-row style="margin-top: 8px">
                <v-btn text color="primary" v-on:click.stop="copyInfo(item)">Copy Info</v-btn>
                <v-btn
                  v-if="item.IMDB_Trailer_URL"
                  text
                  color="primary"
                  v-on:click.stop="showTrailerLocal(item)"
                >Trailer</v-btn>
                <v-btn text color="primary" v-on:click.stop="openIMDB(item)">Open IMDB</v-btn>
              </v-row>
            </v-col>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-spacer></v-spacer>
        <div v-if="numPages">
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

    <mk-edit-item-dialog
      ref="editItemNameDialog"
      v-bind:show="editItemDialog.show"
      v-bind:title="editItemDialog.title"
      enterTextValue="true"
      ok="OK"
      cancel="Cancel"
      cancelColor="secondary"
      v-on:ok="onEditItemDialogOK"
      v-on:cancel="onEditItemDialogCancel"
    ></mk-edit-item-dialog>

    <mk-search-imdb-dialog
      ref="linkIMDBDialog"
      v-bind:show="linkIMDBDialog.show"
      v-on:close="onLinkIMDBDialogClose"
      v-on:selected="onLinkIMDBDialogSelected"
    ></mk-search-imdb-dialog>

    <mk-rating-demographics-dialog
      ref="ratingDemographicsDialog"
      v-bind:show="ratingDemographicsDialog.show"
      v-bind:title="ratingDemographicsDialog.title"
      v-on:close="ratingDemographicsDialog.show = false"
    ></mk-rating-demographics-dialog>
  </div>
</template>

<script>
import * as Humanize from "humanize-plus";

import * as store from "@/store";
import { eventBus } from "@/main";
import { scrapeIMDBTrailerMediaURLs } from "@/imdb-scraper";
import Dialog from "@/components/shared/Dialog.vue";
import ListDialog from "@/components/shared/ListDialog.vue";
import PersonDialog from "@/components/shared/PersonDialog.vue";
import CompanyDialog from "@/components/shared/CompanyDialog.vue";
import PlotKeywordDialog from "@/components/shared/PlotKeywordDialog.vue";
import FilmingLocationDialog from "@/components/shared/FilmingLocationDialog.vue";
import VideoPlayerDialog from "@/components/shared/VideoPlayerDialog.vue";
import LocalVideoPlayerDialog from "@/components/shared/LocalVideoPlayerDialog.vue";
import LinkIMDBDialog from "@/components/shared/LinkIMDBDialog.vue";
import Pagination from "@/components/shared/Pagination.vue";
import RatingDemographicsDialog from "@/components/shared/RatingDemographicsDialog"

const { shell } = require("electron").remote;

const moment = require("moment");

// import * as helpers from "@/helpers/helpers";

const logger = require("loglevel");

export default {
  components: {
    "mk-list-dialog": ListDialog,
    "mk-person-dialog": PersonDialog,
    "mk-company-dialog": CompanyDialog,
    "mk-plot-keyword-dialog": PlotKeywordDialog,
    "mk-filming-location-dialog": FilmingLocationDialog,
    "mk-video-player-dialog": VideoPlayerDialog,
    "mk-local-video-player-dialog": LocalVideoPlayerDialog,
    "mk-edit-item-dialog": Dialog,
    "mk-search-imdb-dialog": LinkIMDBDialog,
    "mk-pagination": Pagination,
    "mk-rating-demographics-dialog": RatingDemographicsDialog
  },

  data: () => ({
    items: [],
    sortAbles: [
      {
        Field: "Name",
        Description: "Name"
      },
      {
        Field: "IMDB_rating_default",
        Description: "IMDB Rating"
      },
      {
        Field: "IMDB_metacriticScore",
        Description: "Metascore"
      },
      {
        Field: "Rating",
        Description: "My Rating"
      },
      {
        Field: "startYear",
        Description: "Year"
      },
      {
        Field: "created_at",
        Description: "Imported at"
      },
      {
        Field: "last_access_at",
        Description: "Last Access at"
      }
    ],

    listDialog: {
      mode: "add",
      title: "",
      show: false,
      movie: null,
      lists: [],
      allowUseExistingLists: false,
      allowCreateNewList: false
    },

    personDialog: {
      show: false,
      IMDB_Person_ID: null,
      Person_Name: null
    },

    companyDialog: {
      show: false,
      IMDB_Company_ID: null,
      Company_Name: null
    },

    plotKeywordDialog: {
      show: false,
      id_IMDB_Plot_Keywords: null,
      Keyword: null
    },

    filmingLocationDialog: {
      show: false,
      id_IMDB_Filming_Locations: null,
      Location: null
    },

    videoPlayerDialog: {
      show: false,
      videoURL: null
    },

    localVideoPlayerDialog: {
      instantiated: false,
      show: false,
      videoURL: null,
      slateURL: null,
      mimeType: null
    },

    editItemDialog: {
      show: false,
      title: null,
      item: {},
      attributeName: null,
      attributeDisplayText: null
    },

    linkIMDBDialog: {
      show: false,
      item: {}
    },

    ratingDemographicsDialog: {
      show: false,
      title: null,
    },

    itemsPerPage: 20,

    currentTime: moment()
  }),

  watch: {
    currentPage(newValue, oldValue) {
      logger.log(
        "watch currentPage: newValue:",
        newValue,
        "oldValue:",
        oldValue
      );

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
    }
  },

  props: ["mediatype"],

  computed: {
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
            detailInfo = currentItem.created_at
              ? currentItem.created_at.replace(/\d+:\d+:\d+/, "")
              : "";
            break;
          case "last_access_at":
            detailInfo = currentItem.last_access_at
              ? currentItem.last_access_at.replace(/\d+:\d+:\d+/, "")
              : "";
            break;
        }

        result.push({
          page,
          displayText: `${page} / ${this.numPages}${
            detailInfo ? " | " + detailInfo : ""
          }`,
          numPages: this.numPages,
          detailInfo
        });

        page++;
      }

      logger.log("paginationItems:", result);

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
        filtersList.push("Search");
      }
      if (this.$shared.filterSourcePaths.find(filter => !filter.Selected)) {
        filtersList.push("Source Paths");
      }
      if (
        this.$shared.filterGenres &&
        ((!this.$shared.filterSettings.filterGenresAND &&
          this.$shared.filterGenres.find(filter => !filter.Selected)) ||
          (this.$shared.filterSettings.filterGenresAND &&
            this.$shared.filterGenres.find(filter => filter.Selected)))
      ) {
        filtersList.push(
          `Genres${this.$shared.filterSettings.filterGenresAND ? " ߷" : ""}`
        );
      }
      if (this.$shared.filterAgeRatings.find(filter => !filter.Selected)) {
        filtersList.push("Ages");
      }
      if (this.$shared.filterRatings.find(filter => !filter.Selected)) {
        filtersList.push("My Ratings");
      }
      if (this.$shared.filterLists.find(filter => !filter.Selected)) {
        filtersList.push("My Lists");
      }

      if (
        this.$shared.filterParentalAdvisory.Nudity.find(
          filter => !filter.Selected
        ) ||
        this.$shared.filterParentalAdvisory.Violence.find(
          filter => !filter.Selected
        ) ||
        this.$shared.filterParentalAdvisory.Profanity.find(
          filter => !filter.Selected
        ) ||
        this.$shared.filterParentalAdvisory.Alcohol.find(
          filter => !filter.Selected
        ) ||
        this.$shared.filterParentalAdvisory.Frightening.find(
          filter => !filter.Selected
        )
      ) {
        filtersList.push("Content Advisory");
      }

      if (
        this.$shared.filterPersons &&
        ((!this.$shared.filterSettings.filterPersonsAND &&
          this.$shared.filterPersons.find(filter => !filter.Selected)) ||
          (this.$shared.filterSettings.filterPersonsAND &&
            this.$shared.filterPersons.find(
              filter => filter.Selected && filter.IMDB_Person_ID
            )))
      ) {
        filtersList.push(
          `Persons${this.$shared.filterSettings.filterPersonsAND ? " ߷" : ""}`
        );
      }
      if (this.$shared.filterYears.find(filter => !filter.Selected)) {
        filtersList.push("Years");
      }
      if (this.$shared.filterQualities.find(filter => !filter.Selected)) {
        filtersList.push("Video Quality");
      }
      if (
        this.$shared.filterCompanies &&
        ((!this.$shared.filterSettings.filterCompaniesAND &&
          this.$shared.filterCompanies.find(filter => !filter.Selected)) ||
          (this.$shared.filterSettings.filterCompaniesAND &&
            this.$shared.filterCompanies.find(
              filter => filter.Selected && filter.id_Filter_Companies
            )))
      ) {
        filtersList.push(
          `Companies${
            this.$shared.filterSettings.filterCompaniesAND ? " ߷" : ""
          }`
        );
      }
      if (this.$shared.filterAudioLanguages.find(filter => !filter.Selected)) {
        filtersList.push("Audio Languages");
      }
      if (
        this.$shared.filterSubtitleLanguages.find(filter => !filter.Selected)
      ) {
        filtersList.push("Subtitle Languages");
      }
      if (
        this.$shared.filterIMDBPlotKeywords &&
        ((!this.$shared.filterSettings.filterIMDBPlotKeywordsAND &&
          this.$shared.filterIMDBPlotKeywords.find(filter => !filter.Selected)) ||
          (this.$shared.filterSettings.filterIMDBPlotKeywordsAND &&
            this.$shared.filterIMDBPlotKeywords.find(
              filter => filter.Selected && filter.id_Filter_IMDB_Plot_Keywords
            )))
      ) {
        filtersList.push(
          `Plot Keywords${
            this.$shared.filterSettings.filterIMDBPlotKeywordsAND ? " ߷" : ""
          }`
        );
      }
      if (
        this.$shared.filterIMDBFilmingLocations &&
        ((!this.$shared.filterSettings.filterIMDBFilmingLocationsAND &&
          this.$shared.filterIMDBFilmingLocations.find(filter => !filter.Selected)) ||
          (this.$shared.filterSettings.filterIMDBFilmingLocationsAND &&
            this.$shared.filterIMDBFilmingLocations.find(
              filter => filter.Selected && filter.id_Filter_IMDB_Filming_Locations
            )))
      ) {
        filtersList.push(
          `Filming Locations${
            this.$shared.filterSettings.filterIMDBFilmingLocationsAND ? " ߷" : ""
          }`
        );
      }
      if (
        this.$shared.filterMetacriticScore[0] !== 0 ||
        this.$shared.filterMetacriticScore[1] !== 100 ||
        !this.$shared.filterMetacriticScoreNone
      ) {
        filtersList.push("Metacritic Score");
      }

      if (
        this.$shared.filterIMDBRating[0] !== 0 ||
        this.$shared.filterIMDBRating[1] !== 10 ||
        !this.$shared.filterIMDBRatingNone
      ) {
        filtersList.push("IMDB Rating");
      }

      logger.log("filtersList:", filtersList);

      return filtersList;
    },

    itemsFiltered() {
      return this.items
        .filter(item => {
          let isGood = true;

          if (this.searchText) {
            const searchTextLower = this.searchText.toLowerCase();
            isGood = item.SearchSpace.includes(searchTextLower);
          }

          return isGood;
        })
        .sort((a, b) => {
          if (!this.$shared.sortField) {
            return 0;
          }

          if (
            typeof a[this.$shared.sortField] === "string" ||
            a[this.$shared.sortField] instanceof String
          ) {
            const val_a = a[this.$shared.sortField] || "";
            const val_b = b[this.$shared.sortField] || "";

            if (
              this.$shared.sortField === "created_at" ||
              this.$shared.sortField === "last_access_at" ||
              this.$shared.sortField === "startYear"
            ) {
              // sort in reverse order
              if (!val_a || !val_b) {
                return -1;
              }

              if (val_a.toLowerCase() > val_b.toLowerCase()) {
                return -1;
              }

              if (val_a.toLowerCase() < val_b.toLowerCase()) {
                return 1;
              }
            }

            if (val_a.toLowerCase() > val_b.toLowerCase()) {
              return 1;
            }

            return -1;
          } else {
            if (a[this.$shared.sortField] > b[this.$shared.sortField]) {
              return -1;
            }

            return 0;
          }
        });
    }
  },

  methods: {
    moment() {
      return moment;
    },

    Humanize() {
      return Humanize;
    },

    changeRating(movie, i) {
      (async () => {
        if (movie.Rating == i) {
          const arr_id_Movies = await store.clearRating(movie.id_Movies);

          this.items.forEach(movie => {
            if (
              arr_id_Movies.findIndex(
                id_Movies => movie.id_Movies === id_Movies
              ) !== -1
            ) {
              movie.Rating = null;
            }
          });
        } else {
          const arr_id_Movies = await store.setRating(movie.id_Movies, i);

          this.items.forEach(movie => {
            if (
              arr_id_Movies.findIndex(
                id_Movies => movie.id_Movies === id_Movies
              ) !== -1
            ) {
              movie.Rating = i;
            }
          });
        }
      })();
    },

    selectItem(movie) {
      logger.log("movie selected:", movie);

      (async () => {
        if (movie.selected) {
          movie.selected = false;
        } else {
          if (!movie.lists && !movie.extras) {
            const { lists, extras } = await store.getMovieDetails(
              movie.id_Movies
            );

            this.$set(movie, "lists", lists);
            this.$set(movie, "extras", extras);
          }

          this.$set(movie, "selected", true);
        }
      })();
    },

    async launch(movie) {
      const start = moment();

      await store.launchMovie(movie);

      const end = moment();

      logger.log("start:", start, "end:", end);

      logger.log("diff:", end.diff(start, "seconds"));

      let minimumWaitForSetAccess = await store.getSetting(
        "minimumWaitForSetAccess"
      );

      logger.log("minimumWaitForSetAccess:", minimumWaitForSetAccess);

      if (minimumWaitForSetAccess) {
        minimumWaitForSetAccess = parseInt(minimumWaitForSetAccess);
      } else {
        minimumWaitForSetAccess = 0;
      }

      if (end.diff(start, "seconds") < minimumWaitForSetAccess) {
        logger.log("RUNTIME TOO SHORT");
        return;
      }

      logger.log("RUNTIME LONG ENOUGH");

      const arr_id_Movies = await store.setLastAccess(movie.id_Movies);
      await this.updateCurrentTime();

      this.items.forEach(mov => {
        if (
          arr_id_Movies.findIndex(id_Movies => mov.id_Movies === id_Movies) !==
          -1
        ) {
          this.$set(mov, "lastAccessMoment", this.currentTime.clone());
          this.$set(mov, "last_access_at", this.currentTime.toISOString());
        }
      });
    },

    getMetaCriticClass(IMDB_metacriticScore) {
      const cssClasses = {};
      if (IMDB_metacriticScore <= 30) {
        cssClasses.MetaCriticRed = true;
      } else if (IMDB_metacriticScore <= 50) {
        cssClasses.MetaCriticYellow = true;
      } else {
        cssClasses.MetaCriticGreen = true;
      }

      return cssClasses;
    },

    copyInfo(movie) {
      const el = document.createElement("textarea");

      let info = "";

      if (movie.Rating) {
        for (let i = 0; i < movie.Rating; i++) {
          info += "★";
        }

        for (let i = 5; i > movie.Rating; i--) {
          info += "☆";
        }

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

      el.value = info;
      el.setAttribute("readonly", "");
      el.style = { position: "absolute", left: "-9999px" };
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);

      eventBus.showSnackbar("info", "Info copied to clipboard");
    },

    addToList(item) {
      (async () => {
        this.listDialog.mode = "add";
        this.listDialog.lists = await store.fetchLists();

        this.listDialog.allowCreateNewList = false;
        this.listDialog.allowUseExistingLists = false;

        if (this.listDialog.lists && this.listDialog.lists.length > 0) {
          logger.log("addToList GOT existing lists");
          this.listDialog.allowUseExistingLists = true;

          eventBus.listDialogSetChosenMethod("useExistingLists");
          eventBus.listDialogSetChosenList(this.listDialog.lists[0].id_Lists);
        } else {
          logger.log("addToList GOT NO existing lists");
          this.listDialog.allowUseExistingLists = false;
          eventBus.listDialogSetChosenMethod("createNewList");
        }

        this.listDialog.allowCreateNewList = true;

        this.listDialog.title = "Add to List";
        this.listDialog.movie = item;
        this.listDialog.show = true;
      })();
    },

    showTrailer(item) {
      this.videoPlayerDialog.videoURL = `https://www.imdb.com${item.IMDB_Trailer_URL}`;
      logger.log(
        "this.videoPlayerDialog.videoURL:",
        this.videoPlayerDialog.videoURL
      );
      this.videoPlayerDialog.show = true;
    },

    async showTrailerLocal(item) {
      try {
        const trailerMediaURLs = await scrapeIMDBTrailerMediaURLs(
          `https://www.imdb.com${item.IMDB_Trailer_URL}`
        );

        logger.log("trailerMediaURLs:", trailerMediaURLs);

        if (
          !trailerMediaURLs ||
          !trailerMediaURLs.mediaURLs ||
          trailerMediaURLs.mediaURLs.length == 0
        ) {
          return this.showTrailer(item); // Fallback to the more general player
        }

        const trailerMediaURL = store.selectBestQualityMediaURL(
          trailerMediaURLs.mediaURLs
        );

        logger.log("selected best quality trailerMediaURL:", trailerMediaURL);

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
        this.listDialog.title = "Remove from List";
        this.listDialog.movie = item;
        this.listDialog.show = true;

        eventBus.listDialogSetChosenMethod("useExistingLists");
        eventBus.listDialogSetChosenList(this.listDialog.lists[0].id_Lists);
      })();
    },

    onListDialogOK(data) {
      this.listDialog.show = false;

      logger.log("onListDialogOK data:", data);

      (async () => {
        try {
          if (!data.chosen_id_Lists && !data.newListName) {
            eventBus.showSnackbar("error", "list is missing");
            return;
          }

          // Add to list
          if (this.listDialog.mode === "add") {
            if (data.chosenMethod === "createNewList") {
              data.chosen_id_Lists = await store.createList(data.newListName);
            }

            await store.addToList(
              data.chosen_id_Lists,
              this.listDialog.movie.id_Movies,
              false
            );

            await this.fetchFilters();

            const { lists } = await store.getMovieDetails(
              this.listDialog.movie.id_Movies
            );

            this.$set(this.listDialog.movie, "lists", lists);

            eventBus.showSnackbar("success", "item added to list");
          }

          // Remove from list
          if (this.listDialog.mode == "remove") {
            if (!data.chosen_id_Lists) {
              eventBus.showSnackbar("error", "list is missing");
              return;
            }

            await store.removeFromList(
              data.chosen_id_Lists,
              this.listDialog.movie.id_Movies
            );

            await this.fetchFilters();

            eventBus.refetchMedia(this.$shared.currentPage);

            eventBus.showSnackbar("success", "item removed from list");
          }
        } catch (err) {
          eventBus.showSnackbar("error", err);
        }
      })();
    },

    onListDialogCancel() {
      this.listDialog.show = false;
    },

    async fetchFilters(setFilter) {
      eventBus.showLoadingOverlay(true);

      await store.fetchFilterSettings(this.mediatype);
      await store.fetchFilterSourcePaths(this.mediatype);
      await store.fetchFilterGenres(this.mediatype);
      await store.fetchFilterAgeRatings(this.mediatype);
      await store.fetchFilterRatings(this.mediatype);
      await store.fetchFilterLists(this.mediatype);
      await store.fetchFilterParentalAdvisory(this.mediatype);
      await store.fetchFilterPersons(this.mediatype);
      await store.fetchFilterCompanies(this.mediatype);
      await store.fetchFilterIMDBPlotKeywords(this.mediatype);
      await store.fetchFilterIMDBFilmingLocations(this.mediatype);
      await store.fetchFilterYears(this.mediatype);
      await store.fetchFilterQualities(this.mediatype);
      await store.fetchFilterLanguages(this.mediatype, "audio");
      await store.fetchFilterLanguages(this.mediatype, "subtitle");
      await store.fetchFilterIMDBRating(this.mediatype);
      await store.fetchFilterMetacriticScore(this.mediatype);

      await store.fetchSortValues(this.mediatype);

      await store.fetchCurrentPage(this.mediatype);

      if (setFilter) {
        eventBus.setFilter(setFilter);
      }
      eventBus.showLoadingOverlay(false);
    },

    onCreditClicked(credit) {
      logger.log("credit clicked:", credit);

      this.personDialog.show = true;
      this.personDialog.IMDB_Person_ID = credit.id;
      this.personDialog.Person_Name = credit.name;
      // this.$refs.personDialog.init();

      return;
    },

    onCompanyClicked(company) {
      logger.log("company clicked:", company);

      this.companyDialog.show = true;
      this.companyDialog.IMDB_Company_ID = company.id;
      this.companyDialog.Company_Name = company.name;
      // this.$refs.personDialog.init();

      return;
    },

    onIMDBPlotKeywordClicked(plotKeyword) {
      logger.log("plotKeyword clicked:", plotKeyword);

      this.plotKeywordDialog.show = true;
      this.plotKeywordDialog.id_IMDB_Plot_Keywords =
        plotKeyword.id_IMDB_Plot_Keywords;
      this.plotKeywordDialog.Keyword = plotKeyword.Keyword;

      return;
    },

    onIMDBFilmingLocationClicked(filmingLocation) {
      logger.log("filmingLocation clicked:", filmingLocation);

      this.filmingLocationDialog.show = true;
      this.filmingLocationDialog.id_IMDB_Filming_Locations =
        filmingLocation.id_IMDB_Filming_Locations;
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

      return (
        moment
          .duration(movie.lastAccessMoment.diff(this.currentTime))
          .humanize() + " ago"
      );
    },

    createdHumanized(movie) {
      if (!movie.created_at) {
        return "none";
      }

      if (!movie.createdMoment) {
        movie.createdMoment = moment(movie.created_at);
      }

      return (
        moment.duration(movie.createdMoment.diff(this.currentTime)).humanize() +
        " ago"
      );
    },

    lastAccessDisplayText(movie) {
      if (!movie.last_access_at) {
        return "";
      }

      if (!movie.lastAccessMoment) {
        movie.lastAccessMoment = moment(movie.last_access_at);
      }

      return moment
        .utc(movie.lastAccessMoment)
        .local()
        .format("YYYY-MM-DD HH:mm:ss");
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

      return moment
        .utc(movie.createdMoment)
        .local()
        .format("YYYY-MM-DD HH:mm:ss");
    },

    openIMDB(movie) {
      shell.openExternal(`https://www.imdb.com/title/${movie.IMDB_tconst}/`);
    },

    async showCredits(movie, show) {
      if (!show) {
        this.$set(movie, "showCredits", false);
        return;
      }

      if (!movie.credits) {
        const credits = await store.fetchMovieCredits(movie.id_Movies);

        logger.log(credits);

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

        logger.log(companies);

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
      this.linkIMDBDialog.show = true;
      this.linkIMDBDialog.item = item;
    },

    onLinkIMDBDialogClose() {
      this.linkIMDBDialog.show = false;
      this.linkIMDBDialog.item = {};
    },

    async onLinkIMDBDialogSelected(tconst) {
      try {
        store.resetUserScanOptions();
        
        await store.assignIMDB(this.linkIMDBDialog.item.id_Movies, tconst);

        eventBus.refetchMedia(this.$shared.currentPage);

        eventBus.showSnackbar("success", "entry linked successfully");

        this.onLinkIMDBDialogClose();
      } catch (err) {
        logger.log("error:", JSON.stringify(err));
        eventBus.showSnackbar("error", err);
      }
    },

    setItemHovered(item, section, value) {
      this.$set(item, `${section}Hovered`, value);
    },

    onEditItem(item, attributeName, attributeDisplayText) {
      this.editItemDialog.item = item;
      this.editItemDialog.attributeName = attributeName;
      this.editItemDialog.attributeDisplayText = attributeDisplayText;
      this.editItemDialog.title = `Edit ${attributeDisplayText}`;
      this.$refs.editItemNameDialog.initTextValue(item[attributeName]);
      this.editItemDialog.show = true;
    },

    async onEditItemDialogOK(result) {
      logger.log("EDIT NAME DIALOG OK result:", result);
      this.editItemDialog.show = false;

      const useActualDuplicates =
        (this.editItemDialog.attributeName == "Name" &&
          this.$shared.duplicatesHandling.actualDuplicate.updateTitle) ||
        (this.editItemDialog.attributeName == "Name2" &&
          this.$shared.duplicatesHandling.actualDuplicate.updateSubTitle);

      const arr_id_Movies = await store.updateMovieAttribute(
        this.editItemDialog.item.id_Movies,
        this.editItemDialog.attributeName,
        result.textValue,
        useActualDuplicates,
        false
      );

      this.items.forEach(mov => {
        if (
          arr_id_Movies.findIndex(id_Movies => mov.id_Movies === id_Movies) !==
          -1
        ) {
          this.$set(mov, this.editItemDialog.attributeName, result.textValue);
        }
      });

      eventBus.showSnackbar(
        "success",
        `${this.editItemDialog.attributeDisplayText} successfully changed.`
      );
    },

    onEditItemDialogCancel() {
      this.editItemDialog.show = false;
    },

    contentAdvisorySeverityDisplayText(severity) {
      if (severity == 0) {
        return "None";
      } else if (severity == 1) {
        return "Mild";
      } else if (severity == 2) {
        return "Moderate";
      } else if (severity == 3) {
        return "Severe";
      }

      return "<not available>";
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
        const plotKeywords = await store.fetchMoviePlotKeywords(
          movie.id_Movies
        );

        logger.log("plotKeywords", plotKeywords);

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
        const filmingLocations = await store.fetchMovieFilmingLocations(
          movie.id_Movies
        );

        logger.log("filmingLocations", filmingLocations);

        this.$set(movie, "filmingLocations", filmingLocations);
      }

      this.$set(movie, "showFilmingLocations", true);
    },

    onSortChanged() {
      store.saveSortValues(this.mediatype);
    },

    onReload() {
      eventBus.refetchMedia();
    },

    async completelyFetchMedia() {
      const arr_id_Movies = [];

      this.itemsFilteredPaginated.forEach(item => {
        if (!item.isCompletelyFetched) {
          arr_id_Movies.push(item.id_Movies);
        }
      });

      logger.log("completelyFetchMedia arr_id_Movies:", arr_id_Movies);

      if (arr_id_Movies.length === 0) {
        return;
      }

      const result = await store.fetchMedia(
        this.mediatype,
        arr_id_Movies,
        false
      );

      logger.log("completelyFetchMedia result:", result);

      result.forEach(item => {
        this.itemsFilteredPaginated.forEach(itemPaginated => {
          if (item.id_Movies !== itemPaginated.id_Movies) {
            return;
          }

          Object.keys(itemPaginated).forEach(key => {
            itemPaginated[key] = item[key];
          });
        });
      });
    },

    onShowRatingDemographicsDialog(item) {
      this.ratingDemographicsDialog.title = item.Name;

      this.$refs.ratingDemographicsDialog.init(item.id_Movies);
      
      this.ratingDemographicsDialog.show = true;
    }
  },

  // ### LifeCycle Hooks ###
  created() {
    (async () => {
      await this.fetchFilters();

      eventBus.refetchMedia();

      this.$shared.currentPage = await store.fetchCurrentPage(this.mediatype);

      logger.log("items:", this.items);
    })();

    eventBus.$on("searchTextChanged", () => {
      this.$shared.currentPage = 1;
      store.saveCurrentPage(this.mediatype);
      this.completelyFetchMedia();
    });

    eventBus.$on("refetchMedia", setPage => {
      logger.log("refetching media");
      (async () => {
        eventBus.showLoadingOverlay(true);

        this.items = [];

        this.items = await store.fetchMedia(this.mediatype, null, true);

        eventBus.showLoadingOverlay(false);

        this.$shared.currentPage =
          setPage && setPage <= this.numPages ? setPage : 1;
        store.saveCurrentPage(this.mediatype);

        this.completelyFetchMedia();
      })();
    });

    eventBus.$on("refetchFilters", setFilter => {
      this.fetchFilters(setFilter);
    });

    eventBus.$on("listDialogSetUseExistingLists", value => {
      this.listDialog.useExistingLists = value;
      this.listDialog.createNewList = !value;
    });

    eventBus.$on("listDialogSetCreateNewList", value => {
      this.listDialog.createNewList = value;
      this.listDialog.useExistingLists = !value;
    });

    eventBus.$on("showPersonDialog", value => {
      this.onCreditClicked(value);
    });

    eventBus.$on("showPlotKeywordDialog", value => {
      this.onIMDBPlotKeywordClicked(value);
    });

    eventBus.$on("showFilmingLocationDialog", value => {
      this.onIMDBFilmingLocationClicked(value);
    });

    eventBus.$on("showCompanyDialog", value => {
      this.onCompanyClicked(value);
    });

    this.updateCurrentTime();

    setInterval(() => {
      this.updateCurrentTime();
    }, 10000);
  },

  beforeDestroy() {
    logger.log("MediaList beforeDestroy START");
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
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.MetaCriticRed {
  background-color: red;
}
.MetaCriticYellow {
  background-color: yellow;
}
.MetaCriticGreen {
  background-color: green;
}

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
  padding-left: 16px;
  padding-right: 0px;
  padding-top: 0px;
  padding-bottom: 0px;
  width: 140px !important;
  max-width: 140px !important;
  min-width: 140px !important;
}

.detailContent {
  padding-left: 0px;
  padding-right: 0px;
  padding-top: 0px;
  padding-bottom: 0px;
  width: 100% !important;
}

.creditsLabel {
  padding-left: 16px;
  padding-right: 0px;
  padding-top: 0px;
  padding-bottom: 0px;
}

.creditsContent {
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
  text-shadow: #000 0px 0px 2px, #000 0px 0px 2px, #000 0px 0px 2px,
    #000 0px 0px 2px, #000 0px 0px 2px, #000 0px 0px 2px;
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
