import type { Ref } from 'react'
import type { Token } from '../engine/types.ts'
import hl from './highlight/highlight.module.css'

/**
 * Render tokenized lines as block rows of colored `<span>`s. Shared by both
 * `Highlight` and `CodeEditor` so the highlight grid is identical in each. Empty
 * lines emit a zero-width space so blank rows keep their height.
 */
export function renderLines(lines: readonly Token[][]) {
  return lines.map((tokens, i) => (
    // eslint-disable-next-line react/no-array-index-key -- rows are positional
    <span key={i} className={hl['line']}>
      {tokens.length === 0
        ? '​'
        : tokens.map((tok, j) => (
            // eslint-disable-next-line react/no-array-index-key -- spans are positional
            <span key={j} className={hl[tok.kind]}>
              {tok.value}
            </span>
          ))}
    </span>
  ))
}

interface GutterProps {
  count: number
  className: string | undefined
  gutterRef?: Ref<HTMLDivElement> | undefined
}

/** The `aria-hidden` line-number column, 1…count, using the shared row metrics. */
export function Gutter({ count, className, gutterRef }: GutterProps) {
  const numbers = []
  for (let n = 1; n <= count; n++) {
    numbers.push(
      <span key={n} className={hl['gutterLine']}>
        {n}
      </span>,
    )
  }
  return (
    <div ref={gutterRef} className={className} aria-hidden="true">
      {numbers}
    </div>
  )
}
