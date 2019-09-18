<template>
  <div>
    <h1>Home</h1>

    <v-btn v-for="item in items" v-bind:key="item.id" v-on:click="onItemClick(item.id)" class="ma-2" tile outlined color="primary">
      <v-icon left>{{item.icon}}</v-icon>{{item.text}}
    </v-btn>
  </div>
</template>

<script>
export default {
  data: () => ({
    items: [
      { icon: "mdi-movie", text: "My Movies", id: "movies" },
      { icon: "mdi-television", text: "My TV Shows", id: "tv" },
      { icon: "mdi-settings", text: "Settings", id: "settings" }
    ]
  }),

  methods: {
    onItemClick(itemid) {
			if (!itemid) {
				return;
			}

			if (itemid == 'movies') {
	      return this.$router.push("/medialist/movies");
			}

			if (itemid == 'tv') {
	      return this.$router.push("/medialist/tv");
			}

			if (itemid == 'settings') {
	      return this.$router.push("/settings");
			}
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
