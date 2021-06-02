<template>
  <block 
    title="Select Aggr Threshold"
  >
    <b-form-group class="pl-4"
        :label="userTrans.select_sections"
        label-cols="5"
      >
        <multiselect
          v-model="form.selectedSection"
          :options="sections"
          :multiple="false"
          label="name"
          track-by="value"
        />
      </b-form-group>

      <b-form-group 
        class="pl-4"
        :label="userTrans.pie_label"
        label-cols="5"
      >
       <b-form-input
          type="text"
          v-model="form.pie_label"
        ></b-form-input> 
      </b-form-group>
  </block>
</template>

<script>
import {mapState} from 'vuex';
import Block from "../block/block.vue";
import Multiselect from "vue-multiselect";

export default {
  props: {
    sections: {
      type: Array,
      required: true
    },
    value: {
      type: Object,
      required: true
    },
  },
  data() {
    return {
      form: Object.assign({
        selectedSection: null,
        pie_label: null
      }, this.value)
    }
  },
  computed: {
    ...mapState({
      userTrans: state => state.lang.userTrans,
    })
  },
  watch: {
    form: {
      handler(value) {
        this.$emit('input', value);
      },
      deep: true
    }
  },
  components: {
    Block,
    Multiselect
  }
}
</script>