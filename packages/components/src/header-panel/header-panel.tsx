'use client'
import { cn, useSignal, useSignalEffect, useSignals } from '@cascade-ui/core'
import { builtin, t } from '@cascade-ui/i18n'
import { useRef, type ReactNode } from 'react'
import styles from './header-panel.module.css'

export interface HeaderPanelLabels {
  close?: string
}

export interface HeaderPanelProps {
  open: boolean
  onClose: () => void
  label: string
  children: ReactNode
  labels?: HeaderPanelLabels
  className?: string | undefined
}

export function HeaderPanel({
  open,
  onClose,
  label,
  children,
  labels,
  className,
}: HeaderPanelProps) {
  useSignals()
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreRef = useRef<HTMLElement | null>(null)
  const isOpen = useSignal(open)
  isOpen.value = open
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useSignalEffect(() => {
    const el = panelRef.current
    if (!el) return
    if (isOpen.value) {
      restoreRef.current = document.activeElement as HTMLElement | null
      try {
        el.showPopover()
      } catch {
        /* jsdom or already shown */
      }
      el.focus()
    } else {
      try {
        el.hidePopover()
      } catch {
        /* jsdom or already hidden */
      }
      restoreRef.current?.focus()
      restoreRef.current = null
    }
  })

  useSignalEffect(() => {
    const el = panelRef.current
    if (!el) return
    const handler = (e: Event) => {
      const isClosing = 'newState' in e ? (e as ToggleEvent).newState === 'closed' : true
      if (isOpen.peek() && isClosing) onCloseRef.current()
    }
    el.addEventListener('toggle', handler)
    return () => el.removeEventListener('toggle', handler)
  })

  return (
    <div
      ref={panelRef}
      popover="auto"
      role="region"
      aria-label={label}
      tabIndex={-1}
      data-state={open ? 'open' : 'closed'}
      className={cn(styles['panel'], className)}
    >
      <div className={styles['header']}>
        <span className={styles['title']}>{label}</span>
        <button
          type="button"
          aria-label={labels?.close ?? t(builtin.headerPanel.close)}
          className={styles['close']}
          onClick={() => onCloseRef.current()}
        >
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path
              d="M4 4l8 8M12 4l-8 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      <div className={styles['body']}>{children}</div>
    </div>
  )
}
