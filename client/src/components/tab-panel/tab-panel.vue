<template>
  <div class="tab-panel">
    <div class="tabs">
      <div 
        v-for="(tab, i) in tabs"
        :key="tab.id"
        :class="`tab ${i === currentTab ? 'active' : ''}`" 
        @click="currentTab = i; $emit('on-change-tab', currentTab)"
      >
        <slot v-bind:tab="tab">
          {{ tab.name }}
        </slot>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    tabs: {
      type: Array,
      required: true
    },
    activeTab: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      currentTab: this.activeTab
    }
  },
  watch: {
    activeTab() {
      if (this.currentTab !== this.activeTab) {
        this.currentTab = this.activeTab;
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  .tab-panel {
    width: 100%;
    display: flex;
    justify-content: flex-end;

    .tabs {
      display: flex;
      justify-content: flex-end;
      border-bottom: 1px solid #ddd;

      .tab {
        text-align: center;
        cursor: pointer;
        padding: 2px 10px;

        &.active {
          border-bottom: 1.5px solid #28a745;
        }
      }
    }
  }
</style>