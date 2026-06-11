import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'DashboardLayout',
  description: 'Dashboard page layout with stats strip, main content area, and optional aside.',
  category: 'layout',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'stats',
      type: 'ReactNode',
      required: false,
      description: 'Stats/KPI row (auto-fit grid)',
    },
    { name: 'main', type: 'ReactNode', required: true, description: 'Main content area' },
    {
      name: 'aside',
      type: 'ReactNode',
      required: false,
      description: 'Optional aside panel (20rem)',
    },
  ],
  tokens: ['--cascade-space-4', '--cascade-space-6'],
  accessibility: { role: 'generic', wcag: 'AA', keyboard: [] },
  examples: [
    {
      title: 'With stats',
      code: '<DashboardLayout stats={<div>KPIs</div>} main={<div>Content</div>} />',
      description: 'Stats + main layout',
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['layout', 'dashboard', 'page'],
}
