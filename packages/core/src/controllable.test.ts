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

  /*
   * The primitive mirrors a controlled prop with a render-phase signal write, which is the
   * same shape that made `DataTable` warn under React 19 (2026-08-08 report A). Because it
   * is the sanctioned replacement for every hand-rolled mirror in the catalog, it has to be
   * demonstrably clean rather than assumed clean — a fix that relocates the warning into the
   * primitive would spread the defect to every call site instead of removing it.
   */
  it('controlled: a parent-driven value change logs no React error', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const { rerender } = renderHook(
        ({ value }: { value: string }) => {
          const [sig] = useControllableSignal({ value })
          return sig.value // read in render — the subscribing case
        },
        { initialProps: { value: 'x' } },
      )
      rerender({ value: 'y' })
      rerender({ value: 'z' })
      const text = errorSpy.mock.calls.map((c) => c.map(String).join(' ')).join('\n')
      expect(text).not.toMatch(/while rendering a different component/i)
      expect(text).toBe('')
    } finally {
      errorSpy.mockRestore()
    }
  })

  it('controlled: an unchanged value does not notify subscribers', () => {
    const seen: string[] = []
    const { rerender } = renderHook(
      ({ value }: { value: string }) => {
        const [sig] = useControllableSignal({ value })
        seen.push(sig.value)
        return sig.value
      },
      { initialProps: { value: 'x' } },
    )
    const before = seen.length
    rerender({ value: 'x' })
    // A re-render with the same value must not cascade into extra renders.
    expect(seen.length).toBeLessThanOrEqual(before + 1)
  })
})
