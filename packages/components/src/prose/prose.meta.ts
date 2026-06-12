import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Prose',
  description: 'Wrapper that styles raw descendant HTML — headings, lists, code, quotes, tables',
  category: 'display',
  states: [],
  variants: [],
  sizes: [],
  props: [],
  tokens: [
    '--cascade-font-sans',
    '--cascade-font-mono',
    '--cascade-font-semibold',
    '--cascade-leading-tight',
    '--cascade-leading-relaxed',
    '--cascade-tracking-tight',
    '--cascade-color-text',
    '--cascade-color-text-subtle',
    '--cascade-color-accent',
    '--cascade-color-accent-hover',
    '--cascade-color-surface',
    '--cascade-color-border',
    '--cascade-color-border-strong',
    '--cascade-radius-indicator',
    '--cascade-radius-surface',
  ],
  accessibility: {
    role: 'generic',
    wcag: 'AA',
    keyboard: [],
  },
  examples: [
    {
      title: 'Authored content',
      code: '<Prose><h2>Install</h2><p>Run <code>npx cascade init</code>.</p></Prose>',
    },
    {
      title: 'Rendered markdown',
      code: '<Prose dangerouslySetInnerHTML={{ __html: html }} />',
      description: 'The use case: HTML you do not control (CMS, markdown pipelines)',
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['typography', 'prose', 'content', 'markdown', 'article'],
}
