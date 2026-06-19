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
}
