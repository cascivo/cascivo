import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { StorybookConfig } from '@storybook/react-vite'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = resolve(__dirname, '../../..')

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../stories/**/*.stories.tsx'],
  staticDirs: ['../public'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-themes'],
  // Publishes manifests/components.json (props, stories, snippets) next to the built
  // Storybook, the interface Storybook's MCP and Chromatic-hosted MCP servers read.
  features: { componentsManifest: true },
  viteFinal: (cfg) => ({
    ...cfg,
    resolve: {
      ...cfg.resolve,
      alias: {
        ...(cfg.resolve?.alias as Record<string, string> | undefined),
        '@cascivo/charts/sparkline': resolve(root, 'packages/charts/src/sparkline.ts'),
        '@cascivo/charts': resolve(root, 'packages/charts/src/index.ts'),
        '@cascivo/editor': resolve(root, 'packages/editor/src/index.ts'),
        '@cascivo/flow': resolve(root, 'packages/flow/src/index.ts'),
        '@cascivo/react': resolve(root, 'packages/react/src/index.ts'),
        // Must precede the bare '@cascivo/core' entry: a string alias replaces by
        // prefix, so without this '@cascivo/core/pure' resolves to 'index.ts/pure'.
        '@cascivo/core/pure': resolve(root, 'packages/core/src/pure.ts'),
        '@cascivo/core': resolve(root, 'packages/core/src/index.ts'),
        '@cascivo/storage': resolve(root, 'packages/storage/src/index.ts'),
        '@cascivo/i18n': resolve(root, 'packages/i18n/src/index.ts'),
        '@cascivo/ai': resolve(root, 'packages/ai/src/index.ts'),
        '@cascivo/icons': resolve(root, 'packages/icons/src/index.tsx'),
        '@cascivo/registry': resolve(root, 'packages/registry/src/index.ts'),
        // Subpath first, for the same prefix-replacement reason as '@cascivo/core/pure'.
        '@cascivo/text/react': resolve(root, 'packages/text/src/react.tsx'),
        '@cascivo/text': resolve(root, 'packages/text/src/index.ts'),
      },
    },
  }),
}

export default config
