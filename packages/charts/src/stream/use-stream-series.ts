'use client'
import {
  computed,
  createStreamBuffer,
  useComputed,
  useSignalEffect,
  type ReadonlySignal,
} from '@cascivo/core'
import { useRef } from 'react'
import { decimate, type DecimateMethod } from '../engine/decimate'

/**
 * A live source: call `push(point)` for each new datum; return an unsubscribe.
 * This is the seam a polling loop, an `EventSource` (SSE), or a WebSocket plugs
 * into — the helper never opens a connection itself.
 */
export type StreamSource<P> = (push: (point: P) => void) => () => void

export interface StreamDecimate<P> {
  /** Cap the rendered point count at this many. */
  to: number
  /** Numeric value used to choose which points to keep. */
  y: (point: P) => number
  /** LTTB (default, shape-preserving) or min-max (spike-preserving). */
  method?: DecimateMethod
}

export interface StreamSeriesOptions<P> {
  /** Maximum retained points. Oldest evicted past this (O(1) ring buffer). */
  capacity: number
  /** The live source feeding the buffer. */
  source: StreamSource<P>
  /** Optionally downsample the window so the rendered series never exceeds `to`. */
  decimate?: StreamDecimate<P>
}

// Decimate by index: encode each point's index as x, downsample on (index, y),
// then map the kept indices back to the original points. LTTB/min-max keep the
// original x (= index) on every emitted point, so the mapping is exact.
function decimateItems<P>(items: readonly P[], conf: StreamDecimate<P>): readonly P[] {
  if (items.length <= conf.to) return items
  const pts = items.map((p, i) => [i, conf.y(p)] as const)
  const kept = decimate(pts, conf.to, conf.method)
  return kept.map(([i]) => items[i]!)
}

/**
 * Feed a live `source` into a bounded, O(1) ring buffer and expose the current
 * window as a signal for `LineChart`/`AreaChart`. Optionally decimate so a fast
 * stream never blows the rendered point count. Component-scoped: the
 * subscription starts on mount and tears down (unsubscribe + cancel flush) on
 * unmount. No `useState`/`useEffect`.
 */
export function useStreamSeries<P>(options: StreamSeriesOptions<P>): ReadonlySignal<readonly P[]> {
  const { capacity, source, decimate: dec } = options
  const bufferRef = useRef(createStreamBuffer<P>({ capacity }))
  const buffer = bufferRef.current

  // Keep the source current without re-subscribing every render.
  const sourceRef = useRef(source)
  sourceRef.current = source

  useSignalEffect(() => {
    const stop = sourceRef.current((p) => buffer.append(p))
    return () => {
      stop()
      buffer.dispose()
    }
  })

  return useComputed(() => (dec ? decimateItems(buffer.signal.value, dec) : buffer.signal.value))
}

export interface BoundStream<P> {
  signal: ReadonlySignal<readonly P[]>
  stop: () => void
}

/**
 * Non-hook form of {@link useStreamSeries} for imperative callers (outside a
 * component). Returns the window signal plus a `stop()` that unsubscribes the
 * source and cancels any pending flush.
 */
export function bindStream<P>(options: StreamSeriesOptions<P>): BoundStream<P> {
  const { capacity, source, decimate: dec } = options
  const buffer = createStreamBuffer<P>({ capacity })
  const unsubscribe = source((p) => buffer.append(p))
  const signal = dec ? computed(() => decimateItems(buffer.signal.value, dec)) : buffer.signal
  return {
    signal,
    stop: () => {
      unsubscribe()
      buffer.dispose()
    },
  }
}
