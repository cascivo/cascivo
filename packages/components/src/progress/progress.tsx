import styles from './progress.module.css'

export type ProgressVariant = 'primary' | 'info' | 'success' | 'warning' | 'error'
export type ProgressSize = 'sm' | 'md' | 'lg'

export interface ProgressProps {
  /** 0–100. Omit for indeterminate state. */
  value?: number
  /**
   * Colour of the fill: `primary` (the accent) or a severity tone — `info`, `success`,
   * `warning`, `error`.
   *
   * @defaultValue `primary`
   * @see the component manifest
   */
  variant?: ProgressVariant
  size?: ProgressSize
  /**
   * Invisible accessible name. `ariaLabel` is the catalog convention (see the
   * accessible-name table in `docs/AI-RULES.md`); the DOM spelling `aria-label` is accepted
   * too, so either guess compiles. Two spellings of one idea inside a package was a coin
   * flip on every component.
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
  /** DOM-spelled alias of {@link ariaLabel}. */
  'aria-label'?: string
  'aria-describedby'?: string
  className?: string
}

export function Progress({
  value,
  variant = 'primary',
  size = 'md',
  className,
  ariaLabel,
  label,
  ...aria
}: ProgressProps) {
  return (
    <progress
      aria-label={aria['aria-label'] ?? ariaLabel ?? label}
      className={[styles['progress'], className].filter(Boolean).join(' ')}
      data-variant={variant}
      data-size={size}
      value={value}
      max={value !== undefined ? 100 : undefined}
      {...aria}
    />
  )
}
