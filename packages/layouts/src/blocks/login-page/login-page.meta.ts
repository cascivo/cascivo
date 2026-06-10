import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'LoginPage',
  description: 'Authentication login page with email and password form.',
  category: 'display',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'onSubmit',
      type: '(values: LoginValues) => void',
      required: false,
      description: 'Called with valid form values on submit',
    },
  ],
  tokens: [],
  accessibility: { role: 'generic', wcag: 'AA', keyboard: [] },
  examples: [{ title: 'Default', code: '<LoginPage />', description: 'Login page' }],
  dependencies: ['@cascade-ui/react', 'layout/auth-layout'],
  tags: ['block', 'login', 'auth', 'form', 'page'],
}
