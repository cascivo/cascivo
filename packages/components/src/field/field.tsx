import { cn, useId } from '@cascivo/core/pure'
import { Children, cloneElement, isValidElement } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { Label } from '../label/label'
import styles from './field.module.css'

const warnedDoubleLabel = new Set<string>()

/** True unless the build's NODE_ENV is 'production'. Read via `globalThis` so the
 * browser-facing source needs no `@types/node`, and it's safe where `process` is
 * absent (bundlers replace `process.env.NODE_ENV` in app builds). */
function isDev(): boolean {
  const env = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env
  return env?.NODE_ENV !== 'production'
}

/**
 * Dev-only, deduped warning: a `Field` and its child control both defining a
 * `label` double-labels the control. Safe in the browser and in a bare-Node SSR
 * loader; a module Set keeps it to one warning per label text.
 */
function warnIfDoubleLabel(fieldLabel: ReactNode, child: ReactElement): void {
  if (!isDev()) return
  if (fieldLabel == null) return
  const childLabel = (child.props as { label?: unknown }).label
  if (childLabel == null) return
  const key = String(fieldLabel)
  if (warnedDoubleLabel.has(key)) return
  warnedDoubleLabel.add(key)
  console.warn(
    `cascivo Field: both the Field and its child control define a \`label\` ` +
      `(${key}). Omit the child's \`label\` inside a Field — it renders a second ` +
      `<label> for the same control. The Field owns the label.`,
  )
}

const warnedDoubleHint = new Set<string>()

/**
 * Dev-only, deduped warning: a `Field` supplying supporting text while its child control also
 * supplies a `hint` renders two paragraphs under one control, and only the Field's is wired
 * into `aria-describedby` — so the second is invisible to a screen reader and visible to
 * everyone else. Sibling of `warnIfDoubleLabel`; the split between `description` and `hint`
 * is exactly what makes this easy to do by accident (2026-08-21 report item 4).
 */
function warnIfDoubleHint(supporting: ReactNode, child: ReactElement): void {
  if (!isDev()) return
  if (supporting == null) return
  const childHint = (child.props as { hint?: unknown }).hint
  if (childHint == null) return
  const key = String(supporting)
  if (warnedDoubleHint.has(key)) return
  warnedDoubleHint.add(key)
  console.warn(
    `cascivo Field: both the Field and its child control define supporting text ` +
      `(${key}). Omit the child's \`hint\` inside a Field — the Field owns it, and only the ` +
      "Field's is wired into aria-describedby.",
  )
}

export interface FieldProps {
  /** Label text for the control. */
  label?: ReactNode
  /**
   * Helper text under the control, wired via `aria-describedby`.
   *
   * `hint` is the same thing under the name the eight form controls use (`Input.hint`,
   * `Select.hint`, …); `Field` predates that split and shipped `description`, which is the
   * catalog's word for the body text of a *feedback* component (`Alert`, `Notification`).
   * Both work here and neither is deprecated (2026-08-21 report item 4). When both are
   * passed, `description` wins.
   */
  description?: ReactNode
  /** Alias of `description` — the name the form controls use for the same text. */
  hint?: ReactNode
  /** Error message; sets aria-invalid on the control and is announced via role="alert". */
  error?: ReactNode
  /**
   * When true, marks the field as required.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  required?: boolean
  /**
   * When true, disables the control and removes it from the tab order.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  disabled?: boolean
  /** Explicit id for the control; auto-generated when omitted. */
  id?: string
  /** The single form control element. */
  children: ReactElement<{
    id?: string
    'aria-labelledby'?: string
    'aria-describedby'?: string
    'aria-invalid'?: boolean
    disabled?: boolean
  }>
  className?: string
}

export function Field({
  label,
  description,
  hint,
  error,
  required = false,
  disabled = false,
  id,
  children,
  className,
}: FieldProps) {
  const supporting = description ?? hint
  const generatedId = useId('cascade-field')
  const controlId = id ?? generatedId
  const descriptionId = `${controlId}-description`
  const errorId = `${controlId}-error`
  const labelId = `${controlId}-label`

  const describedBy =
    [supporting ? descriptionId : null, error ? errorId : null].filter(Boolean).join(' ') ||
    undefined

  const controlProps: {
    id: string
    'aria-labelledby'?: string
    'aria-describedby'?: string
    'aria-invalid'?: boolean
    disabled?: boolean
  } = { id: controlId }
  /**
   * Point the control at this Field's `<Label>` explicitly, in addition to the `<label for>`
   * association.
   *
   * For a native control the two say the same thing, so nothing changes. For a composite one
   * it is the unambiguous signal that something outside is naming it — which is what lets
   * `TagsInput`, `Search`, `ColorPicker` and friends drop their built-in fallback name only
   * when a Field really is labelling them, instead of guessing from the presence of an `id`
   * (which would leave a standalone `<Search id="q"/>` with no name at all).
   *
   * `aria-labelledby` outranks `aria-label`, so this also fixes the case where a control's
   * hardcoded `aria-label` was silently beating its Field's label (2026-08-22 report item 16).
   */
  if (label != null) controlProps['aria-labelledby'] = labelId
  if (describedBy) controlProps['aria-describedby'] = describedBy
  if (error) controlProps['aria-invalid'] = true
  if (disabled || children.props.disabled) controlProps.disabled = true

  if (isValidElement(children)) {
    warnIfDoubleLabel(label, children)
    warnIfDoubleHint(supporting, children)
  }

  const control = isValidElement(children)
    ? cloneElement(Children.only(children) as ReactElement<typeof controlProps>, controlProps)
    : children

  return (
    <div className={cn(styles['field'], className)} data-disabled={disabled ? '' : undefined}>
      {label && (
        <Label id={labelId} htmlFor={controlId} required={required} disabled={disabled}>
          {label}
        </Label>
      )}
      {control}
      {supporting && (
        <p id={descriptionId} className={styles['description']}>
          {supporting}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className={styles['error']}>
          {error}
        </p>
      )}
    </div>
  )
}
