import { CATEGORY_LABELS, components } from '../data'
import { buildNav } from '../nav'
import { CodeBlock } from './components/CodeBlock'
import { demos } from '../demos'
import {
  Activity,
  Anchor,
  Bell,
  Calendar,
  Camera,
  Cloud,
  Compass,
  Globe,
  Heart,
  Home as HomeIcon,
  Layers,
  Lock,
  Map,
  Music,
  Search,
  Settings,
  Star,
  User,
  Zap,
} from '@cascivo/icons'

// A small representative strip for the docs home — the full ~440-icon catalog
// lives at /icons. Existing + generated names, varied domains.
const ICON_PREVIEW = [
  HomeIcon,
  Search,
  Settings,
  Heart,
  Star,
  Bell,
  Calendar,
  User,
  Lock,
  Globe,
  Zap,
  Activity,
  Layers,
  Camera,
  Anchor,
  Compass,
  Cloud,
  Music,
  Map,
]

// Overlay components render portals/fixed elements — skip live preview for them
const SKIP_PREVIEW: Set<string> = new Set([
  'alert-dialog',
  'command-menu',
  'context-menu',
  'dock',
  'drawer',
  'dropdown',
  'header',
  'hover-card',
  'menu',
  'menubar',
  'modal',
  'navigation-menu',
  'overflow-menu',
  'popover',
  'sheet',
  'skip-nav',
  'toast',
  'toggletip',
  'tooltip',
  'visually-hidden',
])

// The package surfaces that ship alongside the components — each has its own
// docs page in the sidebar; surfaced here so the home page reflects the whole
// system, not just components + icons.
const SURFACES = [
  {
    name: '@cascivo/charts',
    blurb: '25+ chart types — area, bar, line, candlestick, heatmap, and more. Zero runtime deps.',
    href: '/docs/charts',
  },
  {
    name: '@cascivo/flow',
    blurb: 'Node/edge diagrams from plain data — pan, zoom, draggable nodes, animated edges.',
    href: '/docs/flow',
  },
  {
    name: '@cascivo/editor',
    blurb:
      'A lightweight code editor — syntax highlighting, find/replace, slash commands, theming.',
    href: '/docs/editor',
  },
  {
    name: '@cascivo/layouts',
    blurb:
      'AppShell, off-canvas nav, responsive grid, and layout primitives like Stack and Columns.',
    href: '/docs/layouts',
  },
  {
    name: 'AI / MCP',
    blurb:
      'Machine-readable manifests, an MCP server, and llms.txt — so agents build with real components.',
    href: '/docs/ai',
  },
]

const QUICK_START = `npx cascivo init
npx cascivo add button`

const USAGE = `import { Button } from './components/ui/button/button'

export function App() {
  return <Button>Get started</Button>
}`

export function Home() {
  const nav = buildNav()

  return (
    <article class="doc-page">
      <header class="doc-head">
        <div class="doc-eyebrow">cascivo</div>
        <h1 class="cascivo-cyber-flicker">The CSS-native, signal-driven, AI-first design system</h1>
        <p class="doc-lede">
          {components.length} owned components. Copy-paste via CLI, styled with modern CSS, driven
          by Preact Signals, documented for agents.
        </p>
      </header>

      <section class="doc-section">
        <h2>Quick start</h2>
        <CodeBlock code={QUICK_START} lang="bash" />
        <CodeBlock code={USAGE} />
      </section>

      <section class="doc-section">
        <h2>Templates</h2>
        <p class="doc-lede" style={{ marginBlockEnd: 'var(--cascivo-space-4)' }}>
          Start from a whole page, not a blank file. <strong>Templates</strong> bundle a working
          page with the components it composes and its fixtures — install one with{' '}
          <code>cascivo add @ns/&lt;template&gt;</code> and own the source. Community-contributed,
          hosted on GitHub, no backend.
        </p>
        <a
          href="/docs/marketplace"
          class="home-card-label"
          style={{ color: 'var(--cascivo-color-accent)' }}
        >
          Browse the templates marketplace →
        </a>
      </section>

      <section class="doc-section">
        <h2>Icons</h2>
        <p class="doc-lede" style={{ marginBlockEnd: 'var(--cascivo-space-4)' }}>
          ~440 stroked 24×24 <code>currentColor</code> SVG icons in <code>@cascivo/icons</code> —
          one import, individually tree-shakeable.
        </p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--cascivo-space-4)',
            alignItems: 'center',
            color: 'var(--cascivo-color-text-subtle)',
            marginBlockEnd: 'var(--cascivo-space-4)',
          }}
        >
          {ICON_PREVIEW.map((Icon, i) => (
            <Icon key={i} size={24} aria-hidden="true" />
          ))}
        </div>
        <a
          href="/docs/icons"
          class="home-card-label"
          style={{ color: 'var(--cascivo-color-accent)' }}
        >
          Browse all ~440 icons →
        </a>
      </section>

      <section class="doc-section">
        <h2>Beyond components</h2>
        <p class="doc-lede" style={{ marginBlockEnd: 'var(--cascivo-space-4)' }}>
          cascivo ships more than components. Each package is optional, versioned, and built on the
          same token architecture.
        </p>
        <div style={{ display: 'grid', gap: 'var(--cascivo-space-3)' }}>
          {SURFACES.map((s) => (
            <a
              key={s.name}
              href={s.href}
              class="home-card-label"
              style={{ color: 'var(--cascivo-color-accent)' }}
            >
              <strong style={{ fontFamily: 'var(--cascivo-font-mono)' }}>{s.name}</strong>
              <span style={{ color: 'var(--cascivo-color-text-subtle)' }}> — {s.blurb} →</span>
            </a>
          ))}
        </div>
      </section>

      <section class="doc-section">
        <h2>Components</h2>
        {nav.map((group) => (
          <div class="home-group" key={group.category}>
            <h3>{CATEGORY_LABELS[group.category]}</h3>
            <div class="home-grid">
              {group.items.map((item) => (
                <a class="home-card" href={item.href} key={item.name}>
                  <div class="home-card-preview">
                    {!SKIP_PREVIEW.has(item.name) && demos[item.name]?.()}
                  </div>
                  <span class="home-card-label">{item.label}</span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </section>
    </article>
  )
}
