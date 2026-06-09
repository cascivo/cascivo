import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Card',
  description: 'Container for grouping related content',
  category: 'display',
  states: [],
  variants: ['default', 'outlined', 'elevated'],
  sizes: [],
  props: [
    {
      name: 'variant',
      type: "'default' | 'outlined' | 'elevated'",
      required: false,
      default: 'default',
    },
    { name: 'padding', type: "'none' | 'sm' | 'md' | 'lg'", required: false, default: 'md' },
  ],
  tokens: [
    '--cascade-color-surface',
    '--cascade-color-border',
    '--cascade-radius-card',
    '--cascade-shadow-md',
  ],
  accessibility: { role: 'region', wcag: 'AA', keyboard: [] },
  examples: [
    {
      title: 'Basic card',
      code: `<Card>\n  <CardHeader><CardTitle>Title</CardTitle></CardHeader>\n  <CardContent>Content here</CardContent>\n</Card>`,
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['container', 'layout', 'surface'],
}
