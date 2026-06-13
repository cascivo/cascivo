import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'ContextMenu',
  description: 'Right-click context menu anchored at pointer coordinates via CSS custom properties',
  category: 'overlay',
  states: ['open', 'closed'],
  variants: [],
  sizes: [],
  props: [],
  tokens: [
    '--cascade-color-surface',
    '--cascade-color-border',
    '--cascade-radius-md',
    '--cascade-shadow-md',
    '--cascade-motion-enter',
    '--cascade-motion-exit',
    '--cascade-color-bg-subtle',
  ],
  accessibility: {
    role: 'menu',
    wcag: 'AA',
    keyboard: ['ArrowDown', 'ArrowUp', 'Enter', 'Space', 'Escape'],
  },
  examples: [],
  dependencies: ['@cascade-ui/core'],
  tags: ['overlay', 'menu', 'context', 'right-click'],
  intent: {
    whenToUse: [
      'Offering actions contextual to an element via right-click (rename, delete, copy on a row or canvas item)',
      'Power-user surfaces where the desktop right-click affordance is expected',
    ],
    whenNotToUse: [
      'Primary actions that must be discoverable by all users — right-click is hidden; use a visible Button or Dropdown',
      'Selecting a value or filtering a list — use Combobox/Select',
    ],
    antiPatterns: [
      {
        bad: 'Putting the only path to an action behind a right-click ContextMenu',
        good: 'Also expose it via a visible Dropdown or Button; treat the context menu as a shortcut',
        why: 'Right-click is undiscoverable and unavailable on touch, so critical actions become unreachable for many users',
      },
    ],
    related: [
      {
        name: 'Dropdown',
        relationship: 'alternative',
        reason: 'Use a button-triggered menu when actions must be visible and touch-accessible',
      },
      {
        name: 'Menu',
        relationship: 'alternative',
        reason: 'Use a general menu when the trigger is not a right-click gesture',
      },
    ],
    a11yRationale:
      'The menu container is role="menu" and items are role="menuitem" with tabIndex management and aria-disabled, and it uses popover="auto" so it light-dismisses on Escape or outside click; the toggle event syncs that dismissal back into state so focus and open state stay consistent',
    flexibility: [
      {
        area: 'menu contents',
        level: 'flexible',
        note: 'Accepts arbitrary ContextMenuItem children after the trigger child',
      },
      {
        area: 'anchor position',
        level: 'strict',
        note: 'Anchored at pointer coordinates via --cascade-context-x/y custom properties set on right-click',
      },
    ],
  },
}
