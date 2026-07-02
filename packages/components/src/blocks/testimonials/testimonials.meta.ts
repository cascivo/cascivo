import type { BlockMeta } from '../types'

export const meta: BlockMeta = {
  name: 'testimonials',
  displayName: 'Testimonials',
  description:
    'Responsive testimonial grid composed from Card and Avatar, with a quote and attribution per card.',
  category: 'marketing',
  tags: ['marketing', 'testimonials', 'social-proof', 'cards'],
  screenshot: {
    light: '/blocks/screenshots/testimonials-light.png',
    dark: '/blocks/screenshots/testimonials-dark.png',
  },
  intent: {
    whenToUse: [
      'Social-proof section on a landing or pricing page with short customer quotes',
      'Attributed quotes where each card shows the person’s name, role, and avatar initials',
    ],
    whenNotToUse: [
      'Long-form case studies — cards fit one or two sentences, not narratives',
      'Logo walls or press mentions without quotes — this block is quote-centric',
    ],
    related: [
      {
        name: 'marketing-features',
        relationship: 'pairs-with',
        reason: 'Testimonials reinforce the claims made in the feature grid',
      },
      {
        name: 'pricing',
        relationship: 'pairs-with',
        reason: 'Social proof placed near pricing supports the purchase decision',
      },
      {
        name: 'Avatar',
        relationship: 'contains',
        reason: 'Attribution uses Avatar with initials fallback',
      },
    ],
    a11yRationale:
      'The section carries aria-label="Customer testimonials" and each quote is a semantic <blockquote> with visible attribution',
  },
}
