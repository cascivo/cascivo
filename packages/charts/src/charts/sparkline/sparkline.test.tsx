import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Sparkline } from './sparkline'

describe('Sparkline', () => {
  it('renders with role="img" and aria-label', () => {
    const { container } = render(<Sparkline data={[1, 2, 3, 4, 5]} label="Revenue trend" />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('role')).toBe('img')
    expect(svg?.getAttribute('aria-label')).toBe('Revenue trend')
  })

  it('renders a path for data', () => {
    const { container } = render(<Sparkline data={[1, 2, 3, 4, 5]} label="Test" />)
    expect(container.querySelector('path')).toBeTruthy()
  })

  it('renders end dot by default', () => {
    const { container } = render(<Sparkline data={[1, 2, 3]} label="Test" />)
    expect(container.querySelector('circle')).toBeTruthy()
  })

  it('renders empty svg for empty data', () => {
    const { container } = render(<Sparkline data={[]} label="Empty" />)
    expect(container.querySelector('path')).toBeNull()
  })

  it('respects width and height props', () => {
    const { container } = render(
      <Sparkline data={[1, 2, 3]} label="Test" width={200} height={48} />,
    )
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('200')
    expect(svg?.getAttribute('height')).toBe('48')
  })
})
