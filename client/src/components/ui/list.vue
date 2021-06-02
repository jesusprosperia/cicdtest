<template>
  <div class="list">
    <div
      class="list-item"
      v-for="(item, i) in list"
      :key="`item-${i}`"
    >
      <div class="label">{{ item.name }}</div>
      <slot name="actions" :datum="item"></slot>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    list: {
      type: Array,
      required: true,
    }
  }
}
</script>

<style lang="scss" scoped>
  .list {
    margin-bottom: 10px;

    .list-item {
      display: flex;
      align-content: center;
      align-items: center;
      padding-top: 5px;
      padding-bottom: 5px;

      .label {
        margin-right: 10px;
        flex-grow: 1;
        font-size: 16px;
        border-bottom: 1px solid #ddd;
      }
    }
  }
</style>