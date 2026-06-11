'use client'

import { useRef, type ReactNode } from 'react'
import { useSignal, useSignalEffect } from '@cascade-ui/core'
import { builtin, t } from '@cascade-ui/i18n'
import styles from './sheet.module.css'

export interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  side?: 'start' | 'end' | 'top' | 'bottom'
}

export function Sheet({ open, onClose, title, children, side = 'end' }: SheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const isOpen = useSignal(open)
  isOpen.value = open
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useSignalEffect(() => {
    const el = sheetRef.current
    if (!el) return
    if (isOpen.value) {
      try {
        el.showPopover()
      } catch {
        /* noop */
      }
    } else {
      try {
        el.hidePopover()
      } catch {
        /* noop */
      }
    }
  })

  return (
    <div
      ref={sheetRef}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore — popover is a valid HTML attribute not yet in React types
      popover="manual"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      data-state={open ? 'open' : 'closed'}
      data-side={side}
      className={styles.sheet}
    >
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <button
          type="button"
          aria-label={t(builtin.sheet.close)}
          onClick={() => onCloseRef.current()}
          className={styles.close}
        >
          ✕
        </button>
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  )
}
