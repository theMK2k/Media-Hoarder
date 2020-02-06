<template>
  <v-dialog
    v-model="show"
    persistent
    max-width="1000px"
    v-on:keydown.escape="onEscapePressed"
    v-on:keydown.enter="onEnterPressed"
  >
    <v-card>
      <v-card-title>
        <div class="headline" style="width: 100%; font-size: 1.17em">{{ title }}</div>
      </v-card-title>

      <div style="margin-left: 24px">
        <div class="subtitle">{{ movieName }}</div>

        <v-radio-group v-model="chosenMethod">
          <!-- LISTS COMBOBOX -->
          <v-row v-if="allowUseExistingLists">
            <!-- v-if="lists && lists.length > 0" style="width: 100%" -->
            <v-radio
              value="useExistingLists"
              label="Existing List:"
              color="dark-grey"
              style="margin-left: 8px; width: 140px; margin-top: -16px;"
            ></v-radio>
            <v-select
              solo
              v-bind:items="lists"
              item-text="Name"
              item-value="id_Lists"
              v-bind:disabled="chosenMethod != 'useExistingLists'"
              v-model="chosen_id_Lists"
            ></v-select>
          </v-row>

          <!-- NEW LIST TEXT INPUT -->
          <v-row v-if="allowCreateNewList">
            <v-radio
              value="createNewList"
              label="New List:"
              color="dark-grey"
              style="margin-left: 8px; width: 140px; margin-top: -16px;"
            ></v-radio>
            <v-text-field
              v-model="newListName"
              v-bind:disabled="chosenMethod != 'createNewList'"
              v-on:keydown.enter="onListNameEnter"
              style="margin-top: -12px"
            ></v-text-field>
          </v-row>
        </v-radio-group>
      </div>

      <v-card-actions>
        <v-btn
          class="xs-fullwidth"
          color="secondary"
          v-on:click.native="onButtonClick('cancel')"
        >CANCEL</v-btn>
        <v-btn
          v-bind:disabled="!canConfirm"
          class="xs-fullwidth"
          color="primary"
          v-on:click.native="onButtonClick('ok')"
        >OK</v-btn>
        <!-- v-bind:disabled="enterTextValue && !textValueEmptyAllowed && !textValueLocal" -->
        <!-- </v-row> -->
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
// import Vue from "vue";
// import router from "@/router"; // workaround in order to access router.app.$t
const logger = require("loglevel");

import { eventBus } from "@/main";

export default {
  props: [
    "show",
    "title",
    "movie",
    "lists",
    "allowUseExistingLists",
    "allowCreateNewList"
  ],

  data() {
    return {
      chosenMethod: "useExistingLists",
      chosen_id_Lists: null,
      newListName: null
    };
  },

  computed: {
    movieName() {
      return this.movie ? this.movie.Name : "<none>";
    },

    canConfirm() {
      return ((this.chosenMethod == 'useExistingLists' && this.chosen_id_Lists > 0) || (this.chosenMethod == 'createNewList' && this.newListName && this.newListName.trim().length > 0));
    }
  },

  watch: {},

  methods: {
    resetData() {
      this.chosen_id_Lists = null;
      this.newListName = null;
    },

    onListNameEnter() {
      if (!this.newListName) {
        return;
      }

      this.onButtonClick("ok");
    },

    onButtonClick(eventName) {
      this.$emit(eventName, {
        chosenMethod: this.chosenMethod,
        chosen_id_Lists: this.chosen_id_Lists,
        newListName: this.newListName
      });
      this.resetData();
    },

    onEnterPressed() {
      if (!this.canConfirm) {
        return;
      }

      this.onButtonClick('ok');
    },

    onEscapePressed() {
      this.onButtonClick('cancel');
    }
  },

  // ### Lifecycle Hooks ###
  created() {
    eventBus.$on("listDialogSetChosenMethod", value => {
      this.chosenMethod = value;
    });
    eventBus.$on("listDialogSetChosenList", id_Lists => {
      logger.log("set chosen id_Lists:", id_Lists);
      this.chosen_id_Lists = id_Lists;
    });
  }
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
