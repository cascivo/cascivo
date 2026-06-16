import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

vi.mock('./blocks-data', () => ({
  BLOCKS: [
    {
      meta: {
        name: 'auth-login',
        displayName: 'Login Form',
        description: 'Login block',
        category: 'auth',
        tags: ['auth'],
        screenshot: { light: '/test-light.png', dark: '/test-dark.png' },
      },
      load: () => Promise.resolve({ default: () => null }),
    },
    {
      meta: {
        name: 'dashboard-overview',
        displayName: 'Dashboard Overview',
        description: 'Dashboard block',
        category: 'dashboard',
        tags: ['dashboard'],
        screenshot: { light: '/test-light.png', dark: '/test-dark.png' },
      },
      load: () => Promise.resolve({ default: () => null }),
    },
  ],
}))

import { BlocksPage } from './BlocksPage'

describe('BlocksPage', () => {
  it('renders heading', () => {
    render(<BlocksPage />)
    expect(screen.getByRole('heading', { name: /blocks/i })).toBeInTheDocument()
  })

  it('renders block cards', () => {
    render(<BlocksPage />)
    expect(screen.getByText('Login Form')).toBeInTheDocument()
    expect(screen.getByText('Dashboard Overview')).toBeInTheDocument()
  })

  it('filters to Auth category', async () => {
    const user = userEvent.setup()
    render(<BlocksPage />)
    await user.click(screen.getByRole('button', { name: /^auth$/i }))
    expect(screen.getByText('Login Form')).toBeInTheDocument()
    expect(screen.queryByText('Dashboard Overview')).not.toBeInTheDocument()
  })

  it('search filters by name', async () => {
    const user = userEvent.setup()
    render(<BlocksPage />)
    await user.type(screen.getByRole('searchbox'), 'login')
    expect(screen.getByText('Login Form')).toBeInTheDocument()
    expect(screen.queryByText('Dashboard Overview')).not.toBeInTheDocument()
  })
})
