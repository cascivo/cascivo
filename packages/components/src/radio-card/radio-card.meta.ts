import type { ComponentMeta } from '@cascivo/core'

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
    '--cascivo-color-accent',
    '--cascivo-color-border',
    '--cascivo-radius-surface',
    '--cascivo-color-active-bg',
  ],
  accessibility: {
    role: 'radiogroup',
    wcag: '2.2-AA',
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
  dependencies: ['@cascivo/core'],
  tags: ['radio', 'card', 'selectable', 'form'],
  intent: {
    whenToUse: [
      'Single-select from a few options where each choice needs a title plus supporting description (plans, tiers, shipping methods)',
      'Selection UIs where a larger, more prominent click target improves clarity over a plain radio',
    ],
    whenNotToUse: [
      'Plain text options with no description — use Radio for a lighter footprint',
      'A compact inline switch between a few modes — use SegmentedControl',
      'Too many options to render as cards — use Select',
    ],
    antiPatterns: [
      {
        bad: '<RadioCard ... /> rendered standalone without RadioCardGroup',
        good: '<RadioCardGroup name="plan" label="Plan"><RadioCard value="pro" title="Pro" /></RadioCardGroup>',
        why: 'RadioCard reads its name, selected value, and change handler from RadioCardGroup context; outside a group it has no shared name and cannot enforce single-selection',
      },
    ],
    related: [
      {
        name: 'Radio',
        relationship: 'alternative',
        reason: 'Use for plain text options without descriptions',
      },
      {
        name: 'CheckboxCard',
        relationship: 'alternative',
        reason: 'Use the card pattern when multiple selections are allowed',
      },
      {
        name: 'SegmentedControl',
        relationship: 'alternative',
        reason: 'Use for a compact inline single choice',
      },
    ],
    a11yRationale:
      'Each card is a <label> wrapping a native <input type="radio"> and RadioCardGroup applies role="radiogroup" with an aria-label, so selection, arrow-key navigation, and label association come from the platform rather than custom click handling.',
    flexibility: [
      {
        area: 'token names',
        level: 'strict',
        note: 'Card and indicator styling must resolve to the listed --cascivo-* tokens',
      },
      {
        area: 'title and description',
        level: 'flexible',
        note: 'title and description accept arbitrary ReactNode content',
      },
    ],
  },
}
