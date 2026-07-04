'use client'
import { linearScale } from '@cascivo/charts'
import type { BookLevel } from '../data/seed'
import styles from './Orderbook.module.css'

interface DepthBarsProps {
  bids: BookLevel[]
  asks: BookLevel[]
}

const ROW_H = 10

/** A mirrored cumulative depth histogram: bids grow left, asks grow right. */
export function DepthBars({ bids, asks }: DepthBarsProps) {
  const cum = (levels: BookLevel[]): number[] => {
    let running = 0
    return levels.map((l) => (running += l.size))
  }
  const bidCum = cum(bids)
  const askCum = cum(asks)
  const max = Math.max(1, bidCum[bidCum.length - 1] ?? 0, askCum[askCum.length - 1] ?? 0)
  // Map a cumulative size to a half-width (0–50% of the viewBox).
  const half = linearScale([0, max], [0, 50])
  const rows = Math.max(bids.length, asks.length)
  const height = rows * ROW_H

  return (
    <svg
      className={styles['depth']}
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      role="presentation"
    >
      {bidCum.map((c, i) => {
        const w = half.map(c)
        return (
          <rect
            key={`b${i}`}
            x={50 - w}
            y={i * ROW_H}
            width={w}
            height={ROW_H - 1}
            fill="var(--cascivo-color-success-subtle)"
          />
        )
      })}
      {askCum.map((c, i) => {
        const w = half.map(c)
        return (
          <rect
            key={`a${i}`}
            x={50}
            y={i * ROW_H}
            width={w}
            height={ROW_H - 1}
            fill="var(--cascivo-color-error-subtle)"
          />
        )
      })}
    </svg>
  )
}
