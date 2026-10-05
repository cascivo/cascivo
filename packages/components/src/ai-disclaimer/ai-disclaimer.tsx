import { cn } from '@cascivo/core/pure'
import { builtin, t } from '@cascivo/i18n'
import type { HTMLAttributes } from 'react'
import styles from './ai-disclaimer.module.css'

export interface AiDisclaimerProps extends HTMLAttributes<HTMLParagraphElement> {
  labels?: {
    text?: string
  }
}

export function AiDisclaimer({ labels, className, children, ...props }: AiDisclaimerProps) {
  return (
    <p className={cn(styles['disclaimer'], className as string | undefined)} {...props}>
      <svg
        className={styles['glyph']}
        viewBox="0 0 16 16"
        width="12"
        height="12"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M8 1c.6 3.9 3.1 6.4 7 7-3.9.6-6.4 3.1-7 7-.6-3.9-3.1-6.4-7-7 3.9-.6 6.4-3.1 7-7Z" />
      </svg>
      <span>{children ?? labels?.text ?? t(builtin.aiDisclaimer.text)}</span>
    </p>
  )
}
