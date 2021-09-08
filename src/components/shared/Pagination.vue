<template>
  <div style="margin-top: -8px !important">
    <ul class="v-pagination theme--dark">
      <li>
        <button
          type="button"
          class="v-pagination__navigation"
          v-bind:class="prevClass"
          v-bind:disabled="$shared.currentPage == 1"
          v-on:click="$shared.currentPage = 1"
          style="
            height: 48px !important;
            width: 48px !important;
            margin: 8px 8px 0px 0px !important;
          "
        >
          <i
            aria-hidden="true"
            class="v-icon notranslate mdi mdi-chevron-double-left theme--dark"
          ></i>
        </button>
      </li>
      <li>
        <button
          type="button"
          class="v-pagination__navigation"
          v-bind:class="prevClass"
          v-bind:disabled="$shared.currentPage == 1"
          v-on:click="onPrevClicked"
          style="
            height: 48px !important;
            width: 48px !important;
            margin: 8px 8px 0px 0px !important;
          "
        >
          <i
            aria-hidden="true"
            class="v-icon notranslate mdi mdi-chevron-left theme--dark"
          ></i>
        </button>
      </li>
      <li>
        <v-select
          class="mk-v-select-dynamic-width"
          solo
          dense
          v-bind:items="pages"
          item-text="displayText"
          item-value="page"
          label="Page"
          v-model="$shared.currentPage"
          style="height: 40px"
        >
          <!-- v-bind:style="selectStyle" -->
          <template v-slot:item="{ item }">
            <div>{{ item.page + " / " + item.numPages }}</div>
            <div style="width: 16px"></div>
            <div v-if="item.detailInfo" class="grey--text caption">
              {{ " " + item.detailInfo }}
            </div>
            <!-- <span v-if="index === 1" class="grey--text caption">(+{{ value.length - 1 }} others)</span> -->
          </template>
          <template v-slot:selection="{ item }">
            <div>{{ item.page + " / " + item.numPages }}</div>
            <div style="width: 16px"></div>
            <div v-if="item.detailInfo" class="grey--text caption">
              {{ " " + item.detailInfo }}
            </div>
            <!-- <span v-if="index === 1" class="grey--text caption">(+{{ value.length - 1 }} others)</span> -->
          </template>
        </v-select>
        <!-- style="max-width: 200px; height: 40px" -->
      </li>
      <li>
        <button
          type="button"
          class="v-pagination__navigation"
          v-bind:class="nextClass"
          v-bind:disabled="$shared.currentPage >= length"
          v-on:click="onNextClicked"
          style="
            height: 48px !important;
            width: 48px !important;
            margin: 8px 8px 0px 8px !important;
          "
        >
          <i
            aria-hidden="true"
            class="v-icon notranslate mdi mdi-chevron-right theme--dark"
          ></i>
        </button>
      </li>
      <li>
        <button
          type="button"
          class="v-pagination__navigation"
          v-bind:class="nextClass"
          v-bind:disabled="$shared.currentPage >= length"
          v-on:click="$shared.currentPage = length"
          style="
            height: 48px !important;
            width: 48px !important;
            margin: 8px 8px 0px 0px !important;
          "
        >
          <i
            aria-hidden="true"
            class="v-icon notranslate mdi mdi-chevron-double-right theme--dark"
          ></i>
        </button>
      </li>
    </ul>
  </div>
</template>

<script>
// const logger = require("loglevel");

export default {
  props: ["length", "pages"],

  computed: {
    prevClass() {
      return {
        "v-pagination__navigation--disabled": this.$shared.currentPage == 1,
      };
    },

    nextClass() {
      return {
        "v-pagination__navigation--disabled":
          this.$shared.currentPage >= this.length,
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
    //         `Pagination.vue: unknown sort field "${this.$shared.sortField}"`
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
