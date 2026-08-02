import { useSignal, useSignals } from '@cascivo/core'
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
  ...aria
}: SwapProps) {
  useSignals()
  const isChecked = useSignal(checked)
  isChecked.value = checked

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
      {...(ariaLabel !== undefined ? { 'aria-label': ariaLabel } : {})}
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
