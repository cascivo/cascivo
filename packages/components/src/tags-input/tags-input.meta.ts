import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'TagsInput',
  description: 'Free-form multi-value chip input',
  category: 'inputs',
  states: ['idle', 'focused', 'disabled'],
  variants: [],
  sizes: [],
  props: [
    { name: 'value', type: 'string[]', required: true },
    { name: 'onValueChange', type: '(v: string[]) => void', required: true },
    { name: 'placeholder', type: 'string', required: false },
    { name: 'validate', type: '(tag: string) => boolean', required: false },
    { name: 'max', type: 'number', required: false },
    { name: 'disabled', type: 'boolean', required: false, default: 'false' },
  ],
  tokens: [
    '--cascade-color-surface',
    '--cascade-color-border',
    '--cascade-color-accent',
    '--cascade-color-destructive',
    '--cascade-color-bg-subtle',
    '--cascade-radius-input',
    '--cascade-radius-full',
    '--cascade-focus-ring',
  ],
  accessibility: {
    role: 'textbox',
    wcag: 'AA',
    keyboard: ['Enter', ',', 'Backspace'],
  },
  examples: [
    {
      title: 'Basic',
      code: `<TagsInput value={['react', 'vue']} onValueChange={() => {}} placeholder="Add tag…" />`,
    },
  ],
  dependencies: ['@cascade-ui/core', '@cascade-ui/i18n'],
  tags: ['form', 'tags', 'chips', 'multi', 'input'],
}
