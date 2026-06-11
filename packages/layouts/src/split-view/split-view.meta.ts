import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'SplitView',
  description: 'Resizable two-pane split layout with keyboard and pointer drag support.',
  category: 'layout',
  states: [],
  variants: [],
  sizes: [],
  props: [
    { name: 'start', type: 'ReactNode', required: true, description: 'Left pane content' },
    { name: 'end', type: 'ReactNode', required: true, description: 'Right pane content' },
    {
      name: 'defaultRatio',
      type: 'number',
      required: false,
      description: 'Initial split ratio (0–1)',
    },
    { name: 'min', type: 'number', required: false, description: 'Minimum ratio for start pane' },
    { name: 'max', type: 'number', required: false, description: 'Maximum ratio for start pane' },
    { name: 'aria-label', type: 'string', required: false, description: 'Label for the separator' },
  ],
  tokens: ['--cascade-color-border', '--cascade-color-accent', '--cascade-duration-150'],
  accessibility: {
    role: 'separator',
    wcag: 'AA',
    keyboard: ['ArrowLeft', 'ArrowRight'],
  },
  examples: [
    {
      title: 'Basic',
      code: '<SplitView start={<FileTree />} end={<Editor />} />',
      description: 'Two-pane split with draggable divider',
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['layout', 'split', 'resizable', 'pane'],
}
