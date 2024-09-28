<template>
    <!-- Le composant n'affiche aucun HTML directement -->
</template>

<script>
import { defineComponent, markRaw, watch } from 'vue';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { database, ref, onValue } from '../../firebase'; // Importer les références Firebase
import { Text } from 'troika-three-text';

export default defineComponent({
    name: 'ScoreComponent',
    props: ['scene', 'size', 'position', 'color', 'scoreId'],

    data() {
        return {
            score: 0, // Valeur initiale du score
            textMesh: null,
        };
    },

    mounted() {
        this.loadScoreFromDatabase(); // Charger le score à l'initialisation
        this.createText(); // Créer le texte 3D
    },

    watch: {
        // Regarder les changements de scoreId et mettre à jour en conséquence
        scoreId(newScoreId, oldScoreId) {
            console.log(`scoreId changé de ${oldScoreId} à ${newScoreId}`);
            this.loadScoreFromDatabase(); // Recharger les données depuis Firebase
        }
    },

    methods: {
        // Méthode pour récupérer le score depuis la base de données en temps réel
        loadScoreFromDatabase() {
            console.log("Récupération du score pour scoreId: " + this.scoreId);
            const scoreRef = ref(database, `game/scores/${this.scoreId}`);
            onValue(scoreRef, (snapshot) => {
                this.score = snapshot.val() || 0; // Récupérer le score ou utiliser 0 par défaut
                this.updateText(); // Mettre à jour le texte 3D lorsque le score change
            });
        },

        // Méthode pour créer le mesh de texte 3D avec effet miroir
        createText() {
            const loader = new FontLoader();

            // Charger la police et créer le texte 3D
            loader.load('fonts/helvetiker_regular.typeface.json', (font) => {

                // Marquer le mesh de texte comme non réactif pour empêcher Vue de le proxy
                this.textMesh = markRaw(new Text());
                this.textMesh.text = this.score;
                this.textMesh.fontSize = 0.5;
                this.textMesh.position.set(0, 1.6, -2); // Position devant la caméra
                this.textMesh.color = 0xffffff;

                // Ajouter le texte à la scène
                this.scene.add(this.textMesh);
            });
        },

        // Méthode pour mettre à jour le texte 3D avec effet miroir lorsque le score change
        updateText() {
            if (this.textMesh) {
                this.textMesh.text = "Score : " + this.score;
            }
        },
    },
});
</script>

<style scoped>
/* Aucun style nécessaire pour ce composant */
</style>
