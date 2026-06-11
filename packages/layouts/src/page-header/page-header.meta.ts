import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'PageHeader',
  description: 'Page-level header with title, description, breadcrumb, and actions slots.',
  category: 'layout',
  states: [],
  variants: [],
  sizes: [],
  props: [
    { name: 'title', type: 'string', required: true, description: 'Page title' },
    { name: 'description', type: 'string', required: false, description: 'Supporting description' },
    { name: 'breadcrumb', type: 'ReactNode', required: false, description: 'Breadcrumb slot' },
    { name: 'actions', type: 'ReactNode', required: false, description: 'Action buttons slot' },
    { name: 'className', type: 'string', required: false, description: 'Additional CSS class' },
  ],
  tokens: [
    '--cascade-space-2',
    '--cascade-space-4',
    '--cascade-font-size-2xl',
    '--cascade-font-weight-bold',
    '--cascade-color-text',
    '--cascade-color-text-muted',
    '--cascade-font-size-sm',
  ],
  accessibility: { role: 'banner', wcag: 'AA', keyboard: [] },
  examples: [
    {
      title: 'Basic',
      code: '<PageHeader title="Dashboard" description="Welcome back" />',
      description: 'Title with description',
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['layout', 'header', 'page'],
}
