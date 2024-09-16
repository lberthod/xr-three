<template>
    <div v-if="show" class="overlay">
      <div class="dialogue-box">
        <p>{{ message }}</p>
        <button @click="closeOverlay">OK</button>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      message: {
        type: String,
        default: ''
      },
      show: {
        type: Boolean,
        default: false
      }
    },
    methods: {
      closeOverlay() {
        this.$emit('close');
      }
    }
  };
  </script>
  
  <style scoped>
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .dialogue-box {
    background: white;
    padding: 20px;
    border-radius: 10px;
    text-align: center;
    width: 300px;
  }
  
  button {
    margin-top: 10px;
    padding: 5px 10px;
    background-color: #59ff5a;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
  
  button:hover {
    background-color: #45d645;
  }
  </style>
  