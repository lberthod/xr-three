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

    <GrabbableCube v-if="scene && renderer" :scene="scene" :renderer="renderer" />
  </div>
</template>

<script>
import { markRaw } from 'vue';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { XRHandModelFactory } from 'three/examples/jsm/webxr/XRHandModelFactory.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { database, ref, onValue } from '../firebase';
import CubeComponent from './CubeComponent.vue';
import Light from './Light.vue';
import GrabbableCube from './GrabbableCube.vue';

export default {
  name: 'XrExperience',
  components: {
    CubeComponent,
    Light,
    GrabbableCube
  },
  data() {
    return {
      scene: null,
      renderer: null,
      camera: null,
      cubes: {}, // Store multiple cubes from Firebase
      textMesh: null // Store the 3D text mesh so we can update it in real-time
    };
  },
  mounted() {
    this.initScene();
    this.listenForCubeChanges(); // Listen for changes in multiple cubes
    this.listenForTextChanges(); // Listen for real-time text changes
  },
  methods: {
    initScene() {
      // Mark the scene, camera, and renderer as non-reactive
      this.scene = markRaw(new THREE.Scene());
      this.camera = markRaw(new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000));
      this.camera.position.set(0, 1.6, 3);

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
              optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'],
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
    },

    // Function to listen for text changes and update the scene
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
            this.textMesh.position.set(textData.position.x || 0, textData.position.y || 1.5, textData.position.z || -2);
            this.textMesh.rotation.set(
              THREE.MathUtils.degToRad(textData.rotation.x || 0),
              THREE.MathUtils.degToRad(textData.rotation.y || 0),
              THREE.MathUtils.degToRad(textData.rotation.z || 0)
            );

            // Add the updated text to the scene
            this.scene.add(this.textMesh);
          });
        }
      });
    },
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
