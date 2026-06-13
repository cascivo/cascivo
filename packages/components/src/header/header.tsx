'use client'
import { cn, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import type { HTMLAttributes, ReactNode } from 'react'
import styles from './header.module.css'

export interface HeaderLink {
  label: string
  href: string
  active?: boolean
}

export interface HeaderLabels {
  nav?: string
}

export interface HeaderProps extends HTMLAttributes<HTMLElement> {
  brand?: ReactNode
  links?: HeaderLink[]
  actions?: ReactNode
  sticky?: boolean
  labels?: HeaderLabels
}

export function Header({
  brand,
  links,
  actions,
  sticky = false,
  labels,
  className,
  ...props
}: HeaderProps) {
  useSignals()
  const navLabel = labels?.nav ?? t(builtin.header.nav)
  return (
    <header
      role="banner"
      data-sticky={sticky || undefined}
      className={cn(styles['header'], className)}
      {...props}
    >
      {brand && <div className={styles['brand']}>{brand}</div>}
      {links && links.length > 0 && (
        <nav aria-label={navLabel} className={styles['nav']}>
          <ul className={styles['list']}>
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  aria-current={link.active ? 'page' : undefined}
                  data-state={link.active ? 'active' : undefined}
                  className={styles['link']}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <div className={styles['spacer']} />
      {actions && <div className={styles['actions']}>{actions}</div>}
    </header>
  )
}
