<template>
  <div style="width: 100%">
    <h1 style="margin-left: 8px">{{$t('Home')}}</h1>

    <v-row dense style="margin-left: 4px; margin-right: 4px">
      <v-col
        v-for="(item) in items"
        v-bind:key="item.id"
        v-on:click="onItemClick(item.id)"
        cols="12"
        lg="4"
        md="6"
      >
        <v-card dark flat hover class="mk-clickable" style="min-height: 130px">
          <!-- :color="item.color" -->
          <div class="d-flex flex-no-wrap justify-space-between">
            <div>
              <v-card-title class="headline">
                <v-icon left>{{item.icon}}</v-icon>
                {{$t(`${item.text}`)}}
                <v-progress-linear v-if="item.fetchNumMovies && item.isFetchingNumMovies" color="red accent-0" indeterminate rounded height="3"></v-progress-linear>
              </v-card-title>

              <v-card-text class="mk-light-grey">
                <p v-if="item.fetchNumMovies && !item.isFetchingNumMovies">{{ item.numMovies }} {{ item.numMovies == 1 ? $t('entry') : $t('entries')}}</p>
              </v-card-text>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import * as store from "@/store";
import { eventBus } from "@/main";

export default {
  data: () => ({
    items: [
      {
        icon: "mdi-settings",
        text: "Settings",
        id: "settings",
        fetchNumMovies: false,
        isFetchingNumMovies: false,
      },
      {
        icon: "mdi-movie",
        text: "Movies",
        id: "movies",
        fetchNumMovies: true,
        numMovies: null,
        isFetchingNumMovies: true,
      },
      /* not yet implemented
      {
        icon: "mdi-television",
        text: "Series",
        id: "series",
        fetchNumMovies: true,
        numMovies: null,
      },
      */
    ],
  }),

  methods: {
    onItemClick(itemid) {
      if (!itemid) {
        return;
      }

      if (itemid == "movies") {
        return store.routeTo(this.$router, "/medialist/movies");
      }

      if (itemid == "series") {
        return store.routeTo(this.$router, "/medialist/series");
      }

      if (itemid == "settings") {
        return store.routeTo(this.$router, "/settings");
      }
    },

    async fetchNumMovies() {
      try {
        for (let i = 0; i < this.items.length; i++) {
          const item = this.items[i];
    
          if (item.fetchNumMovies) {
            item.isFetchingNumMovies = true;
            item.numMovies = await store.fetchNumMovies(item.id);
            item.isFetchingNumMovies = false;
          }
        }
      } catch(e) {
        
      }
    }
  },

  // Lifecycle Hooks
  created() {
    this.fetchNumMovies();
    
    eventBus.$on("dbInitialized", () => {
      this.fetchNumMovies();
    });

    eventBus.$on("rescanFinished", () => {
      this.fetchNumMovies();
    });
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
