import type { BlockMeta } from '../types'

export const meta: BlockMeta = {
  name: 'auth-login',
  displayName: 'Login Form',
  description: 'Email + password login with remember-me checkbox and forgot-password link.',
  category: 'auth',
  tags: ['auth', 'login', 'form', 'email', 'password'],
  screenshot: {
    light: '/blocks/screenshots/auth-login-light.png',
    dark: '/blocks/screenshots/auth-login-dark.png',
  },
  intent: {
    whenToUse: [
      'Sign-in page for returning users with email + password credentials',
      'Standalone centered auth screen with remember-me and a forgot-password recovery link',
    ],
    whenNotToUse: [
      'Registering new users — use auth-signup (this block links to it)',
      'SSO/OAuth-only sign-in with no password field — the form is credential-based',
      'Inline sign-in inside app chrome — this is a full-page centered card layout',
    ],
    related: [
      {
        name: 'auth-signup',
        relationship: 'pairs-with',
        reason: 'The blocks cross-link: login footer points to signup and vice versa',
      },
      {
        name: 'Input',
        relationship: 'contains',
        reason: 'Email and password fields are Input components with autocomplete wired',
      },
    ],
    a11yRationale:
      'Every field has an explicit <label htmlFor>, inputs declare autoComplete="email"/"current-password" for password managers, and the submit is a real type="submit" button inside a <form>',
  },
}
