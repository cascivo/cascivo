import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useSignals } from './signals'
import { useRovingFocus, type RovingOrientation } from './roving-focus'

afterEach(cleanup)

function Toolbar({
  count = 3,
  orientation = 'horizontal',
  loop = false,
}: {
  count?: number
  orientation?: RovingOrientation
  loop?: boolean
}) {
  useSignals()
  const roving = useRovingFocus({ orientation, loop })
  return (
    <div>
      {Array.from({ length: count }, (_, i) => {
        const { ref, ...props } = roving.getItemProps(i)
        return (
          <button key={i} type="button" ref={ref} data-testid={`item-${i}`} {...props}>
            {i}
          </button>
        )
      })}
    </div>
  )
}

describe('useRovingFocus', () => {
  it('only the active item is tabbable', () => {
    const { getByTestId } = render(<Toolbar />)
    expect(getByTestId('item-0').tabIndex).toBe(0)
    expect(getByTestId('item-1').tabIndex).toBe(-1)
    expect(getByTestId('item-2').tabIndex).toBe(-1)
  })

  it('ArrowRight moves focus and tabIndex (horizontal)', () => {
    const { getByTestId } = render(<Toolbar />)
    fireEvent.keyDown(getByTestId('item-0'), { key: 'ArrowRight' })
    expect(document.activeElement).toBe(getByTestId('item-1'))
    expect(getByTestId('item-1').tabIndex).toBe(0)
    expect(getByTestId('item-0').tabIndex).toBe(-1)
  })

  it('does not move past the end without loop', () => {
    const { getByTestId } = render(<Toolbar />)
    fireEvent.keyDown(getByTestId('item-2'), { key: 'ArrowRight' })
    // index 2 is last; clamps to 2
    expect(document.activeElement).toBe(getByTestId('item-2'))
  })

  it('loops from last to first when loop=true', () => {
    const { getByTestId } = render(<Toolbar loop />)
    fireEvent.keyDown(getByTestId('item-2'), { key: 'ArrowRight' })
    expect(document.activeElement).toBe(getByTestId('item-0'))
  })

  it('Home and End jump to the ends', () => {
    const { getByTestId } = render(<Toolbar />)
    fireEvent.keyDown(getByTestId('item-0'), { key: 'End' })
    expect(document.activeElement).toBe(getByTestId('item-2'))
    fireEvent.keyDown(getByTestId('item-2'), { key: 'Home' })
    expect(document.activeElement).toBe(getByTestId('item-0'))
  })

  it('vertical orientation uses ArrowDown/ArrowUp', () => {
    const { getByTestId } = render(<Toolbar orientation="vertical" />)
    fireEvent.keyDown(getByTestId('item-0'), { key: 'ArrowRight' })
    expect(document.activeElement).not.toBe(getByTestId('item-1'))
    fireEvent.keyDown(getByTestId('item-0'), { key: 'ArrowDown' })
    expect(document.activeElement).toBe(getByTestId('item-1'))
  })
})
