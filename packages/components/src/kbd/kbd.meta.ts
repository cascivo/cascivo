import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Kbd',
  description: 'Displays a keyboard key or shortcut',
  category: 'display',
  states: [],
  variants: [],
  sizes: ['sm', 'md'],
  props: [
    { name: 'size', type: "'sm' | 'md'", required: false, default: 'md' },
  ],
  tokens: [
    '--cascade-color-text-subtle',
    '--cascade-color-surface-raised',
    '--cascade-color-border',
    '--cascade-color-border-strong',
    '--cascade-radius-sm',
  ],
  accessibility: {
    role: 'kbd',
    wcag: 'AA',
    keyboard: [],
  },
  examples: [
    { title: 'Single key', code: '<Kbd>⌘</Kbd>' },
    {
      title: 'Shortcut',
      code: '<span><Kbd>⌘</Kbd> + <Kbd>K</Kbd></span>',
      description: 'Compose multiple keys to show a shortcut',
    },
    { title: 'Small', code: '<Kbd size="sm">Esc</Kbd>' },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['keyboard', 'shortcut', 'hotkey'],
}
