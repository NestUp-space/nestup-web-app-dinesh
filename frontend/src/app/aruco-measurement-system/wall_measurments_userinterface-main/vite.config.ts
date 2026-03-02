import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
// base: '/measurements/' so the app is served at http://localhost:3000/measurements (same port as main site)
export default defineConfig({
  base: '/measurements/',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
  },
});
