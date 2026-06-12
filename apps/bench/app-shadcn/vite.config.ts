import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite-plus'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  preview: { port: 4182, strictPort: true },
  server: { port: 4182, strictPort: true },
})
