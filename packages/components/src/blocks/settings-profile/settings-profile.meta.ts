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
}
