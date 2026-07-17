'use client'
import { cn } from '@cascivo/core'
import type { HTMLAttributes, LiHTMLAttributes } from 'react'
import styles from './list.module.css'

export interface ListProps extends HTMLAttributes<HTMLElement> {
  as?: 'ul' | 'ol'
  marker?: 'disc' | 'decimal' | 'none'
}

export function List({ as: Tag = 'ul', marker, className, children, ...props }: ListProps) {
  return (
    <Tag
      data-marker={marker ?? (Tag === 'ol' ? 'decimal' : 'disc')}
      className={cn(styles['list'], className)}
      {...props}
    >
      {children}
    </Tag>
  )
}

export type ListItemProps = LiHTMLAttributes<HTMLLIElement>

export function ListItem({ className, children, ...props }: ListItemProps) {
  return (
    <li className={cn(styles['item'], className)} {...props}>
      {children}
    </li>
  )
}
