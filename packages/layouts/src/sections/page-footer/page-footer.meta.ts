import type { ComponentMeta } from '@cascade-ui/core'

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
    '--cascade-text-sm',
    '--cascade-font-mono',
    '--cascade-font-semibold',
    '--cascade-text-primary',
    '--cascade-text-secondary',
    '--cascade-color-border',
    '--cascade-color-accent',
    '--cascade-space-*',
  ],
  accessibility: { role: 'contentinfo', wcag: 'AA', keyboard: [] },
  examples: [
    {
      title: 'Site footer',
      code: `<PageFooter
  brand="Cascade"
  meta="MIT licensed. Built with care."
  groups={[
    { title: 'Product', links: [{ label: 'Components', href: '/components' }, { label: 'Charts', href: '/charts' }, { label: 'Layouts', href: '/layouts' }] },
    { title: 'Developers', links: [{ label: 'Docs', href: '/docs' }, { label: 'GitHub', href: 'https://github.com/urbanisierung/cascade-ui' }, { label: 'Changelog', href: '/changelog' }] },
    { title: 'Resources', links: [{ label: 'Figma kit', href: '/figma' }, { label: 'Storybook', href: '/storybook' }] },
  ]}
/>`,
      description: 'Three-column footer with brand and license meta',
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['section', 'footer', 'navigation'],
}
