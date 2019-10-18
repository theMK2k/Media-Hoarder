import Vue from 'vue'

const shared = new Vue({
	data: {
		message: 'my global message',
		filterSourcePaths: [],
		filterGenres: [],
		filterAgeRatings: [],
		filterRatings: [],
		filterLists: [],
		filterParentalAdvisory: {
			Nudity: [],
			Violence: [],
			Profanity: [],
			Alcohol: [],
			Frightening: [],
		},
		filterPersons: [],
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