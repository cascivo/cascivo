import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useResizeObserver } from './resize-observer'

let cb: ResizeObserverCallback | null = null
const observe = vi.fn()
const disconnect = vi.fn()

class MockResizeObserver {
  observe = observe
  disconnect = disconnect
  unobserve = vi.fn()
  constructor(callback: ResizeObserverCallback) {
    cb = callback
  }
}

const fire = (width: number, height: number): void =>
  cb?.([{ contentRect: { width, height } } as ResizeObserverEntry], {} as ResizeObserver)

beforeEach(() => {
  cb = null
  observe.mockClear()
  disconnect.mockClear()
  vi.stubGlobal('ResizeObserver', MockResizeObserver)
})
afterEach(() => vi.unstubAllGlobals())

describe('useResizeObserver', () => {
  it('observes the ref and exposes the latest size', () => {
    const el = document.createElement('div')
    const { result } = renderHook(() => {
      const r = useResizeObserver<HTMLDivElement>()
      r.ref.current = el
      return r
    })
    expect(observe).toHaveBeenCalledWith(el, undefined)
    expect(result.current.size.value).toBeNull()
    fire(120, 40)
    expect(result.current.size.value).toEqual({ width: 120, height: 40 })
    expect(result.current.entry.value).not.toBeNull()
  })

  it('passes the box option through', () => {
    const el = document.createElement('div')
    renderHook(() => {
      const r = useResizeObserver<HTMLDivElement>({ box: 'border-box' })
      r.ref.current = el
      return r
    })
    expect(observe).toHaveBeenCalledWith(el, { box: 'border-box' })
  })

  it('disconnects on unmount', () => {
    const el = document.createElement('div')
    const { unmount } = renderHook(() => {
      const r = useResizeObserver<HTMLDivElement>()
      r.ref.current = el
      return r
    })
    unmount()
    expect(disconnect).toHaveBeenCalled()
  })
})
