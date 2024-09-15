<template>
    <div id="mobile-container">
      <canvas ref="mobileCanvas"></canvas>
    </div>
  </template>
  
  <script>
  // non fonctionnell
  import * as THREE from 'three';
  
  export default {
    name: 'MobileExperience',
    data() {
      return {
        renderer: null,
        scene: null,
        camera: null,
        object: null,
        touchStartX: 0,
        touchStartY: 0,
      };
    },
    mounted() {
      this.initScene(); // Initialize the Three.js scene
      this.addTouchControls(); // Add touch controls for interaction
      window.addEventListener('resize', this.onWindowResize); // Handle window resizing
    },
    beforeUnmount() {
      window.removeEventListener('resize', this.onWindowResize);
    },
    methods: {
      // Initialize the Three.js scene
      initScene() {
        const canvas = this.$refs.mobileCanvas;
  
        // Create the renderer
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio); // Ensure sharp rendering on mobile
        this.renderer.setSize(window.innerWidth, window.innerHeight);
  
        // Create the scene
        this.scene = new THREE.Scene();
  
        // Create a camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 0, 5); // Make sure the camera is not inside the object and is looking at the scene
  
        // Create a basic cube geometry
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.object = new THREE.Mesh(geometry, material);
  
        // Add the object to the scene
        this.scene.add(this.object);
  
        // Add a basic light (even though `MeshBasicMaterial` doesn't need light, it's useful for future modifications)
        const light = new THREE.AmbientLight(0xffffff, 1);
        this.scene.add(light);
  
        // Start the animation loop
        this.animate();
      },
  
      // Animation loop
      animate() {
        requestAnimationFrame(this.animate); // Ensure the loop continues
  
        // Add basic rotation to the object to ensure something is happening visually
        this.object.rotation.x += 0.01;
        this.object.rotation.y += 0.01;
  
        // Render the scene
        this.renderer.render(this.scene, this.camera);
      },
  
      // Handle window resizing
      onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      },
  
      // Add touch controls for mobile interaction
      addTouchControls() {
        const canvas = this.$refs.mobileCanvas;
  
        // Handle touch start
        canvas.addEventListener('touchstart', this.onTouchStart);
        
        // Handle touch move (drag to rotate object)
        canvas.addEventListener('touchmove', this.onTouchMove);
        
        // Handle touch end (reset touch tracking)
        canvas.addEventListener('touchend', this.onTouchEnd);
      },
  
      // Touch start event handler
      onTouchStart(event) {
        if (event.touches.length === 1) {
          // Record the starting touch position
          this.touchStartX = event.touches[0].clientX;
          this.touchStartY = event.touches[0].clientY;
        }
      },
  
      // Touch move event handler
      onTouchMove(event) {
        if (event.touches.length === 1) {
          // Calculate the movement delta
          const deltaX = event.touches[0].clientX - this.touchStartX;
          const deltaY = event.touches[0].clientY - this.touchStartY;
  
          // Rotate the object based on touch movement
          this.object.rotation.y += deltaX * 0.01;
          this.object.rotation.x += deltaY * 0.01;
  
          // Update the start position for the next move
          this.touchStartX = event.touches[0].clientX;
          this.touchStartY = event.touches[0].clientY;
        }
      },
  
      // Touch end event handler
      onTouchEnd() {
        // Touch interaction ends, no further action needed in this case
      },
    },
  };
  </script>
  
  <style scoped>
  #mobile-container {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    touch-action: none; /* Prevent default touch gestures */
  }
  
  canvas {
    width: 100%;
    height: 100%;
    display: block;
  }
  </style>
  