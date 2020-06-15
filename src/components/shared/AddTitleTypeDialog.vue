<template>
  <v-dialog v-model="show" persistent max-width="1000px" v-on:keydown.escape="onCloseClick">
    <v-card dark flat v-bind:ripple="false">
        <v-card-title>
        <div class="headline" style="width: 100%; font-size: 1.17em">{{$t('Add Title Type')}}</div>
        </v-card-title>

        <mk-title-type v-for="item in filteredItems" v-bind:key="item.TitleType" v-bind:value="item" v-bind:showAdd="true" v-on:addTitleType="onAddTitleType"></mk-title-type>

      <v-card-actions>
        <v-btn class="xs-fullwidth" color="secondary" small v-on:click.native="onCloseClick()">{{$t('Close')}}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import * as store from "@/store";
// import * as helpers from "@/helpers/helpers";
// const logger = require("loglevel");

import { eventBus } from "@/main";

import TitleType from "@/components/shared/TitleType.vue";

export default {
  props: ["show"],

  components: {
    "mk-title-type": TitleType
  },

  data() {
    return {
      items: []
    };
  },

  computed: {
    filteredItems() {
      return this.items.filter(item => {
        if (
          this.$shared.imdbTitleTypesWhitelist.findIndex(
            used => used.TitleType === item.TitleType
          ) !== -1
        ) {
          return false;
        }

        return true;
      });
    }
  },

  methods: {
    onCloseClick() {
      this.$emit("close");
    },

    onAddTitleType(value) {
        this.$emit("addTitleType", value);
    },

    async init() {
      if (this.items.length === 0) {
        try {
          this.items = await store.fetchIMDBTitleTypes();
        } catch (e) {
          eventBus.showSnackbar("error", e);
        }
      }
    }
  },

  created() {}
};
</script>

<style scoped>
.v-messages {
  min-height: 0px !important;
}
</style>
