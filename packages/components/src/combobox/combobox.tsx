'use client'
import {
  cn,
  DismissableLayer,
  focusElement,
  useControllableSignal,
  useSignal,
  useSignalEffect,
  useSignals,
  useTypeahead,
} from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { useId, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { activeForValue, firstActive, lastActive, moveActive, pageActive } from './list-nav'
import {
  filterOptions,
  groupOptions,
  highlightSegments,
  isNewLabel,
  orderByGroup,
  typeaheadIndex,
} from './option-list'
import type { ComboboxOption } from './option-list'
import styles from './combobox.module.css'

export type { ComboboxOption } from './option-list'

export interface ComboboxLabels {
  placeholder?: string
  empty?: string
  clear?: string
  /**
   * @deprecated Named the in-popup search input, which no longer exists — the field itself is
   * the combobox. Ignored; removed in 2.0.
   */
  search?: string
  /** Text shown in place of the empty message while `loading` is true. */
  loading?: string
  /** Template for the "create" row; `{label}` is replaced with the typed text. */
  create?: string
}

/** Join own + inherited `aria-describedby` ids; `undefined` when there are none. */
function mergeDescribedBy(...ids: (string | undefined)[]): string | undefined {
  return ids.filter(Boolean).join(' ') || undefined
}

export interface ComboboxProps {
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
  options: ComboboxOption[]
  value?: string
  defaultValue?: string
  /** Called with the selected option value (or undefined when cleared). */
  onValueChange?: (value: string | undefined) => void
  /**
   * When true, shows a control to clear the selected value.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  clearable?: boolean
  /**
   * When true the field is a text input that filters the list as the user types (the APG
   * editable combobox). When false it is a button that opens the list, and type-to-select
   * jumps to a matching option (the APG select-only combobox).
   *
   * @defaultValue `true`
   * @see the component manifest
   */
  searchable?: boolean
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
  size?: 'sm' | 'md' | 'lg'
  /**
   * When true, disables the control and removes it from the tab order.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  disabled?: boolean
  /**
   * When true, the list reports itself as busy and shows a loading row instead of the empty
   * message.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  loading?: boolean
  /** Called with the search text on every keystroke. Pair it with `filter={() => true}` for a server-driven list. */
  onSearchChange?: (query: string) => void
  /** Replaces the built-in diacritic-insensitive matcher. */
  filter?: (option: ComboboxOption, query: string) => boolean
  /**
   * When true, offers the current search text as a new option.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  creatable?: boolean
  /** Called with the typed label when the user picks the "create" row. */
  onCreate?: (label: string) => void
  /** Submitted with a surrounding form — a hidden input carrying the selected value. */
  name?: string
  /** Marks the control as required for assistive technology. */
  required?: boolean
  /** Controlled open state of the listbox. */
  open?: boolean
  /**
   * The initial open state when uncontrolled.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  defaultOpen?: boolean
  /** Called when the listbox opens or closes. */
  onOpenChange?: (open: boolean) => void
  labels?: ComboboxLabels
  className?: string
  id?: string
}

export function Combobox({
  options,
  value,
  defaultValue,
  onValueChange,
  clearable = false,
  searchable = true,
  label,
  ariaLabel,
  hint,
  error,
  size = 'md',
  disabled = false,
  loading = false,
  onSearchChange,
  filter,
  creatable = false,
  onCreate,
  name,
  required,
  open,
  defaultOpen,
  onOpenChange,
  labels,
  className,
  id,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
}: ComboboxProps) {
  useSignals()
  const baseId = useId()
  // Both branches were byte-identical before, so the `label ?` test decided nothing.
  const fieldId = id ?? `cascade-combobox-${baseId}`
  const listboxId = `${baseId}-listbox`
  const statusId = `${baseId}-status`
  const optionId = (index: number): string => `${baseId}-option-${index}`

  const fieldRef = useRef<HTMLInputElement | HTMLButtonElement>(null)
  const listboxRef = useRef<HTMLDivElement>(null)

  const [selected, setSelected] = useControllableSignal<string | undefined>({
    value,
    defaultValue,
    onChange: onValueChange,
  })
  const [isOpen, setOpen] = useControllableSignal<boolean>({
    value: open,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
  })

  const query = useSignal('')
  const activeIndex = useSignal(-1)

  const opened = isOpen.value
  const selectedValue = selected.value

  // Plain render-time derivations. `useComputed` would cache until a *signal* dependency
  // changed and would go stale the moment a parent swapped `options` — which is exactly what
  // a remote-search list does on every response.
  const typed = query.value
  const filtered = orderByGroup(filterOptions(options, searchable ? typed : '', filter))
  const showCreate = creatable && typed.trim() !== '' && isNewLabel(options, typed.trim())
  const createIndex = showCreate ? filtered.length : -1
  const groups = groupOptions(filtered)
  const selectedOption = options.find((opt) => opt.value === selectedValue)

  const resolvedPlaceholder = labels?.placeholder ?? t(builtin.combobox.placeholder)
  const resolvedEmpty = labels?.empty ?? t(builtin.combobox.empty)
  const resolvedClear = labels?.clear ?? t(builtin.combobox.clear)
  const resolvedLoading = labels?.loading ?? t(builtin.combobox.loading)
  const createLabel = (optionLabel: string): string =>
    labels?.create
      ? labels.create.replaceAll('{label}', optionLabel)
      : t(builtin.combobox.create, { label: optionLabel })

  const describedBy = mergeDescribedBy(
    error ? `${baseId}-error` : hint ? `${baseId}-hint` : undefined,
    ariaDescribedBy,
  )

  function openList(seed: 'value' | 'none' = 'value'): void {
    if (disabled) return
    activeIndex.value = seed === 'value' ? activeForValue(filtered, selectedValue) : -1
    setOpen(true)
  }

  function closeList(restoreFocus = true): void {
    setOpen(false)
    query.value = ''
    activeIndex.value = -1
    if (restoreFocus) focusElement(fieldRef.current)
  }

  function select(optValue: string): void {
    setSelected(optValue)
    closeList()
  }

  function clear(): void {
    setSelected(undefined)
    query.value = ''
    onSearchChange?.('')
    // The old build left the listbox open, the query stale and focus on a button that had
    // just been removed from the DOM.
    focusElement(fieldRef.current)
  }

  function activate(index: number): void {
    if (index === createIndex && showCreate) {
      onCreate?.(typed.trim())
      closeList()
      return
    }
    const opt = filtered[index]
    if (opt && !opt.disabled) select(opt.value)
  }

  // Type-to-select for the select-only variant, which has no text field to type into.
  const typeahead = useTypeahead({
    onMatch: (buffer) => {
      const pool = opened ? filtered : options
      const at = typeaheadIndex(pool, buffer, opened ? activeIndex.value : -1)
      if (at === -1) return
      if (opened) activeIndex.value = at
      else {
        const opt = pool[at]
        if (opt) setSelected(opt.value)
      }
    },
  })

  // Keep the active row in view as the keyboard moves it; the listbox is a scroll container.
  useSignalEffect(() => {
    const index = activeIndex.value
    if (!isOpen.value || index < 0) return
    const row = listboxRef.current?.querySelector(`#${CSS.escape(optionId(index))}`)
    // jsdom implements neither scrollIntoView nor layout, so the guard is what keeps the
    // keyboard tests honest rather than crashing on the first ArrowDown.
    if (row && typeof row.scrollIntoView === 'function') row.scrollIntoView({ block: 'nearest' })
  })

  function handleKeyDown(event: KeyboardEvent<HTMLElement>): void {
    if (disabled) return
    const navigable = showCreate ? [...filtered, { value: '', label: typed }] : filtered

    // Alt+ArrowDown opens without moving the active option; Alt+ArrowUp closes keeping the value.
    if (event.altKey && event.key === 'ArrowDown') {
      event.preventDefault()
      if (!opened) openList('none')
      return
    }
    if (event.altKey && event.key === 'ArrowUp') {
      event.preventDefault()
      if (opened) closeList()
      return
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (!opened) openList()
        else activeIndex.value = moveActive(activeIndex.value, 1, navigable)
        break
      case 'ArrowUp':
        event.preventDefault()
        if (!opened) openList()
        else activeIndex.value = moveActive(activeIndex.value, -1, navigable)
        break
      case 'Home':
        // In the editable variant Home/End belong to the text caret, per the APG editable
        // combobox; only the select-only variant uses them to jump the list.
        if (searchable || !opened) break
        event.preventDefault()
        activeIndex.value = firstActive(navigable)
        break
      case 'End':
        if (searchable || !opened) break
        event.preventDefault()
        activeIndex.value = lastActive(navigable)
        break
      case 'PageDown':
        if (!opened) break
        event.preventDefault()
        activeIndex.value = pageActive(activeIndex.value, 1, navigable)
        break
      case 'PageUp':
        if (!opened) break
        event.preventDefault()
        activeIndex.value = pageActive(activeIndex.value, -1, navigable)
        break
      case 'Enter':
        if (!opened) break
        event.preventDefault()
        if (activeIndex.value >= 0) activate(activeIndex.value)
        break
      case ' ':
        // The editable variant needs Space to type a literal space.
        if (searchable) break
        event.preventDefault()
        if (opened && activeIndex.value >= 0) activate(activeIndex.value)
        else openList()
        break
      case 'Escape':
        if (!opened) break
        event.preventDefault()
        event.stopPropagation()
        closeList()
        break
      case 'Tab':
        if (opened) closeList(false)
        break
    }
    // Space is activation on the select-only variant, so it never reaches the buffer — a
    // label containing a space is reached by typing across it, not by including it.
    if (!searchable && event.key !== ' ') typeahead.onKeyDown(event)
  }

  function renderOption(opt: ComboboxOption, index: number) {
    const isSelected = opt.value === selectedValue
    return (
      <div
        key={opt.value}
        id={optionId(index)}
        role="option"
        aria-selected={isSelected}
        aria-disabled={opt.disabled || undefined}
        data-state={index === activeIndex.value ? 'active' : undefined}
        data-disabled={opt.disabled || undefined}
        className={styles['option']}
        // preventDefault on mousedown keeps focus on the field; the selection happens on
        // click, which is also what assistive technology synthesises when it activates a row.
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          if (!opt.disabled) select(opt.value)
        }}
        onMouseEnter={() => {
          if (!opt.disabled) activeIndex.value = index
        }}
      >
        <span className={styles['optionLabel']}>
          {highlightSegments(opt.label, searchable ? typed : '').map((segment, i) =>
            segment.match ? (
              <mark key={i} className={styles['match']}>
                {segment.text}
              </mark>
            ) : (
              <span key={i}>{segment.text}</span>
            ),
          )}
        </span>
        <span className={styles['check']} aria-hidden="true" />
      </div>
    )
  }

  const activeDescendant =
    opened && activeIndex.value >= 0 ? optionId(activeIndex.value) : undefined

  /** Shared between the input and the button variant, so both are named and wired alike. */
  const fieldAria = {
    id: fieldId,
    role: 'combobox' as const,
    'aria-expanded': opened,
    'aria-controls': listboxId,
    'aria-haspopup': 'listbox' as const,
    'aria-activedescendant': activeDescendant,
    'aria-labelledby': ariaLabelledBy,
    'aria-label': ariaLabel,
    'aria-invalid': error ? true : ariaInvalid,
    'aria-describedby': describedBy,
    'aria-required': required || undefined,
    disabled,
    onKeyDown: handleKeyDown,
  }

  return (
    <DismissableLayer onDismiss={() => opened && closeList(false)}>
      <div
        className={cn(styles['wrapper'], className)}
        data-state={error ? 'error' : opened ? 'open' : 'closed'}
        data-size={size}
      >
        {label && (
          <label className={styles['label']} htmlFor={fieldId}>
            {label}
          </label>
        )}

        <div className={styles['field']}>
          {searchable ? (
            <input
              {...fieldAria}
              ref={fieldRef as React.RefObject<HTMLInputElement>}
              type="text"
              className={styles['trigger']}
              autoComplete="off"
              aria-autocomplete="list"
              placeholder={resolvedPlaceholder}
              // Closed, the field shows the chosen label; open, it shows what is being typed,
              // so the list and the field never disagree.
              value={opened ? typed : (selectedOption?.label ?? '')}
              onChange={(e) => {
                const next = e.currentTarget.value
                query.value = next
                onSearchChange?.(next)
                if (!opened) setOpen(true)
                const nextFiltered = orderByGroup(filterOptions(options, next, filter))
                const at = firstActive(nextFiltered)
                // With nothing left to match, the create row (index `nextFiltered.length`) is
                // the only thing to land on, so Enter completes the typed label.
                activeIndex.value =
                  at === -1 && creatable && next.trim() !== '' && isNewLabel(options, next.trim())
                    ? nextFiltered.length
                    : at
              }}
              onClick={() => {
                if (!opened) openList()
              }}
            />
          ) : (
            <button
              {...fieldAria}
              ref={fieldRef as React.RefObject<HTMLButtonElement>}
              type="button"
              className={styles['trigger']}
              onClick={() => (opened ? closeList() : openList())}
            >
              <span
                className={cn(styles['value'], !selectedOption ? styles['placeholder'] : undefined)}
              >
                {selectedOption?.label ?? resolvedPlaceholder}
              </span>
            </button>
          )}

          {clearable && selectedValue !== undefined && !disabled && (
            <button
              type="button"
              className={styles['clear']}
              aria-label={resolvedClear}
              onClick={(e) => {
                e.stopPropagation()
                clear()
              }}
            >
              <span className={styles['clearGlyph']} aria-hidden="true" />
            </button>
          )}

          <span className={styles['chevron']} aria-hidden="true" />
        </div>

        {name !== undefined && <input type="hidden" name={name} value={selectedValue ?? ''} />}

        <div className={styles['popup']} data-state={opened ? 'open' : 'closed'}>
          <div
            ref={listboxRef}
            role="listbox"
            id={listboxId}
            className={styles['listbox']}
            aria-label={ariaLabel ?? label ?? resolvedPlaceholder}
            aria-busy={loading || undefined}
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
                  <span className={styles['groupLabel']} aria-hidden="true">
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
                data-state={createIndex === activeIndex.value ? 'active' : undefined}
                className={cn(styles['option'], styles['create'])}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => activate(createIndex)}
                onMouseEnter={() => {
                  activeIndex.value = createIndex
                }}
              >
                {createLabel(typed.trim())}
              </div>
            )}
          </div>

          {/* Outside the listbox: `role="listbox"` owns only `option` and `group` children. */}
          {loading ? (
            <div className={styles['empty']} role="status">
              {resolvedLoading}
            </div>
          ) : filtered.length === 0 && !showCreate ? (
            <div className={styles['empty']} role="status">
              {resolvedEmpty}
            </div>
          ) : null}
        </div>

        {/* Mounted unconditionally so the first result count is announced too. */}
        <span id={statusId} className={styles['srOnly']} role="status" aria-live="polite">
          {opened && !loading
            ? t(builtin.combobox.resultCount, { count: String(filtered.length) })
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
    </DismissableLayer>
  )
}
