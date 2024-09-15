<template>
    <!-- The component doesn't render any HTML directly -->
  </template>
  
  <script>
  import { defineComponent, markRaw } from 'vue';
  import * as THREE from 'three';
  import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
  import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
  import { database, ref, onValue } from '../firebase';
  
  export default defineComponent({
    name: 'TextComponent',
    props: {
      scene: {
        type: Object,
        required: true,
      },
    },
    data() {
      return {
        textMesh: null,
      };
    },
    mounted() {
      this.listenForTextChanges();
    },
    methods: {
      listenForTextChanges() {
        const loader = new FontLoader();
        const textRef = ref(database, 'text');
  
        // Listen for real-time changes to the text node in Firebase
        onValue(textRef, (snapshot) => {
          const textData = snapshot.val();
          if (textData) {
            // If text mesh already exists, remove it before updating
            if (this.textMesh) {
              this.scene.remove(this.textMesh);
            }
  
            // Load font and create the new 3D text with the updated data
            loader.load('fonts/helvetiker_regular.typeface.json', (font) => {
              const textGeometry = new TextGeometry(textData.content || 'Bonjour...', {
                font: font,
                size: textData.size || 1, // Use size from Firebase or default
                height: 0.2,
                curveSegments: 12,
              });
              const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
  
              // Mark the text mesh as non-reactive to prevent Vue from proxying it
              this.textMesh = markRaw(new THREE.Mesh(textGeometry, material));
  
              // Set position, rotation, and size based on the data from Firebase
              this.textMesh.position.set(
                textData.position?.x || 0,
                textData.position?.y || 1.5,
                textData.position?.z || -2
              );
              this.textMesh.rotation.set(
                THREE.MathUtils.degToRad(textData.rotation?.x || 0),
                THREE.MathUtils.degToRad(textData.rotation?.y || 0),
                THREE.MathUtils.degToRad(textData.rotation?.z || 0)
              );
  
              // Add the updated text to the scene
              this.scene.add(this.textMesh);
            });
          }
        });
      },
    },
  });
  </script>
  
  <style scoped>
  /* No styles needed for this component */
  </style>
  