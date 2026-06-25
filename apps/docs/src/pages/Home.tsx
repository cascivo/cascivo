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
