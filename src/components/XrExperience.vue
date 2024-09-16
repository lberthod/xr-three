<template>
  <div ref="canvasContainer" class="canvas-container">
    <!-- Loop through all cubes and render each one -->
    <CubeComponent v-for="(cube, id) in cubes" :key="id" :scene="scene" :color="cube.color" :position="cube.position" />

    <Light v-if="scene" :scene="scene" />
    <!-- Add four TextComponents for four different strings -->

    <!-- Afficher le texte seulement si la chaîne n'est pas vide -->
    <TextComponent
      v-if="scene && textLines[0]"
      :scene="scene"
      :text="textLines[0]"
      :position="{ x: 0, y: 2.5, z: -2 }"
      :size="0.251"
      :color="'#66ff00'"
    />
    <TextComponent
      v-if="scene && textLines[1]"
      :scene="scene"
      :text="textLines[1]"
      :position="{ x: 0, y: 2.0, z: -2 }"
      :size="0.251"
      :color="'#00ff00'"
    />
    <TextComponent
      v-if="scene && textLines[2]"
      :scene="scene"
      :text="textLines[2]"
      :position="{ x: 0, y: 1.5, z: -2 }"
      :size="0.251"
      :color="'#ff0000'"
    />
    <TextComponent
      v-if="scene && textLines[3]"
      :scene="scene"
      :text="textLines[3]"
      :position="{ x: 0, y: 1.0, z: -2 }"
      :size="0.251"
      :color="'#0000ff'"
    />
    <CubeintoComponent v-if="scene" :scene="scene" :physicsWorld="physicsWorld" />

    <GrabbableCube v-if="scene && renderer" :scene="scene" :renderer="renderer" cubeId="cube1" />

    <!-- Add SphereComponent here
    <SphereComponent v-if="scene && physicsWorld" :scene="scene" :physicsWorld="physicsWorld" /> -->
  </div>
</template>

<script>
import { markRaw } from 'vue';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { XRHandModelFactory } from 'three/examples/jsm/webxr/XRHandModelFactory.js';

import { database, ref, onValue } from '../firebase';
import CubeComponent from './CubeComponent.vue';
import Light from './Light.vue';
import GrabbableCube from './GrabbableCube.vue';
import TextComponent from './TextComponent.vue';
import FloorComponent from './FloorComponent.vue'; // Import the FloorComponent
import SphereComponent from './SphereComponent.vue'; // Import the SphereComponent
import CubeintoComponent from './CubeintoComponent.vue'; // Import the SphereComponent

export default {
  name: 'XrExperience',
  components: {
    CubeComponent,
    Light,
    GrabbableCube,
    TextComponent,
    FloorComponent,
    SphereComponent, // Register SphereComponent
    CubeintoComponent,
  },
  data() {
    return {
      scene: null,
      renderer: null,
      camera: null,
      physicsWorld: null, // Ammo.js physics world
      cubes: {}, // Store multiple cubes from Firebase
      textMesh: null, // Store the 3D text mesh so we can update it in real-time
      textLines: ['', '', '', ''], // Array to hold the four lines of text

    };
  },
  async mounted() {
    this.clock = new THREE.Clock(); // Initialisation de l'horloge lors du montage

    await this.initAmmoPhysics(); // Initialize Ammo.js physics world
    this.initScene();
    this.listenForCubeChanges(); // Listen for changes in multiple cubes
    this.loadTextLines(); // Charger les textes au montage du composant

  },
  methods: {
    async initAmmoPhysics() {
      // Charger Ammo.js de manière dynamique
      const Ammo = await import('ammo.js');

      // Initialise le monde physique avec Ammo.js
      const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
      const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
      const overlappingPairCache = new Ammo.btDbvtBroadphase();
      const solver = new Ammo.btSequentialImpulseConstraintSolver();
      this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
      this.physicsWorld.setGravity(new Ammo.btVector3(0, -9.81, 0)); // Définir la gravité
    },

    initScene() {
      this.scene = markRaw(new THREE.Scene());
      this.camera = markRaw(new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000));
      this.camera.position.set(0, 1.6, 3);

      this.renderer = markRaw(new THREE.WebGLRenderer({ antialias: true, alpha: true }));
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.xr.enabled = true;
      this.renderer.shadowMap.enabled = true;
      this.$refs.canvasContainer.appendChild(this.renderer.domElement);

      this.setupHandTracking();

      const animate = () => {
        this.renderer.setAnimationLoop(() => {
          const deltaTime = this.clock.getDelta();
          this.physicsWorld.stepSimulation(deltaTime, 10); // Step the physics world
          this.renderer.render(this.scene, this.camera);
        });
      };

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

    loadTextLines() {
      // Référence à la base de données Firebase
      const databaseRefs = [
        ref(database, 'info/id_10_10'),
        ref(database, 'info/id_4_4'),
        ref(database, 'info/id_6_6'),
        ref(database, 'info/id_8_8'),
      ];

      // Boucle à travers chaque référence Firebase pour récupérer le texte correspondant
      databaseRefs.forEach((dbRef, index) => {
        onValue(dbRef, (snapshot) => {
          const textData = snapshot.val();
          if (textData && textData.indice) {
            // Mettre à jour la ligne correspondante dans textLines avec les données de Firebase
            console.log(textData);
            this.textLines[index] = textData.indice;
          } else {
            // Si aucune donnée, laisser la ligne vide
            this.textLines[index] = '';
          }
        });
      });
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
      const cubesRef = ref(database, 'cubes');
      onValue(cubesRef, (snapshot) => {
        this.cubes = snapshot.val() || {}; // Load all cubes into the component
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
