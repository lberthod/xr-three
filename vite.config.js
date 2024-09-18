// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  assetsInclude: ['**/*.gltf', '**/*.glb'], // Inclure les fichiers GLTF et GLB comme actifs
});
