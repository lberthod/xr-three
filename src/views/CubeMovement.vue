<template>
  <div></div> <!-- Pas besoin d'affichage spécifique ici -->
</template>

<script>
import * as THREE from "three";
import { onMounted, onBeforeUnmount } from "vue";
import {database , ref, set, onValue, auth, signInAnonymously } from "../firebase"; // Importer Firebase

export default {
  name: "CubeMovement",
  props: {
    scene: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    let cube;
    let userId;

    const createCube = () => {
      // Créer la géométrie et le matériau du cube
      const geometry = new THREE.BoxGeometry(1, 1, 1); // Cube de taille 1x1x1
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Cube vert
      cube = new THREE.Mesh(geometry, material);

      // Ajouter le cube à la scène
      props.scene.add(cube);

      // Écouter les changements de position dans Firebase
      listenForPositionChanges();

      // Ajouter un gestionnaire d'événements pour déplacer le cube avec les touches du clavier
      document.addEventListener("keydown", onDocumentKeyDown);
    };

    const onDocumentKeyDown = (event) => {
      const keyCode = event.which || event.keyCode; // Compatibilité
      switch (keyCode) {
        case 87: // W
          cube.position.y += 0.04;
          break;
        case 83: // S
          cube.position.y -= 0.04;
          break;
        case 65: // A
          cube.position.x -= 0.04;
          break;
        case 68: // D
          cube.position.x += 0.04;
          break;
        case 81: // Q
          cube.position.z -= 0.04;
          break;
        case 69: // E
          cube.position.z += 0.04;
          break;
      }
      // Après chaque déplacement, envoyer la position à Firebase
      updatePositionInFirebase(cube.position);
    };

    const updatePositionInFirebase = (position) => {
      const positionRef = ref(database, `spheres/${userId}`);
      set(positionRef, {
        x: position.x,
        y: position.y,
        z: position.z,
      });
    };

    const listenForPositionChanges = () => {
      const positionRef = ref(database, 'spheres/');
      onValue(positionRef, (snapshot) => {
        const positions = snapshot.val();
        if (positions && positions[userId]) {
          // Mettre à jour la position du cube si la position dans Firebase change
          cube.position.set(positions[userId].x, positions[userId].y, positions[userId].z);
        }
      });
    };

    const signIn = () => {
      signInAnonymously(auth)
        .then((userCredential) => {
          userId = userCredential.user.uid;
        })
        .catch((error) => {
          console.error("Firebase sign-in error:", error);
        });
    };

    onMounted(() => {
      signIn(); // Se connecter anonymement à Firebase avant de créer le cube
      createCube(); // Créer le cube une fois connecté
    });

    onBeforeUnmount(() => {
      // Nettoyage : retirer l'événement keydown et supprimer le cube de la scène
      document.removeEventListener("keydown", onDocumentKeyDown);
      if (props.scene && cube) {
        props.scene.remove(cube);
      }
    });

    return {};
  },
};
</script>
