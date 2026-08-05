import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WheelPicker, type WheelPickerOption } from './wheel-picker'

afterEach(cleanup)

const options: WheelPickerOption[] = [
  { value: '09', label: '09' },
  { value: '10', label: '10' },
  { value: '11', label: '11' },
  { value: '12', label: '12' },
]

beforeEach(() => {
  vi.useFakeTimers()
  // jsdom has no scrollTo; record the target so the value-sync path is observable.
  Element.prototype.scrollTo = vi.fn(function (this: Element, arg: unknown) {
    const top = (arg as { top?: number } | undefined)?.top
    if (typeof top === 'number')
      Object.defineProperty(this, 'scrollTop', { value: top, configurable: true })
  }) as unknown as Element['scrollTo']
})

afterEach(() => {
  vi.useRealTimers()
})

function wheel(): HTMLElement {
  return screen.getByRole('listbox')
}

function renderPicker(value = '10', onValueChange = vi.fn()) {
  const result = render(
    <WheelPicker ariaLabel="Hour" options={options} value={value} onValueChange={onValueChange} />,
  )
  act(() => {
    vi.runOnlyPendingTimers() // flush the deferred value mirror
  })
  return { ...result, onValueChange }
}

describe('WheelPicker', () => {
  it('renders one option per row inside a labelled listbox', () => {
    renderPicker()
    expect(wheel()).toHaveAccessibleName('Hour')
    expect(screen.getAllByRole('option')).toHaveLength(4)
  })

  it('marks the value as selected and points activedescendant at it', () => {
    renderPicker('11')
    const selected = screen.getByRole('option', { selected: true })
    expect(selected).toHaveTextContent('11')
    expect(wheel().getAttribute('aria-activedescendant')).toBe(selected.id)
  })

  it('moves the selection down with ArrowDown', () => {
    const { onValueChange } = renderPicker('10')
    fireEvent.keyDown(wheel(), { key: 'ArrowDown' })
    expect(onValueChange).toHaveBeenCalledWith('11')
  })

  it('moves the selection up with ArrowUp', () => {
    const { onValueChange } = renderPicker('10')
    fireEvent.keyDown(wheel(), { key: 'ArrowUp' })
    expect(onValueChange).toHaveBeenCalledWith('09')
  })

  it('jumps to the ends with Home and End', () => {
    const { onValueChange } = renderPicker('10')
    fireEvent.keyDown(wheel(), { key: 'End' })
    expect(onValueChange).toHaveBeenCalledWith('12')
    fireEvent.keyDown(wheel(), { key: 'Home' })
    expect(onValueChange).toHaveBeenCalledWith('09')
  })

  it('clamps at the ends rather than wrapping', () => {
    const { onValueChange } = renderPicker('09')
    fireEvent.keyDown(wheel(), { key: 'ArrowUp' })
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('ignores keys it does not handle', () => {
    const { onValueChange } = renderPicker('10')
    fireEvent.keyDown(wheel(), { key: 'a' })
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('commits the centred row once scrolling settles', () => {
    const { onValueChange } = renderPicker('09')
    const column = wheel()
    // Row height defaults to 36px, so 72px centres the third option.
    Object.defineProperty(column, 'scrollTop', { value: 72, configurable: true })
    fireEvent.scroll(column)
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(onValueChange).toHaveBeenCalledWith('11')
  })

  it('does not re-report the value already selected', () => {
    const { onValueChange } = renderPicker('09')
    const column = wheel()
    Object.defineProperty(column, 'scrollTop', { value: 0, configurable: true })
    fireEvent.scroll(column)
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('scrolls to the value it is given', () => {
    renderPicker('12')
    // Fourth option at the default 36px row height.
    expect(Element.prototype.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 108 }))
  })

  it('sizes the wheel from visibleCount and itemHeight', () => {
    const { container } = render(
      <WheelPicker
        ariaLabel="Hour"
        options={options}
        value="09"
        onValueChange={vi.fn()}
        visibleCount={3}
        itemHeight={40}
      />,
    )
    const root = container.firstElementChild as HTMLElement
    expect(root.style.getPropertyValue('--_column-height')).toBe('120px')
    expect(root.style.getPropertyValue('--_pad')).toBe('40px')
  })
})
