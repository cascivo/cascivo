import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Dropdown',
  description: 'Menu of actions revealed from a trigger',
  category: 'overlay',
  states: ['closed', 'open'],
  variants: [],
  sizes: [],
  props: [
    { name: 'trigger', type: 'ReactElement', required: true },
    {
      name: 'items',
      type: '{ label: string; value: string; icon?: ReactNode; disabled?: boolean; separator?: boolean }[]',
      required: true,
    },
    { name: 'onSelect', type: '(value: string) => void', required: false },
    {
      name: 'placement',
      type: "'bottom-start' | 'bottom-end'",
      required: false,
      default: 'bottom-start',
    },
    { name: 'open', type: 'boolean', required: false },
    { name: 'onOpenChange', type: '(open: boolean) => void', required: false },
  ],
  tokens: [
    '--cascade-color-surface-overlay',
    '--cascade-color-border',
    '--cascade-color-bg-subtle',
    '--cascade-radius-md',
    '--cascade-z-dropdown',
  ],
  accessibility: {
    role: 'menu',
    wcag: 'AA',
    keyboard: ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', 'Space', 'Escape'],
  },
  examples: [
    {
      title: 'Basic',
      code: '<Dropdown trigger={<Button>Actions</Button>} items={[{ label: "Edit", value: "edit" }]} onSelect={handle} />',
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['overlay', 'menu', 'actions'],
}
