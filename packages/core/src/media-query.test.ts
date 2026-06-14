import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useMediaQuery } from './media-query'

type ChangeHandler = (event: { matches: boolean }) => void

function mockMatchMedia(initialMatches: boolean) {
  let handler: ChangeHandler | null = null
  const mql = {
    matches: initialMatches,
    addEventListener: (_: string, h: ChangeHandler) => {
      handler = h
    },
    removeEventListener: () => {
      handler = null
    },
  }
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => mql),
  )
  return {
    emit(matches: boolean) {
      mql.matches = matches
      handler?.({ matches })
    },
  }
}

afterEach(() => vi.unstubAllGlobals())

describe('useMediaQuery', () => {
  it('seeds from matchMedia and updates on change events', () => {
    const mm = mockMatchMedia(false)
    const { result } = renderHook(() => useMediaQuery('(min-width: 48rem)'))
    expect(result.current.value).toBe(false)
    act(() => mm.emit(true))
    expect(result.current.value).toBe(true)
  })

  it('defaults to false when matchMedia is unavailable (SSR-safe)', () => {
    vi.stubGlobal('matchMedia', undefined)
    const { result } = renderHook(() => useMediaQuery('(min-width: 48rem)'))
    expect(result.current.value).toBe(false)
  })
})
