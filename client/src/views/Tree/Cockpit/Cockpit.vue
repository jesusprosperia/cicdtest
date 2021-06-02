<template>
  <div class="cockpit">
    <div class="tabpanel">
      <TabPanel
        :tabs="tabs"
        :activeTab="activeTab"
        @on-change-tab="(i) => $emit('on-change-tab', i)"
      />
    </div>

    <div class="cost-bar-title">
      {{ userTrans.selection_cost }}
    </div>
  </div>
</template>

<script>
import transMixin from '@/mixins/translation';
import TabPanel from "@/components/tab-panel/tab-panel.vue";

export default {
  mixins: [transMixin],
  props: {
    tabs: {
      type: Array,
      required: true
    },
    activeTab: {
      type: Number,
      required: true
    },
  },
  components: {
    TabPanel
  }
}
</script>

<style lang="scss" scoped>
.cockpit {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px; 

  .tabpanel {
    padding-left: 15px;
  }

  .cost-bar-title {
    font-weight: 600;
    text-align: center;
    width: 223px;
  }
}
</style>