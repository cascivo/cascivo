import { useRef } from 'react'
import { useSignal, useSignalEffect } from '@cascivo/core'
import type { Signal } from '@cascivo/core'

let anchorCounter = 0

export interface UsePopoverOptions {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  placement?: 'top' | 'bottom' | 'left' | 'right'
  offset?: number
}

export interface UsePopoverReturn {
  triggerRef: React.RefObject<HTMLElement | null>
  popoverRef: React.RefObject<HTMLElement | null>
  isOpen: Signal<boolean>
  anchorName: string
  open: () => void
  close: () => void
  toggle: () => void
}

const supportsAnchor =
  typeof CSS !== 'undefined' &&
  typeof CSS.supports === 'function' &&
  CSS.supports('anchor-name: --cascivo-a')

export function usePopover(options: UsePopoverOptions = {}): UsePopoverReturn {
  const anchorName = useRef(`--cascivo-popover-${++anchorCounter}`).current
  const triggerRef = useRef<HTMLElement>(null)
  const popoverRef = useRef<HTMLElement>(null)
  const isOpen = useSignal(options.open ?? false)

  // Sync controlled prop into signal during render
  if (options.open !== undefined) {
    isOpen.value = options.open
  }

  const onOpenChangeRef = useRef(options.onOpenChange)
  onOpenChangeRef.current = options.onOpenChange

  const placementRef = useRef(options.placement)
  placementRef.current = options.placement

  const offsetRef = useRef(options.offset)
  offsetRef.current = options.offset

  useSignalEffect(() => {
    const open = isOpen.value
    onOpenChangeRef.current?.(open)

    const popover = popoverRef.current
    if (!popover) return

    if (open) {
      try {
        popover.showPopover()
      } catch {
        // Already shown or browser doesn't support Popover API
      }
    } else {
      try {
        popover.hidePopover()
      } catch {
        // Already hidden
      }
    }

    // Fallback positioning when CSS Anchor Positioning is unsupported
    if (!supportsAnchor && open) {
      const trigger = triggerRef.current
      if (!trigger) return
      const rect = trigger.getBoundingClientRect()
      const placement = placementRef.current ?? 'bottom'
      const offset = offsetRef.current ?? 4
      if (placement === 'bottom') {
        popover.style.top = `${rect.bottom + offset + window.scrollY}px`
        popover.style.left = `${rect.left + window.scrollX}px`
      } else if (placement === 'top') {
        popover.style.top = `${rect.top - offset + window.scrollY}px`
        popover.style.left = `${rect.left + window.scrollX}px`
        popover.style.transform = 'translateY(-100%)'
      } else if (placement === 'left') {
        popover.style.top = `${rect.top + window.scrollY}px`
        popover.style.left = `${rect.left - offset + window.scrollX}px`
        popover.style.transform = 'translateX(-100%)'
      } else if (placement === 'right') {
        popover.style.top = `${rect.top + window.scrollY}px`
        popover.style.left = `${rect.right + offset + window.scrollX}px`
      }
    }
  })

  // Listen for popover hide (light-dismiss clicks)
  useSignalEffect(() => {
    const popover = popoverRef.current
    if (!popover) return
    const handler = (e: Event) => {
      const toggleEvent = e as ToggleEvent
      if (toggleEvent.newState === 'closed') {
        isOpen.value = false
      }
    }
    popover.addEventListener('toggle', handler)
    return () => popover.removeEventListener('toggle', handler)
  })

  return {
    triggerRef,
    popoverRef,
    isOpen,
    anchorName,
    open: () => {
      isOpen.value = true
    },
    close: () => {
      isOpen.value = false
    },
    toggle: () => {
      isOpen.value = !isOpen.value
    },
  }
}
