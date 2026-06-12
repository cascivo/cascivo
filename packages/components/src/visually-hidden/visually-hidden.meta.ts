import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'VisuallyHidden',
  description: 'Hides content visually while keeping it available to screen readers',
  category: 'display',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'children',
      type: 'ReactNode',
      required: true,
      description: 'Content announced by assistive technology but not painted',
    },
  ],
  tokens: [],
  accessibility: {
    role: 'none',
    wcag: 'AA',
    keyboard: [],
  },
  examples: [
    {
      title: 'Icon button label',
      code: '<button type="button"><CloseIcon /><VisuallyHidden>Close dialog</VisuallyHidden></button>',
      description: 'Gives an icon-only control an accessible name',
    },
    {
      title: 'Table context',
      code: '<th>Price <VisuallyHidden>(in euros)</VisuallyHidden></th>',
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['accessibility', 'screen-reader', 'sr-only', 'hidden'],
}
