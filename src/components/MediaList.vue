<template>
  <div style="display: flex; flex-direction: column; min-width: 100%">
    <h1 style="margin-bottom: 0px; margin-top: 8px; flex 0 1 auto">
      <v-row>
        <v-btn text v-on:click="$router.go(-1)" style="margin-top: 6px; margin-left: 8px">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        {{ mediatype.toUpperCase() }} ({{ itemsFiltered.length }})
        <v-select
          solo
          clearable
          dense
          v-bind:items="sortAbles"
          item-text="Description"
          item-value="Field"
          v-model="sort"
          label="Sort"
          style="margin-left: 8px; max-width: 260px"
        >
          <template v-slot:selection="{ item, index }">
            <span class="grey--text caption" style="margin-right: 8px">Sort by</span>
            <span>{{ item.Description }}</span>
          </template>
        </v-select>
        <v-spacer></v-spacer>
      </v-row>
    </h1>

    <v-container class="scrollcontainer pa-2" style="max-width: 100%!important">
      <v-row v-for="(item, i) in itemsFiltered" :key="i">
        <v-col>
          <v-card dark flat hover v-bind:ripple="false" v-on:click="selectItem(item)">
            <v-list-item three-line style="padding-left: 0px">
              <div>
                <v-list-item-avatar
                  tile
                  style="margin: 6px; height: 150px; width: 120px"
                  v-on:click.stop="launch(item)"
                >
                  <v-img contain v-bind:src="item.IMDB_posterSmall_URL"></v-img>
                  <!-- TODO: implement lazy-src -->
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

                  <v-row v-if="item.IMDB_plotSummary" style="margin-left: 4px; margin-right: 6px">
                    <div style="font-size: .875rem; font-weight: normal">{{ item.IMDB_plotSummary }}</div>
                  </v-row>
                </v-col>
              </v-list-item-content>
            </v-list-item>
            <v-col v-if="item.selected" style="min-width: 100%">
              <v-btn text v-on:click.stop="copyInfo(item)">Copy Info</v-btn>
              <v-btn text v-on:click.stop="addToList(item)">Add to List</v-btn>
              <v-btn
                v-if="itemDetails.lists && itemDetails.lists.length > 0"
                text
                v-on:click.stop="removeFromList(item)"
              >Remove from List</v-btn>
            </v-col>
          </v-card>
        </v-col>
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
  </div>
</template>

<script>
import * as store from "@/store";
import { eventBus } from "@/main";
import ListDialog from "@/components/shared/ListDialog.vue";

// import * as helpers from "@/helpers/helpers";

const logger = require("loglevel");

export default {
  components: {
    "mk-list-dialog": ListDialog
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
      mode: 'add',
      title: '',
      show: false,
      movie: null,
      lists: [],
      allowUseExistingLists: false,
      allowCreateNewList: false
    },

    itemDetails: {
      lists: []
    }
  }),

  watch: {
    sort: function() {
      logger.log("sort changed to:", this.sort);
    }
  },

  props: ["mediatype"],

  computed: {
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
          this.items.forEach(item => {
            item.selected = false;
          });

          this.itemDetails = await store.getMovieDetails(movie.id_Movies);

          logger.log("itemDetails:", this.itemDetails);

          movie.selected = true;
        }

        // TODO: currently needed for changedetection of item.selected (interesting)
        const items = this.items;
        this.items = [];
        this.items = items;
      })();
    },

    async launch(movie) {
      await store.launchMovie(movie);
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
        this.listDialog.mode = 'add';
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

    removeFromList(item) {
      (async () => {
        this.listDialog.mode = 'remove';
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

      (async () => {
        try {
          // Add to list
          if (this.listDialog.mode == 'add') {
            if (this.listDialog.chosenMethod == 'createNewList') {
              data.chosen_id_Lists = await store.createList(data.newListName);
            }
  
            await store.addToList(
              data.chosen_id_Lists,
              this.listDialog.movie.id_Movies
            );
  
            await this.fetchFilters();
  
            eventBus.showSnackbar("success", 6000, "Movie added to list");
          }

          if (this.listDialog.mode == 'remove') {
            await store.removeFromList(data.chosen_id_Lists, this.listDialog.movie.id_Movies);

            eventBus.showSnackbar("success", 6000, "Movie removed from list");
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
    }
  },

  // ### LifeCycle Hooks ###
  created() {
    (async () => {
      await this.fetchFilters();

      this.items = await store.fetchMedia(this.mediatype);
      logger.log("items:", this.items);
    })();

    eventBus.$on("searchTextChanged", ({ searchText }) => {
      this.searchText = searchText;
    });

    eventBus.$on("refetchMedia", () => {
      logger.log("refetching media");
      (async () => {
        this.items = await store.fetchMedia(this.mediatype);
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
</style>
