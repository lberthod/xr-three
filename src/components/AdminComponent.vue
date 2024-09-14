<template>
    <div class="admin-container">
      <h1>Admin - Change Cube Color</h1>
      <form @submit.prevent="updateCubeColor">
        <label for="color">Cube Color (Hex): </label>
        <input type="text" v-model="color" placeholder="#00ff00" />
        <button type="submit">Update Color</button>
      </form>
    </div>
  </template>
  
  <script>
  import { ref as dbRef, set } from 'firebase/database'; // Importation des fonctions Firebase
  import { database } from '../firebase'; // Importation de la configuration Firebase
  
  export default {
    name: 'AdminComponent',
    data() {
      return {
        color: '#00ff00' // Couleur par défaut
      };
    },
    methods: {
      updateCubeColor() {
        // Référence à la couleur du cube dans Firebase
        const cubeColorRef = dbRef(database, 'cube/color');
        // Mettre à jour la couleur dans la base de données
        set(cubeColorRef, this.color)
          .then(() => {
            alert('Couleur du cube mise à jour avec succès !');
          })
          .catch((error) => {
            alert('Erreur lors de la mise à jour de la couleur : ' + error);
          });
      }
    }
  };
  </script>
  
  <style scoped>
  .admin-container {
    margin: 50px;
    text-align: center;
  }
  input {
    margin-right: 10px;
    padding: 5px;
    width: 150px;
  }
  button {
    padding: 5px 10px;
  }
  </style>
  