import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Breadcrumb',
  description: 'Shows the current page location within a navigation hierarchy',
  category: 'navigation',
  states: [],
  variants: [],
  sizes: [],
  props: [
    { name: 'items', type: '{ label: string; href?: string }[]', required: true },
    {
      name: 'maxVisible',
      type: 'number',
      required: false,
      description:
        'When items exceed this count, collapse to the first item, an ellipsis, and the trailing items',
    },
    { name: 'className', type: 'string', required: false },
    { name: 'ariaLabel', type: 'string', required: false, default: 'Breadcrumb' },
  ],
  tokens: [
    '--cascade-color-text',
    '--cascade-color-text-muted',
    '--cascade-color-text-subtle',
    '--cascade-radius-sm',
    '--cascade-focus-ring',
  ],
  accessibility: {
    role: 'navigation',
    wcag: 'AA',
    keyboard: ['Tab', 'Enter'],
  },
  examples: [
    {
      title: 'Basic',
      code: "<Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Docs', href: '/docs' }, { label: 'Breadcrumb' }]} />",
    },
    {
      title: 'Collapsed',
      code: "<Breadcrumb maxVisible={3} items={[{ label: 'Home', href: '/' }, { label: 'Docs', href: '/docs' }, { label: 'Components', href: '/docs/components' }, { label: 'Breadcrumb' }]} />",
      description: 'Long trails collapse to the first item, an ellipsis, and the trailing items.',
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['breadcrumb', 'navigation', 'hierarchy'],
}
