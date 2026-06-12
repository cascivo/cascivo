import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Heading',
  description: 'Section heading with semantic level decoupled from visual size',
  category: 'display',
  states: [],
  variants: [],
  sizes: ['sm', 'md', 'lg', 'xl', '2xl'],
  props: [
    { name: 'level', type: '1 | 2 | 3 | 4 | 5 | 6', required: false, default: '2' },
    {
      name: 'size',
      type: "'sm' | 'md' | 'lg' | 'xl' | '2xl'",
      required: false,
      default: 'derived from level (1→2xl, 2→xl, 3→lg, 4→md, 5→sm, 6→sm)',
    },
  ],
  tokens: [
    '--cascade-font-sans',
    '--cascade-font-semibold',
    '--cascade-leading-tight',
    '--cascade-tracking-tight',
    '--cascade-color-text',
    '--cascade-text-base',
    '--cascade-text-lg',
    '--cascade-text-xl',
    '--cascade-text-2xl',
    '--cascade-text-3xl',
  ],
  accessibility: {
    role: 'heading',
    wcag: 'AA',
    keyboard: [],
  },
  examples: [
    { title: 'Default', code: '<Heading>Section title</Heading>' },
    { title: 'Page title', code: '<Heading level={1}>Page title</Heading>' },
    {
      title: 'Decoupled size',
      code: '<Heading level={2} size="2xl">Visually large, semantically h2</Heading>',
      description: 'Keep the document outline correct while controlling the visual scale',
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['typography', 'heading', 'title'],
}
