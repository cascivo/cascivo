import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { bindStream, type StreamSource } from './use-stream-series.ts'

interface Pt {
  x: number
  y: number
}

beforeEach(() => {
  // Flush synchronously so each append publishes immediately.
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0)
    return 0
  })
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})
afterEach(() => vi.unstubAllGlobals())

describe('bindStream', () => {
  it('caps the window at capacity, keeping the newest points', () => {
    let push!: (p: Pt) => void
    const source: StreamSource<Pt> = (p) => {
      push = p
      return () => {}
    }
    const { signal, stop } = bindStream<Pt>({ capacity: 3, source })
    for (let i = 0; i < 6; i++) push({ x: i, y: i })
    expect(signal.value.map((p) => p.x)).toEqual([3, 4, 5])
    stop()
  })

  it('decimates the window so the rendered count never exceeds `to`', () => {
    let push!: (p: Pt) => void
    const source: StreamSource<Pt> = (p) => {
      push = p
      return () => {}
    }
    const { signal, stop } = bindStream<Pt>({
      capacity: 1000,
      source,
      decimate: { to: 50, y: (p) => p.y },
    })
    for (let i = 0; i < 1000; i++) push({ x: i, y: Math.sin(i) })
    expect(signal.value.length).toBeLessThanOrEqual(50)
    // First and last points are always preserved by LTTB.
    expect(signal.value[0]!.x).toBe(0)
    expect(signal.value.at(-1)!.x).toBe(999)
    stop()
  })

  it('returns the full window when below the decimation threshold', () => {
    let push!: (p: Pt) => void
    const source: StreamSource<Pt> = (p) => {
      push = p
      return () => {}
    }
    const { signal, stop } = bindStream<Pt>({
      capacity: 1000,
      source,
      decimate: { to: 50, y: (p) => p.y },
    })
    for (let i = 0; i < 10; i++) push({ x: i, y: i })
    expect(signal.value.length).toBe(10)
    stop()
  })

  it('stop() unsubscribes the source', () => {
    const unsubscribe = vi.fn()
    const source: StreamSource<Pt> = () => unsubscribe
    const { stop } = bindStream<Pt>({ capacity: 5, source })
    stop()
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })
})
