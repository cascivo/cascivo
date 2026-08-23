'use client'
import { cn, focusElement, useSignal, useSignals } from '@cascivo/core'
import { useRef } from 'react'
import type { HTMLAttributes } from 'react'
import { t, builtin } from '@cascivo/i18n'
import styles from './tags-input.module.css'

export interface TagsInputProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value: string[]
  onValueChange: (v: string[]) => void
  placeholder?: string
  validate?: (tag: string) => boolean
  max?: number
  /**
   * When true, disables the control and removes it from the tab order.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  disabled?: boolean
  /**
   * Id for the **inner text input** — the focusable control, so a `<label for>` names the
   * thing that actually takes focus. `Field` supplies this automatically.
   *
   * Naming is unaffected by this: the built-in name is dropped only when something actually
   * names the control (an `ariaLabel`/`label` prop, or the `aria-labelledby` a `Field`
   * supplies), so a standalone `<TagsInput id="x"/>` keeps its built-in name.
   */
  id?: string
  /**
   * Invisible accessible name for the tag entry field. Use when no visible label names it.
   *
   * Inside a `Field` you do not need this — the Field's label is wired through automatically.
   */
  ariaLabel?: string
  /**
   * Alias of `ariaLabel` — the same invisible accessible name under the other spelling. Not
   * rendered. `ariaLabel` is the catalog convention and stays preferred; `label` is the guess
   * an adopter makes when they have not read the convention, and an unaccepted guess costs a
   * compile cycle for nothing.
   */
  label?: string
}

export function TagsInput({
  value,
  onValueChange,
  placeholder,
  validate,
  max,
  disabled = false,
  className,
  id,
  ariaLabel,
  label,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: TagsInputProps) {
  useSignals()
  const inputValue = useSignal('')
  const inputRef = useRef<HTMLInputElement>(null)

  /**
   * Accessible name for the inner input, most specific first.
   *
   * The built-in is LAST, not unconditional. It used to be hardcoded onto the input, and
   * because `aria-label` outranks a `<label for>` association it won even when a `Field`
   * wrapped the control — so `<Field label="Production domains">` produced a control named
   * "Tags", with the Field's hint unannounced. That is a WCAG 1.3.1/4.1.2 failure in the exact
   * composition the library prescribes (2026-08-22 report item 16).
   */
  const resolvedAriaLabel =
    ariaLabel ?? label ?? (ariaLabelledBy !== undefined ? undefined : t(builtin.tagsInput.label))

  function addTag(raw: string) {
    const tag = raw.trim()
    if (!tag) return
    if (max !== undefined && value.length >= max) return
    if (value.includes(tag)) return
    if (validate && !validate(tag)) return
    onValueChange([...value, tag])
    inputValue.value = ''
  }

  function removeTag(index: number) {
    onValueChange(value.filter((_, i) => i !== index))
  }

  const placeholderText = placeholder ?? t(builtin.tagsInput.placeholder)

  return (
    <div
      className={cn(styles['wrapper'], className)}
      data-disabled={disabled ? '' : undefined}
      onClick={() => focusElement(inputRef.current)}
      {...props}
    >
      {value.map((tag, i) => {
        const isInvalid = validate ? !validate(tag) : false
        return (
          <span key={i} className={styles['tag']} data-state={isInvalid ? 'invalid' : undefined}>
            {tag}
            <button
              type="button"
              className={styles['dismiss']}
              aria-label={t(builtin.tagsInput.remove, { tag })}
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation()
                removeTag(i)
              }}
            >
              <span aria-hidden="true">×</span>
            </button>
          </span>
        )
      })}
      <input
        ref={inputRef}
        className={styles['input']}
        value={inputValue.value}
        id={id}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        aria-label={resolvedAriaLabel}
        placeholder={value.length === 0 ? placeholderText : undefined}
        disabled={disabled}
        onChange={(e) => {
          inputValue.value = e.currentTarget.value
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            addTag(inputValue.value)
          } else if (e.key === 'Backspace' && !inputValue.value) {
            removeTag(value.length - 1)
          }
        }}
        onBlur={() => {
          if (inputValue.value) addTag(inputValue.value)
        }}
      />
    </div>
  )
}
