import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'CheckboxCard',
  description:
    'Multi-selectable card backed by a native checkbox. Use multiple independent CheckboxCards for multi-select scenarios.',
  category: 'inputs',
  states: ['default', 'checked', 'disabled'],
  variants: [],
  sizes: [],
  props: [
    { name: 'title', type: 'ReactNode', required: true, description: 'Card title' },
    {
      name: 'description',
      type: 'ReactNode',
      required: false,
      description: 'Optional description',
    },
    { name: 'checked', type: 'boolean', required: false, description: 'Controlled checked state' },
    {
      name: 'defaultChecked',
      type: 'boolean',
      required: false,
      description: 'Uncontrolled default',
    },
    {
      name: 'onCheckedChange',
      type: '(checked: boolean) => void',
      required: false,
      description: 'Change callback',
    },
    { name: 'disabled', type: 'boolean', required: false, description: 'Disables the card' },
  ],
  tokens: ['--cascade-color-accent', '--cascade-color-border', '--cascade-radius-surface'],
  accessibility: {
    role: 'checkbox',
    wcag: 'AA',
    keyboard: ['Space'],
  },
  examples: [
    {
      title: 'Feature toggles',
      code: `<div style={{ display: 'grid', gap: 12 }}>
  <CheckboxCard title="Automated backups" description="Daily snapshots, 30-day retention" defaultChecked />
  <CheckboxCard title="Monitoring" description="Metrics + alerting" />
  <CheckboxCard title="Audit log" description="Requires Team plan" disabled />
</div>`,
      description: 'Multi-select feature toggles',
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['checkbox', 'card', 'selectable', 'form'],
}
