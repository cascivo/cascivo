'use client'
import { cn, useSignals } from '@cascade-ui/core'
import { builtin, t } from '@cascade-ui/i18n'
import type { AnchorHTMLAttributes, HTMLAttributes } from 'react'
import styles from './skip-nav.module.css'

const DEFAULT_TARGET_ID = 'cascade-skip-target'

export interface SkipNavLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  targetId?: string
  labels?: { label?: string }
}

/** Render as the FIRST focusable element on the page — visually hidden until focused. */
export function SkipNavLink({
  targetId = DEFAULT_TARGET_ID,
  labels,
  className,
  ...props
}: SkipNavLinkProps) {
  useSignals()
  const label = labels?.label ?? t(builtin.skipNav.label)
  return (
    <a href={`#${targetId}`} className={cn(styles['link'], className)} {...props}>
      {label}
    </a>
  )
}

export interface SkipNavTargetProps extends HTMLAttributes<HTMLDivElement> {
  id?: string
}

/** Place where the main content starts; the link's hash navigation moves focus here. */
export function SkipNavTarget({ id = DEFAULT_TARGET_ID, ...props }: SkipNavTargetProps) {
  return <div id={id} tabIndex={-1} {...props} />
}
