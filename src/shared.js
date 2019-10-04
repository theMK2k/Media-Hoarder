import Vue from 'vue'

const shared = new Vue({
	data: {
		message: 'my global message',
		filterSourcePaths: [],
		filterGenres: [],
		filterAgeRatings: [],
		filterRatings: [],
	}
});

shared.install = function () {
	Object.defineProperty(Vue.prototype, '$shared', {
		get() { return shared }
	})
};

export {
	shared
}