import { describe, expect, it } from 'vitest'
import { durationFromTrace } from './trace.ts'

const ev = (name: string, ts: number, dur: number, type?: string) => ({
  name,
  ts,
  dur,
  ph: 'X',
  args: type ? { data: { type } } : {},
})

describe('durationFromTrace', () => {
  it('measures first matching dispatch to end of last paint event', () => {
    const trace = {
      traceEvents: [
        ev('EventDispatch', 1_000_000, 500, 'click'),
        ev('Layout', 1_001_000, 2000),
        ev('Paint', 1_004_000, 1000),
      ],
    }
    expect(durationFromTrace(trace, 'click')).toBeCloseTo(5) // (1_005_000 - 1_000_000) µs → ms
  })

  it('ignores paint events before the dispatch', () => {
    const trace = {
      traceEvents: [
        ev('Paint', 500_000, 1000),
        ev('EventDispatch', 1_000_000, 500, 'click'),
        ev('Paint', 1_002_000, 500),
      ],
    }
    expect(durationFromTrace(trace, 'click')).toBeCloseTo(2.5)
  })

  it('uses the FIRST matching dispatch (trace is scoped per operation)', () => {
    const trace = {
      traceEvents: [
        ev('EventDispatch', 1_000_000, 100, 'keydown'),
        ev('EventDispatch', 1_010_000, 100, 'keydown'),
        ev('Paint', 1_020_000, 1000),
      ],
    }
    expect(durationFromTrace(trace, 'keydown')).toBeCloseTo(21)
  })

  it('throws when no dispatch or no paint is present', () => {
    expect(() => durationFromTrace({ traceEvents: [ev('Paint', 1, 1)] }, 'click')).toThrow()
    expect(() =>
      durationFromTrace({ traceEvents: [ev('EventDispatch', 1, 1, 'click')] }, 'click'),
    ).toThrow()
  })
})
