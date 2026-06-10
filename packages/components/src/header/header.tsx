'use client'
import { cn } from '@cascade-ui/core'
import type { HTMLAttributes, ReactNode } from 'react'
import styles from './header.module.css'

export interface HeaderLink {
  label: string
  href: string
  active?: boolean
}

export interface HeaderProps extends HTMLAttributes<HTMLElement> {
  brand?: ReactNode
  links?: HeaderLink[]
  actions?: ReactNode
  sticky?: boolean
}

export function Header({
  brand,
  links,
  actions,
  sticky = false,
  className,
  ...props
}: HeaderProps) {
  return (
    <header
      role="banner"
      data-sticky={sticky || undefined}
      className={cn(styles['header'], className)}
      {...props}
    >
      {brand && <div className={styles['brand']}>{brand}</div>}
      {links && links.length > 0 && (
        <nav aria-label="Main" className={styles['nav']}>
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
