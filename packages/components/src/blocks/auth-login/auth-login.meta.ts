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
}
