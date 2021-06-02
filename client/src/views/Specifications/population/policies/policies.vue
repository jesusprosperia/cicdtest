<template>
  <b-row class="block-card">
    <b-col>
      <div class="header" ref="header">
        <div class="header-text">
          Policies
        </div>
      </div>

      <policy ref="policies"
        v-for="(policy, i) in localPolicies" :key="policy.name + i"
        :policy="policy"
        :visible="false"
        :categoricalFields="categoricalFields"
        :numericalFields="numericalFields"
        :factorFields="factorFields"
        :statColumns="statColumns"
        :sections="sections"
        :shapeFiles="shapeFiles"
        @on-update="(p) => onPolicyUpdate(p, i)"
        @on-remove="() => onPolicyRemove(i)"
      />

      <div class="footer">
        <b-button
          class="button-add"
          variant="success"
          @click="addPolicy"
        >
          Add Policy
        </b-button>

        <b-button v-if="localPolicies.length > 0 && !aggrPolicyAdded"
          class="button-add ml-2"
          variant="success"
          @click="addAggrPolicy"
        >
          Add Aggregation Policy
        </b-button>
      </div>
    </b-col>
  </b-row>
</template>

<script>
import policy from './policy/policy.vue';
import {getRandomId} from '@/utils/formatters';

export default {
  props: {
    policies: {
      type: Array,
      default: () => []
    },
    variables: {
      type: Array,
      required: true
    },
    sections: {
      type: Array,
      required: true
    },
    shapeFiles: {
      type: Array,
      default: () => []
    }
  },
  components: {
    policy
  },
  data() {
    return {
      aggrPolicyAdded: this.policies.some(d => d.type === 'aggregation'),
      localPolicies: this.policies,
      factorFields: [],
      categoricalFields: [],
      numericalFields: [],
      statColumns: []
    }
  },
  methods: {
    fillLocalData() {
      const {variables} = this;

      this.categoricalFields = variables
        .filter(d => d.category == "categorical")
        .map(d => d.propName);

      this.numericalFields = variables
        .filter(d => d.category == "numeric")
        .map(d => d.propName);

      this.factorFields = variables
        .filter(d => d.category == "factor")
        .map(d => d.propName);

      this.statColumns = variables
        .filter(d => d.category == 'statistic')
        .map(d => d.propName)
    },
    addPolicy() {
      const firstPolicy = this.localPolicies[0];
      const id = getRandomId();

      let policy = {
        id,
        tree_state: null
      };

      if (firstPolicy && firstPolicy.type !== 'aggregation') {
        policy = Object.assign({}, firstPolicy, policy);  
      } 

      this.localPolicies.push(policy);

      if (this.$refs.policies) {
        this.$refs.policies.forEach(d => d.collapsePanel());
      }

      if (this.$refs.header)
        this.$refs.header.scrollIntoView();
    },
    addAggrPolicy() {
      const firstPolicy = this.localPolicies[0];
      this.localPolicies.push({
        ...firstPolicy,
        id: getRandomId(),
        budget: 0,
        costsFormModel: {
          selectedSection: null,
          pie_label: null
        },
        shapeFiles: [],
        type: 'aggregation', 
        name: 'aggregation policy',
        tree_state: null
      });
      
      if (this.$refs.policies)
        this.$refs.policies.forEach(d => d.collapsePanel());
      
      if (this.$refs.header)
        this.$refs.header.scrollIntoView();

      this.aggrPolicyAdded = true;
    },
    onPolicyUpdate(policy, index) {
      this.localPolicies[index] = { 
        ...policy
      };
      
      this.$emit('on-update', this.localPolicies);
    },
    onPolicyRemove(index) {
      this.localPolicies.splice(index, 1);
      this.$emit('on-update', this.localPolicies);

      if (!this.localPolicies.some(d => d.type === 'aggregation')) {
        this.aggrPolicyAdded = false;
      }
    },
    onFirstCriteriaUpdate (val, oldVal) {
      if (oldVal) {
        var oldIndex = this.statColumns.indexOf(oldVal);

        if (oldIndex > -1) {
          this.statColumns.splice(oldIndex, 1);
        }
      }

      if (val && this.statColumns.indexOf(val) === -1) {
        this.statColumns.push(val);
      }
    }
  },
  created() {
    this.fillLocalData();
  },
  watch: {
    variables() {
      this.fillLocalData();
    }
  }
}
</script>

<style lang="scss" scoped>
  .block-card {
    position: relative;
    padding-top: 30px;
    background-color: #fff;
    border-radius: 5px;
    margin-top: 30px;
    -webkit-box-shadow: 0px 2px 5px 0px rgba(0, 0, 0, 0.15);
    -moz-box-shadow: 0px 2px 5px 0px rgba(0, 0, 0, 0.15);
    box-shadow: 0px 2px 5px 0px rgba(0, 0, 0, 0.15);

    .header {
      margin-bottom: 20px;

      .header-text {
        font-weight: 600;
        font-size: 20px;
      }
    }

    .footer {
      display: flex;
      justify-content: flex-end;
      margin-top: 15px;
      margin-bottom: 15px;
    }
  }
</style>