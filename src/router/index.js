// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import XRView from "../views/XRView.vue";
import AdminView from "../views/AdminView.vue";
import WebExperience from "../views/Web3DView.vue"; // Import the new MobileExperience component
import GameView from "../views/GameView.vue"; // Import the new MobileExperience component
import Gamed3DView from "../views/Gamed3DView.vue"; // Import the new MobileExperience component

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
    path: "/web2d",
    name: "web2d",
    component: GameView,
  },
  {
    path: "/web3d", // New route
    name: "web3d",
    component: WebExperience,
  },
  {
    path: "/game3d", // New route
    name: "game3d",
    component: Gamed3DView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
