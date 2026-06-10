import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Spinner',
  description: 'Indeterminate loading indicator',
  category: 'feedback',
  states: [],
  variants: [],
  sizes: ['sm', 'md', 'lg'],
  props: [
    { name: 'size', type: "'sm' | 'md' | 'lg'", required: false, default: 'md' },
    {
      name: 'label',
      type: 'string',
      required: false,
      default: 'Loading',
      description: 'Accessible label announced by screen readers',
    },
  ],
  tokens: ['--cascade-radius-full'],
  accessibility: {
    role: 'status',
    wcag: 'AA',
    keyboard: [],
  },
  examples: [
    { title: 'Default', code: '<Spinner />' },
    { title: 'Large', code: '<Spinner size="lg" />' },
  ],
  dependencies: ['@cascade-ui/core', '@cascade-ui/i18n'],
  tags: ['loading', 'progress', 'feedback'],
}
