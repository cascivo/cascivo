'use client'
import { cn, Slot } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import type { LabelHTMLAttributes, ReactNode } from 'react'
import styles from './label.module.css'

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /** Renders into the child element (Slot composition) instead of a native `<label>`. */
  asChild?: boolean
  /** Shows a required marker after the label text. */
  required?: boolean
  /** Dims the label to match an associated disabled control. */
  disabled?: boolean
  children: ReactNode
  /** Override built-in strings (e.g. the required-marker accessible text). */
  labels?: { required?: string }
}

export function Label({
  asChild = false,
  required = false,
  disabled = false,
  className,
  children,
  labels,
  ...props
}: LabelProps) {
  const Comp = asChild ? Slot : 'label'
  const requiredText = labels?.required ?? t(builtin.label.required)

  const marker = required ? (
    <>
      <span className={styles['marker']} aria-hidden="true">
        *
      </span>
      <span className={styles['srOnly']}>{requiredText}</span>
    </>
  ) : null

  return (
    <Comp
      data-disabled={disabled ? '' : undefined}
      className={cn(styles['label'], className)}
      {...props}
    >
      {marker ? (
        <>
          {children}
          {marker}
        </>
      ) : (
        children
      )}
    </Comp>
  )
}
