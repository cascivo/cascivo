import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Code',
  description: 'Inline code span for identifiers, commands, and short snippets',
  category: 'display',
  states: [],
  variants: [],
  sizes: ['sm', 'md'],
  props: [{ name: 'size', type: "'sm' | 'md'", required: false, default: 'md' }],
  tokens: [
    '--cascade-font-mono',
    '--cascade-color-text',
    '--cascade-color-surface',
    '--cascade-color-border',
    '--cascade-radius-indicator',
    '--cascade-text-xs',
    '--cascade-text-sm',
  ],
  accessibility: {
    role: 'code',
    wcag: 'AA',
    keyboard: [],
  },
  examples: [
    { title: 'Default', code: '<Code>npx cascade add button</Code>' },
    {
      title: 'In a sentence',
      code: '<Text>Run <Code>vp check</Code> before committing.</Text>',
      description: 'Sits inline with surrounding text',
    },
    { title: 'Small', code: '<Code size="sm">--cascade-color-accent</Code>' },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['typography', 'code', 'inline', 'mono'],
}
