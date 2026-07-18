'use client'
import { cn, Slot } from '@cascivo/core'
import type { HTMLAttributes } from 'react'
import styles from './item.module.css'

export interface ItemProps extends HTMLAttributes<HTMLDivElement> {
  asChild?: boolean
  variant?: 'default' | 'muted'
  size?: 'sm' | 'md'
}

export function Item({
  asChild = false,
  variant = 'default',
  size = 'md',
  className,
  children,
  ...props
}: ItemProps) {
  const Comp = asChild ? Slot : 'div'
  return (
    <Comp
      data-variant={variant}
      data-size={size}
      className={cn(styles['item'], className as string | undefined)}
      {...(props as Record<string, unknown>)}
    >
      {children}
    </Comp>
  )
}

export interface ItemMediaProps extends HTMLAttributes<HTMLDivElement> {}

export function ItemMedia({ className, children, ...props }: ItemMediaProps) {
  return (
    <div className={cn(styles['media'], className as string | undefined)} {...props}>
      {children}
    </div>
  )
}

export interface ItemContentProps extends HTMLAttributes<HTMLDivElement> {}

export function ItemContent({ className, children, ...props }: ItemContentProps) {
  return (
    <div className={cn(styles['content'], className as string | undefined)} {...props}>
      {children}
    </div>
  )
}

export interface ItemTitleProps extends HTMLAttributes<HTMLDivElement> {}

export function ItemTitle({ className, children, ...props }: ItemTitleProps) {
  return (
    <div className={cn(styles['title'], className as string | undefined)} {...props}>
      {children}
    </div>
  )
}

export interface ItemDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

export function ItemDescription({ className, children, ...props }: ItemDescriptionProps) {
  return (
    <p className={cn(styles['description'], className as string | undefined)} {...props}>
      {children}
    </p>
  )
}

export interface ItemActionsProps extends HTMLAttributes<HTMLDivElement> {}

export function ItemActions({ className, children, ...props }: ItemActionsProps) {
  return (
    <div className={cn(styles['actions'], className as string | undefined)} {...props}>
      {children}
    </div>
  )
}
