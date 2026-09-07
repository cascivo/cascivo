'use client'
import {
  cn,
  focusElement,
  useControllableSignal,
  useSignal,
  useSignalEffect,
  useSignals,
} from '@cascivo/core'
import { useId, useRef } from 'react'
import type { HTMLAttributes, KeyboardEvent } from 'react'
import { t, builtin } from '@cascivo/i18n'
import { usePopover } from '../popover/use-popover'
import { clampActive, firstActive, lastActive, moveActive, pageActive } from './list-nav'
import {
  filterOptions,
  groupOptions,
  highlightSegments,
  isNewLabel,
  orderByGroup,
} from './option-list'
import type { MultiSelectOption } from './option-list'
import styles from './multi-select.module.css'

export type { MultiSelectOption } from './option-list'

export interface MultiSelectLabels {
  label?: string
  placeholder?: string
  selected?: (count: number) => string
  search?: string
  noResults?: string
  /** Text shown in place of the no-results message while `loading` is true. */
  loading?: string
  clear?: string
  remove?: string
  /** Text on the select-all row while nothing is selected. */
  selectAll?: string
  clearAll?: string
  create?: string
}

/** Join own + inherited `aria-describedby` ids; `undefined` when there are none. */
function mergeDescribedBy(...ids: (string | undefined)[]): string | undefined {
  return ids.filter(Boolean).join(' ') || undefined
}

export interface MultiSelectProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  /**
   * Wired automatically by a wrapping `Field` — its label id. Forwarded to the focusable
   * control so the Field's label names it.
   */
  'aria-labelledby'?: string
  /**
   * Wired automatically by a wrapping `Field` — the ids of its hint/error text. **Merged**
   * with this component's own `hint`/`error` ids rather than replacing them, so both are
   * announced.
   */
  'aria-describedby'?: string
  /** Wired automatically by a wrapping `Field` when it is in an error state. */
  'aria-invalid'?: boolean
  options: MultiSelectOption[]
  /** The controlled value. Omit it and pass `defaultValue` to let the component own the selection. */
  value?: string[]
  /**
   * The initial value when uncontrolled.
   *
   * @defaultValue `[]`
   * @see the component manifest
   */
  defaultValue?: string[]
  /** Called with the new value when it changes. */
  onValueChange?: (value: string[]) => void
  placeholder?: string
  /** Visible field label. */
  label?: string
  /**
   * Invisible accessible name, for when a visible element outside this component already
   * labels it and `label` would render that text a second time.
   *
   * `label` on this component is **visible**. `IconButton.label` and `Sparkline.label` are
   * invisible names, so an adopter arriving with that prior writes `label` here and gets the
   * text twice (2026-08-22 report item 13). Both props are listed side by side, each saying
   * which it is.
   */
  ariaLabel?: string
  hint?: string
  error?: string
  /**
   * How the trigger summarises the selection: a count, or one removable chip per value.
   *
   * @defaultValue `'count'`
   * @see the component manifest
   */
  display?: 'count' | 'chips'
  /**
   * When true, disables the control and removes it from the tab order.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  disabled?: boolean
  /**
   * When true, shows a control that clears every selected value.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  clearable?: boolean
  /**
   * When true, shows a row that selects or clears every enabled option at once.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  selectAll?: boolean
  /** Maximum number of values that may be selected. Further options become unselectable once reached. */
  max?: number
  /**
   * When true, offers the current search text as a new option.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  creatable?: boolean
  /** Called with the typed label when the user picks the "create" row. */
  onCreate?: (label: string) => void
  /**
   * When true, the list reports itself as busy and shows a loading row instead of the
   * no-results message.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  loading?: boolean
  /** Called with the search text on every keystroke. Pair it with `filter={() => true}` for a server-driven list. */
  onSearchChange?: (query: string) => void
  /** Replaces the built-in diacritic-insensitive matcher. */
  filter?: (option: MultiSelectOption, query: string) => boolean
  /**
   * When true, shows the search field. The list is keyboard-navigable either way.
   *
   * @defaultValue `true`
   * @see the component manifest
   */
  searchable?: boolean
  /**
   * Field height.
   *
   * @defaultValue `'md'`
   * @see the component manifest
   */
  size?: 'sm' | 'md' | 'lg'
  /** Submitted with a surrounding form — one hidden input per selected value. */
  name?: string
  labels?: MultiSelectLabels
  id?: string
}

export function MultiSelect({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  label,
  ariaLabel,
  hint,
  error,
  display = 'count',
  disabled = false,
  clearable = false,
  selectAll = false,
  max,
  creatable = false,
  onCreate,
  loading = false,
  onSearchChange,
  filter,
  searchable = true,
  size = 'md',
  name,
  labels,
  className,
  id,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: MultiSelectProps) {
  useSignals()
  const popover = usePopover({ placement: 'bottom' })
  const baseId = useId()
  const triggerId = id ?? `${baseId}-trigger`
  const listboxId = `${baseId}-listbox`
  const panelId = `${baseId}-panel`
  const searchId = `${baseId}-search`
  const optionId = (index: number): string => `${baseId}-option-${index}`

  const searchQuery = useSignal('')
  const activeIndex = useSignal(-1)
  const listboxRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Selection goes through the shared primitive so `value` may be omitted entirely. A bare
  // `sig.value = prop` in render notifies the previous render's subscriptions, which React 19
  // reports as a setState during render; the primitive skips the write when nothing changed.
  const [selected, setSelected] = useControllableSignal<string[]>({
    value,
    defaultValue: defaultValue ?? [],
    onChange: onValueChange,
  })

  const isOpen = popover.isOpen.value
  const selectedValues = selected.value
  const atMax = max !== undefined && selectedValues.length >= max

  // Derived from props, so this is a plain render-time computation. `useComputed` would cache
  // it until a *signal* dependency changed and would go stale the moment a parent swapped
  // `options` — which is exactly what a remote-search list does on every response.
  const query = searchQuery.value
  const filtered = orderByGroup(filterOptions(options, searchable ? query : '', filter))
  const showCreate = creatable && query.trim() !== '' && isNewLabel(options, query.trim())
  const createIndex = showCreate ? filtered.length : -1
  const groups = groupOptions(filtered)

  const resolvedPlaceholder =
    placeholder ?? labels?.placeholder ?? t(builtin.multiSelect.placeholder)
  const searchPlaceholder = labels?.search ?? t(builtin.multiSelect.search)
  const noResultsText = labels?.noResults ?? t(builtin.multiSelect.noResults)
  const loadingText = labels?.loading ?? t(builtin.multiSelect.loading)
  const listLabel = labels?.label ?? label ?? ariaLabel ?? t(builtin.multiSelect.label)
  const clearLabel = labels?.clear ?? t(builtin.multiSelect.clear)
  const selectAllLabel = labels?.selectAll ?? t(builtin.multiSelect.selectAll)
  const clearAllLabel = labels?.clearAll ?? t(builtin.multiSelect.clearAll)
  const removeLabel = (optionLabel: string): string =>
    labels?.remove
      ? labels.remove.replaceAll('{label}', optionLabel)
      : t(builtin.multiSelect.remove, { label: optionLabel })
  const createLabel = (optionLabel: string): string =>
    labels?.create
      ? labels.create.replaceAll('{label}', optionLabel)
      : t(builtin.multiSelect.create, { label: optionLabel })

  const selectedOptions = selectedValues.flatMap((v) => {
    const option = options.find((o) => o.value === v)
    return option ? [option] : [{ value: v, label: v }]
  })

  const triggerLabel =
    selectedValues.length === 0
      ? resolvedPlaceholder
      : labels?.selected
        ? labels.selected(selectedValues.length)
        : t(builtin.multiSelect.selected, { count: String(selectedValues.length) })

  // Focus the search field on open and hand focus back to the trigger on close. Without the
  // return, Escape and a light-dismiss click both leave focus on <body> (WCAG 2.4.3).
  const wasOpen = useRef(false)
  useSignalEffect(() => {
    const open = popover.isOpen.value
    if (open) {
      activeIndex.value = -1
      const timer = setTimeout(
        () => focusElement(searchable ? searchRef.current : listboxRef.current),
        0,
      )
      wasOpen.current = true
      return () => clearTimeout(timer)
    }
    searchQuery.value = ''
    if (wasOpen.current) {
      wasOpen.current = false
      focusElement(triggerRef.current)
    }
    return undefined
  })

  // Keep the active row in view as the keyboard moves it; the listbox is a scroll container.
  useSignalEffect(() => {
    const index = activeIndex.value
    if (!popover.isOpen.value || index < 0) return
    const row = listboxRef.current?.querySelector(`#${CSS.escape(optionId(index))}`)
    // jsdom implements neither scrollIntoView nor layout, so the guard is what keeps the
    // keyboard tests honest rather than crashing on the first ArrowDown.
    if (row && typeof row.scrollIntoView === 'function') row.scrollIntoView({ block: 'nearest' })
  })

  function commit(next: string[]): void {
    setSelected(next)
  }

  function toggleOption(optionValue: string): void {
    const current = selected.value
    if (current.includes(optionValue)) {
      commit(current.filter((v) => v !== optionValue))
      return
    }
    if (max !== undefined && current.length >= max) return
    commit([...current, optionValue])
  }

  function activate(index: number): void {
    if (index === createIndex && showCreate) {
      onCreate?.(query.trim())
      searchQuery.value = ''
      onSearchChange?.('')
      return
    }
    const option = filtered[index]
    if (option && !option.disabled) toggleOption(option.value)
  }

  function setActive(next: number): void {
    activeIndex.value = next
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>): void {
    // Navigation reads the *effective* disabled flag: a row the `max` cap has blocked renders
    // aria-disabled, so the active marker must skip it too rather than park on a row Enter
    // would silently ignore. The create row sits after the options and is never blocked.
    const navigable = [
      ...filtered.map((option) => ({
        ...option,
        disabled: option.disabled || (atMax && !selectedValues.includes(option.value)),
      })),
      ...(showCreate ? [{ value: '', label: query }] : []),
    ]
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setActive(moveActive(activeIndex.value, 1, navigable))
        break
      case 'ArrowUp':
        event.preventDefault()
        setActive(moveActive(activeIndex.value, -1, navigable))
        break
      case 'Home':
        event.preventDefault()
        setActive(firstActive(navigable))
        break
      case 'End':
        event.preventDefault()
        setActive(lastActive(navigable))
        break
      case 'PageDown':
        event.preventDefault()
        setActive(pageActive(activeIndex.value, 1, navigable))
        break
      case 'PageUp':
        event.preventDefault()
        setActive(pageActive(activeIndex.value, -1, navigable))
        break
      case 'Enter':
        if (activeIndex.value >= 0) {
          event.preventDefault()
          activate(activeIndex.value)
        }
        break
      case ' ':
        // Space types a literal space in the search field; only the list consumes it.
        if (!searchable && activeIndex.value >= 0) {
          event.preventDefault()
          activate(activeIndex.value)
        }
        break
      case 'Escape':
        event.preventDefault()
        event.stopPropagation()
        popover.close()
        break
      case 'Backspace':
        // Empty search + Backspace removes the last chip, the convention every tag field shares.
        if (display === 'chips' && query === '' && selected.value.length > 0) {
          event.preventDefault()
          commit(selected.value.slice(0, -1))
        }
        break
    }
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    if (disabled) return
    if (
      event.key === 'ArrowDown' ||
      event.key === 'ArrowUp' ||
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault()
      popover.open()
    }
  }

  const enabledValues = options.filter((o) => !o.disabled).map((o) => o.value)
  const allSelected =
    enabledValues.length > 0 && enabledValues.every((v) => selectedValues.includes(v))

  const describedBy = mergeDescribedBy(
    error ? `${baseId}-error` : hint ? `${baseId}-hint` : undefined,
    ariaDescribedBy,
  )

  function renderOption(option: MultiSelectOption, index: number) {
    const isSelected = selectedValues.includes(option.value)
    const blocked = option.disabled || (atMax && !isSelected)
    return (
      <div
        key={option.value}
        id={optionId(index)}
        role="option"
        aria-selected={isSelected}
        aria-disabled={blocked || undefined}
        data-active={index === activeIndex.value ? '' : undefined}
        data-selected={isSelected ? '' : undefined}
        data-disabled={blocked ? '' : undefined}
        className={styles['option']}
        // preventDefault on mousedown keeps focus in the search field; the selection itself
        // happens on click, which is also what assistive technology synthesises. Doing it in
        // both handlers toggles twice per pointer click and cancels itself out.
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          if (!blocked) toggleOption(option.value)
        }}
        onMouseEnter={() => {
          if (!blocked) setActive(index)
        }}
      >
        <span className={styles['checkbox']} aria-hidden="true" />
        <span className={styles['option-label']}>
          {highlightSegments(option.label, searchable ? query : '').map((segment, i) =>
            segment.match ? (
              <mark key={i} className={styles['match']}>
                {segment.text}
              </mark>
            ) : (
              <span key={i}>{segment.text}</span>
            ),
          )}
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(styles['wrapper'], className)}
      data-state={error ? 'error' : isOpen ? 'open' : 'closed'}
      data-size={size}
      {...props}
    >
      {label && (
        <label className={styles['label']} htmlFor={triggerId}>
          {label}
        </label>
      )}

      <div className={styles['field']} data-display={display}>
        {/* Chips sit beside the trigger, never inside it: a button may not contain another
            interactive control, and a remove affordance that is not a real button is not
            reachable by keyboard or by an assistive technology's activate gesture. */}
        {display === 'chips' &&
          selectedOptions.map((option) => (
            <span key={option.value} className={styles['chip']}>
              <span className={styles['chip-label']}>{option.label}</span>
              <button
                type="button"
                className={styles['chip-remove']}
                aria-label={removeLabel(option.label)}
                disabled={disabled}
                onClick={() => commit(selected.value.filter((v) => v !== option.value))}
              />
            </span>
          ))}

        <button
          ref={(node) => {
            triggerRef.current = node
            ;(popover.triggerRef as React.MutableRefObject<HTMLElement | null>).current = node
          }}
          id={triggerId}
          type="button"
          className={styles['trigger']}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={panelId}
          aria-labelledby={ariaLabelledBy}
          aria-label={ariaLabel}
          aria-invalid={error ? true : ariaInvalid}
          aria-describedby={describedBy}
          disabled={disabled}
          style={{ anchorName: popover.anchorName } as React.CSSProperties}
          onClick={() => {
            if (!disabled) popover.toggle()
          }}
          onKeyDown={handleTriggerKeyDown}
        >
          <span
            className={styles['trigger-label']}
            data-empty={selectedValues.length === 0 ? '' : undefined}
          >
            {display === 'chips' && selectedValues.length > 0 ? (
              // The chips are the visible summary, but the button still owes an accessible
              // name — without this the trigger renders empty and announces as unlabelled.
              <span className={styles['sr-only']}>{triggerLabel}</span>
            ) : (
              triggerLabel
            )}
          </span>
          <span className={styles['chevron']} aria-hidden="true" />
        </button>

        {clearable && selectedValues.length > 0 && !disabled && (
          <button
            type="button"
            className={styles['clear']}
            aria-label={clearLabel}
            onClick={() => commit([])}
          >
            <span className={styles['clear-glyph']} aria-hidden="true" />
          </button>
        )}
      </div>

      {name !== undefined &&
        selectedValues.map((v) => <input key={v} type="hidden" name={name} value={v} />)}

      <div
        ref={popover.popoverRef as React.RefObject<HTMLDivElement>}
        id={panelId}
        popover="auto"
        className={styles['panel']}
        style={{ positionAnchor: popover.anchorName } as React.CSSProperties}
        tabIndex={-1}
      >
        {searchable && (
          <div className={styles['search-row']}>
            <input
              ref={searchRef}
              id={searchId}
              type="text"
              role="combobox"
              className={styles['search']}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              aria-expanded={isOpen}
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={
                isOpen && activeIndex.value >= 0 ? optionId(activeIndex.value) : undefined
              }
              autoComplete="off"
              value={query}
              onChange={(e) => {
                searchQuery.value = e.currentTarget.value
                onSearchChange?.(e.currentTarget.value)
                // The old index addressed the previous filtered list; re-anchor it.
                activeIndex.value = clampActive(
                  -1,
                  filterOptions(options, e.currentTarget.value, filter),
                )
              }}
              onKeyDown={handleKeyDown}
            />
          </div>
        )}

        {selectAll && enabledValues.length > 0 && (
          <button
            type="button"
            className={styles['select-all']}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() =>
              commit(
                allSelected ? [] : max === undefined ? enabledValues : enabledValues.slice(0, max),
              )
            }
          >
            {allSelected ? clearAllLabel : selectAllLabel}
          </button>
        )}

        <div
          ref={listboxRef}
          role="listbox"
          id={listboxId}
          aria-multiselectable="true"
          aria-label={listLabel}
          aria-busy={loading || undefined}
          aria-activedescendant={
            !searchable && isOpen && activeIndex.value >= 0
              ? optionId(activeIndex.value)
              : undefined
          }
          tabIndex={searchable ? -1 : 0}
          className={styles['options']}
          onKeyDown={searchable ? undefined : handleKeyDown}
        >
          {groups.map((group) =>
            group.label === undefined ? (
              group.entries.map(({ option, index }) => renderOption(option, index))
            ) : (
              <div
                key={group.label}
                role="group"
                aria-label={group.label}
                className={styles['group']}
              >
                <span className={styles['group-label']} aria-hidden="true">
                  {group.label}
                </span>
                {group.entries.map(({ option, index }) => renderOption(option, index))}
              </div>
            ),
          )}

          {showCreate && (
            <div
              id={optionId(createIndex)}
              role="option"
              aria-selected={false}
              data-active={createIndex === activeIndex.value ? '' : undefined}
              className={cn(styles['option'], styles['create'])}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => activate(createIndex)}
              onMouseEnter={() => setActive(createIndex)}
            >
              {createLabel(query.trim())}
            </div>
          )}
        </div>

        {/* Outside the listbox: `role="listbox"` owns only `option` and `group` children. */}
        {loading ? (
          <div className={styles['status']} role="status">
            {loadingText}
          </div>
        ) : filtered.length === 0 && !showCreate ? (
          <div className={styles['status']} role="status">
            {noResultsText}
          </div>
        ) : null}
      </div>

      {/* Mounted unconditionally so the first selection is announced too. */}
      <span className={styles['sr-only']} role="status" aria-live="polite">
        {isOpen
          ? t(builtin.multiSelect.selectionChanged, {
              count: String(selectedValues.length),
              total: String(options.length),
            })
          : ''}
      </span>

      {error && (
        <span id={`${baseId}-error`} className={styles['error']} role="alert">
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={`${baseId}-hint`} className={styles['hint']}>
          {hint}
        </span>
      )}
    </div>
  )
}
