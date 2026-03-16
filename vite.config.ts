import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Firebase — biggest dep (~400KB), only needed after login
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            // PDF generation — only needed when creating documents
            'vendor-pdf': ['jspdf', 'jspdf-autotable'],
            // Charts — only admin dashboard
            'vendor-charts': ['recharts'],
            // Excel parser — only on file upload
            'vendor-xlsx': ['xlsx'],
            // React core
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  };
});
