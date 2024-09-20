<template>
    <div ref="sceneContainer" class="scene-container">
      <CubeMovement :scene="scene" />
    </div>
  </template>
  
  <script>
  import * as THREE from "three";
  import { onMounted, ref } from "vue";
  import CubeMovement from "./CubeMovement.vue";
  
  export default {
    name: "Game3DView",
    components: {
      CubeMovement,
    },
    setup() {
      const sceneContainer = ref(null); // Le conteneur pour la scène
      const scene = new THREE.Scene(); // Initialisation de la scène
      let camera, renderer; // Variables pour la caméra et le renderer
  
      const init = () => {
        // Créer la caméra
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 0, 5); // Positionner la caméra plus loin pour voir le cube
  
        // Créer le renderer
        renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight); // Taille du canvas
        sceneContainer.value.appendChild(renderer.domElement); // Ajouter le renderer dans le DOM
  
        // Appeler la fonction d'animation
        animate();
      };
  
      const animate = () => {
        requestAnimationFrame(animate);
        renderer.render(scene, camera); // Rendre la scène avec la caméra
      };
  
      onMounted(() => {
        init(); // Initialisation de la scène lors du montage du composant
      });
  
      return {
        sceneContainer, // Retourner le ref pour le conteneur
        scene, // Retourner la scène pour être utilisée dans CubeMovement
      };
    },
  };
  </script>
  
  <style>
  .scene-container {
    width: 100vw;
    height: 100vh;
    display: block;
    overflow: hidden;
  }
  </style>
  