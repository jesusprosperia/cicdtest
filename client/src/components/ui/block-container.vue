<template>
  <b-row class="block-container">
    <b-col :lg="fullWidth ? 12 : 4">
      <h3 class="header">
        {{ title }}
      </h3>
    </b-col>
    <b-col :lg="fullWidth ? 12 : 8">
      <slot></slot>
    </b-col>
  </b-row>
</template>

<script>
export default {
  props: {
    title: {
      type: String
    },
    fullWidth: {
      type: Boolean,
      default: false,
    }
  },
 
}
</script>

<style lang="scss">
  .block-container {
    position: relative;
    padding: 20px 5px;
    background-color: #fff;
    border-radius: 5px;
    margin-top: 30px;
    -webkit-box-shadow: 0px 2px 5px 0px rgba(0, 0, 0, 0.15);
    -moz-box-shadow: 0px 2px 5px 0px rgba(0, 0, 0, 0.15);
    box-shadow: 0px 2px 5px 0px rgba(0, 0, 0, 0.15);

    .header {
      font-weight: 600;
      font-size: 20px;
      margin-bottom: 12px;
    }

    .blue {
      color: #01183c;
    }

    .orange {
      color: #f08e3b;
    }
  }
</style>