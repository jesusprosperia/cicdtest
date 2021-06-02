<template>
  <block 
    :title="userTrans.type_of_cost_section"
  >
    <b-form-group 
      :label="userTrans.type_of_cost_header"
    >
      <div class="d-md-flex">

        <b-form-radio 
          v-model="form.cost_type" 
          :name="'cost-type' + policyName" 
          value="simple" 
          class="mr-md-5"
        >
          {{userTrans.simple_unit_cost}}
        </b-form-radio>

        <b-form-radio 
          v-model="form.cost_type" 
          :name="'cost-type' + policyName" 
          value="adjustable"
        >
          {{userTrans.adjustable_mon_cost}}
        </b-form-radio>
        
      </div>
    </b-form-group>

    <template v-if="form.cost_type === 'adjustable'">
      <b-form-group 
        class="mt-4" 
        :label="userTrans.mon_cost_label"
      >

        <div class="d-flex align-items-end">
          <div>
            <div class="input-label">Min</div>
            <div class="input-wrapper">
              <NumberInput v-model="form.mon_cost.min" />
            </div>
          </div>
          <div class="w-100 ml-4 mr-4">
            <b-form-input
              class="w-100"
              type="range"
              v-model="form.mon_cost.value"
              :min="form.mon_cost.min"
              :max="form.mon_cost.max"
              :step="1"
            ></b-form-input>
          </div>
          <div>
            <div class="input-label">Max</div>
            <div class="input-wrapper">
              <NumberInput 
                v-model="form.mon_cost.max" 
              />
            </div>
          </div>
        </div>
        <div class="mt-3 d-flex align-items-center">
          <div class="mr-2">
              {{userTrans.mon_cost_text}}:
          </div>
          <div class="w-25">
            <NumberInput 
              v-model="form.mon_cost.value" 
            />
          </div>
        </div>
      </b-form-group>

      <b-form-group 
        class="factor-confirmation" 
        :label="userTrans.cost_type_confirmation"   
        label-cols="10"
      >
        <b-form-checkbox v-model="form.costFactorEnabled" switch />
      </b-form-group>

      <b-form-group class="pl-4 cost_factor_select"
        :label="userTrans.cost_factor_label" 
        label-cols="4"
        v-if="form.costFactorEnabled"
      >
        <CostFactors 
           v-model="form.costFactors"
          :options="costFactorFields"
        />
      </b-form-group>

      <b-form-group 
        class="factor-confirmation" 
        :label="userTrans.factor_confirmation"   
        label-cols="10"
      >
        <b-form-checkbox v-model="form.factorize" switch />
      </b-form-group>

      <b-form-group class="pl-4 impact_factor_select"
        :label="userTrans.factor_column_label" 
        label-cols="5"
        v-if="form.factorize"
      >
        <multiselect
          v-model="form.impactFactors"
          :options="impactFactorFields"
          :multiple="true"
        />
      </b-form-group>

      <b-form-group class="pl-4"
        :label="userTrans.select_sections"
        label-cols="5"
        v-if="form.factorize"
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
        v-if="form.factorize"
        class="pl-4"
        :label="userTrans.pie_label"
        label-cols="5"
      >
       <b-form-input
          type="text"
          v-model="form.pie_label"
        ></b-form-input> 
      </b-form-group>
    </template>
  </block>
</template>

<script>
import {mapState} from 'vuex';
import Block from "../block/block.vue";
import Multiselect from "vue-multiselect";
import NumberInput from '@/components/number-input';
import CostFactors from './CostFactors';
import {getRandomId} from '@/utils/formatters';

export default {
  props: {
    impactFactorFields: {
      type: Array,
      default: () => {
        return []
      }
    },
    costFactorFields: {
      type: Array,
      default: () => {
        return []
      }
    },
    sections: {
      type: Array,
      required: true
    },
    value: {
      type: Object,
      required: true
    },
    policyName: {
      type: String,
      default: getRandomId()
    }
  },
  components: {
    Block,
    Multiselect,
    NumberInput,
    CostFactors
  },
  data() {
    return {
      form: Object.assign({
        factorize: false,
        impactFactors: [],
        costFactorEnabled: false,
        costFactors: [],
        cost_type: 'simple',
        mon_cost: {
          min: 1,
          max: 1000,
          value: 1
        },
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
        if (value.mon_cost) {
          value.mon_cost.value = parseInt(value.mon_cost.value)
          value.mon_cost.max = parseInt(value.mon_cost.max)
          value.mon_cost.min = parseInt(value.mon_cost.min)
        }
        this.$emit('input', value);
      },
      deep: true
    },
    'form.cost_type'(val) {
      if (val == 'simple') {
        this.form.factorize = false;
        this.costFactorEnabled = false;
      } 
    },
    'form.factorize'(val) {
      if (!val) {
        this.form.impactFactors = null;
        this.form.selectedSection = null;
        this.form.pie_label = null;
      }
    },
    'form.costFactorEnabled'(val) {
      if (!val) {
        this.form.costFactors = [];
      }
    },
    'form.mon_cost.max'() {
      this.form.mon_cost.value = this.form.mon_cost.min;
    },
    'form.mon_cost.min'() {
      this.form.mon_cost.value = this.form.mon_cost.min;
    }
  }
}
</script>

<style lang="scss">
.cost_factor_select .form-row {
  align-items: flex-start !important;
}
</style>