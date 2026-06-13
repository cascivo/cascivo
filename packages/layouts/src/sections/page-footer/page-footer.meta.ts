import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'PageFooter',
  description:
    'Site footer — AutoGrid of link groups with a brand/meta bottom row. Renders a <footer> element with a <nav aria-label="Footer"> wrapping the link columns.',
  category: 'layout',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'groups',
      type: 'FooterGroup[]',
      required: true,
      description: 'Array of link groups, each with a title and array of {label, href} links',
    },
    {
      name: 'brand',
      type: 'ReactNode',
      required: false,
      description: 'Brand name or logo shown in the bottom row',
    },
    {
      name: 'meta',
      type: 'ReactNode',
      required: false,
      description: 'Meta line in the bottom row (license, copyright, etc.)',
    },
  ],
  tokens: [
    '--cascivo-text-sm',
    '--cascivo-font-mono',
    '--cascivo-font-semibold',
    '--cascivo-text-primary',
    '--cascivo-text-secondary',
    '--cascivo-color-border',
    '--cascivo-color-accent',
    '--cascivo-space-*',
  ],
  accessibility: { role: 'contentinfo', wcag: '2.1-AA', keyboard: [] },
  examples: [
    {
      title: 'Site footer',
      code: `<PageFooter
  brand="Cascade"
  meta="MIT licensed. Built with care."
  groups={[
    { title: 'Product', links: [{ label: 'Components', href: '/components' }, { label: 'Charts', href: '/charts' }, { label: 'Layouts', href: '/layouts' }] },
    { title: 'Developers', links: [{ label: 'Docs', href: '/docs' }, { label: 'GitHub', href: 'https://github.com/urbanisierung/cascivo' }, { label: 'Changelog', href: '/changelog' }] },
    { title: 'Resources', links: [{ label: 'Figma kit', href: '/figma' }, { label: 'Storybook', href: '/storybook' }] },
  ]}
/>`,
      description: 'Three-column footer with brand and license meta',
    },
  ],
  dependencies: ['@cascivo/core'],
  tags: ['section', 'footer', 'navigation'],
  intent: {
    whenToUse: [
      'A site footer with grouped link columns and a brand/meta bottom row',
      'Closing marketing or app pages with secondary navigation',
    ],
    whenNotToUse: [
      'Primary top navigation — use AppShell or a header',
      'A conversion prompt — use Cta',
    ],
    antiPatterns: [],
    related: [
      {
        name: 'AutoGrid',
        relationship: 'contains',
        reason: 'Uses an auto-fit grid to lay out link groups',
      },
    ],
    a11yRationale: 'Renders a footer element wrapping a labeled Footer navigation region.',
    flexibility: [],
  },
}
