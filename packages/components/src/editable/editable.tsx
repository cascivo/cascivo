'use client'
import { useSignal, useSignalEffect, useSignals, cn } from '@cascivo/core'
import { useRef } from 'react'
import type { HTMLAttributes } from 'react'
import styles from './editable.module.css'

export interface EditableProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value: string
  onValueChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
  submitOnBlur?: boolean
  onCancel?: () => void
}

export function Editable({
  value,
  onValueChange,
  placeholder,
  disabled = false,
  submitOnBlur = true,
  onCancel,
  className,
  ...props
}: EditableProps) {
  useSignals()
  const isEditing = useSignal(false)
  const editValue = useSignal(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const onCancelRef = useRef(onCancel)
  onCancelRef.current = onCancel
  const onValueChangeRef = useRef(onValueChange)
  onValueChangeRef.current = onValueChange

  // Sync value into editValue when not editing
  if (!isEditing.value) {
    editValue.value = value
  }

  // Focus input when editing starts
  useSignalEffect(() => {
    if (isEditing.value) {
      // Use a microtask to focus after render
      const input = inputRef.current
      if (input) {
        input.focus()
        input.select()
      }
    }
  })

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
          ref={inputRef}
          className={styles['input']}
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
