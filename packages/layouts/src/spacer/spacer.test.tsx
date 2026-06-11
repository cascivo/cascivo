import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Spacer } from './spacer'

describe('Spacer', () => {
  it('renders', () => {
    const { container } = render(<Spacer />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('sets size CSS var', () => {
    const { container } = render(<Spacer size={8} />)
    expect((container.firstChild as HTMLElement).style.getPropertyValue('--_spacer-size')).toBe(
      'var(--cascade-space-8)',
    )
  })
})
