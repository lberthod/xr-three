// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import XRView from "../views/XRView.vue";
import AdminView from "../views/AdminView.vue";
import WebExperience from "../components/WebExperience.vue"; // Import the new MobileExperience component
import GameView from "../views/GameView.vue"; // Import the new MobileExperience component

const routes = [
  {
    path: "/",
    name: "Home",
    component: XRView,
  },
  {
    path: "/admin",
    name: "Admin",
    component: AdminView,
  },
  {
    path: "/game",
    name: "GameView",
    component: GameView,
  },
  {
    path: "/mobile-experience", // New route
    name: "MobileExperience",
    component: WebExperience,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
