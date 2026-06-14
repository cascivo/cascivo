'use client'

import {
  cn,
  DismissableLayer,
  Presence,
  useAnchorPosition,
  useRovingFocus,
  useSignal,
  useSignals,
} from '@cascivo/core'
import { useId, useRef, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import styles from './menubar.module.css'

export interface MenubarItem {
  id: string
  label: ReactNode
  onSelect?: () => void
  disabled?: boolean
}

export interface MenubarMenu {
  id: string
  label: ReactNode
  items: MenubarItem[]
}

export interface MenubarProps {
  menus: MenubarMenu[]
  'aria-label': string
  className?: string
}

export function Menubar({ menus, 'aria-label': ariaLabel, className }: MenubarProps) {
  useSignals()
  const baseId = useId()
  const openId = useSignal<string | null>(null)
  const roving = useRovingFocus({ orientation: 'horizontal', loop: true })

  return (
    <div role="menubar" aria-label={ariaLabel} className={cn(styles['menubar'], className)}>
      {menus.map((menu, index) => (
        <MenubarTrigger
          key={menu.id}
          menu={menu}
          index={index}
          baseId={baseId}
          openId={openId}
          itemProps={roving.getItemProps(index)}
        />
      ))}
    </div>
  )
}

interface MenubarTriggerProps {
  menu: MenubarMenu
  index: number
  baseId: string
  openId: ReturnType<typeof useSignal<string | null>>
  itemProps: ReturnType<ReturnType<typeof useRovingFocus>['getItemProps']>
}

function MenubarTrigger({ menu, baseId, openId, itemProps }: MenubarTriggerProps) {
  useSignals()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const floatingRef = useRef<HTMLDivElement>(null)
  const isOpen = openId.value === menu.id
  const menuId = `${baseId}-menu-${menu.id}`

  const { anchorStyle, floatingStyle } = useAnchorPosition({
    anchorRef: triggerRef,
    floatingRef,
    placement: 'bottom-start',
    enabled: isOpen,
  })

  const focusFirstItem = (): void => {
    const first = floatingRef.current?.querySelector<HTMLElement>(
      '[role="menuitem"]:not([aria-disabled="true"])',
    )
    first?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    itemProps.onKeyDown(event)
    if (event.defaultPrevented) return
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openId.value = menu.id
      requestAnimationFrame(focusFirstItem)
    } else if (event.key === 'Escape') {
      openId.value = null
    }
  }

  const { ref: rovingRef, onKeyDown: _onKeyDown, ...rovingRest } = itemProps

  return (
    <>
      <button
        ref={(el) => {
          triggerRef.current = el
          rovingRef(el)
        }}
        type="button"
        role="menuitem"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        data-state={isOpen ? 'open' : 'closed'}
        className={styles['trigger']}
        style={anchorStyle}
        onClick={() => {
          openId.value = isOpen ? null : menu.id
        }}
        onKeyDown={handleKeyDown}
        {...rovingRest}
      >
        {menu.label}
      </button>
      <Presence present={isOpen}>
        <MenubarPanel
          menu={menu}
          menuId={menuId}
          floatingRef={floatingRef}
          floatingStyle={floatingStyle}
          onClose={() => {
            openId.value = null
            triggerRef.current?.focus()
          }}
        />
      </Presence>
    </>
  )
}

interface MenubarPanelProps {
  menu: MenubarMenu
  menuId: string
  floatingRef: React.RefObject<HTMLDivElement | null>
  floatingStyle: CSSProperties
  onClose: () => void
}

function MenubarPanel({ menu, menuId, floatingRef, floatingStyle, onClose }: MenubarPanelProps) {
  const handleItemKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const items = Array.from(
      floatingRef.current?.querySelectorAll<HTMLElement>(
        '[role="menuitem"]:not([aria-disabled="true"])',
      ) ?? [],
    )
    if (items.length === 0) return
    const current = items.indexOf(event.currentTarget)
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      items[(current + 1) % items.length]?.focus()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      items[(current - 1 + items.length) % items.length]?.focus()
    } else if (event.key === 'Home') {
      event.preventDefault()
      items[0]?.focus()
    } else if (event.key === 'End') {
      event.preventDefault()
      items[items.length - 1]?.focus()
    }
  }

  return (
    <DismissableLayer onDismiss={onClose}>
      <div
        ref={floatingRef}
        id={menuId}
        role="menu"
        aria-label={typeof menu.label === 'string' ? menu.label : undefined}
        className={styles['panel']}
        style={floatingStyle}
      >
        {menu.items.map((item) => (
          <div
            key={item.id}
            role="menuitem"
            tabIndex={-1}
            aria-disabled={item.disabled}
            className={styles['item']}
            onClick={() => {
              if (item.disabled) return
              item.onSelect?.()
              onClose()
            }}
            onKeyDown={(event) => {
              if (item.disabled) return
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                item.onSelect?.()
                onClose()
              } else {
                handleItemKeyDown(event)
              }
            }}
          >
            {item.label}
          </div>
        ))}
      </div>
    </DismissableLayer>
  )
}
