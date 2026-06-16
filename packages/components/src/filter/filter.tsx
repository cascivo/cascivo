'use client'
import { useControllableSignal, useSignals } from '@cascivo/core'
import styles from './filter.module.css'

export type FilterVariant = 'pill' | 'outline'

export interface FilterOption {
  label: string
  value: string
}

export interface FilterProps {
  options: FilterOption[]
  value?: string[]
  defaultValue?: string[]
  onChange?: (selected: string[]) => void
  multi?: boolean
  variant?: FilterVariant
  'aria-label'?: string
  className?: string
}

export function Filter({
  options,
  value,
  defaultValue = [],
  onChange,
  multi = false,
  variant = 'pill',
  className,
  ...aria
}: FilterProps) {
  useSignals()
  const [selected, setSelected] = useControllableSignal<string[]>({
    value,
    defaultValue,
    onChange,
  })

  function toggle(val: string) {
    const current = selected.value
    let next: string[]
    if (multi) {
      next = current.includes(val) ? current.filter((v) => v !== val) : [...current, val]
    } else {
      next = current.includes(val) ? [] : [val]
    }
    setSelected(next)
  }

  return (
    <div
      role="group"
      className={[styles['filter'], className].filter(Boolean).join(' ')}
      data-variant={variant}
      {...aria}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={styles['item']}
          data-selected={selected.value.includes(opt.value) || undefined}
          onClick={() => toggle(opt.value)}
          aria-pressed={selected.value.includes(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
