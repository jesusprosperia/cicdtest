<template>
  <b-modal
    size="lg"
    v-model="show"
    no-close-on-esc
    no-close-on-backdrop
    hide-header-close
  >
    <div>
      <b-form-group label="Name the target scheme:" label-cols="4">
        <input type="text" class="form-control" v-model="schemeName" />
      </b-form-group>
    </div>

    <template v-slot:modal-footer>
      <div class="w-100">
        <b-button
          v-if="schemeName"
          variant="success"
          size="sm"
          class="float-right"
          @click="onSave()"
          >Save</b-button
        >

        <b-button
          variant="light"
          size="sm"
          class="float-right mr-3"
          @click="$emit('on-cancel')"
          >Cancel</b-button
        >
      </div>
    </template>
  </b-modal>
</template>

<script>
export default {
  name: "SchemeModal",
  props: {
    show: {
      type: Boolean,
      required: true,
    }
  },
  data() {
    return {
      schemeName: ""
    };
  },
  methods: {
    onSave() {
      if (this.schemeName) {
        this.$emit('on-save', this.schemeName);
      }
    },
  },
};
</script>
