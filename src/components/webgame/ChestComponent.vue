<template>
    <div 
      class="chest-component grid-cell"
      :style="chestStyle"
      :class="{ 'chest-open': isOpened, 'chest-closed': !isOpened }"
    >
    </div>
  </template>
  
  <script>
  export default {
    props: {
      x: Number,
      y: Number,
      id: Number,
      playerX: Number,
      playerY: Number,
      message: String
    },
    data() {
      return {
        isOpened: false, // État du coffre (fermé au départ)
      };
    },
    computed: {
      chestStyle() {
        const left = 16 * this.x + 'px';
        const top = 16 * this.y - 4 + 'px';
        return {
          transform: `translate3d(${left}, ${top}, 0)`
        };
      }
    },
    methods: {
      openChest() {
        if (!this.isOpened) {
          this.isOpened = true; // Ouvre le coffre
          this.$emit('chestOpened', this.message); // Émet l'événement d'ouverture avec un message
        }
      }
    }
  };
  </script>
  
  <style scoped>
  .chest-component {
    position: absolute;
    width: 16px;
    height: 16px;
    background-size: cover;
  }
  
  .chest-closed {
    background: url('../../assets/images/chest-closed.png') no-repeat;
  }
  
  .chest-open {
    background: url('../../assets/images/chest-open.png') no-repeat;
  }
  </style>
  