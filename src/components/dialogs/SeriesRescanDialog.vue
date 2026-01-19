<template>
  <v-dialog
    :model-value="show"
    @update:model-value="$emit('update:show', $event)"
    persistent
    max-width="500"
    v-on:keydown.escape="onCloseClick"
    v-on:keydown.enter="onOKClick"
  >
    <v-card dark flat v-bind:ripple="false">
      <v-card-title>
        <div class="headline" style="width: 100%; font-size: 1.17em">
          {{ $t("Rescan Series") }}
        </div>
      </v-card-title>
      <v-card-text>
        <p>{{ $t("Choose what to rescan for this series:") }}</p>

        <v-radio-group v-model="radioGroup">
          <v-radio v-bind:label="$t('Rescan only the series metadata')" v-bind:value="1" color="mk-dark-grey"></v-radio>
          <v-radio
            v-bind:label="$t('Rescan the series and all episodes')"
            v-bind:value="2"
            color="mk-dark-grey"
          ></v-radio>
        </v-radio-group>

        <div v-if="radioGroup == 1">
          <ul>
            <li>{{ $t("Only updates the series metadata from IMDB") }}</li>
            <li>{{ $t("Episodes remain unchanged") }}</li>
            <li>
              <strong>{{ $t("Faster") }}</strong>
            </li>
          </ul>
        </div>

        <div v-if="radioGroup == 2">
          <ul>
            <li>{{ $t("Updates the series metadata from IMDB") }}</li>
            <li>{{ $t("Also rescans all episodes") }}</li>
            <li>
              <strong>{{ $t("This can take a while depending on the number of episodes") }}</strong>
            </li>
          </ul>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-col sm="12">
          <v-row style="margin-top: 8px">
            <v-btn class="xs-fullwidth" color="secondary" v-on:click.native="onCloseClick" style="margin-left: 8px">{{
              $t("Cancel")
            }}</v-btn>
            <v-btn class="xs-fullwidth" color="primary" v-on:click.native="onOKClick" style="margin-left: 8px">
              {{ $t("Rescan Meta Data") }}
            </v-btn>
          </v-row>
        </v-col>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: ["show"],

  emits: ["update:show"],

  data() {
    return {
      radioGroup: 1,
    };
  },

  methods: {
    onCloseClick() {
      this.$emit("cancel");
    },

    onOKClick() {
      this.$emit("ok", {
        includeEpisodes: this.radioGroup === 2,
      });
    },

    init() {
      this.radioGroup = 1;
    },
  },
};
</script>

<style scoped>
.btn {
  margin: 2px;
}
</style>
