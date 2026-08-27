'use client'
import { useRef, useState } from 'react'
import { signal, useMediaQuery, useSignalEffect, useSignals } from '@cascivo/core'
import type { Signal } from '@cascivo/core'
import { partial } from './figures'

/*
 * Signals against re-render, measured on this page.
 *
 * Both panels show the same 30-cell grid and take the same tick: every 700ms,
 * every 10th cell gets a new number. The left panel gives each cell its own
 * signal, so a tick re-renders exactly the three cells whose value changed. The
 * right panel is the usual `useState` wiring — one array in the parent, so a
 * tick re-renders all thirty.
 *
 * The counters are instrumented, not written down: each cell tallies its own
 * renders past the first and publishes the running total. `useState` here is the
 * comparison subject — the one sanctioned hook exception on this page, the same
 * one the perf page's SignalsDemo carries.
 *
 * Every component below is split so that *nothing that reads a counter also
 * renders a cell*. Reading the tally in the same component that maps the grid
 * makes the measurement its own input: publishing a total re-renders the grid,
 * which bumps the total, forever.
 */

const CELLS = 30
const STRIDE = 10
const TICK_MS = 700

/** One signal per cell. `blip` flips on every touch so the CSS flash restarts. */
type Cell = { v: number; blip: boolean }
const cellSignals: Signal<Cell>[] = Array.from({ length: CELLS }, (_, i) =>
  signal<Cell>({ v: i + 1, blip: false }),
)

/** Drives the `useState` panel: the tick index the whole grid is rendered from. */
const tick = signal(0)
const running = signal(false)

// Running tallies. Cells mutate the plain counters during render (a measurement
// instrument, not app state) and publish once per microtask, so a burst of 30
// cell renders costs one signal write rather than thirty.
const totals = { signal: 0, state: 0 }
const signalRenders = signal(0)
const stateRenders = signal(0)
let flushQueued = false

function bump(which: 'signal' | 'state') {
  totals[which]++
  if (flushQueued) return
  flushQueued = true
  queueMicrotask(() => {
    flushQueued = false
    signalRenders.value = totals.signal
    stateRenders.value = totals.state
  })
}

/** Tally every render past mount — mount is setup, not an update. */
function useRenderTally(which: 'signal' | 'state') {
  const mounted = useRef(false)
  if (mounted.current) bump(which)
  else mounted.current = true
}

function SignalCell({ cell }: { cell: Signal<Cell> }) {
  useSignals()
  useRenderTally('signal')
  const { v, blip } = cell.value
  return (
    <span className="pg-cell" data-blip={blip ? 'a' : 'b'}>
      {v}
    </span>
  )
}

function StateCell({ value }: { value: number }) {
  useRenderTally('state')
  return <span className="pg-cell">{value}</span>
}

/** Subscribes to nothing, so it renders once and never re-renders its cells. */
function SignalGrid() {
  return (
    <div className="pg-cell-grid">
      {cellSignals.map((cell, i) => (
        <SignalCell key={i} cell={cell} />
      ))}
    </div>
  )
}

/** The `useState` twin: one array in the parent, so every tick repaints all 30. */
function StateGrid() {
  useSignals()
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [values, setValues] = useState(() => Array.from({ length: CELLS }, (_, i) => i + 1))

  useSignalEffect(() => {
    const t = tick.value
    if (t === 0) return
    setValues((prev) => prev.map((v, i) => (i % STRIDE === (t - 1) % STRIDE ? v + 1 : v)))
  })

  return (
    <div className="pg-cell-grid">
      {values.map((v, i) => (
        <StateCell key={i} value={v} />
      ))}
    </div>
  )
}

/** Isolated so publishing a tally never re-renders a grid. */
function RenderCount({ of }: { of: Signal<number> }) {
  useSignals()
  return <span>{of.value} renders</span>
}

function advance() {
  const next = tick.value + 1
  const offset = (next - 1) % STRIDE
  for (let i = offset; i < CELLS; i += STRIDE) {
    const cell = cellSignals[i]
    if (cell) cell.value = { v: cell.value.v + 1, blip: !cell.value.blip }
  }
  tick.value = next
}

/** Isolated so toggling the loop never re-renders a grid either. */
function TickButton() {
  useSignals()
  // Reduced motion gets one tick on demand and holds it — never a loop.
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)').value

  useSignalEffect(() => {
    if (!running.value || reduceMotion) return
    const id = setInterval(advance, TICK_MS)
    return () => clearInterval(id)
  })

  const live = running.value && !reduceMotion
  return (
    <button
      type="button"
      className="pg-btn pg-btn--mono pg-reactivity-btn"
      aria-pressed={live}
      onClick={() => {
        if (reduceMotion) advance()
        else running.value = !running.value
      }}
    >
      {live ? 'Stop the update loop' : 'Update every 10th row'}
    </button>
  )
}

export function PosterReactivity() {
  return (
    <section
      className="pg-section pg-cols pg-cols--5-7"
      id="signals"
      aria-label="Reactivity — interactions commit once"
    >
      <div className="pg-pad">
        <p className="pg-eyebrow">03 / reactivity</p>
        <h2 className="pg-display pg-display--section pg-reactivity-head">
          Interactions
          <br />
          commit once
        </h2>
        <p className="pg-body pg-reactivity-body">
          Fine-grained signals write state past React&apos;s reconciler. A component re-renders only
          when its own data changes — measured on the benchmark page, not claimed.
        </p>
        {partial && (
          <p className="pg-figure">
            <span className="pg-figure-value">{partial.speedup.toFixed(1)}×</span>
            <span className="pg-figure-label">
              faster partial updates — {partial.cascivoMs} ms vs {partial.shadcnMs} ms, every 10th
              row of 1,000
            </span>
          </p>
        )}
        <TickButton />
      </div>

      <div className="pg-panels">
        <div className="pg-panel">
          <p className="pg-panel-head">
            <span>signals</span>
            <RenderCount of={signalRenders} />
          </p>
          <SignalGrid />
        </div>
        <div className="pg-panel">
          <p className="pg-panel-head pg-invert">
            <span>re-render</span>
            <RenderCount of={stateRenders} />
          </p>
          <StateGrid />
        </div>
      </div>
    </section>
  )
}
