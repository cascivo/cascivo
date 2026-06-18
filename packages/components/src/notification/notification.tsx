'use client'
import { cn, Presence, useSignal, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { useRef, type HTMLAttributes, type ReactNode } from 'react'
import styles from './notification.module.css'

export type NotificationVariant = 'info' | 'success' | 'warning' | 'error'

export interface NotificationProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode
  description?: ReactNode
  variant?: NotificationVariant
  dismissible?: boolean
  onDismiss?: () => void
  actions?: ReactNode
  icon?: ReactNode
  labels?: {
    dismiss?: string
  }
}

const assertiveVariants = new Set<NotificationVariant>(['warning', 'error'])

// must outlast --cascivo-motion-exit (150ms)
const EXIT_DURATION = 160

function VariantIcon({ variant }: { variant: NotificationVariant }) {
  if (variant === 'success') {
    return (
      <svg viewBox="0 0 20 20" width="20" height="20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M6.5 10.5l2.5 2.5 4.5-5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }
  if (variant === 'warning') {
    return (
      <svg viewBox="0 0 20 20" width="20" height="20" fill="none" aria-hidden="true">
        <path
          d="M10 2.5L18.5 17H1.5L10 2.5z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M10 8v3.5M10 14h.01"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    )
  }
  if (variant === 'error') {
    return (
      <svg viewBox="0 0 20 20" width="20" height="20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M10 6v4.5M10 13.5h.01"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 9v5M10 6.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function Notification({
  title,
  description,
  variant = 'info',
  dismissible = false,
  onDismiss,
  actions,
  icon,
  labels,
  className,
  ...props
}: NotificationProps) {
  useSignals()
  const open = useSignal(true)
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss

  const showDismiss = dismissible || onDismiss !== undefined

  const dismiss = () => {
    open.value = false
    // Call after the exit transition so the parent's removal does not cut it short.
    setTimeout(() => onDismissRef.current?.(), EXIT_DURATION)
  }

  return (
    <Presence present={open}>
      <div
        role={assertiveVariants.has(variant) ? 'alert' : 'status'}
        data-variant={variant}
        className={cn(styles['notification'], className as string | undefined)}
        {...props}
      >
        <span className={styles['icon']} aria-hidden="true">
          {icon ?? <VariantIcon variant={variant} />}
        </span>
        <div className={styles['body']}>
          <div className={styles['title']}>{title}</div>
          {description && <div className={styles['description']}>{description}</div>}
          {actions && <div className={styles['actions']}>{actions}</div>}
        </div>
        {showDismiss && (
          <button
            type="button"
            className={styles['dismiss']}
            aria-label={labels?.dismiss ?? t(builtin.notification.dismiss)}
            onClick={dismiss}
          >
            ✕
          </button>
        )}
      </div>
    </Presence>
  )
}
