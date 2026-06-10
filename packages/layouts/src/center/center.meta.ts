import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Center',
  description: 'Horizontally centered container with a configurable max-width.',
  category: 'layout',
  states: [],
  variants: [],
  sizes: [],
  props: [
    { name: 'maxWidth', type: 'string', required: false, description: 'CSS max-width value' },
  ],
  tokens: ['--cascade-space-4'],
  accessibility: { role: 'generic', wcag: 'AA', keyboard: [] },
  examples: [
    {
      title: 'Centered content',
      code: '<Center maxWidth="60rem"><p>Content</p></Center>',
      description: 'Centered container with custom max-width',
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['layout', 'center', 'wrapper'],
}
