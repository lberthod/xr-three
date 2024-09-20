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
      this.updateCubeColor(newColor); // Mettre à jour la couleur du cube lorsque la prop change
    },
    position: {
      handler(newPosition) {
        console.log("ya : " + newPosition);

        this.updateCubePosition(newPosition); // Mettre à jour la position lorsque la prop change
        console.log(newPosition);
      },
      deep: true, // Surveiller les changements en profondeur pour les objets complexes
    }
  },
  methods: {
    addCube() {
      const geometry = new THREE.BoxGeometry();
      this.material = new THREE.MeshStandardMaterial({ color: this.color });
      this.cube = new THREE.Mesh(geometry, this.material);
      this.cube.castShadow = true;
      this.cube.receiveShadow = true;
      console.log("ya : " + this.position);
      if (!this.position) {
        return;
      }
      console.log("ya : " + this.position.x);

      // Position initiale
      this.updateCubePosition(this.position);
      this.scene.add(this.cube);
    },
    updateCubeColor(newColor) {
      if (this.cube) {
        this.cube.material.color.set(newColor); // Mettre à jour la couleur du matériau du cube
      }
    },
    updateCubePosition(newPosition) {
      console.log(newPosition);
      console.log(newPosition.x);
      console.log(newPosition.y);
      console.log(newPosition.z);
      if (this.cube) {
        this.cube.position.set(newPosition.x, newPosition.y, newPosition.z); // Mettre à jour la position du cube
      }
    }
  }
};
</script>

<style scoped>
/* Styles spécifiques au cube */
</style>
