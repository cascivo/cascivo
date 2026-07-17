'use client'

import { useRef } from 'react'
import { useId, useSignal, useSignalEffect } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import styles from './alert-dialog.module.css'

export interface AlertDialogLabels {
  confirm?: string
  cancel?: string
}

export interface AlertDialogProps {
  open: boolean
  title: string
  description: string
  onConfirm: () => void
  onCancel: () => void
  labels?: AlertDialogLabels
  variant?: 'destructive' | 'default'
}

export function AlertDialog({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  labels,
  variant = 'default',
}: AlertDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId('cascivo-alert-dialog-title')
  const descId = useId('cascivo-alert-dialog-desc')
  const isOpen = useSignal(open)
  isOpen.value = open

  const cancelRef = useRef<HTMLButtonElement>(null)
  const onCancelRef = useRef(onCancel)
  onCancelRef.current = onCancel
  const onConfirmRef = useRef(onConfirm)
  onConfirmRef.current = onConfirm

  useSignalEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (isOpen.value) {
      try {
        el.showPopover()
      } catch {
        /* noop */
      }
      requestAnimationFrame(() => cancelRef.current?.focus())
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
      ref={dialogRef}
      // @ts-ignore — popover is a valid HTML attribute not yet in React types
      popover="manual"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      data-state={open ? 'open' : 'closed'}
      data-variant={variant}
      className={styles.dialog}
    >
      <div className={styles.content}>
        <p id={titleId} className={styles.title}>
          {title}
        </p>
        <p id={descId} className={styles.description}>
          {description}
        </p>
        <div className={styles.actions}>
          <button
            ref={cancelRef}
            type="button"
            className={styles.cancel}
            onClick={() => onCancelRef.current()}
          >
            {labels?.cancel ?? t(builtin.alertDialog.cancel)}
          </button>
          <button type="button" className={styles.confirm} onClick={() => onConfirmRef.current()}>
            {labels?.confirm ?? t(builtin.alertDialog.confirm)}
          </button>
        </div>
      </div>
    </div>
  )
}
