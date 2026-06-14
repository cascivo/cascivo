import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useScrollLock } from './scroll-lock'
import { signal } from './signals'

describe('useScrollLock', () => {
  it('locks and restores body overflow via a boolean (locked while mounted)', () => {
    document.body.style.overflow = 'auto'
    const { unmount } = renderHook(() => useScrollLock(true))
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('auto')
  })

  it('reacts to a Signal: locking sets hidden, unlocking restores', () => {
    document.body.style.overflow = 'scroll'
    const locked = signal(false)
    renderHook(() => useScrollLock(locked))
    expect(document.body.style.overflow).toBe('scroll')
    act(() => {
      locked.value = true
    })
    expect(document.body.style.overflow).toBe('hidden')
    act(() => {
      locked.value = false
    })
    expect(document.body.style.overflow).toBe('scroll')
  })
})
