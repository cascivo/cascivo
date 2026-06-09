import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Accordion',
  description: 'Vertically stacked, collapsible content sections',
  category: 'navigation',
  states: ['open', 'closed'],
  variants: [],
  sizes: [],
  props: [
    { name: 'type', type: "'single' | 'multiple'", required: false, default: 'single' },
    { name: 'defaultValue', type: 'string | string[]', required: false },
    { name: 'value', type: 'string | string[]', required: false },
    { name: 'onValueChange', type: '(value: string | string[]) => void', required: false },
  ],
  tokens: [
    '--cascade-color-border',
    '--cascade-color-bg-subtle',
    '--cascade-color-text',
    '--cascade-radius-md',
    '--cascade-focus-ring',
  ],
  accessibility: {
    role: 'button',
    wcag: 'AA',
    keyboard: ['Enter', 'Space'],
  },
  examples: [
    {
      title: 'Single',
      code: '<Accordion type="single" defaultValue="a"><AccordionItem value="a"><AccordionTrigger>Section</AccordionTrigger><AccordionContent>…</AccordionContent></AccordionItem></Accordion>',
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['navigation', 'collapse', 'disclosure'],
}
