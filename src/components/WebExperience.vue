<template>
    <div ref="canvasContainer" class="canvas-container">
      <!-- Three.js Scene Elements (floor, cube) -->
      <FlooraComponent v-if="scene" :scene="scene" />
      <GrabbableaCube
        v-if="scene"
        :scene="scene"
        :camera="camera"
        :renderer="renderer"
      />
    </div>
  </template>
  
  <script>
  import * as THREE from 'three';
  import { markRaw } from 'vue';
  import FlooraComponent from './FlooraComponent.vue';
  import CubeaComponent from './CubeaComponent.vue';
  import GrabbableaCube from './GrabbableaCube.vue';
  
  export default {
    name: 'WebExperience',
    components: {
      FlooraComponent,
      CubeaComponent,
      GrabbableaCube,
    },
    data() {
      return {
        scene: null,
        renderer: null,
        camera: null,
      };
    },
    mounted() {
      this.initScene();
    },
    methods: {
      initScene() {
        this.scene = markRaw(new THREE.Scene());
        this.camera = markRaw(new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000));
        this.camera.position.set(0, 1.5, 3);
  
        this.renderer = markRaw(new THREE.WebGLRenderer({ antialias: true, alpha: true }));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.$refs.canvasContainer.appendChild(this.renderer.domElement);
  
        if (navigator.xr) {
          navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
            if (supported) {
              this.renderer.xr.enabled = true;
            }
          });
        }
  
        const animate = () => {
          requestAnimationFrame(animate);
          this.renderer.render(this.scene, this.camera);
        };
        animate();
      },
    },
  };
  </script>
  
  <style scoped>
  .canvas-container {
    width: 100vw;
    height: 100vh;
    position: relative;
  }
  </style>
  