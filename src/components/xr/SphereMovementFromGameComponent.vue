<template>
  <!-- The sphere will be added to the scene via ce sub-component -->
</template>

<script>
import * as THREE from 'three';
import { ref, set, get, database } from '../../firebase'; // Importer Firebase pour gérer le score

export default {
  name: 'SphereMovementFromGameComponent',
  props: ['scene', 'color', 'position', 'controllers'], // Controllers nécessaires pour détecter les collisions
  data() {
    return {
      isColliding: false,  // Indicateur si le contrôleur est dans la sphère
      canIncrement: true,  // Indicateur pour permettre la réincrémentation du score
      hasFirstCollisionHappened: false,  // Nouvel indicateur pour savoir si la première collision a eu lieu
    };
  },
  mounted() {
    console.log("Component mounted, sphere is about to be added");
    this.addSphere();  // Créer la sphère lors du montage du composant
  },
  watch: {
    color(newColor) {
      console.log(`Sphere color changed to ${newColor}`);
      this.updateSphereColor(newColor);  // Mettre à jour la couleur de la sphère lorsque la prop change
    },
    position: {
      handler(newPosition) {
        console.log(`Sphere position changed to x: ${newPosition.x}, y: ${newPosition.y}, z: ${newPosition.z}`);
        this.updateSpherePosition(newPosition);  // Mettre à jour la position lorsque la prop change
      },
      deep: true,  // Surveiller les changements en profondeur pour les objets complexes
    }
  },
  methods: {
    async addSphere() {
      if (!this.scene) {
        console.error("La scène n'est pas disponible");
        return;
      }

      console.log("Adding sphere to the scene");
      // Créer la géométrie et le matériau pour la sphère
      const geometry = new THREE.SphereGeometry(1, 32, 32);  // Une sphère avec un rayon de 1 et 32 segments
      this.material = new THREE.MeshStandardMaterial({ color: this.color });
      this.sphere = new THREE.Mesh(geometry, this.material);
      this.sphere.castShadow = true;
      this.sphere.receiveShadow = true;

      if (!this.position) {
        console.warn("No initial position set for the sphere");
        return;  // Si aucune position n'est définie, on arrête ici
      }

      // Position initiale de la sphère
      this.updateSpherePosition(this.position);
      this.scene.add(this.sphere);  // Ajouter la sphère à la scène

      console.log("Sphere added, starting collision detection");
      // Démarrer la détection des collisions
      this.checkCollision();
    },
    updateSphereColor(newColor) {
      if (this.sphere) {
        this.sphere.material.color.set(newColor);  // Mettre à jour la couleur du matériau de la sphère
        console.log(`Sphere color updated to: ${newColor}`);
      }
    },
    updateSpherePosition(newPosition) {
      if (this.sphere) {
        // Mettre à jour la position de la sphère avec les nouvelles coordonnées
        this.sphere.position.set(newPosition.x, newPosition.y, newPosition.z);
        console.log(`Sphere position updated to x: ${newPosition.x}, y: ${newPosition.y}, z: ${newPosition.z}`);
      }
    },
    checkCollision() {
      // Fonction pour vérifier l'entrée et la sortie de la sphère via la distance
      const check = () => {
        if (this.controllers && this.controllers.length > 0) {
          this.controllers.forEach(controller => {
            const controllerPosition = new THREE.Vector3();
            controller.getWorldPosition(controllerPosition);

            // Calculer la distance entre le contrôleur et la sphère
            const distance = controllerPosition.distanceTo(this.sphere.position);
            console.log(`Distance between controller and sphere: ${distance}`);

            const isInside = distance < 1;  // Si la distance est inférieure à 1, on considère que le contrôleur est dans la sphère
            if (isInside && !this.isColliding && this.canIncrement) {
              console.log("Controller entered the sphere for the first time");
              // Si le contrôleur entre dans la sphère pour la première fois
              this.incrementScore();  // Appeler la fonction d'incrémentation du score
              this.isColliding = true;  // Verrouiller l'état de collision
              this.hasFirstCollisionHappened = true;  // Indiquer que la première collision a eu lieu
              this.canIncrement = false;  // Désactiver la possibilité de réincrémenter
            } else if (!isInside && this.isColliding) {
              console.log("Controller exited the sphere");
              // Si le contrôleur est sorti de la sphère
              this.isColliding = false;  // Réinitialiser l'état de collision
              this.canIncrement = true;  // Réactiver la possibilité d'incrémenter à la prochaine entrée
              this.hasFirstCollisionHappened = false;  // Réinitialiser la première collision
            }
          });
        }
        requestAnimationFrame(check);  // Continuer de vérifier les collisions à chaque frame
      };

      // Démarrer la vérification des collisions
      check();
    },
    async incrementScore() {
      console.log("Incrementing score");
      const scoreRef = ref(database, 'game/score');  // Référence vers la base de données Firebase pour le score
      const snapshot = await get(scoreRef);  // Obtenir la valeur actuelle du score
      const currentScore = snapshot.val() || 0;  // Si aucun score, initialiser à 0
      const newScore = currentScore + 1;

      // Mettre à jour le score dans Firebase
      await set(scoreRef, newScore);
      console.log(`Score updated to: ${newScore}`);
    }
  }
};
</script>

<style scoped>
/* Styles spécifiques à la sphère */
</style>
