'use client'
import { cn, useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { type KeyboardEvent, type MouseEvent, type ReactNode, type RefObject } from 'react'
import { usePopover } from '../popover/use-popover'
import styles from './shell-header.module.css'

export interface ShellHeaderBrand {
  prefix?: string
  name: string
  href?: string
}

export interface ShellHeaderNavLink {
  label: string
  href: string
  active?: boolean
  /** Intercept navigation (e.g. a SPA section switch). Forwarded to the `<a>`. */
  onClick?: ((e: MouseEvent<HTMLAnchorElement>) => void) | undefined
}

export interface ShellHeaderNavMenuItem {
  label: string
  href: string
  active?: boolean
}

export interface ShellHeaderNavMenu {
  label: string
  items: ShellHeaderNavMenuItem[]
}

export type ShellHeaderNavItem = ShellHeaderNavLink | ShellHeaderNavMenu

export interface ShellHeaderAction {
  id: string
  label: string
  icon: ReactNode
  active?: boolean
  onClick?: (() => void) | undefined
}

export interface ShellHeaderLabels {
  skipToContent?: string
  nav?: string
  openMenu?: string
  closeMenu?: string
}

export interface ShellHeaderProps {
  brand?: ShellHeaderBrand | ReactNode
  nav?: ShellHeaderNavItem[]
  actions?: ShellHeaderAction[]
  end?: ReactNode
  onMenuClick?: (() => void) | undefined
  menuExpanded?: boolean
  skipToContentHref?: string | false
  labels?: ShellHeaderLabels
  className?: string | undefined
}

function isBrandObject(brand: ShellHeaderBrand | ReactNode): brand is ShellHeaderBrand {
  return typeof brand === 'object' && brand !== null && 'name' in (brand as object)
}

function isNavMenu(item: ShellHeaderNavItem): item is ShellHeaderNavMenu {
  return 'items' in item
}

function NavMenu({ item }: { item: ShellHeaderNavMenu }) {
  useSignals()
  const { triggerRef, popoverRef, isOpen, anchorName, toggle, close } = usePopover()
  const hasActiveChild = item.items.some((sub) => sub.active)
  const focusFirstOnOpen = useSignal(false)

  // Focus first menuitem when opened via keyboard ArrowDown
  useSignalEffect(() => {
    if (!focusFirstOnOpen.value || !isOpen.value) return
    focusFirstOnOpen.value = false
    const panel = popoverRef.current
    if (!panel) return
    panel.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
  })

  function handleTriggerKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!isOpen.value) {
        focusFirstOnOpen.value = true
        toggle()
      } else {
        popoverRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    }
  }

  function handlePanelKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const items = Array.from(
      popoverRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    )
    const index = items.indexOf(document.activeElement as HTMLElement)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      items[(index + 1) % items.length]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      items[(index - 1 + items.length) % items.length]?.focus()
    } else if (e.key === 'Escape') {
      close()
      ;(triggerRef.current as HTMLElement | null)?.focus()
    }
  }

  return (
    <li className={styles['navMenuWrapper']}>
      <button
        ref={triggerRef as RefObject<HTMLButtonElement>}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen.value}
        data-state={hasActiveChild ? 'active' : undefined}
        style={{ anchorName } as React.CSSProperties}
        className={styles['navMenuTrigger']}
        onClick={toggle}
        onKeyDown={handleTriggerKeyDown}
      >
        {item.label}
        <svg
          viewBox="0 0 16 16"
          width="12"
          height="12"
          aria-hidden="true"
          className={styles['chevron']}
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
        ref={popoverRef as RefObject<HTMLDivElement>}
        popover="auto"
        role="menu"
        aria-label={item.label}
        data-state={isOpen.value ? 'open' : 'closed'}
        style={{ positionAnchor: anchorName } as React.CSSProperties}
        className={styles['navMenuPanel']}
        onKeyDown={handlePanelKeyDown}
      >
        {item.items.map((sub) => (
          <a
            key={sub.href}
            href={sub.href}
            role="menuitem"
            aria-current={sub.active ? 'page' : undefined}
            data-state={sub.active ? 'active' : undefined}
            className={styles['navMenuItem']}
            onClick={close}
          >
            {sub.label}
          </a>
        ))}
      </div>
    </li>
  )
}

export function ShellHeader({
  brand,
  nav,
  actions,
  end,
  onMenuClick,
  menuExpanded,
  skipToContentHref = '#cascade-main',
  labels,
  className,
}: ShellHeaderProps) {
  useSignals()
  const navLabel = labels?.nav ?? t(builtin.shellHeader.nav)
  const menuLabel = menuExpanded
    ? (labels?.closeMenu ?? t(builtin.shellHeader.closeMenu))
    : (labels?.openMenu ?? t(builtin.shellHeader.openMenu))

  return (
    <header role="banner" className={cn(styles['header'], className)}>
      {skipToContentHref !== false && (
        <a href={skipToContentHref} className={styles['skipLink']}>
          {labels?.skipToContent ?? t(builtin.shellHeader.skipToContent)}
        </a>
      )}
      {onMenuClick && (
        <button
          type="button"
          aria-label={menuLabel}
          aria-expanded={menuExpanded ?? false}
          className={styles['menuButton']}
          onClick={onMenuClick}
        >
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
            <path
              d="M2 4h12M2 8h12M2 12h12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
      {brand != null &&
        (isBrandObject(brand) ? (
          <a
            href={brand.href ?? '/'}
            aria-label={[brand.prefix, brand.name].filter(Boolean).join(' ')}
            className={styles['brand']}
          >
            {brand.prefix && <span className={styles['brandPrefix']}>{brand.prefix}</span>}
            <span className={styles['brandName']}>{brand.name}</span>
          </a>
        ) : (
          <div className={styles['brand']}>{brand}</div>
        ))}
      {nav && nav.length > 0 && (
        <nav aria-label={navLabel} className={styles['nav']}>
          <ul className={styles['navList']}>
            {nav.map((item) =>
              isNavMenu(item) ? (
                <NavMenu key={item.label} item={item} />
              ) : (
                <li key={item.href}>
                  <a
                    href={item.href}
                    aria-current={item.active ? 'page' : undefined}
                    data-state={item.active ? 'active' : undefined}
                    className={styles['navLink']}
                    {...(item.onClick ? { onClick: item.onClick } : {})}
                  >
                    {item.label}
                  </a>
                </li>
              ),
            )}
          </ul>
        </nav>
      )}
      <div className={styles['spacer']} />
      {actions && actions.length > 0 && (
        <div className={styles['actions']}>
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              aria-label={action.label}
              aria-pressed={action.active ?? false}
              title={action.label}
              data-state={action.active ? 'active' : undefined}
              className={styles['action']}
              onClick={action.onClick}
            >
              <span className={styles['actionIcon']} aria-hidden="true">
                {action.icon}
              </span>
            </button>
          ))}
        </div>
      )}
      {end && <div className={styles['end']}>{end}</div>}
    </header>
  )
}
