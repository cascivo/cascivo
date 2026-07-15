'use client'
import { batch, cn, useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { Kbd } from '../kbd/kbd'
import { Spinner } from '../spinner/spinner'
import styles from './command-menu.module.css'

export interface CommandPage {
  placeholder?: string
  groups: CommandGroup[]
}

/** An inline action revealed on the active/hovered row (e.g. "Open ↵", "New tab ⌘↵"). */
export interface CommandAction {
  id: string
  label: string
  /** Keycaps shown after the label, e.g. ['↵'] or ['⌘', '↵']. */
  shortcut?: string[]
  onSelect: () => void
}

/** A status pill shown on the right of a row (e.g. cluster health). */
export interface CommandStatus {
  label: string
  tone?: 'healthy' | 'degraded' | 'neutral'
}

export interface CommandItem {
  id: string
  label: string
  /** Secondary metadata line rendered in mono beneath the label (e.g. `region · plan · id`). */
  description?: string
  icon?: ReactNode
  shortcut?: string[]
  keywords?: string[]
  status?: CommandStatus
  /**
   * Inline actions revealed when the row is active/hovered. The first is the
   * primary (Enter), the second the secondary (Cmd/Ctrl+Enter); each is also
   * clickable. Takes precedence over `onSelect` for keyboard activation.
   */
  actions?: CommandAction[]
  /** Primary activation. Exactly one of onSelect, page, or actions drives a row. */
  onSelect?: () => void
  disabled?: boolean
  page?: CommandPage
}

export interface CommandGroup {
  heading?: string
  /** Associates the group with a scope id; hidden unless that scope (or none) is active. */
  scope?: string
  items: CommandItem[]
}

/** A filter scope selectable via pill, typed prefix (`c:`/`c `), or Tab. */
export interface CommandScope {
  id: string
  label: string
  /** Single-char prefix that activates this scope when typed, e.g. 'c' or '>'. */
  prefix?: string
}

export interface CommandMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groups: CommandGroup[]
  placeholder?: string
  emptyLabel?: string
  hotkey?: boolean
  label?: string
  loading?: boolean
  onQueryChange?: (query: string) => void
  /** Selectable filter scopes; enables the scope bar, chip, prefixes, and Tab cycling. */
  scopes?: CommandScope[]
  className?: string
}

export interface FuzzyMatch {
  score: number
  /** Indices in `text` that matched, in order. */
  indices: number[]
}

/**
 * Fuzzy subsequence matcher. Every character of `query` must appear in order
 * (case-insensitive) in `text`. Returns null for no match; higher score is
 * better. Consecutive runs and word-start matches score bonuses. `indices`
 * are the matched character positions, used to highlight the glyphs.
 */
export function fuzzyMatch(query: string, text: string): FuzzyMatch | null {
  if (query.length === 0) return { score: 1, indices: [] }
  const q = query.toLowerCase()
  const t = text.toLowerCase()
  let score = 0
  let qi = 0
  let prevMatch = -2
  const indices: number[] = []
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] !== q[qi]) continue
    score += 1
    // Consecutive-run bonus
    if (ti === prevMatch + 1) score += 4
    // Start-of-word bonus
    const before = ti === 0 ? ' ' : t[ti - 1]
    if (before === ' ' || before === '-' || before === '_' || before === '/') score += 8
    prevMatch = ti
    indices.push(ti)
    qi++
  }
  return qi === q.length ? { score, indices } : null
}

/** Score-only helper (backwards compatible). Returns 0 for no match. */
export function fuzzyScore(query: string, text: string): number {
  return fuzzyMatch(query, text)?.score ?? 0
}

function itemScore(query: string, item: CommandItem): number {
  let best = fuzzyScore(query, item.label)
  for (const keyword of item.keywords ?? []) {
    const score = fuzzyScore(query, keyword)
    if (score > best) best = score
  }
  return best
}

/** Splits `label` into highlighted (matched) and plain runs for rendering. */
function highlightLabel(label: string, indices: number[]): ReactNode {
  if (indices.length === 0) return label
  const matched = new Set(indices)
  const nodes: ReactNode[] = []
  let buffer = ''
  let bufferMatched = matched.has(0)
  const flush = (key: number) => {
    if (buffer === '') return
    nodes.push(
      bufferMatched ? (
        <mark key={key} className={styles['match']}>
          {buffer}
        </mark>
      ) : (
        buffer
      ),
    )
    buffer = ''
  }
  for (let i = 0; i < label.length; i++) {
    const isMatched = matched.has(i)
    if (isMatched !== bufferMatched) {
      flush(i)
      bufferMatched = isMatched
    }
    buffer += label[i]
  }
  flush(label.length)
  return nodes
}

/** Detects a scope prefix typed at the start of the query (e.g. `c `, `c:`, `>`). */
function matchScopePrefix(
  value: string,
  scopes: CommandScope[],
): { scope: CommandScope; rest: string } | null {
  for (const scope of scopes) {
    const prefix = scope.prefix
    if (!prefix) continue
    if (value.startsWith(`${prefix} `) || value.startsWith(`${prefix}:`)) {
      return { scope, rest: value.slice(prefix.length + 1).replace(/^\s+/, '') }
    }
    // Bare non-word prefix like ">"
    if (!/\w/.test(prefix) && value.startsWith(prefix)) {
      return { scope, rest: value.slice(prefix.length).replace(/^\s+/, '') }
    }
  }
  return null
}

export function CommandMenu({
  open,
  onOpenChange,
  groups,
  placeholder,
  emptyLabel,
  hotkey = true,
  label,
  loading = false,
  onQueryChange,
  scopes = [],
  className,
}: CommandMenuProps) {
  useSignals()
  const resolvedLabel = label ?? t(builtin.commandMenu.label)
  const resolvedEmptyLabel = emptyLabel ?? t(builtin.commandMenu.empty)
  const baseId = useId()
  const listboxId = `${baseId}-listbox`
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const optionRefs = useRef<(HTMLDivElement | null)[]>([])

  const onOpenChangeRef = useRef(onOpenChange)
  onOpenChangeRef.current = onOpenChange
  const onQueryChangeRef = useRef(onQueryChange)
  onQueryChangeRef.current = onQueryChange

  // Sync controlled props into signals — no-op when unchanged
  const isOpen = useSignal(open)
  isOpen.value = open
  const hotkeyEnabled = useSignal(hotkey)
  hotkeyEnabled.value = hotkey

  const query = useSignal('')
  const activeIndex = useSignal(0)
  const pageStack = useSignal<CommandPage[]>([])
  const activeScope = useSignal<string | null>(null)

  const activeGroups = pageStack.value.at(-1)?.groups ?? groups
  const activePlaceholder =
    placeholder ?? pageStack.value.at(-1)?.placeholder ?? t(builtin.commandMenu.placeholder)
  const activeScopeMeta = scopes.find((scope) => scope.id === activeScope.value) ?? null

  // Filter + rank: groups outside the active scope and with no matches disappear.
  // Unscoped groups stay visible under any scope (e.g. contextual actions).
  const filteredGroups = activeGroups
    .filter((group) => !activeScope.value || !group.scope || group.scope === activeScope.value)
    .map((group) => ({
      heading: group.heading,
      items: group.items
        .map((item) => ({ item, score: itemScore(query.value, item) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ item }) => ({ item, indices: fuzzyMatch(query.value, item.label)?.indices ?? [] })),
    }))
    .filter((group) => group.items.length > 0)

  const flatItems = filteredGroups.flatMap((group) => group.items.map((entry) => entry.item))
  const enabledIndexes = flatItems.flatMap((item, index) => (item.disabled ? [] : [index]))
  const active = enabledIndexes.includes(activeIndex.value)
    ? activeIndex.value
    : (enabledIndexes[0] ?? -1)
  const optionId = (index: number) => `${baseId}-option-${index}`

  // Open / close the native dialog; opening resets state and focuses the input
  useSignalEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isOpen.value) {
      if (!dialog.open) {
        batch(() => {
          query.value = ''
          activeIndex.value = 0
          pageStack.value = []
          activeScope.value = null
        })
        if (typeof dialog.showModal === 'function') dialog.showModal()
        inputRef.current?.focus()
      }
    } else if (dialog.open) {
      pageStack.value = []
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
    const el = optionRefs.current[index]
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'nearest' })
  }

  const moveActive = (delta: number) => {
    if (enabledIndexes.length === 0) return
    const position = enabledIndexes.indexOf(active)
    const next = enabledIndexes[(position + delta + enabledIndexes.length) % enabledIndexes.length]
    if (next !== undefined) setActive(next)
  }

  const runAction = (action: CommandAction) => {
    action.onSelect()
    onOpenChange(false)
  }

  const activateItem = (item: CommandItem | undefined, mode: 'primary' | 'secondary') => {
    if (!item || item.disabled) return
    if (item.page) {
      if (mode === 'secondary') return
      batch(() => {
        pageStack.value = [...pageStack.value, item.page!]
        query.value = ''
        activeIndex.value = 0
      })
      return
    }
    if (item.actions && item.actions.length > 0) {
      const action = mode === 'secondary' ? item.actions[1] : item.actions[0]
      if (action) runAction(action)
      return
    }
    if (mode === 'secondary') return
    item.onSelect?.()
    onOpenChange(false)
  }

  const cycleScope = (delta: number) => {
    if (scopes.length === 0) return
    const ids: (string | null)[] = [null, ...scopes.map((scope) => scope.id)]
    const current = ids.indexOf(activeScope.value)
    const next = ids[(current + delta + ids.length) % ids.length]
    batch(() => {
      activeScope.value = next ?? null
      activeIndex.value = 0
    })
  }

  const clearScope = () => {
    batch(() => {
      activeScope.value = null
      activeIndex.value = 0
    })
    inputRef.current?.focus()
  }

  const popPage = () => {
    batch(() => {
      pageStack.value = pageStack.value.slice(0, -1)
      query.value = ''
      activeIndex.value = 0
    })
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
      case 'Tab':
        if (scopes.length > 0) {
          event.preventDefault()
          cycleScope(event.shiftKey ? -1 : 1)
        }
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
        if (active >= 0) {
          activateItem(flatItems[active], event.metaKey || event.ctrlKey ? 'secondary' : 'primary')
        }
        break
      case 'Backspace':
        if (query.value === '') {
          if (pageStack.value.length > 0) {
            event.preventDefault()
            popPage()
          } else if (activeScope.value) {
            event.preventDefault()
            clearScope()
          }
        }
        break
    }
  }

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      if (pageStack.value.length > 0) {
        popPage()
      } else {
        dialogRef.current?.close()
      }
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
      aria-label={resolvedLabel}
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
          {activeScopeMeta && (
            <span className={styles['scopeChip']}>
              {activeScopeMeta.label}
              <button
                type="button"
                className={styles['scopeClear']}
                aria-label={t(builtin.commandMenu.clearScope)}
                onClick={clearScope}
              >
                <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                  <path
                    d="M4 4l8 8M12 4l-8 8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </span>
          )}
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listboxId}
            aria-activedescendant={active >= 0 ? optionId(active) : undefined}
            aria-autocomplete="list"
            aria-label={resolvedLabel}
            autoComplete="off"
            spellCheck={false}
            className={styles['input']}
            placeholder={activePlaceholder}
            value={query.value}
            onChange={(event) => {
              let value = event.target.value
              if (!activeScope.value && scopes.length > 0) {
                const matched = matchScopePrefix(value, scopes)
                if (matched) {
                  activeScope.value = matched.scope.id
                  value = matched.rest
                }
              }
              query.value = value
              activeIndex.value = 0
              onQueryChangeRef.current?.(value)
            }}
            onKeyDown={handleInputKeyDown}
          />
        </div>
        {scopes.length > 0 && (
          <div className={styles['scopes']}>
            <span className={styles['scopesLabel']}>{t(builtin.commandMenu.scopeLabel)}</span>
            {scopes.map((scope) => (
              <button
                key={scope.id}
                type="button"
                className={styles['scopePill']}
                data-active={scope.id === activeScope.value || undefined}
                onClick={() => {
                  batch(() => {
                    activeScope.value = activeScope.value === scope.id ? null : scope.id
                    activeIndex.value = 0
                  })
                  inputRef.current?.focus()
                }}
              >
                {scope.prefix && <span className={styles['scopePrefix']}>{scope.prefix}</span>}
                {scope.label}
              </button>
            ))}
          </div>
        )}
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
                    <span>{group.heading}</span>
                    {query.value !== '' && (
                      <span className={styles['count']}>
                        {t(builtin.commandMenu.matches, { count: group.items.length })}
                      </span>
                    )}
                  </div>
                )}
                {group.items.map((entry) => {
                  const { item, indices } = entry
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
                      onClick={() => activateItem(item, 'primary')}
                    >
                      {item.icon && (
                        <span className={styles['icon']} aria-hidden="true">
                          {item.icon}
                        </span>
                      )}
                      <span className={styles['text']}>
                        <span className={styles['label']}>
                          {highlightLabel(item.label, indices)}
                        </span>
                        {item.description && (
                          <span className={styles['description']}>{item.description}</span>
                        )}
                      </span>
                      {item.status && (
                        <span
                          className={styles['status']}
                          data-tone={item.status.tone ?? 'neutral'}
                        >
                          <span className={styles['statusDot']} aria-hidden="true" />
                          {item.status.label}
                        </span>
                      )}
                      {item.actions && item.actions.length > 0 && (
                        <span className={styles['actions']}>
                          {item.actions.map((action) => (
                            <button
                              key={action.id}
                              type="button"
                              className={styles['action']}
                              onClick={(event) => {
                                event.stopPropagation()
                                runAction(action)
                              }}
                            >
                              {action.label}
                              {action.shortcut && (
                                <span className={styles['actionKeys']} aria-hidden="true">
                                  {action.shortcut.map((key, keyIndex) => (
                                    <Kbd key={keyIndex} size="sm">
                                      {key}
                                    </Kbd>
                                  ))}
                                </span>
                              )}
                            </button>
                          ))}
                        </span>
                      )}
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
          {flatItems.length === 0 &&
            (loading ? (
              <div role="status" className={styles['empty']}>
                <Spinner size="sm" />
                {t(builtin.commandMenu.loading)}
              </div>
            ) : (
              <div role="status" className={styles['empty']}>
                {resolvedEmptyLabel}
              </div>
            ))}
        </div>
        <div className={styles['footer']} aria-hidden="true">
          <span className={styles['hint']}>
            <Kbd size="sm">↑</Kbd>
            <Kbd size="sm">↓</Kbd> navigate
          </span>
          <span className={styles['hint']}>
            <Kbd size="sm">↵</Kbd> open
          </span>
          {scopes.length > 0 && (
            <span className={styles['hint']}>
              <Kbd size="sm">Tab</Kbd> scope
            </span>
          )}
          <span className={styles['hint']}>
            <Kbd size="sm">esc</Kbd> close
          </span>
        </div>
      </div>
    </dialog>
  )
}
