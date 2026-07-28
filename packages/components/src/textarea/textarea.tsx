'use client'
import { createMachine, useMachine, cn } from '@cascivo/core'
import { forwardRef } from 'react'
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

/**
 * `forwardRef` so `ref` reaches the underlying `<textarea>` — and so it is TYPED.
 *
 * Under React 19 the ref already arrived at runtime (it is passed as an ordinary prop and
 * spread onto the element), but no component declared it, so `<Textarea ref={r} />` was a
 * `ts(2322)` and every consumer needing the element had to cast. One needed it for caret
 * restoration in a collaborative editor and kept the cast quarantined in its own file
 * (2026-07-28 report C10).
 *
 * `forwardRef` rather than adding `ref?: Ref<T>` to the props interface: the peer floor is
 * `react >= 18`, where ref-as-prop does NOT work — a bare type declaration would compile
 * and silently hand back `null` there. This keeps the floor honest on both majors, and
 * matches `IconButton`, which already used it.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, resize = 'vertical', rows = 4, className, id, onFocus, onBlur, ...props },
  ref,
) {
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
        ref={ref}
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
})
