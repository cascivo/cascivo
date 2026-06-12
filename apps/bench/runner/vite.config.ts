import { defineConfig } from 'vite-plus'

export default defineConfig({
  test: {
    exclude: ['test/**', 'node_modules/**'],
  },
})
