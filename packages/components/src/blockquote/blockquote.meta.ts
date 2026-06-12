import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Blockquote',
  description: 'Quoted passage with optional attribution footer',
  category: 'display',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'cite',
      type: 'string',
      required: false,
      default: 'undefined',
    },
  ],
  tokens: [
    '--cascade-color-border-strong',
    '--cascade-color-text',
    '--cascade-color-text-subtle',
    '--cascade-font-sans',
    '--cascade-font-medium',
    '--cascade-leading-relaxed',
    '--cascade-text-sm',
    '--cascade-text-base',
  ],
  accessibility: {
    role: 'blockquote',
    wcag: 'AA',
    keyboard: [],
  },
  examples: [
    { title: 'Default', code: '<Blockquote>Less, but better.</Blockquote>' },
    {
      title: 'With attribution',
      code: '<Blockquote cite="Dieter Rams">Less, but better.</Blockquote>',
      description: 'Attribution renders as <footer><cite>',
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['typography', 'quote', 'blockquote', 'citation'],
}
