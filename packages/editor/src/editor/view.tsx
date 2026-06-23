import type { Ref } from 'react'
import type { Token } from '../engine/types.ts'
import hl from './highlight/highlight.module.css'

/**
 * Render a slice of tokenized lines as block rows of colored `<span>`s. Shared by
 * `Highlight` and `CodeEditor` so the highlight grid is identical in each, and so
 * `CodeEditor` can render only the visible window. Keys are absolute line indices
 * (stable across scrolling). Empty lines emit a zero-width space to keep height.
 */
export function renderRows(lines: readonly Token[][], start = 0, end = lines.length) {
  const rows = []
  for (let i = start; i < end; i++) {
    const tokens = lines[i] as Token[]
    rows.push(
      <span key={i} className={hl['line']}>
        {tokens.length === 0
          ? '​'
          : tokens.map((tok, j) => (
              // eslint-disable-next-line react/no-array-index-key -- spans are positional
              <span key={j} className={hl[tok.kind]}>
                {tok.value}
              </span>
            ))}
      </span>,
    )
  }
  return rows
}

interface GutterProps {
  /** Total line count (the gutter always numbers 1…count). */
  count: number
  className: string | undefined
  gutterRef?: Ref<HTMLDivElement> | undefined
  /** Windowed range — render only [start, end) with spacers (CodeEditor). */
  start?: number
  end?: number
  topPad?: number
  bottomPad?: number
}

/** The `aria-hidden` line-number column, optionally windowed with spacers. */
export function Gutter({
  count,
  className,
  gutterRef,
  start = 0,
  end = count,
  topPad = 0,
  bottomPad = 0,
}: GutterProps) {
  const numbers = []
  for (let n = start + 1; n <= end; n++) {
    numbers.push(
      <span key={n} className={hl['gutterLine']}>
        {n}
      </span>,
    )
  }
  return (
    <div ref={gutterRef} className={className} aria-hidden="true">
      {topPad > 0 && <div style={{ blockSize: topPad }} />}
      {numbers}
      {bottomPad > 0 && <div style={{ blockSize: bottomPad }} />}
    </div>
  )
}
