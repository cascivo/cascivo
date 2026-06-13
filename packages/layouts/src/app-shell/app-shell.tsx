'use client'
import { cn, useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
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
  /**
   * push (default): sidebar takes grid space; content shifts when sidebar expands/collapses.
   * overlay: sidebar floats over content; content area never shifts.
   */
  sideNavMode?: 'push' | 'overlay'
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
  sideNavMode = 'push',
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
      data-sidenav-mode={sideNavMode}
    >
      {shell.loadingProgress.value !== null && (
        <div
          className={styles['loading-bar']}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(shell.loadingProgress.value * 100)}
          data-state={shell.loadingError.value !== null ? 'error' : 'active'}
        >
          <div
            className={styles['loading-bar-fill']}
            style={{ ['--_progress' as string]: String(shell.loadingProgress.value) }}
          />
        </div>
      )}
      {shell.loadingError.value !== null && (
        <div role="alert" className={styles['loading-error']}>
          <span>{shell.loadingError.value}</span>
          <button
            type="button"
            className={styles['loading-error-dismiss']}
            aria-label={t(builtin.appShell.dismissError)}
            onClick={() => shell.clearLoadingError()}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path
                d="M3 3l6 6M9 3l-6 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      )}
      <div className={styles['header']}>{header}</div>
      {sideNav && (
        <div
          className={styles['nav']}
          data-state={shell.sideNavCollapsed.value ? 'collapsed' : 'expanded'}
        >
          <div className={styles['nav-content']}>{sideNav}</div>
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
