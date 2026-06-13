'use client'
import { createMachine, useMachine, cn } from '@cascivo/core'
import type { TextareaHTMLAttributes } from 'react'
import styles from './textarea.module.css'

const machine = createMachine({
  initial: 'idle' as const,
  states: {
    idle: { on: { FOCUS: 'focused' } },
    focused: { on: { BLUR: 'idle' } },
  },
})

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
  resize?: 'none' | 'vertical' | 'both'
}

export function Textarea({
  label,
  hint,
  error,
  resize = 'vertical',
  rows = 4,
  className,
  id,
  onFocus,
  onBlur,
  ...props
}: TextareaProps) {
  const [state, send] = useMachine(machine)
  const textareaId =
    id ?? (label ? `cascade-textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)

  return (
    <div
      className={cn(styles['wrapper'], className)}
      data-state={error ? 'error' : state.value}
      data-resize={resize}
    >
      {label && (
        <label className={styles['label']} htmlFor={textareaId}>
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        aria-multiline="true"
        className={styles['textarea']}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
        onFocus={(e) => {
          send('FOCUS')
          onFocus?.(e)
        }}
        onBlur={(e) => {
          send('BLUR')
          onBlur?.(e)
        }}
        {...props}
      />
      {error && (
        <span id={`${textareaId}-error`} className={styles['error']} role="alert">
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={`${textareaId}-hint`} className={styles['hint']}>
          {hint}
        </span>
      )}
    </div>
  )
}
