<template>
    <div>
      <AdminComponent />
    </div>
  </template>
  
  <script>
  import AdminComponent from '../components/AdminComponent.vue'; // Import du composant d'administration
  
  export default {
    name: 'AdminView',
    components: {
      AdminComponent
    }
  };
  </script>
  