import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages 使用 /mediastory/，自定义域名使用 /
  base: process.env.GITHUB_ACTIONS ? '/mediastory/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
