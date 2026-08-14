'use client'
import { getLinkComponent, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import styles from './dock.module.css'

export interface DockItem {
  /**
   * Stable React key. Provide when `label`/`href` may repeat.
   *
   * Without it the items key on their array index, so inserting or reordering a dock entry
   * re-keys every item after it. `SideNavItem`, `ShellHeaderNavLink`, `SwitcherLink`,
   * `BreadcrumbItem` and the rest carry this field; `Dock` was missed by all three earlier
   * sweeps and found only once the guard derived its subjects instead of listing them
   * (2026-08-14 report §9).
   */
  id?: string
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
        const Tag = item.href ? getLinkComponent() : 'button'
        return (
          <Tag
            key={item.id ?? `${i}-${item.label}`}
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
