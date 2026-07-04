'use client'
import { signal, useSignals } from '@cascivo/core'
import { defineMessages, t } from '@cascivo/i18n'
import { Moon, Sun } from '@cascivo/icons'
import { AppShell as LayoutsAppShell } from '@cascivo/layouts/app-shell'
import { createShellState } from '@cascivo/layouts/shell-state'
import { CommandMenu, ShellHeader, SideNav } from '@cascivo/react'
import type {
  CommandGroup,
  ShellHeaderBrand,
  ShellHeaderNavItem,
  SideNavGroup,
  SideNavItem,
} from '@cascivo/react'
import { persistedSignal } from '@cascivo/storage'
import type { ReactNode } from 'react'
import styles from './app-shell.module.css'

const msg = defineMessages('kit.appShell', {
  toggleTheme: 'Toggle theme',
  searchPlaceholder: 'Search…',
  searchLabel: 'Command menu',
  mockBanner: 'Mock demo — no real data',
})

export type AppShellTheme = 'dark' | 'light' | 'warm'

const THEMES: AppShellTheme[] = ['dark', 'light', 'warm']
const theme = persistedSignal<AppShellTheme>('kit.appShell.theme', 'dark')
const menuOpen = signal(false)
const shellState = createShellState({ persistKey: 'kit.shell' })

export function setAppTheme(next: AppShellTheme) {
  theme.value = next
}
export function getAppTheme(): AppShellTheme {
  return theme.value
}

export interface AppShellProps {
  navItems?: SideNavItem[]
  navGroups?: SideNavGroup[]
  /** Nav rendered in the header instead of a sidebar. When set (and no side-nav
   * items are given) the sidebar and its hamburger are omitted entirely. */
  headerNav?: ShellHeaderNavItem[] | undefined
  /** Extra class merged onto the ShellHeader (e.g. to make it transparent). */
  headerClassName?: string | undefined
  commandGroups?: CommandGroup[]
  brand?: ShellHeaderBrand
  actions?: ReactNode
  children: ReactNode
  mockBanner?: boolean
}

export function AppShell({
  navItems,
  navGroups,
  headerNav,
  headerClassName,
  commandGroups = [],
  brand,
  actions,
  children,
  mockBanner = false,
}: AppShellProps) {
  useSignals()

  // A sidebar (and its hamburger) exist only when side-nav items are provided.
  const hasSideNav = Boolean(navItems || navGroups)

  function cycleTheme() {
    const next = THEMES[(THEMES.indexOf(theme.value) + 1) % THEMES.length]
    theme.value = next ?? 'dark'
  }

  return (
    <div data-theme={theme.value} style={{ display: 'contents' }}>
      <LayoutsAppShell
        state={shellState}
        persistKey={false}
        className={styles['shell']}
        header={
          <>
            {mockBanner && <div className={styles['mockBanner']}>{t(msg.mockBanner)}</div>}
            <ShellHeader
              brand={brand ?? { name: 'Demo' }}
              {...(headerClassName ? { className: headerClassName } : {})}
              {...(headerNav ? { nav: headerNav } : {})}
              {...(hasSideNav
                ? {
                    onMenuClick: shellState.toggleSideNav,
                    menuExpanded: !shellState.sideNavCollapsed.value,
                  }
                : {})}
              actions={[
                {
                  id: 'theme',
                  label: t(msg.toggleTheme),
                  icon: theme.value === 'dark' ? <Sun size={16} /> : <Moon size={16} />,
                  onClick: cycleTheme,
                },
              ]}
              end={actions}
            />
          </>
        }
        sideNav={
          hasSideNav ? (
            <SideNav
              {...(navGroups ? { groups: navGroups } : {})}
              {...(navItems ? { items: navItems } : {})}
              collapsed={shellState.sideNavCollapsed.value}
              onCollapsedChange={(c) => {
                shellState.sideNavCollapsed.value = c
              }}
            />
          ) : undefined
        }
      >
        {children}
        {commandGroups.length > 0 && (
          <CommandMenu
            open={menuOpen.value}
            onOpenChange={(v) => {
              menuOpen.value = v
            }}
            groups={commandGroups}
            placeholder={t(msg.searchPlaceholder)}
            label={t(msg.searchLabel)}
          />
        )}
      </LayoutsAppShell>
    </div>
  )
}
