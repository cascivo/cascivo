'use client'
import { cn, useSignal, useSignalEffect, useSignals } from '@cascade-ui/core'
import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { Kbd } from '../kbd/kbd'
import styles from './command-menu.module.css'

export interface CommandItem {
  id: string
  label: string
  icon?: ReactNode
  shortcut?: string[]
  keywords?: string[]
  onSelect: () => void
  disabled?: boolean
}

export interface CommandGroup {
  heading?: string
  items: CommandItem[]
}

export interface CommandMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groups: CommandGroup[]
  placeholder?: string
  emptyLabel?: string
  hotkey?: boolean
  label?: string
  className?: string
}

/**
 * Fuzzy subsequence matcher. Every character of `query` must appear in order
 * (case-insensitive) in `text`. Returns 0 for no match; higher is better.
 * Consecutive runs and word-start matches score bonuses.
 */
export function fuzzyScore(query: string, text: string): number {
  if (query.length === 0) return 1
  const q = query.toLowerCase()
  const t = text.toLowerCase()
  let score = 0
  let qi = 0
  let prevMatch = -2
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] !== q[qi]) continue
    score += 1
    // Consecutive-run bonus
    if (ti === prevMatch + 1) score += 4
    // Start-of-word bonus
    const before = ti === 0 ? ' ' : t[ti - 1]
    if (before === ' ' || before === '-' || before === '_' || before === '/') score += 8
    prevMatch = ti
    qi++
  }
  return qi === q.length ? score : 0
}

function itemScore(query: string, item: CommandItem): number {
  let best = fuzzyScore(query, item.label)
  for (const keyword of item.keywords ?? []) {
    const score = fuzzyScore(query, keyword)
    if (score > best) best = score
  }
  return best
}

export function CommandMenu({
  open,
  onOpenChange,
  groups,
  placeholder = 'Type a command or search…',
  emptyLabel = 'No results found',
  hotkey = true,
  label = 'Command menu',
  className,
}: CommandMenuProps) {
  useSignals()
  const baseId = useId()
  const listboxId = `${baseId}-listbox`
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const optionRefs = useRef<(HTMLDivElement | null)[]>([])

  const onOpenChangeRef = useRef(onOpenChange)
  onOpenChangeRef.current = onOpenChange

  // Sync controlled props into signals — no-op when unchanged
  const isOpen = useSignal(open)
  isOpen.value = open
  const hotkeyEnabled = useSignal(hotkey)
  hotkeyEnabled.value = hotkey

  const query = useSignal('')
  const activeIndex = useSignal(0)

  // Filter + rank: groups with no matching items disappear
  const filteredGroups = groups
    .map((group) => ({
      heading: group.heading,
      items: group.items
        .map((item) => ({ item, score: itemScore(query.value, item) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ item }) => item),
    }))
    .filter((group) => group.items.length > 0)

  const flatItems = filteredGroups.flatMap((group) => group.items)
  const enabledIndexes = flatItems.flatMap((item, index) => (item.disabled ? [] : [index]))
  const active = enabledIndexes.includes(activeIndex.value)
    ? activeIndex.value
    : (enabledIndexes[0] ?? -1)
  const optionId = (index: number) => `${baseId}-option-${index}`

  // Open / close the native dialog; opening resets query + active and focuses the input
  useSignalEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isOpen.value) {
      if (!dialog.open) {
        query.value = ''
        activeIndex.value = 0
        dialog.showModal()
        inputRef.current?.focus()
      }
    } else if (dialog.open) {
      dialog.close()
    }
  })

  // Native 'close' (Escape via cancel, programmatic close) → notify parent
  useSignalEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handler = () => onOpenChangeRef.current(false)
    dialog.addEventListener('close', handler)
    return () => dialog.removeEventListener('close', handler)
  })

  // Global Cmd/Ctrl+K hotkey
  useSignalEffect(() => {
    if (!hotkeyEnabled.value) return
    const handler = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        onOpenChangeRef.current(!isOpen.value)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  const setActive = (index: number) => {
    activeIndex.value = index
    optionRefs.current[index]?.scrollIntoView({ block: 'nearest' })
  }

  const moveActive = (delta: number) => {
    if (enabledIndexes.length === 0) return
    const position = enabledIndexes.indexOf(active)
    const next = enabledIndexes[(position + delta + enabledIndexes.length) % enabledIndexes.length]
    if (next !== undefined) setActive(next)
  }

  const selectItem = (item: CommandItem | undefined) => {
    if (!item || item.disabled) return
    item.onSelect()
    onOpenChange(false)
  }

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
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
        if (enabledIndexes[0] !== undefined) setActive(enabledIndexes[0])
        break
      case 'End': {
        event.preventDefault()
        const last = enabledIndexes[enabledIndexes.length - 1]
        if (last !== undefined) setActive(last)
        break
      }
      case 'Enter':
        event.preventDefault()
        if (active >= 0) selectItem(flatItems[active])
        break
    }
  }

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      dialogRef.current?.close()
    }
  }

  const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) {
      dialogRef.current?.close()
    }
  }

  let flatIndex = -1

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      className={cn(styles['dialog'], className)}
      onClick={handleBackdropClick}
      onKeyDown={handleDialogKeyDown}
    >
      <div className={styles['panel']}>
        <div className={styles['search']}>
          <svg
            className={styles['searchIcon']}
            aria-hidden="true"
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <circle cx="7" cy="7" r="4.5" />
            <line x1="10.5" y1="10.5" x2="14" y2="14" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listboxId}
            aria-activedescendant={active >= 0 ? optionId(active) : undefined}
            aria-autocomplete="list"
            aria-label={label}
            autoComplete="off"
            spellCheck={false}
            className={styles['input']}
            placeholder={placeholder}
            value={query.value}
            onChange={(event) => {
              query.value = event.target.value
              activeIndex.value = 0
            }}
            onKeyDown={handleInputKeyDown}
          />
        </div>
        <div className={styles['list']}>
          <div role="listbox" id={listboxId} aria-label={label}>
            {filteredGroups.map((group, groupIndex) => (
              <div
                key={group.heading ?? `group-${groupIndex}`}
                role="group"
                aria-label={group.heading}
                className={styles['group']}
              >
                {group.heading && (
                  <div className={styles['heading']} aria-hidden="true">
                    {group.heading}
                  </div>
                )}
                {group.items.map((item) => {
                  flatIndex++
                  const index = flatIndex
                  return (
                    <div
                      key={item.id}
                      ref={(el) => {
                        optionRefs.current[index] = el
                      }}
                      id={optionId(index)}
                      role="option"
                      aria-selected={index === active}
                      aria-disabled={item.disabled || undefined}
                      data-state={index === active ? 'active' : undefined}
                      data-disabled={item.disabled || undefined}
                      className={styles['option']}
                      onMouseEnter={() => {
                        if (!item.disabled) activeIndex.value = index
                      }}
                      onClick={() => selectItem(item)}
                    >
                      {item.icon && (
                        <span className={styles['icon']} aria-hidden="true">
                          {item.icon}
                        </span>
                      )}
                      <span className={styles['label']}>{item.label}</span>
                      {item.shortcut && (
                        <span className={styles['shortcut']} aria-hidden="true">
                          {item.shortcut.map((key, keyIndex) => (
                            <Kbd key={keyIndex} size="sm">
                              {key}
                            </Kbd>
                          ))}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
          {flatItems.length === 0 && (
            <div role="status" className={styles['empty']}>
              {emptyLabel}
            </div>
          )}
        </div>
        <div className={styles['footer']} aria-hidden="true">
          <span className={styles['hint']}>
            <Kbd size="sm">↑</Kbd>
            <Kbd size="sm">↓</Kbd> to navigate
          </span>
          <span className={styles['hint']}>
            <Kbd size="sm">↵</Kbd> to select
          </span>
          <span className={styles['hint']}>
            <Kbd size="sm">esc</Kbd> to close
          </span>
        </div>
      </div>
    </dialog>
  )
}
