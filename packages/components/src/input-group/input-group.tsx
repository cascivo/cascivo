import { cn } from '@cascivo/core/pure'
import type { HTMLAttributes, ReactNode } from 'react'
import styles from './input-group.module.css'

export interface InputGroupAddonProps extends HTMLAttributes<HTMLSpanElement> {
  /** Visual side, logical: 'inline-start' (leading) or 'inline-end' (trailing). */
  align?: 'inline-start' | 'inline-end'
  children: ReactNode
}

/** Inline adornment (icon, unit) rendered INSIDE the field border. Decorative by default. */
export function InputGroupAddon({
  align = 'inline-start',
  children,
  className,
  ...props
}: InputGroupAddonProps) {
  return (
    <span
      className={cn(styles['inline-addon'], className)}
      data-align={align}
      aria-hidden="true"
      {...props}
    >
      {children}
    </span>
  )
}

export interface InputGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'prefix' | 'suffix'> {
  prefix?: ReactNode
  suffix?: ReactNode
  children: ReactNode
}

export function InputGroup({ prefix, suffix, children, className, ...props }: InputGroupProps) {
  return (
    <div
      className={cn(styles['input-group'], className)}
      data-has-prefix={prefix ? '' : undefined}
      data-has-suffix={suffix ? '' : undefined}
      {...props}
    >
      {prefix && (
        <span className={styles['addon']} data-position="prefix">
          {prefix}
        </span>
      )}
      <span className={styles['input-wrap']}>{children}</span>
      {suffix && (
        <span className={styles['addon']} data-position="suffix">
          {suffix}
        </span>
      )}
    </div>
  )
}

export interface InputGroupButtonsProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function InputGroupButtons({ children, className, ...props }: InputGroupButtonsProps) {
  return (
    <div className={cn(styles['button-group'], className)} role="group" {...props}>
      {children}
    </div>
  )
}

/**
 * @deprecated Use `InputGroupButtons`, or the `button-group` component for a toolbar of its
 * own. This helper shared its name with `button-group`'s `ButtonGroup`, a different component,
 * so a project that copied both had two `ButtonGroup`s; it is removed at 2.0.
 */
export const ButtonGroup = InputGroupButtons

/** @deprecated Use `InputGroupButtonsProps`; removed at 2.0 with `ButtonGroup`. */
export type ButtonGroupProps = InputGroupButtonsProps
