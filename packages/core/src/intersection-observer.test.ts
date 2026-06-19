import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useIntersectionObserver } from './intersection-observer'

let cb: IntersectionObserverCallback | null = null
const observe = vi.fn()
const disconnect = vi.fn()

class MockIntersectionObserver {
  observe = observe
  disconnect = disconnect
  unobserve = vi.fn()
  takeRecords = (): IntersectionObserverEntry[] => []
  root = null
  rootMargin = ''
  thresholds: number[] = []
  constructor(callback: IntersectionObserverCallback) {
    cb = callback
  }
}

const fire = (isIntersecting: boolean): void =>
  cb?.([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver)

beforeEach(() => {
  cb = null
  observe.mockClear()
  disconnect.mockClear()
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
})
afterEach(() => vi.unstubAllGlobals())

describe('useIntersectionObserver', () => {
  it('observes the ref and tracks visibility', () => {
    const el = document.createElement('div')
    const { result } = renderHook(() => {
      const r = useIntersectionObserver<HTMLDivElement>()
      r.ref.current = el
      return r
    })
    expect(observe).toHaveBeenCalledWith(el)
    expect(result.current.isIntersecting.value).toBe(false)
    fire(true)
    expect(result.current.isIntersecting.value).toBe(true)
    expect(result.current.entry.value).not.toBeNull()
    fire(false)
    expect(result.current.isIntersecting.value).toBe(false)
  })

  it('disconnects on unmount', () => {
    const el = document.createElement('div')
    const { unmount } = renderHook(() => {
      const r = useIntersectionObserver<HTMLDivElement>()
      r.ref.current = el
      return r
    })
    unmount()
    expect(disconnect).toHaveBeenCalled()
  })
})
