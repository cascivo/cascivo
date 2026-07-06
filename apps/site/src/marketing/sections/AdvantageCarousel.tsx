'use client'
import type { ReactNode } from 'react'
import { useMediaQuery, useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@cascivo/components/tabs'
import { CodeSnippet } from '@cascivo/components/code-snippet'
import { Download, Layers, Sun, Terminal, Zap } from '@cascivo/icons'
import { THEMES } from '../../theme'
import bench from 'virtual:bench'

// Fine-grained update benchmark: update every 10th row of a 1,000-row table.
// Signals patch only the rows that changed; a React list re-renders to diff.
// Median wall-clock ms from the committed cross-library bench — a real number,
// not a commit count (the render-commit instrumentation is not wired up yet, so
// we surface latency instead of a placeholder). Guarded by bench-stats.test.ts.
const partialUpdate = bench.runtime?.['update-every-10th']
const cascadeUpdateMs = partialUpdate?.cascade?.median
const shadcnUpdateMs = partialUpdate?.shadcn?.median
const updateSpeedup =
  cascadeUpdateMs && shadcnUpdateMs ? shadcnUpdateMs / cascadeUpdateMs : undefined

interface Advantage {
  id: string
  icon: ReactNode
  title: string
  tagline: string
  panel: ReactNode
}

function CssPanel() {
  return (
    <>
      <CodeSnippet
        className="adv-code"
        variant="multi"
        language="css"
        showCopyButton={false}
        code={`@layer base, components, utilities;

.card {
  container-type: inline-size;
}

.card:has(img) {
  grid-template-columns: 8rem 1fr;
}`}
      />
      <div className="adv-copy">
        <h3>Modern CSS, zero runtime</h3>
        <p>
          <code>@layer</code> keeps the cascade predictable. <code>@container</code> lets a
          component respond to its own slot. <code>:has()</code> does conditional styling — no
          JavaScript, no utility soup.
        </p>
        <a className="adv-link" href="/modern-css">
          Explore modern CSS &rarr;
        </a>
      </div>
    </>
  )
}

function SignalsPanel() {
  return (
    <>
      <div className="adv-figure" aria-hidden="true">
        {updateSpeedup && cascadeUpdateMs && shadcnUpdateMs ? (
          <>
            <span className="adv-bignum">{updateSpeedup.toFixed(1)}&times;</span>
            <span className="adv-bignum-label">
              faster partial updates than shadcn — {Math.round(cascadeUpdateMs)} ms vs{' '}
              {Math.round(shadcnUpdateMs)} ms updating every 10th row of 1,000
            </span>
          </>
        ) : (
          <span className="adv-bignum-label">
            Fine-grained updates that skip React&rsquo;s reconciler
          </span>
        )}
      </div>
      <div className="adv-copy">
        <h3>Interactions commit once</h3>
        <p>
          Fine-grained signals write state past React&rsquo;s reconciler. A component re-renders
          only when its own data changes — measured on the benchmark page, not claimed.
        </p>
        <a className="adv-link" href="/performance">
          See the benchmarks &rarr;
        </a>
      </div>
    </>
  )
}

function ThemesPanel() {
  return (
    <>
      <div className="adv-themes" aria-hidden="true">
        {THEMES.map((t) => (
          <div key={t} className="adv-theme-card" data-theme={t}>
            <span className="adv-theme-name">{t}</span>
            <span className="adv-theme-chips">
              <span className="adv-theme-chip adv-theme-chip--accent" />
              <span className="adv-theme-chip adv-theme-chip--fg" />
              <span className="adv-theme-chip adv-theme-chip--border" />
            </span>
          </div>
        ))}
      </div>
      <div className="adv-copy">
        <h3>{__CASCIVO_THEME_COUNT__} themes, one token swap</h3>
        <p>
          Three first-party themes plus {__CASCIVO_THEME_COUNT__ - 3} more, all token-driven. Set{' '}
          <code>data-theme</code> on any element and every component restyles — no component
          changes.
        </p>
        <a className="adv-link" href="/create">
          Create a theme &rarr;
        </a>
      </div>
    </>
  )
}

function OwnedPanel() {
  return (
    <>
      <CodeSnippet
        className="adv-code"
        variant="multi"
        language="bash"
        terminal
        title="bash"
        code={`$ npx cascivo add button

  ✓ components/ui/button/button.tsx
  ✓ components/ui/button/button.module.css

  it's yours now — edit it, fork it, keep it`}
      />
      <div className="adv-copy">
        <h3>Copy it in, it&rsquo;s yours</h3>
        <p>
          The CLI copies the component source straight into your repo — no version lock, no
          black-box dependency. Or start from the prebuilt <code>@cascivo/react</code> package and
          migrate later.
        </p>
        <a className="adv-link" href="/guides">
          Adoption guides &rarr;
        </a>
      </div>
    </>
  )
}

function AiPanel() {
  return (
    <>
      <CodeSnippet
        className="adv-code"
        variant="multi"
        language="ts"
        showCopyButton={false}
        code={`export const meta = {
  name: 'Button',
  variants: ['primary', 'secondary', 'ghost'],
  props: [{ name: 'size', type: 'sm | md | lg' }],
  accessibility: { role: 'button', wcag: 'AA' },
}`}
      />
      <div className="adv-copy">
        <h3>Manifests your agent reads</h3>
        <p>
          Every component ships a machine-readable manifest. An MCP server, Claude Code skills, and{' '}
          <code>llms.txt</code> all derive from it — so your agent builds with real components, not
          guesses.
        </p>
        <a className="adv-link" href="/ai">
          The AI layer &rarr;
        </a>
      </div>
    </>
  )
}

const ADVANTAGES: Advantage[] = [
  {
    id: 'css',
    icon: <Layers />,
    title: 'Platform CSS',
    tagline: 'Modern CSS, zero runtime',
    panel: <CssPanel />,
  },
  {
    id: 'signals',
    icon: <Zap />,
    title: 'Signal-driven',
    tagline: 'Interactions commit once',
    panel: <SignalsPanel />,
  },
  {
    id: 'themes',
    icon: <Sun />,
    title: 'Beautiful by default',
    tagline: `${__CASCIVO_THEME_COUNT__} themes, one token swap`,
    panel: <ThemesPanel />,
  },
  {
    id: 'owned',
    icon: <Download />,
    title: 'Owned code',
    tagline: "Copy it in, it's yours",
    panel: <OwnedPanel />,
  },
  {
    id: 'ai',
    icon: <Terminal />,
    title: 'AI-first',
    tagline: 'Manifests your agent reads',
    panel: <AiPanel />,
  },
]

const FIRST_ID = ADVANTAGES[0]?.id ?? 'css'
const ROTATE_MS = 6500

export function AdvantageCarousel() {
  useSignals()
  const active = useSignal(FIRST_ID)
  // Pause the auto-rotation while a visitor is reading (hover) or interacting
  // (focus within) — they shouldn't be yanked to the next panel mid-thought.
  const paused = useSignal(false)
  // Respect the visitor's motion preference: under `prefers-reduced-motion:
  // reduce` the carousel never auto-advances — it becomes a static, manually
  // controlled tabset (the tabs still switch on click/keyboard).
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  // Below 64rem the panels stack into a single column (see `.adv-panel` in
  // landing.css) where their heights differ enough that auto-advancing visibly
  // shoves the rest of the page up and down every rotation — a jarring UX on
  // phones. Only auto-rotate on the desktop 2-column layout, where the panel
  // height is stable; on narrower screens it stays a manual tabset.
  const stacked = useMediaQuery('(max-width: 63.99rem)')

  useSignalEffect(() => {
    if (reduceMotion.value || stacked.value) return
    const id = setInterval(() => {
      if (paused.value) return
      const idx = ADVANTAGES.findIndex((a) => a.id === active.value)
      const next = ADVANTAGES[(idx + 1) % ADVANTAGES.length]
      if (next) active.value = next.id
    }, ROTATE_MS)
    return () => clearInterval(id)
  })

  return (
    <section
      className="advantages"
      id="advantages"
      aria-label="Why cascivo"
      data-reveal=""
      onMouseEnter={() => {
        paused.value = true
      }}
      onMouseLeave={() => {
        paused.value = false
      }}
      onFocus={() => {
        paused.value = true
      }}
      onBlur={() => {
        paused.value = false
      }}
    >
      <div className="flow-header">
        <p className="flow-eyebrow">Why cascivo</p>
        <h2 className="flow-title">{ADVANTAGES.length} reasons it feels different</h2>
      </div>
      <Tabs
        value={active.value}
        onValueChange={(v) => {
          active.value = v
        }}
        className="adv-tabs"
      >
        <TabsList className="adv-cards" aria-label="Advantages">
          {ADVANTAGES.map((a) => (
            <TabsTrigger key={a.id} value={a.id} className="adv-card">
              <span className="adv-card-icon" aria-hidden="true">
                {a.icon}
              </span>
              <span className="adv-card-text">
                <span className="adv-card-title">{a.title}</span>
                <span className="adv-card-tagline">{a.tagline}</span>
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
        {ADVANTAGES.map((a) => (
          <TabsContent key={a.id} value={a.id} className="adv-panel">
            {a.panel}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  )
}
