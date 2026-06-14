'use client'
import { cn, Slot } from '@cascivo/core'
import type { HTMLAttributes, ReactNode } from 'react'
import styles from './contained-list.module.css'

export interface ContainedListProps extends HTMLAttributes<HTMLDivElement> {
  label: ReactNode
  kind?: 'on-page' | 'disclosed'
  action?: ReactNode
}

export function ContainedList({
  label,
  kind = 'on-page',
  action,
  className,
  children,
  ...props
}: ContainedListProps) {
  return (
    <div data-kind={kind} className={cn(styles['root'], className)} {...props}>
      <div className={styles['header']}>
        <h3 className={styles['label']}>{label}</h3>
        {action ? <div className={styles['action']}>{action}</div> : null}
      </div>
      <ul className={styles['list']}>{children}</ul>
    </div>
  )
}

export interface ContainedListItemProps extends HTMLAttributes<HTMLDivElement> {
  asChild?: boolean
}

export function ContainedListItem({
  asChild = false,
  onClick,
  className,
  children,
  ...props
}: ContainedListItemProps) {
  const interactive = asChild || typeof onClick === 'function'
  const Comp = asChild ? Slot : 'div'
  return (
    <li className={styles['item']} data-interactive={interactive ? '' : undefined}>
      <Comp className={cn(styles['itemContent'], className)} onClick={onClick} {...props}>
        {children}
      </Comp>
    </li>
  )
}
