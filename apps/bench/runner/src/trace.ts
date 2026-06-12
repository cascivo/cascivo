type TraceEvent = {
  name: string
  ts: number
  dur?: number
  args?: { data?: { type?: string } }
}

export type Trace = { traceEvents: TraceEvent[] }

const PAINT_EVENTS = new Set(['Paint', 'Commit', 'CompositeLayers', 'Layout', 'UpdateLayerTree'])

/**
 * Duration in ms from the first EventDispatch of `dispatchType` to the end of the last
 * paint-cluster event after it. Mirrors js-framework-benchmark's trace-based measurement:
 * captures style/layout/paint, not just JS time.
 */
export function durationFromTrace(trace: Trace, dispatchType: 'click' | 'keydown'): number {
  const dispatch = trace.traceEvents.find(
    (e) => e.name === 'EventDispatch' && e.args?.data?.type === dispatchType,
  )
  if (!dispatch) throw new Error(`no EventDispatch(${dispatchType}) in trace`)
  const end = trace.traceEvents
    .filter((e) => PAINT_EVENTS.has(e.name) && e.ts >= dispatch.ts)
    .reduce((max, e) => Math.max(max, e.ts + (e.dur ?? 0)), 0)
  if (end === 0) throw new Error(`no paint events after EventDispatch(${dispatchType})`)
  return (end - dispatch.ts) / 1000
}
