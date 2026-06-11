'use client'
import { useSignal, useSignals, cn } from '@cascade-ui/core'
import { useRef } from 'react'
import type { HTMLAttributes } from 'react'
import { t, builtin } from '@cascade-ui/i18n'
import styles from './tags-input.module.css'

export interface TagsInputProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value: string[]
  onValueChange: (v: string[]) => void
  placeholder?: string
  validate?: (tag: string) => boolean
  max?: number
  disabled?: boolean
}

export function TagsInput({
  value,
  onValueChange,
  placeholder,
  validate,
  max,
  disabled = false,
  className,
  ...props
}: TagsInputProps) {
  useSignals()
  const inputValue = useSignal('')
  const inputRef = useRef<HTMLInputElement>(null)

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
      onClick={() => inputRef.current?.focus()}
      {...props}
    >
      {value.map((tag, i) => {
        const isInvalid = validate ? !validate(tag) : false
        return (
          <span
            key={i}
            className={styles['tag']}
            data-state={isInvalid ? 'invalid' : undefined}
          >
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
