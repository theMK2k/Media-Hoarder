// HACK: Suppress Chromium passive event listener warnings caused by Vuetify 3 internals.
// This forces passive: true on touch/wheel events. If scroll-prevention breaks in dialogs
// or menus, this is the likely culprit. See CLAUDE.md for details.
const _origAEL = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function (type, listener, options) {
  if (type === "touchstart" || type === "touchmove" || type === "wheel" || type === "mousewheel") {
    const opts = typeof options === "object" ? { ...options, passive: true } : { capture: !!options, passive: true };
    return _origAEL.call(this, type, listener, opts);
  }
  return _origAEL.call(this, type, listener, options);
};

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
