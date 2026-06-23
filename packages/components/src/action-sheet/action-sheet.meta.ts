import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'ActionSheet',
  description:
    'Bottom-rising sheet of discrete actions (iOS action-sheet pattern) with a Cancel button',
  category: 'overlay',
  states: ['open', 'closed'],
  variants: [],
  sizes: [],
  props: [
    { name: 'open', type: 'boolean', required: false },
    { name: 'defaultOpen', type: 'boolean', required: false },
    { name: 'onOpenChange', type: '(open: boolean) => void', required: false },
    {
      name: 'actions',
      type: 'ActionSheetAction[]',
      required: true,
      description: 'Choices, each with a label, onSelect, and optional destructive/disabled flags',
    },
    { name: 'title', type: 'React.ReactNode', required: false },
    { name: 'description', type: 'React.ReactNode', required: false },
    { name: 'showCancel', type: 'boolean', required: false, default: 'true' },
    { name: 'labels', type: '{ cancel?: string; label?: string }', required: false },
    { name: 'className', type: 'string', required: false },
  ],
  tokens: [
    '--cascivo-color-surface',
    '--cascivo-color-border',
    '--cascivo-color-accent',
    '--cascivo-color-destructive',
    '--cascivo-color-text',
    '--cascivo-color-text-subtle',
    '--cascivo-color-text-muted',
    '--cascivo-radius-overlay',
    '--cascivo-shadow-overlay',
    '--cascivo-motion-enter',
    '--cascivo-motion-exit',
    '--cascivo-z-overlay',
  ],
  accessibility: {
    role: 'menu',
    wcag: '2.2-AA',
    keyboard: ['ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter', 'Space', 'Escape'],
  },
  examples: [],
  dependencies: ['@cascivo/core', '@cascivo/i18n'],
  tags: ['overlay', 'action-sheet', 'menu', 'mobile', 'sheet'],
  intent: {
    whenToUse: [
      'A short list of discrete actions on a touch surface, rising from the bottom',
      'Confirming or choosing among a few operations (e.g. Share, Edit, Delete) on mobile',
      'A mobile-first alternative to an anchored dropdown menu when there is no trigger anchor',
    ],
    whenNotToUse: [
      'A single yes/no confirmation — use AlertDialog',
      'A form or scrollable content — use BottomSheet or Sheet',
      'A menu anchored to a trigger on desktop — use Menu or Dropdown',
    ],
    antiPatterns: [
      {
        bad: '<ActionSheet actions={[{ label: "OK", onSelect }]} />',
        good: '<AlertDialog title="Delete item?" />',
        why: 'A one-action sheet is a confirmation; AlertDialog states the decision clearly',
      },
    ],
    related: [
      {
        name: 'BottomSheet',
        relationship: 'alternative',
        reason:
          'Use BottomSheet for rich/resizable content; ActionSheet is a fixed list of actions',
      },
      {
        name: 'Menu',
        relationship: 'alternative',
        reason: 'Use Menu for a trigger-anchored dropdown on pointer-first surfaces',
      },
    ],
    a11yRationale:
      'Renders role="menu" with role="menuitem" buttons under vertical roving focus (Arrow keys, Home/End, wrapping). The title labels the menu via aria-labelledby (or a built-in label otherwise) and the description via aria-describedby. FocusScope traps and restores focus; DismissableLayer handles Escape and outside-pointer dismissal; a separate Cancel button provides an explicit non-destructive exit.',
    flexibility: [
      {
        area: 'actions',
        level: 'flexible',
        note: 'Any number of actions; each may be destructive or disabled',
      },
      {
        area: 'open state',
        level: 'flexible',
        note: 'Controlled (open/onOpenChange) or uncontrolled (defaultOpen)',
      },
      {
        area: 'cancel',
        level: 'flexible',
        note: 'showCancel toggles the separate Cancel button (Escape/outside press still dismiss)',
      },
    ],
  },
}
