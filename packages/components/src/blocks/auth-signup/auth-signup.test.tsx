import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AuthSignup } from './auth-signup'

describe('AuthSignup', () => {
  it('renders name, email, password, and confirm-password inputs', () => {
    render(<AuthSignup />)
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
  })

  it('renders terms checkbox', () => {
    render(<AuthSignup />)
    expect(screen.getByRole('checkbox', { name: /terms/i })).toBeInTheDocument()
  })

  it('renders create account button', () => {
    render(<AuthSignup />)
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('renders sign in link', () => {
    render(<AuthSignup />)
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument()
  })
})
