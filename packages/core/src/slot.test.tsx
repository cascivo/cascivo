import { cleanup, render } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Slot } from './slot'

afterEach(cleanup)

describe('Slot', () => {
  it('merges props from Slot and child onto the rendered element', () => {
    const { getByRole } = render(
      <Slot data-slot="yes" aria-label="from-slot">
        <button type="button" data-child="yes">
          Click
        </button>
      </Slot>,
    )
    const btn = getByRole('button')
    expect(btn.getAttribute('data-slot')).toBe('yes')
    expect(btn.getAttribute('data-child')).toBe('yes')
    expect(btn.getAttribute('aria-label')).toBe('from-slot')
  })

  it('unions className and merges style', () => {
    const { getByRole } = render(
      <Slot className="slot-cls" style={{ color: 'red', margin: 0 }}>
        <button type="button" className="child-cls" style={{ margin: 4 }}>
          x
        </button>
      </Slot>,
    )
    const btn = getByRole('button')
    expect(btn.className).toBe('slot-cls child-cls')
    expect(btn.style.color).toBe('red')
    // child wins on conflicting style keys
    expect(btn.style.margin).toBe('4px')
  })

  it('chains event handlers (slot first, then child)', () => {
    const calls: string[] = []
    const onSlot = vi.fn(() => calls.push('slot'))
    const onChild = vi.fn(() => calls.push('child'))
    const { getByRole } = render(
      <Slot onClick={onSlot}>
        <button type="button" onClick={onChild}>
          x
        </button>
      </Slot>,
    )
    getByRole('button').click()
    expect(onSlot).toHaveBeenCalledOnce()
    expect(onChild).toHaveBeenCalledOnce()
    expect(calls).toEqual(['slot', 'child'])
  })

  it('composes refs so both Slot and child refs receive the node', () => {
    const slotRef = createRef<HTMLButtonElement>()
    const childRef = createRef<HTMLButtonElement>()
    render(
      <Slot ref={slotRef}>
        <button type="button" ref={childRef}>
          x
        </button>
      </Slot>,
    )
    expect(slotRef.current).toBeInstanceOf(HTMLButtonElement)
    expect(childRef.current).toBe(slotRef.current)
  })

  it('throws on non-element children', () => {
    expect(() => render(<Slot>plain text</Slot>)).toThrow(/valid React element/)
  })

  it('throws on multiple children', () => {
    expect(() =>
      render(
        <Slot>
          <span>a</span>
          <span>b</span>
        </Slot>,
      ),
    ).toThrow(/valid React element/)
  })
})
