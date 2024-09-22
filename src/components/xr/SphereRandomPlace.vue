<template>
    <!-- Le template n'affichera rien directement, les sphères sont ajoutées à la scène -->
</template>

<script>
import * as THREE from 'three';
import { ref, set, database, onValue } from '../../firebase';


export default {
    name: 'SphereRandomPlace',
    props: ['scene', 'controllers'],
    data() {
        return {
            spheres: [], // Stocker les sphères générées
            sphereBoundingSpheres: [], // Stocker les limites des sphères pour la collision
            sphereCollisionStates: [], // Stocker l'état de collision pour chaque sphère
            db: null, // Référence à la base de données
        };
    },
    mounted() {
        this.initializeFirebase(); // Initialiser Firebase
    },
    methods: {
        initializeFirebase() {
            // Votre configuration Firebase (remplacez par vos propres informations)

            this.db = database;

            // Charger les sphères depuis la base de données
            this.loadSpheresFromDatabase();
        },

        loadSpheresFromDatabase() {
            const spheresRef = ref(this.db, 'random');

            onValue(spheresRef, (snapshot) => {
                const spheresData = snapshot.val();

                if (spheresData) {
                    // Supprimer les sphères actuelles de la scène
                    this.clearSpheres();

                    // Charger les sphères depuis la base de données
                    Object.keys(spheresData).forEach((sphereId) => {
                        const sphereData = spheresData[sphereId];
                        this.addSphere(sphereData.position, sphereId, sphereData.color);
                    });
                } else {
                    // Générer de nouvelles sphères si aucune n'existe dans la base de données
                    this.generateRandomSpheres();
                }

                // Commencer à vérifier les collisions
                this.checkCollision();
            });
        },

        clearSpheres() {
            // Supprimer les sphères de la scène
            this.spheres.forEach((sphere) => {
                this.scene.remove(sphere);
            });
            this.spheres = [];
            this.sphereBoundingSpheres = [];
            this.sphereCollisionStates = [];
        },

        generateRandomSpheres() {
            const sphereCount = 10; // Nombre de sphères à générer

            for (let i = 0; i < sphereCount; i++) {
                const randomPosition = this.getRandomPosition();
                const color = this.getRandomColor();
                this.addSphere(randomPosition, i, color);

                // Enregistrer la sphère dans la base de données
                this.saveSphereToDatabase(i, randomPosition, color);
            }
        },

        getRandomPosition() {
            // Générer des positions aléatoires proches de l'utilisateur, devant lui
            const x = (Math.random() - 0.5) * 1; // Valeurs entre -0.5 et 0.5
            const y = Math.random() * 1 + 0.5;  // Valeurs entre 0.5 et 1.5 pour être à hauteur accessible
            const z = -(Math.random() * 1 + 0.5); // Valeurs entre -0.5 et -1.5 pour être devant l'utilisateur

            return { x, y, z };
        },

        addSphere(position, sphereId, color) {
            if (!this.scene) {
                console.error("La scène n'est pas disponible");
                return;
            }

            // Créer la géométrie et le matériau pour la sphère
            const geometry = new THREE.SphereGeometry(0.2, 32, 32);
            const material = new THREE.MeshStandardMaterial({ color: color });
            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.set(position.x, position.y, position.z);

            // Ajouter la sphère à la scène
            this.scene.add(sphere);

            // Créer une bounding sphere pour la collision
            const boundingSphere = new THREE.Sphere(sphere.position, 0.2);

            // Stocker la sphère et sa bounding sphere
            this.spheres[sphereId] = sphere;
            this.sphereBoundingSpheres[sphereId] = boundingSphere;

            // Initialiser l'état de collision pour cette sphère
            this.sphereCollisionStates[sphereId] = {
                isColliding: false,
                canUpdate: true
            };

            console.log(`Sphère ${sphereId} ajoutée à la position`, position);
        },

        getRandomColor() {
            // Générer une couleur aléatoire pour chaque sphère
            const colors = ['#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#ffff00'];
            return colors[Math.floor(Math.random() * colors.length)];
        },

        checkCollision() {
            const check = () => {
                if (this.controllers && this.controllers.length > 0 && this.spheres.length > 0) {
                    // Pour chaque contrôleur VR/AR
                    this.controllers.forEach(controller => {
                        const controllerPosition = new THREE.Vector3();
                        controller.getWorldPosition(controllerPosition);

                        // Vérifier chaque sphère pour voir si elle entre en collision avec le contrôleur
                        this.sphereBoundingSpheres.forEach((boundingSphere, index) => {
                            const distance = controllerPosition.distanceTo(boundingSphere.center);

                            // Si la distance est inférieure ou égale au rayon de la sphère
                            if (distance <= boundingSphere.radius * 1.55) { // Ajustement du facteur si nécessaire
                                if (!this.sphereCollisionStates[index].isColliding && this.sphereCollisionStates[index].canUpdate) {
                                    console.log(`Collision détectée avec la sphère ${index}`);
                                    this.updateSpherePosition(index); // Déplacer la sphère
                                    this.sphereCollisionStates[index].isColliding = true;
                                    this.sphereCollisionStates[index].canUpdate = false;
                                }
                            } else {
                                if (this.sphereCollisionStates[index].isColliding) {
                                    console.log(`Collision terminée avec la sphère ${index}`);
                                    this.sphereCollisionStates[index].isColliding = false;
                                    this.sphereCollisionStates[index].canUpdate = true;
                                }
                            }
                        });
                    });
                }
                // Vérifier les collisions à chaque frame
                requestAnimationFrame(check);
            };

            check(); // Démarrer la vérification des collisions
        },

        updateSpherePosition(index) {
            const newPosition = this.getRandomPosition();

            // Mettre à jour la position de la sphère et de sa bounding sphere
            const sphere = this.spheres[index];
            sphere.position.set(newPosition.x, newPosition.y, newPosition.z);
            this.sphereBoundingSpheres[index].center.copy(sphere.position);

            // Mettre à jour la position dans la base de données
            this.updateSphereInDatabase(index, newPosition);

            console.log(`Position de la sphère ${index} mise à jour à`, newPosition);
        },

        saveSphereToDatabase(sphereId, position, color) {
            const sphereRef = ref(this.db, `random/${sphereId}`);
            set(sphereRef, {
                position: position,
                color: color
            });
        },

        updateSphereInDatabase(sphereId, position) {
            const positionRef = ref(this.db, `random/${sphereId}/position`);
            set(positionRef, position);
        },
    },
};
</script>

<style scoped>
/* Pas de styles spécifiques nécessaires */
</style>
