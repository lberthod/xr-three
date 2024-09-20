<template>
    <!-- Ce composant ne rend rien dans le DOM -->
</template>

<script>
import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { ref, onValue, update, get } from "firebase/database";
import { database } from '../../firebase';

export default {
    name: 'GrabbableCube',
    props: ['scene', 'renderer', 'cubeId'],
    data() {
        return {
            isGrabbed: false,
            isUpdatingFromFirebase: false,
            previousCubeData: null,
            updateInterval: null,
            userId: null, // ID unique de l'utilisateur
        };
    },
    mounted() {
        this.cube = null;
        this.grabber = null;
        this.controllers = [];
        this.previousPosition = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.clock = new THREE.Clock();

        // Générez un ID unique pour l'utilisateur si vous n'utilisez pas Firebase Auth
        this.userId = this.generateUserId();

        this.setupControllers();
        this.loadCubeDataFromFirebase();
        this.animate();
    },
    methods: {
        generateUserId() {
            // Générez un ID unique pour l'utilisateur
            return 'user_' + Math.random().toString(36).substr(2, 9);
        },
        loadCubeDataFromFirebase() {
            const cubeRef = ref(database, `grabbableCubes/${this.cubeId}`);

            // Écouter les changements en temps réel du cube
            onValue(cubeRef, (snapshot) => {
                const cubeData = snapshot.val();
                if (cubeData) {
                    if (!this.cube) {
                        this.addGrabbableCube(cubeData.position, cubeData.rotation, cubeData.scale);
                    } else if (!this.isGrabbed || cubeData.isLockedBy !== this.userId) {
                        // Mettre à jour le cube même s'il est verrouillé par un autre utilisateur
                        this.isUpdatingFromFirebase = true;
                        this.updateCubeFromFirebaseData(cubeData);
                        this.isUpdatingFromFirebase = false;
                    }
                } else {
                    this.addGrabbableCube({ x: 0, y: 0.7, z: -1 });
                }
            });
        },

        getCubePosition() {
        if (this.cube) {
            return {
                x: this.cube.position.x,
                y: this.cube.position.y,
                z: this.cube.position.z,
            };
        } else {
            return null;
        }
    },
        addGrabbableCube(position = { x: 0, y: 0.7, z: -1 }, rotation = { x: 0, y: 0, z: 0 }, scale = { x: 1, y: 1, z: 1 }) {
            const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
            const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
            this.cube = new THREE.Mesh(geometry, material);
            this.cube.castShadow = true;
            this.cube.receiveShadow = true;

            // Définir la position, la rotation et l'échelle du cube
            this.cube.position.set(position.x, position.y, position.z);
            this.cube.rotation.set(rotation.x, rotation.y, rotation.z);
            this.cube.scale.set(scale.x, scale.y, scale.z);

            this.cube.userData.interactive = true;
            this.scene.add(this.cube);

            this.velocity.set(0, 0, 0);

            this.saveCubeDataToFirebase();
        },

        updateCubeFromFirebaseData(cubeData) {
            // Interpolation pour un mouvement plus fluide
            this.cube.position.lerp(new THREE.Vector3(cubeData.position.x, cubeData.position.y, cubeData.position.z), 0.5);
            this.cube.rotation.set(cubeData.rotation.x, cubeData.rotation.y, cubeData.rotation.z);
            this.cube.scale.set(cubeData.scale.x, cubeData.scale.y, cubeData.scale.z);
        },

        setupControllers() {
            const controller1 = this.renderer.xr.getController(0);
            const controller2 = this.renderer.xr.getController(1);
            this.scene.add(controller1);
            this.scene.add(controller2);
            this.controllers = [controller1, controller2];

            this.controllers.forEach((controller) => {
                controller.addEventListener('selectstart', this.onSelectStart);
                controller.addEventListener('selectend', this.onSelectEnd);
            });

            const controllerModelFactory = new XRControllerModelFactory();

            const controllerGrip1 = this.renderer.xr.getControllerGrip(0);
            controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
            this.scene.add(controllerGrip1);

            const controllerGrip2 = this.renderer.xr.getControllerGrip(1);
            controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
            this.scene.add(controllerGrip2);
        },

        async onSelectStart(event) {
            const controller = event.target;

            const tempMatrix = new THREE.Matrix4();
            tempMatrix.identity().extractRotation(controller.matrixWorld);

            const raycaster = new THREE.Raycaster();
            raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
            raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

            const intersects = raycaster.intersectObject(this.cube);

            if (intersects.length > 0) {
                const cubeRef = ref(database, `grabbableCubes/${this.cubeId}`);
                const snapshot = await get(cubeRef);
                const cubeData = snapshot.val();

                if (!cubeData.isLocked || cubeData.isLockedBy === this.userId) {
                    this.isGrabbed = true;
                    this.grabber = controller;

                    // Arrêter la vélocité
                    this.velocity.set(0, 0, 0);

                    // Attacher le cube au contrôleur
                    controller.add(this.cube);
                    this.cube.position.set(0, 0, 0);
                    this.cube.rotation.set(0, 0, 0);

                    // Verrouiller le cube dans Firebase avec l'ID de l'utilisateur
                    this.saveCubeDataToFirebase(true);

                    // Démarrer l'envoi des mises à jour à Firebase
                    this.startSendingUpdates();
                }
            }
        },

        onSelectEnd(event) {
            if (this.isGrabbed && this.grabber === event.target) {
                this.isGrabbed = false;

                // Détacher le cube du contrôleur
                this.grabber.remove(this.cube);
                this.scene.add(this.cube);

                // Mettre à jour la position du cube
                const newWorldPosition = new THREE.Vector3();
                this.grabber.getWorldPosition(newWorldPosition);
                this.cube.position.copy(newWorldPosition);

                // Calculer la vélocité
                const deltaTime = this.clock.getDelta();
                const newPosition = new THREE.Vector3();
                this.cube.getWorldPosition(newPosition);
                this.velocity.copy(newPosition).sub(this.previousPosition).divideScalar(deltaTime);

                // Arrêter l'envoi des mises à jour
                this.stopSendingUpdates();

                // Déverrouiller le cube dans Firebase
                this.saveCubeDataToFirebase(false);
            }
        },

        saveCubeDataToFirebase(isGrabbed = false) {
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
                isLocked: isGrabbed,
                isLockedBy: isGrabbed ? this.userId : null,
            };

            update(cubeRef, cubeData);
        },

        startSendingUpdates() {
            // Envoyer les mises à jour à Firebase toutes les 50ms
            this.updateInterval = setInterval(() => {
                if (this.isGrabbed) {
                    this.saveCubeDataToFirebase(true);
                }
            }, 50);
        },

        stopSendingUpdates() {
            clearInterval(this.updateInterval);
        },

        animate() {
            this.renderer.setAnimationLoop(() => {
                if (this.cube) {
                    if (!this.isGrabbed) {
                        // Appliquer la gravité et les collisions
                        const deltaTime = this.clock.getDelta();
                        this.velocity.y -= 9.81 * deltaTime;
                        this.cube.position.addScaledVector(this.velocity, deltaTime);

                        if (this.cube.position.y < 0.1) {
                            this.cube.position.y = 0.1;
                            this.velocity.y *= -0.5;
                            this.velocity.x *= 0.8;
                            this.velocity.z *= 0.8;
                        }
                    } else {
                        // Mettre à jour la position précédente pour le calcul de la vélocité
                        this.cube.getWorldPosition(this.previousPosition);
                    }

                    // Ne pas empêcher les mises à jour depuis Firebase pendant la manipulation
                    // Supprimer la condition `!this.isUpdatingFromFirebase` pour permettre les mises à jour
                    // Éviter d'écrire dans Firebase si nous recevons des données de Firebase
                    if (!this.isUpdatingFromFirebase && !this.isGrabbed) {
                        this.saveCubeDataToFirebase(false);
                    }
                }

                this.renderer.render(this.scene, this.$parent.camera);
            });
        },
    },
    beforeUnmount() {
        this.controllers.forEach((controller) => {
            controller.removeEventListener('selectstart', this.onSelectStart);
            controller.removeEventListener('selectend', this.onSelectEnd);
        });
        this.stopSendingUpdates();
    },
};
</script>
    