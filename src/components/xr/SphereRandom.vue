<template>
  <!-- La sphère sera ajoutée à la scène via le sous-composant -->
</template>

<script>
import * as THREE from 'three';
import { ref, set, get, database, runTransaction } from '../../firebase';

export default {
  name: 'SphereRandom',
  props: ['scene', 'color', 'position', 'controllers', 'sphereId' , 'scoreId'],
  data() {
    return {
      isColliding: false,
      canIncrement: true,
      hasFirstCollisionHappened: false,
      sphereBoundingSphere: null,
      currentPosition: this.position || { x: 0, y: 0, z: 0 }, // Initialisation de la position courante
    };
  },
  mounted() {
    console.log("lali : " + this.scoreId);

    console.log(`Sphere with ID ${this.sphereId} mounted`);
    console.log(`Sphere initial position x: ${this.currentPosition.x}`);

    this.addSphere();
  },
  watch: {
    color(newColor) {
      console.log(`Sphere color changed to ${newColor}`);
      this.updateRandomColor();
    },
    position: {
      handler(newPosition) {
        console.log(`Sphere position changed to x: ${newPosition.x}, y: ${newPosition.y}, z: ${newPosition.z}`);
        this.updateSpherePosition(newPosition);
      },
      deep: true,
    },
  },
  methods: {
    // Fonction pour générer une position aléatoire autour du joueur
    generateRandomPosition() {
      const playerX = 0;
      const playerY = 0;
      const playerZ = 0.5;
      const range = 0.8; // Ajustez cette valeur pour définir la distance autour du joueur

      const x = playerX + (Math.random() * (2 * range) - range); // Entre playerX - range et playerX + range
      const y = playerY + (Math.random() * (2 * range) - range); // Entre playerY - range et playerY + range
      const z = playerZ + (Math.random() * (2 * range) - range); // Entre playerZ - range et playerZ + range

      return { x, y, z };
    },

    async addSphere() {
      if (!this.scene) {
        console.error("La scène n'est pas disponible");
        return;
      }

      console.log("Adding sphere to the scene");

      // Vérifier si la sphère existe déjà pour éviter les duplicatas
      if (this.sphere) {
        console.warn("La sphère existe déjà");
        return;
      }

      const geometry = new THREE.SphereGeometry(0.1, 32, 32);
      this.material = new THREE.MeshStandardMaterial({ color: this.color });
      this.sphere = new THREE.Mesh(geometry, this.material);
      this.sphere.castShadow = true;
      this.sphere.receiveShadow = true;

      if (!this.currentPosition) {
        console.warn("No initial position set for the sphere");
        return;
      }
      this.updateRandomColor();
      this.updateSpherePosition(this.currentPosition);
      this.scene.add(this.sphere);

      this.sphereBoundingSphere = new THREE.Sphere(this.sphere.position, 1);
      console.log("Sphere added, starting collision detection");

      this.checkCollision();
    },

    updateRandomColor() {
      if (this.sphere) {
        // Générer une couleur aléatoire
        const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);

        // Appliquer la couleur aléatoire à la sphère
        this.sphere.material.color.set(randomColor);
        console.log(`Sphere color updated to random color: ${randomColor}`);

        // Mettre à jour la couleur dans la base de données Firebase en fonction de l'ID de la sphère
        const sphereRef = ref(database, `randoms/${this.sphereId}/color`);
        set(sphereRef, randomColor)
          .then(() => {
            console.log(`Color of sphere ${this.sphereId} successfully updated in Firebase to: ${randomColor}`);
          })
          .catch((error) => {
            console.error("Error updating sphere color in Firebase:", error);
          });
      }
    },

    updateSpherePosition(newPosition) {
      if (this.sphere) {
        this.currentPosition = newPosition; // Mettre à jour la position courante
        this.sphere.position.set(newPosition.x, newPosition.y, newPosition.z);
        if (this.sphereBoundingSphere) {
          this.sphereBoundingSphere.center.copy(this.sphere.position);
        }

        console.log(`Sphere position updated to x: ${newPosition.x}, y: ${newPosition.y}, z: ${newPosition.z}`);

        // Mettre à jour la position dans la base de données Firebase en fonction de l'ID de la sphère
        const sphereRef = ref(database, `randoms/${this.sphereId}/position`);
        set(sphereRef, {
          x: newPosition.x,
          y: newPosition.y,
          z: newPosition.z
        })
          .then(() => {
            console.log(`Position of sphere ${this.sphereId} successfully updated in Firebase`);
          })
          .catch((error) => {
            console.error("Error updating sphere position in Firebase:", error);
          });
      }
    },

    async checkCollision() {
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
              this.removeSphereFromDatabase();
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
        setTimeout(check, 160);
      };

      check();
    },
    async incrementScore() {
      console.log("temps : " + this.scoreId);
      const scoreRef = ref(database, 'game/scores/'+this.scoreId);
      runTransaction(scoreRef, (currentScore) => {
        return (currentScore || 0) + 1;
      })
        .then(() => {
          console.log('Score mis à jour avec succès');
        })
        .catch((error) => {
          console.error('Erreur lors de la mise à jour du score :', error);
        });
    },
    destroySphere() {
      if (this.sphere) {
        // Retirer la sphère de la scène
        this.scene.remove(this.sphere);

        this.sphere.geometry.dispose();
        this.sphere.material.dispose();

        // Supprimer les références
        this.sphereBoundingSphere = null;

        console.log("Sphere has been destroyed");
        this.sphere = null;
        const delay = Math.random() * (10000 - 3000) + 3000;

        setTimeout(() => {
          const newPosition = this.generateRandomPosition();
          this.currentPosition = newPosition;
          this.addSphere();
        }, delay); // Le délai est en millisecondes (3000ms à 10000ms)
      }
    },

    async removeSphereFromDatabase() {
      console.log("try");
      if (this.sphere) {
        const sphereRef = ref(database, `randoms/${this.sphereId}`);

        try {
          // Récupérer les données de la sphère avant de tenter de la supprimer
          const snapshot = await get(sphereRef);
          console.log("snap -" + snapshot[0]);
          console.log("snapi--" + this.position.x);
          if (snapshot.exists()) {
            console.log("Sphere exists, proceeding to delete:", this.sphereId);

            await set(sphereRef, null);
            console.log("Sphere has been removed from Firebase Realtime Database");

            this.destroySphere();
            this.incrementScore();
          } else {
            console.warn(`Sphere with ID ${this.sphereId} does not exist in the database.`);
          }
        } catch (error) {
          console.error("Error retrieving or removing sphere from Firebase:", error);
        }
      }
    }

  }
};
</script>

<style scoped>
/* Styles spécifiques à la sphère */
</style>
