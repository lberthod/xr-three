<template>
  <div ref="canvasContainer" class="canvas-container">
    <!-- Vos autres composants -->
    <!-- ... -->
    <!-- Loop through all cubes and render each one -->

    <Light v-if="scene" :scene="scene" />
    <!-- Add four TextComponents for four different strings -->

    <!-- Afficher le texte seulement si la chaîne n'est pas vide -->
    <TextComponent v-if="scene && textLines[0]" :scene="scene" :text="textLines[0]" :position="{ x: 0, y: 2.5, z: -2 }"
      :size="0.251" :color="'#66ff00'" />
    <TextComponent v-if="scene && textLines[1]" :scene="scene" :text="textLines[1]" :position="{ x: 0, y: 2.0, z: -2 }"
      :size="0.251" :color="'#00ff00'" />
    <TextComponent v-if="scene && textLines[2]" :scene="scene" :text="textLines[2]" :position="{ x: 0, y: 1.5, z: -2 }"
      :size="0.251" :color="'#ff0000'" />
    <TextComponent v-if="scene && textLines[3]" :scene="scene" :text="textLines[3]" :position="{ x: 0, y: 1.0, z: -2 }"
      :size="0.251" :color="'#0000ff'" />
    <GrabbableCube v-if="scene && renderer" :scene="scene" :renderer="renderer" cubeId="cube1"
      @cube-position-updated="onCubePositionUpdated" />
        <ModelComponent v-if="scene && renderer" :scene="scene" :renderer="renderer" :camera="camera"
      modelId="uniqueModelId2" modelUrl="assets/ready.glb" />

    <CubeComponent v-for="(cube, id) in cubes" :key="id" :scene="scene" :color="cube.color" :position="cube.position" />


    <SphereMovementFromGameComponent
      v-if="sphere"
      :scene="scene"
      :renderer="renderer"
      :controllers="controllers"
      ref="sphereMovementFromGameComponent"
      :position="sphere.position || { x: 2, y: 1, z: 2 }"
    />
    <!-- Ajouter une référence au ModelComponent -->


  </div>
</template>

<script>
import { markRaw } from 'vue';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from 'three/examples/jsm/webxr/XRHandModelFactory.js';
import ModelComponent from './xr/ModelComponent.vue';
import CubeComponent from './xr/CubeComponent.vue';
import Light from './xr/Light.vue';
import GrabbableCube from './xr/GrabbableCube.vue';
import TextComponent from './xr/TextComponent.vue';
import FloorComponent from './xr/FloorComponent.vue'; // Import the FloorComponent
import SphereComponent from './xr/SphereComponent.vue'; // Import the SphereComponent
import SphereMovementFromGameComponent from './xr/SphereMovementFromGameComponent.vue'; // Import the SphereComponent
import { database, ref, onValue } from '../firebase';

export default {
  name: 'XrExperience',
  components: {
    // Vos composants
    SphereMovementFromGameComponent,
    ModelComponent,
    CubeComponent,
    Light,
    GrabbableCube,
    TextComponent,
    FloorComponent,
    SphereComponent, // Register SphereComponent
    ModelComponent,
    // ...
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
      sphere: null, // Stocker une seule sphère
      sphereId: 'user-specific-id', // Remplacer par l'ID de l'utilisateur actuel
      score: 0, // État du score

    };
  },
  async mounted() {
    this.clock = new THREE.Clock(); // Initialisation de l'horloge lors du montage
    this.loadCubeFromFirebase(); // Charger un seul cube depuis Firebase
    this.loadSphereFromFirebase(); // Charger une seule sphère depuis Firebase
    this.listenForSphereChanges(); // Écouter les changements en temps réel pour les sphères

    await this.initAmmoPhysics(); // Initialiser le monde physique Ammo.js
    this.initScene();
    this.listenForCubeChanges(); // Écouter les changements dans les cubes
    this.listenForCubeChanges2(); // Écouter les changements dans les cubes
    this.loadTextLines(); // Charger les textes au montage du composant
    // this.characterComponent = this.$refs.characterComponent;
  },
  methods: {


    listenForSphereChanges() {
      const spheresRef = ref(database, 'spheres');
      onValue(spheresRef, (snapshot) => {
        this.spheres = snapshot.val() || {}; // Charger toutes les sphères
      });
    },

    loadCubeFromFirebase() {
      // Charger un seul cube avec un ID spécifique depuis Firebase
      const cubeRef = ref(database, `positions/MYRZgmSpc2aQvs7KIxIEqKNlK2x1`);
      onValue(cubeRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Assurez-vous que la structure des données dans Firebase correspond à celle attendue
          this.cube = {
            color: data.color || '#00ff00', // Utiliser la couleur du cube si elle existe, sinon défaut
            position: data.position || { x: 0, y: 0, z: 0 }, // Utiliser la position du cube si elle existe
          };
        } else {
          this.cube = {
            color: '#00ff00', // Couleur par défaut
            position: { x: 0, y: 0, z: 0 }, // Position par défaut
          };
        }
      });
    },
    onCubePositionUpdated(position) {
      console.log('Position du cube mise à jour :', position);
      // Vous pouvez maintenant utiliser la position du cube dans le composant parent
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



    loadSphereFromFirebase() {
      // Charger une seule sphère avec un ID spécifique depuis Firebase
      const sphereRef = ref(database, `spheres/MYRZgmSpc2aQvs7KIxIEqKNlK2x1`);
      onValue(sphereRef, (snapshot) => {
        const data = snapshot.val();
        console.log(data);
        if (data) {
          this.sphere = {
            position: { x: data.x, y: data.y, z: data.z } || { x: 0, y: 0, z: 0 },
          };
          console.log(data.x);
          console.log("add sphere");
        } else {
          this.sphere = {
            position: { x: 0, y: 0, z: 0 },
          };
        }
      });
    },
    onSpherePositionUpdated(position) {
      console.log('Position de la sphère mise à jour :', position);
    },


    addSphereToPhysics(sphere) {
      if (!this.physicsWorld || !sphere) {
        console.error('physicsWorld ou sphere non défini');
        return;
      }

      const sphereShape = new Ammo.btSphereShape(1); // Forme de la sphère
      const startTransform = new Ammo.btTransform();
      startTransform.setIdentity();
      const position = sphere.position;
      startTransform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));

      const mass = 1;
      const localInertia = new Ammo.btVector3(0, 0, 0);
      sphereShape.calculateLocalInertia(mass, localInertia);

      const motionState = new Ammo.btDefaultMotionState(startTransform);
      const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, sphereShape, localInertia);
      const sphereBody = new Ammo.btRigidBody(rbInfo);

      // Ajouter la sphère au monde physique
      this.physicsWorld.addRigidBody(sphereBody);

      console.log('Sphère ajoutée au monde physique');
    },


    initScene() {
      this.scene = markRaw(new THREE.Scene());
      this.camera = markRaw(
        new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
      );
      this.camera.position.set(0, 1.6, 3);

      this.renderer = markRaw(new THREE.WebGLRenderer({ antialias: true, alpha: true }));
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

      // Ajouter des écouteurs d'événements pour les interactions du contrôleur
      // Vous pouvez ajouter des écouteurs ici si nécessaire
      // Par exemple:
      // controller1.addEventListener('selectstart', this.onSelectStart);
      // controller1.addEventListener('selectend', this.onSelectEnd);

      // Ajouter des modèles de contrôleurs pour la visualisation
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
        if (this.physicsWorld) {
          this.physicsWorld.stepSimulation(deltaTime, 10);
        }

        // Mettre à jour les composants enfants
        if (this.$refs.modelComponent && this.$refs.modelComponent.update) {
          this.$refs.modelComponent.update(deltaTime);
        }

        if (this.$refs.sphereMovementFromGameComponent && this.$refs.sphereMovementFromGameComponent.update) {
          this.$refs.sphereMovementFromGameComponent.update(deltaTime);
        }
        // Mettre à jour d'autres composants si nécessaire 
        // ...

        this.renderer.render(this.scene, this.camera);
      });
    },

    listenForCubeChanges() {
      const cubesRef = ref(database, 'cubes');
      onValue(cubesRef, (snapshot) => {
        this.cubes = snapshot.val() || {}; // Load all cubes into the component
      });
    },

    listenForCubeChanges2() {
      // Écouter Firebase pour charger les cubes en temps réel
      const cubesRef = ref(database, 'positions');
      onValue(cubesRef, (snapshot) => {
        this.cubes = snapshot.val() || {}; // Charger tous les cubes dans le data
      });
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