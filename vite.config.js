import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // N6: a build id the ?debug=1 "Copy report" blob can echo so CB's paste identifies the build.
  define: {
    __BUILD_ID__: JSON.stringify(new Date().toISOString().replace(/\.\d+Z$/, 'Z')),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 800,
    minify: 'esbuild',
    sourcemap: false,
  },
  server: {
    port: 3000,
  },
});
