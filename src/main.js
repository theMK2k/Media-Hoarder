import Vue from 'vue'
import App from './App.vue'
import Vuetify from 'vuetify'
import '@mdi/font/css/materialdesignicons.css'

import 'vuetify/dist/vuetify.min.css'

Vue.use(Vuetify)

Vue.config.productionTip = false

export const eventBus = new Vue({
});



new Vue({
	vuetify: new Vuetify({ iconfont: 'mdi' }),
	render: h => h(App),
}).$mount('#app')
