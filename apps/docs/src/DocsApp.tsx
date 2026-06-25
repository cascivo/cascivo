import type { ComponentType } from 'preact'
import { useSignal, useSignalEffect, useSignals } from '@cascivo/core'
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
  Layers,
  Menu as MenuIcon,
  Server,
  Terminal,
  Zap,
} from '@cascivo/icons'
import { buildNav } from './nav'
import { applyDocsSeo } from './seo'
import { applyTheme, theme, THEMES } from './theme'
import { currentPath } from './router'
import { Home } from './pages/Home'
import { GettingStartedPage } from './pages/GettingStartedPage'
import { AiPage } from './pages/AiPage'
import { ChartsPage } from './pages/ChartsPage'
import { EditorPage } from './pages/EditorPage'
import { FlowPage } from './pages/FlowPage'
import { ComponentPage } from './pages/ComponentPage'
import { PerfDataTable } from './pages/PerfDataTable'
import { PlaygroundPage } from './pages/PlaygroundPage'
import { Benchmarks } from './pages/Benchmarks'
import { LayoutsPage } from './pages/LayoutsPage'
import { DirectoryPage } from './pages/DirectoryPage'
import { ContextExplorerPage } from './pages/ContextExplorerPage'
import { TokensPage } from './pages/TokensPage'
import { IconsPage } from './pages/IconsPage'
import { WhyCascadePage } from './pages/WhyCascadePage'
import { ParityPage } from './pages/ParityPage'
import { MigratingPage } from './pages/MigratingPage'
import { BrandPage } from './pages/BrandPage'

// Singleton shell state — persisted across navigations.
const shell = createShellState({ persistKey: 'cascivo.docs.shell' })

/** Static docs routes, keyed by full path (every docs route lives under /docs). */
const DOCS_ROUTES: Record<string, ComponentType> = {
  '/docs': Home,
  '/docs/getting-started': GettingStartedPage,
  '/docs/ai': AiPage,
  '/docs/charts': ChartsPage,
  '/docs/editor': EditorPage,
  '/docs/flow': FlowPage,
  '/docs/playground': PlaygroundPage,
  '/docs/benchmarks': Benchmarks,
  '/docs/layouts': LayoutsPage,
  '/docs/directory': DirectoryPage,
  '/docs/context': ContextExplorerPage,
  '/docs/tokens': TokensPage,
  '/docs/icons': IconsPage,
  '/docs/why': WhyCascadePage,
  '/docs/parity': ParityPage,
  '/docs/migrating': MigratingPage,
  '/docs/brand': BrandPage,
  '/docs/perf/data-table': PerfDataTable,
}

const exploreItems = [
  { label: 'Getting Started', href: '/docs/getting-started', icon: <Zap size={16} /> },
  { label: 'AI / MCP', href: '/docs/ai', icon: <Server size={16} /> },
  { label: 'Context Explorer', href: '/docs/context', icon: <Eye size={16} /> },
  { label: 'Design Tokens', href: '/docs/tokens', icon: <Layers size={16} /> },
  { label: 'Icons', href: '/docs/icons', icon: <Grid size={16} /> },
  { label: 'Why cascivo', href: '/docs/why', icon: <Check size={16} /> },
  { label: 'Parity', href: '/docs/parity', icon: <Grid size={16} /> },
  { label: 'Migrating from shadcn', href: '/docs/migrating', icon: <Grid size={16} /> },
  { label: 'Brand', href: '/docs/brand', icon: <Eye size={16} /> },
  { label: 'Benchmarks', href: '/docs/benchmarks', icon: <BarChart size={16} /> },
  { label: 'Charts', href: '/docs/charts', icon: <BarChart size={16} /> },
  { label: 'Editor', href: '/docs/editor', icon: <Edit size={16} /> },
  { label: 'Flow', href: '/docs/flow', icon: <Grid size={16} /> },
  { label: 'Directory', href: '/docs/directory', icon: <Grid size={16} /> },
  { label: 'Layouts', href: '/docs/layouts', icon: <Grid size={16} /> },
  { label: 'Playground', href: '/docs/playground', icon: <Terminal size={16} /> },
]

const CATEGORY_ICONS = {
  Inputs: <Edit size={16} />,
  Display: <Eye size={16} />,
  Overlay: <Bell size={16} />,
  Navigation: <MenuIcon size={16} />,
  Feedback: <AlertCircle size={16} />,
}

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

/** Resolve the docs page component for the current path. */
function pageFor(path: string) {
  const Static = DOCS_ROUTES[path]
  if (Static) return <Static />
  if (path.startsWith('/docs/components/')) {
    const name = decodeURIComponent(path.slice('/docs/components/'.length).split('/')[0] ?? '')
    return <ComponentPage name={name} />
  }
  return <ComponentPage />
}

export function DocsApp() {
  useSignals()
  const nav = buildNav()
  const path = currentPath.value
  const themePanelOpen = useSignal(false)

  // Per-navigation side effects: update head + scroll the main pane to top.
  // The unified router (router.ts) already handles link interception and view
  // transitions, so no click handler is needed here.
  useSignalEffect(() => {
    const p = currentPath.value
    applyDocsSeo(p)
    document.getElementById('cascivo-main')?.scrollTo(0, 0)
  })

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

  return (
    <AppShell
      state={shell}
      header={
        <ShellHeader
          brand={{ prefix: 'cascivo', name: 'Docs', href: '/' }}
          onMenuClick={shell.toggleSideNav}
          menuExpanded={shell.sideNavOpen.value || !shell.sideNavCollapsed.value}
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
      <div class="page">{pageFor(path)}</div>
    </AppShell>
  )
}
