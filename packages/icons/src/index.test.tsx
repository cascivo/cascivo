import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import * as icons from './index'
import { Check, ChevronDown, X } from './index'

describe('@cascade-ui/icons', () => {
  it('exports VERSION', () => {
    expect(icons.VERSION).toBe('0.0.0')
  })

  it('exports at least 30 icons', () => {
    const components = Object.entries(icons).filter(
      ([, v]) => typeof v === 'function' && v.name !== 'createIcon',
    )
    expect(components.length).toBeGreaterThanOrEqual(30)
  })

  it('renders a 24×24 svg with currentColor stroke by default', () => {
    const { container } = render(<ChevronDown />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '24')
    expect(svg).toHaveAttribute('height', '24')
    expect(svg).toHaveAttribute('stroke', 'currentColor')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  it('honors size, color, and className props', () => {
    const { container } = render(<X size={16} color="#f00" className="my-icon" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '16')
    expect(svg).toHaveAttribute('stroke', '#f00')
    expect(svg).toHaveClass('my-icon')
  })

  it('drops aria-hidden when an aria-label is given', () => {
    const { container } = render(<Check aria-label="Done" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-label', 'Done')
    expect(svg).not.toHaveAttribute('aria-hidden')
  })
})
