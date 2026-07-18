'use client'

import { createContext } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { useSignalEffect, useSignals, useTypeahead } from '@cascivo/core'
import { usePopover } from '../popover/use-popover'
import type { UsePopoverReturn } from '../popover/use-popover'
import styles from './menu.module.css'

const MenuContext = createContext<UsePopoverReturn | null>(null)

export interface MenuProps {
  children: ReactNode
}

function MenuPanelInner({ ctx, children }: { ctx: UsePopoverReturn; children: ReactNode }) {
  useSignals()
  const { popoverRef, anchorName, isOpen } = ctx

  // Resolve enabled items from the DOM: skips disabled items AND separators
  // (role="separator"), which the old nextElementSibling walk did not.
  const enabledItems = (): HTMLElement[] => {
    const panel = popoverRef.current
    if (!panel) return []
    return Array.from(
      panel.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])'),
    )
  }

  const focusItem = (resolve: (items: HTMLElement[], current: number) => number): void => {
    const items = enabledItems()
    if (items.length === 0) return
    const current = items.indexOf(document.activeElement as HTMLElement)
    items[resolve(items, current)]?.focus()
  }

  // Type-to-select: jump to the first enabled item whose label starts with the query.
  const typeahead = useTypeahead({
    onMatch: (query) => {
      const match = enabledItems().find((el) =>
        (el.textContent ?? '').trim().toLowerCase().startsWith(query),
      )
      match?.focus()
    },
  })

  useSignalEffect(() => {
    if (!isOpen.value) return
    const panel = popoverRef.current
    if (!panel) return
    const first = panel.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')
    first?.focus()
  })

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        focusItem((items, i) => (i < 0 ? 0 : (i + 1) % items.length))
        break
      case 'ArrowUp':
        e.preventDefault()
        focusItem((items, i) => (i < 0 ? items.length - 1 : (i - 1 + items.length) % items.length))
        break
      case 'Home':
        e.preventDefault()
        focusItem(() => 0)
        break
      case 'End':
        e.preventDefault()
        focusItem((items) => items.length - 1)
        break
      default:
        typeahead.onKeyDown(e)
    }
  }

  return (
    <div
      ref={popoverRef as React.RefObject<HTMLDivElement>}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore — popover is a valid HTML attribute not yet in React types
      popover="auto"
      role="menu"
      data-state={isOpen.value ? 'open' : 'closed'}
      style={{ positionAnchor: anchorName } as React.CSSProperties}
      className={styles.panel}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  )
}

function MenuPanel({ children }: { children: ReactNode }) {
  return (
    <MenuContext.Consumer>
      {(ctx) => {
        if (!ctx) throw new Error('MenuPanel must be inside <Menu>')
        return <MenuPanelInner ctx={ctx}>{children}</MenuPanelInner>
      }}
    </MenuContext.Consumer>
  )
}

export function Menu({ children }: MenuProps) {
  const popover = usePopover()
  const childArray = Array.isArray(children) ? children : [children]
  const [trigger, ...items] = childArray
  return (
    <MenuContext.Provider value={popover}>
      {trigger}
      <MenuPanel>{items}</MenuPanel>
    </MenuContext.Provider>
  )
}

export interface MenuTriggerProps {
  children: ReactNode
  'aria-label'?: string
}

function MenuTriggerInner({
  ctx,
  children,
  'aria-label': ariaLabel,
}: {
  ctx: UsePopoverReturn
  children: ReactNode
  'aria-label'?: string
}) {
  useSignals()
  const { triggerRef, toggle, anchorName, isOpen } = ctx
  return (
    <button
      ref={triggerRef as React.RefObject<HTMLButtonElement>}
      type="button"
      aria-haspopup="menu"
      aria-expanded={isOpen.value}
      aria-label={ariaLabel}
      style={{ anchorName } as React.CSSProperties}
      onClick={toggle}
      className={styles.trigger}
    >
      {children}
    </button>
  )
}

export function MenuTrigger({ children, 'aria-label': ariaLabel }: MenuTriggerProps) {
  return (
    <MenuContext.Consumer>
      {(ctx) => {
        if (!ctx) throw new Error('MenuTrigger must be inside <Menu>')
        return (
          <MenuTriggerInner ctx={ctx} {...(ariaLabel !== undefined && { 'aria-label': ariaLabel })}>
            {children}
          </MenuTriggerInner>
        )
      }}
    </MenuContext.Consumer>
  )
}

export interface MenuItemProps {
  children: ReactNode
  onSelect: () => void
  disabled?: boolean
}

export function MenuItem({ children, onSelect, disabled }: MenuItemProps) {
  return (
    <MenuContext.Consumer>
      {(ctx) => {
        if (!ctx) throw new Error('MenuItem must be inside <Menu>')
        const { close } = ctx
        function handleClick() {
          if (disabled) return
          onSelect()
          close()
        }
        function handleKeyDown(e: KeyboardEvent) {
          // Activation only. Arrow/Home/End/typeahead navigation is handled by the
          // menu panel (see MenuPanelInner) so disabled items and separators are
          // skipped. stopPropagation keeps Space activation from reaching the
          // panel's typeahead buffer.
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            e.stopPropagation()
            handleClick()
          }
        }
        return (
          <div
            role="menuitem"
            tabIndex={disabled ? -1 : 0}
            aria-disabled={disabled}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            className={styles.item}
          >
            {children}
          </div>
        )
      }}
    </MenuContext.Consumer>
  )
}

export function MenuSeparator() {
  return <div role="separator" className={styles.separator} />
}
