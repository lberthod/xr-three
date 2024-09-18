<template>
  <!-- No DOM element is directly rendered -->
</template>

<script>
import { markRaw } from 'vue';
import * as THREE from 'three';

export default {
  name: 'CubeAComponent',
  props: {
    scene: {
      type: Object,
      required: true,
    },
  },
  mounted() {
    this.createCube();
  },
  methods: {
    createCube() {
      // Create cube geometry and material
      const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });

      // Create the mesh and mark it as non-reactive
      const cube = markRaw(new THREE.Mesh(geometry, material));
      cube.position.set(0, 0.25, 0); // Position above the floor slightly
      cube.castShadow = true;

      // Add cube to the scene
      this.scene.add(cube);
    },
  },
};
</script>

<style scoped>
/* No additional styles needed */
</style>
