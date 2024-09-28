<template>
  <!-- La sphère sera ajoutée à la scène via le sous-composant -->
</template>

<script>
import * as THREE from 'three';
import { ref, set, get, database } from '../../firebase';

export default {
  name: 'SphereMovementFromGameComponent',
  props: ['scene', 'color', 'position', 'controllers', 'idSphere'],
  data() {
    return {
      isColliding: false,
      canIncrement: true,
      hasFirstCollisionHappened: false,
      sphereBoundingSphere: null,
    };
  },
  mounted() {
    console.log(`Sphere with ID ${this.idSphere} mounted`);
    this.addSphere();
  },
  watch: {
    color(newColor) {
      console.log(`Sphere color changed to ${newColor}`);
      this.updateSphereColor(newColor);
    },
    position: {
      handler(newPosition) {
        console.log(`Sphere position changed to x: ${newPosition.x}, y: ${newPosition.y}, z: ${newPosition.z}`);
        this.updateSpherePosition(newPosition);
      },
      deep: true,
    }
  },
  methods: {


    async addSphere() {
      if (!this.scene) {
        console.error("La scène n'est pas disponible");
        return;
      }

      console.log("Adding sphere to the scene");
      const geometry = new THREE.SphereGeometry(0.1, 32, 32);
      this.material = new THREE.MeshStandardMaterial({ color: this.color });
      this.sphere = new THREE.Mesh(geometry, this.material);
      this.sphere.castShadow = true;
      this.sphere.receiveShadow = true;

      if (!this.position) {
        console.warn("No initial position set for the sphere");
        return;
      }

      this.updateSpherePosition(this.position);
      this.scene.add(this.sphere);

      this.sphereBoundingSphere = new THREE.Sphere(this.sphere.position, 1);
      console.log("Sphere added, starting collision detection");

      this.checkCollision();
    },
    updateSphereColor(newColor) {
      if (this.sphere) {
        this.sphere.material.color.set(newColor);
        console.log(`Sphere color updated to: ${newColor}`);
      }
    },
    updateSpherePosition(newPosition) {
      if (this.sphere) {
        this.sphere.position.set(newPosition.x, newPosition.y, newPosition.z);
        if (this.sphereBoundingSphere) {
          this.sphereBoundingSphere.center.copy(this.sphere.position);
        }
        console.log(`Sphere position updated to x: ${newPosition.x}, y: ${newPosition.y}, z: ${newPosition.z}`);
      }
    },
    checkCollision() {
      const check = () => {
        if (this.controllers && this.controllers.length > 0 && this.sphere) {
          this.controllers.forEach(controller => {
            const controllerPosition = new THREE.Vector3();
            controller.getWorldPosition(controllerPosition);

            const sphereRadius = 0.1; // Rayon de la sphère visible

            // Calculer la distance entre le contrôleur et le centre de la sphère
            const distance = controllerPosition.distanceTo(this.sphere.position);

            // Vérifier si la distance entre le contrôleur et la surface de la sphère est inférieure ou égale au rayon de la sphère
            const isColliding = distance <= (sphereRadius * 1.55);

            if (isColliding && !this.isColliding && this.canIncrement) {
              console.log("Controller entered the sphere for the first time");
              this.incrementScore();
              this.isColliding = true;
              this.hasFirstCollisionHappened = true;
              this.canIncrement = false;
            } else if (!isColliding && this.isColliding) {
              console.log("Controller exited the sphere");
              this.isColliding = false;
              this.canIncrement = true;
              this.hasFirstCollisionHappened = false;
            }
          });
        }
        setTimeout(check, 16);
      };

      check();
    },
    async incrementScore() {
      console.log("Incrementing score");
      const scoreRef = ref(database, 'game/score');
      const snapshot = await get(scoreRef);
      const currentScore = snapshot.val() || 0;
      const newScore = currentScore + 1;

      await set(scoreRef, newScore);
      console.log(`Score updated to: ${newScore}`);

      // Détruire la sphère après l'incrémentation du score
      this.destroySphere();
    },
    destroySphere() {
      if (this.sphere) {
        // Retirer la sphère de la scène
        this.scene.remove(this.sphere);

        // Libérer la mémoire en supprimant la géométrie et le matériau
        this.sphere.geometry.dispose();
        this.sphere.material.dispose();

        // Supprimer les références
        this.sphere = null;
        this.sphereBoundingSphere = null;
        this.removeSphereFromDatabase();

        console.log("Sphere has been destroyed");
      }
    },
    removeSphereFromDatabase() {
      console.log("delete : " + this.idSphere + " - " + this.sphere);
      const sphereRef = ref(database, `randoms/${this.idSphere}`);
      set(sphereRef, null)
        .then(() => {
          console.log("Sphere delete  has been removed from Firebase Realtime Database");
        })
        .catch((error) => {
          console.error("Error delete removing sphere from Firebase:", error);
        });
    },
  }
};
</script>

<style scoped>
/* Styles spécifiques à la sphère */
</style>
