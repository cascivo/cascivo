import type { BlockMeta } from '../types'

export const meta: BlockMeta = {
  name: 'app-shell',
  displayName: 'App Shell',
  description: 'Two-column layout with collapsible sidebar, nav links, and content area.',
  category: 'shell',
  tags: ['shell', 'layout', 'sidebar', 'navigation', 'responsive'],
  screenshot: {
    light: '/blocks/screenshots/app-shell-light.png',
    dark: '/blocks/screenshots/app-shell-dark.png',
  },
  intent: {
    whenToUse: [
      'Frame for an authenticated app: persistent sidebar nav on desktop, drawer nav on mobile',
      'Starting point when a page needs a topbar, main navigation, and a content area',
      'Hosting dashboard or settings blocks inside consistent app chrome',
    ],
    whenNotToUse: [
      'Marketing or landing pages — compose marketing-hero, marketing-features, and site-footer instead',
      'Standalone auth screens — auth-login and auth-signup are full-page centered cards without app chrome',
    ],
    related: [
      {
        name: 'dashboard-overview',
        relationship: 'pairs-with',
        reason: 'Typical content for the shell’s main area',
      },
      {
        name: 'settings-profile',
        relationship: 'pairs-with',
        reason: 'Settings pages render inside this shell',
      },
    ],
    a11yRationale:
      'Sidebar nav is a labeled <nav> landmark with aria-current="page" on the active link; the mobile drawer toggle exposes aria-expanded, Escape closes the drawer, body scroll is locked while open, and the off-screen sidebar is aria-hidden on mobile so it leaves the a11y tree only when visually unavailable',
  },
}
