import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Preserve CRA-style REACT_APP_ env prefix per AGENTS.md §Architecture Rules.
// Vite normally expects VITE_; explicit envPrefix keeps existing .env.example valid.
export default defineConfig({
  plugins: [react()],
  envPrefix: 'REACT_APP_',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  preview: {
    port: 3000,
  },
  build: {
    outDir: 'build',
    sourcemap: true,
  },
});
