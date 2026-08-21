/**
 * The smallest frame a chart can sit in — the SVG, its accessible name, and nothing else.
 *
 * `ChartFrame` is a real chart chassis: ResizeObserver sizing, tooltips, voronoi hit-testing,
 * a canvas layer, zoom/pan, a toolbox, PNG/SVG export. `Sparkline` uses about two of those
 * and drags in all of them, which is why `import { Sparkline } from '@cascivo/charts'` costs
 * the whole engine — 44.87 kB / 14.84 kB gzip as an adopter measured it (2026-08-21 red flag
 * 4). A marketing page that wants one trend line pays for pan-and-zoom.
 *
 * This frame exists so `@cascivo/charts/sparkline` can be small. It is deliberately not a
 * general-purpose chassis and should not grow into one: a chart that needs any of the things
 * listed above needs `ChartFrame`, and the size budget in
 * `scripts/checks/sparkline-subpath-size.test.ts` is what stops that decision being made by
 * accident.
 *
 * Two details are load-bearing and must not be "simplified":
 *
 *  - `SR_ONLY` is inlined rather than left to the stylesheet. It mirrors the same constant in
 *    `chart-frame.tsx` for the same reason: it is the only thing hiding the screen-reader
 *    data-table fallback when a consumer has not imported `@cascivo/charts/styles.css`, and
 *    without it the raw x/y table renders visibly under every chart.
 *  - `role="img"` + `aria-label` is the chart's accessible name. A chart with no name is a
 *    bug, which is why `SparklineProps` types the name as required either way.
 *
 * No hooks, and therefore no `'use client'`: this frame renders identically on the server and
 * never hydrates, which is what lets the lite sparkline stay `clientJs: 'none'` like the one
 * it mirrors. `ChartFrame`'s `useId` exists for the `<desc>` link and the tooltip's live
 * region — neither of which is on this path — so adding a hook here would cost the whole
 * subpath its server-safety for nothing.
 */
import type { CSSProperties, ReactNode } from 'react'
import styles from './chart-frame.module.css'

/** Mirrors `SR_ONLY` in chart-frame.tsx — see the note above before touching it. */
const SR_ONLY: CSSProperties = {
  position: 'absolute',
  insetInlineStart: '-9999px',
  inlineSize: '1px',
  blockSize: '1px',
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
}

export interface MiniFrameProps {
  /** The chart's accessible name. Reaches `aria-label`; never painted. */
  title: string
  width: number
  height: number
  className?: string | undefined
  /** Screen-reader data-table equivalent, visually hidden. */
  fallback?: ReactNode
  children: ReactNode
}

export function MiniFrame({ title, width, height, className, fallback, children }: MiniFrameProps) {
  return (
    <div className={[styles['frame'], className].filter(Boolean).join(' ')} data-plain="">
      <svg
        role="img"
        aria-label={title}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
      >
        {children}
      </svg>
      {fallback && (
        <div className={styles['fallback']} style={SR_ONLY}>
          {fallback}
        </div>
      )}
    </div>
  )
}
