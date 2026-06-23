import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'BottomSheet',
  description:
    'Mobile bottom sheet with drag-to-resize detents, velocity-projected snapping, and drag-to-dismiss',
  category: 'overlay',
  states: ['open', 'closed', 'dragging'],
  variants: [],
  sizes: [],
  props: [
    { name: 'open', type: 'boolean', required: false },
    { name: 'defaultOpen', type: 'boolean', required: false },
    { name: 'onOpenChange', type: '(open: boolean) => void', required: false },
    {
      name: 'snapPoints',
      type: 'number[]',
      required: false,
      default: '[0.5, 0.92]',
      description: 'Detent heights as ascending fractions of the viewport (0–1)',
    },
    { name: 'activeSnap', type: 'number', required: false },
    { name: 'defaultSnap', type: 'number', required: false, default: '0' },
    { name: 'onSnapChange', type: '(index: number) => void', required: false },
    { name: 'title', type: 'React.ReactNode', required: false },
    { name: 'description', type: 'React.ReactNode', required: false },
    { name: 'children', type: 'React.ReactNode', required: false },
    { name: 'labels', type: '{ close?: string; handle?: string }', required: false },
    { name: 'className', type: 'string', required: false },
  ],
  tokens: [
    '--cascivo-color-surface',
    '--cascivo-color-border',
    '--cascivo-radius-overlay',
    '--cascivo-shadow-overlay',
    '--cascivo-motion-enter',
    '--cascivo-motion-exit',
    '--cascivo-target-min-coarse',
    '--cascivo-z-overlay',
  ],
  accessibility: {
    role: 'dialog',
    wcag: '2.2-AA',
    keyboard: ['Escape', 'Tab', 'Shift+Tab'],
  },
  examples: [],
  dependencies: ['@cascivo/core', '@cascivo/i18n'],
  tags: ['overlay', 'sheet', 'bottom-sheet', 'mobile', 'drag', 'detent', 'gesture'],
  intent: {
    whenToUse: [
      'A mobile surface that rises from the bottom and can be resized between detents by dragging',
      'Showing secondary content, filters, or a form where the user can peek at half height then expand',
      'A touch-first overlay that dismisses by flinging or dragging it down past the lowest detent',
    ],
    whenNotToUse: [
      'A short yes/no confirmation — use AlertDialog',
      'A non-resizable edge panel without gestures — use Drawer or Sheet',
      'A desktop-first side panel for navigation — use Drawer',
    ],
    antiPatterns: [
      {
        bad: '<BottomSheet title="Delete item?">Are you sure?</BottomSheet>',
        good: '<AlertDialog title="Delete item?" />',
        why: 'A resizable gesture surface is overkill for a focused yes/no decision',
      },
    ],
    related: [
      {
        name: 'Sheet',
        relationship: 'alternative',
        reason: 'Use Sheet for a fixed-height panel from any edge; BottomSheet adds resize detents',
      },
      {
        name: 'Drawer',
        relationship: 'alternative',
        reason: 'Use Drawer for a plain edge dialog without resize detents',
      },
    ],
    a11yRationale:
      'Renders role="dialog" with aria-modal; the title labels it via aria-labelledby and the description via aria-describedby. FocusScope traps Tab focus and restores it on close; DismissableLayer handles Escape and outside-pointer dismissal. The grab handle is a labelled separator and a Close button gives a non-gesture dismissal path so the sheet stays keyboard-operable.',
    flexibility: [
      {
        area: 'snapPoints',
        level: 'flexible',
        note: 'Any ascending list of viewport fractions; the sheet snaps between them',
      },
      {
        area: 'open state',
        level: 'flexible',
        note: 'Controlled (open/onOpenChange) or uncontrolled (defaultOpen)',
      },
      {
        area: 'active detent',
        level: 'flexible',
        note: 'Controlled (activeSnap/onSnapChange) or uncontrolled (defaultSnap)',
      },
    ],
  },
}
