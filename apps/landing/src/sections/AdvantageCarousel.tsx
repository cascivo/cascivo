'use client'
import type { ReactNode } from 'react'
import { useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@cascivo/components/tabs'
import { Badge } from '@cascivo/components/badge'
import { Button } from '@cascivo/components/button'
import { CodeSnippet } from '@cascivo/components/code-snippet'
import { Download, Layers, Sun, Terminal, Zap } from '@cascivo/icons'
import bench from 'virtual:bench'

const typing = bench.renders?.['type-20-chars']
const cascadeCommits = typing?.cascade
const shadcnCommits = typing?.shadcn

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
        <span className="adv-bignum">{cascadeCommits ?? 1}</span>
        <span className="adv-bignum-label">
          React commits while typing 20 characters
          {shadcnCommits !== undefined ? ` — typical React UI: ${shadcnCommits}` : ''}
        </span>
      </div>
      <div className="adv-copy">
        <h3>Interactions commit once</h3>
        <p>
          Fine-grained signals write state past React&rsquo;s reconciler. A component re-renders
          only when its own data changes — counted on the benchmark page, not claimed.
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
        {(['light', 'dark', 'warm'] as const).map((t) => (
          <div key={t} className="adv-theme-card" data-theme={t}>
            <div className="adv-theme-card-top">
              <span className="adv-theme-name">{t}</span>
              <Badge variant="success" size="sm">
                live
              </Badge>
            </div>
            <Button size="sm">Get started</Button>
          </div>
        ))}
      </div>
      <div className="adv-copy">
        <h3>Ten themes, one token swap</h3>
        <p>
          Three first-party themes plus seven more, all token-driven. Set <code>data-theme</code> on
          any element and every component restyles — no component changes.
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
  a11y: { role: 'button', wcag: 'AA' },
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
    tagline: 'Ten themes, one token swap',
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

  useSignalEffect(() => {
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
        <h2 className="flow-title">Five reasons it feels different</h2>
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
