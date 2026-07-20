'use client'
import { cn, getLinkComponent, useSignal, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { Fragment, useId } from 'react'
import type { CSSProperties, KeyboardEvent, MouseEvent, ReactNode, RefObject } from 'react'
import { Tooltip } from '../tooltip/tooltip'
import { usePopover } from '../popover/use-popover'
import styles from './side-nav.module.css'

export type SideNavTone = 'default' | 'danger' | 'warning' | 'success'

/**
 * The anchor props cascivo computes for a nav item — the exact bag it spreads onto
 * the link element. Passed to a `render` hatch so a custom link (e.g. a router
 * `<Link>`) can carry the same active-state and accessibility attributes.
 */
export interface SideNavLinkProps {
  href?: string | undefined
  className?: string | undefined
  'aria-current'?: 'page' | undefined
  'aria-label'?: string | undefined
  'aria-disabled'?: boolean | undefined
  'data-state'?: 'active' | undefined
  'data-tone'?: Exclude<SideNavTone, 'default'> | undefined
  tabIndex?: number | undefined
  onClick: (e: MouseEvent<HTMLAnchorElement>) => void
}

/** A selectable/navigable sub-item (link when `href` is set, action when `onSelect` is set). */
export interface SideNavLinkSubItem {
  /** Stable React key. Provide when `label`/`href` may repeat (e.g. placeholder `#` links). */
  id?: string
  label: string
  href?: string
  icon?: ReactNode
  active?: boolean
  /** Shows a trailing checkmark; use for picker-style "current selection" rows. */
  selected?: boolean
  /** Runs an action instead of navigating. When set without `href`, renders a `<button>`. */
  onSelect?: () => void
  disabled?: boolean
}

export type SideNavSubItem =
  | SideNavLinkSubItem
  | { type: 'separator' }
  | { type: 'label'; label: string }

export interface SideNavItem {
  /** Stable React key. Provide when `label`/`href` may repeat (e.g. placeholder `#` links). */
  id?: string
  label: string
  href?: string
  icon?: ReactNode
  active?: boolean
  items?: SideNavSubItem[]
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
  /** Non-interactive and visually dimmed. */
  disabled?: boolean
  /** Recolors the item; `'default'` is the standard subtle color. */
  tone?: SideNavTone
  /** Rendered right-aligned after the label (e.g. a Kbd hint, badge, count); hidden on the rail. */
  trailing?: ReactNode
  /**
   * Escape hatch: render arbitrary content inside the item's shell so it inherits
   * alignment and the collapse context. When set, the item's own fields are ignored.
   *
   * `children` is the computed icon + label + trailing node (so a custom link keeps
   * the default layout), and `linkProps` is the anchor prop bag cascivo would spread
   * onto the `<a>` (including active-state and a11y attributes) — spread it onto your
   * router `<Link>` to preserve them. For a global router integration prefer
   * `setLinkComponent` (from `@cascivo/react`, or `@cascivo/core` for copied source)
   * over a per-item hatch.
   */
  render?: (ctx: {
    collapsed: boolean
    children: ReactNode
    linkProps: SideNavLinkProps
  }) => ReactNode
}

export interface SideNavGroup {
  label?: string
  items: SideNavItem[]
}

export interface SideNavProps {
  items?: SideNavItem[]
  groups?: SideNavGroup[]
  collapsed?: boolean
  defaultCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  ariaLabel?: string
  collapseLabel?: string
  expandLabel?: string
  expandOnHover?: boolean
  showCollapseToggle?: boolean
  /** Content rendered above the items, inside the item padding context. */
  header?: ReactNode
  footer?: ReactNode
  className?: string
}

function isLinkSubItem(sub: SideNavSubItem): sub is SideNavLinkSubItem {
  return !('type' in sub)
}

function CheckMark() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      className={styles['checkMark']}
    >
      <path
        d="M3.5 8.5l3 3 6-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface SubControlOptions {
  inMenu: boolean
  onActivate?: () => void
  extraClass?: string | undefined
}

/** Renders the interactive control for a link/action sub-item (shared by inline + flyout). */
function renderSubControl(
  sub: SideNavLinkSubItem,
  { inMenu, onActivate, extraClass }: SubControlOptions,
) {
  const role = inMenu ? 'menuitem' : undefined
  const className = cn(styles['link'], styles['sublink'], extraClass)
  const inner = (
    <>
      {sub.icon ? (
        <span className={styles['icon']} aria-hidden="true">
          {sub.icon}
        </span>
      ) : null}
      <span className={styles['label']}>{sub.label}</span>
      {sub.selected ? <CheckMark /> : null}
    </>
  )

  if (sub.onSelect && !sub.href) {
    return (
      <button
        type="button"
        role={role}
        aria-current={sub.active ? 'page' : undefined}
        data-state={sub.active ? 'active' : undefined}
        data-selected={sub.selected || undefined}
        disabled={sub.disabled}
        className={className}
        onClick={() => {
          sub.onSelect?.()
          onActivate?.()
        }}
      >
        {inner}
      </button>
    )
  }

  const LinkComponent = getLinkComponent()
  return (
    <LinkComponent
      href={sub.disabled ? undefined : sub.href}
      role={role}
      aria-current={sub.active ? 'page' : undefined}
      aria-disabled={sub.disabled || undefined}
      tabIndex={sub.disabled ? -1 : undefined}
      data-state={sub.active ? 'active' : undefined}
      data-selected={sub.selected || undefined}
      className={className}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        if (sub.disabled) {
          e.preventDefault()
          return
        }
        sub.onSelect?.()
        onActivate?.()
      }}
    >
      {inner}
    </LinkComponent>
  )
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

  const menuItemSelector = '[role="menuitem"]:not([disabled]):not([aria-disabled="true"])'

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!isOpen.value) open()
      const panel = popoverRef.current
      if (panel) {
        setTimeout(() => {
          panel.querySelector<HTMLElement>(menuItemSelector)?.focus()
        }, 0)
      }
    } else if (e.key === 'Escape') {
      close()
    }
  }

  const handlePanelKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const panel = popoverRef.current
    if (!panel) return
    const items = Array.from(panel.querySelectorAll<HTMLElement>(menuItemSelector))
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
        {item.items.map((sub, si) => {
          if (!isLinkSubItem(sub)) {
            return sub.type === 'separator' ? (
              <div key={si} role="separator" className={styles['flyoutSeparator']} />
            ) : (
              <div key={si} className={styles['railFlyoutCaption']} aria-hidden="true">
                {sub.label}
              </div>
            )
          }
          return (
            <Fragment key={si}>
              {renderSubControl(sub, {
                inMenu: true,
                onActivate: close,
                extraClass: styles['flyoutItem'],
              })}
            </Fragment>
          )
        })}
      </div>
    </>
  )
}

export function SideNav({
  items,
  groups,
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  ariaLabel,
  collapseLabel,
  expandLabel,
  expandOnHover = false,
  showCollapseToggle = true,
  header,
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

  const effectiveGroups: SideNavGroup[] = groups ?? (items ? [{ items }] : [{ items: [] }])

  const allItems = effectiveGroups.flatMap((g) => g.items)
  const expandedGroups = useSignal<string[]>(
    allItems
      .filter((item) => item.items?.some((sub) => isLinkSubItem(sub) && sub.active))
      .map((item) => item.label),
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
      {header && <div className={styles['header']}>{header}</div>}
      <ul className={styles['list']}>
        {effectiveGroups.map((group, gi) => (
          <li key={gi} className={styles['group']}>
            {group.label && <h3 className={styles['groupLabel']}>{group.label}</h3>}
            <ul className={styles['groupItems']}>
              {group.items.map((item, index) => {
                const globalIndex = `${gi}-${index}`
                if (item.items) {
                  if (rail && !expandOnHover) {
                    return (
                      <li key={item.id ?? globalIndex}>
                        <RailGroupFlyout item={item as SideNavItem & { items: SideNavSubItem[] }} />
                      </li>
                    )
                  }
                  const open = expandedGroups.value.includes(item.label)
                  const sublistId = `${baseId}-group-${globalIndex}`
                  return (
                    <li key={item.id ?? globalIndex}>
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
                          <span
                            className={styles['fallbackIcon']}
                            data-fallback-icon
                            aria-hidden="true"
                          >
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
                          {item.items.map((sub, si) => {
                            if (!isLinkSubItem(sub)) {
                              return sub.type === 'separator' ? (
                                <li key={si} role="separator" className={styles['subSeparator']} />
                              ) : (
                                <li key={si} className={styles['subGroupLabel']}>
                                  {sub.label}
                                </li>
                              )
                            }
                            return <li key={si}>{renderSubControl(sub, { inMenu: false })}</li>
                          })}
                        </ul>
                      </div>
                    </li>
                  )
                }

                const inner = (
                  <>
                    {item.icon ? (
                      <span className={styles['icon']} aria-hidden="true">
                        {item.icon}
                      </span>
                    ) : rail ? (
                      <span
                        className={styles['fallbackIcon']}
                        data-fallback-icon
                        aria-hidden="true"
                      >
                        {firstGrapheme(item.label)}
                      </span>
                    ) : null}
                    <span className={styles['label']} data-rail-hidden={rail || undefined}>
                      {item.label}
                    </span>
                    {item.trailing != null ? (
                      <span className={styles['trailing']} data-rail-hidden={rail || undefined}>
                        {item.trailing}
                      </span>
                    ) : null}
                  </>
                )

                const tone = item.tone && item.tone !== 'default' ? item.tone : undefined
                const linkProps: SideNavLinkProps = {
                  href: item.disabled ? undefined : item.href,
                  'aria-current': item.active ? 'page' : undefined,
                  'aria-label': rail ? item.label : undefined,
                  'aria-disabled': item.disabled || undefined,
                  tabIndex: item.disabled ? -1 : undefined,
                  'data-state': item.active ? 'active' : undefined,
                  'data-tone': tone,
                  className: styles['link'],
                  onClick: (e) => {
                    if (item.disabled) {
                      e.preventDefault()
                      return
                    }
                    item.onClick?.(e)
                  },
                }

                if (item.render) {
                  return (
                    <li key={item.id ?? globalIndex} className={styles['customItem']}>
                      {item.render({ collapsed: rail, children: inner, linkProps })}
                    </li>
                  )
                }

                // Renders through the app-registered link component (see
                // `setLinkComponent`), defaulting to a plain `<a>`. Passing the full
                // computed prop bag keeps active-state (`aria-current`/`data-state`)
                // and layout intact for a router `<Link>`.
                const LinkComponent = getLinkComponent()
                const link =
                  item.onClick && !item.href ? (
                    <button
                      type="button"
                      aria-current={item.active ? 'page' : undefined}
                      aria-label={rail ? item.label : undefined}
                      data-state={item.active ? 'active' : undefined}
                      data-tone={tone}
                      className={styles['link']}
                      disabled={item.disabled}
                      onClick={(e) => item.onClick?.(e as unknown as MouseEvent<HTMLAnchorElement>)}
                    >
                      {inner}
                    </button>
                  ) : (
                    <LinkComponent {...linkProps}>{inner}</LinkComponent>
                  )

                return (
                  <li key={item.id ?? globalIndex}>
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
          </li>
        ))}
      </ul>
      {footer && <div className={styles['footer']}>{footer}</div>}
      {showCollapseToggle && (
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
      )}
    </nav>
  )
}
