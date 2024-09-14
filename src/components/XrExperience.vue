<template>
  <div ref="canvasContainer" class="canvas-container">
    <CubeComponent v-if="scene" :scene="scene" :color="cubeColor" />
    <Light v-if="scene" :scene="scene" />
  </div>
</template>

<script>
import { markRaw } from 'vue';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { XRHandModelFactory } from 'three/examples/jsm/webxr/XRHandModelFactory.js';
import { database, ref, onValue } from '../firebase'; // Import Firebase

// Importation des sous-composants
import CubeComponent from './CubeComponent.vue';
import Light from './Light.vue';

export default {
  name: 'XrExperience',
  components: {
    CubeComponent,
    Light
  },
  data() {
    return {
      scene: null,
      renderer: null,
      camera: null,
      cubeColor: '#00ff00' // Couleur par défaut du cube
    };
  },
  mounted() {
    this.initScene();
    this.listenForCubeColorChange();
  },
  methods: {
    initScene() {
      // Marquer la scène comme non réactive
      this.scene = markRaw(new THREE.Scene());
      this.camera = markRaw(new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000));
      this.camera.position.set(0, 1.6, 3);

      // Marquer le renderer comme non réactif
      this.renderer = markRaw(new THREE.WebGLRenderer({ antialias: true, alpha: true }));
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.xr.enabled = true;
      this.renderer.shadowMap.enabled = true;
      this.$refs.canvasContainer.appendChild(this.renderer.domElement);

      // Ajout du hand tracking
      this.setupHandTracking();

      // Fonction d'animation
      const animate = () => {
        this.renderer.setAnimationLoop(() => {
          this.renderer.render(this.scene, this.camera);
        });
      };

      // Détection dynamique pour AR/VR
      navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        if (supported) {
          document.body.appendChild(
            ARButton.createButton(this.renderer, {
              optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'], // Activation du hand tracking
            })
          );
        } else {
          document.body.appendChild(VRButton.createButton(this.renderer));
        }
      });

      animate();
    },

    setupHandTracking() {
      const handModelFactory = new XRHandModelFactory();
      const hand1 = this.renderer.xr.getHand(0);  // Main droite
      const hand2 = this.renderer.xr.getHand(1);  // Main gauche
      this.scene.add(hand1);
      this.scene.add(hand2);
      const handModel1 = handModelFactory.createHandModel(hand1);
      const handModel2 = handModelFactory.createHandModel(hand2);
      hand1.add(handModel1);
      hand2.add(handModel2);
    },

    listenForCubeColorChange() {
      const cubeColorRef = ref(database, 'cube/color'); // Référence à la couleur du cube dans Firebase
      onValue(cubeColorRef, (snapshot) => {
        const color = snapshot.val();
        if (color) {
          this.cubeColor = color; // Mettre à jour la couleur du cube
        }
      });
    }
  }
};
</script>

<style scoped>
.canvas-container {
  width: 100vw;
  height: 100vh;
  position: relative;
}
</style>
