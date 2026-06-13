import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'SettingsFormPage',
  description: 'Settings page with profile form inside a two-column settings layout.',
  category: 'display',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'onSave',
      type: '(values: SettingsValues) => void',
      required: false,
      description: 'Called with valid form values on submit',
    },
  ],
  tokens: [],
  accessibility: { role: 'generic', wcag: 'AA', keyboard: [] },
  examples: [{ title: 'Default', code: '<SettingsFormPage />', description: 'Settings form page' }],
  dependencies: ['@cascade-ui/react', 'layout/settings-layout'],
  tags: ['block', 'settings', 'form', 'page'],
  intent: {
    whenToUse: [
      'A settings page with a profile form inside a two-column settings layout',
      'Account or preferences pages with a save action',
    ],
    whenNotToUse: [
      'You only need the layout frame — use SettingsLayout',
      'A focused single-field edit — use an inline form',
    ],
    antiPatterns: [],
    related: [
      {
        name: 'SettingsLayout',
        relationship: 'contained-by',
        reason: 'Composes the two-column settings layout',
      },
    ],
    a11yRationale:
      'Form fields are labeled and validation messages are associated for screen readers.',
    flexibility: [],
  },
}
