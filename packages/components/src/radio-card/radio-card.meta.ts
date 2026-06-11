import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'RadioCard',
  description:
    'Selectable card backed by a native radio input. Use RadioCardGroup for single-select groups.',
  category: 'inputs',
  states: ['default', 'checked', 'disabled'],
  variants: [],
  sizes: [],
  props: [
    { name: 'value', type: 'string', required: true, description: 'Radio value' },
    { name: 'title', type: 'ReactNode', required: true, description: 'Card title' },
    {
      name: 'description',
      type: 'ReactNode',
      required: false,
      description: 'Optional description',
    },
    { name: 'disabled', type: 'boolean', required: false, description: 'Disables the card' },
  ],
  tokens: [
    '--cascade-color-accent',
    '--cascade-color-border',
    '--cascade-radius-surface',
    '--cascade-color-active-bg',
  ],
  accessibility: {
    role: 'radiogroup',
    wcag: 'AA',
    keyboard: ['ArrowDown', 'ArrowUp', 'Space'],
  },
  examples: [
    {
      title: 'Plan selector',
      code: `<RadioCardGroup name="plan" defaultValue="pro" label="Plan">
  <RadioCard value="free" title="Free" description="For hobbyists" />
  <RadioCard value="pro" title="Pro" description="For professionals" />
  <RadioCard value="team" title="Team" description="For teams" />
</RadioCardGroup>`,
      description: 'Single-select plan picker',
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['radio', 'card', 'selectable', 'form'],
}
