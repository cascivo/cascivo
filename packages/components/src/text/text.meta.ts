import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Text',
  description: 'Body text with size, weight, and muted variants',
  category: 'display',
  states: [],
  variants: ['normal', 'medium', 'semibold'],
  sizes: ['sm', 'md', 'lg'],
  props: [
    { name: 'as', type: "'p' | 'span' | 'div'", required: false, default: 'p' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", required: false, default: 'md' },
    {
      name: 'weight',
      type: "'normal' | 'medium' | 'semibold'",
      required: false,
      default: 'normal',
    },
    { name: 'muted', type: 'boolean', required: false, default: 'false' },
  ],
  tokens: [
    '--cascade-font-sans',
    '--cascade-font-normal',
    '--cascade-font-medium',
    '--cascade-font-semibold',
    '--cascade-leading-normal',
    '--cascade-color-text',
    '--cascade-color-text-subtle',
    '--cascade-text-sm',
    '--cascade-text-base',
    '--cascade-text-lg',
  ],
  accessibility: {
    role: 'paragraph',
    wcag: 'AA',
    keyboard: [],
  },
  examples: [
    { title: 'Default', code: '<Text>Body copy reads at the base size.</Text>' },
    { title: 'Muted helper', code: '<Text size="sm" muted>Secondary information</Text>' },
    {
      title: 'Inline span',
      code: '<Text as="span" weight="semibold">emphasis</Text>',
      description: 'Use as="span" inside other flow content',
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['typography', 'text', 'paragraph', 'body'],
}
