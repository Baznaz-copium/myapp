import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  base: './',
  server: {
    host: true,
    port: 5173, // if you want to use http://baznaz.local without a port
    allowedHosts: ['baznaz.local'],
  },
});
