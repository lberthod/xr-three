<template>
  <div ref="canvasContainer" class="canvas-container">
    <!-- Loop through all cubes and render each one -->
    <CubeComponent
      v-for="(cube, id) in cubes"
      :key="id"
      :scene="scene"
      :color="cube.color"
      :position="cube.position"
    />
    <Light v-if="scene" :scene="scene" />
  </div>
</template>

<script>
import { markRaw } from 'vue';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { XRHandModelFactory } from 'three/examples/jsm/webxr/XRHandModelFactory.js'; // Correct import for hand tracking
import { database, ref, onValue } from '../firebase'; // Import Firebase configuration
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
      cubes: {} // Store multiple cubes from Firebase
    };
  },
  mounted() {
    this.initScene();
    this.listenForCubeChanges(); // Listen for changes in multiple cubes
  },
  methods: {
    initScene() {
      // Mark the scene as non-reactive
      this.scene = markRaw(new THREE.Scene());
      this.camera = markRaw(new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000));
      this.camera.position.set(0, 1.6, 3);

      // Mark the renderer as non-reactive
      this.renderer = markRaw(new THREE.WebGLRenderer({ antialias: true, alpha: true }));
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.xr.enabled = true;
      this.renderer.shadowMap.enabled = true;
      this.$refs.canvasContainer.appendChild(this.renderer.domElement);

      // Add hand tracking
      this.setupHandTracking();

      // Animation function
      const animate = () => {
        this.renderer.setAnimationLoop(() => {
          this.renderer.render(this.scene, this.camera);
        });
      };

      // Detect for AR/VR support dynamically
      navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        if (supported) {
          document.body.appendChild(
            ARButton.createButton(this.renderer, {
              optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'], // Enable hand tracking
            })
          );
        } else {
          document.body.appendChild(VRButton.createButton(this.renderer));
        }
      });

      animate();
    },

    setupHandTracking() {
      const handModelFactory = new XRHandModelFactory(); // Correct use of XRHandModelFactory
      const hand1 = this.renderer.xr.getHand(0);  // Right hand
      const hand2 = this.renderer.xr.getHand(1);  // Left hand
      this.scene.add(hand1);
      this.scene.add(hand2);
      const handModel1 = handModelFactory.createHandModel(hand1);
      const handModel2 = handModelFactory.createHandModel(hand2);
      hand1.add(handModel1);
      hand2.add(handModel2);
    },

    listenForCubeChanges() {
      // Firebase reference to listen for changes in all cubes
      const cubesRef = ref(database, 'cubes');
      onValue(cubesRef, (snapshot) => {
        this.cubes = snapshot.val() || {}; // Load all cubes into the component
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
