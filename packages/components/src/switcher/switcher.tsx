'use client'
import { cn, useSignals } from '@cascade-ui/core'
import { builtin, t } from '@cascade-ui/i18n'
import type { ReactNode } from 'react'
import styles from './switcher.module.css'

export interface SwitcherLink {
  label: string
  href: string
  active?: boolean
  icon?: ReactNode
}

export type SwitcherEntry = SwitcherLink | { divider: true }

export interface SwitcherProps {
  items: SwitcherEntry[]
  label?: string
  className?: string | undefined
}

export function Switcher({ items, label, className }: SwitcherProps) {
  useSignals()
  return (
    <ul
      aria-label={label ?? t(builtin.switcher.label)}
      className={cn(styles['switcher'], className)}
    >
      {items.map((entry, i) =>
        'divider' in entry ? (
          // eslint-disable-next-line react/no-array-index-key
          <li key={`divider-${i}`} role="separator" className={styles['divider']} />
        ) : (
          <li key={entry.href}>
            <a
              href={entry.href}
              aria-current={entry.active ? 'page' : undefined}
              data-state={entry.active ? 'active' : undefined}
              className={styles['item']}
            >
              {entry.icon && (
                <span className={styles['icon']} aria-hidden="true">
                  {entry.icon}
                </span>
              )}
              {entry.label}
            </a>
          </li>
        ),
      )}
    </ul>
  )
}
