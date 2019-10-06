<template>
  <v-dialog v-model="show" persistent max-width="1000px">
    <v-card>
      <v-card-title>
        <div class="headline" style="width: 100%; font-size: 1.17em">{{ title }}</div>
      </v-card-title>

      <div style="margin-left: 24px">
        <div class="subtitle">{{ movieName }}</div>
        <v-row>
          <!-- v-if="lists && lists.length > 0" style="width: 100%" -->
          <v-checkbox
            v-model="useExistingList"
            label="Existing List:"
            color="dark-grey"
            style="margin-left: 8px; width: 140px"
          ></v-checkbox>
          <v-select
            solo
            dense
            v-bind:items="lists"
            item-text="Name"
            item-value="id_Lists"
            v-bind:disabled="!useExistingList"
            v-model="chosen_id_Lists"
          ></v-select>
        </v-row>
        <v-row>
          <v-checkbox
            v-model="createNewList"
            label="New List:"
            color="dark-grey"
            style="margin-left: 8px; width: 140px"
          ></v-checkbox>
          <v-text-field v-model="newListName" v-bind:disabled="!createNewList"></v-text-field>
        </v-row>
      </div>

      <v-card-actions>
        <v-btn
          class="xs-fullwidth"
          color="secondary"
          v-on:click.native="onButtonClick('cancel')"
        >CANCEL</v-btn>
        <v-btn
          v-bind:disabled="!((useExistingList && chosen_id_Lists > 0) || (createNewList && newListName && newListName.trim().length > 0))"
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

// import { eventBus } from "@/main";

export default {
  props: ["show", "title", "movie", "lists"],

  data() {
    return {
      useExistingList: false,
      createNewList: false,
      chosen_id_Lists: null,
      newListName: null
    };
  },

  computed: {
    movieName() {
      return this.movie ? this.movie.Name : "<none>";
    }
  },

  watch: {
    useExistingList() {
      this.createNewList = !this.useExistingList;
    },

    createNewList() {
      this.useExistingList = !this.createNewList;
    }
  },

  methods: {
    resetData() {
      this.useExistingList = false;
      this.createNewList = false;
      this.chosen_id_Lists = null;
      this.newListName = null;
    },

    onButtonClick(eventName) {
      this.$emit(eventName, {
				useExistingList: this.useExistingList,
				createNewList: this.createNewList,
				chosen_id_Lists: this.chosen_id_Lists,
				newListName: this.newListName
			});
      this.resetData();
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
