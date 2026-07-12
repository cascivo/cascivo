'use client'

import { cn, useDraggable, useSignal, useSignals } from '@cascivo/core'
import { type ReactNode, type Ref } from 'react'
import styles from './swipe-item.module.css'

/** Width (px) of one revealed action. Must match `.action { inline-size }` in the CSS. */
const ACTION_WIDTH = 72
/** How far ahead (ms) release velocity is projected when deciding the snap target. */
const PROJECT_MS = 100

export interface SwipeAction {
  /** Stable React key. Provide when `label` may repeat across actions. */
  id?: string
  /** Accessible name and visible label. */
  label: string
  icon?: ReactNode
  onSelect: () => void
  /** Render in the destructive (danger) style. */
  destructive?: boolean
}

export interface SwipeItemProps {
  /** The row content. */
  children: ReactNode
  /** Actions revealed by dragging the row toward its end edge (shown on the start edge). */
  leadingActions?: SwipeAction[]
  /** Actions revealed by dragging the row toward its start edge (shown on the end edge). */
  trailingActions?: SwipeAction[]
  className?: string
}

type OpenState = 'closed' | 'leading' | 'trailing'

/**
 * A list row whose leading/trailing actions are revealed by a horizontal drag, snapping
 * open or closed on release (projected by fling velocity). The action buttons are always
 * in the DOM and the a11y tree — never gesture-only — and focusing one (keyboard) reveals
 * its side, so the row is fully operable without a pointer. Escape closes it. The drag is
 * physical-axis (tuned for LTR); CSS translate only, no animation library.
 */
export function SwipeItem({
  children,
  leadingActions = [],
  trailingActions = [],
  className,
}: SwipeItemProps) {
  useSignals()
  const committed = useSignal(0)
  const open = useSignal<OpenState>('closed')
  const leadW = leadingActions.length * ACTION_WIDTH
  const trailW = trailingActions.length * ACTION_WIDTH

  const { handleRef, offset, velocity, isDragging, reset } = useDraggable({
    axis: 'x',
    onDragEnd: (o) => {
      const vx = velocity.value.x
      const released = committed.value + o.x
      reset()
      const projected = released + vx * PROJECT_MS
      let target = 0
      if (leadW > 0 && projected > leadW / 2) target = leadW
      else if (trailW > 0 && projected < -trailW / 2) target = -trailW
      committed.value = target
      open.value = target > 0 ? 'leading' : target < 0 ? 'trailing' : 'closed'
    },
  })

  const reveal = (side: 'leading' | 'trailing'): void => {
    committed.value = side === 'leading' ? leadW : -trailW
    open.value = side
  }
  const close = (): void => {
    committed.value = 0
    open.value = 'closed'
    reset()
  }
  const select = (action: SwipeAction): void => {
    action.onSelect()
    close()
  }

  // Live translate: committed position plus the in-progress drag delta, clamped to the
  // revealable widths so the row can't be dragged past its actions.
  const x = Math.max(-trailW, Math.min(leadW, committed.value + offset.value.x))

  const renderPanel = (side: 'leading' | 'trailing', actions: SwipeAction[]): ReactNode => (
    <div className={cn(styles['panel'], styles[side])}>
      {actions.map((action, i) => (
        <button
          key={action.id ?? `${i}-${action.label}`}
          type="button"
          data-destructive={action.destructive ? '' : undefined}
          className={styles['action']}
          onFocus={() => reveal(side)}
          onClick={() => select(action)}
        >
          {action.icon && (
            <span className={styles['actionIcon']} aria-hidden="true">
              {action.icon}
            </span>
          )}
          <span className={styles['actionLabel']}>{action.label}</span>
        </button>
      ))}
    </div>
  )

  return (
    <div
      className={cn(styles['root'], className)}
      data-state={open.value}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open.value !== 'closed') close()
      }}
    >
      {leadingActions.length > 0 && renderPanel('leading', leadingActions)}
      {trailingActions.length > 0 && renderPanel('trailing', trailingActions)}
      <div
        ref={handleRef as Ref<HTMLDivElement>}
        className={styles['content']}
        data-dragging={isDragging.value ? '' : undefined}
        style={{ transform: `translateX(${x}px)` }}
      >
        {children}
      </div>
    </div>
  )
}
