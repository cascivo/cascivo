import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'Card',
  description: 'Container for grouping related content',
  category: 'display',
  clientJs: 'none',
  states: [],
  variants: ['default', 'outlined', 'elevated'],
  sizes: [],
  props: [
    {
      name: 'actions',
      type: 'ReactNode',
      required: false,
      description:
        'CardHeader only — trailing content pinned to the inline-end (overflow menu, badge, link). The header is a column by default, so `justify-content: space-between` alone does nothing; this is how you get the title-left / action-right dashboard card.',
    },
    {
      name: 'variant',
      description:
        '`default` draws a 1px border, `outlined` a heavier one, `elevated` drops the border for a shadow.',
      type: "'default' | 'outlined' | 'elevated'",
      required: false,
      default: 'default',
    },
    {
      name: 'padding',
      description:
        'Inner padding of the CARD BOX. ⚠ `padding="none"` deliberately does NOT strip the ' +
        'padding from CardHeader/CardContent/CardFooter — those keep their own. It means ' +
        '"let a flush child (a LogViewer, an image, an edge-to-edge table) reach the card\'s ' +
        'edge"; zeroing both put the title flush against the border and made the mode ' +
        'unusable with the composition it exists for. For an edge-to-edge table, skip ' +
        'CardContent and pass the table as a direct child.',
      type: "'none' | 'sm' | 'md' | 'lg'",
      required: false,
      default: 'md',
    },
  ],
  tokens: [
    '--cascivo-color-surface',
    '--cascivo-color-border',
    '--cascivo-radius-card',
    '--cascivo-shadow-md',
  ],
  accessibility: { role: 'region', wcag: '2.2-AA', keyboard: [] },
  examples: [
    {
      title: 'Basic card',
      code: `<Card>\n  <CardHeader><CardTitle>Title</CardTitle></CardHeader>\n  <CardContent>Content here</CardContent>\n</Card>`,
    },
  ],
  dependencies: ['@cascivo/core'],
  tags: ['container', 'layout', 'surface'],
  intent: {
    whenToUse: [
      'Grouping related content into a visually distinct surface with border/shadow',
      'Creating scannable units in a grid or list (dashboard tiles, item summaries)',
      'Giving a content cluster elevation to separate it from the page background',
    ],
    whenNotToUse: [
      'Pure semantic/structural grouping with no surface — use a <section>',
      'Wrapping every element in a card — nesting surfaces flattens visual hierarchy',
    ],
    antiPatterns: [
      {
        bad: 'Nesting Cards several levels deep for layout',
        good: 'A single Card with internal spacing, or a plain <section>',
        why: 'Stacked surfaces and shadows compete for attention and muddy the hierarchy',
      },
    ],
    related: [
      {
        name: 'Separator',
        relationship: 'pairs-with',
        reason: 'Use a Separator to divide regions inside a card',
      },
    ],
    a11yRationale:
      'role="region" is appropriate only when the card is a meaningful landmark; otherwise treat it as presentational — the visual surface adds no semantics on its own',
    flexibility: [
      {
        area: 'variant and padding',
        level: 'flexible',
        note: 'Choose elevation and density to fit the surrounding layout',
      },
      {
        area: 'token names',
        level: 'strict',
        note: 'Surface, border, radius, and shadow must resolve to --cascivo-* tokens',
      },
    ],
  },
}
