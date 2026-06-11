import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AuthLayout } from './auth-layout'

describe('AuthLayout', () => {
  it('renders children', () => {
    render(
      <AuthLayout>
        <form>Login form</form>
      </AuthLayout>,
    )
    expect(screen.getByText('Login form')).toBeInTheDocument()
  })

  it('renders logo slot', () => {
    render(
      <AuthLayout logo={<img alt="Logo" />}>
        <div>C</div>
      </AuthLayout>,
    )
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('omits logo when not provided', () => {
    const { container } = render(
      <AuthLayout>
        <div>C</div>
      </AuthLayout>,
    )
    expect(container.querySelector('.logo')).toBeNull()
  })
})
