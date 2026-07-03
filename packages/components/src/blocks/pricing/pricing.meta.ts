import type { BlockMeta } from '../types'

export const meta: BlockMeta = {
  name: 'pricing',
  displayName: 'Pricing Tiers',
  description:
    'Responsive three-tier pricing section composed from Card, Badge, and Button, with a highlighted featured plan.',
  category: 'marketing',
  tags: ['marketing', 'pricing', 'plans', 'cards'],
  screenshot: {
    light: '/blocks/screenshots/pricing-light.png',
    dark: '/blocks/screenshots/pricing-dark.png',
  },
  intent: {
    whenToUse: [
      'Subscription products with a small number of tiers, each with a price, feature list, and its own CTA',
      'Steering users toward a recommended plan — the featured tier gets an elevated card and "Popular" Badge',
    ],
    whenNotToUse: [
      'Usage-based or configurable pricing that needs a calculator rather than fixed tiers',
      'More than four plans or many comparison dimensions — a comparison table scales better than cards',
    ],
    related: [
      {
        name: 'faq',
        relationship: 'pairs-with',
        reason: 'Billing questions conventionally follow the pricing section',
      },
      {
        name: 'marketing-hero',
        relationship: 'pairs-with',
        reason: 'Hero CTAs commonly link down to pricing on the same landing page',
      },
      {
        name: 'Card',
        relationship: 'contains',
        reason: 'Each tier is a Card; the featured tier uses the elevated variant',
      },
    ],
    a11yRationale:
      'The section carries aria-label="Pricing plans", each feature list is a real <ul>, and decorative check marks are aria-hidden',
  },
}
