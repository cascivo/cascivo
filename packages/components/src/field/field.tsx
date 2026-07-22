'use client'
import { cn, useId } from '@cascivo/core'
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

export interface FieldProps {
  /** Label text for the control. */
  label?: ReactNode
  /** Helper text describing the control, wired via aria-describedby. */
  description?: ReactNode
  /** Error message; sets aria-invalid on the control and is announced via role="alert". */
  error?: ReactNode
  /** Marks the field required (forwarded to the Label marker). */
  required?: boolean
  /** Dims the label and is forwarded to the cloned control. */
  disabled?: boolean
  /** Explicit id for the control; auto-generated when omitted. */
  id?: string
  /** The single form control element. */
  children: ReactElement<{
    id?: string
    'aria-describedby'?: string
    'aria-invalid'?: boolean
    disabled?: boolean
  }>
  className?: string
}

export function Field({
  label,
  description,
  error,
  required = false,
  disabled = false,
  id,
  children,
  className,
}: FieldProps) {
  const generatedId = useId('cascade-field')
  const controlId = id ?? generatedId
  const descriptionId = `${controlId}-description`
  const errorId = `${controlId}-error`

  const describedBy =
    [description ? descriptionId : null, error ? errorId : null].filter(Boolean).join(' ') ||
    undefined

  const controlProps: {
    id: string
    'aria-describedby'?: string
    'aria-invalid'?: boolean
    disabled?: boolean
  } = { id: controlId }
  if (describedBy) controlProps['aria-describedby'] = describedBy
  if (error) controlProps['aria-invalid'] = true
  if (disabled || children.props.disabled) controlProps.disabled = true

  if (isValidElement(children)) warnIfDoubleLabel(label, children)

  const control = isValidElement(children)
    ? cloneElement(Children.only(children) as ReactElement<typeof controlProps>, controlProps)
    : children

  return (
    <div className={cn(styles['field'], className)} data-disabled={disabled ? '' : undefined}>
      {label && (
        <Label htmlFor={controlId} required={required} disabled={disabled}>
          {label}
        </Label>
      )}
      {control}
      {description && (
        <p id={descriptionId} className={styles['description']}>
          {description}
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
