'use client'
import { cn } from '@cascade-ui/core'
import type { HTMLAttributes, ReactNode } from 'react'
import styles from './input-group.module.css'

export interface InputGroupProps extends HTMLAttributes<HTMLDivElement> {
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
