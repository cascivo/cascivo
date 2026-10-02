'use client'
import { signal, useSignals } from '@cascivo/core'
import { defineMessages, t } from '@cascivo/i18n'
import { Moon, Sun } from '@cascivo/icons'
import { AppFrame as LayoutsAppShell } from '@cascivo/layouts/app-shell'
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

export type AppShellTheme =
  | 'dark'
  | 'light'
  | 'warm'
  | 'flat'
  | 'minimal'
  | 'midnight'
  | 'pastel'
  | 'brutalist'
  | 'corporate'
  | 'terminal'
  | 'cyberpunk'
  | 'arcade'
  | 'poster'
  | 'poster-dark'

/** The themes the header toggle cycles through. */
const THEMES: AppShellTheme[] = ['dark', 'light', 'warm']
// Every theme the landing can wear, so an embed follows the page around it: the twelve
// first-party themes plus cascivo.com's own poster pair. Reachable only by URL or message,
// and an app must load their CSS to accept them (pulse does).
const EMBED_THEMES: AppShellTheme[] = [
  ...THEMES,
  'flat',
  'minimal',
  'midnight',
  'pastel',
  'brutalist',
  'corporate',
  'terminal',
  'cyberpunk',
  'arcade',
  'poster',
  'poster-dark',
]
const DARK_THEMES = new Set<AppShellTheme>([
  'dark',
  'midnight',
  'terminal',
  'cyberpunk',
  'poster-dark',
])
const POSTER_PAIR: Partial<Record<AppShellTheme, AppShellTheme>> = {
  poster: 'poster-dark',
  'poster-dark': 'poster',
}

function asEmbedTheme(raw: unknown): AppShellTheme | null {
  return EMBED_THEMES.find((name) => name === raw) ?? null
}

/** A `?theme=` override, or null when absent or not one of {@link EMBED_THEMES}. */
export function themeFromSearch(search: string): AppShellTheme | null {
  return asEmbedTheme(new URLSearchParams(search).get('theme'))
}

/** The theme in a `{ type: 'cascivo:theme', theme }` message, or null for anything else. */
export function themeFromMessage(data: unknown): AppShellTheme | null {
  if (typeof data !== 'object' || data === null) return null
  const { type, theme: raw } = data as { type?: unknown; theme?: unknown }
  return type === 'cascivo:theme' ? asEmbedTheme(raw) : null
}

// The landing embeds this app twice on one origin, once per theme. A persisted signal would
// have both frames read and write the same localStorage key, so an override stays in memory.
const urlTheme = typeof location === 'undefined' ? null : themeFromSearch(location.search)
const theme = urlTheme
  ? signal<AppShellTheme>(urlTheme)
  : persistedSignal<AppShellTheme>('kit.appShell.theme', 'dark')

// An embed follows its host page's theme switches without a reload, which would drop the
// running simulation. Only a same-origin parent may drive it.
if (urlTheme && typeof window !== 'undefined') {
  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) return
    const next = themeFromMessage(event.data)
    if (next) theme.value = next
  })
}

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
  /** Content rendered at the bottom of the sidebar, above the collapse toggle. */
  navFooter?: ReactNode | undefined
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
  navFooter,
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
    const next =
      POSTER_PAIR[theme.value] ?? THEMES[(THEMES.indexOf(theme.value) + 1) % THEMES.length]
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
                  icon: DARK_THEMES.has(theme.value) ? <Sun size={16} /> : <Moon size={16} />,
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
              {...(navFooter ? { footer: navFooter } : {})}
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
