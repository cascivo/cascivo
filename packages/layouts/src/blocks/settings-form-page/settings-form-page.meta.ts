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
}
