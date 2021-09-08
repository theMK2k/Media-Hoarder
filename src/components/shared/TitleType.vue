<template>
  <div v-on:mouseover="isHovered = true" v-on:mouseleave="isHovered = false">
    <v-row style="margin: 0px">
      <v-card style="width: 100%">
        <v-list-item two-line>
          <v-list-item-content>
            <v-list-item-title>
              {{ value.TitleType }} ({{
                $t("seen in {count} of 20M+", { count: value.Count })
              }})
              <v-btn
                v-show="showAdd && isHovered"
                v-on:click="onAddTitleTypeClicked"
                text
                small
                color="primary"
                style="height: 16px"
                >{{ $t("Add this Title Type") }}</v-btn
              >
              <v-icon
                v-show="showRemove && isHovered"
                small
                class="mk-clickable-red"
                style="align-items: flex-start"
                v-on:click="onRemoveTitleTypeClicked"
                >mdi-delete</v-icon
              >
            </v-list-item-title>
            <v-list-item-subtitle v-if="value.Example_Primary_Title">
              <p style="margin-bottom: 0px">
                {{ $t("e_g_") }} "{{ value.Example_Primary_Title }}"
                <span
                  v-if="
                    value.Example_Secondary_Label &&
                    value.Example_Secondary_Title
                  "
                  >-> "{{ value.Example_Secondary_Title }}"
                  {{ value.Example_Secondary_Label }}</span
                >
              </p>
              <p
                v-if="
                  value.Example_Tertiary_Label && value.Example_Tertiary_Title
                "
                style="margin-bottom: 0px"
              >
                {{
                  $t("note: the {label} title would be: _{title}_", {
                    label: value.Example_Tertiary_Label,
                    title: value.Example_Tertiary_Title,
                  })
                }}
              </p>
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-card>
    </v-row>
  </div>
</template>

<script>
// const logger = require("loglevel");

// import * as store from "@/store";

export default {
  props: ["value", "showAdd", "showRemove"],

  data: () => ({
    isHovered: false,
  }),

  methods: {
    onAddTitleTypeClicked() {
      this.$emit("addTitleType", this.value);
    },

    onRemoveTitleTypeClicked() {
      this.$emit("removeTitleType", this.value);
    },
  },
};
</script>

<style></style>
