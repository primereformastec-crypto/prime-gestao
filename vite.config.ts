import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { apiMiddlewarePlugin } from './server/apiMiddleware.js';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), apiMiddlewarePlugin()],
  server: {
    port: 3000,
    host: true,
    allowedHosts: true
  }
});
