<template>
  <div>
    <ul class="v-pagination theme--dark">
      <li>
        <button type="button" class="v-pagination__navigation" disabled>
          <i aria-hidden="true" class="v-icon notranslate mdi mdi-chevron-left theme--dark"></i>
        </button>
      </li>
      <!-- <li>
        <button type="button" class="v-pagination__item">1</button>
      </li> -->
      <li>
        <button type="button" class="v-pagination__navigation">
          <i aria-hidden="true" class="v-icon notranslate mdi mdi-chevron-right theme--dark"></i>
        </button>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
    props: ['length', 'value']
}
</script>

<style scoped>

</style>