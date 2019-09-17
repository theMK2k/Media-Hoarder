<template>
  <div>
    <h1>Settings</h1>

    <h3>Movies - Source Paths</h3>
    <v-btn text small color="primary" v-on:click="addSource('movies')">Add Source Path</v-btn>

    <h3>TV - Sourcepaths</h3>
    <v-btn text small color="primary" v-on:click="addSource('tv')">Add Source Path</v-btn>
  </div>
</template>

<script>
const { dialog } = require("electron").remote;

export default {
  methods: {
    addSource(mediaType) {
      dialog.showOpenDialog(
        {
          properties: ["openDirectory"]
        },
        folderposition => {
					if (!folderposition || folderposition.length === 0)  {
						return;
					}
					
					console.log('folderposition:', folderposition[0]);
        }
      );
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
