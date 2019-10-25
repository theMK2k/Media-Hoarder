<template>
  <div style="display: flex; flex-direction: column; width: 100%">
		<v-row style="margin-bottom: 0px; margin-top: 0px; padding-bottom: 8px; padding-top: 8px; position: fixed; width: 100%!important; z-index: 10; background: rgb(48, 48, 48);">
	    <v-btn text v-on:click="$router.go(-1)" style="margin-top: 6px; margin-left: 8px">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
			<h1 style="margin-bottom: 0px; margin-top: 0px;">
					{{ mediatype.toUpperCase() }} ({{ itemsFiltered.length }})
			</h1>
			<v-select
				solo
				clearable
				dense
				v-bind:items="sortAbles"
				item-text="Description"
				item-value="Field"
				v-model="sort"
				label="Sort"
				style="margin-left: 8px; max-width: 260px; height: 40px"
			>
				<template v-slot:selection="{ item, index }">
					<span class="grey--text caption" style="margin-right: 8px">Sort by</span>
					<span>{{ item.Description }}</span>
				</template>
			</v-select>

			<v-spacer></v-spacer>

			<div v-if="numPages">
				<v-pagination v-bind:length="numPages" v-model="currentPage" total-visible="7"></v-pagination>
			</div>
		</v-row>

    <v-container class="scrollcontainer pa-2" style="max-width: 100%!important; margin-top: 48px;">
      <v-row v-for="(item, i) in itemsFilteredPaginated" :key="i">
        <v-col>
          <v-card dark flat hover v-bind:ripple="false" v-on:click="selectItem(item)">
            <v-list-item three-line style="padding-left: 0px">
              <div>
                <v-list-item-avatar
                  tile
                  style="margin: 6px; height: 150px; width: 120px"
                  v-on:click.stop="launch(item)"
                >
                  <v-img
                    contain
                    v-if="item.IMDB_posterSmall_URL"
                    v-bind:src="item.IMDB_posterSmall_URL"
                    style="border-radius: 6px;"
                  ></v-img>
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
                      >{{ item.Name }} {{ item.yearDisplay }}</v-list-item-title>

                      <v-list-item-subtitle
                        v-if="item.Name2"
                        style="margin-bottom: 4px"
                      >{{ item.Name2 }}</v-list-item-subtitle>

                      <div style="font-size: .875rem; font-weight: normal">
                        <span v-if="item.MI_Quality">{{ item.MI_Quality + ' | ' }}</span>
                        <span v-if="item.AgeRating">{{ item.AgeRating + ' | ' }}</span>
                        <span v-if="item.Genres">{{ item.Genres + ' | ' }}</span>
                        <span v-if="item.AudioLanguages">
                          <v-icon small>mdi-comment-outline</v-icon>
                          {{ item.AudioLanguages + ' | ' }}
                        </span>
                        <span v-if="item.SubtitleLanguages">
                          <v-icon small>mdi-subtitles-outline</v-icon>
                          {{ item.SubtitleLanguages + ' | ' }}
                        </span>
                      </div>
                    </div>
                    <div class="flex-grow-1"></div>
                    <div>
                      <div
                        class="headline mb-2"
                        style="margin-right: 16px; margin-left: 16px; margin-bottom: 0px!important"
                        v-if="item.IMDB_ratingDisplay"
                      >
                        <v-icon small color="amber" style="padding-bottom: 4px">mdi-star</v-icon>
                        {{item.IMDB_ratingDisplay}}
                        <span
                          v-if="item.IMDB_metacriticScore"
                          v-bind:class="getMetaCriticClass(item.IMDB_metacriticScore)"
                          style="padding: 4px"
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
                    <div style="font-size: .875rem; font-weight: normal">{{ item.IMDB_plotSummary }}</div>
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
                          class="CreditClickable"
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
                          class="CreditClickable"
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
                          class="CreditClickable"
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
                          class="CreditClickable"
                          v-on:click.stop="onCreditClicked(credit)"
                        >{{ credit.name }}</a>
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
                <v-col class="detailLabel">In Lists:</v-col>
                <v-col class="detailContent">
                  <span v-if="itemDetails.lists && itemDetails.lists.length > 0">
                    <span v-for="(list, index) in itemDetails.lists" v-bind:key="index">
                      <span v-if="index > 0">,&nbsp;</span>
                      <span>{{list.Name}}</span>
                    </span>
                  </span>
                  <span
                    v-if="!itemDetails.lists || itemDetails.lists.length === 0"
                  >&lt;not in any list&gt;</span>
                </v-col>
              </v-row>

              <!-- FULL CREDITS -->
              <v-row
                style="padding-left: 16px; padding-top: 4px; align-items: flex-end;"
                class="CreditClickable"
                v-on:click.stop="showCredits(item, !item.showCredits)"
              >
                <span style="font-size: 20px">Credits&nbsp;</span>
              </v-row>

              <div v-if="item.showCredits" v-on:click.stop="showCredits(item, false)">
                <div
                  v-for="creditCategory in item.credits"
                  v-bind:key="creditCategory.Category"
                  style="margin-left: 16px"
                >
                  <v-row>
                    <strong>{{ creditCategory.category }}</strong>
                  </v-row>
                  <v-row
                    v-for="credit in creditCategory.items"
                    v-bind:key="credit.id_Movies_IMDB_Credits"
                  >
                    <v-col sm="2" class="creditsLabel">
                      <a
                        class="CreditClickable"
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

              <v-row style="margin-top: 8px">
                <v-btn text v-on:click.stop="openIMDB(item)">Open IMDB</v-btn>
                <v-btn text v-on:click.stop="copyInfo(item)">Copy Info</v-btn>
                <v-btn text v-on:click.stop="addToList(item)">Add to List</v-btn>
                <v-btn
                  v-if="itemDetails.lists && itemDetails.lists.length > 0"
                  text
                  v-on:click.stop="removeFromList(item)"
                >Remove from List</v-btn>
                <v-btn v-if="item.IMDB_Trailer_URL" text v-on:click.stop="showTrailer(item)">Trailer</v-btn>
              </v-row>
            </v-col>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-spacer></v-spacer>
        <div v-if="numPages">
          <v-pagination v-bind:length="numPages" v-model="currentPage" total-visible="7"></v-pagination>
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

    <mk-video-player-dialog
      v-bind:show="videoPlayerDialog.show"
      v-bind:src="videoPlayerDialog.videoURL"
      v-on:close="onVideoPlayerDialogClose"
    ></mk-video-player-dialog>
  </div>
</template>

<script>
import * as store from "@/store";
import { eventBus } from "@/main";
import ListDialog from "@/components/shared/ListDialog.vue";
import PersonDialog from "@/components/shared/PersonDialog.vue";
import VideoPlayerDialog from "@/components/shared/VideoPlayerDialog.vue";
const { shell } = require("electron").remote;

const moment = require("moment");

// import * as helpers from "@/helpers/helpers";

const logger = require("loglevel");

export default {
  components: {
    "mk-list-dialog": ListDialog,
    "mk-person-dialog": PersonDialog,
    "mk-video-player-dialog": VideoPlayerDialog
  },

  data: () => ({
    smallPosterImgSrc: null,
    items: [],
    searchText: null,
    sortAbles: [
      {
        Field: "Name",
        Description: "Name"
      },
      {
        Field: "IMDB_rating",
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
        Field: "Rating",
        Description: "My Rating"
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

    sort: null,

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
      IMDB_Person_ID: null
    },

    videoPlayerDialog: {
      show: false,
      videoURL: null
    },

    itemDetails: {
      lists: []
    },

    itemsPerPage: 20,
    currentPage: 1,

    currentTime: moment()
  }),

  watch: {
    sort: function() {
      logger.log("sort changed to:", this.sort);
    }
  },

  props: ["mediatype"],

  computed: {
    numPages() {
      return Math.ceil(this.itemsFiltered.length / this.itemsPerPage);
    },

    visiblePages() {
      return Math.min(this.numPages, 7);
    },

    itemsFilteredPaginated() {
      return this.itemsFiltered.slice(
        (this.currentPage - 1) * this.itemsPerPage,
        this.currentPage * this.itemsPerPage
      );
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
          if (!this.sort) {
            return 0;
          }

          if (
            typeof a[this.sort] === "string" ||
            a[this.sort] instanceof String
          ) {
            if (this.sort === "created_at" || this.sort === "last_access_at") {
              // we sort dates in reverse order (earliest first)
              if (a[this.sort].toLowerCase() > b[this.sort].toLowerCase()) {
                return -1;
              }
            }

            if (a[this.sort].toLowerCase() > b[this.sort].toLowerCase()) {
              return 1;
            }

            return -1;
          } else {
            if (a[this.sort] > b[this.sort]) {
              return -1;
            }

            return 0;
          }
        });
    }
  },

  methods: {
    changeRating(movie, i) {
      (async () => {
        if (movie.Rating == i) {
          await store.clearRating(movie.id_Movies);
          movie.Rating = null;
        } else {
          await store.setRating(movie.id_Movies, i);
          movie.Rating = i;
        }
      })();
    },

    selectItem(movie) {
      (async () => {
        if (movie.selected) {
          movie.selected = false;
        } else {
          // this.items.forEach(item => {
          //   this.$set(item, "selected", false);
          // });

          this.itemDetails = await store.getMovieDetails(movie.id_Movies);

          logger.log("itemDetails:", this.itemDetails);

          this.$set(movie, "selected", true);
          // movie.selected = true;
        }

        // TODO: currently needed for changedetection of item.selected (interesting)
        // const items = this.items;
        // this.items = [];
        // this.items = items;
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

      await store.setLastAccess(movie.id_Movies);
      await this.updateCurrentTime();

      this.$set(movie, "lastAccessMoment", this.currentTime.clone());
      this.$set(movie, "last_access_at", this.currentTime.toISOString());
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

      eventBus.showSnackbar("info", 6000, "Info copied to clipboard");
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

    removeFromList(item) {
      (async () => {
        this.listDialog.mode = "remove";
        this.listDialog.allowCreateNewList = false;
        this.listDialog.allowUseExistingLists = true;
        this.listDialog.lists = this.itemDetails.lists;
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
            eventBus.showSnackbar("error", 6000, "list is missing");
            return;
          }

          // Add to list
          if (this.listDialog.mode === "add") {
            if (data.chosenMethod === "createNewList") {
              data.chosen_id_Lists = await store.createList(data.newListName);
            }

            await store.addToList(
              data.chosen_id_Lists,
              this.listDialog.movie.id_Movies
            );

            await this.fetchFilters();

            this.itemDetails = await store.getMovieDetails(
              this.listDialog.movie.id_Movies
            );

            eventBus.showSnackbar("success", 6000, "item added to list");
          }

          // Remove from list
          if (this.listDialog.mode == "remove") {
            if (!data.chosen_id_Lists) {
              eventBus.showSnackbar("error", 6000, "list is missing");
              return;
            }

            await store.removeFromList(
              data.chosen_id_Lists,
              this.listDialog.movie.id_Movies
            );

            await this.fetchFilters();

            eventBus.refetchMedia(this.currentPage);

            eventBus.showSnackbar("success", 6000, "item removed from list");
          }
        } catch (err) {
          eventBus.showSnackbar("error", 6000, err);
        }
      })();
    },

    onListDialogCancel() {
      this.listDialog.show = false;
    },

    async fetchFilters() {
      await store.fetchFilterSourcePaths(this.mediatype);
      await store.fetchFilterGenres(this.mediatype);
      await store.fetchFilterAgeRatings(this.mediatype);
      await store.fetchFilterRatings(this.mediatype);
      await store.fetchFilterLists(this.mediatype);
      await store.fetchFilterParentalAdvisory(this.mediatype);
      await store.fetchFilterPersons(this.mediatype);
      await store.fetchFilterYears(this.mediatype);
      await store.fetchFilterQualities(this.mediatype);
    },

    onCreditClicked(credit) {
      // TODO!
      logger.log("credit clicked:", credit);

      this.personDialog.show = true;
      this.personDialog.IMDB_Person_ID = credit.id;
      this.personDialog.Person_Name = credit.name;
      // this.$refs.personDialog.init();

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
        // TODO: load credits from store and assign to movie.credits
        const credits = await store.fetchMovieCredits(movie.id_Movies);

        logger.log(credits);

        this.$set(movie, "credits", credits);
      }

      this.$set(movie, "showCredits", true);
    },

    onPersonDialogClose() {
      this.personDialog.show = false;
    },

    onVideoPlayerDialogClose() {
      this.videoPlayerDialog.show = false;
    }
  },

  // ### LifeCycle Hooks ###
  created() {
    (async () => {
      await this.fetchFilters();

      eventBus.refetchMedia();

      this.currentPage = 1;

      logger.log("items:", this.items);
    })();

    eventBus.$on("searchTextChanged", ({ searchText }) => {
      this.searchText = searchText;
      this.currentPage = 1;
    });

    eventBus.$on("refetchMedia", setPage => {
      logger.log("refetching media");
      (async () => {
        eventBus.showLoadingOverlay(true);

        this.items = await store.fetchMedia(this.mediatype);

        eventBus.showLoadingOverlay(false);

        this.currentPage = setPage && setPage <= this.numPages ? setPage : 1;
      })();
    });

    eventBus.$on("refetchFilters", () => {
      this.fetchFilters();
    });

    eventBus.$on("listDialogSetUseExistingLists", value => {
      this.listDialog.useExistingLists = value;
      this.listDialog.createNewList = !value;
    });

    eventBus.$on("listDialogSetCreateNewList", value => {
      this.listDialog.createNewList = value;
      this.listDialog.useExistingLists = !value;
    });

    this.updateCurrentTime();

    setInterval(() => {
      this.updateCurrentTime();
    }, 10000);
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
</style>
