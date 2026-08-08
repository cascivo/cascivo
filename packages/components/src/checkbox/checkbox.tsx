'use client'
import { cn, composeRefs, useEffectPropSignal, useSignalEffect } from '@cascivo/core'
import { forwardRef, useRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import styles from './checkbox.module.css'

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  /**
   * When true, renders the mixed/indeterminate state.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  indeterminate?: boolean
}

/**
 * `forwardRef` so `ref` reaches the underlying `<input>` — and so it is TYPED. See
 * `textarea.tsx` for the full rationale (2026-07-28 report C10): the ref already worked at
 * runtime under React 19, but nothing declared it, so passing one was a `ts(2322)` and every
 * consumer had to cast. `forwardRef` rather than a bare `ref?: Ref<T>` prop keeps the
 * `react >= 18` peer floor honest, since ref-as-prop does not work there.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, indeterminate = false, className, id, disabled, ...props },
  ref,
) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isIndeterminate = useEffectPropSignal(indeterminate)

  useSignalEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = isIndeterminate.value
  })

  const checkboxId =
    id ?? (label ? `cascade-checkbox-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)

  return (
    <label className={cn(styles['wrapper'], className)} data-disabled={disabled || undefined}>
      {/* Checkbox drives `indeterminate` through its own inputRef, so the forwarded ref is
          COMPOSED with it rather than replacing it — a plain `ref={ref}` would silently
          break the indeterminate state. */}
      <input
        ref={composeRefs(ref, inputRef)}
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
})
