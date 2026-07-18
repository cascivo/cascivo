'use client'
import { cn, useSignal, useSignalEffect } from '@cascivo/core'
import { useRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import styles from './checkbox.module.css'

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  indeterminate?: boolean
}

export function Checkbox({
  label,
  indeterminate = false,
  className,
  id,
  disabled,
  ...props
}: CheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isIndeterminate = useSignal(indeterminate)
  isIndeterminate.value = indeterminate

  useSignalEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = isIndeterminate.value
  })

  const checkboxId =
    id ?? (label ? `cascade-checkbox-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)

  return (
    <label className={cn(styles['wrapper'], className)} data-disabled={disabled || undefined}>
      <input
        ref={inputRef}
        id={checkboxId}
        type="checkbox"
        className={styles['input']}
        disabled={disabled}
        {...props}
      />
      <span className={styles['control']} aria-hidden="true" />
      {label && <span className={styles['label']}>{label}</span>}
    </label>
  )
}
