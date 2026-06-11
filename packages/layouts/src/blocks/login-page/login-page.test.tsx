import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LoginPage } from './login-page'

describe('LoginPage', () => {
  it('renders without crashing', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })
})
