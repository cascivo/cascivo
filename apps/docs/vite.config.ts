import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite-plus'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const preactCompat = path.resolve(__dirname, 'node_modules/preact/compat')
const preactJsxRuntime = path.resolve(__dirname, 'node_modules/preact/jsx-runtime')

export default defineConfig({
  resolve: {
    alias: {
      'react/jsx-runtime': preactJsxRuntime,
      'react/jsx-dev-runtime': preactJsxRuntime,
      react: preactCompat,
      'react-dom': preactCompat,
    },
  },
  server: {
    // Allow importing registry.json from the monorepo root.
    fs: { allow: [path.resolve(__dirname, '../..')] },
  },
})
