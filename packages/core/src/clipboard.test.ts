import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useClipboard } from './clipboard'

describe('useClipboard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
  })
  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('writes to the clipboard and toggles copied true then false after the timeout', async () => {
    const { result } = renderHook(() => useClipboard({ timeout: 1000 }))
    expect(result.current.copied.value).toBe(false)

    await act(async () => {
      await result.current.copy('hello')
    })
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello')
    expect(result.current.copied.value).toBe(true)

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.copied.value).toBe(false)
  })
})
