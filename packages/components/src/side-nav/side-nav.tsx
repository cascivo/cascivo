'use client'
import { cn, useSignal, useSignals } from '@cascade-ui/core'
import { useId, type ReactNode } from 'react'
import styles from './side-nav.module.css'

export interface SideNavSubItem {
  label: string
  href: string
  active?: boolean
}

export interface SideNavItem {
  label: string
  href?: string
  icon?: ReactNode
  active?: boolean
  items?: SideNavSubItem[]
}

export interface SideNavProps {
  items: SideNavItem[]
  collapsed?: boolean
  defaultCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  ariaLabel?: string
  collapseLabel?: string
  expandLabel?: string
  className?: string
}

export function SideNav({
  items,
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  ariaLabel = 'Side navigation',
  collapseLabel = 'Collapse navigation',
  expandLabel = 'Expand navigation',
  className,
}: SideNavProps) {
  useSignals()
  const baseId = useId()

  const isCollapsed = useSignal(collapsed ?? defaultCollapsed)
  if (collapsed !== undefined) isCollapsed.value = collapsed

  // Groups containing the active item start expanded so it is visible on mount.
  const expandedGroups = useSignal<string[]>(
    items.filter((item) => item.items?.some((sub) => sub.active)).map((item) => item.label),
  )

  const toggleGroup = (label: string) => {
    const current = expandedGroups.value
    expandedGroups.value = current.includes(label)
      ? current.filter((l) => l !== label)
      : [...current, label]
  }

  const toggleCollapsed = () => {
    const next = !isCollapsed.value
    if (collapsed === undefined) isCollapsed.value = next
    onCollapsedChange?.(next)
  }

  const rail = isCollapsed.value

  return (
    <nav
      aria-label={ariaLabel}
      data-state={rail ? 'collapsed' : 'expanded'}
      className={cn(styles['sideNav'], className)}
    >
      <ul className={styles['list']}>
        {items.map((item, index) => {
          if (item.items) {
            const open = expandedGroups.value.includes(item.label)
            const sublistId = `${baseId}-group-${index}`
            return (
              <li key={item.label}>
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={sublistId}
                  data-state={open ? 'open' : 'closed'}
                  title={rail ? item.label : undefined}
                  className={styles['groupTrigger']}
                  onClick={() => toggleGroup(item.label)}
                >
                  {item.icon && (
                    <span className={styles['icon']} aria-hidden="true">
                      {item.icon}
                    </span>
                  )}
                  <span className={styles['label']}>{item.label}</span>
                  <svg
                    viewBox="0 0 16 16"
                    width="12"
                    height="12"
                    aria-hidden="true"
                    className={styles['groupIndicator']}
                  >
                    <path
                      d="M4 6l4 4 4-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <div
                  id={sublistId}
                  data-state={open ? 'open' : 'closed'}
                  className={styles['sublist']}
                >
                  <ul className={styles['sublistInner']}>
                    {item.items.map((sub) => (
                      <li key={sub.href}>
                        <a
                          href={sub.href}
                          aria-current={sub.active ? 'page' : undefined}
                          data-state={sub.active ? 'active' : undefined}
                          title={rail ? sub.label : undefined}
                          className={cn(styles['link'], styles['sublink'])}
                        >
                          <span className={styles['label']}>{sub.label}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            )
          }
          return (
            <li key={item.label}>
              <a
                href={item.href}
                aria-current={item.active ? 'page' : undefined}
                data-state={item.active ? 'active' : undefined}
                title={rail ? item.label : undefined}
                className={styles['link']}
              >
                {item.icon && (
                  <span className={styles['icon']} aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                <span className={styles['label']}>{item.label}</span>
              </a>
            </li>
          )
        })}
      </ul>
      <button
        type="button"
        aria-label={rail ? expandLabel : collapseLabel}
        className={styles['collapseToggle']}
        onClick={toggleCollapsed}
      >
        <svg
          viewBox="0 0 16 16"
          width="14"
          height="14"
          aria-hidden="true"
          className={styles['collapseIcon']}
        >
          <path
            d="M10 4l-4 4 4 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </nav>
  )
}
