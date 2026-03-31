import { defineConfig } from 'vite';

export default defineConfig({
  base: '/gemini-RAG/',
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'https://gemini-rag-c8ng.onrender.com/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
  },
});
