import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // public/ directory files (sitemap.xml, robots.txt, og-image.png, etc.)
  // are automatically copied to dist/ by Vite — no extra config needed.
  build: {
    // Ensure assets are hashed for cache-busting
    assetsDir: 'assets',
  },
})
