'use client'
import { cn, useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { cloneElement, isValidElement, useRef } from 'react'
import type { ReactElement, ReactNode } from 'react'
import styles from './app-shell.module.css'

/** Props AppShell injects into a {@link ShellHeader}-shaped header element. */
interface HeaderMenuProps {
  onMenuClick?: (() => void) | undefined
  menuExpanded?: boolean
}

export interface AppShellProps {
  /**
   * Top bar — typically a `<ShellHeader>`. If it is a React element, AppShell
   * binds its burger (`onMenuClick`/`menuExpanded`) to the nav open state so the
   * header button toggles the nav out of the box.
   */
  header: ReactNode
  /** Side navigation — typically a `<SideNav>`. Fills full height and scrolls internally. */
  nav?: ReactNode
  /** Main content. Lives in the single scroll container. */
  children: ReactNode
  /** Optional footer pinned below the content area. */
  footer?: ReactNode
  /** Controlled nav open/visible state. Omit for uncontrolled (see `defaultOpen`). */
  open?: boolean
  /** Initial open state when uncontrolled. Defaults to open on desktop, closed on small screens. */
  defaultOpen?: boolean
  /** Fired when the nav requests open/close (burger, Escape, scrim). */
  onOpenChange?: ((open: boolean) => void) | undefined
  className?: string | undefined
}

/**
 * App shell: composes a header + side navigation + main content into one
 * sticky-header, full-height-nav, single-scroll-container layout (#11). The
 * header burger toggles the nav with an animated show/hide that honors
 * `prefers-reduced-motion` (via `--cascivo-motion-*`), toggles `inert` on the
 * hidden nav so it leaves the tab order, and renders a mobile drawer + scrim
 * (#12). Below `lg` (64rem) the nav is an overlay drawer; at `lg`+ it is an
 * in-flow column whose width animates between its open width and 0.
 *
 * Rail vs full-hide reconcile cleanly: AppShell owns the full show/hide (this
 * `open` state); the SideNav you pass owns its own rail collapse
 * (`showCollapseToggle`). They compose on different axes and never fight.
 */
export function AppShell({
  header,
  nav,
  children,
  footer,
  open,
  defaultOpen,
  onOpenChange,
  className,
}: AppShellProps) {
  useSignals()
  const controlled = open !== undefined
  const isOpen = useSignal(open ?? defaultOpen ?? true)
  // Sync a controlled prop into the signal during render (no-op if unchanged).
  if (controlled) isOpen.value = open

  const navWrapperRef = useRef<HTMLDivElement>(null)
  const toggleOriginRef = useRef<HTMLElement | null>(null)

  function setOpen(next: boolean) {
    if (!controlled) isOpen.value = next
    onOpenChange?.(next)
  }
  function toggle() {
    if (typeof document !== 'undefined') {
      toggleOriginRef.current = document.activeElement as HTMLElement | null
    }
    setOpen(!isOpen.value)
  }

  // Uncontrolled: start closed on small screens so the drawer isn't open on load.
  useSignalEffect(() => {
    if (controlled || defaultOpen !== undefined) return
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    if (window.matchMedia('(max-width: 63.999rem)').matches) isOpen.value = false
  })

  // Escape closes the nav (drawer) — read the signal so the effect re-subscribes.
  useSignalEffect(() => {
    if (!isOpen.value || typeof document === 'undefined') return
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  // inert + focus management: when closed the nav leaves the tab order; on the
  // mobile drawer, move focus in on open and restore it to the toggle on close.
  useSignalEffect(() => {
    const wrapper = navWrapperRef.current
    if (!wrapper) return
    if (isOpen.value) {
      wrapper.removeAttribute('inert')
    } else {
      wrapper.setAttribute('inert', '')
      const origin = toggleOriginRef.current
      if (origin && wrapper.contains(document.activeElement)) origin.focus()
    }
  })

  const headerEl =
    isValidElement(header) && nav
      ? cloneElement(header as ReactElement<HeaderMenuProps>, {
          onMenuClick: toggle,
          menuExpanded: isOpen.value,
        })
      : header

  return (
    <div className={cn(styles['shell'], className)} data-open={isOpen.value}>
      <div className={styles['header']}>{headerEl}</div>
      <div className={styles['body']}>
        {nav && (
          <>
            <div
              ref={navWrapperRef}
              className={styles['navWrapper']}
              data-open={isOpen.value}
              data-testid="app-shell-nav"
            >
              <div className={styles['navInner']}>{nav}</div>
            </div>
            <div
              className={styles['scrim']}
              data-open={isOpen.value}
              data-testid="app-shell-scrim"
              aria-hidden="true"
              onClick={() => setOpen(false)}
            />
          </>
        )}
        <main id="cascade-main" tabIndex={-1} className={styles['main']}>
          {children}
        </main>
      </div>
      {footer && <div className={styles['footer']}>{footer}</div>}
    </div>
  )
}
