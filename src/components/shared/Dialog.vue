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
        <div class="headline" style="width: 100%; font-size: 1.17em">
          {{ title }}
        </div>
      </v-card-title>

      <v-card-text>
        {{ question }}
        <v-text-field
          autofocus
          v-if="enterTextValue"
          v-bind:label="textValueCaption"
          v-model="textValueLocal"
        ></v-text-field>
      </v-card-text>

      <v-card-actions>
        <!-- <v-row> -->
        <div v-if="dontAskAgain">
          <v-row>
            <v-checkbox
              v-model="dontAskAgainValue"
              style="margin: 3px"
              hide-details
            ></v-checkbox>
            <span
              style="padding: 8px 8px; cursor: pointer"
              v-on:click="dontAskAgainValue = !dontAskAgainValue"
              >{{ dontAskAgain }}</span
            >
          </v-row>
        </div>

        <!-- <v-spacer></v-spacer> -->

        <v-btn
          class="xs-fullwidth"
          v-if="cancel"
          v-bind:color="cancelColor"
          v-on:click.native="onButtonClick('cancel')"
          >{{ cancel }}</v-btn
        >
        <v-btn
          class="xs-fullwidth"
          v-if="no"
          v-bind:color="noColor"
          v-on:click.native="onButtonClick('no')"
          >{{ no }}</v-btn
        >
        <v-btn
          class="xs-fullwidth"
          v-if="yes"
          v-bind:disabled="
            enterTextValue && !textValueEmptyAllowed && !textValueLocal
          "
          v-bind:color="yesColor ? yesColor : 'primary'"
          v-on:click.native="onButtonClick('yes')"
          >{{ yes }}</v-btn
        >
        <v-btn
          class="xs-fullwidth"
          v-if="ok"
          v-bind:disabled="
            enterTextValue && !textValueEmptyAllowed && !textValueLocal
          "
          v-bind:color="okColor ? okColor : 'primary'"
          v-on:click.native="onButtonClick('ok')"
          >{{ ok }}</v-btn
        >
        <!-- </v-row> -->
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
// import Vue from "vue";
// import router from "@/router"; // workaround in order to access router.app.$t
const logger = require("../../helpers/logger");

// import { eventBus } from "@/main";

export default {
  props: [
    "show",
    "title",
    "question",
    "yes",
    "no",
    "ok",
    "cancel",
    "yesColor",
    "noColor",
    "okColor",
    "cancelColor",
    "dontAskAgain",
    "enterTextValue",
    "textValueCaption",
    "textValueEmptyAllowed",
  ],

  data() {
    return {
      dontAskAgainValue: false,
      textValueLocal: null,
    };
  },

  methods: {
    resetData() {
      this.dontAskAgainValue = false;
      this.textValueLocal = null;
    },

    onButtonClick(eventName) {
      this.$emit(eventName, {
        dontAskAgain: this.dontAskAgainValue,
        textValue: this.textValueLocal,
      });

      this.resetData();
    },

    initTextValue(value) {
      logger.log("initTextValueLocal value:", value);
      this.textValueLocal = value;
    },

    onEnterPressed() {
      if (
        this.enterTextValue &&
        !this.textValueEmptyAllowed &&
        !this.textValueLocal
      ) {
        return;
      }

      if (this.ok) {
        this.onButtonClick("ok");
      }

      if (this.yes) {
        this.onButtonClick("yes");
      }
    },

    onEscapePressed() {
      if (this.cancel) {
        return this.onButtonClick("cancel");
      }

      if (this.no) {
        return this.onButtonClick("no");
      }
    },
  },

  // ### Lifecycle Hooks ###
  created() {},
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
