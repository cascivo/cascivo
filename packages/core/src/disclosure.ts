'use client'
import { useControllableSignal } from './controllable.ts'
import type { ReadonlySignal } from './signals.ts'

export interface UseDisclosureOptions {
  /** Initial open state for uncontrolled use. */
  defaultOpen?: boolean
  /** Controlled open state. When provided, the parent owns the state. */
  isOpen?: boolean
  /** Called whenever open/close/toggle is requested. */
  onOpenChange?: (open: boolean) => void
}

export interface UseDisclosureReturn {
  isOpen: ReadonlySignal<boolean>
  open: () => void
  close: () => void
  toggle: () => void
}

/**
 * Open/close state for overlays (modal, drawer, popover, …), replacing the
 * per-component `useSignal(open)` boilerplate. Backed by `useControllableSignal`
 * so it is controlled when `isOpen` is passed and uncontrolled otherwise.
 * Replaces HeroUI's `@heroui/use-disclosure`. No `useState`/`useEffect`.
 */
export function useDisclosure(options: UseDisclosureOptions = {}): UseDisclosureReturn {
  const { defaultOpen = false, isOpen, onOpenChange } = options
  const [open, setOpen] = useControllableSignal<boolean>({
    value: isOpen,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  })

  return {
    isOpen: open,
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen(!open.value),
  }
}
