import { defineConfig } from 'vite-plus'

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        loadPaths: ['node_modules', '../../../node_modules'],
        silenceDeprecations: ['mixed-decls', 'global-builtin', 'import'],
      },
    },
  },
  preview: { port: 4183, strictPort: true },
  server: { port: 4183, strictPort: true },
})
