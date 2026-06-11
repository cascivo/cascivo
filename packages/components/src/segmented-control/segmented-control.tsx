'use client'
import { cn } from '@cascade-ui/core'
import type { HTMLAttributes } from 'react'
import styles from './segmented-control.module.css'

export interface SegmentedControlOption {
  label: string
  value: string
  disabled?: boolean
}

export interface SegmentedControlProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  options: SegmentedControlOption[]
  value: string
  onValueChange: (v: string) => void
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

export function SegmentedControl({
  options,
  value,
  onValueChange,
  size = 'md',
  disabled = false,
  className,
  ...props
}: SegmentedControlProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const enabledOptions = options.filter((o) => !o.disabled)
    const currentEnabled = enabledOptions.findIndex((o) => o.value === options[index]?.value)
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const next = enabledOptions[(currentEnabled + 1) % enabledOptions.length]
      if (next) onValueChange(next.value)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const prev =
        enabledOptions[(currentEnabled - 1 + enabledOptions.length) % enabledOptions.length]
      if (prev) onValueChange(prev.value)
    }
  }

  return (
    <div
      role="group"
      className={cn(styles['wrapper'], className)}
      data-size={size}
      data-disabled={disabled ? '' : undefined}
      {...props}
    >
      {options.map((opt, i) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={opt.value === value}
          data-selected={opt.value === value ? '' : undefined}
          data-size={size}
          className={styles['segment']}
          disabled={disabled || opt.disabled}
          onClick={() => {
            if (!opt.disabled) onValueChange(opt.value)
          }}
          onKeyDown={(e) => handleKeyDown(e, i)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
