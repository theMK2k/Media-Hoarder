import mitt from "mitt";
import remote from "@electron/remote";
import logger from "@helpers/logger.js";

// Create the mitt event emitter
const emitter = mitt();

// Progress bar helper (uses Electron remote)
const setProgressBar = (value) => {
  // value 0.00 - 1.00: absolute progress
  // value > 1.00: marquee
  // value < 0: off
  logger.log("[setProgressBar] setProgressBar value:", value);

  if (!value && value !== 0) {
    return;
  }

  remote.getCurrentWindow().setProgressBar(value);
};

// Create eventBus object with methods attached for backward compatibility
// This allows code to use eventBus.scanInfoShow() instead of emitScanInfoShow()
export const eventBus = {
  // Core mitt methods
  on: emitter.on,
  off: emitter.off,
  emit: emitter.emit,
  all: emitter.all,

  // Helper methods to match the old Vue 2 event bus API pattern ($emit style)
  dbInitialized: () => emitter.emit("dbInitialized"),
  scanInfoOff: () => emitter.emit("scanInfoOff"),
  scanInfoShow: (headerOriginal, details, rescanETA) =>
    emitter.emit("scanInfoShow", { headerOriginal, details, rescanETA }),
  showSnackbar: (color, textOrErrorObject, timeout = 6000) =>
    emitter.emit("showSnackbar", { color, textOrErrorObject, timeout }),
  showScanProcessFinishedSnackbar: (id_Scan_Processes, details) =>
    emitter.emit("showScanProcessFinishedSnackbar", { id_Scan_Processes, details }),
  rescanStarted: () => emitter.emit("rescanStarted"),
  rescanStopped: () => emitter.emit("rescanStopped"),
  searchTextChanged: (searchText) => emitter.emit("searchTextChanged", { searchText }),
  refetchMedia: ({ setPage, $t, setFilter, dontLoadFiltersFromDb }) =>
    emitter.emit("refetchMedia", { setPage, $t, setFilter, dontLoadFiltersFromDb }),
  refetchFilters: (setFilter, specificFilterNames) =>
    emitter.emit("refetchFilters", { setFilter, specificFilterNames }),
  refetchSpecificFilter: (setFilter) => emitter.emit("refetchSpecificFilter", setFilter),
  initListDialog: () => emitter.emit("initListDialog"),
  listDialogSetChosenMethod: (value) => emitter.emit("listDialogSetChosenMethod", value),
  listDialogSetCreateNewList: (value) => emitter.emit("listDialogSetCreateNewList", value),
  listDialogSetChosenList: (id_Lists) => emitter.emit("listDialogSetChosenList", id_Lists),
  filtersChanged: () => emitter.emit("filtersChanged"),
  showLoadingOverlay: (value) => emitter.emit("showLoadingOverlay", value),
  showSidebarLoadingOverlay: (value) => emitter.emit("showSidebarLoadingOverlay", value),
  setFilter: (setFilter) => emitter.emit("setFilter", setFilter),
  showPersonDialog: (credit) => emitter.emit("showPersonDialog", credit),
  showCompanyDialog: (company) => emitter.emit("showCompanyDialog", company),
  showPlotKeywordDialog: (plotKeyword) => emitter.emit("showPlotKeywordDialog", plotKeyword),
  showFilmingLocationDialog: (filmingLocation) => emitter.emit("showFilmingLocationDialog", filmingLocation),
  personDialogConfirm: (result) => emitter.emit("personDialogConfirm", result),
  companyDialogConfirm: (result) => emitter.emit("companyDialogConfirm", result),
  plotKeywordDialogConfirm: (result) => emitter.emit("plotKeywordDialogConfirm", result),
  filmingLocationDialogConfirm: (result) => emitter.emit("filmingLocationDialogConfirm", result),
  chatGPTDialogConfirm: (result) => emitter.emit("chatGPTDialogConfirm", result),
  openVersionDialog: () => emitter.emit("openVersionDialog"),
  openCheckIMDBScraperDialog: (settings) => emitter.emit("openCheckIMDBScraperDialog", settings),
  setSearchText: (value) => emitter.emit("setSearchText", value),
  rescanFinished: ({ hasChanges }) => emitter.emit("rescanFinished", { hasChanges }),
  openChatGPTDialog: () => emitter.emit("openChatGPTDialog"),
  lastAccessUpdated: () => emitter.emit("lastAccessUpdated"),

  // Progress bar
  setProgressBar,
};

// Also export standalone helper functions for those who prefer that style
export const emitDbInitialized = eventBus.dbInitialized;
export const emitScanInfoOff = eventBus.scanInfoOff;
export const emitScanInfoShow = eventBus.scanInfoShow;
export const emitShowSnackbar = eventBus.showSnackbar;
export const emitShowScanProcessFinishedSnackbar = eventBus.showScanProcessFinishedSnackbar;
export const emitRescanStarted = eventBus.rescanStarted;
export const emitRescanStopped = eventBus.rescanStopped;
export const emitSearchTextChanged = eventBus.searchTextChanged;
export const emitRefetchMedia = eventBus.refetchMedia;
export const emitRefetchFilters = eventBus.refetchFilters;
export const emitRefetchSpecificFilter = eventBus.refetchSpecificFilter;
export const emitInitListDialog = eventBus.initListDialog;
export const emitListDialogSetChosenMethod = eventBus.listDialogSetChosenMethod;
export const emitListDialogSetCreateNewList = eventBus.listDialogSetCreateNewList;
export const emitListDialogSetChosenList = eventBus.listDialogSetChosenList;
export const emitFiltersChanged = eventBus.filtersChanged;
export const emitShowLoadingOverlay = eventBus.showLoadingOverlay;
export const emitShowSidebarLoadingOverlay = eventBus.showSidebarLoadingOverlay;
export const emitSetFilter = eventBus.setFilter;
export const emitShowPersonDialog = eventBus.showPersonDialog;
export const emitShowCompanyDialog = eventBus.showCompanyDialog;
export const emitShowPlotKeywordDialog = eventBus.showPlotKeywordDialog;
export const emitShowFilmingLocationDialog = eventBus.showFilmingLocationDialog;
export const emitPersonDialogConfirm = eventBus.personDialogConfirm;
export const emitCompanyDialogConfirm = eventBus.companyDialogConfirm;
export const emitPlotKeywordDialogConfirm = eventBus.plotKeywordDialogConfirm;
export const emitFilmingLocationDialogConfirm = eventBus.filmingLocationDialogConfirm;
export const emitChatGPTDialogConfirm = eventBus.chatGPTDialogConfirm;
export const emitOpenVersionDialog = eventBus.openVersionDialog;
export const emitOpenCheckIMDBScraperDialog = eventBus.openCheckIMDBScraperDialog;
export const emitSetSearchText = eventBus.setSearchText;
export const emitRescanFinished = eventBus.rescanFinished;
export const emitOpenChatGPTDialog = eventBus.openChatGPTDialog;
export const emitLastAccessUpdated = eventBus.lastAccessUpdated;
export { setProgressBar };
