import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useId } from './use-id'

describe('useId', () => {
  it('returns a stable id across rerenders with the default prefix', () => {
    const { result, rerender } = renderHook(() => useId())
    const first = result.current
    expect(first.startsWith('cascivo-')).toBe(true)
    expect(first).not.toContain(':')
    rerender()
    expect(result.current).toBe(first)
  })

  it('honors a custom prefix and is unique across instances', () => {
    const a = renderHook(() => useId('field')).result.current
    const b = renderHook(() => useId('field')).result.current
    expect(a.startsWith('field-')).toBe(true)
    expect(a).not.toBe(b)
  })
})
