import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AuthLogin } from './auth-login'

describe('AuthLogin', () => {
  it('renders email and password inputs', () => {
    render(<AuthLogin />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('renders remember me checkbox', () => {
    render(<AuthLogin />)
    expect(screen.getByRole('checkbox', { name: /remember me/i })).toBeInTheDocument()
  })

  it('renders sign in button', () => {
    render(<AuthLogin />)
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('renders forgot password link', () => {
    render(<AuthLogin />)
    expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument()
  })

  it('renders create account link', () => {
    render(<AuthLogin />)
    expect(screen.getByRole('link', { name: /create an account/i })).toBeInTheDocument()
  })
})
