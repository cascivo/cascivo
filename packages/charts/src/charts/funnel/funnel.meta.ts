import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'Funnel',
  description:
    'Vertical conversion funnel — each stage is a trapezoid narrowing toward the next, with optional conversion labels.',
  category: 'chart',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'data',
      type: 'FunnelStage[]',
      required: true,
      description: 'Ordered stages (descending): { id, label, value, color? }.',
    },
    {
      name: 'title',
      type: 'string',
      required: true,
      description: 'Chart title (also used as aria-label).',
    },
    {
      name: 'description',
      type: 'string',
      required: false,
      description: 'Subtitle below the title.',
    },
    { name: 'width', type: 'number', required: false },
    { name: 'height', type: 'number', required: false, default: '320' },
    {
      name: 'showConversion',
      type: 'boolean',
      required: false,
      default: 'false',
      description: 'Append each stage’s % of the first stage to its label.',
    },
    { name: 'tooltip', type: 'boolean', required: false, description: 'Enable hover tooltip.' },
    { name: 'className', type: 'string', required: false },
    {
      name: 'plain',
      type: 'boolean',
      required: false,
      default: 'false',
      description: 'Marks only — no labels. For micro/inline charts.',
    },
  ],
  tokens: [
    '--cascivo-chart-1',
    '--cascivo-chart-2',
    '--cascivo-chart-3',
    '--cascivo-chart-4',
    '--cascivo-chart-5',
    '--cascivo-chart-6',
    '--cascivo-chart-7',
    '--cascivo-chart-8',
  ],
  accessibility: {
    role: 'img',
    wcag: '2.1-AA',
    keyboard: [
      'Tab (focus chart)',
      'ArrowLeft/ArrowRight (navigate stages)',
      'Escape (clear focus)',
    ],
  },
  examples: [
    {
      title: 'Signup conversion funnel',
      code: `import { Funnel } from '@cascivo/charts'

<Funnel
  title="Signup funnel"
  showConversion
  data={[
    { id: 'visit', label: 'Visited', value: 8200 },
    { id: 'signup', label: 'Signed up', value: 3100 },
    { id: 'active', label: 'Activated', value: 1400 },
    { id: 'paid', label: 'Paid', value: 520 },
  ]}
/>`,
    },
  ],
  dependencies: ['@cascivo/charts'],
  tags: ['chart', 'funnel', 'conversion', 'flow', 'data-viz'],
  intent: {
    whenToUse: [
      'Showing drop-off across the ordered stages of a process (signup, checkout)',
      'Communicating stage-to-stage conversion at a glance',
    ],
    whenNotToUse: [
      'Stages are not strictly decreasing — use BarChart',
      'Showing a trend over time — use LineChart',
    ],
    antiPatterns: [],
    related: [
      {
        name: 'BarChart',
        relationship: 'alternative',
        reason: 'Use when stages aren’t monotonically decreasing',
      },
    ],
    a11yRationale: 'Renders with role="img" and requires a title prop for screen reader labeling.',
    flexibility: [],
  },
}
