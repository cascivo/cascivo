'use client'

import { useRef } from 'react'
import type { KeyboardEvent, ReactNode, MouseEvent as ReactMouseEvent } from 'react'
import { useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import styles from './context-menu.module.css'

export interface ContextMenuProps {
  children: ReactNode
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

  const childArray = Array.isArray(children) ? children : [children]
  const [trigger, ...menuItems] = childArray

  return (
    <div ref={containerRef} onContextMenu={handleContextMenu} className={styles.wrapper}>
      {trigger}
      <div
        ref={menuRef}
        // @ts-ignore — popover is a valid HTML attribute not yet in React types
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
