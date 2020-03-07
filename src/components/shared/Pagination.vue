<template>
  <div style="margin-top: -8px!important">
    <ul class="v-pagination theme--dark">
      <li>
        <button
          type="button"
          class="v-pagination__navigation"
          v-bind:class="prevClass"
          v-bind:disabled="$shared.currentPage == 1"
          v-on:click="$shared.currentPage = 1"
          style="height: 48px!important; width: 48px!important; margin: 8px 8px 0px 0px!important"
        >
          <i aria-hidden="true" class="v-icon notranslate mdi mdi-chevron-double-left theme--dark"></i>
        </button>
      </li>
      <li>
        <button
          type="button"
          class="v-pagination__navigation"
          v-bind:class="prevClass"
          v-bind:disabled="$shared.currentPage == 1"
          v-on:click="onPrevClicked"
          style="height: 48px!important; width: 48px!important; margin: 8px 8px 0px 0px!important"
        >
          <i aria-hidden="true" class="v-icon notranslate mdi mdi-chevron-left theme--dark"></i>
        </button>
      </li>
      <!-- <li>
        <button type="button" class="v-pagination__item">1</button>
      </li>-->
      <li>
        <v-select
          solo
          dense
          v-bind:items="items"
          item-text="Description"
          item-value="Field"
          label="Sort"
          style="max-width: 80px; height: 40px"
          v-model="$shared.currentPage"
        ></v-select>  <!-- label="Solo field" -->
      </li>
      <li>
        <button
          type="button"
          class="v-pagination__navigation"
          v-bind:class="nextClass"
          v-bind:disabled="$shared.currentPage >= length"
          v-on:click="onNextClicked"
          style="height: 48px!important; width: 48px!important; margin: 8px 8px 0px 8px!important"
        >
          <i aria-hidden="true" class="v-icon notranslate mdi mdi-chevron-right theme--dark"></i>
        </button>
      </li>
      <li>
        <button
          type="button"
          class="v-pagination__navigation"
          v-bind:class="nextClass"
          v-bind:disabled="$shared.currentPage >= length"
          v-on:click="$shared.currentPage = length"
          style="height: 48px!important; width: 48px!important; margin: 8px 8px 0px 0px!important"
        >
          <i aria-hidden="true" class="v-icon notranslate mdi mdi-chevron-double-right theme--dark"></i>
        </button>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  props: ["length"],

  computed: {
    prevClass() {
      return {
        "pagination__navigation--disabled": this.$shared.currentPage == 1
      };
    },

    nextClass() {
      return {
        "pagination__navigation--disabled": this.$shared.currentPage >= this.length
      };
    },

    items() {
      const items = [];
      for (let i = 1; i <= this.length; i++) {
        items.push(i);
      }

      return items;
    }
  },

  methods: {
    onNextClicked() {
      if (this.$shared.currentPage < this.length) {
        this.$shared.currentPage++;
      }
    },

    onPrevClicked() {
      if (this.$shared.currentPage > 1) {
        this.$shared.currentPage--;
      }
    }
  }
};
</script>

<style scoped>
  .v-input__slot {
    margin: 0px!important
  }
</style>