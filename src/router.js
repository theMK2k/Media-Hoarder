import { createRouter, createWebHistory } from "vue-router";

import Home from "@/components/Home";
import MediaList from "@/components/MediaList";
import Settings from "@/components/Settings";

// const logger = require('loglevel')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: Home,
      props: true,
    },

    {
      path: "/medialist/:mediatype/:Series_id_Movies_Owner",
      name: "medialist-series-episodes",
      component: MediaList,
      props: true,
    },

    {
      path: "/medialist/:mediatype",
      name: "medialist",
      component: MediaList,
      props: true,
    },

    {
      path: "/settings",
      name: "settings",
      component: Settings,
    },

    // Vue Router 4: catch-all route syntax changed from "*" to "/:pathMatch(.*)*"
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});

export default router;
