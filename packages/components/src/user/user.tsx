'use client'
import { cn } from '@cascivo/core'
import type { HTMLAttributes, ReactNode } from 'react'
import { Avatar, type AvatarProps } from '../avatar/avatar'
import styles from './user.module.css'

export interface UserProps extends HTMLAttributes<HTMLDivElement> {
  /** Primary identity label (name). */
  name: ReactNode
  /** Secondary line (email, role, …). */
  description?: ReactNode
  /** Forwarded to the composed <Avatar>. */
  avatarProps?: AvatarProps
  /** Optional trailing action slot (e.g. a menu button). */
  children?: ReactNode
}

/** Identity composite: an Avatar with a name + optional description and trailing action. */
export function User({ name, description, avatarProps, className, children, ...rest }: UserProps) {
  return (
    <div role="group" className={cn(styles['user'], className)} {...rest}>
      <Avatar {...avatarProps} />
      <span className={styles['text']}>
        <span className={styles['name']}>{name}</span>
        {description != null && <span className={styles['description']}>{description}</span>}
      </span>
      {children != null && <span className={styles['action']}>{children}</span>}
    </div>
  )
}
