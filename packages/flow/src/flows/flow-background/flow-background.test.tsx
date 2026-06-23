import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FlowBackground } from './flow-background.tsx'

describe('FlowBackground', () => {
  it('defaults to the dots variant', () => {
    const { container } = render(<FlowBackground />)
    const el = container.firstChild as HTMLElement
    expect(el.dataset['variant']).toBe('dots')
    expect(el).toHaveAttribute('aria-hidden', 'true')
  })

  it('reflects variant + gap', () => {
    const { container } = render(<FlowBackground variant="grid" gap={30} size={2} />)
    const el = container.firstChild as HTMLElement
    expect(el.dataset['variant']).toBe('grid')
    expect(el.style.getPropertyValue('--flow-bg-gap')).toBe('30px')
    expect(el.style.getPropertyValue('--flow-bg-size')).toBe('2px')
  })

  it('applies a custom color', () => {
    const { container } = render(<FlowBackground color="rebeccapurple" />)
    const el = container.firstChild as HTMLElement
    expect(el.style.getPropertyValue('--flow-bg-color')).toBe('rebeccapurple')
  })
})
