import { createApp } from "vue";
import App from "@/App.vue";

import router from "@/router";
import { shared } from "@/shared";
import i18n from "./i18n";
import vuetify from "@/plugins/vuetify";

import "roboto-fontface/css/roboto/roboto-fontface.css";
import "@mdi/font/css/materialdesignicons.css";

// Re-export eventBus for backward compatibility with existing imports
export { eventBus } from "@/eventBus";

// Create Vue 3 app
const app = createApp(App);

// Global properties (replaces Vue.prototype)
app.config.globalProperties.$shared = shared;

// Use plugins
app.use(router);
app.use(i18n);
app.use(vuetify);

// Mount app
app.mount("#app");
