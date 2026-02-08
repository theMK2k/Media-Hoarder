<template>
  <v-dialog :model-value="show" @update:model-value="$emit('update:show', $event)" persistent max-width="1000px">
    <v-card>
      <v-card-title>
        <div class="text-h5" style="width: 100%; font-size: 1.17em">
          {{ title }}
        </div>
        <div class="subtitle">{{ movieName }}</div>
      </v-card-title>

      <v-card-text style="padding: 0px">
        <v-radio-group v-model="chosenMethod">
          <div style="width: 600px; margin-left: 12px">
            <!-- LISTS COMBOBOX -->
            <v-row v-if="allowUseExistingLists">
              <v-col cols="12" sm="4">
                <v-radio
                  value="useExistingLists"
                  v-bind:label="`${$t('Existing List')}:`"
                  color="mk-dark-grey"
                  style="margin-left: 8px"
                ></v-radio>
              </v-col>
              <v-col cols="12" sm="7">
                <v-select
                  variant="solo"
                  v-bind:items="lists"
                  item-title="Name"
                  item-value="id_Lists"
                  v-bind:disabled="chosenMethod != 'useExistingLists'"
                  v-model="chosen_id_Lists"
                  style="margin-top: -16px; width: max-content"
                ></v-select>
              </v-col>
            </v-row>

            <!-- NEW LIST TEXT INPUT -->
            <v-row v-if="allowCreateNewList">
              <v-col cols="12" sm="4">
                <v-radio
                  value="createNewList"
                  v-bind:label="`${$t('New List')}:`"
                  color="mk-dark-grey"
                  style="margin-left: 8px"
                ></v-radio>
              </v-col>
              <v-col cols="12" sm="7">
                <v-text-field
                  v-model="newListName"
                  variant="underlined"
                  v-bind:disabled="chosenMethod != 'createNewList'"
                  v-on:keydown.enter="onListNameEnter"
                  style="margin-top: -12px; width: 400px"
                ></v-text-field>
              </v-col>
            </v-row>
          </div>
        </v-radio-group>
      </v-card-text>

      <v-card-actions>
        <v-btn class="xs-fullwidth" color="secondary" v-on:click="onButtonClick('cancel')">{{
          $t("Cancel")
        }}</v-btn>
        <v-btn
          v-bind:disabled="!canConfirm"
          class="xs-fullwidth"
          color="primary"
          v-on:click="onButtonClick('ok')"
          >{{ $t("OK") }}</v-btn
        >
        <!-- v-bind:disabled="enterTextValue && !textValueEmptyAllowed && !textValueLocal" -->
        <!-- </v-row> -->
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
// import Vue from "vue";
// import router from "@/router"; // workaround in order to access router.app.$t
import logger from "@helpers/logger.js";

import { eventBus } from "@/eventBus.js";

export default {
  props: ["show", "title", "movie", "lists", "allowUseExistingLists", "allowCreateNewList"],

  emits: ["update:show"],

  data() {
    return {
      chosenMethod: "useExistingLists",
      chosen_id_Lists: null,
      newListName: null,
    };
  },

  computed: {
    movieName() {
      return this.movie ? this.movie.Name : "<none>";
    },

    canConfirm() {
      return (
        (this.chosenMethod == "useExistingLists" && this.chosen_id_Lists > 0) ||
        (this.chosenMethod == "createNewList" && this.newListName && this.newListName.trim().length > 0)
      );
    },
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
        newListName: this.newListName,
      });
      this.resetData();
    },

    onEnterPressed() {
      if (!this.canConfirm) {
        return;
      }

      this.onButtonClick("ok");
    },

    onEscapePressed() {
      this.onButtonClick("cancel");
    },
  },

  // ### Lifecycle Hooks ###
  created() {
    eventBus.on("listDialogSetChosenMethod", (value) => {
      this.chosenMethod = value;
    });
    eventBus.on("listDialogSetChosenList", (id_Lists) => {
      logger.log("[created] set chosen id_Lists:", id_Lists);
      this.chosen_id_Lists = id_Lists;
    });
  },

  beforeDestroy() {
    eventBus.off("listDialogSetChosenMethod");
    eventBus.off("listDialogSetChosenList");
  },
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

.v-input__control {
  min-width: 200px;
}

@media screen and (max-width: 599px) {
  .input-group--text-field {
    padding-left: 16px;
    padding-top: 0px;
  }
}
</style>
