import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'IconButton',
  description: 'Square, icon-only button with a required accessible label',
  category: 'inputs',
  states: ['idle'],
  variants: ['ghost', 'outline', 'filled'],
  sizes: ['sm', 'md', 'lg'],
  props: [
    { name: 'label', type: 'string', required: true },
    { name: 'icon', type: 'React.ReactNode', required: false },
    { name: 'variant', type: "'ghost' | 'outline' | 'filled'", required: false, default: 'ghost' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", required: false, default: 'md' },
    { name: 'asChild', type: 'boolean', required: false, default: 'false' },
    { name: 'disabled', type: 'boolean', required: false, default: 'false' },
    { name: 'onClick', type: 'React.MouseEventHandler<HTMLButtonElement>', required: false },
  ],
  tokens: [
    '--cascivo-control-height-sm',
    '--cascivo-control-height-md',
    '--cascivo-control-height-lg',
    '--cascivo-button-radius',
    '--cascivo-radius-control',
    '--cascivo-color-primary',
    '--cascivo-color-primary-fg',
    '--cascivo-color-bg-subtle',
    '--cascivo-color-border',
    '--cascivo-color-surface',
    '--cascivo-focus-ring',
  ],
  accessibility: {
    role: 'button',
    wcag: '2.2-AA',
    keyboard: ['Enter', 'Space'],
    apgPattern: 'button',
    forcedColors: true,
  },
  examples: [
    { title: 'Ghost', code: '<IconButton label="Settings"><GearIcon /></IconButton>' },
    { title: 'Filled', code: '<IconButton label="Add" variant="filled" icon={<PlusIcon />} />' },
    {
      title: 'As link',
      code: '<IconButton label="Home" asChild><a href="/"><HomeIcon /></a></IconButton>',
    },
  ],
  dependencies: ['@cascivo/core'],
  tags: ['action', 'icon', 'compact', 'toolbar'],
  intent: {
    whenToUse: [
      'A compact, recognizable action where an icon alone communicates intent (close, edit, more)',
      'Dense toolbars or table rows where a text label would not fit',
    ],
    whenNotToUse: [
      'The action is not universally recognizable by its icon — use a Button with a text label',
      'Navigating between pages — use an anchor (optionally via asChild)',
    ],
    antiPatterns: [
      {
        bad: '<IconButton label=""><TrashIcon /></IconButton>',
        good: '<IconButton label="Delete item"><TrashIcon /></IconButton>',
        why: 'An icon-only control has no visible text, so the label prop is the only accessible name screen readers can announce',
      },
    ],
    related: [
      {
        name: 'Button',
        relationship: 'alternative',
        reason: 'Use a Button when the action needs a visible text label',
      },
      {
        name: 'ButtonGroup',
        relationship: 'contained-by',
        reason: 'Icon buttons are commonly joined into a toolbar via ButtonGroup',
      },
    ],
    a11yRationale:
      'Renders a native <button> with a mandatory aria-label so the icon-only control always exposes an accessible name; focus, role, and Enter/Space activation come from the platform',
    content: {
      tone: 'Imperative verb describing the action',
      notes:
        'The label is announced to screen readers; be specific (e.g. "Delete item", not "Delete")',
    },
    flexibility: [
      {
        area: 'token names',
        level: 'strict',
        note: 'Sizing must resolve to --cascivo-control-height-* so it stays square and aligned with other controls',
      },
      {
        area: 'icon choice',
        level: 'flexible',
        note: 'Any single icon node; consumer owns the icon set',
      },
    ],
  },
}
