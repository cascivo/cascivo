'use client'

import {
  cn,
  DismissableLayer,
  getLinkComponent,
  Presence,
  useAnchorPosition,
  useRovingFocus,
  useSignal,
  useSignals,
} from '@cascivo/core'
import type { RovingOrientation } from '@cascivo/core'
import { useId, useRef } from 'react'
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react'
import styles from './navigation-menu.module.css'

export interface NavigationMenuItem {
  id: string
  label: ReactNode
  href?: string
  content?: ReactNode
}

export interface NavigationMenuProps {
  items: NavigationMenuItem[]
  'aria-label'?: string
  orientation?: RovingOrientation
  className?: string
}

export function NavigationMenu({
  items,
  'aria-label': ariaLabel,
  orientation = 'horizontal',
  className,
}: NavigationMenuProps) {
  useSignals()
  const baseId = useId()
  const openId = useSignal<string | null>(null)
  const roving = useRovingFocus({ orientation, loop: true })

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(styles['nav'], className)}
      data-orientation={orientation}
    >
      <ul role="list" className={styles['list']}>
        {items.map((item, index) => (
          <NavigationMenuEntry
            key={item.id}
            item={item}
            baseId={baseId}
            openId={openId}
            itemProps={roving.getItemProps(index)}
          />
        ))}
      </ul>
    </nav>
  )
}

interface NavigationMenuEntryProps {
  item: NavigationMenuItem
  baseId: string
  openId: ReturnType<typeof useSignal<string | null>>
  itemProps: ReturnType<ReturnType<typeof useRovingFocus>['getItemProps']>
}

function NavigationMenuEntry({ item, baseId, openId, itemProps }: NavigationMenuEntryProps) {
  useSignals()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const floatingRef = useRef<HTMLDivElement>(null)
  const hasContent = item.content != null
  const isOpen = openId.value === item.id
  const panelId = `${baseId}-panel-${item.id}`

  const { anchorStyle, floatingStyle } = useAnchorPosition({
    anchorRef: triggerRef,
    floatingRef,
    placement: 'bottom-start',
    enabled: isOpen,
  })

  const { ref: rovingRef, onKeyDown: rovingKeyDown, ...rovingRest } = itemProps

  if (!hasContent) {
    // A registered link component must forward `ref` to its underlying anchor so
    // roving focus can move to it (TanStack/Next Link both do); defaults to `<a>`.
    const LinkComponent = getLinkComponent()
    return (
      <li className={styles['item']}>
        <LinkComponent
          ref={(el: HTMLAnchorElement | null) => rovingRef(el)}
          href={item.href}
          className={styles['link']}
          onKeyDown={rovingKeyDown}
          {...rovingRest}
        >
          {item.label}
        </LinkComponent>
      </li>
    )
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    rovingKeyDown(event)
    if (event.defaultPrevented) return
    if (event.key === 'Escape') {
      openId.value = null
    }
  }

  return (
    <li className={styles['item']}>
      <button
        ref={(el) => {
          triggerRef.current = el
          rovingRef(el)
        }}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        data-state={isOpen ? 'open' : 'closed'}
        className={styles['trigger']}
        style={anchorStyle}
        onClick={() => {
          openId.value = isOpen ? null : item.id
        }}
        onKeyDown={handleKeyDown}
        {...rovingRest}
      >
        {item.label}
      </button>
      <Presence present={isOpen}>
        <NavigationMenuPanel
          panelId={panelId}
          floatingRef={floatingRef}
          floatingStyle={floatingStyle}
          onClose={() => {
            openId.value = null
            triggerRef.current?.focus()
          }}
        >
          {item.content}
        </NavigationMenuPanel>
      </Presence>
    </li>
  )
}

interface NavigationMenuPanelProps {
  panelId: string
  floatingRef: React.RefObject<HTMLDivElement | null>
  floatingStyle: CSSProperties
  onClose: () => void
  children: ReactNode
}

function NavigationMenuPanel({
  panelId,
  floatingRef,
  floatingStyle,
  onClose,
  children,
}: NavigationMenuPanelProps) {
  return (
    <DismissableLayer onDismiss={onClose}>
      <div ref={floatingRef} id={panelId} className={styles['panel']} style={floatingStyle}>
        {children}
      </div>
    </DismissableLayer>
  )
}
