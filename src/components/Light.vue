<template>
    <!-- Les lumières seront ajoutées à la scène via ce sous-composant -->
  </template>
  
  <script>
  import * as THREE from 'three';
  
  export default {
    name: 'Light',
    props: ['scene'],
    mounted() {
      this.addLights();
    },
    methods: {
      addLights() {
        // Lumière ambiante
        const ambientLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 0.7);
        this.scene.add(ambientLight);
  
        // Lumière directionnelle
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 2);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
      }
    }
  };
  </script>
  
  <style scoped>
  /* Styles spécifiques à la lumière */
  </style>
  