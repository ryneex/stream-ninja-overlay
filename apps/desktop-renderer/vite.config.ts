import path from "path"

import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const dist = path.resolve(import.meta.dirname, "../desktop/dist/renderer")
const port = 4783

export default defineConfig({
  build: {
    outDir: dist,
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  base: "./",
  clearScreen: false,
  plugins: [react(), tailwindcss()],
})
