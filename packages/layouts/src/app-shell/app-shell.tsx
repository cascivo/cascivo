'use client'
import { cn, useSignal, useSignalEffect, useSignals } from '@cascade-ui/core'
import { builtin, t } from '@cascade-ui/i18n'
import type { ReactNode } from 'react'
import styles from './app-shell.module.css'
import { createShellState, type ShellState } from './shell-state'

export interface AppShellProps {
  header: ReactNode
  sideNav?: ReactNode
  aside?: ReactNode
  /** Optional sticky footer rendered below the content area. */
  footer?: ReactNode
  children: ReactNode
  persistKey?: string | false
  /** External shell state (from createShellState). Created internally when omitted. */
  state?: ShellState
  className?: string | undefined
}

export function AppShell({
  header,
  sideNav,
  aside,
  footer,
  children,
  persistKey = 'cascade.appshell',
  state,
  className,
}: AppShellProps) {
  useSignals()

  // Lazy-init shell state (house pattern)
  const store = useSignal<ShellState | null>(null)
  if (store.peek() === null) {
    store.value = state ?? createShellState({ persistKey })
  }
  const shell = store.peek()!

  useSignalEffect(() => {
    if (!shell.sideNavOpen.value) return
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') shell.sideNavOpen.value = false
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  return (
    <div
      className={cn(styles['shell'], className)}
      data-collapsed={shell.sideNavCollapsed.value || undefined}
      data-drawer={shell.sideNavOpen.value ? 'open' : undefined}
    >
      <div className={styles['header']}>{header}</div>
      {sideNav && (
        <div
          className={styles['nav']}
          data-state={shell.sideNavCollapsed.value ? 'collapsed' : 'expanded'}
        >
          <div className={styles['nav-content']}>{sideNav}</div>
          <button
            type="button"
            className={styles['toggle']}
            aria-label={
              shell.sideNavCollapsed.value
                ? t(builtin.appShell.expand)
                : t(builtin.appShell.collapse)
            }
            onClick={() => shell.toggleSideNav()}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <polyline
                points="10,4 6,8 10,12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}
      {sideNav && (
        <div
          data-testid="cascade-shell-scrim"
          aria-hidden="true"
          className={styles['scrim']}
          onClick={() => {
            shell.sideNavOpen.value = false
          }}
        />
      )}
      <main id="cascade-main" tabIndex={-1} className={styles['main']}>
        {children}
      </main>
      {aside && (
        <div className={styles['aside']} data-state={shell.asideOpen.value ? 'open' : 'closed'}>
          {aside}
        </div>
      )}
      {footer && <div className={styles['footer']}>{footer}</div>}
    </div>
  )
}
