'use client'

import {
  cn,
  DismissableLayer,
  useAnchorPosition,
  useControllableSignal,
  useSignals,
} from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { useId, useRef, type ReactNode } from 'react'
import styles from './toggletip.module.css'

export type ToggletipPlacement =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-start'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-end'

export interface ToggletipProps {
  /** The trigger node (e.g. an info icon). Rendered inside a button. */
  trigger: ReactNode
  /** The popover content. Interactive and selectable. */
  children: ReactNode
  placement?: ToggletipPlacement
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  labels?: { label?: string }
  className?: string
}

export function Toggletip({
  trigger,
  children,
  placement = 'top',
  defaultOpen = false,
  open,
  onOpenChange,
  labels,
  className,
}: ToggletipProps) {
  useSignals()
  const [isOpen, setOpen] = useControllableSignal<boolean>({
    ...(open !== undefined && { value: open }),
    defaultValue: defaultOpen,
    ...(onOpenChange && { onChange: onOpenChange }),
  })

  const triggerRef = useRef<HTMLButtonElement>(null)
  const bubbleRef = useRef<HTMLDivElement>(null)
  const bubbleId = useId()

  const { anchorStyle, floatingStyle } = useAnchorPosition({
    anchorRef: triggerRef,
    floatingRef: bubbleRef,
    placement,
    enabled: isOpen,
  })

  return (
    <span className={cn(styles['root'], className)}>
      <button
        ref={triggerRef}
        type="button"
        className={styles['trigger']}
        aria-expanded={isOpen.value}
        aria-controls={bubbleId}
        aria-label={labels?.label ?? t(builtin.toggletip.label)}
        style={anchorStyle}
        onClick={() => setOpen(!isOpen.value)}
      >
        {trigger}
      </button>

      {isOpen.value ? (
        <DismissableLayer onDismiss={() => setOpen(false)}>
          <div
            ref={bubbleRef}
            id={bubbleId}
            role="status"
            data-state="open"
            data-placement={placement}
            className={styles['bubble']}
            style={floatingStyle}
          >
            {children}
          </div>
        </DismissableLayer>
      ) : null}
    </span>
  )
}
