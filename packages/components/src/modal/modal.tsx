'use client'
import { cn, useDraggable, useId, useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import styles from './modal.module.css'

export interface ModalProps {
  open?: boolean
  onClose?: () => void
  title?: string
  description?: string
  children?: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
  /** Allow dragging the dialog by its header (opt-in; CSS translate, no animation library). */
  draggable?: boolean
}

export function Modal({
  open = false,
  onClose,
  title,
  description,
  children,
  className,
  size = 'md',
  draggable = false,
}: ModalProps) {
  useSignals()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // Unique per instance so multiple modals on one page keep distinct aria targets.
  const titleId = useId('cascivo-modal-title')
  const descId = useId('cascivo-modal-desc')

  const { handleRef, offset } = useDraggable({ isDisabled: !draggable })
  const dragStyle: CSSProperties | undefined = draggable
    ? ({ '--modal-x': `${offset.value.x}px`, '--modal-y': `${offset.value.y}px` } as CSSProperties)
    : undefined

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

  // Escape is handled natively by <dialog> opened via showModal() (fires the
  // `close` event wired above) — no manual keydown handler needed.
  return (
    <dialog
      ref={dialogRef}
      data-size={size}
      data-draggable={draggable || undefined}
      className={cn(styles['dialog'], className)}
      style={dragStyle}
      onClick={handleBackdropClick}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
    >
      <div className={styles['panel']}>
        {(title || onClose) && (
          <div
            className={styles['header']}
            ref={
              draggable
                ? (el: HTMLDivElement | null) => {
                    handleRef.current = el
                  }
                : undefined
            }
          >
            {title && (
              <h2 id={titleId} className={styles['title']}>
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
          <p id={descId} className={styles['description']}>
            {description}
          </p>
        )}
        <div className={styles['body']}>{children}</div>
      </div>
    </dialog>
  )
}
