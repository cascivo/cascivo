'use client'
import { cn, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { forwardRef } from 'react'
import type { AnchorHTMLAttributes, HTMLAttributes } from 'react'
import styles from './skip-nav.module.css'

const DEFAULT_TARGET_ID = 'cascade-skip-target'

export interface SkipNavLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  /**
   * SkipNavLink: id of the SkipNavTarget to jump to
   *
   * @defaultValue `cascade-skip-target`
   * @see the component manifest
   */
  targetId?: string
  labels?: { label?: string }
}

/** Render as the FIRST focusable element on the page — visually hidden until focused. */
/**
 * `forwardRef` so `ref` reaches the underlying `<a>` — and so it is TYPED. See
 * `textarea.tsx` for the full rationale (2026-07-28 report C10). Enforced by
 * `ref-parity.test.ts`, which found this component: the plan's own list of 16 was itself
 * incomplete, which is why the rule is a guard and not a checklist.
 */
export const SkipNavLink = forwardRef<HTMLAnchorElement, SkipNavLinkProps>(function SkipNavLink(
  { targetId = DEFAULT_TARGET_ID, labels, className, ...props },
  ref,
) {
  useSignals()
  const label = labels?.label ?? t(builtin.skipNav.label)
  return (
    <a ref={ref} href={`#${targetId}`} className={cn(styles['link'], className)} {...props}>
      {label}
    </a>
  )
})

export interface SkipNavTargetProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * SkipNavTarget: anchor id — must match the link targetId
   *
   * @defaultValue `cascade-skip-target`
   * @see the component manifest
   */
  id?: string
}

/** Place where the main content starts; the link's hash navigation moves focus here. */
export function SkipNavTarget({ id = DEFAULT_TARGET_ID, ...props }: SkipNavTargetProps) {
  return <div id={id} tabIndex={-1} {...props} />
}
