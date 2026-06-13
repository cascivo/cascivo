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
    apgPattern: 'accordion',
  },
  examples: [
    {
      title: 'Single',
      code: '<Accordion type="single" defaultValue="a"><AccordionItem value="a"><AccordionTrigger>Section</AccordionTrigger><AccordionContent>…</AccordionContent></AccordionItem></Accordion>',
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['navigation', 'collapse', 'disclosure'],
  intent: {
    whenToUse: [
      'Progressively disclosing sections of related content the user reads top to bottom',
      'Reducing vertical scroll when most sections stay collapsed (FAQs, settings groups)',
      'Allowing multiple sections open at once (type="multiple")',
    ],
    whenNotToUse: [
      'Switching between mutually exclusive, equally important views — use Tabs',
      'A single show/hide region — a plain disclosure is enough',
    ],
    antiPatterns: [
      {
        bad: '<Accordion> with one item that is always open',
        good: 'Render the content directly, or use a collapsible disclosure',
        why: 'A single permanently-open section adds chrome and indirection for no gain',
      },
    ],
    related: [
      {
        name: 'Tabs',
        relationship: 'alternative',
        reason: 'Tabs switch between peer views; Accordion stacks sequential sections vertically',
      },
    ],
    a11yRationale:
      'Each trigger is a native <button> exposing aria-expanded and controlling its panel via aria-controls, so screen readers announce open/closed state and Enter/Space toggle from the platform',
    flexibility: [
      {
        area: 'single vs multiple',
        level: 'flexible',
        note: 'type prop is free to choose based on whether sections are exclusive',
      },
      {
        area: 'token names',
        level: 'strict',
        note: 'Borders, surfaces, and radii must resolve to --cascade-* semantic tokens',
      },
    ],
  },
}
