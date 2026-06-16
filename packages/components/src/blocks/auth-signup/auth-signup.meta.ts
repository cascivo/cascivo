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
}
