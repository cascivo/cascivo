import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { StorybookConfig } from '@storybook/react-vite'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = resolve(__dirname, '../../..')

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../stories/**/*.stories.tsx'],
  addons: ['@storybook/addon-a11y'],
  viteFinal: (cfg) => ({
    ...cfg,
    resolve: {
      ...cfg.resolve,
      alias: {
        ...(cfg.resolve?.alias as Record<string, string> | undefined),
        '@cascade-ui/core': resolve(root, 'packages/core/src/index.ts'),
        '@cascade-ui/storage': resolve(root, 'packages/storage/src/index.ts'),
        '@cascade-ui/i18n': resolve(root, 'packages/i18n/src/index.ts'),
        '@cascade-ui/ai': resolve(root, 'packages/ai/src/index.ts'),
      },
    },
  }),
}

export default config
