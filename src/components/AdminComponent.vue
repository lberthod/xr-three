<template>
    <div class="admin-container">
      <h1>Admin - Change Cube Position and Color</h1>
      <form @submit.prevent="updateCubeData">
        <!-- Color input -->
        <label for="color">Cube Color (Hex): </label>
        <input type="text" v-model="color" placeholder="#00ff00" />
        
        <!-- Position inputs -->
        <div>
          <label for="positionX">Position X: </label>
          <input type="number" v-model="positionX" />
        </div>
        <div>
          <label for="positionY">Position Y: </label>
          <input type="number" v-model="positionY" />
        </div>
        <div>
          <label for="positionZ">Position Z: </label>
          <input type="number" v-model="positionZ" />
        </div>
  
        <button type="submit">Update Cube Data</button>
      </form>
    </div>
  </template>
  
  <script>
  import { ref as dbRef, set } from 'firebase/database'; 
  import { database } from '../firebase';
  
  export default {
    name: 'AdminComponent',
    data() {
      return {
        color: '#00ff00', // Default color
        positionX: 0, // Default X position
        positionY: 1.5, // Default Y position
        positionZ: -2 // Default Z position
      };
    },
    methods: {
      updateCubeData() {
        // Reference to the cube data in Firebase
        const cubeRef = dbRef(database, 'cube');
        
        // Update the color and position in Firebase
        set(cubeRef, {
          color: this.color,
          position: {
            x: this.positionX,
            y: this.positionY,
            z: this.positionZ
          }
        })
          .then(() => {
            alert('Cube data updated successfully!');
          })
          .catch((error) => {
            alert('Error updating cube data: ' + error);
          });
      }
    }
  };
  </script>
  
  <style scoped>
  .admin-container {
    margin: 50px;
    text-align: center;
  }
  input {
    margin-right: 10px;
    padding: 5px;
    width: 150px;
  }
  button {
    padding: 5px 10px;
  }
  </style>
  