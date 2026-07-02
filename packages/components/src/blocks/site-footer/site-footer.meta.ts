import type { BlockMeta } from '../types'

export const meta: BlockMeta = {
  name: 'site-footer',
  displayName: 'Site Footer',
  description:
    'Multi-column site footer composed from Link and Separator, with a brand blurb, link columns, and a legal row.',
  category: 'marketing',
  tags: ['marketing', 'footer', 'navigation', 'links'],
  screenshot: {
    light: '/blocks/screenshots/site-footer-light.png',
    dark: '/blocks/screenshots/site-footer-dark.png',
  },
  intent: {
    whenToUse: [
      'Global footer for a marketing or docs site with grouped secondary navigation columns',
      'Closing a landing page with a brand blurb, legal links, and an auto-updating copyright year',
    ],
    whenNotToUse: [
      'Authenticated app screens — footer link columns waste vertical space inside app-shell',
      'Pages with only a copyright line — a Separator and one row of text is enough',
    ],
    related: [
      {
        name: 'marketing-hero',
        relationship: 'pairs-with',
        reason: 'Hero and footer bookend the standard marketing page composition',
      },
      {
        name: 'Link',
        relationship: 'contains',
        reason: 'All footer navigation and legal links are Link components',
      },
    ],
    a11yRationale:
      'Renders a real <footer> with the link columns wrapped in a <nav aria-label="Footer"> landmark and lists marked up as <ul>',
  },
}
