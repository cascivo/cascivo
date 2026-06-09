import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { Slider } from './slider'

describe('Slider', () => {
  it('renders a labelled slider', () => {
    render(<Slider label="Volume" />)
    expect(screen.getByLabelText('Volume')).toBeInTheDocument()
  })

  it('exposes the slider role with bounds', () => {
    render(<Slider label="Volume" min={0} max={10} defaultValue={5} />)
    const slider = screen.getByRole('slider')
    expect(slider).toHaveAttribute('min', '0')
    expect(slider).toHaveAttribute('max', '10')
  })

  it('is disabled when the disabled prop is set', () => {
    render(<Slider label="Volume" disabled />)
    expect(screen.getByRole('slider')).toBeDisabled()
  })

  it('calls onChange when the value changes', () => {
    const handler = vi.fn()
    render(<Slider label="Volume" onChange={handler} />)
    fireEvent.change(screen.getByRole('slider'), { target: { value: '42' } })
    expect(handler).toHaveBeenCalled()
  })
})
