import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProgressIndicator } from './progress-indicator'

const steps = [
  { label: 'Cart' },
  { label: 'Shipping', description: 'Address and method' },
  { label: 'Payment' },
  { label: 'Review' },
]

describe('ProgressIndicator', () => {
  it('renders an ordered list with one item per step', () => {
    render(<ProgressIndicator steps={steps} currentIndex={0} />)
    expect(screen.getByRole('list')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
  })

  it('renders step labels and descriptions', () => {
    render(<ProgressIndicator steps={steps} currentIndex={0} />)
    expect(screen.getByText('Shipping')).toBeInTheDocument()
    expect(screen.getByText('Address and method')).toBeInTheDocument()
  })

  it('derives step status from currentIndex', () => {
    render(<ProgressIndicator steps={steps} currentIndex={2} />)
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveAttribute('data-status', 'complete')
    expect(items[1]).toHaveAttribute('data-status', 'complete')
    expect(items[2]).toHaveAttribute('data-status', 'current')
    expect(items[3]).toHaveAttribute('data-status', 'incomplete')
  })

  it('marks only the current step with aria-current="step"', () => {
    render(<ProgressIndicator steps={steps} currentIndex={1} />)
    const items = screen.getAllByRole('listitem')
    expect(items[1]).toHaveAttribute('aria-current', 'step')
    expect(items[0]).not.toHaveAttribute('aria-current')
    expect(items[2]).not.toHaveAttribute('aria-current')
  })

  it('shows a check glyph for complete steps and numbers otherwise', () => {
    render(<ProgressIndicator steps={steps} currentIndex={1} />)
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('✓')
    expect(items[1]).toHaveTextContent('2')
    expect(items[3]).toHaveTextContent('4')
  })

  it('defaults to horizontal orientation', () => {
    render(<ProgressIndicator steps={steps} currentIndex={0} />)
    expect(screen.getByRole('list')).toHaveAttribute('data-orientation', 'horizontal')
  })

  it('supports vertical orientation', () => {
    render(<ProgressIndicator steps={steps} currentIndex={0} vertical />)
    expect(screen.getByRole('list')).toHaveAttribute('data-orientation', 'vertical')
  })

  it('merges a custom className', () => {
    render(<ProgressIndicator steps={steps} currentIndex={0} className="custom" />)
    expect(screen.getByRole('list')).toHaveClass('custom')
  })
})
