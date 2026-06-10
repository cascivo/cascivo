import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'OverflowMenu',
  description: 'Kebab icon button revealing a menu of row-level actions',
  category: 'overlay',
  states: ['closed', 'open'],
  variants: [],
  sizes: ['sm', 'md'],
  props: [
    {
      name: 'items',
      type: '{ label: string; value: string; icon?: ReactNode; disabled?: boolean; destructive?: boolean }[]',
      required: true,
    },
    { name: 'onSelect', type: '(value: string) => void', required: false },
    {
      name: 'placement',
      type: "'bottom-start' | 'bottom-end'",
      required: false,
      default: 'bottom-end',
    },
    { name: 'ariaLabel', type: 'string', required: false, default: 'More actions' },
    { name: 'size', type: "'sm' | 'md'", required: false, default: 'md' },
    { name: 'disabled', type: 'boolean', required: false, default: 'false' },
    { name: 'className', type: 'string', required: false },
  ],
  tokens: [
    '--cascade-color-text',
    '--cascade-color-text-muted',
    '--cascade-color-bg-subtle',
    '--cascade-color-destructive',
    '--cascade-color-destructive-subtle',
    '--cascade-radius-button',
    '--cascade-focus-ring',
  ],
  accessibility: {
    role: 'menu',
    wcag: 'AA',
    keyboard: ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', 'Space', 'Escape'],
  },
  examples: [
    {
      title: 'Row actions',
      code: '<OverflowMenu items={[{ label: "Edit", value: "edit" }, { label: "Delete", value: "delete", destructive: true }]} onSelect={handle} />',
    },
    {
      title: 'Small, start-aligned',
      code: '<OverflowMenu size="sm" placement="bottom-start" items={items} />',
    },
  ],
  dependencies: ['@cascade-ui/core', '@cascade-ui/i18n'],
  tags: ['overlay', 'menu', 'actions', 'kebab', 'table'],
}
