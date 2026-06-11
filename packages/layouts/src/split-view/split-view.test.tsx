import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SplitView } from './split-view'

describe('SplitView', () => {
  it('renders start pane', () => {
    render(<SplitView start={<div>Start</div>} end={<div>End</div>} />)
    expect(screen.getByText('Start')).toBeInTheDocument()
  })

  it('renders end pane', () => {
    render(<SplitView start={<div>Start</div>} end={<div>End</div>} />)
    expect(screen.getByText('End')).toBeInTheDocument()
  })

  it('renders separator with correct ARIA', () => {
    render(<SplitView start={<div>S</div>} end={<div>E</div>} defaultRatio={0.3} />)
    const sep = screen.getByRole('separator')
    expect(sep).toHaveAttribute('aria-orientation', 'vertical')
    expect(sep).toHaveAttribute('aria-valuenow', '30')
  })

  it('ArrowRight increases ratio', () => {
    render(<SplitView start={<div>S</div>} end={<div>E</div>} defaultRatio={0.3} />)
    const sep = screen.getByRole('separator')
    fireEvent.keyDown(sep, { key: 'ArrowRight' })
    expect(Number(sep.getAttribute('aria-valuenow'))).toBe(32)
  })

  it('ArrowLeft decreases ratio', () => {
    render(<SplitView start={<div>S</div>} end={<div>E</div>} defaultRatio={0.3} />)
    const sep = screen.getByRole('separator')
    fireEvent.keyDown(sep, { key: 'ArrowLeft' })
    expect(Number(sep.getAttribute('aria-valuenow'))).toBe(28)
  })

  it('clamps ratio to min/max', () => {
    render(
      <SplitView start={<div>S</div>} end={<div>E</div>} defaultRatio={0.2} min={0.2} max={0.8} />,
    )
    const sep = screen.getByRole('separator')
    fireEvent.keyDown(sep, { key: 'ArrowLeft' })
    expect(Number(sep.getAttribute('aria-valuenow'))).toBe(20) // clamped at min
  })
})
