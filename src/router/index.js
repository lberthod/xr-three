// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import XrExperience from '../components/XrExperience.vue';
import AdminView from '../views/AdminView.vue'; // Import de la vue Admin

const routes = [
  {
    path: '/',
    name: 'Home',
    component: XrExperience
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminView // Route pour l'interface d'administration
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
