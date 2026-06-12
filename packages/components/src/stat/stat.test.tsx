import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Stat } from './stat'

describe('Stat', () => {
  it('renders label and value', () => {
    render(<Stat label="Components" value={106} />)
    expect(screen.getByText('Components')).toBeInTheDocument()
    expect(screen.getByText('106')).toBeInTheDocument()
  })

  it('accepts a string value', () => {
    render(<Stat label="Bundle" value="12.4 kB" />)
    expect(screen.getByText('12.4 kB')).toBeInTheDocument()
  })

  it('renders no delta element without a delta', () => {
    const { container } = render(<Stat label="Components" value={106} />)
    expect(container.querySelector('[data-trend]')).not.toBeInTheDocument()
  })

  it('renders the delta with flat trend by default', () => {
    render(<Stat label="Components" value={106} delta="+6" />)
    expect(screen.getByText('+6')).toHaveAttribute('data-trend', 'flat')
  })

  it('applies up and down trends', () => {
    const { rerender } = render(<Stat label="x" value={1} delta="+6" trend="up" />)
    expect(screen.getByText('+6')).toHaveAttribute('data-trend', 'up')
    rerender(<Stat label="x" value={1} delta="-2" trend="down" />)
    expect(screen.getByText('-2')).toHaveAttribute('data-trend', 'down')
  })

  it('renders helpText', () => {
    render(<Stat label="Axe violations" value={0} helpText="WCAG 2.1 AA, 4 app states" />)
    expect(screen.getByText('WCAG 2.1 AA, 4 app states')).toBeInTheDocument()
  })

  it('merges className and forwards props', () => {
    render(<Stat label="x" value={1} className="custom" data-testid="stat" />)
    expect(screen.getByTestId('stat')).toHaveClass('custom')
  })
})
