'use client'
import { cn } from '@cascivo/core'
import type { HTMLAttributes } from 'react'
import styles from './blockquote.module.css'

export interface BlockquoteProps extends HTMLAttributes<HTMLQuoteElement> {
  cite?: string
}

export function Blockquote({ cite, className, children, ...props }: BlockquoteProps) {
  return (
    <blockquote className={cn(styles['blockquote'], className as string | undefined)} {...props}>
      {children}
      {cite ? (
        <footer className={styles['footer']}>
          <cite>{cite}</cite>
        </footer>
      ) : null}
    </blockquote>
  )
}
