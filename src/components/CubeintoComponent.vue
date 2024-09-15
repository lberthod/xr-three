<template>
    <!-- No DOM element directly rendered -->
  </template>
  
  <script>
  import { markRaw } from 'vue';
  import * as THREE from 'three';
  import { ref, onValue } from 'firebase/database'; // Import Firebase Database methods
  import { database } from '../firebase'; // Import Firebase instance
  
  export default {
    name: 'CubeintoComponent',
    props: {
      scene: {
        type: Object,
        required: true,
      },
      cubeId: {
        type: String,
        required: true,
      },
    },
    data() {
      return {
        cube: null,
        cubeRef: null,
      };
    },
    mounted() {
      // Initialize cube and listen for real-time updates
      this.createCube();
      this.listenForCubePositionUpdates();
    },
    methods: {
      createCube() {
        // Create a basic Three.js cube and add it to the scene
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        this.cube = markRaw(new THREE.Mesh(geometry, material));
        this.cube.castShadow = true;
        this.scene.add(this.cube);
      },
      listenForCubePositionUpdates() {
        // Reference to the Firebase real-time database for the cube position
        this.cubeRef = ref(database, `cubeas/cube1/position`);
        onValue(this.cubeRef, (snapshot) => {
          const position = snapshot.val();
          if (position && this.cube) {
            this.cube.position.set(position.x, position.y, position.z);
          }
        });
      },
    },
    beforeUnmount() {
      if (this.cubeRef) {
        this.cubeRef.off(); // Detach listener when component is unmounted
      }
      if (this.cube) {
        this.scene.remove(this.cube); // Remove cube from scene
      }
    },
  };
  </script>
  
  <style scoped>
  /* No styles needed for the component */
  </style>
  