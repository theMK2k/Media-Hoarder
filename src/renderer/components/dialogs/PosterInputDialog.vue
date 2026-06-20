<template>
  <v-dialog
    :model-value="show"
    @update:model-value="$emit('update:show', $event)"
    max-width="640px"
    persistent
  >
    <v-card dark flat>
      <v-card-title style="display: flex; justify-content: space-between; align-items: center">
        <span>{{ titleText }}</span>
        <v-btn icon="mdi-close" variant="text" v-on:click="onCancel"></v-btn>
      </v-card-title>

      <v-card-text>
        <div style="font-size: 13px; opacity: 0.75; margin-bottom: 12px">
          {{ $t("Provide the highest possible resolution_ A low-res variant will be derived automatically for the media list_") }}
        </div>

        <div
          v-bind:class="['mk-drop-zone', { 'mk-drop-zone-active': isDragOver }]"
          v-on:dragover.prevent="isDragOver = true"
          v-on:dragleave.prevent="isDragOver = false"
          v-on:drop.prevent="onDrop"
          v-on:click="onPickFile"
        >
          <v-icon size="48" disabled>mdi-image-plus</v-icon>
          <div style="margin-top: 8px">
            {{ $t("Drag & drop an image, click to browse, or paste with Ctrl+V") }}
          </div>
        </div>

        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          style="display: none"
          v-on:change="onFileChange"
        />

        <div v-if="previewSrc" style="margin-top: 20px">
          <div style="font-size: 14px">{{ $t("Preview") }}</div>
          <div style="display: flex; gap: 12px; margin-top: 8px; align-items: flex-start">
            <img
              v-bind:src="previewSrc"
              v-bind:key="previewSrc"
              style="max-width: 160px; max-height: 220px; border-radius: 6px; border: 1px solid #444"
              v-on:error="onImageError"
              v-on:load="onImageLoad"
            />
            <div style="font-size: 12px; min-width: 0; word-break: break-all">
              <div v-if="sourceInfo">{{ sourceInfo }}</div>
              <div v-if="loadError" style="color: #ff5252; margin-top: 4px">
                {{ loadError }}
              </div>
            </div>
          </div>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="tonal" color="secondary" v-on:click="onCancel">
          {{ $t("Cancel") }}
        </v-btn>
        <v-btn
          variant="tonal"
          color="primary"
          v-bind:disabled="!hasValidImage"
          v-on:click="onOK"
        >
          {{ $t("OK") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import logger from "@helpers/logger.js";

export default {
  props: {
    show: { type: Boolean, default: false },
    hasCurrentPoster: { type: Boolean, default: false },
  },

  emits: ["update:show", "confirm", "cancel"],

  data() {
    return {
      isDragOver: false,
      stagedSource: null,
      previewSrc: null,
      sourceInfo: null,
      loadError: null,
      isImageLoaded: false,
      pasteHandler: null,
    };
  },

  computed: {
    hasValidImage() {
      return !!this.previewSrc && this.isImageLoaded && !this.loadError;
    },

    titleText() {
      return this.hasCurrentPoster ? this.$t("Replace Poster") : this.$t("Add Poster");
    },
  },

  watch: {
    show(newVal) {
      if (newVal) {
        this.resetState();
        this.attachPasteListener();
      } else {
        this.detachPasteListener();
      }
    },
  },

  beforeUnmount() {
    this.detachPasteListener();
  },

  methods: {
    resetState() {
      this.isDragOver = false;
      this.stagedSource = null;
      this.previewSrc = null;
      this.sourceInfo = null;
      this.loadError = null;
      this.isImageLoaded = false;
    },

    attachPasteListener() {
      this.pasteHandler = this.onPaste.bind(this);
      document.addEventListener("paste", this.pasteHandler);
    },

    detachPasteListener() {
      if (this.pasteHandler) {
        document.removeEventListener("paste", this.pasteHandler);
        this.pasteHandler = null;
      }
    },

    onPickFile() {
      this.$refs.fileInput.click();
    },

    onFileChange(e) {
      const file = e.target.files && e.target.files[0];
      if (file) {
        this.useFile(file);
      }
      e.target.value = "";
    },

    onDrop(e) {
      this.isDragOver = false;
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) {
        this.useFile(file);
      }
    },

    onPaste(e) {
      const items = e.clipboardData && e.clipboardData.items;
      if (!items) return;

      for (const item of items) {
        if (item.type && item.type.indexOf("image/") === 0) {
          const file = item.getAsFile();
          if (file) {
            this.useFile(file);
            e.preventDefault();
            break;
          }
        }
      }
    },

    useFile(file) {
      if (!file.type || !file.type.startsWith("image/")) {
        this.loadError = this.$t("File is not an image_");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        this.stagedSource = { type: "data", dataUrl, mimeType: file.type };
        this.previewSrc = dataUrl;
        this.loadError = null;
        this.isImageLoaded = false;
        this.sourceInfo = `${file.name} (${this.formatBytes(file.size)})`;
      };
      reader.onerror = () => {
        this.loadError = this.$t("Failed to read file_");
      };
      reader.readAsDataURL(file);
    },

    onImageError() {
      this.loadError = this.$t("Failed to load image_");
      this.isImageLoaded = false;
    },

    onImageLoad() {
      this.isImageLoaded = true;
      this.loadError = null;
    },

    formatBytes(bytes) {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    },

    onOK() {
      if (!this.hasValidImage) return;
      logger.log("[PosterInputDialog.onOK] stagedSource type:", this.stagedSource.type);
      this.$emit("confirm", {
        source: this.stagedSource,
      });
    },

    onCancel() {
      this.$emit("cancel");
    },
  },
};
</script>

<style scoped>
.mk-drop-zone {
  border: 2px dashed #555;
  border-radius: 8px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
}

.mk-drop-zone:hover {
  background-color: rgba(255, 255, 255, 0.04);
}

.mk-drop-zone-active {
  background-color: rgba(33, 150, 243, 0.1);
  border-color: #2196f3;
}
</style>
