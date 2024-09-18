
        <template>
            <!-- This component doesn't render anything in the DOM -->
        </template>
        
        <script>
        import * as THREE from 'three';
        import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
        import { ref, onValue, update } from "firebase/database"; // Import Firebase methods
        import { database } from '../../firebase'; // Import your Firebase instance
        
        export default {
            name: 'GrabbableCube',
            props: ['scene', 'renderer', 'cubeId'],
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
            this.loadCubeDataFromFirebase(); // Load cube data from Firebase
            this.animate();
            },
            methods: {
            loadCubeDataFromFirebase() {
                const cubeRef = ref(database, `grabbableCubes/${this.cubeId}`);
        
                // Listen for real-time changes to the cube data
                onValue(cubeRef, (snapshot) => {
                const cubeData = snapshot.val();
                if (cubeData) {
                    if (!this.cube) {
                    // If the cube hasn't been added to the scene yet, create it
                    this.addGrabbableCube(cubeData.position, cubeData.rotation, cubeData.scale);
                    } else if (!this.isGrabbed) {
                    // If the cube exists and is not being grabbed, update its position
                    this.updateCubeFromFirebaseData(cubeData);
                    }
                } else {
                    // If no data exists, create a cube with default values
                    this.addGrabbableCube({ x: 0, y: 0.7, z: -1 });
                }
                });
            },
        
            addGrabbableCube(position = { x: 0, y: 0.7, z: -1 }, rotation = { x: 0, y: 0, z: 0 }, scale = { x: 1, y: 1, z: 1 }) {
                const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
                const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
                this.cube = new THREE.Mesh(geometry, material);
                this.cube.castShadow = true;
                this.cube.receiveShadow = true;
        
                // Set the cube's position, rotation, and scale based on Firebase data
                this.cube.position.set(position.x, position.y, position.z);
                this.cube.rotation.set(rotation.x, rotation.y, rotation.z);
                this.cube.scale.set(scale.x, scale.y, scale.z);
        
                // Enable interaction on the cube
                this.cube.userData.interactive = true;
        
                this.scene.add(this.cube);
        
                // Initialize velocity
                this.velocity.set(0, 0, 0);
        
                // Store initial cube properties in Firebase if not already present
                this.saveCubeDataToFirebase();
            },
        
            updateCubeFromFirebaseData(cubeData) {
                // Update the cube's position, rotation, and scale
                this.cube.position.set(cubeData.position.x, cubeData.position.y, cubeData.position.z);
                this.cube.rotation.set(cubeData.rotation.x, cubeData.rotation.y, cubeData.rotation.z);
                this.cube.scale.set(cubeData.scale.x, cubeData.scale.y, cubeData.scale.z);
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
        
                // Set the cube's world position based on the controller's current position
                const newWorldPosition = new THREE.Vector3();
                this.grabber.getWorldPosition(newWorldPosition);
                this.cube.position.copy(newWorldPosition);
        
                // Calculate throw velocity based on controller's motion
                const deltaTime = this.clock.getDelta();
                const newPosition = new THREE.Vector3();
                this.cube.getWorldPosition(newPosition);
                this.velocity.copy(newPosition).sub(this.previousPosition).divideScalar(deltaTime);
        
                // Save cube data to Firebase after moving
                this.saveCubeDataToFirebase();
                }
            },
        
            saveCubeDataToFirebase() {
                const cubeRef = ref(database, `grabbableCubes/${this.cubeId}`);
        
                const cubeData = {
                position: {
                    x: this.cube.position.x,
                    y: this.cube.position.y,
                    z: this.cube.position.z,
                },
                rotation: {
                    x: this.cube.rotation.x,
                    y: this.cube.rotation.y,
                    z: this.cube.rotation.z,
                },
                scale: {
                    x: this.cube.scale.x,
                    y: this.cube.scale.y,
                    z: this.cube.scale.z,
                },
                };
        
                update(cubeRef, cubeData);
            },
        
            animate() {
                this.renderer.setAnimationLoop(() => {
                if (this.cube) {
                    if (!this.isGrabbed) {
                    // Apply gravity
                    const deltaTime = this.clock.getDelta();
                    this.velocity.y -= 9.81 * deltaTime;
        
                    // Update cube's position based on velocity
                    this.cube.position.addScaledVector(this.velocity, deltaTime);
        
                    // Collision with the ground
                    if (this.cube.position.y < 0.1) {
                        this.cube.position.y = 0.1;
                        this.velocity.y *= -0.5; // Reduce vertical velocity
                        this.velocity.x *= 0.8;  // Reduce horizontal velocity
                        this.velocity.z *= 0.8;
                    }
                    } else {
                    // Keep track of the position for velocity calculation
                    this.cube.getWorldPosition(this.previousPosition);
                    }
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
        
        
        
        