<template>
    <!-- No DOM element is directly rendered -->
  </template>
  
  <script>
  import { markRaw } from 'vue';
  import * as THREE from 'three';
  import { ref, set } from 'firebase/database'; 
  import { database } from '../firebase'; 
  
  export default {
    name: 'GrabbableaCube',
    props: {
      scene: {
        type: Object,
        required: true,
      },
      camera: {
        type: Object,
        required: true,
      },
      renderer: {
        type: Object,
        required: true,
      },
    },
    data() {
      return {
        raycaster: null,
        mouse: null,
        selectedObject: null,
        isDragging: false,
        db: null,
      };
    },
    mounted() {
      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2();
  
      this.createGrabbableCube();
      this.addMouseEvents();
    },
    methods: {
      createGrabbableCube() {
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        const cube = markRaw(new THREE.Mesh(geometry, material));
        cube.position.set(0, 1, 0);
        cube.castShadow = true;
  
        this.scene.add(cube);
        this.saveCubePosition(cube.position.x, cube.position.y, cube.position.z);
      },
  
      addMouseEvents() {
        const canvasContainer = this.$parent.$refs.canvasContainer; 
  
        if (canvasContainer) {
          canvasContainer.addEventListener('mousedown', this.onMouseDown);
          canvasContainer.addEventListener('mousemove', this.onMouseMove);
          canvasContainer.addEventListener('mouseup', this.onMouseUp);
        } else {
          console.error('Référence canvasContainer non trouvée.');
        }
      },
  
      onMouseDown(event) {
        this.updateMousePosition(event);
  
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children);
  
        if (intersects.length > 0) {
          this.selectedObject = intersects[0].object;
          this.isDragging = true;
        }
      },
  
      onMouseMove(event) {
        if (!this.isDragging) return;
  
        this.updateMousePosition(event);
  
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.scene.children[0]);
  
        if (intersects.length > 0) {
          const intersect = intersects[0];
          this.selectedObject.position.x = intersect.point.x;
          this.selectedObject.position.z = intersect.point.z;
  
          this.saveCubePosition(this.selectedObject.position.x, this.selectedObject.position.y, this.selectedObject.position.z);
        }
      },
  
      onMouseUp() {
        this.isDragging = false;
        this.selectedObject = null;
      },
  
      updateMousePosition(event) {
        const rect = this.$parent.$refs.canvasContainer.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      },
  
      saveCubePosition(x, y, z) {
        if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
          const dbRef = ref(database, 'cubeas/cube1/position');
  
          set(dbRef, { x, y, z })
            .then(() => {
              console.log('Position mise à jour dans Firebase:', { x, y, z });
            })
            .catch((error) => {
              console.error('Erreur lors de la mise à jour de Firebase:', error);
            });
        } else {
          console.error('Données de position invalides. x, y, et z doivent être des nombres.');
        }
      },
    },
    beforeUnmount() {
      const canvasContainer = this.$parent.$refs.canvasContainer;
  
      if (canvasContainer) {
        canvasContainer.removeEventListener('mousedown', this.onMouseDown);
        canvasContainer.removeEventListener('mousemove', this.onMouseMove);
        canvasContainer.removeEventListener('mouseup', this.onMouseUp);
      }
    },
  };
  </script>
  
  <style scoped>
  /* Aucun style supplémentaire requis */
  </style>
  