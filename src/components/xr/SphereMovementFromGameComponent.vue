<template>
  <!-- The sphere will be added to the scene via this sub-component -->
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
      temp: null,
    };
  },
  mounted() {
    this.addSphere();  // Créer la sphère lors du montage du composant
  },
  watch: {
    color(newColor) {
      this.updateSphereColor(newColor);  // Mettre à jour la couleur de la sphère lorsque la prop change
    },
    position: {
      handler(newPosition) {
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

      // Créer la géométrie et le matériau pour la sphère
      const geometry = new THREE.SphereGeometry(1, 32, 32);  // Une sphère avec un rayon de 1 et 32 segments
      this.material = new THREE.MeshStandardMaterial({ color: this.color });
      this.sphere = new THREE.Mesh(geometry, this.material);
      this.sphere.castShadow = true;
      this.sphere.receiveShadow = true;

      if (!this.position) {
        return;  // Si aucune position n'est définie, on arrête ici
      }

      // Position initiale de la sphère
      this.updateSpherePosition(this.position);
      this.scene.add(this.sphere);  // Ajouter la sphère à la scène

      // Démarrer la détection des collisions
      this.checkCollision();
    },
    updateSphereColor(newColor) {
      if (this.sphere) {
        this.sphere.material.color.set(newColor);  // Mettre à jour la couleur du matériau de la sphère
      }
    },
    updateSpherePosition(newPosition) {
      if (this.sphere) {
        // Mettre à jour la position de la sphère avec les nouvelles coordonnées
        this.sphere.position.set(newPosition.x, newPosition.y, newPosition.z);
      }
    },
    checkCollision() {
      // Fonction pour vérifier l'entrée dans la sphère
      const check = () => {
        if (this.controllers && this.controllers.length > 0) {
          this.controllers.forEach(controller => {
            const controllerPosition = new THREE.Vector3();
            controller.getWorldPosition(controllerPosition);

            const distance = controllerPosition.distanceTo(this.sphere.position);
            const isInside = distance < 1;  // Si la distance est inférieure à 1, on considère que le contrôleur est dans la sphère
            console.log(this.temp);
            if (isInside && !this.isColliding && this.canIncrement && !this.temp) {
              // Si le contrôleur entre dans la sphère et qu'il n'était pas en collision et que l'incrémentation est autorisée
              this.temp = true;
              this.incrementScore();
              this.isColliding = true;  // Verrouiller l'état de collision
              this.canIncrement = false;  // Désactiver la possibilité de réincrémenter jusqu'à la sortie
              this.checkOutCollision();  // Commencer à vérifier la sortie
            }
          });
        }
        requestAnimationFrame(check);  // Continuer de vérifier les collisions à chaque frame
      };

      // Démarrer la vérification des collisions
      check();
    },
    checkOutCollision() {
      // Fonction pour vérifier la sortie de la sphère
      const checkOut = () => {
        if (this.controllers && this.controllers.length > 0) {
          this.controllers.forEach(controller => {
            const controllerPosition = new THREE.Vector3();
            controller.getWorldPosition(controllerPosition);

            const distance = controllerPosition.distanceTo(this.sphere.position);
            const isInside = distance < 1;  // Vérifie si le contrôleur est toujours dans la sphère

            if (!isInside && this.isColliding) {
              // Si le contrôleur est sorti de la sphère
              this.isColliding = false;  // Réinitialiser l'état de collision
              this.canIncrement = true;  // Réactiver la possibilité d'incrémenter à la prochaine entrée
            }
          });
        }
        requestAnimationFrame(checkOut);  // Continuer de vérifier la sortie à chaque frame
      };

      // Démarrer la vérification de la sortie
      checkOut();
    },
    async incrementScore() {
      const scoreRef = ref(database, 'game/score');  // Référence vers la base de données Firebase pour le score
      const snapshot = await get(scoreRef);  // Obtenir la valeur actuelle du score
      const currentScore = snapshot.val() || 0;  // Si aucun score, initialiser à 0
      const newScore = currentScore + 1;

      // Mettre à jour le score dans Firebase
      await set(scoreRef, newScore);
      console.log(`Score mis à jour : ${newScore}`);
    }
  }
};
</script>

<style scoped>
/* Styles spécifiques à la sphère */
</style>
