'use client'
import { cn } from '@cascivo/core'
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

export interface ButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function ButtonGroup({ children, className, ...props }: ButtonGroupProps) {
  return (
    <div className={cn(styles['button-group'], className)} role="group" {...props}>
      {children}
    </div>
  )
}
