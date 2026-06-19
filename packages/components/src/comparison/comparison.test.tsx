import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Comparison } from './comparison'

const layers = { before: <span>Before</span>, after: <span>After</span> }

describe('Comparison', () => {
  it('renders both layers and a slider divider at 50 by default', () => {
    render(<Comparison {...layers} label="Reveal" />)
    expect(screen.getByText('Before')).toBeInTheDocument()
    expect(screen.getByText('After')).toBeInTheDocument()
    const slider = screen.getByRole('slider', { name: 'Reveal' })
    expect(slider).toHaveAttribute('aria-valuenow', '50')
  })

  it('moves the divider with the arrow keys (clamped 0–100)', () => {
    render(<Comparison {...layers} label="Reveal" keyboardStep={10} />)
    const slider = screen.getByRole('slider')
    fireEvent.keyDown(slider, { key: 'ArrowRight' })
    expect(slider).toHaveAttribute('aria-valuenow', '60')
    fireEvent.keyDown(slider, { key: 'ArrowLeft' })
    expect(slider).toHaveAttribute('aria-valuenow', '50')
    fireEvent.keyDown(slider, { key: 'End' })
    expect(slider).toHaveAttribute('aria-valuenow', '100')
    fireEvent.keyDown(slider, { key: 'ArrowRight' })
    expect(slider).toHaveAttribute('aria-valuenow', '100')
    fireEvent.keyDown(slider, { key: 'Home' })
    expect(slider).toHaveAttribute('aria-valuenow', '0')
  })

  it('honors a controlled position and reports changes', () => {
    const onPositionChange = vi.fn()
    render(
      <Comparison {...layers} position={25} onPositionChange={onPositionChange} label="Reveal" />,
    )
    const slider = screen.getByRole('slider')
    expect(slider).toHaveAttribute('aria-valuenow', '25')
    fireEvent.keyDown(slider, { key: 'ArrowRight' })
    expect(onPositionChange).toHaveBeenCalledWith(30)
    // Controlled: value stays until the parent updates it.
    expect(slider).toHaveAttribute('aria-valuenow', '25')
  })

  it('reflects orientation on the slider', () => {
    render(<Comparison {...layers} orientation="vertical" label="Reveal" />)
    expect(screen.getByRole('slider')).toHaveAttribute('aria-orientation', 'vertical')
  })
})
