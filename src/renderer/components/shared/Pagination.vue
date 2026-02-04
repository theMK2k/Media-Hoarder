<template>
  <nav
    class="v-pagination v-theme--dark"
    role="navigation"
    aria-label="Pagination Navigation"
    data-test="v-pagination-root"
  >
    <!-- THE NEW PAGINATION BUTTONS -->
    <ul class="v-pagination__list">
      <li class="v-pagination__prev">
        <button
          type="button"
          v-bind:class="prevClass"
          v-bind:disabled="$shared.currentPage == 1"
          v-on:click="$shared.currentPage = 1"
          style="
            height: 38px !important;
            width: 38px !important;
            margin: 8px 8px 0px 0px !important;
            display: inline-block;
          "
        >
          <span class="v-btn__overlay"></span><span class="v-btn__underlay"></span
          ><span class="v-btn__content" data-no-activator=""
            ><i
              class="mdi-chevron-double-left mdi v-icon notranslate v-theme--dark v-icon--size-default"
              aria-hidden="true"
            ></i
          ></span>
        </button>
      </li>

      <li class="v-pagination__prev">
        <button
          type="button"
          v-bind:class="prevClass"
          v-bind:disabled="$shared.currentPage == 1"
          v-on:click="onPrevClicked"
          style="
            height: 38px !important;
            width: 38px !important;
            margin: 8px 8px 0px 0px !important;
            display: inline-block;
          "
        >
          <span class="v-btn__overlay"></span><span class="v-btn__underlay"></span
          ><span class="v-btn__content" data-no-activator=""
            ><i
              class="mdi-chevron-left mdi v-icon notranslate v-theme--dark v-icon--size-default"
              aria-hidden="true"
            ></i
          ></span>
        </button>
      </li>

      <v-select
        class="mk-v-select-dynamic-width"
        variant="solo"
        density="compact"
        v-bind:items="pages"
        item-title="displayText"
        item-value="page"
        v-model="$shared.currentPage"
        style="height: 40px; margin-top: 8px; display: inline-block"
      >
        <!-- v-bind:style="selectStyle" -->
        <template v-slot:item="{ item }">
          <div>{{ item.raw.page + " / " + item.raw.numPages }}</div>
          <div style="width: 16px"></div>
          <div v-if="item.raw.detailInfo" class="grey--text caption">
            {{ " " + item.raw.detailInfo }}
          </div>
          <!-- <span v-if="index === 1" class="grey--text caption">(+{{ value.length - 1 }} others)</span> -->
        </template>
        <template v-slot:selection="{ item }">
          <div>{{ item.raw.page + " / " + item.raw.numPages }}</div>
          <div style="width: 16px"></div>
          <div v-if="item.raw.detailInfo" class="grey--text caption">
            {{ " " + item.raw.detailInfo }}
          </div>
          <!-- <span v-if="index === 1" class="grey--text caption">(+{{ value.length - 1 }} others)</span> -->
        </template>
      </v-select>

      <li class="v-pagination__next">
        <button
          type="button"
          v-bind:class="nextClass"
          v-bind:disabled="$shared.currentPage >= length"
          v-on:click="onNextClicked"
          style="
            height: 38px !important;
            width: 38px !important;
            margin: 8px 8px 0px 0px !important;
            display: inline-block;
          "
        >
          <span class="v-btn__overlay"></span><span class="v-btn__underlay"></span
          ><span class="v-btn__content" data-no-activator=""
            ><i
              class="mdi-chevron-right mdi v-icon notranslate v-theme--dark v-icon--size-default"
              aria-hidden="true"
            ></i
          ></span>
        </button>
      </li>

      <li class="v-pagination__next">
        <button
          type="button"
          v-bind:class="nextClass"
          v-bind:disabled="$shared.currentPage >= length"
          v-on:click="$shared.currentPage = length"
          style="
            height: 38px !important;
            width: 38px !important;
            margin: 8px 8px 0px 0px !important;
            display: inline-block;
          "
        >
          <span class="v-btn__overlay"></span><span class="v-btn__underlay"></span
          ><span class="v-btn__content" data-no-activator=""
            ><i
              class="mdi-chevron-double-right mdi v-icon notranslate v-theme--dark v-icon--size-default"
              aria-hidden="true"
            ></i
          ></span>
        </button>
      </li>
    </ul>
  </nav>

  <!-- VUETIFY's PAGINATION -->
  <!--
  <v-pagination :length="3"></v-pagination>
  -->
</template>

<script>
// const logger = require("../../helpers/logger");

export default {
  props: ["length", "pages"],

  computed: {
    prevClass() {
      return {
        "v-btn": true,
        "v-btn--icon": true,
        "v-theme--dark": true,
        "v-btn--density-default": true,
        "v-btn--size-default": true,
        "v-btn--variant-text": true,
        "v-btn--disabled": this.$shared.currentPage == 1,
      };
    },

    nextClass() {
      return {
        "v-btn": true,
        "v-btn--icon": true,
        "v-theme--dark": true,
        "v-btn--density-default": true,
        "v-btn--size-default": true,
        "v-btn--variant-text": true,
        "v-btn--disabled": this.$shared.currentPage >= this.length,
      };
    },

    items() {
      const items = [];
      for (let i = 1; i <= this.length; i++) {
        // items.push(i);
        items.push({
          page: i,
          displayText: `${i} / ${this.length}`,
        });
      }

      return items;
    },

    // selectStyle() {
    //   let width = 40; // offset - no character

    //   width +=
    //     34 + Math.ceil(Math.log10(this.pages ? this.pages.length + 1 : 1)) * 20; // "8 / 8", "88 / 88"

    //   switch (this.$shared.sortField) {
    //     case "Name":
    //       width += 26;
    //       break;
    //     case "IMDB_rating_default":
    //       width += 42;
    //       break;
    //     case "IMDB_metacriticScore":
    //       width += 44;
    //       break;
    //     case "Rating":
    //       width += 26;
    //       break;
    //     case "startYear":
    //       width += 54;
    //       break;
    //     case "created_at":
    //       width += 108;
    //       break;
    //     case "last_access_at":
    //       width += 108;
    //       break;
    //     default:
    //       logger.error(
    //         `[selectStyle] Pagination.vue: unknown sort field "${this.$shared.sortField}"`
    //       );
    //       break;
    //   }

    //   // "max-width": `${width}px`,

    //   return {
    //     height: "40px"
    //   };
    // }
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
    },
  },
};
</script>

<style scoped></style>
