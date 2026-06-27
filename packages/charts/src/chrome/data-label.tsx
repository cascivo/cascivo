'use client'
import type { ReactNode } from 'react'

/**
 * Opt-in value labels printed at each mark. `true` uses the defaults; an object
 * tunes the formatter and placement. Labels are decorative (`aria-hidden`) — the
 * value is already in the a11y tree via the fallback table and the aria-live tooltip.
 */
export type LabelOptions =
  | boolean
  | {
      /** Format the raw value (default: `toLocaleString`). */
      format?: (value: number) => string
      /** Where to place the label relative to its mark. `auto` flips above→inside when it won't fit. */
      position?: 'auto' | 'above' | 'inside' | 'outside'
    }

export interface ResolvedLabelOptions {
  format: (value: number) => string
  position: 'auto' | 'above' | 'inside' | 'outside'
}

const defaultFormat = (v: number): string => v.toLocaleString()

/** Normalize the `labels` prop into resolved options, or `null` when disabled. */
export function resolveLabels(labels: LabelOptions | undefined): ResolvedLabelOptions | null {
  if (!labels) return null
  if (labels === true) return { format: defaultFormat, position: 'auto' }
  return { format: labels.format ?? defaultFormat, position: labels.position ?? 'auto' }
}

export interface DataLabelProps {
  x: number
  y: number
  text: string
  /** `muted` for inside-the-mark labels (on a colored fill), default otherwise. */
  tone?: 'default' | 'muted'
  anchor?: 'start' | 'middle' | 'end'
}

/** A single decorative value label. Always `aria-hidden` (value is in the a11y tree elsewhere). */
export function DataLabel({
  x,
  y,
  text,
  tone = 'default',
  anchor = 'middle',
}: DataLabelProps): ReactNode {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontSize="0.6875rem"
      fontWeight={500}
      fill={
        tone === 'muted' ? 'var(--cascivo-color-background)' : 'var(--cascivo-color-foreground)'
      }
      aria-hidden="true"
      data-data-label=""
      style={{ pointerEvents: 'none' }}
    >
      {text}
    </text>
  )
}
