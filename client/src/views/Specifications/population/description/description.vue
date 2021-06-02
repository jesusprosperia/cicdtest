<template>
  <block
    :title="userTrans.add_description"
  > 
    <div class="editor-container" v-if="showEditor">
      <TextEditor v-model="content" @on-json-update="d => $emit('on-json-update', d)" />

      <div class="pl-2 pt-2 delete-icon" @click="onDelete">
        <img src="@/assets/delete.svg" />
      </div>
    </div>

    <div class="mt-2 mb-2" v-else>
      <b-button
        class="button-add"
        variant="success"
        @click="showEditor = true"
      >
        {{ userTrans.add_description_btn }}
      </b-button>
    </div>
  </block>
</template>

<script>
import {mapState} from 'vuex';
import Block from "../block/block.vue";
import TextEditor from '@/components/text-editor/text-editor.vue';

export default {
  props: {
    value: {
      type: String,
      default: ''
    }
  },
  components: {
    Block,
    TextEditor
  },
  data() {
    return {
      content: this.value,
      showEditor: this.value && this.value.length
    }
  },
  computed: {
    ...mapState({
      userTrans: state => state.lang.userTrans,
    })
  },
  methods: {
    onDelete() {
      this.content = ''; 
      this.showEditor = false; 
      this.$emit('on-json-update', null)
    }
  },
  watch: {
    content(c) {
      this.$emit('input', c);
    }
  }
}
</script>

<style lang="scss" scoped>
  .editor-container {
    display: flex;
  }
</style>