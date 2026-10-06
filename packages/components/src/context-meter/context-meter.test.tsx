import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ContextMeter } from './context-meter'

describe('ContextMeter', () => {
  it('is a named meter with its value in words', () => {
    render(<ContextMeter value={12400} max={200000} />)
    const meter = screen.getByRole('meter', { name: 'Context' })
    expect(meter).toHaveAttribute('aria-valuenow', '12400')
    expect(meter).toHaveAttribute('aria-valuemin', '0')
    expect(meter).toHaveAttribute('aria-valuemax', '200000')
    expect(meter).toHaveAttribute('aria-valuetext', '12,400 of 200,000 tokens used (6%)')
  })

  it('shows compact figures and hides them from assistive tech', () => {
    render(<ContextMeter value={12400} max={200000} />)
    const figures = screen.getByText('12K / 200K', { exact: false })
    expect(figures.closest('[aria-hidden="true"]')).not.toBeNull()
  })

  it('steps its level at 80% and 95%', () => {
    const level = (value: number) => {
      const { unmount } = render(<ContextMeter value={value} max={100} />)
      const result = screen.getByRole('meter').getAttribute('data-level')
      unmount()
      return result
    }
    expect(level(79)).toBe('normal')
    expect(level(80)).toBe('high')
    expect(level(95)).toBe('full')
  })

  it('clamps the fill and survives a zero max', () => {
    const { rerender } = render(<ContextMeter value={300} max={100} />)
    expect(screen.getByRole('meter').style.getPropertyValue('--_fill')).toBe('1')
    rerender(<ContextMeter value={5} max={0} />)
    expect(screen.getByRole('meter').style.getPropertyValue('--_fill')).toBe('0')
  })

  it('accepts a custom label and wording', () => {
    render(
      <ContextMeter
        value={50}
        max={100}
        label="Kontext"
        labels={{ usage: '{used} von {max} ({percent})' }}
      />,
    )
    expect(screen.getByRole('meter', { name: 'Kontext' })).toHaveAttribute(
      'aria-valuetext',
      '50 von 100 (50%)',
    )
  })
})
