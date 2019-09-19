<template>
  <div
		v-on:mouseover="isHovered = true" v-on:mouseleave="isHovered = false"
	>
    <v-row>
      <v-list-item two-line>
        <v-list-item-content>
          <v-list-item-title>
            {{value.Description}}
            <v-icon v-show="isHovered" small style="cursor: pointer" v-on:click="onEditDescription">mdi-pencil</v-icon>
						<v-icon v-show="isHovered" small color="red" style="cursor: pointer" v-on:click="onDelete">mdi-delete</v-icon>
          </v-list-item-title>
          <v-list-item-subtitle>{{value.Path}}</v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </v-row>
  </div>
</template>

<script>
export default {
	props: ["value"],
	
	data: () => ({
		isHovered: false
	}),

	methods: {
		onEditDescription() {
			this.$emit('edit-description', this.value);
		},

		onDelete() {
			this.$emit('delete', this.value);
		}
	}
};
</script>

<style>
</style>