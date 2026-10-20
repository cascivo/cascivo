// @vitest-environment jsdom
import { render, type ComponentChildren } from 'preact'
import { afterEach, describe, expect, it, vi } from 'vitest'

// The page chrome pulls in search, theming and the whole nav; none of it is under test here.
// Components built on @cascivo/core's signals load the real React from node_modules under vitest,
// not the Preact alias the site build applies, so the skip-nav pair is stubbed too.
vi.mock('@cascivo/components/skip-nav', () => ({
  SkipNavLink: () => <a href="#main-content">Skip</a>,
  SkipNavTarget: ({ children }: { children: ComponentChildren }) => <div>{children}</div>,
}))
vi.mock('../sections/Header', () => ({ Header: () => <header data-testid="header" /> }))
vi.mock('../sections/Footer', () => ({ Footer: () => <footer data-testid="footer" /> }))

import { EvalsView } from './EvalsPage'

const TASKS = [
  'admin-console',
  'saas-settings',
  'marketing-site',
  'crud-table',
  'auth-flow',
  'form-validation',
  'delete-confirm',
  'filter-empty-state',
]
const ARMS = ['cascivo', 'cascivo-bare', 'shadcn']
// Sonnet carried over from an older run, on an older cascivo than the newest (Haiku's) run.
const MODELS = [
  { model: 'claude-sonnet-5-5', date: '2026-11-02', cascivoVersion: '1.2.2', attempts: 3 },
  { model: 'claude-haiku-5-5', date: '2026-11-03', cascivoVersion: '1.2.3', attempts: 1 },
]

/** Raw, as JSON.parse would hand it over: the page must not need a typed document. */
function fixture() {
  const rows = MODELS.flatMap(({ model, attempts }) =>
    ARMS.flatMap((arm, a) =>
      TASKS.map((task, t) => ({
        task,
        arm,
        model,
        attempts,
        // cascivo passes everything, cascivo-bare every other task, shadcn none.
        passAt1: a === 0 ? 1 : a === 1 ? (t % 2 === 0 ? 1 : 0) : 0,
        passAt3: attempts < 3 ? null : a !== 2,
        axeSerious: a,
        medianCostUsd: attempts === 0 ? null : 0.25,
      })),
    ),
  )
  return {
    schemaVersion: 1,
    latest: { date: '2026-11-03', cascivoVersion: '1.2.3', models: MODELS, rows, costUsd: 41.5 },
    history: [
      {
        date: '2026-11-03',
        cascivoVersion: '1.2.3',
        passAt1: {
          'claude-sonnet-5-5': { cascivo: 1, 'cascivo-bare': 0.5, shadcn: 0 },
          'claude-haiku-5-5': { cascivo: 1, 'cascivo-bare': 0.5, shadcn: 0 },
        },
      },
    ],
  }
}

let host: HTMLElement | undefined
function mount(data: unknown): HTMLElement {
  host = document.createElement('div')
  document.body.append(host)
  render(<EvalsView data={data} />, host)
  return host
}

afterEach(() => {
  if (host) render(null, host)
  host?.remove()
  host = undefined
})

describe('EvalsPage', () => {
  it('shows one headline value per arm and model, and a table with 8 task rows', () => {
    const page = mount(fixture())
    expect(page.querySelectorAll('[data-headline]')).toHaveLength(ARMS.length * MODELS.length)

    const sonnet = page.querySelector('[data-headline="claude-sonnet-5-5:cascivo-bare"]')
    expect(sonnet?.textContent).toContain('50%')

    const tables = page.querySelectorAll('table[data-eval-table]')
    expect(tables).toHaveLength(MODELS.length)
    expect(tables[0]?.querySelectorAll('tbody tr')).toHaveLength(8)
    const first = tables[0]?.querySelector('tbody tr th a')
    expect(first?.getAttribute('href')).toBe(
      'https://github.com/cascivo/cascivo/tree/main/apps/bench/agent/tasks/admin-console',
    )
  })

  it('shows a dash for pass@3 when a model had fewer than 3 attempts, and says why', () => {
    const page = mount(fixture())
    const haiku = page.querySelector('table[data-eval-table="claude-haiku-5-5"]')
    const sonnet = page.querySelector('table[data-eval-table="claude-sonnet-5-5"]')
    expect(haiku?.querySelector('[data-cell="cascivo:pass3"]')?.textContent).toBe('—')
    expect(sonnet?.querySelector('[data-cell="cascivo:pass3"]')?.textContent).toBe('yes')
    expect(page.textContent).toContain('1 attempt per task')
  })

  // A model carried over from an older run keeps that run's version, not the newest run's.
  it("shows each model's own run date and cascivo version", () => {
    const page = mount(fixture())
    expect(page.querySelector('[data-model-run="claude-sonnet-5-5"]')?.textContent).toContain(
      'run 2026-11-02, cascivo 1.2.2,',
    )
    expect(page.querySelector('[data-model-run="claude-haiku-5-5"]')?.textContent).toContain(
      'run 2026-11-03, cascivo 1.2.3,',
    )
  })

  it('shows two runs of the same day and version as two history rows', () => {
    const data = fixture()
    const second = { ...data.history[0]!, passAt1: { 'claude-sonnet-5-5': { cascivo: 0.25 } } }
    const page = mount({ ...data, history: [...data.history, second] })
    const rows = page.querySelectorAll('table[data-eval-history] tbody tr')
    expect(rows).toHaveLength(2)
    expect(rows[1]?.textContent).toContain('25%')
  })

  it('says the cascivo arm gets AGENTS.md preloaded and the bare arm does not', () => {
    const text = mount(fixture()).textContent ?? ''
    expect(text).toContain('AGENTS.md preloaded into the system prompt')
    expect(text).toContain('nothing is preloaded')
  })

  it('shows the empty state and the reproduction command when nothing is published', () => {
    const page = mount({ schemaVersion: 1, latest: null, history: [] })
    expect(page.textContent).toContain('No published run yet.')
    expect(page.textContent).toContain('pnpm --filter bench-agent eval generate')
    expect(page.querySelectorAll('[data-headline]')).toHaveLength(0)
    expect(page.querySelectorAll('table[data-eval-table]')).toHaveLength(0)
  })

  it('renders the empty state, not a crash, for a malformed document', () => {
    const bad = fixture()
    const page = mount({ ...bad, latest: { ...bad.latest, rows: 'not an array' } })
    expect(page.textContent).toContain('No published run yet.')
    expect(page.querySelectorAll('[data-headline]')).toHaveLength(0)
  })
})
