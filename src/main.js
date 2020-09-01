import Vue from 'vue';
import App from '@/App.vue';
import Vuetify from 'vuetify';
import '@mdi/font/css/materialdesignicons.css';

const logger = require('loglevel');

import 'vuetify/dist/vuetify.min.css'

const remote = require("electron").remote;

import router from '@/router'
import { shared } from '@/shared'
import i18n from './i18n'

Vue.use(Vuetify)

Vue.use(shared);

Vue.config.productionTip = false

export const eventBus = new Vue({
    i18n,

    methods: {
		dbInitialized() {
			this.$emit('dbInitialized');
		},
		
		scanInfoOff() {
			this.$emit('scanInfoOff');
		},

		scanInfoShow(header, details) {
			// logger.log('scanInfoShow:', {header, details});
			this.$emit('scanInfoShow', {header, details});
		},

		showSnackbar(color, textOrErrorObject, timeout) {
			timeout = timeout || 6000;	// 6s default timeout
			this.$emit('showSnackbar', { color, textOrErrorObject, timeout });
		},

		rescanStarted() {
			this.$emit('rescanStarted');
		},
		
		rescanStopped() {
			this.$emit('rescanStopped');
		},

		searchTextChanged(searchText) {
			this.$emit('searchTextChanged', { searchText });
		},

		refetchMedia(setPage, $t) {
			this.$emit('refetchMedia', setPage, $t);
		},

		refetchFilters(setFilter) {
			this.$emit('refetchFilters', setFilter);
		},

		initListDialog() {
			this.$emit('initListDialog');
		},

		listDialogSetChosenMethod(value) {
			this.$emit('listDialogSetChosenMethod', value);
		},

		listDialogSetCreateNewList(value) {
			this.$emit('listDialogSetCreateNewList', value);
		},

		listDialogSetChosenList(id_Lists) {
			this.$emit('listDialogSetChosenList', id_Lists);
		},

		filtersChanged() {
			this.$emit('filtersChanged');
		},

		showLoadingOverlay(value) {
			this.$emit('showLoadingOverlay', value);
		},

		setFilter(setFilter) {
			this.$emit('setFilter', setFilter);
		},

		showPersonDialog(credit) {
			this.$emit('showPersonDialog', credit);
		},

		showCompanyDialog(company) {
			this.$emit('showCompanyDialog', company);
		},

		showPlotKeywordDialog(plotKeyword) {
			this.$emit('showPlotKeywordDialog', plotKeyword);
		},

		showFilmingLocationDialog(filmingLocation) {
			this.$emit('showFilmingLocationDialog', filmingLocation);
		},

		personDialogConfirm(result) {
			this.$emit('personDialogConfirm', result);
		},

		companyDialogConfirm(result) {
			this.$emit('companyDialogConfirm', result);
		},

		plotKeywordDialogConfirm(result) {
			this.$emit('plotKeywordDialogConfirm', result);
		},

		filmingLocationDialogConfirm(result) {
			this.$emit('filmingLocationDialogConfirm', result);
		},

		openVersionDialog() {
			this.$emit('openVersionDialog');
		},

		openCheckIMDBScraperDialog(settings) {
			this.$emit('openCheckIMDBScraperDialog', settings);
		},

		setProgressBar(value) {
			// value 0.00 - 1.00: absolute progress
			// value > 1.00: marquee
			// value < 0: off
			logger.log('setProgressBar value:', value);

			if (!value && value !== 0) {
				return;
			}

			remote.getCurrentWindow().setProgressBar(value);
		}
	}
});

new Vue({
	i18n,
	router,
	vuetify: new Vuetify({ iconfont: 'mdi' }),
	render: h => h(App),
}).$mount('#app')