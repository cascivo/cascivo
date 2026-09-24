import { fireEvent, render, renderHook, screen } from '@testing-library/react'
import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { useSignalState } from './signal-state.ts'

describe('useSignalState', () => {
  it('starts at the initial value', () => {
    const { result } = renderHook(() => useSignalState(3))
    expect(result.current[0].value).toBe(3)
  })

  it('sets a value and applies an updater to the current one', () => {
    const { result } = renderHook(() => useSignalState(1))
    act(() => result.current[1](5))
    expect(result.current[0].value).toBe(5)
    act(() => result.current[1]((n) => n * 2))
    expect(result.current[0].value).toBe(10)
  })

  it('keeps the setter identity across renders', () => {
    const { result, rerender } = renderHook(() => useSignalState('a'))
    const first = result.current[1]
    act(() => first('b'))
    rerender()
    expect(result.current[1]).toBe(first)
  })

  it('re-renders a plain React component that reads it, with no useSignals() of its own', () => {
    function Counter() {
      const [count, setCount] = useSignalState(0)
      return (
        <button type="button" onClick={() => setCount((n) => n + 1)}>
          Clicked {count.value}
        </button>
      )
    }
    render(<Counter />)
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button').textContent).toBe('Clicked 2')
  })
})
