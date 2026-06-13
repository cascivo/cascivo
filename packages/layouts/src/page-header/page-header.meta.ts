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
  intent: {
    whenToUse: [
      'A page-level header with title, description, breadcrumb, and action slots',
      'Establishing consistent page tops across an application',
    ],
    whenNotToUse: [
      'A marketing hero with large media — use Hero',
      'A full app top bar with navigation — use AppShell',
    ],
    antiPatterns: [],
    related: [
      {
        name: 'Hero',
        relationship: 'alternative',
        reason: 'Use the marketing hero for landing-page tops',
      },
      {
        name: 'Section',
        relationship: 'pairs-with',
        reason: 'Place sections below the header to build out the page',
      },
    ],
    a11yRationale:
      'Renders a header region with a top-level heading for screen reader page structure.',
    flexibility: [],
  },
}
