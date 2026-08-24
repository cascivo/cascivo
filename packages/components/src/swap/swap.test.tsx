import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Swap } from './swap'

describe('Swap', () => {
  it('renders a button with role="switch"', () => {
    render(<Swap on="ON" off="OFF" />)
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('aria-checked reflects the checked prop', () => {
    const { rerender } = render(<Swap on="ON" off="OFF" checked={false} />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')

    rerender(<Swap on="ON" off="OFF" checked={true} />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })

  it('clicking calls onValueChange with the toggled boolean', () => {
    const onValueChange = vi.fn()
    render(<Swap on="ON" off="OFF" checked={false} onValueChange={onValueChange} />)
    fireEvent.click(screen.getByRole('switch'))
    expect(onValueChange).toHaveBeenCalledWith(true)
  })

  it('data-checked is present when checked, absent when not', () => {
    const { rerender } = render(<Swap on="ON" off="OFF" checked={true} />)
    expect(screen.getByRole('switch')).toHaveAttribute('data-checked')

    rerender(<Swap on="ON" off="OFF" checked={false} />)
    expect(screen.getByRole('switch')).not.toHaveAttribute('data-checked')
  })

  it('data-mode reflects the mode prop', () => {
    const { rerender } = render(<Swap on="ON" off="OFF" mode="rotate" />)
    expect(screen.getByRole('switch')).toHaveAttribute('data-mode', 'rotate')

    rerender(<Swap on="ON" off="OFF" mode="flip" />)
    expect(screen.getByRole('switch')).toHaveAttribute('data-mode', 'flip')
  })
})
