import { cn, Slot } from '@cascivo/core/pure'
import { builtin, t } from '@cascivo/i18n'
import type { LabelHTMLAttributes, ReactNode } from 'react'
import styles from './label.module.css'

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /**
   * When true, renders the child element as the root via Slot, merging props (polymorphic
   * rendering).
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  asChild?: boolean
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
      className={cn(styles['label'], className as string | undefined)}
      {...(props as Record<string, unknown>)}
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
