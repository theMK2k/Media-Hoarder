<template>
  <v-dialog
    v-model="show"
    persistent
    max-width="100%"
    v-on:keydown.escape="onCloseClick"
    v-on:keydown.enter="onOKClick"
  >
    <v-card dark flat v-bind:ripple="false">
      <v-card-title>
        <div class="headline" style="width: 100%; font-size: 1.17em">{{$t('Scan Media')}}</div>
      </v-card-title>
      <v-card-text>
        <v-alert type="warning" colored-border border="left" v-if="showMediaInfoWarning" dense>
          {{$t('Warning: Mediainfo CLI Path is not set_ Please go to')}}
          <a v-on:click="openSettings">{{$t('Settings')}}</a> {{$t('and provide one_ You can get Mediainfo CLI from')}} <a v-on:click="openMediaArea">www.mediaarea.net</a>. {{$t('Alternatively you can use Mediainfo-RAR from')}} <a v-on:click="openLundman">http://lundman.net</a>.
        </v-alert>

        <v-radio-group v-model="radioGroup">
          <v-radio v-bind:label="$t('Quick Scan')" v-bind:value="1" color="dark-grey"></v-radio>
          <v-radio v-bind:label="$t('Complete Rescan')" v-bind:value="2" color="dark-grey"></v-radio>
        </v-radio-group>

        <div v-if="radioGroup == 1">
          <ul>
            <li>{{$t('Filescan in every Source Path')}}</li>
            <li>{{$t('If a file is missing, remove it from the collection')}}</li>
            <li>{{$t('If a new file is found, gather IMDB and mediainfo metadata')}}</li>
            <li>{{$t("If a file is already known, don't gather any metadata")}}</li>
          </ul>
        </div>

        <div v-if="radioGroup == 2">
          <ul>
            <li>{{$t('Filescan in every Source Path')}}</li>
            <li>{{$t('If a file is missing, remove it from the collection')}}</li>
            <li>{{$t('If a file is new or already known, gather IMDB and mediainfo metadata')}}</li>
            <li>{{$t('This can take a while depending on your collection and internet connection')}}</li>
          </ul>
        </div>

        <v-expansion-panels accordion style="margin-top: 16px">
          <v-expansion-panel style="padding: 0px!important">
            <v-expansion-panel-header
              style="padding: 8px!important"
            >{{$t('IMDB Scraper Options')}} {{imdbOptionsTitle}}</v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-col>
                <v-checkbox
                  v-for="userScanOption in $shared.userScanOptions"
                  v-bind:key="userScanOption.key"
                  v-model="userScanOption.enabled"
                  v-bind:label="userScanOption.description"
                  style="margin: 0px"
                  color="dark-grey"
                ></v-checkbox>
              </v-col>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>

        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <span v-on="on">
              <v-checkbox
                v-model="performCheck"
                label="Perform an IMDB Scraper Check before Scan"
                color="dark-grey"
              ></v-checkbox>
            </span>
          </template>
          <span>{{$t('{appName} scrapes imdb_com website data in order to build up the database_ If imdb_com changes their website this process may fail in some aspects_ This scraper check will identify potential problems_', {appName: $t('appName')})}}</span>
        </v-tooltip>

        <div style="height: 16px"></div>

        <v-alert
          type="warning"
          colored-border
          border="left"
          v-if="missingSourcePaths && missingSourcePaths.length > 0"
          dense
        >
          {{$t('Warning: the following source paths are currently not available and all entries will be removed! (check Settings)')}}:
          <ul>
            <li v-for="msp in missingSourcePaths" v-bind:key="msp.id_SourcePaths">{{msp.Path}}</li>
          </ul>
        </v-alert>
      </v-card-text>

      <v-card-actions>
        <v-col sm="12">
          <v-row style="margin-top: 8px">
            <v-btn
              class="xs-fullwidth"
              color="secondary"
              v-on:click.native="onCloseClick"
              style="margin-left: 8px;"
            >{{$t('Cancel')}}</v-btn>
            <v-btn
              class="xs-fullwidth"
              v-bind:color="(missingSourcePaths && missingSourcePaths.length > 0) ? 'red' : 'primary'"
              v-on:click.native="onOKClick"
              v-bind:loading="isLoading"
              style="margin-left: 8px;"
            >
              <span v-if="!missingSourcePaths || missingSourcePaths.length == 0">{{$t('OK')}}</span>
              <span v-if="missingSourcePaths && missingSourcePaths.length > 0">{{$t('OK, I take the risk')}}</span>
            </v-btn>
          </v-row>
        </v-col>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
const logger = require("loglevel");

import * as store from "@/store";

const { shell } = require("electron").remote;

// import { eventBus } from "@/main";

export default {
  props: ["show"],

  data() {
    return {
      isLoading: true,
      radioGroup: 1,
      missingSourcePaths: [],
      showMediaInfoWarning: false,
      performCheck: true
    };
  },

  computed: {
    imdbOptionsTitle() {
      logger.log("imdbOptionsTitle START");

      if (
        this.$shared.userScanOptions.findIndex(
          scanOption => !scanOption.enabled
        ) === -1
      ) {
        return `(${this.$t('ALL')})`;
      }

      if (
        this.$shared.userScanOptions.findIndex(
          scanOption => scanOption.enabled
        ) === -1
      ) {
        return `(${this.$t('NONE')})`;
      }

      return (
        "(" +
        this.$shared.userScanOptions.filter(scanOption => scanOption.enabled)
          .length +
        "/" +
        this.$shared.userScanOptions.length +
        ")"
      );
    }
  },

  methods: {
    onCloseClick() {
      this.$emit("cancel");
    },

    onOKClick() {
      this.$emit("ok", {
        radioGroup: this.radioGroup,
        performCheck: this.performCheck
      });
    },

    async init() {
      this.isLoading = true;

      store.resetUserScanOptions();

      this.missingSourcePaths = await store.findMissingSourcePaths();

      logger.log("this.missingSourcePaths:", this.missingSourcePaths);

      this.showMediaInfoWarning = (await store.getSetting("MediainfoPath"))
        ? false
        : true;

      this.isLoading = false;
    },

    openSettings() {
      this.$emit("cancel");
      this.$router.push("/settings");
    },

    openMediaArea() {
      shell.openExternal(`https://mediaarea.net/en/MediaInfo`);
    },

    openLundman() {
      shell.openExternal(`http://lundman.net/wiki/index.php/Mediainfo-rar`);
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
</style>
