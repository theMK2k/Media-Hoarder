<template>
  <v-dialog
    :model-value="show"
    @update:model-value="$emit('update:show', $event)"
    max-width="90vw"
    height="95vh"
  >
    <v-card dark flat style="display: flex; flex-direction: column; height: 100%">
      <v-card-title style="display: flex; justify-content: space-between; align-items: center; flex: 0 0 auto">
        <span>{{ $t("Poster") }}</span>
        <v-btn icon="mdi-close" variant="text" v-on:click="onClose"></v-btn>
      </v-card-title>
      <div style="padding: 0 24px 12px 24px; font-size: 13px; opacity: 0.75; flex: 0 0 auto">
        {{ $t("The poster is shown in media item cards in the media list and in full screen view modes_ When replacing, provide the highest possible resolution_ A low-res variant will be derived automatically for the media list_") }}
      </div>
      <v-card-text style="text-align: center; padding: 0; overflow: auto; flex: 1 1 auto; min-height: 0">
        <img
          v-if="posterUrl"
          v-bind:src="posterUrl"
          v-bind:style="imageStyle"
          v-on:click="zoom = !zoom"
        />
        <v-alert v-else type="warning" variant="tonal" style="margin: 16px">
          {{ $t("No image is currently available for this poster_") }}
        </v-alert>
      </v-card-text>
      <v-card-actions style="flex: 0 0 auto">
        <v-btn variant="tonal" color="secondary" v-on:click="onClose">
          {{ $t("Close") }}
        </v-btn>
        <v-spacer></v-spacer>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: {
    show: { type: Boolean, default: false },
    posterUrl: { type: String, default: null },
  },

  emits: ["update:show"],

  data() {
    return {
      zoom: false,
    };
  },

  computed: {
    imageStyle() {
      if (this.zoom) {
        return {
          width: "100%",
          height: "auto",
          cursor: "zoom-out",
          display: "block",
        };
      }
      return {
        height: "100%",
        width: "auto",
        maxWidth: "100%",
        cursor: "zoom-in",
        display: "block",
        margin: "0 auto",
      };
    },
  },

  watch: {
    show(newVal) {
      if (newVal) {
        this.zoom = false;
      }
    },
  },

  methods: {
    onClose() {
      this.$emit("update:show", false);
    },
  },
};
</script>
