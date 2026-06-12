import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Status',
  description: 'Colored dot with a label communicating the state of a system or entity',
  category: 'display',
  states: [],
  variants: ['success', 'warning', 'error', 'info', 'neutral'],
  sizes: [],
  props: [
    {
      name: 'status',
      type: "'success' | 'warning' | 'error' | 'info' | 'neutral'",
      required: false,
      default: 'neutral',
    },
    {
      name: 'pulse',
      type: 'boolean',
      required: false,
      default: 'false',
      description: 'Pulses the dot — gated behind prefers-reduced-motion: no-preference',
    },
  ],
  tokens: [
    '--cascade-color-success',
    '--cascade-color-warning',
    '--cascade-color-error',
    '--cascade-color-info',
    '--cascade-color-text-muted',
    '--cascade-color-text',
    '--cascade-radius-full',
  ],
  accessibility: {
    role: 'none',
    wcag: 'AA',
    keyboard: [],
  },
  examples: [
    { title: 'Default', code: '<Status>Unknown</Status>' },
    { title: 'Success', code: '<Status status="success">Operational</Status>' },
    {
      title: 'Pulsing',
      code: '<Status status="info" pulse>Deploying</Status>',
      description: 'The pulse animation respects prefers-reduced-motion',
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['status', 'indicator', 'dot', 'badge'],
}
