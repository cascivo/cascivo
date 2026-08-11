import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Axis } from './axis'
import { timeScale } from '../engine/scale-time'

/*
 * A time axis must label its ticks with something that distinguishes them.
 *
 * `TimeScale.tickFormat()` knew the right Intl options all along and nothing called it, so
 * `Axis` fell through to `defaultFormat`'s `toLocaleDateString()`. Combined with the tick
 * density bug this rendered a 24-hour chart as a single "8/8/2026" — the 2026-08-08 report B
 * symptom. Both halves are asserted here, at the level the adopter actually sees.
 */
const HOUR = 3_600_000
const NOW = Date.UTC(2026, 7, 8, 14, 0)

function labelsOf(container: HTMLElement): string[] {
  // The axis title is also a <text>; ticks live inside the per-tick <g>.
  return [...container.querySelectorAll('g > g > text')].map((n) => n.textContent ?? '')
}

describe('Axis with a time scale', () => {
  it('renders more than one tick across a 24-hour domain', () => {
    const scale = timeScale([new Date(NOW - 24 * HOUR), new Date(NOW)], [0, 800])
    const { container } = render(
      <svg>
        <Axis scale={scale} orientation="x" length={800} tickCount={6} />
      </svg>,
    )
    expect(labelsOf(container).length).toBeGreaterThan(1)
  })

  it('gives each tick a distinct label', () => {
    const scale = timeScale([new Date(NOW - 24 * HOUR), new Date(NOW)], [0, 800])
    const { container } = render(
      <svg>
        <Axis scale={scale} orientation="x" length={800} tickCount={6} />
      </svg>,
    )
    const labels = labelsOf(container)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('an explicit format prop still wins', () => {
    const scale = timeScale([new Date(NOW - 24 * HOUR), new Date(NOW)], [0, 800])
    const { container } = render(
      <svg>
        <Axis
          scale={scale}
          orientation="x"
          length={800}
          tickCount={6}
          format={(v) => `t=${(v as Date).getUTCHours()}`}
        />
      </svg>,
    )
    expect(labelsOf(container).every((l) => l.startsWith('t='))).toBe(true)
  })
})
