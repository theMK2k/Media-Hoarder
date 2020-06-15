<template>
  <v-dialog v-model="show" persistent max-width="1000px" v-on:keydown.escape="onEscapePressed">
    <v-card dark flat v-bind:ripple="false">
      <v-list-item style="padding-left: 0px">
        <!-- <div>
          <v-list-item-avatar tile style="margin: 6px; height: 150px; width: 120px">
          </v-list-item-avatar>
        </div>-->
        <v-list-item-content
          class="align-self-start"
          style="padding-left: 8px; padding-bottom: 6px"
        >
          <v-col style="padding: 0px!important" sm="12">
            <v-row>
              <div style="margin-left: 16px">
                <v-list-item-title
                  class="headline mb-2"
                  style="margin-bottom: 0px!important"
                >{{$t('Filming Location')}}: {{ Location }}</v-list-item-title>
              </div>
            </v-row>

            <v-progress-linear
              v-if="isScraping"
              color="red accent-0"
              indeterminate
              rounded
              height="3"
            ></v-progress-linear>
          </v-col>
        </v-list-item-content>
      </v-list-item>
      <v-col sm="12">
        <v-row style="margin-top: 8px">
          <v-btn
            class="xs-fullwidth"
            color="secondary"
            v-on:click.native="onCloseClick"
            style="margin-left: 8px;"
          >{{$t('Close')}}</v-btn>
          <v-btn
            class="xs-fullwidth"
            color="primary"
            v-on:click.native="onFilterClick"
            style="margin-left: 8px;"
          >
            {{$t('Filter by this filming location')}}
            <span v-if="numMovies">({{numMovies}})</span>
          </v-btn>
        </v-row>
      </v-col>
    </v-card>
  </v-dialog>
</template>

<script>
import * as store from "@/store";
// import * as helpers from "@/helpers/helpers";
// const logger = require("loglevel");

// const { shell } = require("electron").remote;

import { eventBus } from "@/main";

export default {
  props: ["show", "id_IMDB_Filming_Locations", "Location"],

  data() {
    return {
      isScraping: false,
      numMovies: null
    };
  },

  watch: {
    id_IMDB_Filming_Locations: function(newVal) {
      this.init(newVal);
    }
  },

  methods: {
    async init($id_IMDB_Filming_Locations) {
      this.numMovies = await store.db.fireProcedureReturnScalar(
        `
          SELECT COUNT(1) FROM
          (
            SELECT DISTINCT
              MFL.id_Movies
            FROM tbl_Movies_IMDB_Filming_Locations MFL
            INNER JOIN tbl_Movies MOV ON MFL.id_Movies = MOV.id_Movies
            WHERE MFL.id_IMDB_Filming_Locations = $id_IMDB_Filming_Locations
                  AND (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
          )
      `,
        { $id_IMDB_Filming_Locations }
      );
    },

    onButtonClick(eventName) {
      this.$emit(eventName, {
        dontAskAgain: this.dontAskAgainValue,
        textValue: this.textValueLocal
      });

      this.resetData();
    },

    onCloseClick() {
      this.$emit("close");
    },

    async onFilterClick() {
      await store.addFilterIMDBFilmingLocation(
        this.id_IMDB_Filming_Locations,
        this.Location
      );

      const setFilter = {
        filterIMDBFilmingLocations: [this.id_IMDB_Filming_Locations]
      };

      eventBus.refetchFilters(setFilter);

      this.$emit("close");
    },

    onEscapePressed() {
      this.onCloseClick();
    }
  },

  // ### Lifecycle Hooks ###
  created() {}
};
</script>

<style scoped>
.btn {
  margin: 2px;
}

.input-group--text-field {
  padding-left: 16px;
  /* padding-top: 0px; */
}

@media screen and (max-width: 599px) {
  .input-group--text-field {
    padding-left: 16px;
    padding-top: 0px;
  }
}
</style>
