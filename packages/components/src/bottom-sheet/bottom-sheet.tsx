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
import { useId, type CSSProperties, type ReactNode, type Ref } from 'react'
import styles from './bottom-sheet.module.css'

/** How far ahead (ms) a release velocity is projected when choosing the target detent. */
const VELOCITY_PROJECTION_MS = 120
/** Downward fling speed (px/ms) that dismisses regardless of position. */
const FLING_DISMISS_VELOCITY = 0.6
/** Drag below the lowest detent by this fraction of the viewport dismisses the sheet. */
const DISMISS_MARGIN = 0.1

const DEFAULT_SNAP_POINTS = [0.5, 0.92]

export interface BottomSheetProps {
  /** Controlled open state. */
  open?: boolean
  /** Initial open state for uncontrolled use. */
  defaultOpen?: boolean
  /** Called whenever the open state should change (drag-dismiss, Escape, outside press). */
  onOpenChange?: (open: boolean) => void
  /**
   * Detent heights as fractions of the viewport (0–1), ascending. The sheet snaps
   * between these; dragging below the lowest dismisses it. Defaults to half + near-full.
   */
  snapPoints?: number[]
  /** Controlled active detent index into `snapPoints`. */
  activeSnap?: number
  /** Initial active detent index for uncontrolled use. Defaults to the lowest detent. */
  defaultSnap?: number
  /** Called when the active detent changes via drag. */
  onSnapChange?: (index: number) => void
  /** Accessible title shown in the header and used to label the dialog. */
  title?: ReactNode
  /** Optional supporting description shown under the title. */
  description?: ReactNode
  children?: ReactNode
  labels?: { close?: string; handle?: string }
  className?: string
}

/**
 * Mobile bottom sheet with drag-to-resize detents. The panel is sized to its tallest
 * detent and translated down to reveal only the active one; dragging the grab handle
 * moves it and, on release, snaps to the nearest detent (projected by fling velocity)
 * or dismisses past the lowest. Body scroll is locked, focus is trapped, and Escape /
 * outside press dismiss it. CSS translate only — no animation library.
 */
export function BottomSheet({
  open,
  defaultOpen,
  onOpenChange,
  snapPoints = DEFAULT_SNAP_POINTS,
  activeSnap,
  defaultSnap = 0,
  onSnapChange,
  title,
  description,
  children,
  labels,
  className,
}: BottomSheetProps) {
  useSignals()
  const [isOpen, setOpen] = useControllableSignal<boolean>({
    value: open,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
  })
  const [snap, setSnap] = useControllableSignal<number>({
    value: activeSnap,
    defaultValue: defaultSnap,
    onChange: onSnapChange,
  })

  useScrollLock(isOpen)

  const detents = snapPoints
  const maxFraction = detents[detents.length - 1] ?? 1
  const lowestFraction = detents[0] ?? 0
  const activeFraction = detents[Math.min(snap.value, detents.length - 1)] ?? maxFraction

  const { handleRef, offset, velocity, isDragging, reset } = useDraggable({
    axis: 'y',
    onDragEnd: (o) => {
      const vh = typeof window === 'undefined' ? 0 : window.innerHeight
      // Capture velocity before reset() — reset() zeroes the velocity signal.
      const vy = velocity.value.y
      reset()
      if (vh === 0) return
      // Visible fraction at release, then projected forward by the fling velocity
      // (vy is +down, so a downward fling lowers the projected fraction).
      const releasedFraction = activeFraction - o.y / vh
      const projected = releasedFraction - (vy * VELOCITY_PROJECTION_MS) / vh
      if (vy > FLING_DISMISS_VELOCITY || projected < lowestFraction - DISMISS_MARGIN) {
        setOpen(false)
        return
      }
      let nearest = 0
      for (let i = 1; i < detents.length; i++) {
        if (
          Math.abs((detents[i] ?? 0) - projected) < Math.abs((detents[nearest] ?? 0) - projected)
        ) {
          nearest = i
        }
      }
      setSnap(nearest)
    },
  })

  const titleId = useId()
  const descId = useId()
  const closeLabel = labels?.close ?? t(builtin.bottomSheet.close)
  const handleLabel = labels?.handle ?? t(builtin.bottomSheet.handle)

  // Translate the panel down so only the active detent shows. The base offset is a
  // percentage of the panel's own height (height = maxFraction·100dvh); drag adds px.
  const baseTranslate = `${(1 - activeFraction / maxFraction) * 100}%`
  const panelStyle = {
    '--_sheet-height': `${maxFraction * 100}dvh`,
    '--_sheet-y': baseTranslate,
    '--_sheet-drag': `${offset.value.y}px`,
  } as CSSProperties

  return (
    <Portal>
      <Presence present={isOpen}>
        <div className={styles['overlay']}>
          <DismissableLayer onDismiss={() => setOpen(false)}>
            <FocusScope trapped restoreFocus autoFocus>
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                aria-describedby={description ? descId : undefined}
                data-dragging={isDragging.value ? '' : undefined}
                className={cn(styles['panel'], className)}
                style={panelStyle}
              >
                <div className={styles['header']} ref={handleRef as Ref<HTMLDivElement>}>
                  <div
                    className={styles['handle']}
                    role="separator"
                    aria-label={handleLabel}
                    aria-orientation="horizontal"
                  />
                  {(title || description) && (
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
                  )}
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
                <div className={styles['body']}>{children}</div>
              </div>
            </FocusScope>
          </DismissableLayer>
        </div>
      </Presence>
    </Portal>
  )
}
