<template>
  <div ref="canvasContainer" class="canvas-container">

    <Light v-if="scene" :scene="scene" />

    <ScoreComponent v-if="scene && camera" :scene="scene" :camera="camera" :position="{ x: 0.5, y: 0, z: 2 }"
      :size="0.55" :color="'#ffff00'" :scoreId="this.userId" />
    <SphereRandom v-if="scene" v-for="(sphere) in spheresRandoms" :scene="scene" :sphereId="sphere.id"
      :renderer="renderer" :controllers="controllers" ref="sphereMovementFromGameComponent"
      :position="sphere.position || { x: 2, y: 1, z: 2 }" :scoreId="sphere.userId" />
  </div>
</template>

<script>
import { markRaw } from 'vue';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from 'three/examples/jsm/webxr/XRHandModelFactory.js';

import Light from './xr/Light.vue';
import { database, ref, onValue, auth, signInAnonymously, onAuthStateChanged } from '../firebase';
import SphereRandom from './xr/SphereRandom.vue'; // Importez le composant SphereRandomPlace
import ScoreComponent from './xr/ScoreComponent.vue'; // Assurez-vous d'importer ScoreComponent

export default {
  name: 'XrExperience',
  components: {

    Light,

    SphereRandom,
    ScoreComponent
  },
  data() {
    return {
      scene: null,
      renderer: null,
      camera: null,
      physicsWorld: null, // Monde physique Ammo.js
      cubes: {},
      textMesh: null,
      textLines: ['', '', '', ''],
      clock: null,
      controllers: [], // Contrôleurs VR
      cube: null, // Stocker un seul cube
      cubeId: 'user-specific-id', // Remplacer par l'ID de l'utilisateur actuel
      spheres: {}, // Stocker les sphères
      spheresRandoms: {}, // Stocker les sphères
      sphere: null, // Stocker une seule sphère
      sphereId: 'user-specific-id', // Remplacer par l'ID de l'utilisateur actuel
      score: 0, // État du score
      userId : null,
    };
  },
  async mounted() {
    await this.initializeAnonymousLogin();

    this.clock = new THREE.Clock(); // Initialisation de l'horloge lors du montage

    this.initScene();

  },
  methods: {
    async initializeAnonymousLogin() {
      // Vérifier si l'utilisateur est déjà connecté, sinon connecter anonymement
      onAuthStateChanged(auth, (user) => {
        if (user) {
          // Si l'utilisateur est déjà connecté, récupérer son ID
          this.userId = user.uid;

          console.log('Utilisateur lal connecté avec l\'ID:', this.userId);
           this.load10RandomSpheres();

           this.initAmmoPhysics(); // Initialiser le monde physique Ammo.js
        } else {
          // Si aucun utilisateur, effectuer la connexion anonyme
          signInAnonymously(auth)
            .then((userCredential) => {
              // Connexion réussie, récupérer l'ID de l'utilisateur
              this.userId = userCredential.user.uid;
              console.log('Connexion lal anonyme réussie avec l\'ID:', this.userId);
               this.load10RandomSpheres();

               this.initAmmoPhysics(); // Initialiser le monde physique Ammo.js
            })
            .catch((error) => {
              console.error('Erreur lors de la connexion anonyme:', error);
            });
        }
      });
    },
    async load10RandomSpheres() {
      this.spheresRandoms = {}; // Réinitialiser les sphères existantes
      console.log("lala1 : " + this.userId);
      console.log("lala2 : " + this.userId);

      for (let i = 0; i < 20; i++) {
        const sphereId = `spherex_${i + 1}`;
        const position = this.generateRandomPosition();
        console.log("rar : " + this.userId);
        this.spheresRandoms[sphereId] = {
          id: sphereId,
          position: position,
          userId: this.userId,
        };
        console.log("dd");
      }

      console.log('10 sphères aléatoires générées :', this.spheresRandoms);
    },

    generateRandomPosition() {
      const playerX = 0;
      const playerY = 0;
      const playerZ = 0.5;
      const range = 0.5; // Ajustez cette valeur pour définir la distance autour du joueur

      const x = playerX + (Math.random() * (2 * range) - range); // Entre playerX - range et playerX + range
      const y = playerY + (Math.random() * (2 * range) - range); // Entre playerY - range et playerY + range
      const z = playerZ + (Math.random() * (2 * range) - range); // Entre playerZ - range et playerZ + range

      return { x, y, z };
    },






    async initAmmoPhysics() {
      try {
        // Charger Ammo.js de manière dynamique
        const Ammo = await import('ammo.js');

        // Initialiser le monde physique
        const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
        const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
        const overlappingPairCache = new Ammo.btDbvtBroadphase();
        const solver = new Ammo.btSequentialImpulseConstraintSolver();

        // Créer le monde physique
        this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(
          dispatcher,
          overlappingPairCache,
          solver,
          collisionConfiguration
        );
        this.physicsWorld.setGravity(new Ammo.btVector3(0, -9.81, 0)); // Appliquer la gravité

        console.log('Ammo.js et physicsWorld initialisés');
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de Ammo.js', error);
      }
    },



    initScene() {
      this.scene = markRaw(new THREE.Scene());
      this.camera = markRaw(
        new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
      );
      this.camera.position.set(0, 1.6, 3);

      this.renderer = markRaw(new THREE.WebGLRenderer({ antialias: true, alpha: true }));
      this.renderer.setPixelRatio(window.devicePixelRatio); // S'assurer que le rendu est net sur les écrans haute densité

      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.xr.enabled = true;  // Activer WebXR pour la scène
      this.renderer.shadowMap.enabled = true;

      this.$refs.canvasContainer.appendChild(this.renderer.domElement);

      this.setupControllers(); // Configurer les contrôleurs VR
      this.setupHandTracking(); // Configurer le suivi des mains

      // Démarrer l'animation
      this.animate();

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
    },

    setupControllers() {
      // Vérifier que this.renderer et this.renderer.xr sont définis
      if (!this.renderer || !this.renderer.xr) {
        console.error('Renderer or renderer.xr is undefined');
        return;
      }

      const controller1 = this.renderer.xr.getController(0);
      const controller2 = this.renderer.xr.getController(1);
      this.scene.add(controller1);
      this.scene.add(controller2);
      this.controllers = [controller1, controller2];

      const controllerModelFactory = new XRControllerModelFactory();

      const controllerGrip1 = this.renderer.xr.getControllerGrip(0);
      controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
      this.scene.add(controllerGrip1);

      const controllerGrip2 = this.renderer.xr.getControllerGrip(1);
      controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
      this.scene.add(controllerGrip2);
    },

    setupHandTracking() {
      const handModelFactory = new XRHandModelFactory();
      const hand1 = this.renderer.xr.getHand(0); // Main droite
      const hand2 = this.renderer.xr.getHand(1); // Main gauche
      this.scene.add(hand1);
      this.scene.add(hand2);
      const handModel1 = handModelFactory.createHandModel(hand1);
      const handModel2 = handModelFactory.createHandModel(hand2);
      hand1.add(handModel1);
      hand2.add(handModel2);
    },

    animate() {
      this.renderer.setAnimationLoop(() => {
        const deltaTime = this.clock.getDelta();


        this.renderer.render(this.scene, this.camera);
      });
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