<template>
  <!-- Ce composant ne rend pas directement de contenu HTML -->
</template>

<script>
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { markRaw } from 'vue';

export default {
  name: 'ModelComponent',
  props: {
    scene: {
      type: Object,
      required: true, // La scène Three.js est passée en prop
    },
    modelUrl: {
      type: String,
      required: true, // L'URL du modèle à charger est requise
    },
    position: {
      type: Object,
      default: () => ({ x: 0, y: 0, z: 0 }), // Position par défaut
    },
    scale: {
      type: Object,
      default: () => ({ x: 1, y: 1, z: 1 }), // Échelle par défaut
    },
    rotation: {
      type: Object,
      default: () => ({ x: 0, y: 0, z: 0 }), // Rotation par défaut
    }
  },
  data() {
    return {
      model: null, // Contiendra le modèle 3D chargé
    };
  },
  mounted() {
    this.loadModel(); // Charger le modèle lors du montage du composant
  },
  methods: {
    // Fonction pour charger le modèle en fonction de son extension
    loadModel() {
      // Valider que l'URL du modèle est définie
      if (!this.modelUrl) {
        console.error('modelUrl est manquant ou indéfini.');
        return;
      }

      // Obtenir l'extension du fichier à partir de l'URL
      const fileExtension = this.modelUrl.split('.').pop().toLowerCase();

      if (fileExtension === 'obj') {
        this.loadOBJ();
      } else if (fileExtension === 'gltf' || fileExtension === 'glb') {
        this.loadGLTF();
      } else {
        console.error('Format de fichier non pris en charge :', fileExtension);
      }
    },

    // Charger les fichiers OBJ avec ou sans MTL (matériaux)
    loadOBJ() {
      const mtlLoader = new MTLLoader();
      const objLoader = new OBJLoader();

      // Essayer de charger les matériaux associés (MTL) si disponible
      const mtlUrl = this.modelUrl.replace('.obj', '.mtl');
      mtlLoader.load(mtlUrl, (materials) => {
        materials.preload();
        objLoader.setMaterials(materials);
        objLoader.load(this.modelUrl, (obj) => {
          console.log('OBJ Modèle avec MTL chargé :', obj);
          this.addModelToScene(obj);
        });
      }, undefined, (error) => {
        // Si pas de fichier MTL, on charge l'OBJ sans MTL
        console.warn('Aucun fichier MTL trouvé. Chargement de l\'OBJ sans MTL.');
        objLoader.load(this.modelUrl, (obj) => {
          console.log('OBJ Modèle sans MTL chargé :', obj);
          this.addModelToScene(obj);
        }, undefined, (error) => {
          console.error('Erreur de chargement du modèle OBJ :', error);
        });
      });
    },

    // Charger les fichiers GLTF et GLB
    loadGLTF() {
      const loader = new GLTFLoader();
      loader.load(this.modelUrl, (gltf) => {
        console.log('GLTF/GLB Modèle chargé :', gltf);
        this.addModelToScene(gltf.scene); // Utilise `gltf.scene` pour GLTF/GLB
      }, undefined, (error) => {
        console.error('Erreur de chargement du modèle GLTF/GLB :', error);
      });
    },

    // Fonction pour ajouter le modèle à la scène et appliquer des transformations
    addModelToScene(model) {
      this.model = markRaw(model); // Marquer le modèle comme non-réactif

      // Appliquer les transformations (position, échelle, rotation)
      this.model.position.set(this.position.x, this.position.y, this.position.z);
      this.model.scale.set(this.scale.x, this.scale.y, this.scale.z);
      this.model.rotation.set(
        THREE.MathUtils.degToRad(this.rotation.x),
        THREE.MathUtils.degToRad(this.rotation.y),
        THREE.MathUtils.degToRad(this.rotation.z)
      );

      this.scene.add(this.model); // Ajouter le modèle à la scène
    }
  },
  beforeUnmount() {
    if (this.model) {
      // Retirer le modèle de la scène avant de détruire le composant
      this.scene.remove(this.model);
    }
  },
};
</script>

<style scoped>
/* Aucun style n'est nécessaire pour ce composant */
</style>
