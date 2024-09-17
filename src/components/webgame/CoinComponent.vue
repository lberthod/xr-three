<template>
    <div class="Coin grid-cell" :style="coinStyle">
      <div class="Coin_shadow grid-cell"></div>
      <div class="Coin_sprite grid-cell"></div>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      x: Number,
      y: Number,
    },
    computed: {
      coinStyle() {
        const left = 16 * this.x + 'px';
        const top = 16 * this.y - 4 + 'px';
        return { transform: `translate3d(${left}, ${top}, 0)` };
      },
    },
  };
  </script>
  
  <style scoped>
  .Coin_sprite {
    background: url('../../assets/images/coin.png') no-repeat;
  }
  
  .Coin_shadow {
    background: url('../../assets/images/coin-shadow.png') no-repeat;
  }
  </style>
  