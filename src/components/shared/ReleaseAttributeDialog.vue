<template>
  <v-dialog v-model="show" persistent max-width="1000px" v-on:keydown.escape="onEscapePressed">
    <v-card dark flat v-bind:ripple="false">
      <v-list-item style="padding-left: 0px">
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
                >{{$t('Release Attribute')}}: {{ ReleaseAttribute }}</v-list-item-title>
              </div>
            </v-row>
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
            {{$t('Filter by this release attribute')}}
            <span v-if="numMovies">({{numMovies}})</span>
          </v-btn>
          <v-btn
            class="xs-fullwidth"
            color="red"
            v-on:click.native="onButtonClick('delete')"
            style="margin-left: 8px;"
          >{{$t('Remove this release attribute for the current movie')}}</v-btn>
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
  props: ["show", "ReleaseAttribute"],

  data() {
    return {
      isScraping: false,
      numMovies: null
    };
  },

  watch: {
    ReleaseAttribute: function(newVal) {
      this.init(newVal);
    }
  },

  methods: {
    async init(releaseAttribute) {
      const releaseAttributesHierarchy = store.getReleaseAttributesHierarchy();
      const ra = releaseAttributesHierarchy.find(
        rah => rah.displayAs === releaseAttribute
      );

      this.numMovies = await store.db.fireProcedureReturnScalar(
        `
            SELECT COUNT(1) FROM (
                SELECT DISTINCT MRA.id_Movies
                FROM tbl_Movies_Release_Attributes MRA
                INNER JOIN tbl_Movies MOV ON MRA.id_Movies = MOV.id_Movies
                --INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
                WHERE
                    (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Extra_id_Movies_Owner IS NULL
                    AND MRA.deleted = 0
                    AND MRA.Release_Attributes_searchTerm IN (${ra.searchTerms
          .map(param => param.replace(/'/g, "''"))
          .reduce((prev, current) => {
            return prev + (prev ? ", " : "") + `'${current}'`;
          }, "")}))`);
    },

    onButtonClick(eventName) {
      this.$emit(eventName, {});

      this.$emit("close");
    },

    onCloseClick() {
      this.$emit("close");
    },

    async onFilterClick() {
      const setFilter = {
        filterReleaseAttributes: [this.ReleaseAttribute]
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
