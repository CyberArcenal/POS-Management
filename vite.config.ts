import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "./",
  build: {
    outDir: "dist/renderer", // output for React build
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'], // separate vendor libs
        },
      },
    },

  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
