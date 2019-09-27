import Vue from 'vue'
import App from '@/App.vue'
import Vuetify from 'vuetify'
import '@mdi/font/css/materialdesignicons.css'

// const logger = require('loglevel');

import 'vuetify/dist/vuetify.min.css'

import router from './router'

Vue.use(Vuetify)

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
		}
	}
});

new Vue({
	router,
	vuetify: new Vuetify({ iconfont: 'mdi' }),
	render: h => h(App),
}).$mount('#app')