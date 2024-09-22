<template>
  <div></div> <!-- Pas besoin d'affichage spécifique ici -->
</template>

<script>
import * as THREE from "three";
import { onMounted, onBeforeUnmount } from "vue";
import { database, ref, set, onValue, auth, signInAnonymously, remove } from "../firebase"; // Importer Firebase

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

    // Fonction pour générer un ID aléatoire
    const generateRandomId = () => {
      return Math.random().toString(36).substr(2, 9); // Génère un ID unique
    };

    const createCube = (cubeId) => {
      // Créer la géométrie et le matériau du cube
      const geometry = new THREE.BoxGeometry(1, 1, 1); // Cube de taille 1x1x1
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Cube vert
      cube = new THREE.Mesh(geometry, material);

      // Ajouter le cube à la scène
      props.scene.add(cube);

      // Écouter les changements de position dans Firebase
      listenForPositionChanges(cubeId);
      
      // Écouter la destruction du cube dans Firebase
      listenForDestroy(cubeId);

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
      const positionRef = ref(database, `spheres/${userId}/`); // Utiliser l'ID utilisateur pour référencer l'objet
      set(positionRef, {
        x: position.x,
        y: position.y,
        z: position.z,
      });
    };

    const listenForPositionChanges = (cubeId) => {
      const positionRef = ref(database, `spheres/${cubeId}/`);
      onValue(positionRef, (snapshot) => {
        const positions = snapshot.val();
        if (positions) {
          // Mettre à jour la position du cube si la position dans Firebase change
          cube.position.set(positions.x, positions.y, positions.z);
        }
      });
    };

    const listenForDestroy = (cubeId) => {
      const positionRef = ref(database, `spheres/${cubeId}/`);
      onValue(positionRef, (snapshot) => {
        const positions = snapshot.val();
        if (!positions) {
          // Si la position est supprimée, prévenir et recréer le cube
          console.log("Le cube a été supprimé dans Firebase.");
          recreateCube();
        }
      });
    };

    const recreateCube = () => {
      if (cube) {
        props.scene.remove(cube); // Supprimer l'ancien cube
      }
      const newCubeId = generateRandomId();
      userId = newCubeId; // Mettre à jour l'ID utilisateur avec un nouvel ID
      createCube(newCubeId); // Créer un nouveau cube avec l'ID aléatoire
    };

    const signIn = () => {
      signInAnonymously(auth)
        .then((userCredential) => {
          userId = userCredential.user.uid;
          createCube(userId); // Créer le cube une fois connecté avec l'ID utilisateur Firebase
        })
        .catch((error) => {
          console.error("Firebase sign-in error:", error);
        });
    };

    onMounted(() => {
      signIn(); // Se connecter anonymement à Firebase avant de créer le cube
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
