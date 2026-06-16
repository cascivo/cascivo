'use client'
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
}

export function Dock({ items, activeIndex, className }: DockProps) {
  return (
    <nav
      aria-label="Main navigation"
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
