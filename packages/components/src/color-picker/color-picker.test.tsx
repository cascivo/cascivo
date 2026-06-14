import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ColorPicker } from './color-picker'

afterEach(cleanup)

describe('ColorPicker', () => {
  it('renders the color area and hue slider', () => {
    render(<ColorPicker defaultValue="#3b82f6" label="Brand" />)
    expect(screen.getByRole('slider', { name: 'Saturation and lightness' })).toBeInTheDocument()
    expect(screen.getByLabelText('Hue')).toBeInTheDocument()
  })

  it('updates the value when the hue slider changes', () => {
    const onValueChange = vi.fn()
    render(<ColorPicker defaultValue="#ff0000" onValueChange={onValueChange} alpha={false} />)
    const hue = screen.getByLabelText('Hue') as HTMLInputElement
    fireEvent.change(hue, { target: { value: '120' } })
    expect(onValueChange).toHaveBeenCalled()
    const next = onValueChange.mock.calls.at(-1)?.[0] as string
    // hue 120 with full saturation/value yields a green-dominant color
    expect(next).toMatch(/^#/)
    expect(next.toLowerCase()).not.toBe('#ff0000')
  })

  it('shows the alpha slider only when alpha is enabled', () => {
    const { rerender } = render(<ColorPicker defaultValue="#3b82f6" alpha={false} />)
    expect(screen.queryByLabelText('Alpha')).not.toBeInTheDocument()
    rerender(<ColorPicker defaultValue="#3b82f6" alpha />)
    expect(screen.getByLabelText('Alpha')).toBeInTheDocument()
  })
})
