<template>
    <!-- The component doesn't render any HTML directly -->
  </template>
  
  <script>
  import * as THREE from 'three';
  import { markRaw } from 'vue'; // Import markRaw for non-reactive objects
  import Ammo from 'ammo.js'; // Import Ammo.js for physics
  
  export default {
    name: 'SphereComponent',
    props: {
      scene: {
        type: Object,
        required: true,
      },
      physicsWorld: {
        type: Object,
        required: true, // Ammo.js physics world
      },
    },
    data() {
      return {
        sphere: null,
        rigidBody: null, // Ammo.js rigid body for the sphere
      };
    },
    mounted() {
      this.createSphere();
    },
    methods: {
      createSphere() {
        // Create the geometry and material for the sphere
        const radius = 0.2;
        const geometry = new THREE.SphereGeometry(radius, 32, 32); // Create a sphere geometry
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        this.sphere = markRaw(new THREE.Mesh(geometry, material));
        this.sphere.castShadow = true;
        this.sphere.receiveShadow = true;
        this.sphere.position.set(0, 5, 0); // Start the sphere above the ground
        this.scene.add(this.sphere);
  
        // Add physics to the sphere using Ammo.js
        this.addPhysicsToSphere(radius);
      },
  
      addPhysicsToSphere(radius) {
        // Create the Ammo.js rigid body for the sphere
        const mass = 1; // Set mass for the sphere
        const sphereShape = new Ammo.btSphereShape(radius);
        const startTransform = new Ammo.btTransform();
        startTransform.setIdentity();
        startTransform.setOrigin(new Ammo.btVector3(0, 5, 0)); // Start above the ground
        const motionState = new Ammo.btDefaultMotionState(startTransform);
        const localInertia = new Ammo.btVector3(0, 0, 0);
        sphereShape.calculateLocalInertia(mass, localInertia);
  
        const rigidBodyInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, sphereShape, localInertia);
        this.rigidBody = new Ammo.btRigidBody(rigidBodyInfo);
  
        // Add the rigid body to the physics world
        this.physicsWorld.addRigidBody(this.rigidBody);
      },
  
      updatePhysics(deltaTime) {
        // Step the physics world and update the position of the Three.js sphere
        const ms = this.rigidBody.getMotionState();
        if (ms) {
          const transform = new Ammo.btTransform();
          ms.getWorldTransform(transform);
          const origin = transform.getOrigin();
          const rotation = transform.getRotation();
          this.sphere.position.set(origin.x(), origin.y(), origin.z());
          this.sphere.quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
        }
      },
    },
  };
  </script>
  
  <style scoped>
  /* No additional styles needed */
  </style>
  