'use client'
import { cn } from '@cascivo/core'
import type { HTMLAttributes } from 'react'
import styles from './heading.module.css'

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6
export type HeadingSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

const DERIVED_SIZE: Record<HeadingLevel, HeadingSize> = {
  1: '2xl',
  2: 'xl',
  3: 'lg',
  4: 'md',
  5: 'sm',
  6: 'sm',
}

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel
  size?: HeadingSize
}

export function Heading({ level = 2, size, className, children, ...props }: HeadingProps) {
  const Tag = `h${level}` as const
  return (
    <Tag
      data-size={size ?? DERIVED_SIZE[level]}
      className={cn(styles['heading'], className as string | undefined)}
      {...props}
    >
      {children}
    </Tag>
  )
}
