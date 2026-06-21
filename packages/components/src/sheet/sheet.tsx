'use client'

import { useId, useRef, type ReactNode } from 'react'
import { useSignal, useSignalEffect } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import styles from './sheet.module.css'

export interface SheetProps {
  open: boolean
  onClose: () => void
  /** Optional heading. Accepts rich nodes; when present it labels the dialog via `aria-labelledby`. */
  title?: ReactNode
  children: ReactNode
  side?: 'start' | 'end' | 'top' | 'bottom'
}

export function Sheet({ open, onClose, title, children, side = 'end' }: SheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
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
      aria-labelledby={title != null ? titleId : undefined}
      data-state={open ? 'open' : 'closed'}
      data-side={side}
      className={styles.sheet}
    >
      <div className={styles.header}>
        {title != null && (
          <span id={titleId} className={styles.title}>
            {title}
          </span>
        )}
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
