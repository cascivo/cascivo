'use client'
import { cn, useSignal, useSignalEffect, useSignals } from '@cascade-ui/core'
import { builtin, t } from '@cascade-ui/i18n'
import { useRef, type ReactNode, type KeyboardEvent } from 'react'
import styles from './modal.module.css'

export interface ModalProps {
  open?: boolean
  onClose?: () => void
  title?: string
  description?: string
  children?: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({
  open = false,
  onClose,
  title,
  description,
  children,
  className,
  size = 'md',
}: ModalProps) {
  useSignals()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const isOpen = useSignal(open)
  // Sync controlled prop into signal — no-op when value unchanged
  isOpen.value = open

  useSignalEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isOpen.value) {
      if (!dialog.open) dialog.showModal()
    } else {
      if (dialog.open) dialog.close()
    }
  })

  useSignalEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handler = () => onCloseRef.current?.()
    dialog.addEventListener('close', handler)
    return () => dialog.removeEventListener('close', handler)
  })

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      dialogRef.current?.close()
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      dialogRef.current?.close()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      data-size={size}
      className={cn(styles['dialog'], className)}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      aria-labelledby={title ? 'cascade-modal-title' : undefined}
      aria-describedby={description ? 'cascade-modal-desc' : undefined}
    >
      <div className={styles['panel']}>
        {(title || onClose) && (
          <div className={styles['header']}>
            {title && (
              <h2 id="cascade-modal-title" className={styles['title']}>
                {title}
              </h2>
            )}
            {onClose && (
              <button
                type="button"
                className={styles['close']}
                onClick={() => dialogRef.current?.close()}
                aria-label={t(builtin.modal.close)}
              >
                ✕
              </button>
            )}
          </div>
        )}
        {description && (
          <p id="cascade-modal-desc" className={styles['description']}>
            {description}
          </p>
        )}
        <div className={styles['body']}>{children}</div>
      </div>
    </dialog>
  )
}
