import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'StatsBand',
  description:
    'KPI strip — horizontal band of stats with optional delta and inline sparkline trend. Wraps via AutoGrid on narrow containers. No visible heading; provide aria-label for accessibility.',
  category: 'layout',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'stats',
      type: 'StatItem[]',
      required: true,
      description:
        'Array of stat items: label, value, optional delta (e.g. "+3.2%"), optional trend numbers for sparkline',
    },
    {
      name: 'aria-label',
      type: 'string',
      required: false,
      default: '"Key metrics"',
      description: 'Accessible label for the stats region',
    },
  ],
  tokens: [
    '--cascade-text-2xl',
    '--cascade-text-sm',
    '--cascade-font-bold',
    '--cascade-font-mono',
    '--cascade-text-secondary',
    '--cascade-color-border',
    '--cascade-surface-subtle',
    '--cascade-space-*',
  ],
  accessibility: { role: 'region', wcag: 'AA', keyboard: [] },
  examples: [
    {
      title: 'KPI band with trends',
      code: `<StatsBand
  aria-label="Performance metrics"
  stats={[
    { label: 'p99 latency', value: '184 ms', delta: '-12 ms', trend: [210, 205, 198, 192, 184] },
    { label: 'Error rate', value: '0.12%', delta: '-0.03%', trend: [0.18, 0.16, 0.15, 0.14, 0.12] },
    { label: 'Uptime', value: '99.98%', trend: [99.95, 99.97, 99.98, 99.99, 99.98] },
    { label: 'Deploys today', value: '7' },
  ]}
/>`,
      description: 'Four KPI cells — three with sparkline trends and signed deltas',
    },
  ],
  dependencies: ['@cascade-ui/core', '@cascade-ui/charts'],
  tags: ['section', 'stats', 'kpi', 'charts'],
}
