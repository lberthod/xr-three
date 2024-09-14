<template>
    <!-- This component doesn't render anything in the DOM -->
</template>

<script>
import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { markRaw } from 'vue';

export default {
    name: 'GrabbableCube',
  props: ['scene', 'renderer'],
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

    this.addGrabbableCube();
    this.setupControllers();
    this.animate();
  },
    methods: {
        addGrabbableCube() {
            const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
            const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
            this.cube = new THREE.Mesh(geometry, material);
            this.cube.castShadow = true;
            this.cube.receiveShadow = true;
            this.cube.position.set(0, 0.7, -1);

            // Enable interaction on the cube
            this.cube.userData.interactive = true;

            this.scene.add(this.cube);

            // Initialize velocity
            this.velocity.set(0, 0, 0);
        },

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

        onSelectStart(event) {
            const controller = event.target;

            // Check for intersection with the cube
            const tempMatrix = new THREE.Matrix4();
            tempMatrix.identity().extractRotation(controller.matrixWorld);

            const raycaster = new THREE.Raycaster();
            raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
            raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

            const intersects = raycaster.intersectObject(this.cube);

            if (intersects.length > 0) {
                this.isGrabbed = true;
                this.grabber = controller;

                // Stop cube's motion
                this.velocity.set(0, 0, 0);

                // Attach cube to controller
                controller.add(this.cube);
                this.cube.position.set(0, 0, 0);
                this.cube.rotation.set(0, 0, 0);
            }
        },

        onSelectEnd(event) {
            if (this.isGrabbed && this.grabber === event.target) {
                this.isGrabbed = false;

                // Detach cube from controller
                this.grabber.remove(this.cube);
                this.scene.add(this.cube);

                // Calculate throw velocity based on controller's motion
                const deltaTime = this.clock.getDelta();
                const newPosition = new THREE.Vector3();
                this.cube.getWorldPosition(newPosition);
                this.velocity.copy(newPosition).sub(this.previousPosition).divideScalar(deltaTime);
            }
        },

        animate() {
            this.renderer.setAnimationLoop(() => {
                if (!this.isGrabbed) {
                    // Apply simple gravity
                    this.velocity.y -= 9.81 * this.clock.getDelta(); // Gravity acceleration

                    // Update cube position based on velocity
                    this.cube.position.addScaledVector(this.velocity, this.clock.getDelta());

                    // Simple ground collision
                    if (this.cube.position.y < 0.1) {
                        this.cube.position.y = 0.1;
                        this.velocity.y *= -0.5; // Dampen velocity on collision
                        this.velocity.x *= 0.8; // Dampen horizontal velocity
                        this.velocity.z *= 0.8;
                    }
                } else {
                    // When grabbed, keep track of position to calculate velocity on release
                    this.cube.getWorldPosition(this.previousPosition);
                }

                this.renderer.render(this.scene, this.$parent.camera);
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