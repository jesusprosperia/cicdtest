<template>
  <b-row class="block">
    <b-col lg="5">
      <h3 class="header">
        {{ title }}
      </h3>
    </b-col>
    <b-col lg="7">
      <slot></slot>
    </b-col>
  </b-row>
</template>

<script>
export default {
  props: {
    title: String
  }
}
</script>

<style lang="scss" scoped>
  .block {
    position: relative;
    padding-top: 30px;
    padding-bottom: 30px;
    background-color: #fff;
    border-radius: 5px;
    margin: 0 0 30px 0;
    -webkit-box-shadow: 0px 2px 5px 0px rgba(0, 0, 0, 0.15);
    -moz-box-shadow: 0px 2px 5px 0px rgba(0, 0, 0, 0.15);
    box-shadow: 0px 2px 5px 0px rgba(0, 0, 0, 0.15);

    &:last-child {
      margin-bottom: 0px !important;
    }

    .header {
      font-weight: 600;
      font-size: 20px;
      margin-bottom: 20px;
    }

    .blue {
      color: #01183c;
    }

    .orange {
      color: #f08e3b;
    }
  }
</style>