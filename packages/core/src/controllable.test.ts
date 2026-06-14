import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useControllableSignal } from './controllable'

describe('useControllableSignal', () => {
  it('uncontrolled: owns state seeded from defaultValue and updates locally', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useControllableSignal({ defaultValue: 'a', onChange }))
    expect(result.current[0].value).toBe('a')
    act(() => result.current[1]('b'))
    expect(result.current[0].value).toBe('b')
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('controlled: mirrors the prop and does not mutate locally on setValue', () => {
    const onChange = vi.fn()
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useControllableSignal({ value, onChange }),
      { initialProps: { value: 'x' } },
    )
    expect(result.current[0].value).toBe('x')
    // setValue routes through onChange but does NOT change the signal (parent owns it)
    act(() => result.current[1]('y'))
    expect(onChange).toHaveBeenCalledWith('y')
    expect(result.current[0].value).toBe('x')
    // prop change propagates into the signal
    rerender({ value: 'z' })
    expect(result.current[0].value).toBe('z')
  })

  it('uncontrolled with no defaultValue starts undefined', () => {
    const { result } = renderHook(() => useControllableSignal<string | undefined>({}))
    expect(result.current[0].value).toBeUndefined()
  })
})
