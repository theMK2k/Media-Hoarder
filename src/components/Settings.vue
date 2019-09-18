<template>
  <div>
    <h1>Settings</h1>

    <h3>Movies - Source Paths</h3>
    <v-btn text small color="primary" v-on:click="addSource('movies')">Add Source Path</v-btn>

    <h3>TV - Sourcepaths</h3>
    <v-btn text small color="primary" v-on:click="addSource('tv')">Add Source Path</v-btn>

		<v-btn text small color="primary" v-on:click="openDevTools">Open DevTools</v-btn>
  </div>
</template>

<script>
const { dialog, BrowserWindow } = require("electron").remote;

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
		},
		
		openDevTools() {
			BrowserWindow.getFocusedWindow().webContents.openDevTools();
		}
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
