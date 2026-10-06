'use client'
import { cn } from '@cascivo/core/pure'
import { builtin, t } from '@cascivo/i18n'
import type { HTMLAttributes } from 'react'
import styles from './prompt-suggestions.module.css'

export interface PromptSuggestionsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  items: string[]
  onSelect: (value: string) => void
  labels?: {
    group?: string
  }
}

export function PromptSuggestions({
  items,
  onSelect,
  labels,
  className,
  ...props
}: PromptSuggestionsProps) {
  return (
    <div
      role="group"
      aria-label={labels?.group ?? t(builtin.promptSuggestions.group)}
      className={cn(styles['suggestions'], className as string | undefined)}
      {...props}
    >
      {items.map((item) => (
        <button key={item} type="button" className={styles['chip']} onClick={() => onSelect(item)}>
          {item}
        </button>
      ))}
    </div>
  )
}
