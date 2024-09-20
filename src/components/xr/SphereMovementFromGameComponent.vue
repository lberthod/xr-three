<template>
  <!-- The sphere will be added to the scene via this sub-component -->
</template>

<script>
import * as THREE from 'three';

export default {
  name: 'SphereMovementFromGameComponent',
  props: ['scene', 'color', 'position'],
  mounted() {
    this.addSphere(); // Créer la sphère lors du montage du composant
  },
  watch: {
    color(newColor) {
      this.updateSphereColor(newColor); // Mettre à jour la couleur de la sphère lorsque la prop change
    },
    position: {
      handler(newPosition) {
        this.updateSpherePosition(newPosition); // Mettre à jour la position lorsque la prop change
      },
      deep: true, // Surveiller les changements en profondeur pour les objets complexes
    }
  },
  methods: {
    addSphere() {
      if (!this.scene) {
        console.error("La scène n'est pas disponible");
        return;
      }
      console.log("La scène est  disponible");

      // Créer la géométrie et le matériau pour la sphère
      const geometry = new THREE.SphereGeometry(1, 32, 32); // Une sphère avec un rayon de 1 et 32 segments
      this.material = new THREE.MeshStandardMaterial({ color: this.color });
      this.sphere = new THREE.Mesh(geometry, this.material);
      this.sphere.castShadow = true;
      this.sphere.receiveShadow = true;

      if (!this.position) {
        return; // Si aucune position n'est définie, on arrête ici
      }

      // Position initiale de la sphère
      this.updateSpherePosition(this.position);
      this.scene.add(this.sphere); // Ajouter la sphère à la scène
    },
    updateSphereColor(newColor) {
      if (this.sphere) {
        this.sphere.material.color.set(newColor); // Mettre à jour la couleur du matériau de la sphère
      }
    },
    updateSpherePosition(newPosition) {
      if (this.sphere) {
        // Mettre à jour la position de la sphère avec les nouvelles coordonnées
        this.sphere.position.set(newPosition.x, newPosition.y, newPosition.z);
      }
    }
  }
};
</script>

<style scoped>
/* Styles spécifiques à la sphère */
</style>
