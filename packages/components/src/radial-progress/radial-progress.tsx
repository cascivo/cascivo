import { useId } from 'react'
import styles from './radial-progress.module.css'

export type RadialProgressSize = 'sm' | 'md' | 'lg'
export type RadialProgressVariant = 'primary' | 'info' | 'success' | 'warning' | 'error'

export interface RadialProgressProps {
  value: number
  size?: RadialProgressSize
  /**
   * Colour of the ring: `primary` (the accent) or a severity tone — `info`, `success`,
   * `warning`, `error`.
   *
   * @defaultValue `primary`
   * @see the component manifest
   */
  variant?: RadialProgressVariant
  children?: React.ReactNode
  /**
   * Invisible accessible name. The catalog convention (see the item-identity table in
   * `docs/AI-RULES.md`); `aria-label` is accepted as an alias for the DOM spelling.
   */
  ariaLabel?: string
  /**
   * Alias of `ariaLabel` — same invisible accessible name, the other spelling. Not rendered.
   *
   * `ariaLabel` is the catalog convention and stays preferred, but `label` is the guess an
   * adopter makes when they have not read the convention, and an unaccepted guess costs a
   * compile cycle for nothing (2026-08-21 report item 1). Pass either.
   */
  label?: string
  'aria-label'?: string
  className?: string
}

export function RadialProgress({
  value,
  size = 'md',
  variant = 'primary',
  children,
  className,
  ariaLabel,
  label: labelProp,
  ...aria
}: RadialProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const labelId = useId()
  // progressbar takes its name from the author only — visible text doesn't
  // count. Name it from its own label span unless the caller passed aria-label.
  const resolvedAriaLabel = ariaLabel ?? labelProp
  const hasAriaLabel = Boolean(resolvedAriaLabel ?? aria['aria-label'])
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-labelledby={hasAriaLabel ? undefined : labelId}
      className={[styles.radialProgress, className].filter(Boolean).join(' ')}
      data-size={size}
      data-variant={variant}
      style={
        { '--cascivo-radial-progress': clamped } as React.CSSProperties & {
          '--cascivo-radial-progress': number
        }
      }
      {...aria}
      {...(resolvedAriaLabel !== undefined ? { 'aria-label': resolvedAriaLabel } : {})}
    >
      <span id={labelId} className={styles.label}>
        {children ?? `${clamped}%`}
      </span>
    </div>
  )
}
