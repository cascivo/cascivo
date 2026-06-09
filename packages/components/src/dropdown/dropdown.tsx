'use client'
import {
  composeRefs,
  createMachine,
  useMachine,
  useSignal,
  useSignalEffect,
  useSignals,
} from '@cascade-ui/core'
import {
  cloneElement,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react'
import styles from './dropdown.module.css'

const machine = createMachine({
  initial: 'closed' as const,
  states: {
    closed: { on: { OPEN: 'open' } },
    open: { on: { CLOSE: 'closed' } },
  },
})

export interface DropdownItem {
  label: string
  value: string
  icon?: ReactNode
  disabled?: boolean
  separator?: boolean
}

export interface DropdownProps {
  trigger: ReactElement
  items: DropdownItem[]
  onSelect?: (value: string) => void
  placement?: 'bottom-start' | 'bottom-end'
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function Dropdown({
  trigger,
  items,
  onSelect,
  placement = 'bottom-start',
  open,
  onOpenChange,
}: DropdownProps) {
  useSignals()
  const [state, send] = useMachine(machine)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const activeIndex = useSignal(-1)

  const isControlled = open !== undefined
  const isOpen = isControlled ? open : state.value === 'open'
  const openSignal = useSignal(isOpen)
  openSignal.value = isOpen

  const enabledIndexes = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !item.separator && !item.disabled)
    .map(({ index }) => index)

  const setOpen = (next: boolean) => {
    if (!isControlled) send(next ? 'OPEN' : 'CLOSE')
    onOpenChange?.(next)
  }

  // Move keyboard focus to the active item whenever it changes while open.
  useSignalEffect(() => {
    const index = activeIndex.value
    if (openSignal.value && index >= 0) {
      itemRefs.current[index]?.focus()
    }
  })

  // Reset / seed the active item as the menu opens and closes.
  useSignalEffect(() => {
    if (openSignal.value) {
      activeIndex.value = enabledIndexes[0] ?? -1
    } else {
      activeIndex.value = -1
    }
  })

  // Dismiss on outside pointer interaction.
  useSignalEffect(() => {
    if (!openSignal.value) return
    const handlePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointer)
    return () => document.removeEventListener('pointerdown', handlePointer)
  })

  const selectAt = (index: number) => {
    const item = items[index]
    if (!item || item.separator || item.disabled) return
    onSelect?.(item.value)
    setOpen(false)
    triggerRef.current?.focus()
  }

  const moveActive = (delta: number) => {
    if (enabledIndexes.length === 0) return
    const current = enabledIndexes.indexOf(activeIndex.value)
    const next = (current + delta + enabledIndexes.length) % enabledIndexes.length
    activeIndex.value = enabledIndexes[next] ?? -1
  }

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        moveActive(1)
        break
      case 'ArrowUp':
        event.preventDefault()
        moveActive(-1)
        break
      case 'Home':
        event.preventDefault()
        activeIndex.value = enabledIndexes[0] ?? -1
        break
      case 'End':
        event.preventDefault()
        activeIndex.value = enabledIndexes[enabledIndexes.length - 1] ?? -1
        break
      case 'Escape':
        event.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        selectAt(activeIndex.value)
        break
    }
  }

  const triggerEl = trigger as ReactElement<{
    ref?: Ref<HTMLElement>
    onClick?: (e: MouseEvent) => void
  }>
  const renderedTrigger = cloneElement(triggerEl, {
    ref: composeRefs(triggerRef, triggerEl.props.ref),
    onClick: (event: MouseEvent) => {
      triggerEl.props.onClick?.(event)
      setOpen(!isOpen)
    },
    'aria-haspopup': 'menu',
    'aria-expanded': isOpen,
  } as Record<string, unknown>)

  return (
    <div ref={rootRef} className={styles['root']}>
      {renderedTrigger}
      <div
        role="menu"
        data-placement={placement}
        data-state={isOpen ? 'open' : 'closed'}
        className={styles['menu']}
        onKeyDown={handleMenuKeyDown}
      >
        {items.map((item, index) =>
          item.separator ? (
            <div key={`sep-${index}`} role="separator" className={styles['separator']} />
          ) : (
            <button
              key={item.value}
              type="button"
              role="menuitem"
              ref={(el) => {
                itemRefs.current[index] = el
              }}
              tabIndex={activeIndex.value === index ? 0 : -1}
              disabled={item.disabled}
              className={styles['item']}
              onClick={() => selectAt(index)}
            >
              {item.icon && (
                <span className={styles['icon']} aria-hidden="true">
                  {item.icon}
                </span>
              )}
              {item.label}
            </button>
          ),
        )}
      </div>
    </div>
  )
}
