'use client'
import { createMachine, useMachine, cn } from '@cascivo/core'
import { forwardRef } from 'react'
import type { CSSProperties, TextareaHTMLAttributes } from 'react'
import styles from './textarea.module.css'

const machine = createMachine({
  initial: 'idle' as const,
  states: {
    idle: { on: { FOCUS: 'focused' } },
    focused: { on: { BLUR: 'idle' } },
  },
})

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
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
  hint?: string
  error?: string
  resize?: 'none' | 'vertical' | 'both'
  /**
   * Grow the control with its content instead of holding the fixed rows height. rows becomes
   * the minimum and --cascivo-textarea-max-block-size (default 20lh) the ceiling. Pure CSS
   * (field-sizing: content) — no measurement and no listener; where unsupported the fixed
   * rows height is kept.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  autosize?: boolean
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
  {
    label,
    hint,
    error,
    resize = 'vertical',
    autosize = false,
    rows = 4,
    ariaLabel,
    className,
    id,
    onFocus,
    onBlur,
    ...props
  },
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
      data-autosize={autosize ? '' : undefined}
      style={autosize ? ({ ['--_rows' as string]: String(rows) } as CSSProperties) : undefined}
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
        aria-label={props['aria-label'] ?? ariaLabel}
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
