import { afterEach, describe, expect, it, vi } from 'vitest'
import { createStreamBuffer } from './stream-buffer.ts'

afterEach(() => vi.unstubAllGlobals())

describe('createStreamBuffer (sync)', () => {
  it('appends oldest-first', () => {
    const b = createStreamBuffer<number>({ capacity: 4, flush: 'sync' })
    b.append(1)
    b.append(2)
    b.append(3)
    expect(b.signal.value).toEqual([1, 2, 3])
    expect(b.size).toBe(3)
    expect(b.capacity).toBe(4)
  })

  it('evicts the oldest past capacity, keeping the last `capacity` items', () => {
    const b = createStreamBuffer<number>({ capacity: 3, flush: 'sync' })
    for (const n of [1, 2, 3, 4, 5]) b.append(n)
    expect(b.signal.value).toEqual([3, 4, 5])
    expect(b.size).toBe(3)
  })

  it('appendMany with more than capacity keeps only the newest', () => {
    const b = createStreamBuffer<number>({ capacity: 3, flush: 'sync' })
    b.appendMany([1, 2, 3, 4, 5, 6])
    expect(b.signal.value).toEqual([4, 5, 6])
  })

  it('appendMany mixes with prior appends and still evicts correctly', () => {
    const b = createStreamBuffer<number>({ capacity: 3, flush: 'sync' })
    b.append(1)
    b.appendMany([2, 3, 4])
    expect(b.signal.value).toEqual([2, 3, 4])
  })

  it('clear empties the window', () => {
    const b = createStreamBuffer<number>({ capacity: 3, flush: 'sync' })
    b.appendMany([1, 2, 3])
    b.clear()
    expect(b.signal.value).toEqual([])
    expect(b.size).toBe(0)
  })

  it('throws on invalid capacity', () => {
    expect(() => createStreamBuffer<number>({ capacity: 0 })).toThrow(RangeError)
    expect(() => createStreamBuffer<number>({ capacity: -1 })).toThrow(RangeError)
    expect(() => createStreamBuffer<number>({ capacity: 1.5 })).toThrow(RangeError)
  })

  it('stays bounded under a high-frequency append loop', () => {
    const b = createStreamBuffer<number>({ capacity: 1000, flush: 'sync' })
    for (let i = 0; i < 200_000; i++) b.append(i)
    expect(b.size).toBe(1000)
    const view = b.signal.value
    expect(view.length).toBe(1000)
    expect(view[0]).toBe(199_000)
    expect(view[999]).toBe(199_999)
  })
})

describe('createStreamBuffer (raf coalescing)', () => {
  it('publishes once per frame for a burst of appends', () => {
    let cb: FrameRequestCallback | null = null
    const raf = vi.fn((fn: FrameRequestCallback) => {
      cb = fn
      return 1
    })
    vi.stubGlobal('requestAnimationFrame', raf)
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    const b = createStreamBuffer<number>({ capacity: 10, flush: 'raf' })
    let writes = 0
    b.signal.subscribe(() => writes++) // initial subscribe fires once
    const base = writes

    b.append(1)
    b.append(2)
    b.append(3)
    // Nothing published yet — one frame is scheduled.
    expect(raf).toHaveBeenCalledTimes(1)
    expect(writes - base).toBe(0)

    cb?.(0)
    expect(writes - base).toBe(1)
    expect(b.signal.value).toEqual([1, 2, 3])
  })

  it('falls back to sync when requestAnimationFrame is unavailable', () => {
    vi.stubGlobal('requestAnimationFrame', undefined)
    const b = createStreamBuffer<number>({ capacity: 10, flush: 'raf' })
    b.append(1)
    expect(b.signal.value).toEqual([1])
  })

  it('dispose cancels a pending frame', () => {
    const cancel = vi.fn()
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 42),
    )
    vi.stubGlobal('cancelAnimationFrame', cancel)
    const b = createStreamBuffer<number>({ capacity: 10, flush: 'raf' })
    b.append(1)
    b.dispose()
    expect(cancel).toHaveBeenCalledWith(42)
  })
})
