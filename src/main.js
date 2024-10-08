import Vue from "vue";
import App from "@/App.vue";

const remote = require("@electron/remote");

const logger = require("./helpers/logger");

import router from "@/router";
import { shared } from "@/shared";
import i18n from "./i18n";
import vuetify from "@/plugins/vuetify";

import "@babel/polyfill";
import "roboto-fontface/css/roboto/roboto-fontface.css";
import "@mdi/font/css/materialdesignicons.css";

Vue.use(shared);

Vue.config.productionTip = false;

export const eventBus = new Vue({
  methods: {
    dbInitialized() {
      this.$emit("dbInitialized");
    },

    scanInfoOff() {
      this.$emit("scanInfoOff");
    },

    scanInfoShow(headerOriginal, details, rescanETA) {
      // logger.log('[scanInfoShow]', {header, details});
      this.$emit("scanInfoShow", { headerOriginal, details, rescanETA });
    },

    showSnackbar(color, textOrErrorObject, timeout) {
      timeout = isNaN(timeout) ? 6000 : timeout; // 6s default timeout
      this.$emit("showSnackbar", { color, textOrErrorObject, timeout });
    },

    showScanProcessFinishedSnackbar(id_Scan_Processes, details) {
      this.$emit("showScanProcessFinishedSnackbar", { id_Scan_Processes, details });
    },

    rescanStarted() {
      this.$emit("rescanStarted");
    },

    rescanStopped() {
      this.$emit("rescanStopped");
    },

    searchTextChanged(searchText) {
      this.$emit("searchTextChanged", { searchText });
    },

    refetchMedia({ setPage, $t, setFilter, dontLoadFiltersFromDb }) {
      this.$emit("refetchMedia", { setPage, $t, setFilter, dontLoadFiltersFromDb });
    },

    /**
     *
     * @param {Object} setFilter (optional)
     * @param {Array} specificFilterNames (optional)
     */
    refetchFilters(setFilter, specificFilterNames) {
      this.$emit("refetchFilters", { setFilter, specificFilterNames });
    },

    refetchSpecificFilter(setFilter) {
      this.$emit("refetchSpecificFilter", setFilter);
    },

    initListDialog() {
      this.$emit("initListDialog");
    },

    listDialogSetChosenMethod(value) {
      this.$emit("listDialogSetChosenMethod", value);
    },

    listDialogSetCreateNewList(value) {
      this.$emit("listDialogSetCreateNewList", value);
    },

    listDialogSetChosenList(id_Lists) {
      this.$emit("listDialogSetChosenList", id_Lists);
    },

    filtersChanged() {
      this.$emit("filtersChanged");
    },

    showLoadingOverlay(value) {
      this.$emit("showLoadingOverlay", value);
    },

    showSidebarLoadingOverlay(value) {
      this.$emit("showSidebarLoadingOverlay", value);
    },

    setFilter(setFilter) {
      this.$emit("setFilter", setFilter);
    },

    showPersonDialog(credit) {
      this.$emit("showPersonDialog", credit);
    },

    showCompanyDialog(company) {
      this.$emit("showCompanyDialog", company);
    },

    showPlotKeywordDialog(plotKeyword) {
      this.$emit("showPlotKeywordDialog", plotKeyword);
    },

    showFilmingLocationDialog(filmingLocation) {
      this.$emit("showFilmingLocationDialog", filmingLocation);
    },

    personDialogConfirm(result) {
      this.$emit("personDialogConfirm", result);
    },

    companyDialogConfirm(result) {
      this.$emit("companyDialogConfirm", result);
    },

    plotKeywordDialogConfirm(result) {
      this.$emit("plotKeywordDialogConfirm", result);
    },

    filmingLocationDialogConfirm(result) {
      this.$emit("filmingLocationDialogConfirm", result);
    },

    chatGPTDialogConfirm(result) {
      this.$emit("chatGPTDialogConfirm", result);
    },

    openVersionDialog() {
      this.$emit("openVersionDialog");
    },

    openCheckIMDBScraperDialog(settings) {
      this.$emit("openCheckIMDBScraperDialog", settings);
    },

    setSearchText(value) {
      this.$emit("setSearchText", value);
    },

    setProgressBar(value) {
      // value 0.00 - 1.00: absolute progress
      // value > 1.00: marquee
      // value < 0: off
      logger.log("[setProgressBar] setProgressBar value:", value);

      if (!value && value !== 0) {
        return;
      }

      remote.getCurrentWindow().setProgressBar(value);
    },

    rescanFinished({ hasChanges }) {
      this.$emit("rescanFinished", { hasChanges });
    },

    openChatGPTDialog() {
      this.$emit("openChatGPTDialog");
    },
  },
});

new Vue({
  i18n,
  router,
  vuetify,
  render: (h) => h(App),
}).$mount("#app");
