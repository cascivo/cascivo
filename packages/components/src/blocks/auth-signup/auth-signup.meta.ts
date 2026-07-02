import type { BlockMeta } from '../types'

export const meta: BlockMeta = {
  name: 'auth-signup',
  displayName: 'Sign Up Form',
  description: 'Full-name, email, password, confirm-password sign-up form with terms checkbox.',
  category: 'auth',
  tags: ['auth', 'signup', 'register', 'form'],
  screenshot: {
    light: '/blocks/screenshots/auth-signup-light.png',
    dark: '/blocks/screenshots/auth-signup-dark.png',
  },
  intent: {
    whenToUse: [
      'Registration page collecting name, email, and password with confirmation',
      'Flows that require explicit terms-of-service / privacy-policy consent before account creation',
    ],
    whenNotToUse: [
      'Signing in existing users — use auth-login (this block links to it)',
      'Multi-step onboarding wizards — this is a single-screen form',
    ],
    related: [
      {
        name: 'auth-login',
        relationship: 'pairs-with',
        reason: 'The blocks cross-link: signup footer points to login and vice versa',
      },
      {
        name: 'Checkbox',
        relationship: 'contains',
        reason: 'Terms consent is a Checkbox tied to its label with links to terms and privacy',
      },
    ],
    a11yRationale:
      'Every field has an explicit <label htmlFor>, password fields declare autoComplete="new-password" so managers offer generation, and the terms checkbox is associated with its label text',
  },
}
