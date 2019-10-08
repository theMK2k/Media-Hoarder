import Vue from 'vue'
import App from '@/App.vue'
import Vuetify from 'vuetify'
import '@mdi/font/css/materialdesignicons.css'

// const logger = require('loglevel');

import 'vuetify/dist/vuetify.min.css'

import router from '@/router'
import { shared } from '@/shared'

Vue.use(Vuetify)
Vue.use(shared);

Vue.config.productionTip = false

export const eventBus = new Vue({
	methods: {
		scanInfoOff() {
			this.$emit('scanInfoOff');
		},

		scanInfoShow(header, details) {
			// logger.log('scanInfoShow:', {header, details});
			this.$emit('scanInfoShow', {header, details});
		},

		showSnackbar(color, timeout, textOrErrorObject) {
			this.$emit('showSnackbar', { color, timeout, textOrErrorObject });
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

		refetchMedia() {
			this.$emit('refetchMedia');
		},

		refetchFilters() {
			this.$emit('refetchFilters');
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
	}
});

new Vue({
	router,
	vuetify: new Vuetify({ iconfont: 'mdi' }),
	render: h => h(App),
}).$mount('#app')