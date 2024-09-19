<template>
  <!-- This component doesn't render anything in the DOM -->
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
      model: null,
      isGrabbed: false,
      grabber: null,
      previousPosition: markRaw(new THREE.Vector3()),
      velocity: markRaw(new THREE.Vector3()),
      clock: new THREE.Clock(),
      controllers: [],
    };
  },
  mounted() {
    this.setupControllers();
    this.loadModel();
    this.loadModelDataFromFirebase();
    this.animate();
  },
  methods: {
    setupControllers() {
      const controller1 = this.renderer.xr.getController(0);
      const controller2 = this.renderer.xr.getController(1);
      this.scene.add(controller1);
      this.scene.add(controller2);
      this.controllers = [controller1, controller2];

      // Add event listeners for controller interactions
      this.controllers.forEach((controller) => {
        controller.addEventListener('selectstart', this.onSelectStart);
        controller.addEventListener('selectend', this.onSelectEnd);
      });

      // Add controller models for visualization
      const controllerModelFactory = new XRControllerModelFactory();

      const controllerGrip1 = this.renderer.xr.getControllerGrip(0);
      controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
      this.scene.add(controllerGrip1);

      const controllerGrip2 = this.renderer.xr.getControllerGrip(1);
      controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
      this.scene.add(controllerGrip2);
    },
    async loadModel() {
      if (!this.modelUrl) {
        console.error('modelUrl is missing or undefined.');
        return;
      }

      const loader = new GLTFLoader();
      loader.load(
        this.modelUrl,
        (gltf) => {
          this.addModelToScene(gltf.scene);
        },
        undefined,
        (error) => {
          console.error('Error loading GLTF/GLB model:', error);
        }
      );
    },
    addModelToScene(model) {
      this.model = markRaw(model);

      // Apply transformations
      this.model.position.set(this.position.x, this.position.y, this.position.z);
      this.model.scale.set(this.scale.x, this.scale.y, this.scale.z);
      this.model.rotation.set(
        THREE.MathUtils.degToRad(this.rotation.x),
        THREE.MathUtils.degToRad(this.rotation.y),
        THREE.MathUtils.degToRad(this.rotation.z)
      );

      // Enable interaction
      this.model.traverse((child) => {
        if (child.isMesh) {
          child.userData.interactive = true;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.scene.add(this.model);

      // Initialize velocity
      this.velocity.set(0, 0, 0);

      // Store initial model properties in Firebase if not already present
      this.saveModelDataToFirebase();
    },
    onSelectStart(event) {
      const controller = event.target;

      // Check for intersection with the model
      const tempMatrix = new THREE.Matrix4();
      tempMatrix.identity().extractRotation(controller.matrixWorld);

      const raycaster = new THREE.Raycaster();
      raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
      raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

      const intersects = raycaster.intersectObject(this.model, true);

      if (intersects.length > 0) {
        this.isGrabbed = true;
        this.grabber = controller;

        // Stop model's motion
        this.velocity.set(0, 0, 0);

        // Attach model to controller
        controller.add(this.model);
        this.model.position.set(0, 0, 0);
        this.model.rotation.set(0, 0, 0);
      }
    },
    onSelectEnd(event) {
      if (this.isGrabbed && this.grabber === event.target) {
        this.isGrabbed = false;

        // Detach model from controller
        this.grabber.remove(this.model);
        this.scene.add(this.model);

        // Set the model's world position based on the controller's current position
        const newWorldPosition = new THREE.Vector3();
        this.grabber.getWorldPosition(newWorldPosition);
        this.model.position.copy(newWorldPosition);

        // Calculate throw velocity based on controller's motion
        const deltaTime = this.clock.getDelta();
        const newPosition = new THREE.Vector3();
        this.model.getWorldPosition(newPosition);
        this.velocity.copy(newPosition).sub(this.previousPosition).divideScalar(deltaTime);

        // Save model data to Firebase after moving
        this.saveModelDataToFirebase();
      }
    },
    saveModelDataToFirebase() {
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
    loadModelDataFromFirebase() {
      const modelRef = firebaseRef(database, `models/${this.modelId}`);

      onValue(modelRef, (snapshot) => {
        const modelData = snapshot.val();
        if (modelData && !this.isGrabbed) {
          this.model.position.set(modelData.position.x, modelData.position.y, modelData.position.z);
          this.model.rotation.set(modelData.rotation.x, modelData.rotation.y, modelData.rotation.z);
          this.model.scale.set(modelData.scale.x, modelData.scale.y, modelData.scale.z);
        }
      });
    },
    animate() {
      this.renderer.setAnimationLoop(() => {
        if (this.model) {
          if (!this.isGrabbed) {
            // Apply gravity
            const deltaTime = this.clock.getDelta();
            this.velocity.y -= 9.81 * deltaTime;

            // Update model's position based on velocity
            this.model.position.addScaledVector(this.velocity, deltaTime);

            // Collision with the ground
            if (this.model.position.y < 0.1) {
              this.model.position.y = 0.1;
              this.velocity.y *= -0.5; // Reduce vertical velocity
              this.velocity.x *= 0.8;  // Reduce horizontal velocity
              this.velocity.z *= 0.8;
            }
          } else {
            // Keep track of the position for velocity calculation
            this.model.getWorldPosition(this.previousPosition);
          }
        }

        this.renderer.render(this.scene, this.camera);
      });
    },
  },
  beforeUnmount() {
    // Clean up event listeners
    this.controllers.forEach((controller) => {
      controller.removeEventListener('selectstart', this.onSelectStart);
      controller.removeEventListener('selectend', this.onSelectEnd);
    });
  },
};
</script>

<style scoped>
/* No styles needed for this component */
</style>
