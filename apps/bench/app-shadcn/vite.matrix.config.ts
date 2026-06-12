import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vite-plus'
import base from './vite.config'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const entry = process.env['MATRIX_ENTRY']
if (!entry) throw new Error('MATRIX_ENTRY env required')

export default mergeConfig(
  base,
  defineConfig({
    build: {
      outDir: `dist-matrix/${entry}`,
      rollupOptions: { input: path.resolve(__dirname, `matrix/${entry}.html`) },
    },
  }),
)
