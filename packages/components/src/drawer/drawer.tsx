'use client'

import {
  cn,
  DismissableLayer,
  FocusScope,
  Portal,
  Presence,
  useControllableSignal,
  useScrollLock,
  useSignals,
} from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { useId, type CSSProperties, type ReactNode } from 'react'
import styles from './drawer.module.css'

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
}: DrawerProps) {
  useSignals()
  const [isOpen, setOpen] = useControllableSignal<boolean>({
    value: open,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
  })

  useScrollLock(isOpen)

  const titleId = useId()
  const descId = useId()
  const closeLabel = labels?.close ?? t(builtin.drawer.close)

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
                className={cn(styles['panel'], className)}
                style={size ? ({ '--_drawer-size': size } as CSSProperties) : undefined}
              >
                {(title || description) && (
                  <div className={styles['header']}>
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
