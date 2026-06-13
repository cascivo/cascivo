'use client'
import { cn } from '@cascivo/core'
import type { InputHTMLAttributes, ReactNode } from 'react'
import styles from './checkbox-card.module.css'

export interface CheckboxCardProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'title' | 'onChange'
> {
  title: ReactNode
  description?: ReactNode
  onCheckedChange?: (checked: boolean) => void
  className?: string | undefined
}

export function CheckboxCard({
  title,
  description,
  checked,
  defaultChecked,
  disabled,
  onCheckedChange,
  className,
  ...props
}: CheckboxCardProps) {
  return (
    <label className={cn(styles['card'], className)} data-disabled={disabled || undefined}>
      <input
        type="checkbox"
        className={styles['input']}
        disabled={disabled}
        {...(checked !== undefined ? { checked } : { defaultChecked })}
        onChange={(e) => onCheckedChange?.(e.currentTarget.checked)}
        {...props}
      />
      <span className={styles['glyph']} aria-hidden="true">
        <svg viewBox="0 0 12 12" className={styles['check']}>
          <path d="M2.5 6.5 5 9l4.5-5.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </span>
      <span className={styles['body']}>
        <span className={styles['title']}>{title}</span>
        {description && <span className={styles['description']}>{description}</span>}
      </span>
    </label>
  )
}
