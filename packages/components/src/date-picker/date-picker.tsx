'use client'
import {
  cn,
  DismissableLayer,
  focusElement,
  useControllableSignal,
  useSignal,
  useSignalEffect,
  useSignals,
} from '@cascivo/core'
import { builtin, currentLocale, t } from '@cascivo/i18n'
import { useId, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { Calendar } from '../calendar/calendar'
import { formatDate, formatHint, fromISO, parseTypedDate, toISO } from './parse-date'
import styles from './date-picker.module.css'

export interface DatePickerLabels {
  placeholder?: string
  previousMonth?: string
  nextMonth?: string
  clear?: string
  open?: string
  today?: string
}

/** Join own + inherited `aria-describedby` ids; `undefined` when there are none. */
function mergeDescribedBy(...ids: (string | undefined)[]): string | undefined {
  return ids.filter(Boolean).join(' ') || undefined
}

export interface DatePickerProps {
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
  value?: string
  defaultValue?: string
  /** Called with the selected ISO date string (or undefined when cleared). */
  onValueChange?: (value: string | undefined) => void
  min?: string
  max?: string
  /** Rejects individual dates the bounds allow — holidays, weekends, taken slots. */
  disabledDate?: (date: Date) => boolean
  /**
   * Shows a clear button
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  clearable?: boolean
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
   * Field size
   *
   * @defaultValue `md`
   * @see the component manifest
   */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Disables the picker
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  disabled?: boolean
  /**
   * When true, the field accepts a typed date as well as one picked from the calendar.
   *
   * @defaultValue `true`
   * @see the component manifest
   */
  typeable?: boolean
  /** Formatting options for the displayed date. Defaults to the locale's numeric form. */
  format?: Intl.DateTimeFormatOptions
  /**
   * When true, the calendar offers a button that jumps to the current month.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  showToday?: boolean
  /** Submitted with a surrounding form — a hidden input carrying the ISO value. */
  name?: string
  /** Marks the control as required for assistive technology. */
  required?: boolean
  /** Controlled open state of the calendar popup. */
  open?: boolean
  /** Called when the popup opens or closes. */
  onOpenChange?: (open: boolean) => void
  labels?: DatePickerLabels
  className?: string
  id?: string
}

export function DatePicker({
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  disabledDate,
  clearable = false,
  label,
  ariaLabel,
  hint,
  error,
  size = 'md',
  disabled = false,
  typeable = true,
  format,
  showToday = false,
  name,
  required,
  open,
  onOpenChange,
  labels,
  className,
  id,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
}: DatePickerProps) {
  useSignals()
  const baseId = useId()
  const inputId = id ?? `cascade-date-picker-${baseId}`
  const dialogId = `${baseId}-dialog`
  const locale = currentLocale()

  const resolvedPlaceholder = labels?.placeholder ?? t(builtin.datePicker.placeholder)
  const resolvedClear = labels?.clear ?? t(builtin.datePicker.clear)
  const resolvedOpen = labels?.open ?? t(builtin.datePicker.open)

  const fieldRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  const [selectedISO, setSelectedISO] = useControllableSignal<string | undefined>({
    value,
    defaultValue,
    onChange: onValueChange,
  })
  const [isOpen, setOpen] = useControllableSignal<boolean>({
    value: open,
    defaultValue: false,
    onChange: onOpenChange,
  })

  const opened = isOpen.value
  const selected = selectedISO.value ? fromISO(selectedISO.value) : null
  const minDate = min ? fromISO(min) : null
  const maxDate = max ? fromISO(max) : null

  const displayValue = selected ? formatDate(selected, locale, format) : ''
  // The field keeps its own draft while being typed into, so a half-entered date never
  // reaches onValueChange and the calendar does not jump on every keystroke.
  const draft = useSignal<string | null>(null)
  const fieldText = draft.value ?? displayValue

  function openPopup(): void {
    if (disabled) return
    setOpen(true)
  }

  function closePopup(restoreFocus = true): void {
    setOpen(false)
    if (restoreFocus) focusElement(typeable ? fieldRef.current : triggerRef.current)
  }

  /**
   * Move focus into the calendar when it opens and back out when it closes. The old build did
   * neither: opening left focus on the trigger, so the grid's keyboard model was unreachable
   * without tabbing into it, and closing dropped focus on `<body>` (WCAG 2.4.3).
   */
  const wasOpen = useRef(false)
  useSignalEffect(() => {
    const nowOpen = isOpen.value
    if (nowOpen) {
      wasOpen.current = true
      const timer = setTimeout(() => {
        focusElement(dialogRef.current?.querySelector<HTMLElement>('[tabindex="0"]') ?? null)
      }, 0)
      return () => clearTimeout(timer)
    }
    wasOpen.current = false
    return undefined
  })

  function commit(date: Date | null): void {
    draft.value = null
    setSelectedISO(date ? toISO(date) : undefined)
  }

  function commitDraft(): void {
    const text = draft.peek()
    if (text === null) return
    if (text.trim() === '') {
      commit(null)
      return
    }
    const parsed = parseTypedDate(text, locale, selected?.getUTCFullYear())
    // Reject rather than coerce: a value the parser cannot read leaves the previous date in
    // place and the field reverts to showing it.
    if (parsed && !outside(parsed)) commit(parsed)
    else draft.value = null
  }

  function outside(date: Date): boolean {
    if (minDate && date.getTime() < minDate.getTime()) return true
    if (maxDate && date.getTime() > maxDate.getTime()) return true
    return disabledDate?.(date) ?? false
  }

  function handleFieldKeyDown(event: KeyboardEvent<HTMLElement>): void {
    if (disabled) return
    if (event.altKey && event.key === 'ArrowDown') {
      event.preventDefault()
      openPopup()
      return
    }
    switch (event.key) {
      case 'ArrowDown':
        // ArrowDown opens the popup — the combobox pattern's required key, listed in the
        // manifest but never implemented.
        event.preventDefault()
        openPopup()
        break
      case 'Enter':
        if (typeable) {
          event.preventDefault()
          commitDraft()
        }
        break
      case 'Escape':
        if (opened) {
          event.preventDefault()
          event.stopPropagation()
          closePopup()
        } else if (draft.peek() !== null) {
          draft.value = null
        }
        break
      case 'Backspace':
      case 'Delete':
        // Clearing from the keyboard, which the button-only trigger made impossible.
        if (!typeable && clearable && selectedISO.peek() !== undefined) {
          event.preventDefault()
          commit(null)
        }
        break
    }
  }

  const describedBy = mergeDescribedBy(
    error ? `${baseId}-error` : hint ? `${baseId}-hint` : undefined,
    ariaDescribedBy,
  )

  const fieldAria = {
    id: inputId,
    role: 'combobox' as const,
    'aria-expanded': opened,
    'aria-controls': dialogId,
    'aria-haspopup': 'dialog' as const,
    'aria-labelledby': ariaLabelledBy,
    'aria-label': ariaLabel,
    'aria-invalid': error ? true : ariaInvalid,
    'aria-describedby': describedBy,
    'aria-required': required || undefined,
    disabled,
    onKeyDown: handleFieldKeyDown,
  }

  return (
    <DismissableLayer onDismiss={() => opened && closePopup(false)}>
      <div
        className={cn(styles['wrapper'], className)}
        data-state={error ? 'error' : opened ? 'open' : 'closed'}
        data-size={size}
      >
        {label && (
          <label className={styles['label']} htmlFor={inputId}>
            {label}
          </label>
        )}

        <div className={styles['field']}>
          {typeable ? (
            <input
              {...fieldAria}
              ref={fieldRef}
              type="text"
              className={styles['trigger']}
              autoComplete="off"
              inputMode="numeric"
              placeholder={resolvedPlaceholder || formatHint(locale)}
              value={fieldText}
              onChange={(e) => {
                draft.value = e.currentTarget.value
              }}
              onBlur={commitDraft}
            />
          ) : (
            <button {...fieldAria} ref={triggerRef} type="button" className={styles['trigger']}>
              <span
                className={cn(styles['value'], !displayValue ? styles['placeholder'] : undefined)}
              >
                {displayValue || resolvedPlaceholder}
              </span>
            </button>
          )}

          {clearable && selectedISO.value !== undefined && !disabled && (
            <button
              type="button"
              className={styles['clear']}
              aria-label={resolvedClear}
              onClick={() => {
                commit(null)
                focusElement(typeable ? fieldRef.current : triggerRef.current)
              }}
            >
              <span className={styles['clearGlyph']} aria-hidden="true" />
            </button>
          )}

          <button
            ref={typeable ? triggerRef : undefined}
            type="button"
            className={styles['openButton']}
            aria-label={resolvedOpen}
            aria-expanded={opened}
            aria-controls={dialogId}
            disabled={disabled}
            onClick={() => (opened ? closePopup() : openPopup())}
          >
            <span className={styles['calendarGlyph']} aria-hidden="true" />
          </button>
        </div>

        {name !== undefined && <input type="hidden" name={name} value={selectedISO.value ?? ''} />}

        <div
          ref={dialogRef}
          id={dialogId}
          role="dialog"
          aria-label={label ?? ariaLabel ?? resolvedPlaceholder}
          className={styles['popup']}
          data-state={opened ? 'open' : 'closed'}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault()
              e.stopPropagation()
              closePopup()
            }
          }}
        >
          {/* Composed, not reimplemented. The grid, its focus model, its bounds handling and
              its announcements were all duplicated here in a weaker copy; every fix to
              Calendar had to be made twice, and in practice was not. */}
          <Calendar
            value={selected}
            onValueChange={(date) => {
              commit(date)
              closePopup()
            }}
            {...(minDate ? { min: minDate } : {})}
            {...(maxDate ? { max: maxDate } : {})}
            {...(disabledDate ? { disabled: disabledDate } : {})}
            labels={{
              ...(labels?.previousMonth ? { previousMonth: labels.previousMonth } : {}),
              ...(labels?.nextMonth ? { nextMonth: labels.nextMonth } : {}),
              ...(labels?.today ? { today: labels.today } : {}),
            }}
            showToday={showToday}
            size={size}
            locale={locale}
          />
        </div>

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
