import Vue from 'vue'
import Router from 'vue-router'

import Main from '@/components/Main'
import Settings from '@/components/Settings'

const logger = require('loglevel')

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'main',
			component: Main,
			props: true
		},

		{
			path: '/main/:mediatype',
			name: 'mainmediatype',
			component: Main,
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
