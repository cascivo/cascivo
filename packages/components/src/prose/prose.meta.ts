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
  intent: {
    whenToUse: [
      'Styling long-form authored content (articles, docs, CMS output)',
      'Applying readable typography to raw HTML you do not control (markdown pipelines)',
      'Getting consistent spacing for headings, lists, code, and quotes in one wrapper',
    ],
    whenNotToUse: [
      'Single typographic elements in app UI — use Heading, Text, or List directly',
      'Interactive component layouts — Prose only styles flow content',
    ],
    antiPatterns: [
      {
        bad: 'Wrapping app UI (buttons, forms) in <Prose> for spacing',
        good: 'Use layout primitives; reserve Prose for authored document content',
        why: 'Prose restyles all descendant HTML, which clobbers component styling and intent',
      },
    ],
    related: [
      {
        name: 'Heading',
        relationship: 'alternative',
        reason: 'Use Heading/Text directly in app UI; Prose handles authored content',
      },
    ],
    a11yRationale:
      'Adds no roles of its own — it styles descendant native elements, so the document semantics of the underlying HTML (headings, lists, code) are preserved for assistive tech',
    content: {
      tone: 'Long-form editorial; the wrapper does not constrain voice',
      notes: 'Source HTML should be sanitized before dangerouslySetInnerHTML',
    },
    flexibility: [
      {
        area: 'source HTML',
        level: 'flexible',
        note: 'Accepts authored children or rendered markup',
      },
      {
        area: 'token names',
        level: 'strict',
        note: 'All typography and surface styling resolves to --cascade-* tokens',
      },
    ],
  },
}
