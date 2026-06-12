import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Cta',
  description:
    'Call-to-action band — quiet hairline-bordered section with title, description, and centered actions. Replace demo content before shipping.',
  category: 'layout',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'title',
      type: 'ReactNode',
      required: true,
      description: 'Primary heading of the CTA band',
    },
    {
      name: 'description',
      type: 'ReactNode',
      required: false,
      description: 'Supporting text below the title',
    },
    {
      name: 'actions',
      type: 'ReactNode',
      required: false,
      description: 'Buttons or links centered below the description',
    },
    {
      name: 'headingLevel',
      type: '1 | 2 | 3',
      required: false,
      default: '2',
      description: 'HTML heading level for document outline control',
    },
  ],
  tokens: [
    '--cascade-color-border',
    '--cascade-surface-subtle',
    '--cascade-text-2xl',
    '--cascade-text-base',
    '--cascade-font-bold',
    '--cascade-text-secondary',
    '--cascade-space-*',
  ],
  accessibility: { role: 'region', wcag: 'AA', keyboard: [] },
  examples: [
    {
      title: 'CTA band',
      code: '<Cta title="Ready to ship?" description="Add Cascade to your project in minutes." actions={<><Button>Get started</Button><Button variant="ghost">View on GitHub</Button></>} />',
      description: 'Quiet bordered band with centered heading, description, and action buttons',
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['section', 'cta', 'marketing'],
}
