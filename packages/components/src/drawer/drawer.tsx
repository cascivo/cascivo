'use client'

import {
  cn,
  DismissableLayer,
  FocusScope,
  Portal,
  Presence,
  useControllableSignal,
  useDraggable,
  useScrollLock,
  useSignals,
} from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { useId } from 'react'
import type { CSSProperties, ReactNode, Ref } from 'react'
import styles from './drawer.module.css'

/** Drag distance (px) past which a swipe dismisses the drawer. */
const SWIPE_DISMISS_THRESHOLD = 80

export interface DrawerProps {
  /** Controlled open state. */
  open?: boolean
  /** Initial open state for uncontrolled use. */
  defaultOpen?: boolean
  /** Called whenever the open state should change. */
  onOpenChange?: (open: boolean) => void
  /** Edge the panel is anchored to. Drives the slide direction. */
  side?: 'start' | 'end' | 'top' | 'bottom'
  /** Panel size along its cross axis (width for start/end, height for top/bottom). */
  size?: string
  /** Accessible title shown in the header and used to label the dialog. */
  title?: ReactNode
  /** Optional supporting description shown under the title. */
  description?: ReactNode
  children?: ReactNode
  labels?: { close?: string }
  className?: string
  /** Allow dragging the header toward its edge to dismiss (opt-in; CSS translate, no animation library). */
  swipeToDismiss?: boolean
}

/**
 * Edge-anchored panel. Unlike Sheet's gesture-driven sheet, Drawer is a plain dialog surface that
 * slides in from an edge with CSS-only enter/exit motion (data-state + @starting-style). Open state
 * is controllable; while open, body scroll is locked, focus is trapped, and outside pointer /
 * Escape dismiss it.
 */
export function Drawer({
  open,
  defaultOpen,
  onOpenChange,
  side = 'end',
  size,
  title,
  description,
  children,
  labels,
  className,
  swipeToDismiss = false,
}: DrawerProps) {
  useSignals()
  const [isOpen, setOpen] = useControllableSignal<boolean>({
    value: open,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
  })

  useScrollLock(isOpen)

  // Drag-to-dismiss: constrain to the panel's edge axis; past a threshold in the
  // dismiss direction, close via the existing onOpenChange path; otherwise snap back.
  const dragAxis = side === 'top' || side === 'bottom' ? 'y' : 'x'
  const { handleRef, offset, isDragging, reset } = useDraggable({
    isDisabled: !swipeToDismiss,
    axis: dragAxis,
    onDragEnd: (o) => {
      const dist = dragAxis === 'y' ? o.y : o.x
      const dismiss =
        (side === 'end' && dist > SWIPE_DISMISS_THRESHOLD) ||
        (side === 'start' && dist < -SWIPE_DISMISS_THRESHOLD) ||
        (side === 'bottom' && dist > SWIPE_DISMISS_THRESHOLD) ||
        (side === 'top' && dist < -SWIPE_DISMISS_THRESHOLD)
      reset()
      if (dismiss) setOpen(false)
    },
  })

  const titleId = useId()
  const descId = useId()
  const closeLabel = labels?.close ?? t(builtin.drawer.close)

  const panelStyle: CSSProperties = {
    ...(size ? { '--_drawer-size': size } : {}),
    ...(swipeToDismiss
      ? { '--_drawer-drag-x': `${offset.value.x}px`, '--_drawer-drag-y': `${offset.value.y}px` }
      : {}),
  } as CSSProperties

  return (
    <Portal>
      <Presence present={isOpen}>
        <div className={styles['overlay']} data-side={side}>
          <DismissableLayer onDismiss={() => setOpen(false)}>
            <FocusScope trapped restoreFocus autoFocus>
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                aria-describedby={description ? descId : undefined}
                data-side={side}
                data-dragging={swipeToDismiss && isDragging.value ? '' : undefined}
                className={cn(styles['panel'], className)}
                style={panelStyle}
              >
                {(title || description) && (
                  <div
                    className={styles['header']}
                    ref={swipeToDismiss ? (handleRef as Ref<HTMLDivElement>) : undefined}
                  >
                    <div className={styles['heading']}>
                      {title && (
                        <h2 id={titleId} className={styles['title']}>
                          {title}
                        </h2>
                      )}
                      {description && (
                        <p id={descId} className={styles['description']}>
                          {description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      aria-label={closeLabel}
                      onClick={() => setOpen(false)}
                      className={styles['close']}
                    >
                      <svg aria-hidden="true" viewBox="0 0 16 16" className={styles['closeIcon']}>
                        <path
                          d="M4 4l8 8M12 4l-8 8"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                )}
                <div className={styles['body']}>{children}</div>
              </div>
            </FocusScope>
          </DismissableLayer>
        </div>
      </Presence>
    </Portal>
  )
}
