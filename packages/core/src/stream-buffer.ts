'use client'
import { useRef } from 'react'
import { signal, useSignalEffect } from './signals.ts'
import type { ReadonlySignal } from './signals.ts'

export interface StreamBufferOptions {
  /** Maximum retained items. Oldest are evicted past this. Must be >= 1. */
  capacity: number
  /**
   * When to publish staged appends to `signal`.
   * - `'raf'` (default): coalesce all appends within an animation frame into a
   *   single `signal` write — one render per frame regardless of append rate.
   * - `'sync'`: publish immediately on every append (deterministic; for tests).
   */
  flush?: 'raf' | 'sync'
}

export interface StreamBuffer<T> {
  /** The current window, oldest-first. A fresh readonly array per flush. */
  readonly signal: ReadonlySignal<readonly T[]>
  /** Append one item. O(1); never reallocates the backing store. */
  append: (item: T) => void
  /** Append many items. O(items). Past `capacity`, only the newest are kept. */
  appendMany: (items: readonly T[]) => void
  /** Drop all items and publish an empty window. */
  clear: () => void
  /** Cancel any pending flush. Call on teardown so no write fires after unmount. */
  dispose: () => void
  /** Current item count (0..capacity). */
  readonly size: number
  /** The configured capacity. */
  readonly capacity: number
}

/**
 * A fixed-capacity ring buffer with O(1) append and once-per-frame flushing —
 * the primitive for high-frequency streams (build logs, live metrics).
 *
 * Memory is O(capacity), not O(total appended): the backing array is allocated
 * once and overwritten in place. A burst of N appends within one animation
 * frame produces a single `signal` write (one render), so ingestion rate is
 * decoupled from render rate.
 *
 * This replaces the O(n)-per-line anti-pattern
 * `logsSignal.value = [...logsSignal.value.slice(1), line]`, which reallocates
 * and re-copies the whole array on every append and renders once per line.
 */
export function createStreamBuffer<T>(options: StreamBufferOptions): StreamBuffer<T> {
  const { capacity, flush = 'raf' } = options
  if (!Number.isInteger(capacity) || capacity < 1) {
    throw new RangeError(`createStreamBuffer: capacity must be an integer >= 1, got ${capacity}`)
  }

  const ring = Array.from({ length: capacity }) as T[]
  let head = 0 // index of the oldest item
  let length = 0 // number of live items

  const view = signal<readonly T[]>([])
  let frame: number | null = null
  let scheduled = false

  const canRaf = typeof requestAnimationFrame !== 'undefined'

  function materialize(): readonly T[] {
    const out: T[] = []
    for (let i = 0; i < length; i++) out.push(ring[(head + i) % capacity] as T)
    return out
  }

  function publish(): void {
    scheduled = false
    frame = null
    view.value = materialize()
  }

  // A `scheduled` flag (not just `frame === null`) keeps coalescing correct even
  // if requestAnimationFrame runs the callback synchronously: publish() clears
  // the flag before this function's `frame = …` assignment lands.
  function schedule(): void {
    if (flush === 'sync' || !canRaf) {
      publish()
      return
    }
    if (!scheduled) {
      scheduled = true
      frame = requestAnimationFrame(publish)
    }
  }

  function pushOne(item: T): void {
    if (length < capacity) {
      ring[(head + length) % capacity] = item
      length++
    } else {
      // Full: overwrite the oldest and advance the window.
      ring[head] = item
      head = (head + 1) % capacity
    }
  }

  return {
    signal: view,
    append(item: T): void {
      pushOne(item)
      schedule()
    },
    appendMany(items: readonly T[]): void {
      if (items.length === 0) return
      // Past capacity, only the newest `capacity` items can survive.
      const start = items.length > capacity ? items.length - capacity : 0
      for (let i = start; i < items.length; i++) pushOne(items[i] as T)
      schedule()
    },
    clear(): void {
      head = 0
      length = 0
      schedule()
    },
    dispose(): void {
      if (frame !== null && canRaf) cancelAnimationFrame(frame)
      frame = null
      scheduled = false
    },
    get size(): number {
      return length
    },
    get capacity(): number {
      return capacity
    },
  }
}

/**
 * Component-scoped {@link createStreamBuffer}. Created once and stable across
 * renders; cancels any pending flush on unmount. Read `buffer.signal.value` in
 * render to subscribe the component to the stream.
 */
export function useStreamBuffer<T>(options: StreamBufferOptions): StreamBuffer<T> {
  const ref = useRef<StreamBuffer<T> | null>(null)
  ref.current ??= createStreamBuffer<T>(options)

  // Cancel a pending frame on unmount so no flush fires after teardown.
  useSignalEffect(() => () => ref.current?.dispose())

  return ref.current
}
