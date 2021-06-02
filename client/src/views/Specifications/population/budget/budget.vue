<template>
  <block :title="userTrans.specify_budget">
    <b-form-group v-if="budgetSumStore != null">
      <div class="d-flex">
        <div>{{0 | formatThousand}}</div>

        <div class="w-100 ml-2 mr-2">
          <b-form-input
            class="w-100"
            id="budget"
            type="range"
            v-model="budget"
            :min="0"
            :max="budgetSum"
            :step="1"
          />
        </div>

        <div>{{budgetSum | formatThousand}}</div>
      </div>
      <div class="mt-1 d-flex align-items-center">
        <div class="mr-2">{{userTrans.budget}}:</div>
        <div class="w-50">
          <NumberInput v-model="budget" />
        </div>
      </div>
      <div class="mt-1">{{userTrans.percent}}: {{ budgetPercent.toFixed(1) }}%</div>
    </b-form-group>
    <div class="loader" v-else>
      <div class="loader--dot"></div>
      <div class="loader--dot"></div>
      <div class="loader--dot"></div>
      <div class="loader--dot"></div>
      <div class="loader--dot"></div>
      <div class="loader--dot"></div>
    </div>
  </block>
</template>

<script>
import {mapState} from 'vuex';
import Block from "../block/block.vue";
import NumberInput from '@/components/number-input';

export default {
  props: {
    value: {
      type: Number,
      required: true
    },
    budgetSum: {
      type: Number,
      required: true
    },
    budgetPercent: {
      type: Number,
      required: true
    }
  },
  components: {
    Block,
    NumberInput
  },
  data() {
    return {
      budget: this.value
    }
  },
  computed: {
    ...mapState({
      userTrans: state => state.lang.userTrans,
      budgetSumStore: state => state.scheme.budgetSum,
    })
  },
  watch: {
    budget(val) {
      this.$emit('input', +val);
    },
    value() {
      if (this.value !== this.budget) {
        this.budget = this.value;
      }
    }
  }
}
</script>

<style>

</style>