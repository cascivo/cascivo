import type { ComponentType } from 'preact'
import { useSignalEffect, useSignals } from '@cascivo/core'
import { AppShell } from '@cascivo/layouts/app-shell'
import { createShellState } from '@cascivo/layouts/shell-state'
import { SideNav } from '@cascivo/components/side-nav'
import {
  AlertCircle,
  Edit,
  Eye,
  Bell,
  Grid,
  Layers,
  Menu as MenuIcon,
  Server,
  Terminal,
  Zap,
  BarChart,
  Check,
} from '@cascivo/icons'
import { buildNav } from './nav'
import { applyDocsSeo } from './seo'
import { currentPath } from './router'
import { Header } from './marketing/sections/Header'
import { Home } from './pages/Home'
import { GettingStartedPage } from './pages/GettingStartedPage'
import { InstallationPage } from './pages/InstallationPage'
import { DocsNotFound } from './pages/DocsNotFound'
import { AiPage } from './pages/AiPage'
import { ChartsPage } from './pages/ChartsPage'
import { EditorPage } from './pages/EditorPage'
import { FlowPage } from './pages/FlowPage'
import { ComponentPage } from './pages/ComponentPage'
import { CategoryPage } from './pages/CategoryPage'
import { ThemePage } from './pages/ThemePage'
import { ApiReferencePage } from './pages/ApiReferencePage'
import { KeyboardReferencePage } from './pages/KeyboardReferencePage'
import { PlatformPage } from './pages/PlatformPage'
import { FaqPage } from './pages/FaqPage'
import { ChangelogPage } from './pages/ChangelogPage'
import { UpgradingPage } from './pages/UpgradingPage'
import { PerfDataTable } from './pages/PerfDataTable'
import { PlaygroundPage } from './pages/PlaygroundPage'
import { Benchmarks } from './pages/Benchmarks'
import { LayoutsPage } from './pages/LayoutsPage'
import { DirectoryPage } from './pages/DirectoryPage'
import { MarketplacePage } from './pages/MarketplacePage'
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
  '/docs/installation': InstallationPage,
  '/docs/getting-started': GettingStartedPage,
  '/docs/api': ApiReferencePage,
  '/docs/keyboard': KeyboardReferencePage,
  '/docs/platform': PlatformPage,
  '/docs/faq': FaqPage,
  '/docs/changelog': ChangelogPage,
  '/docs/upgrading': UpgradingPage,
  '/docs/ai': AiPage,
  '/docs/charts': ChartsPage,
  '/docs/editor': EditorPage,
  '/docs/flow': FlowPage,
  '/docs/playground': PlaygroundPage,
  '/docs/benchmarks': Benchmarks,
  '/docs/layouts': LayoutsPage,
  '/docs/directory': DirectoryPage,
  '/docs/marketplace': MarketplacePage,
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
  { label: 'Installation', href: '/docs/installation', icon: <Zap size={16} /> },
  { label: 'Getting Started', href: '/docs/getting-started', icon: <Zap size={16} /> },
  { label: 'FAQ', href: '/docs/faq', icon: <Check size={16} /> },
  { label: 'API reference', href: '/docs/api', icon: <Grid size={16} /> },
  { label: 'Keyboard reference', href: '/docs/keyboard', icon: <Grid size={16} /> },
  { label: 'AI / MCP', href: '/docs/ai', icon: <Server size={16} /> },
  { label: 'Context Explorer', href: '/docs/context', icon: <Eye size={16} /> },
  { label: 'Design Tokens', href: '/docs/tokens', icon: <Layers size={16} /> },
  { label: 'Icons', href: '/docs/icons', icon: <Grid size={16} /> },
  { label: 'Why cascivo', href: '/docs/why', icon: <Check size={16} /> },
  { label: 'Built on the platform', href: '/docs/platform', icon: <Check size={16} /> },
  { label: 'Parity', href: '/docs/parity', icon: <Grid size={16} /> },
  { label: 'Migrating from shadcn', href: '/docs/migrating', icon: <Grid size={16} /> },
  { label: 'Changelog', href: '/docs/changelog', icon: <Grid size={16} /> },
  { label: 'Upgrading', href: '/docs/upgrading', icon: <Check size={16} /> },
  { label: 'Brand', href: '/docs/brand', icon: <Eye size={16} /> },
  { label: 'Benchmarks', href: '/docs/benchmarks', icon: <BarChart size={16} /> },
  { label: 'Charts', href: '/docs/charts', icon: <BarChart size={16} /> },
  { label: 'Editor', href: '/docs/editor', icon: <Edit size={16} /> },
  { label: 'Flow', href: '/docs/flow', icon: <Grid size={16} /> },
  { label: 'Directory', href: '/docs/directory', icon: <Grid size={16} /> },
  { label: 'Marketplace', href: '/docs/marketplace', icon: <Grid size={16} /> },
  { label: 'Layouts', href: '/docs/layouts', icon: <Grid size={16} /> },
  { label: 'Playground', href: '/docs/playground', icon: <Terminal size={16} /> },
]

const CATEGORY_ICONS = {
  Inputs: <Edit size={16} />,
  Display: <Eye size={16} />,
  Overlay: <Bell size={16} />,
  Navigation: <MenuIcon size={16} />,
  Feedback: <AlertCircle size={16} />,
  Layout: <Layers size={16} />,
  Chart: <BarChart size={16} />,
}

/** Resolve the docs page component for the current path. */
function pageFor(path: string) {
  const Static = DOCS_ROUTES[path]
  if (Static) return <Static />
  if (path.startsWith('/docs/components/')) {
    // Registry names can contain a category prefix (e.g. `chart/area-chart`,
    // `layout/flex`, `block/login-page`), so the full remainder after the
    // prefix IS the name — do not split on `/` or slashed entries 404.
    const name = decodeURIComponent(path.slice('/docs/components/'.length).replace(/\/+$/, ''))
    return <ComponentPage name={name} />
  }
  if (path.startsWith('/docs/categories/')) {
    const category = decodeURIComponent(path.slice('/docs/categories/'.length).replace(/\/+$/, ''))
    return <CategoryPage category={category} />
  }
  if (path.startsWith('/docs/themes/')) {
    const theme = decodeURIComponent(path.slice('/docs/themes/'.length).replace(/\/+$/, ''))
    return <ThemePage theme={theme} />
  }
  return <DocsNotFound />
}

export function DocsApp() {
  useSignals()
  const nav = buildNav()
  const path = currentPath.value

  // Per-navigation side effects: update head + scroll the main pane to top.
  // The unified router (router.ts) handles link interception + view transitions.
  useSignalEffect(() => {
    const p = currentPath.value
    applyDocsSeo(p)
    document.getElementById('cascade-main')?.scrollTo(0, 0)
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
      // The single, app-wide navbar — identical to every marketing page.
      header={<Header />}
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
      {/* Mobile-only affordance to open the component rail (the navbar's own
          hamburger drives the primary nav drawer, so the sidenav needs its own). */}
      <button
        type="button"
        class="docs-nav-toggle"
        onClick={() => {
          shell.sideNavOpen.value = true
        }}
      >
        <MenuIcon size={16} /> Browse components
      </button>
      <div class="page">{pageFor(path)}</div>
    </AppShell>
  )
}
