import { cn } from '@cascivo/core'
import type { Ref } from 'react'
import type { Token } from '../engine/types.ts'
import hl from './highlight/highlight.module.css'

/**
 * A visual decoration: a `[start, end)` column range on a given line tagged with a
 * CSS class. The overlay layer splits token spans at decoration boundaries and adds
 * the class to the covered slice. Used internally for search matches and bracket
 * pairs, and exposed publicly via the editor's `decorations` prop.
 */
export interface Decoration {
  line: number
  start: number
  end: number
  className: string
}

/** Combine the decoration classes covering column `col` on a line. */
function classesAt(col: number, decos: readonly Decoration[]): string {
  let out = ''
  for (const d of decos) {
    if (col >= d.start && col < d.end) out = out ? `${out} ${d.className}` : d.className
  }
  return out
}

/** Render a single token, split into decorated sub-spans where decorations overlap it. */
function renderToken(tok: Token, col: number, decos: readonly Decoration[], key: number) {
  const end = col + tok.value.length
  // Cut points where decoration coverage changes within this token.
  const cuts = new Set<number>([col, end])
  for (const d of decos) {
    if (d.start > col && d.start < end) cuts.add(d.start)
    if (d.end > col && d.end < end) cuts.add(d.end)
  }
  if (cuts.size === 2) {
    const deco = classesAt(col, decos)
    return (
      <span key={key} className={deco ? cn(hl[tok.kind], deco) : hl[tok.kind]}>
        {tok.value}
      </span>
    )
  }
  const points = [...cuts].sort((a, b) => a - b)
  const parts = []
  for (let k = 0; k < points.length - 1; k++) {
    const a = points[k] as number
    const b = points[k + 1] as number
    const deco = classesAt(a, decos)
    parts.push(
      <span key={a} className={deco ? cn(hl[tok.kind], deco) : hl[tok.kind]}>
        {tok.value.slice(a - col, b - col)}
      </span>,
    )
  }
  // eslint-disable-next-line react/no-array-index-key -- positional fragment key
  return <span key={key}>{parts}</span>
}

/**
 * Render a slice of tokenized lines as block rows of colored `<span>`s. Shared by
 * `Highlight` and `CodeEditor` so the highlight grid is identical in each, and so
 * `CodeEditor` can render only the visible window. Keys are absolute line indices
 * (stable across scrolling). Empty lines emit a zero-width space to keep height.
 *
 * `decorations` (optional) tags column ranges with extra CSS classes; lines without
 * any decoration take the original fast path, so `Highlight` is unaffected.
 */
export function renderRows(
  lines: readonly Token[][],
  start = 0,
  end = lines.length,
  decorations?: readonly Decoration[],
) {
  const rows = []
  for (let i = start; i < end; i++) {
    const tokens = lines[i] as Token[]
    const lineDecos = decorations?.filter((d) => d.line === i)
    rows.push(
      <span key={i} className={hl['line']}>
        {tokens.length === 0
          ? '​'
          : lineDecos && lineDecos.length > 0
            ? (() => {
                let col = 0
                return tokens.map((tok, j) => {
                  const node = renderToken(tok, col, lineDecos, j)
                  col += tok.value.length
                  return node
                })
              })()
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
