import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Radio, RadioGroup } from './radio'

describe('Radio', () => {
  it('renders a labelled radio', () => {
    render(<Radio value="pro" label="Pro plan" />)
    expect(screen.getByLabelText('Pro plan')).toBeInTheDocument()
  })
})

describe('RadioGroup', () => {
  it('exposes a radiogroup role', () => {
    render(
      <RadioGroup name="plan">
        <Radio value="pro" label="Pro" />
        <Radio value="team" label="Team" />
      </RadioGroup>,
    )
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
  })

  it('shares the name across children', () => {
    render(
      <RadioGroup name="plan">
        <Radio value="pro" label="Pro" />
        <Radio value="team" label="Team" />
      </RadioGroup>,
    )
    const radios = screen.getAllByRole('radio')
    expect(radios.every((r) => r.getAttribute('name') === 'plan')).toBe(true)
  })

  it('selects the defaultValue option', () => {
    render(
      <RadioGroup name="plan" defaultValue="team">
        <Radio value="pro" label="Pro" />
        <Radio value="team" label="Team" />
      </RadioGroup>,
    )
    expect(screen.getByLabelText('Team')).toBeChecked()
    expect(screen.getByLabelText('Pro')).not.toBeChecked()
  })

  it('calls onChange with the selected value', async () => {
    const handler = vi.fn()
    render(
      <RadioGroup name="plan" onChange={handler}>
        <Radio value="pro" label="Pro" />
        <Radio value="team" label="Team" />
      </RadioGroup>,
    )
    await userEvent.click(screen.getByLabelText('Team'))
    expect(handler).toHaveBeenCalledWith('team')
  })
})
