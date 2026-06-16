import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('./blocks-data', () => ({
  findBlock: (name: string) =>
    name === 'auth-login'
      ? {
          meta: {
            name: 'auth-login',
            displayName: 'Login Form',
            description: 'Test',
            category: 'auth',
            tags: [],
            screenshot: { light: '', dark: '' },
          },
          load: () => Promise.resolve({ default: () => <div>BLOCK CONTENT</div> }),
        }
      : undefined,
}))

import { BlockDetailPage } from './BlockDetailPage'

describe('BlockDetailPage', () => {
  it('renders block display name as heading', () => {
    render(<BlockDetailPage name="auth-login" />)
    expect(screen.getByRole('heading', { name: /login form/i })).toBeInTheDocument()
  })

  it('renders light/dark toggle buttons', () => {
    render(<BlockDetailPage name="auth-login" />)
    expect(screen.getByRole('button', { name: /^light$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^dark$/i })).toBeInTheDocument()
  })

  it('renders viewport size buttons', () => {
    render(<BlockDetailPage name="auth-login" />)
    expect(screen.getByRole('button', { name: /320/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /768/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /1280/i })).toBeInTheDocument()
  })

  it('renders TSX and CSS code tabs', () => {
    render(<BlockDetailPage name="auth-login" />)
    expect(screen.getByRole('tab', { name: /tsx/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /css/i })).toBeInTheDocument()
  })

  it('renders CLI install command', () => {
    render(<BlockDetailPage name="auth-login" />)
    // The inline install <code> element contains exactly this text
    const installCmd = screen.getByText('npx cascivo add block/auth-login')
    expect(installCmd).toBeInTheDocument()
  })

  it('renders not-found message for unknown block', () => {
    render(<BlockDetailPage name="does-not-exist" />)
    expect(screen.getByText(/not found/i)).toBeInTheDocument()
  })
})
