<template>
  <div>
    <h1>
      <v-btn text v-on:click="$router.go(-1)">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>

      {{ mediatype.toUpperCase() }}
      <img v-bind:src="smallPosterImgSrc" alt="Poster Small" />
      <!-- "data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAAUA
    AAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO
      9TXL0Y4OHwAAAABJRU5ErkJggg=="-->
    </h1>
  </div>
</template>

<script>
import * as store from "@/store";
import { eventBus } from "@/main";
const logger = require("loglevel");

export default {
  data: () => ({
    smallPosterImgSrc: null
  }),
  
  props: ["mediatype"],


  methods: {
    loadSmallPoster() {
      (async () => {
        logger.log('loadSmallPoster start');
        const imgdata = await store.fetchCache('https://m.media-amazon.com/images/M/MV5BOTJlZmVhOTYtZTMwYi00NDY4LWIyMmEtNjRlZmJhZmFmNWNjXkEyXkFqcGdeQXVyMzQwNjY3MDU@._V1_SY500_CR0,0,353,500_AL_.jpg', '303_poster_small.jpg');
  
        if (!imgdata) {
          return null;
        }
  
        const data = `data:image/jpeg;base64,${imgdata}`;
        logger.log('data:', data)

        this.smallPosterImgSrc = data;
      })();
    }
  },

  created() {
    this.loadSmallPoster();
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
