<template>
  <!-- Ce composant n'affiche rien dans le DOM -->
</template>

<script>
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { ref as firebaseRef, onValue, update } from "firebase/database";
import { database } from '../../firebase';
import { markRaw } from 'vue';

export default {
  name: 'ModelComponent',
  props: {
    scene: Object,
    renderer: Object,
    camera: Object,
    modelId: String,
    modelUrl: String,
    position: {
      type: Object,
      default: () => ({ x: 0, y: 0, z: 0 }),
    },
    scale: {
      type: Object,
      default: () => ({ x: 0.25, y: 0.25, z: 0.25 }),
    },
    rotation: {
      type: Object,
      default: () => ({ x: 0, y: 0, z: 0 }),
    },
  },
  data() {
    return {
      isGrabbed: false,
  
    };
  },
  mounted() {

    this.cube = null;
    this.grabber = null;
    this.controllers = [];
    this.previousPosition = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.clock = new THREE.Clock();
    this.setupControllers();
    this.loadModel();
    this.animate();
  },
  methods: {
    setupControllers() {
      const controller1 = this.renderer.xr.getController(0);
      const controller2 = this.renderer.xr.getController(1);
      this.scene.add(controller1);
      this.scene.add(controller2);
      this.controllers = [controller1, controller2];

      // Ajouter des écouteurs d'événements pour les interactions du contrôleur
      this.controllers.forEach((controller) => {
        controller.addEventListener('selectstart', this.onSelectStart);
        controller.addEventListener('selectend', this.onSelectEnd);
      });

      // Ajouter des modèles de contrôleurs pour la visualisation
      const controllerModelFactory = new XRControllerModelFactory();

      const controllerGrip1 = this.renderer.xr.getControllerGrip(0);
      controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
      this.scene.add(controllerGrip1);

      const controllerGrip2 = this.renderer.xr.getControllerGrip(1);
      controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
      this.scene.add(controllerGrip2);
    },
    loadModel() {
      const loader = new GLTFLoader();
      loader.load(this.modelUrl, (gltf) => {
        this.model = markRaw(gltf.scene);

        // Appliquer les transformations initiales
        this.model.position.set(this.position.x, this.position.y, this.position.z);
        this.model.scale.set(this.scale.x, this.scale.y, this.scale.z);
        this.model.rotation.set(
          THREE.MathUtils.degToRad(this.rotation.x),
          THREE.MathUtils.degToRad(this.rotation.y),
          THREE.MathUtils.degToRad(this.rotation.z)
        );
        // Ajouter le modèle à la scène
        this.scene.add(this.model);

        // Initialiser la vélocité
        this.velocity.set(0, 0, 0);

        // Sauvegarder les données initiales du modèle dans Firebase
        this.saveModelDataToFirebase();
      });
    },
    onSelectStart(event) {
      const controller = event.target;

      // Vérifier l'intersection avec le modèle
      const tempMatrix = new THREE.Matrix4();
      tempMatrix.identity().extractRotation(controller.matrixWorld);

      const raycaster = new THREE.Raycaster();
      raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
      raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

      const intersects = raycaster.intersectObject(this.model, true);

      if (intersects.length > 0) {
        this.isGrabbed = true;
        this.grabber = controller;

        // Arrêter le mouvement du modèle
        this.velocity.set(0, 0, 0);

        // Attacher le modèle au contrôleur
        controller.add(this.model);
        this.model.position.set(0, 0, 0);
        this.model.rotation.set(0, 0, 0);

        // Mettre à jour la position précédente
        //     this.previousPosition.copy(this.model.getWorldPosition(new THREE.Vector3()));
      }
    },
    onSelectEnd(event) {
      if (this.isGrabbed && this.grabber === event.target) {
        this.isGrabbed = false;

        this.grabber.remove(this.model);
        this.scene.add(this.model);

        // Set the cube's world position based on the controller's current position
        const newWorldPosition = new THREE.Vector3();
        this.grabber.getWorldPosition(newWorldPosition);
        this.model.position.copy(newWorldPosition);

        // Calculate throw velocity based on controller's motion
        const deltaTime = this.clock.getDelta();
        const newPosition = new THREE.Vector3();
        this.model.getWorldPosition(newPosition);
        this.velocity.copy(newPosition).sub(this.previousPosition).divideScalar(deltaTime);


        // Sauvegarder les données du modèle dans Firebase
        this.saveModelDataToFirebase();
      }
    },
    saveModelDataToFirebase() {
      if (!this.model) return;

      const modelRef = firebaseRef(database, `models/${this.modelId}`);

      const modelData = {
        position: {
          x: this.model.position.x,
          y: this.model.position.y,
          z: this.model.position.z,
        },
        rotation: {
          x: this.model.rotation.x,
          y: this.model.rotation.y,
          z: this.model.rotation.z,
        },
        scale: {
          x: this.model.scale.x,
          y: this.model.scale.y,
          z: this.model.scale.z,
        },
      };

      update(modelRef, modelData);
    },

    animate() {
      this.renderer.setAnimationLoop(() => {

        if (this.model) {
          if (!this.isGrabbed) {

            // Appliquer la gravité
            const deltaTime = this.clock.getDelta();

            this.velocity.y -= 9.81 * deltaTime;

            // Mettre à jour la position du modèle selon la vélocité
            this.model.position.addScaledVector(this.velocity, deltaTime);

            // Gérer la collision avec le sol
            if (this.model.position.y < 0.1) {
              this.model.position.y = 0.1; // Empêcher le modèle de passer sous le sol
              this.velocity.y *= -0.5; // Réduire la vélocité verticale pour simuler un rebond
              this.velocity.x *= 0.8;  // Réduire la vélocité horizontale pour ralentir le modèle
              this.velocity.z *= 0.8;
            }

            // Sauvegarder la nouvelle position dans Firebase après chaque mouvement
            this.saveModelDataToFirebase();

            // Mettre à jour la position précédente
            this.previousPosition.copy(this.model.position);
          } else {
            // Keep track of the position for velocity calculation
            this.model.getWorldPosition(this.previousPosition);
          }
        }


        // Rendre la scène
        this.renderer.render(this.scene, this.$parent.camera);
      });
    },
  },
  beforeUnmount() {
    // Nettoyer les écouteurs d'événements
    this.controllers.forEach((controller) => {
      controller.removeEventListener('selectstart', this.onSelectStart);
      controller.removeEventListener('selectend', this.onSelectEnd);
    });
  },
};
</script>

<style scoped>
/* Aucun style nécessaire pour ce composant */
</style>
