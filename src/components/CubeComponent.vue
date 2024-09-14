<template>
  <!-- Le cube sera ajouté dans la scène via ce sous-composant -->
</template>

<script>
import * as THREE from 'three';

export default {
  name: 'CubeComponent',
  props: ['scene', 'color'],
  mounted() {
    this.addCube();
  },
  watch: {
    color(newColor) {
      this.updateCubeColor(newColor); // Mettre à jour la couleur du cube si la prop change
    }
  },
  methods: {
    addCube() {
      const geometry = new THREE.BoxGeometry();
      this.material = new THREE.MeshStandardMaterial({ color: this.color });
      this.cube = new THREE.Mesh(geometry, this.material);
      this.cube.castShadow = true;
      this.cube.receiveShadow = true;
      this.cube.position.set(0, 1.5, -2); // Position initiale du cube
      this.scene.add(this.cube);
    },
    updateCubeColor(newColor) {
      if (this.cube) {
        this.cube.material.color.set(newColor); // Mise à jour de la couleur du matériau
      }
    }
  }
};
</script>

<style scoped>
/* Styles spécifiques au cube si nécessaire */
</style>
