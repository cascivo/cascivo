'use client'
import { createMachine, useMachine, cn } from '@cascade-ui/core'
import { useEffect, useRef, type ReactNode, type KeyboardEvent } from 'react'
import styles from './modal.module.css'

const machine = createMachine({
  initial: 'closed' as const,
  states: {
    closed: { on: { OPEN: 'open' } },
    open: { on: { CLOSE: 'closed' } },
  },
})

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
  const [state, send] = useMachine(machine)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const isOpen = open || state.value === 'open'

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isOpen) {
      if (!dialog.open) dialog.showModal()
    } else {
      if (dialog.open) dialog.close()
    }
  }, [isOpen])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handler = () => {
      send('CLOSE')
      onClose?.()
    }
    dialog.addEventListener('close', handler)
    return () => dialog.removeEventListener('close', handler)
  }, [send, onClose])

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
                aria-label="Close modal"
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
