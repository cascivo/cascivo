'use client'

import { Children, isValidElement, useRef } from 'react'
import type { KeyboardEvent, ReactNode, MouseEvent as ReactMouseEvent } from 'react'
import { useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import styles from './context-menu.module.css'

export interface ContextMenuProps {
  children: ReactNode
}

/** True unless the build's NODE_ENV is 'production'. Read via `globalThis` so this
 * browser-facing source needs no `@types/node`, and it's safe where `process` is absent
 * (bundlers replace `process.env.NODE_ENV` in app builds). Matches `field.tsx`. */
function isDev(): boolean {
  const env = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env
  return env?.NODE_ENV !== 'production'
}

export function ContextMenu({ children }: ContextMenuProps) {
  useSignals()
  const menuRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isOpen = useSignal(false)

  // Resolve enabled items from the DOM, skipping disabled items — mirrors
  // Menu's enabledItems() (menu.tsx) so overlay menu content with opaque
  // children shares one navigation pattern across the codebase.
  const enabledItems = (): HTMLElement[] => {
    const panel = menuRef.current
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

  const handleMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
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
    }
  }

  useSignalEffect(() => {
    const el = menuRef.current
    if (!el) return
    if (isOpen.value) {
      try {
        el.showPopover()
      } catch {
        /* noop */
      }
      enabledItems()[0]?.focus()
    } else {
      try {
        el.hidePopover()
      } catch {
        /* noop */
      }
    }
  })

  // Sync light-dismiss close back to signal
  useSignalEffect(() => {
    const el = menuRef.current
    if (!el) return
    const handler = (e: Event) => {
      const toggleEvent = e as ToggleEvent
      if (toggleEvent.newState === 'closed') {
        isOpen.value = false
      }
    }
    el.addEventListener('toggle', handler)
    return () => el.removeEventListener('toggle', handler)
  })

  function handleContextMenu(e: ReactMouseEvent) {
    e.preventDefault()
    const container = containerRef.current
    if (!container) return
    container.style.setProperty('--cascivo-context-x', `${e.clientX}px`)
    container.style.setProperty('--cascivo-context-y', `${e.clientY}px`)
    isOpen.value = true
  }

  // Partitioned by component IDENTITY, not by position: everything that is a
  // `ContextMenuItem` belongs in the menu, everything else is the content you right-click.
  // Positional destructuring meant a fragment-wrapped target, or a conditional first item,
  // silently swapped the two.
  const childArray = Children.toArray(children)
  const menuItems = childArray.filter((c) => isValidElement(c) && c.type === ContextMenuItem)
  const trigger = childArray.filter((c) => !menuItems.includes(c))

  if (menuItems.length === 0 && isDev()) {
    throw new Error(
      '<ContextMenu> requires at least one <ContextMenuItem> child. Items are matched by ' +
        'component identity, so they must be direct children — not wrapped in a fragment ' +
        'or another component.',
    )
  }

  return (
    <div ref={containerRef} onContextMenu={handleContextMenu} className={styles.wrapper}>
      {trigger}
      <div
        ref={menuRef}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        popover="auto"
        role="menu"
        data-state={isOpen.value ? 'open' : 'closed'}
        className={styles.menu}
        onKeyDown={handleMenuKeyDown}
      >
        {menuItems}
      </div>
    </div>
  )
}

export interface ContextMenuItemProps {
  children: ReactNode
  onSelect: () => void
  disabled?: boolean
}

export function ContextMenuItem({ children, onSelect, disabled }: ContextMenuItemProps) {
  function handleSelect() {
    if (!disabled) onSelect()
  }
  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    // Activation only — Arrow/Home/End navigation is handled by the menu
    // container (see ContextMenu.handleMenuKeyDown) so disabled items are skipped.
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleSelect()
    }
  }
  return (
    <div
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      className={styles.item}
    >
      {children}
    </div>
  )
}
