<template>
  <!-- The component doesn't render any HTML directly -->
</template>

<script>
import { defineComponent, markRaw } from 'vue';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

export default defineComponent({
  name: 'TextComponent',
  props: {
    scene: {
      type: Object,
      required: true,
    },
    text: {
      type: String,
      default: 'Default text',
    },
    position: {
      type: Object,
      default: () => ({ x: 0, y: 1.5, z: -2 }),
    },
    rotation: {
      type: Object,
      default: () => ({ x: 0, y: 0, z: 0 }),
    },
    size: {
      type: Number,
      default: 1,
    },
    color: {
      type: String,
      default: '#ffffff',
    },
  },
  data() {
    return {
      textMesh: null,
    };
  },
  mounted() {
    this.createText();
  },
  methods: {
    createText() {
      const loader = new FontLoader();

      // Load font and create the 3D text
      loader.load('fonts/helvetiker_regular.typeface.json', (font) => {
        const textGeometry = new TextGeometry(this.text, {
          font: font,
          size: this.size,
          height: 0.2,
          curveSegments: 12,
        });
        const material = new THREE.MeshBasicMaterial({ color: this.color });

        // Mark the text mesh as non-reactive to prevent Vue from proxying it
        this.textMesh = markRaw(new THREE.Mesh(textGeometry, material));

        // Set position and rotation based on props
        this.textMesh.position.set(this.position.x, this.position.y, this.position.z);
        this.textMesh.rotation.set(
          THREE.MathUtils.degToRad(this.rotation.x),
          THREE.MathUtils.degToRad(this.rotation.y),
          THREE.MathUtils.degToRad(this.rotation.z)
        );

        // Add the text to the scene
        this.scene.add(this.textMesh);
      });
    },
  },
});
</script>

<style scoped>
/* No styles needed for this component */
</style>
