import type { BlockMeta } from '../types'

export const meta: BlockMeta = {
  name: 'faq',
  displayName: 'FAQ Accordion',
  description:
    'Frequently-asked-questions section composed from the Accordion component, with a centered, readable measure.',
  category: 'marketing',
  tags: ['marketing', 'faq', 'accordion', 'questions'],
  screenshot: {
    light: '/blocks/screenshots/faq-light.png',
    dark: '/blocks/screenshots/faq-dark.png',
  },
  intent: {
    whenToUse: [
      'Pre-sales or support question sections on marketing and pricing pages',
      'Condensing a handful of short Q&A pairs behind single-open disclosures to keep the page scannable',
    ],
    whenNotToUse: [
      'Full product documentation — link to docs instead of stacking long answers in an accordion',
      'Two or three short answers — rendering them as plain headings and paragraphs avoids the extra click',
    ],
    related: [
      {
        name: 'Accordion',
        relationship: 'contains',
        reason: 'Each Q&A is an AccordionItem inside a type="single" Accordion',
      },
      {
        name: 'pricing',
        relationship: 'pairs-with',
        reason: 'Billing and plan questions typically follow the pricing section',
      },
    ],
    a11yRationale:
      'The section carries aria-label="Frequently asked questions" and questions inherit Accordion’s button/region semantics and keyboard support',
  },
}
