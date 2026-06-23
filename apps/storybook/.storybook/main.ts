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
  viteFinal: (cfg) => ({
    ...cfg,
    resolve: {
      ...cfg.resolve,
      alias: {
        ...(cfg.resolve?.alias as Record<string, string> | undefined),
        '@cascivo/charts': resolve(root, 'packages/charts/src/index.ts'),
        '@cascivo/editor': resolve(root, 'packages/editor/src/index.ts'),
        '@cascivo/flow': resolve(root, 'packages/flow/src/index.ts'),
        '@cascivo/core': resolve(root, 'packages/core/src/index.ts'),
        '@cascivo/storage': resolve(root, 'packages/storage/src/index.ts'),
        '@cascivo/i18n': resolve(root, 'packages/i18n/src/index.ts'),
        '@cascivo/ai': resolve(root, 'packages/ai/src/index.ts'),
        '@cascivo/icons': resolve(root, 'packages/icons/src/index.tsx'),
        '@cascivo/registry': resolve(root, 'packages/registry/src/index.ts'),
      },
    },
  }),
}

export default config
