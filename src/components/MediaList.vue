<template>
  <div>
    <v-btn class="ma-2" outlined fab color="teal">
      <v-icon>mdi-format-list-bulleted-square</v-icon>
    </v-btn>
    <h1>Media - {{ mediatype.toUpperCase() }}</h1>
  </div>
</template>

<script>
export default {
  props: ["mediatype"]
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
