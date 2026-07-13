import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        method: resolve(__dirname, 'method.html'),
        about: resolve(__dirname, 'about.html'),
        courses: resolve(__dirname, 'courses.html'),
        pricing: resolve(__dirname, 'pricing.html'),

        pricingScene: resolve(__dirname, 'pricing-scene.js'),
        pricingCardsScene: resolve(__dirname, 'pricing-cards-scene.js'),
        aboutScene: resolve(__dirname, 'about-scene.js'),
        scene: resolve(__dirname, 'scene.js'),
      },
    },
  },
  optimizeDeps: {
    exclude: ['stats-gl'],
  },
  esbuild: {
    supported: {
      'top-level-await': true,
    },
  },
});
