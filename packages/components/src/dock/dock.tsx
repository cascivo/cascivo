'use client'
import { useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import styles from './dock.module.css'

export interface DockItem {
  label: string
  icon: React.ReactNode
  onClick?: () => void
  href?: string
}

export interface DockProps {
  items: DockItem[]
  activeIndex?: number
  className?: string
  /** Accessible label for the nav landmark */
  ariaLabel?: string
}

export function Dock({ items, activeIndex, className, ariaLabel }: DockProps) {
  useSignals()
  const resolvedAriaLabel = ariaLabel ?? t(builtin.dock.nav)
  return (
    <nav
      aria-label={resolvedAriaLabel}
      className={[styles.dock, className].filter(Boolean).join(' ')}
    >
      {items.map((item, i) => {
        const isActive = i === activeIndex
        const Tag = item.href ? 'a' : 'button'
        return (
          <Tag
            key={i}
            className={styles.item}
            data-active={isActive || undefined}
            aria-current={isActive ? 'page' : undefined}
            {...(item.href ? { href: item.href } : {})}
            type={item.href ? undefined : 'button'}
            onClick={item.onClick}
          >
            <span className={styles.icon} aria-hidden="true">
              {item.icon}
            </span>
            <span className={styles.label}>{item.label}</span>
          </Tag>
        )
      })}
    </nav>
  )
}
