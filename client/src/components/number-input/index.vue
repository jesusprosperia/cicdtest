<template>
  <input 
    ref="input"
    class="form-control form-control-sm"
    type="text" 
    :value="internalValue"
    :placeholder="placeholder"
    @keypress="validate"
    @input="onInput" 
  />
</template>

<script>
import {thousandFormat} from '@/utils/formatters';

export default {
  name: 'number-input',
  props: ['value', 'placeholder'],
  data() {
    return {
      internalValue: '0'
    }
  },
  methods: {
    validate($event) {
      let keyCode = ($event.keyCode ? $event.keyCode : $event.which);
      
      // only allow number
      if (keyCode < 48 || (keyCode > 57 && keyCode < 96) || keyCode > 105) { 
        $event.preventDefault();
      }
    },
    onInput() {
      var textValue = this.$refs.input.value || '0';
      var value = parseInt(textValue.replace(/,/g, ''));

      this.$emit('input', value);
    }
  },
  watch: {
    value() {
      this.internalValue = thousandFormat(+this.value)
    }
  },
  created() {
    this.internalValue = thousandFormat(+this.value)
  }
}
</script>

<style>

</style>