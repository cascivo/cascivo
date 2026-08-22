'use client'
import {
  composeRefs,
  createMachine,
  focusElement,
  useEffectPropSignal,
  useMachine,
  useSignal,
  useSignalEffect,
  useSignals,
} from '@cascivo/core'
import { cloneElement, useRef } from 'react'
import type { KeyboardEvent, MouseEvent, ReactElement, ReactNode, Ref } from 'react'
import styles from './dropdown.module.css'

const machine = createMachine({
  initial: 'closed' as const,
  states: {
    closed: { on: { OPEN: 'open' } },
    open: { on: { CLOSE: 'closed' } },
  },
})

/** A selectable row in a `Dropdown` menu. */
export interface DropdownMenuItem {
  label: string
  value: string
  icon?: ReactNode
  disabled?: boolean
  /**
   * ⚠ **Deprecated, and it discards this entry's data.** `separator` marks the entry AS a
   * rule — it does not draw one above the item — so `label`, `value` and `icon` are dropped
   * and the row never renders. An adopter lost a "Log out" item to this and found it only
   * because a smoke test counted rows (2026-08-22 report item 9).
   *
   * Behaviour is unchanged for existing code; dev logs a warning naming the fix.
   *
   * @deprecated Use a separate `{ kind: 'separator' }` entry, which needs no `label`/`value`.
   */
  separator?: boolean
}

/**
 * A horizontal rule between groups of items. Carries no data, takes no `label`/`value`, and
 * is skipped by keyboard navigation and selection.
 */
export interface DropdownSeparatorItem {
  kind: 'separator'
}

/**
 * A `Dropdown` entry: either a selectable item or a separator.
 *
 * The union is tagged on `kind` (the catalog convention — `type` is reserved for HTML-ish
 * meanings), so a separator cannot carry data that would be silently discarded.
 */
export type DropdownItem = DropdownMenuItem | DropdownSeparatorItem

/**
 * Narrows to the selectable rows, excluding **both** separator spellings. One predicate for
 * every call site — nav, selection and render — so the three cannot disagree about what
 * counts as a separator.
 */
function isMenuItem(item: DropdownItem): item is DropdownMenuItem {
  return !('kind' in item) && item.separator !== true
}

const warnedSeparatorDataLoss = new Set<string>()

/** True unless the build's NODE_ENV is 'production'. Read via `globalThis` so the
 * browser-facing source needs no `@types/node`, and it's safe where `process` is
 * absent (bundlers replace `process.env.NODE_ENV` in app builds). */
function isDev(): boolean {
  const env = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env
  return env?.NODE_ENV !== 'production'
}

/**
 * Dev-only, deduped warning for the one unambiguous mistake: `separator: true` combined with a
 * non-empty `label`. Nobody writes a label for a rule on purpose, so this fires exactly when
 * the adopter meant "draw a rule above this item" and lost the item instead.
 */
function warnIfSeparatorDiscardsData(items: DropdownItem[]): void {
  if (!isDev()) return
  for (const item of items) {
    if ('kind' in item) continue
    if (item.separator !== true) continue
    if (!item.label) continue
    if (warnedSeparatorDataLoss.has(item.label)) continue
    warnedSeparatorDataLoss.add(item.label)
    console.warn(
      `cascivo Dropdown: item { label: ${JSON.stringify(item.label)}, separator: true } ` +
        `renders ONLY a rule — its label, value and icon are discarded. \`separator\` marks ` +
        `the entry AS a separator, it does not add a rule above it. Use two entries: ` +
        `{ label: ${JSON.stringify(item.label)}, value: … }, { kind: 'separator' }`,
    )
  }
}

export interface DropdownProps {
  trigger: ReactElement
  items: DropdownItem[]
  onSelect?: (value: string) => void
  /**
   * Which trigger edge the menu aligns to. `bottom-start` hangs it from the trigger's start
   * edge, `bottom-end` from its end edge — use `bottom-end` for a trigger near the end of
   * the viewport.
   *
   * @defaultValue `bottom-start`
   * @see the component manifest
   */
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
  warnIfSeparatorDiscardsData(items)
  const [state, send] = useMachine(machine)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const activeIndex = useSignal(-1)

  const isControlled = open !== undefined
  const isOpen = isControlled ? open : state.value === 'open'
  const openSignal = useEffectPropSignal(isOpen)

  const enabledIndexes = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => isMenuItem(item) && !item.disabled)
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

  // Open/close the popover and sync light-dismiss (toggle event) back to state.
  useSignalEffect(() => {
    if (openSignal.value) {
      menuRef.current?.showPopover()
    } else {
      menuRef.current?.hidePopover()
    }
  })

  useSignalEffect(() => {
    const menu = menuRef.current
    if (!menu) return
    const handleToggle = (event: Event) => {
      const toggle = event as ToggleEvent
      if (toggle.newState === 'closed') setOpen(false)
    }
    menu.addEventListener('toggle', handleToggle)
    return () => menu.removeEventListener('toggle', handleToggle)
  })

  const selectAt = (index: number) => {
    const item = items[index]
    if (!item || !isMenuItem(item) || item.disabled) return
    onSelect?.(item.value)
    setOpen(false)
    focusElement(triggerRef.current)
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
        focusElement(triggerRef.current)
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
        ref={menuRef}
        popover="auto"
        role="menu"
        data-placement={placement}
        data-state={isOpen ? 'open' : 'closed'}
        className={styles['menu']}
        onKeyDown={handleMenuKeyDown}
      >
        {items.map((item, index) =>
          !isMenuItem(item) ? (
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
