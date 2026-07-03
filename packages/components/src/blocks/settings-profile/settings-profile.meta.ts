import type { BlockMeta } from '../types'

export const meta: BlockMeta = {
  name: 'settings-profile',
  displayName: 'Settings — Profile',
  description: 'Two-section settings form: personal info fields + preference toggles.',
  category: 'shell',
  tags: ['settings', 'profile', 'form', 'toggles', 'preferences'],
  screenshot: {
    light: '/blocks/screenshots/settings-profile-light.png',
    dark: '/blocks/screenshots/settings-profile-dark.png',
  },
  intent: {
    whenToUse: [
      'Account settings page combining editable profile fields (name, email, bio) with notification toggles',
      'Settings screens that group fields into titled sections with a shared cancel/save footer',
    ],
    whenNotToUse: [
      'Collecting user details at registration — use auth-signup',
      'Large settings surfaces spanning many areas — split into separate pages or Tabs rather than one long form',
    ],
    related: [
      {
        name: 'app-shell',
        relationship: 'contained-by',
        reason: 'Settings render inside the app shell’s content area',
      },
      {
        name: 'Toggle',
        relationship: 'contains',
        reason: 'Notification preferences are Toggles with aria-labels',
      },
    ],
    a11yRationale:
      'Text fields use explicit <label htmlFor>; each Toggle carries an aria-label matching its visible row label; sections are titled with <h2> under the page <h1>',
  },
}
