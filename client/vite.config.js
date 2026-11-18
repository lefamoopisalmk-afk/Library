import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The React app talks to the Express API through this proxy during
// development, so fetch('/api/...') reaches http://localhost:4000.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
      '/uploads': 'http://localhost:4000',
    },
  },
});
