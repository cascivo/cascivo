'use client'
import { useControllableSignal, useSignals } from '@cascivo/core'
import styles from './swap.module.css'

export type SwapMode = 'rotate' | 'flip'

export interface SwapProps {
  on: React.ReactNode
  off: React.ReactNode
  /**
   * Whether the control is checked (controlled).
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  checked?: boolean
  /** Called with the new checked state when the swap is toggled. */
  onValueChange?: (checked: boolean) => void
  /** @deprecated Use `onValueChange` — it receives the same `checked` boolean. */
  onChange?: (checked: boolean) => void
  mode?: SwapMode
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

export function Swap({
  on,
  off,
  checked = false,
  onValueChange,
  onChange,
  mode = 'rotate',
  className,
  ariaLabel,
  label,
  ...aria
}: SwapProps) {
  useSignals()
  // Controlled mirror goes through the shared primitive: a bare `sig.value = prop` in render
  // notifies the previous render's subscriptions, which React 19 reports as a setState during
  // render (2026-08-08 report A). The primitive skips the write when the value is unchanged.
  const [isChecked] = useControllableSignal<boolean>({ value: checked })

  function handleClick() {
    const next = !isChecked.value
    ;(onValueChange ?? onChange)?.(next)
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked.value}
      className={[styles.swap, className].filter(Boolean).join(' ')}
      data-checked={isChecked.value || undefined}
      data-mode={mode}
      onClick={handleClick}
      {...aria}
      {...((ariaLabel ?? label) !== undefined ? { 'aria-label': ariaLabel ?? label } : {})}
    >
      <span className={styles.on} aria-hidden="true">
        {on}
      </span>
      <span className={styles.off} aria-hidden="true">
        {off}
      </span>
    </button>
  )
}
