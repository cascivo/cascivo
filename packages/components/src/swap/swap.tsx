import { useSignal, useSignals } from '@cascivo/core'
import styles from './swap.module.css'

export type SwapMode = 'rotate' | 'flip'

export interface SwapProps {
  on: React.ReactNode
  off: React.ReactNode
  checked?: boolean
  /** Called with the new checked state when the swap is toggled. */
  onValueChange?: (checked: boolean) => void
  /** @deprecated Use `onValueChange` — it receives the same `checked` boolean. */
  onChange?: (checked: boolean) => void
  mode?: SwapMode
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
