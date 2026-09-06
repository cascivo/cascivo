'use client'
import { useSignal, useSignals, cn } from '@cascivo/core'
import { useRef } from 'react'
import type { HTMLAttributes } from 'react'
import styles from './editable.module.css'

export interface EditableProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value: string
  onValueChange: (v: string) => void
  placeholder?: string
  /**
   * When true, disables the control and removes it from the tab order.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  disabled?: boolean
  /**
   * When true, commits the edit when the field loses focus.
   *
   * @defaultValue `true`
   * @see the component manifest
   */
  submitOnBlur?: boolean
  onCancel?: () => void
  /**
   * Id for the **focusable control** — the preview button when idle, the text input while
   * editing — rather than the wrapper, so a `<label for>` names what actually takes focus.
   * `Field` supplies this automatically.
   */
  id?: string
  /** Wired automatically by a wrapping `Field` — its label id. */
  'aria-labelledby'?: string
  /** Wired automatically by a wrapping `Field` — the ids of its hint/error text. */
  'aria-describedby'?: string
  /** Wired automatically by a wrapping `Field` when it is in an error state. */
  'aria-invalid'?: boolean
}

/**
 * Focus and select the editor the moment it mounts. A module-level callback ref, not a
 * signal effect: an effect keyed on `isEditing` runs synchronously on the write, before
 * the input exists, so the editor opened without focus.
 */
function focusOnMount(el: HTMLInputElement | null) {
  if (el) {
    el.focus()
    el.select()
  }
}

export function Editable({
  value,
  onValueChange,
  placeholder,
  disabled = false,
  submitOnBlur = true,
  onCancel,
  className,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  tabIndex,
  ...props
}: EditableProps) {
  useSignals()
  const isEditing = useSignal(false)
  const editValue = useSignal(value)
  const onCancelRef = useRef(onCancel)
  onCancelRef.current = onCancel
  const onValueChangeRef = useRef(onValueChange)
  onValueChangeRef.current = onValueChange

  /**
   * Identity belongs on whichever element takes focus, not on the wrapper. `Editable` swaps
   * between a preview button and a text input, so both carry it — otherwise a `Field`'s
   * label and hint would address a `<div>` and name nothing (2026-08-22 report item 16 swept
   * the catalog for this shape).
   */
  const controlAria = {
    id,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    tabIndex,
  }

  // Sync value into editValue when not editing
  if (!isEditing.value) {
    editValue.value = value
  }

  function confirm() {
    onValueChangeRef.current(editValue.value)
    isEditing.value = false
  }

  function cancel() {
    editValue.value = value
    isEditing.value = false
    onCancelRef.current?.()
  }

  if (isEditing.value) {
    return (
      <div className={cn(styles['wrapper'], styles['editing'], className)} {...props}>
        <input
          ref={focusOnMount}
          className={styles['input']}
          {...controlAria}
          value={editValue.value}
          onChange={(e) => {
            editValue.value = e.currentTarget.value
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              confirm()
            } else if (e.key === 'Escape') {
              e.preventDefault()
              cancel()
            }
          }}
          onBlur={() => {
            if (submitOnBlur) {
              confirm()
            } else {
              cancel()
            }
          }}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(styles['wrapper'], className)}
      data-disabled={disabled ? '' : undefined}
      {...props}
    >
      <button
        type="button"
        className={styles['preview']}
        {...controlAria}
        disabled={disabled}
        onClick={() => {
          if (!disabled) isEditing.value = true
        }}
      >
        <span className={styles['preview-text']}>
          {value || <span className={styles['placeholder']}>{placeholder}</span>}
        </span>
        <span className={styles['edit-icon']} aria-hidden="true" />
      </button>
    </div>
  )
}
