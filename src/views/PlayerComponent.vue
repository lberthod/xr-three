<template>
    <div class="Character grid-cell" :class="{ you: isYou }" :style="playerStyle">
      <div class="Character_shadow grid-cell"></div>
      <div class="Character_sprite grid-cell" :data-color="player.color"></div>
      <div class="Character_name-container">
        <span class="Character_name">{{ player.name }}</span>
        <span class="Character_coins">{{ player.coins }}</span>
      </div>
      <div class="Character_you-arrow" v-if="isYou"></div>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      player: {
        type: Object,
        required: true
      },
      isYou: {
        type: Boolean,
        default: false
      }
    },
    computed: {
      playerStyle() {
        const left = 16 * this.player.x + 'px';
        const top = 16 * this.player.y - 4 + 'px';
        return {
          transform: `translate3d(${left}, ${top}, 0)`
        };
      }
    }
  };
  </script>
  
  <style scoped>
  .Character {
    transition: transform 0.4s;
  }
  
  .Character_shadow {
    background: url('../assets/images/shadow.png') no-repeat no-repeat;
  }
  
  .Character_sprite {
    background: url('../assets/images/characters.png') no-repeat;
    width: 16px;
    height: 16px;
  }
  
  .Character_name-container {
    position: absolute;
    top: -12px;
    left: -5px;
    font-size: 5px;
    padding: 1px 2px 1px;
    border-radius: 3px;
    background: #333;
    color: white;
    font-weight: bold;
    text-transform: uppercase;
    white-space: nowrap;
  }
  
  .Character_coins {
    margin-left: 1px;
    color: gold;
  }
  </style>
  