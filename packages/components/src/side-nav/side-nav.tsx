'use client'
import { cn, useSignal, useSignals } from '@cascade-ui/core'
import { builtin, t } from '@cascade-ui/i18n'
import { useId, type CSSProperties, type KeyboardEvent, type ReactNode, type RefObject } from 'react'
import { Tooltip } from '../tooltip/tooltip'
import { usePopover } from '../popover/use-popover'
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
  expandOnHover?: boolean
  footer?: ReactNode
  className?: string
}

function firstGrapheme(label: string): string {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    for (const s of seg.segment(label)) return s.segment
  }
  return [...label][0] ?? ''
}

interface RailGroupFlyoutProps {
  item: SideNavItem & { items: SideNavSubItem[] }
}

function RailGroupFlyout({ item }: RailGroupFlyoutProps) {
  const { triggerRef, popoverRef, isOpen, anchorName, open, close, toggle } = usePopover()

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!isOpen.value) open()
      const panel = popoverRef.current
      if (panel) {
        setTimeout(() => {
          panel.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
        }, 0)
      }
    } else if (e.key === 'Escape') {
      close()
    }
  }

  const handlePanelKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const panel = popoverRef.current
    if (!panel) return
    const items = Array.from(panel.querySelectorAll<HTMLElement>('[role="menuitem"]'))
    const idx = items.indexOf(e.target as HTMLElement)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      items[(idx + 1) % items.length]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      items[(idx - 1 + items.length) % items.length]?.focus()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
      triggerRef.current?.focus()
    }
  }

  return (
    <>
      <button
        ref={triggerRef as RefObject<HTMLButtonElement>}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen.value}
        aria-label={item.label}
        data-state={isOpen.value ? 'open' : 'closed'}
        style={{ anchorName } as CSSProperties}
        className={styles['groupTrigger']}
        onClick={() => toggle()}
        onKeyDown={handleKeyDown}
      >
        {item.icon ? (
          <span className={styles['icon']} aria-hidden="true">
            {item.icon}
          </span>
        ) : (
          <span className={styles['fallbackIcon']} data-fallback-icon aria-hidden="true">
            {firstGrapheme(item.label)}
          </span>
        )}
      </button>
      <div
        ref={popoverRef as RefObject<HTMLDivElement>}
        popover="auto"
        role="menu"
        aria-label={item.label}
        style={{ positionAnchor: anchorName } as CSSProperties}
        className={styles['railFlyout']}
        onKeyDown={handlePanelKeyDown}
      >
        <div className={styles['railFlyoutCaption']} aria-hidden="true">
          {item.label}
        </div>
        {item.items.map((sub) => (
          <a
            key={sub.href}
            href={sub.href}
            role="menuitem"
            aria-current={sub.active ? 'page' : undefined}
            data-state={sub.active ? 'active' : undefined}
            className={cn(styles['link'], styles['sublink'], styles['flyoutItem'])}
            onClick={() => close()}
          >
            {sub.label}
          </a>
        ))}
      </div>
    </>
  )
}

export function SideNav({
  items,
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  ariaLabel,
  collapseLabel,
  expandLabel,
  expandOnHover = false,
  footer,
  className,
}: SideNavProps) {
  useSignals()
  const resolvedAriaLabel = ariaLabel ?? t(builtin.sideNav.nav)
  const resolvedCollapseLabel = collapseLabel ?? t(builtin.sideNav.collapse)
  const resolvedExpandLabel = expandLabel ?? t(builtin.sideNav.expand)
  const baseId = useId()

  const isCollapsed = useSignal(collapsed ?? defaultCollapsed)
  if (collapsed !== undefined) isCollapsed.value = collapsed

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
      aria-label={resolvedAriaLabel}
      data-state={rail ? 'collapsed' : 'expanded'}
      data-expand-on-hover={rail && expandOnHover ? '' : undefined}
      className={cn(styles['sideNav'], className)}
    >
      <ul className={styles['list']}>
        {items.map((item, index) => {
          if (item.items) {
            if (rail && !expandOnHover) {
              return (
                <li key={item.label}>
                  <RailGroupFlyout item={item as SideNavItem & { items: SideNavSubItem[] }} />
                </li>
              )
            }
            const open = expandedGroups.value.includes(item.label)
            const sublistId = `${baseId}-group-${index}`
            return (
              <li key={item.label}>
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={sublistId}
                  aria-label={rail ? item.label : undefined}
                  data-state={open ? 'open' : 'closed'}
                  className={styles['groupTrigger']}
                  onClick={() => toggleGroup(item.label)}
                >
                  {item.icon ? (
                    <span className={styles['icon']} aria-hidden="true">
                      {item.icon}
                    </span>
                  ) : rail ? (
                    <span className={styles['fallbackIcon']} data-fallback-icon aria-hidden="true">
                      {firstGrapheme(item.label)}
                    </span>
                  ) : null}
                  <span className={styles['label']} data-rail-hidden={rail || undefined}>
                    {item.label}
                  </span>
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

          const link = (
            <a
              href={item.href}
              aria-current={item.active ? 'page' : undefined}
              aria-label={rail ? item.label : undefined}
              data-state={item.active ? 'active' : undefined}
              className={styles['link']}
            >
              {item.icon ? (
                <span className={styles['icon']} aria-hidden="true">
                  {item.icon}
                </span>
              ) : rail ? (
                <span className={styles['fallbackIcon']} data-fallback-icon aria-hidden="true">
                  {firstGrapheme(item.label)}
                </span>
              ) : null}
              <span className={styles['label']} data-rail-hidden={rail || undefined}>
                {item.label}
              </span>
            </a>
          )

          return (
            <li key={item.label}>
              {rail && !expandOnHover ? (
                <Tooltip content={item.label} placement="right">
                  {link}
                </Tooltip>
              ) : (
                link
              )}
            </li>
          )
        })}
      </ul>
      {footer && <div className={styles['footer']}>{footer}</div>}
      <button
        type="button"
        aria-label={rail ? resolvedExpandLabel : resolvedCollapseLabel}
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
