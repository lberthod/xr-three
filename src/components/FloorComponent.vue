<template>
    <!-- The component doesn't render any HTML directly -->
  </template>
  
  <script>
  import * as THREE from 'three';
  import { markRaw } from 'vue'; // Import markRaw pour des objets non réactifs
  import Ammo from 'ammo.js'; // Import normal d'Ammo.js

  
  export default {
    name: 'FloorComponent',
    props: {
      scene: {
        type: Object,
        required: true,
      },
      physicsWorld: {
        type: Object, // Optionnel, si la physique est utilisée
        default: null,
      },
    },
    mounted() {
      this.createFloor();
    },
    methods: {
      createFloor() {
        // Créer la géométrie et le matériau du sol
        const geometry = new THREE.PlaneGeometry(10, 10); // Sol de 10x10 unités
        const material = new THREE.MeshStandardMaterial({ color: 0x808080, side: THREE.DoubleSide });
  
        // Créer la mesh du sol
        const floor = markRaw(new THREE.Mesh(geometry, material));
        floor.rotation.x = -Math.PI / 2; // Rotate pour l'orienter correctement
        floor.position.y = -1; // Abaisse le sol (par exemple à -1)
        floor.receiveShadow = true; // Autoriser les ombres sur le sol
  
        // Ajouter le sol à la scène
        this.scene.add(floor);
  
        // Optionnel : ajouter de la physique à ce sol si un moteur physique est utilisé
        if (this.physicsWorld) {
          this.addPhysicsToFloor(floor);
        }
      },
  
      addPhysicsToFloor(floor) {

        // Si on utilise Ammo.js, ajouter un rigid body statique pour le sol
        const groundShape = new Ammo.btBoxShape(new Ammo.btVector3(5, 0.1, 5)); // Demi-étendues du sol
        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(0, -0.7, 0)); // Abaisse le sol à Y = -1
        const motionState = new Ammo.btDefaultMotionState(transform);
        const localInertia = new Ammo.btVector3(0, 0, 0); // Les objets statiques n'ont pas besoin d'inertie
        const groundRigidBodyInfo = new Ammo.btRigidBodyConstructionInfo(0, motionState, groundShape, localInertia);
        const groundRigidBody = new Ammo.btRigidBody(groundRigidBodyInfo);
        
        // Ajouter le sol au monde physique
        this.physicsWorld.addRigidBody(groundRigidBody);
      }
    }
  };
  </script>
  
  <style scoped>
  /* Aucun style supplémentaire n'est nécessaire pour ce composant */
  </style>
  