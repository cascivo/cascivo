import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { setLinkComponent as coreSetLink } from '@cascivo/core'
import { Badge, Button, getLinkComponent, Kbd, setLinkComponent, Spinner } from './index'

describe('@cascivo/react', () => {
  it('renders Button from the bundled entry', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('renders Badge with variant attribute', () => {
    render(<Badge variant="success">Active</Badge>)
    expect(screen.getByText('Active')).toHaveAttribute('data-variant', 'success')
  })

  it('renders Kbd and Spinner', () => {
    render(
      <>
        <Kbd>Esc</Kbd>
        <Spinner label="Loading" />
      </>,
    )
    expect(screen.getByText('Esc')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('re-exports the link API so Path-B users need not depend on @cascivo/core', () => {
    // Same singleton as @cascivo/core: setting via the react re-export is observable
    // through the core setter's effect, proving it is not a separate copy.
    expect(setLinkComponent).toBe(coreSetLink)
    const Stub = () => null
    setLinkComponent(Stub)
    expect(getLinkComponent()).toBe(Stub)
    setLinkComponent('a')
  })
})
