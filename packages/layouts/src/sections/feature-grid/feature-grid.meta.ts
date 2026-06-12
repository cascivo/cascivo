import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'FeatureGrid',
  description:
    'Feature section — AutoGrid of items with optional title, description, and icon slots. Icons are optional; the grid works text-only. Replace demo content before shipping.',
  category: 'layout',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'items',
      type: 'FeatureItem[]',
      required: true,
      description: 'Array of feature items with title, optional description, icon, and href',
    },
    {
      name: 'title',
      type: 'ReactNode',
      required: false,
      description: 'Section heading above the grid',
    },
    {
      name: 'description',
      type: 'ReactNode',
      required: false,
      description: 'Subheading below the section title',
    },
    {
      name: 'headingLevel',
      type: '1 | 2 | 3',
      required: false,
      default: '2',
      description: 'Heading level for the section title (items use headingLevel + 1)',
    },
    {
      name: 'min',
      type: 'string',
      required: false,
      default: '"16rem"',
      description: 'Minimum track width forwarded to AutoGrid',
    },
  ],
  tokens: [
    '--cascade-text-2xl',
    '--cascade-text-base',
    '--cascade-text-sm',
    '--cascade-font-bold',
    '--cascade-font-semibold',
    '--cascade-text-secondary',
    '--cascade-color-border',
    '--cascade-surface-subtle',
    '--cascade-space-*',
  ],
  accessibility: { role: 'region', wcag: 'AA', keyboard: [] },
  examples: [
    {
      title: 'Feature grid (text-only)',
      code: `<FeatureGrid
  title="Built for production"
  description="Everything you need to ship a polished product."
  items={[
    { title: 'Zero config', description: 'Copy a component and it works — no providers, no wrappers.' },
    { title: 'Token-first', description: 'Every color, size and radius is a CSS custom property you own.' },
    { title: 'Signal-driven', description: 'Fine-grained reactivity with @preact/signals-react — zero re-renders.' },
    { title: 'Accessible by default', description: 'WCAG 2.1 AA, keyboard navigable, logical CSS properties for RTL.' },
  ]}
/>`,
      description: 'Four-item text-only feature grid with section heading',
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['section', 'features', 'grid'],
}
