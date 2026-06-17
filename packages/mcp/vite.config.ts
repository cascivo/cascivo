import { defineConfig } from 'vite-plus'

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      // Keep runtime deps external — they are declared in package.json.
      external: [/^node:/, /^@modelcontextprotocol\//, /^@cascivo\//, 'zod'],
    },
  },
  test: {
    environment: 'node',
  },
})
