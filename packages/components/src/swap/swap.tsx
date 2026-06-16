import { useSignal, useSignals } from '@cascivo/core'
import styles from './swap.module.css'

export type SwapMode = 'rotate' | 'flip'

export interface SwapProps {
  on: React.ReactNode
  off: React.ReactNode
  checked?: boolean
  onChange?: (checked: boolean) => void
  mode?: SwapMode
  'aria-label'?: string
  className?: string
}

export function Swap({
  on,
  off,
  checked = false,
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
    onChange?.(next)
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
