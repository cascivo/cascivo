import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToggleGroup, type ToggleGroupItem } from './toggle-group'

afterEach(cleanup)

const alignItems: ToggleGroupItem[] = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
]

describe('ToggleGroup', () => {
  it('renders single mode as a radiogroup of radios', () => {
    render(<ToggleGroup type="single" items={alignItems} />)
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(3)
  })

  it('renders multiple mode as a group of pressable buttons', () => {
    render(<ToggleGroup type="multiple" items={alignItems} aria-label="Format" />)
    expect(screen.getByRole('group', { name: 'Format' })).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(3)
  })

  it('reflects defaultValue selection in single mode', () => {
    render(<ToggleGroup type="single" defaultValue="center" items={alignItems} />)
    expect(screen.getByRole('radio', { name: 'Center' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Left' })).toHaveAttribute('aria-checked', 'false')
  })

  it('selects a value and fires onValueChange (single)', async () => {
    const onValueChange = vi.fn()
    render(<ToggleGroup type="single" items={alignItems} onValueChange={onValueChange} />)
    await userEvent.click(screen.getByRole('radio', { name: 'Right' }))
    expect(onValueChange).toHaveBeenCalledWith('right')
    expect(screen.getByRole('radio', { name: 'Right' })).toHaveAttribute('aria-checked', 'true')
  })

  it('clears selection when the active single item is clicked again', async () => {
    const onValueChange = vi.fn()
    render(
      <ToggleGroup
        type="single"
        defaultValue="left"
        items={alignItems}
        onValueChange={onValueChange}
      />,
    )
    await userEvent.click(screen.getByRole('radio', { name: 'Left' }))
    expect(onValueChange).toHaveBeenCalledWith('')
  })

  it('toggles multiple independent values', async () => {
    const onValueChange = vi.fn()
    render(<ToggleGroup type="multiple" items={alignItems} onValueChange={onValueChange} />)
    const buttons = screen.getAllByRole('button')
    await userEvent.click(buttons[0]!)
    expect(onValueChange).toHaveBeenLastCalledWith(['left'])
    await userEvent.click(buttons[2]!)
    expect(onValueChange).toHaveBeenLastCalledWith(['left', 'right'])
    await userEvent.click(buttons[0]!)
    expect(onValueChange).toHaveBeenLastCalledWith(['right'])
    expect(buttons[0]!).toHaveAttribute('aria-pressed', 'false')
    expect(buttons[2]!).toHaveAttribute('aria-pressed', 'true')
  })

  it('sets data-state on each item', () => {
    render(<ToggleGroup type="single" defaultValue="center" items={alignItems} />)
    expect(screen.getByRole('radio', { name: 'Center' })).toHaveAttribute('data-state', 'on')
    expect(screen.getByRole('radio', { name: 'Left' })).toHaveAttribute('data-state', 'off')
  })

  it('disables individual items and the whole group', () => {
    render(
      <ToggleGroup
        type="multiple"
        items={[
          { value: 'a', label: 'A', disabled: true },
          { value: 'b', label: 'B' },
        ]}
      />,
    )
    expect(screen.getByRole('button', { name: 'A' })).toBeDisabled()

    cleanup()
    render(<ToggleGroup type="multiple" disabled items={alignItems} />)
    screen.getAllByRole('button').forEach((b) => expect(b).toBeDisabled())
  })

  it('moves focus across items with arrow keys (roving)', async () => {
    render(<ToggleGroup type="single" items={alignItems} />)
    const radios = screen.getAllByRole('radio')
    radios[0]!.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(radios[1]).toHaveFocus()
    await userEvent.keyboard('{End}')
    expect(radios[2]).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    expect(radios[0]).toHaveFocus()
  })

  it('is controlled by value', async () => {
    const onValueChange = vi.fn()
    render(
      <ToggleGroup type="single" value="left" items={alignItems} onValueChange={onValueChange} />,
    )
    await userEvent.click(screen.getByRole('radio', { name: 'Right' }))
    // Controlled: parent owns state, so selection does not change locally.
    expect(onValueChange).toHaveBeenCalledWith('right')
    expect(screen.getByRole('radio', { name: 'Left' })).toHaveAttribute('aria-checked', 'true')
  })
})
