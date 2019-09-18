import Vue from 'vue'
import Router from 'vue-router'

import Home from '@/components/Home'
import MediaList from '@/components/MediaList'
import Settings from '@/components/Settings'

const logger = require('loglevel')

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'home',
			component: Home,
			props: true
		},

		{
			path: '/medialist/:mediatype',
			name: 'medialist',
			component: MediaList,
			props: true
		},

		{
			path: '/settings',
			name: 'settings',
			component: Settings,
		},

    { path: '*', redirect: '/' }	// catch all other routes which are not handled first, redirect to home
  ]
})
