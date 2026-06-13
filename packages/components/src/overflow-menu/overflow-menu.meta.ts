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
  intent: {
    whenToUse: [
      'Collapsing secondary row-level or item-level actions behind a kebab trigger in dense layouts like tables and lists',
      'Offering a small set of actions where a destructive option needs visual distinction',
    ],
    whenNotToUse: [
      'A primary action that should always be visible — use Button',
      'Selecting a single value from a set rather than triggering actions — use Select or Dropdown',
      'New code — this component is deprecated in favor of Menu',
    ],
    antiPatterns: [
      {
        bad: 'Rendering every row action as a visible Button in a crowded table',
        good: '<OverflowMenu items={[{ label: "Edit", value: "edit" }, { label: "Delete", value: "delete", destructive: true }]} onSelect={handle} />',
        why: 'A kebab menu keeps dense rows scannable; surfacing every action inline competes for attention and breaks alignment',
      },
    ],
    related: [
      {
        name: 'Menu',
        relationship: 'alternative',
        reason:
          'Preferred replacement; OverflowMenu is deprecated and delegates to Dropdown internally',
      },
      {
        name: 'Dropdown',
        relationship: 'contains',
        reason: 'OverflowMenu is a kebab-triggered wrapper around Dropdown',
      },
      {
        name: 'Button',
        relationship: 'alternative',
        reason: 'Use for a single always-visible action instead of hiding it in a menu',
      },
    ],
    a11yRationale:
      "The kebab trigger carries a localized aria-label since it has no visible text, and the revealed list uses Dropdown's menu semantics so arrow keys, Home/End, Enter/Space, and Escape work without custom handling.",
    content: {
      tone: 'Imperative verb-first action labels',
      notes: 'Sentence case, short; mark irreversible actions destructive',
    },
    flexibility: [
      {
        area: 'token names',
        level: 'strict',
        note: 'Trigger and item styling must resolve to the listed --cascade-* tokens',
      },
      {
        area: 'item set and labels',
        level: 'flexible',
        note: 'items, ariaLabel, and placement are free to suit the context',
      },
    ],
  },
}
