import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'Tile',
  description:
    'A selectable card with radio (single) or checkbox (multi) semantics, toggled by click or keyboard',
  category: 'inputs',
  states: ['default', 'selected', 'focus', 'disabled'],
  variants: ['single', 'multi'],
  sizes: [],
  props: [],
  tokens: [
    '--cascivo-color-bg',
    '--cascivo-color-border',
    '--cascivo-color-border-strong',
    '--cascivo-color-accent',
    '--cascivo-color-text',
    '--cascivo-color-text-muted',
    '--cascivo-radius-surface',
    '--cascivo-focus-ring',
  ],
  accessibility: {
    role: 'radio',
    wcag: '2.2-AA',
    keyboard: ['Enter', 'Space'],
  },
  examples: [],
  dependencies: ['@cascivo/core'],
  tags: ['inputs', 'tile', 'card', 'selectable', 'choice'],
  intent: {
    whenToUse: [
      'A visually rich, clickable choice card in a single- or multi-select group',
      'Plan/option pickers where each option needs an icon and supporting content',
      'A larger touch target than a plain radio or checkbox',
    ],
    whenNotToUse: [
      'A simple inline boolean — use Checkbox or Toggle',
      'A dense list of text-only options — use RadioGroup or a Select',
    ],
    antiPatterns: [
      {
        bad: '<Tile value="on">Enable</Tile> // used as a standalone on/off control',
        good: '<Tile value="on" selectable="multi">Enable</Tile> // multi allows deselect',
        why: 'Single (radio) tiles cannot be unselected by clicking; use multi for toggleable behavior',
      },
    ],
    related: [
      {
        name: 'RadioCard',
        relationship: 'alternative',
        reason:
          'RadioCard wraps a native input in a group; Tile is a standalone ARIA radio/checkbox',
      },
      {
        name: 'CheckboxCard',
        relationship: 'alternative',
        reason: 'Use CheckboxCard when native checkbox form semantics are required',
      },
    ],
    a11yRationale:
      'Exposes role="radio" (single) or role="checkbox" (multi) with aria-checked reflecting selection, is focusable, and toggles on Space/Enter. aria-disabled and a -1 tabindex remove disabled tiles from interaction.',
    flexibility: [
      {
        area: 'selectable',
        level: 'strict',
        note: 'single (radio, select-only) | multi (checkbox, toggle)',
      },
      {
        area: 'selected state',
        level: 'flexible',
        note: 'Controlled (selected/onSelect) or uncontrolled (defaultSelected)',
      },
      {
        area: 'element',
        level: 'flexible',
        note: 'asChild renders onto a custom element via Slot',
      },
    ],
  },
}
