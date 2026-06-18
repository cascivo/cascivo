'use client'
import { cn, useSignal, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import type { ButtonHTMLAttributes } from 'react'
import styles from './copy-button.module.css'

export interface CopyButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  /** The text written to the clipboard on click. */
  value: string
  size?: 'sm' | 'md'
  labels?: { copy?: string; copied?: string }
}

export function CopyButton({ value, size = 'md', labels, className, ...props }: CopyButtonProps) {
  useSignals()
  const copied = useSignal(false)
  const copyLabel = labels?.copy ?? t(builtin.copyButton.copy)
  const copiedLabel = labels?.copied ?? t(builtin.copyButton.copied)

  const handleClick = () => {
    void navigator.clipboard.writeText(value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }

  return (
    <button
      type="button"
      aria-label={copied.value ? copiedLabel : copyLabel}
      data-state={copied.value ? 'copied' : 'idle'}
      data-size={size}
      className={cn(styles['copyButton'], className as string | undefined)}
      onClick={handleClick}
      {...props}
    >
      {copied.value ? (
        <svg aria-hidden="true" viewBox="0 0 16 16" className={styles['icon']}>
          <path
            d="M13.5 4.5 6 12 2.5 8.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 16 16" className={styles['icon']}>
          <rect
            x="5.5"
            y="5.5"
            width="8"
            height="8"
            rx="1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M3.5 10.5h-1a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v1"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      )}
    </button>
  )
}
