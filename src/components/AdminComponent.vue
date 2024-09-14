<template>
  <div class="admin-container">
    <h1>Admin - Manage Multiple Cubes</h1>

    <!-- Loop through the cubes object and display each cube's controls -->
    <ul>
      <li v-for="(cube, id) in cubes" :key="id">
        <h3>Cube ID: {{ id }}</h3>
        <form @submit.prevent="updateCubeData(id)">
          <!-- Color input -->
          <label for="color">Cube Color (Hex): </label>
          <input type="text" v-model="cube.color" placeholder="#00ff00" />

          <!-- Position X -->
          <label for="positionX">Position X: </label>
          <input type="number" v-model="cube.position.x" />

          <!-- Position Y -->
          <label for="positionY">Position Y: </label>
          <input type="number" v-model="cube.position.y" />

          <!-- Position Z -->
          <label for="positionZ">Position Z: </label>
          <input type="number" v-model="cube.position.z" />

          <!-- Submit Button -->
          <button type="submit">Update Cube</button>
        </form>
      </li>
    </ul>

    <!-- Button to add a new cube -->
    <button @click="addNewCube">Add New Cube</button>
  </div>
</template>

<script>
import { ref as dbRef, set, onValue, push } from 'firebase/database'; 
import { database } from '../firebase'; // Import Firebase configuration

export default {
  name: 'AdminComponent',
  data() {
    return {
      cubes: {} // Object to store all cubes from Firebase
    };
  },
  mounted() {
    this.listenForCubeChanges(); // Load cubes on mount
  },
  methods: {
    // Listen for changes in the cubes collection in Firebase
    listenForCubeChanges() {
      const cubesRef = dbRef(database, 'cubes');
      onValue(cubesRef, (snapshot) => {
        this.cubes = snapshot.val() || {}; // Load all cubes into the component
      });
    },
    // Update cube data in Firebase
    updateCubeData(cubeId) {
      const cubeRef = dbRef(database, `cubes/${cubeId}`);
      set(cubeRef, this.cubes[cubeId]) // Update cube in Firebase
        .then(() => {
          alert(`Cube ${cubeId} updated successfully!`);
        })
        .catch((error) => {
          alert('Error updating cube: ' + error);
        });
    },
    // Add a new cube to Firebase with default values
    addNewCube() {
      const cubesRef = dbRef(database, 'cubes');
      const newCubeRef = push(cubesRef); // Generate a new unique cube ID

      // Default cube properties (color and position)
      const newCubeData = {
        color: '#ffffff', // Default white color
        position: {
          x: 0,
          y: 1.5,
          z: 0
        }
      };

      // Save the new cube to Firebase
      set(newCubeRef, newCubeData)
        .then(() => {
          alert('New cube added successfully!');
        })
        .catch((error) => {
          alert('Error adding new cube: ' + error);
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
ul {
  list-style-type: none;
  padding: 0;
}
li {
  margin: 20px 0;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
}
input {
  margin: 5px 10px;
  padding: 5px;
  width: 150px;
}
button {
  margin-top: 10px;
  padding: 5px 10px;
}
</style>
