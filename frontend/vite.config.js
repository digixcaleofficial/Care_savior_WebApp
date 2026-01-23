import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // 1. Shadcn UI ke liye Alias Setup (@ = src folder)
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // 2. Backend Connection ke liye Proxy Setup
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Backend ka address
        changeOrigin: true,
        secure: false,
      },
    },
  },
})