import type { ComponentChildren } from 'preact'
import { useEffect } from 'preact/hooks'
import { useSignal, useSignals } from '@cascivo/core'
import { useLocation } from 'preact-iso'
import { AppShell } from '@cascivo/layouts/app-shell'
import { createShellState } from '@cascivo/layouts/shell-state'
import { ShellHeader } from '@cascivo/components/shell-header'
import { SideNav } from '@cascivo/components/side-nav'
import { HeaderPanel } from '@cascivo/components/header-panel'
import {
  AlertCircle,
  BarChart,
  Check,
  Edit,
  Eye,
  Bell,
  Grid,
  Menu as MenuIcon,
  Server,
  Terminal,
} from '@cascivo/icons'
import { buildNav } from './nav'
import { DocsSearch } from './search'
import { applyTheme, theme, THEMES } from './theme'

// Singleton shell state — persisted across navigations.
const shell = createShellState({ persistKey: 'cascivo.docs.shell' })

export function Layout({ children }: { children: ComponentChildren }) {
  useSignals()
  const nav = buildNav()
  const { path, route } = useLocation()
  const themePanelOpen = useSignal(false)

  useEffect(() => {
    document.getElementById('cascivo-main')?.scrollTo(0, 0)
  }, [path])

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return
      const anchor = (e.target as Element).closest('a[href]') as HTMLAnchorElement | null
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || !href.startsWith('/')) return
      if (typeof document.startViewTransition !== 'function') return
      e.preventDefault()
      document.startViewTransition(() => {
        route(href)
      })
    }
    document.addEventListener('click', handle)
    return () => document.removeEventListener('click', handle)
  }, [route])

  const exploreItems = [
    { label: 'AI / MCP', href: '/ai', icon: <Server size={16} /> },
    { label: 'Context Explorer', href: '/context', icon: <Eye size={16} /> },
    { label: 'Why cascivo', href: '/why', icon: <Check size={16} /> },
    { label: 'Brand', href: '/brand', icon: <Eye size={16} /> },
    { label: 'Benchmarks', href: '/benchmarks', icon: <BarChart size={16} /> },
    { label: 'Charts', href: '/charts', icon: <BarChart size={16} /> },
    { label: 'Directory', href: '/directory', icon: <Grid size={16} /> },
    { label: 'Layouts', href: '/layouts', icon: <Grid size={16} /> },
    { label: 'Playground', href: '/playground', icon: <Terminal size={16} /> },
  ]

  const CATEGORY_ICONS = {
    Inputs: <Edit size={16} />,
    Display: <Eye size={16} />,
    Overlay: <Bell size={16} />,
    Navigation: <MenuIcon size={16} />,
    Feedback: <AlertCircle size={16} />,
  }

  const sideNavItems = [
    {
      label: 'Explore',
      icon: <Grid size={16} />,
      items: exploreItems.map((item) => ({
        label: item.label,
        href: item.href,
        active: path === item.href,
      })),
    },
    ...nav.map((group) => ({
      label: group.label,
      icon: CATEGORY_ICONS[group.label as keyof typeof CATEGORY_ICONS],
      items: group.items.map((item) => ({
        label: item.label,
        href: item.href,
        active: path === item.href,
      })),
    })),
  ]

  const themeIcon = (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none">
      <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.9 11.9l1.06 1.06M3.05 12.95l1.06-1.06M11.9 4.1l1.06-1.06"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )

  return (
    <AppShell
      state={shell}
      header={
        <ShellHeader
          brand={{ prefix: 'cascivo', name: 'Docs', href: '/' }}
          onMenuClick={shell.toggleSideNav}
          menuExpanded={shell.sideNavOpen.value || !shell.sideNavCollapsed.value}
          end={<DocsSearch />}
          actions={[
            {
              id: 'theme',
              label: 'Theme',
              icon: themeIcon,
              active: themePanelOpen.value,
              onClick: () => {
                themePanelOpen.value = !themePanelOpen.value
              },
            },
          ]}
        />
      }
      sideNav={
        <SideNav
          items={sideNavItems}
          collapsed={shell.sideNavCollapsed.value}
          onCollapsedChange={(c) => {
            shell.sideNavCollapsed.value = c
          }}
        />
      }
    >
      <HeaderPanel
        open={themePanelOpen.value}
        onClose={() => {
          themePanelOpen.value = false
        }}
        label="Theme"
      >
        <div class="theme-panel">
          {THEMES.map((t) => (
            <button
              key={t}
              type="button"
              class={`theme-btn ${theme.value === t ? 'active' : ''}`}
              onClick={() => applyTheme(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </HeaderPanel>
      <div class="page">{children}</div>
    </AppShell>
  )
}
