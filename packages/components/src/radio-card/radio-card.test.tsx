import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RadioCard, RadioCardGroup } from './radio-card'

describe('RadioCardGroup', () => {
  function Plans({ onChange = () => {} }: { onChange?: (v: string) => void }) {
    return (
      <RadioCardGroup name="plan" defaultValue="pro" onValueChange={onChange} label="Plan">
        <RadioCard value="free" title="Free" description="For hobbyists" />
        <RadioCard value="pro" title="Pro" description="For professionals" />
        <RadioCard value="team" title="Team" description="For teams" />
      </RadioCardGroup>
    )
  }

  it('renders native radios with shared name', () => {
    render(<Plans />)
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(3)
    expect(radios[0]).toHaveAttribute('name', 'plan')
  })

  it('defaultValue checks the matching card', () => {
    render(<Plans />)
    expect(screen.getByRole('radio', { name: /pro/i })).toBeChecked()
  })

  it('clicking a card selects it and fires onValueChange', async () => {
    const onChange = vi.fn()
    render(<Plans onChange={onChange} />)
    await userEvent.click(screen.getByText('Team'))
    expect(screen.getByRole('radio', { name: /team/i })).toBeChecked()
    expect(onChange).toHaveBeenCalledWith('team')
  })

  it('arrow keys move selection (native roving)', async () => {
    render(<Plans />)
    screen.getByRole('radio', { name: /pro/i }).focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('radio', { name: /team/i })).toBeChecked()
  })

  it('supports controlled value', async () => {
    const { rerender } = render(
      <RadioCardGroup name="x" value="a" onValueChange={() => {}} label="X">
        <RadioCard value="a" title="A" />
        <RadioCard value="b" title="B" />
      </RadioCardGroup>,
    )
    expect(screen.getByRole('radio', { name: /a/i })).toBeChecked()
    rerender(
      <RadioCardGroup name="x" value="b" onValueChange={() => {}} label="X">
        <RadioCard value="a" title="A" />
        <RadioCard value="b" title="B" />
      </RadioCardGroup>,
    )
    expect(screen.getByRole('radio', { name: /b/i })).toBeChecked()
  })

  it('disabled card cannot be selected', async () => {
    render(
      <RadioCardGroup name="d" label="D">
        <RadioCard value="a" title="A" />
        <RadioCard value="b" title="B" disabled />
      </RadioCardGroup>,
    )
    await userEvent.click(screen.getByText('B'))
    expect(screen.getByRole('radio', { name: /b/i })).not.toBeChecked()
  })
})
