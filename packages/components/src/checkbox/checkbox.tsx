'use client'
import { cn, composeRefs, useEffectPropSignal, useSignalEffect } from '@cascivo/core'
import { forwardRef, useRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import styles from './checkbox.module.css'

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  /**
   * Invisible accessible name, for when a visible element outside this component already
   * labels it (a heading in a settings row, a table column header) and `label` would render
   * that text a second time.
   *
   * `label` on this component is **visible** — it is painted next to the control. The catalog
   * splits that way deliberately, but `IconButton.label` and `Sparkline.label` are invisible
   * names, so an adopter arriving with that prior writes `label` here and gets the text twice
   * (2026-08-22 report item 13). Both props are now listed side by side, each saying which it
   * is, which is the only thing that interrupts a confident wrong guess.
   *
   * The raw DOM `aria-label` is still accepted and wins over this.
   */
  ariaLabel?: string
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
  { label, indeterminate = false, ariaLabel, className, id, disabled, ...props },
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
        aria-label={props['aria-label'] ?? ariaLabel}
      />
      <span className={styles['control']} aria-hidden="true" />
      {label && <span className={styles['label']}>{label}</span>}
    </label>
  )
})
