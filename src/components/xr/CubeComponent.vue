<template>
  <!-- The cube will be added to the scene via this sub-component -->
</template>

<script>
import * as THREE from 'three';

export default {
  name: 'CubeComponent',
  props: ['scene', 'color', 'position'],
  mounted() {
    this.addCube();
  },
  watch: {
    color(newColor) {
      this.updateCubeColor(newColor); // Update cube color when prop changes
    },
    position: {
      handler(newPosition) {
        this.updateCubePosition(newPosition); // Update position when prop changes
      },
      deep: true
    }
  },
  methods: {
    addCube() {
      const geometry = new THREE.BoxGeometry();
      this.material = new THREE.MeshStandardMaterial({ color: this.color });
      this.cube = new THREE.Mesh(geometry, this.material);
      this.cube.castShadow = true;
      this.cube.receiveShadow = true;

      // Set initial position
      this.updateCubePosition(this.position);
      this.scene.add(this.cube);
    },
    updateCubeColor(newColor) {
      if (this.cube) {
        this.cube.material.color.set(newColor); // Update the material color
      }
    },
    updateCubePosition(newPosition) {
      if (this.cube) {
        this.cube.position.set(newPosition.x, newPosition.y, newPosition.z); // Update cube position
      }
    }
  }
};
</script>

<style scoped>
/* Cube specific styles */
</style>
