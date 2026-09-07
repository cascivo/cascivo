'use client'
import { cn } from '@cascivo/core'
import type { HTMLAttributes } from 'react'
import styles from './segmented-control.module.css'

export interface SegmentedControlOption {
  label: string
  value: string
  /**
   * When true, disables the control and removes it from the tab order.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  disabled?: boolean
}

export interface SegmentedControlProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  options: SegmentedControlOption[]
  value: string
  onValueChange: (v: string) => void
  size?: 'sm' | 'md' | 'lg'
  /**
   * Accessible name for the group. Invisible — it names the `role="group"`, it renders
   * nothing.
   *
   * This component extended `HTMLAttributes` and nothing else, so it took the raw DOM
   * `aria-label` while every sibling in the catalog took `ariaLabel` — the one control in an
   * adopter's filter toolbar where the catalog spelling was a type error (2026-08-31 report
   * §21). Both spellings work now; the raw `aria-label` still wins if you pass both.
   */
  ariaLabel?: string
  /** Alias of `ariaLabel` — same invisible accessible name, the other spelling. Not rendered. */
  label?: string
  /**
   * When true, disables the control and removes it from the tab order.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  disabled?: boolean
}

export function SegmentedControl({
  options,
  value,
  onValueChange,
  size = 'md',
  disabled = false,
  ariaLabel,
  label,
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
      aria-label={ariaLabel ?? label}
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
