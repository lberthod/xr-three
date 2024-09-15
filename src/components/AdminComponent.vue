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

    <!-- Form to edit the text information -->
    <div class="text-editor">
      <h2>Edit Text Information</h2>
      <form @submit.prevent="updateTextData">
        <!-- Text content -->
        <label for="content">Text Content: </label>
        <input type="text" v-model="text.content" placeholder="Enter text" />

        <!-- Position inputs -->
        <label for="positionX">Position X: </label>
        <input type="number" v-model="text.position.x" />
        <label for="positionY">Position Y: </label>
        <input type="number" v-model="text.position.y" />
        <label for="positionZ">Position Z: </label>
        <input type="number" v-model="text.position.z" />

        <!-- Rotation inputs -->
        <label for="rotationX">Rotation X: </label>
        <input type="number" v-model="text.rotation.x" />
        <label for="rotationY">Rotation Y: </label>
        <input type="number" v-model="text.rotation.y" />
        <label for="rotationZ">Rotation Z: </label>
        <input type="number" v-model="text.rotation.z" />

        <!-- Size input -->
        <label for="size">Text Size: </label>
        <input type="number" v-model="text.size" />

        <button type="submit">Update Text</button>
      </form>
    </div>

    <!-- New section for Grabbable Cube -->
    <div class="grabbable-cube-editor">
      <h2>Edit Grabbable Cube</h2>
      <form @submit.prevent="updateGrabbableCubeData">
        <!-- Position inputs -->
        <label for="positionX">Position X: </label>
        <input type="number" v-model="grabbableCube.position.x" step="0.1" />

        <label for="positionY">Position Y: </label>
        <input type="number" v-model="grabbableCube.position.y" step="0.1" />

        <label for="positionZ">Position Z: </label>
        <input type="number" v-model="grabbableCube.position.z" step="0.1" />

        <!-- Rotation inputs -->
        <label for="rotationX">Rotation X (degrees): </label>
        <input type="number" v-model="grabbableCube.rotation.x" step="1" />

        <label for="rotationY">Rotation Y (degrees): </label>
        <input type="number" v-model="grabbableCube.rotation.y" step="1" />

        <label for="rotationZ">Rotation Z (degrees): </label>
        <input type="number" v-model="grabbableCube.rotation.z" step="1" />

        <!-- Scale inputs -->
        <label for="scaleX">Scale X: </label>
        <input type="number" v-model="grabbableCube.scale.x" step="0.1" />

        <label for="scaleY">Scale Y: </label>
        <input type="number" v-model="grabbableCube.scale.y" step="0.1" />

        <label for="scaleZ">Scale Z: </label>
        <input type="number" v-model="grabbableCube.scale.z" step="0.1" />

        <!-- Submit Button -->
        <button type="submit">Update Grabbable Cube</button>
      </form>
    </div>

  </div>
</template>

<script>
import { ref as dbRef, set, onValue, push, update } from 'firebase/database'; 
import { database } from '../firebase'; // Import Firebase configuration
import * as THREE from 'three';

export default {
  name: 'AdminComponent',
  data() {
    return {
      cubes: {}, // Object to store all cubes from Firebase
      text: {
        content: '', // The actual text to display
        position: {
          x: 0,
          y: 1.5,
          z: -2
        },
        rotation: {
          x: 0,
          y: 0,
          z: 0
        },
        size: 1 // Size of the text
      },
      grabbableCube: {
        position: { x: 0, y: 0.7, z: -1 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
    };
  },
  mounted() {
    this.listenForCubeChanges(); // Load cubes on mount
    this.loadTextData(); // Load text data on mount
    this.loadGrabbableCubeData(); // Load grabbable cube data on mount
  },
  methods: {
    // Listen for changes in the cubes collection in Firebase
    listenForCubeChanges() {
      const cubesRef = dbRef(database, 'cubes');
      onValue(cubesRef, (snapshot) => {
        this.cubes = snapshot.val() || {}; // Load all cubes into the component
      });
    },

    // Load text data from Firebase
    loadTextData() {
      const textRef = dbRef(database, 'text');
      onValue(textRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          this.text = data;
        }
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
    },

    // Update the text data in Firebase
    updateTextData() {
      const textRef = dbRef(database, 'text');
      set(textRef, this.text) // Save the text data to Firebase
        .then(() => {
          alert('Text updated successfully!');
        })
        .catch((error) => {
          alert('Error updating text: ' + error);
        });
    },

    // Load grabbable cube data from Firebase
    loadGrabbableCubeData() {
      const cubeRef = dbRef(database, 'grabbableCubes/cube1'); // Assuming 'cube1' is the cubeId

      onValue(cubeRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Convert rotation from radians to degrees for the admin interface
          this.grabbableCube = {
            position: data.position,
            rotation: {
              x: THREE.MathUtils.radToDeg(data.rotation.x),
              y: THREE.MathUtils.radToDeg(data.rotation.y),
              z: THREE.MathUtils.radToDeg(data.rotation.z),
            },
            scale: data.scale,
          };
        }
      });
    },

    // Update grabbable cube data in Firebase
    updateGrabbableCubeData() {
      const cubeRef = dbRef(database, 'grabbableCubes/cube1'); // Use the same cubeId as in GrabbableCube.vue

      // Prepare data to save, converting rotation back to radians
      const cubeData = {
        position: {
          x: this.grabbableCube.position.x,
          y: this.grabbableCube.position.y,
          z: this.grabbableCube.position.z,
        },
        rotation: {
          x: THREE.MathUtils.degToRad(this.grabbableCube.rotation.x),
          y: THREE.MathUtils.degToRad(this.grabbableCube.rotation.y),
          z: THREE.MathUtils.degToRad(this.grabbableCube.rotation.z),
        },
        scale: {
          x: this.grabbableCube.scale.x,
          y: this.grabbableCube.scale.y,
          z: this.grabbableCube.scale.z,
        },
      };

      update(cubeRef, cubeData)
        .then(() => {
          alert('Grabbable cube updated successfully!');
        })
        .catch((error) => {
          alert('Error updating grabbable cube: ' + error);
        });
    },
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

.text-editor {
  margin-top: 50px;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 10px;
}

/* Styles for the grabbable cube editor */
.grabbable-cube-editor {
  margin-top: 50px;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 10px;
}
</style>
