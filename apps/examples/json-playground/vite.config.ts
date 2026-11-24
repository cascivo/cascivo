import { resolve } from 'node:path'
import { defineConfig } from 'vite-plus'
import { cascivoRepoScopedName } from '../../../scripts/contract/scoped-name.ts'

export default defineConfig({
  // Contract class names (cv-<unit>-<local>) for the aliased component source, like @cascivo/react.
  css: { modules: { generateScopedName: cascivoRepoScopedName } },
  resolve: {
    alias: {
      // Must precede the bare '@cascivo/core' entry: a string alias replaces by
      // prefix, so without this '@cascivo/core/pure' resolves to 'index.ts/pure'.
      '@cascivo/core/pure': resolve(__dirname, '../../../packages/core/src/pure.ts'),
      '@cascivo/core': resolve(__dirname, '../../../packages/core/src/index.ts'),
      '@cascivo/storage': resolve(__dirname, '../../../packages/storage/src/index.ts'),
      '@cascivo/i18n': resolve(__dirname, '../../../packages/i18n/src/index.ts'),
      '@cascivo/ai': resolve(__dirname, '../../../packages/ai/src/index.ts'),
      '@cascivo/react': resolve(__dirname, '../../../packages/react/src/index.ts'),
      // Must precede the bare '@cascivo/render' entry: a string alias replaces by
      // prefix, so without these '@cascivo/render/text' resolves to 'index.ts/text'.
      '@cascivo/render/text': resolve(__dirname, '../../../packages/render/src/view-text.ts'),
      '@cascivo/render/validate': resolve(__dirname, '../../../packages/render/src/validate.ts'),
      '@cascivo/render': resolve(__dirname, '../../../packages/render/src/index.ts'),
    },
  },
})
