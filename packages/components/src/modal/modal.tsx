'use client'
import {
  cn,
  useDraggable,
  useEffectPropSignal,
  useId,
  useSignalEffect,
  useSignals,
} from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import styles from './modal.module.css'

export interface ModalProps {
  /**
   * Whether the component is open (controlled).
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  open?: boolean
  onClose?: () => void
  title?: string
  description?: string
  children?: ReactNode
  /**
   * Dialog actions, rendered in a right-aligned row below the body and separated from it
   * by a divider. Every consumer hand-rolled this before it existed.
   *
   * ```tsx
   * <Modal open={open} title="Delete project" footer={
   *   <>
   *     <Button variant="ghost" onClick={close}>Cancel</Button>
   *     <Button variant="destructive" onClick={remove}>Delete</Button>
   *   </>
   * }>
   *   …
   * </Modal>
   * ```
   */
  footer?: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
  /**
   * Allow dragging the dialog by its header
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  draggable?: boolean
  /**
   * AI presence: `true` gives the surface an AI-tinted edge and a soft aura, marking
   * AI-generated content; `'generating'` adds a pulsing inner glow while AI is still
   * producing it (stops under reduced motion). Visual only — pair it with an AiBadge so the
   * provenance is also text.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  ai?: boolean | 'generating'
}

export function Modal({
  open = false,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  size = 'md',
  draggable = false,
  ai = false,
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

  const isOpen = useEffectPropSignal(open)

  useSignalEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isOpen.value) {
      if (!dialog.open) dialog.showModal()
    } else {
      if (dialog.open) dialog.close()
    }
  })

  // Astro's `transition:persist` without `Element.moveBefore` (Safari, Firefox) re-inserts the
  // island by moving an ancestor, and removal drops an open dialog out of the top layer while
  // `isOpen` still says open: Escape and the backdrop go dead. Watch only while open, so a
  // closed modal costs nothing.
  useSignalEffect(() => {
    const open = isOpen.value
    const dialog = dialogRef.current
    if (!open || !dialog) return
    const observer = new MutationObserver((records) => {
      if (!dialog.isConnected || !wasReinserted(records, dialog) || isModal(dialog)) return
      // Not `close()`: it fires `close`, which reaches `onClose` and a controlled parent
      // would close the modal. `showModal()` throws while the `open` attribute is present.
      dialog.removeAttribute('open')
      try {
        dialog.showModal()
      } catch {
        // Never leave the dialog hidden while `isOpen` says open: shown non-modally beats gone.
        dialog.setAttribute('open', '')
      }
    })
    observer.observe(dialog.ownerDocument, { childList: true, subtree: true })
    return () => observer.disconnect()
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
      data-ai={ai === 'generating' ? 'generating' : ai ? '' : undefined}
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
        <div className={styles['body']} data-cascivo-modal-body="">
          {children}
        </div>
        {footer && (
          <div className={styles['footer']} data-cascivo-modal-footer="">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  )
}

function wasReinserted(records: MutationRecord[], el: Element): boolean {
  for (const record of records) {
    // Indexed, not `for…of`: iterating a NodeList needs `DOM.Iterable`, which an adopter's
    // tsconfig may lack.
    const added = record.addedNodes
    for (let i = 0; i < added.length; i++) {
      if (added.item(i)?.contains(el)) return true
    }
  }
  return false
}

// A re-inserted dialog is never modal, so an engine without `:modal` restores it.
function isModal(dialog: HTMLDialogElement): boolean {
  try {
    return dialog.matches(':modal')
  } catch {
    return false
  }
}
