/**
 * Build-time data for the static home page (`dist/.vite/web-data.json`).
 *
 * The home is rendered by cascivo-web from templates; anything the SPA *derives*
 * (counts, benchmark figures, shared nav/showcase lists) is computed here, once, the
 * same way `poster/figures.ts` and the section modules compute it, so templates carry
 * no literal that can drift. Runs in Node from vite.config.ts — keep it free of React,
 * CSS and `virtual:` imports.
 *
 * Shape (every optional figure is `null`, never absent, when it cannot be derived):
 *   counts            { components, themes, charts }           registry.json + packages/themes/src
 *   figures           { gzip, partial, axeViolations, shadcnParity }  figures.ts, raw numbers
 *   formatted         the strings the hero/proof/reactivity bands print (`kb`, `toFixed(1)×`)
 *   heroStats         [{ value, label, tone }]                 PosterHero `stats`
 *   themes            selectable first-party theme names       PosterThemes FIRST_PARTY
 *   nav               { primary, resources, footer }           Header + Footer link maps
 *   showcase          first four SHOWCASE items + `host`       PosterShowcase FEATURED
 *   starters          starter-cards.json                       PosterAppBuilder
 *   appBuilder        app-builder.json                         PosterAppBuilder
 */
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { FOOTER_COLUMNS, PRIMARY_LINKS, RESOURCE_LINKS } from './nav-data'
import { SHOWCASE, displayHost } from './pages/showcase/data'

type RegistryComponent = { type?: string }

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8')) as unknown
}

function registryComponents(root: string): RegistryComponent[] {
  return (readJson(resolve(root, 'registry.json')) as { components: RegistryComponent[] })
    .components
}

/** Single source of truth for the headline counts injected into static HTML. */
export function componentCount(root: string): number {
  return registryComponents(root).length
}

/** Chart entries in the registry — the "N chart types" figure on the landing page. */
export function chartCount(root: string): number {
  return registryComponents(root).filter((c) => c.type === 'chart').length
}

// `all.css` (light+dark bundle), `base.css` (typography reset), and `tailwind.css`
// (interop sheet) are not user-facing themes — exclude them so the count tracks
// selectable themes. Keep in sync with NON_THEME_CSS in scripts/readme/generate.ts.
// `light-dark.css` is a BUNDLE (light + dark), not a selectable theme.
const NON_THEME_CSS = new Set(['all.css', 'light-dark.css', 'base.css', 'tailwind.css'])

export function themeCount(root: string): number {
  return readdirSync(resolve(root, 'packages/themes/src')).filter(
    (f) => f.endsWith('.css') && !NON_THEME_CSS.has(f),
  ).length
}

interface BenchResults {
  bundle?: {
    apps: Record<'cascade' | 'shadcn' | 'carbon', { totalGzKb: number }>
  }
  runtime?: Record<string, Record<string, { median?: number } | undefined> | undefined>
  a11y?: { cascade?: { violations: number } }
}

export interface WebData {
  counts: { components: number; themes: number; charts: number }
  figures: {
    gzip: { cascivo: number; shadcn: number; carbon: number } | null
    partial: { cascivoMs: number; shadcnMs: number; speedup: number } | null
    axeViolations: number | null
    shadcnParity: { total: number; covered: number }
  }
  formatted: {
    gzip: { cascivo: string; shadcn: string; carbon: string } | null
    speedup: string | null
  }
  heroStats: { value: string; label: string; tone: string }[]
  themes: string[]
  nav: {
    primary: { label: string; href: string }[]
    resources: { label: string; href: string }[]
    footer: { label: string; links: { label: string; href: string; mono?: true }[] }[]
  }
  /** SHOWCASE.length — the "All N products" link. */
  showcaseTotal: number
  showcase: {
    slug: string
    url: string
    name: string
    category: string
    tagline: string
    host: string
  }[]
  starters: unknown
  appBuilder: unknown
}

/** One decimal, the way every bundle figure on the site is written (figures.ts `kb`). */
const kb = (n: number) => `${n.toFixed(1)} KB`

// Mirrors PosterThemes FIRST_PARTY (the selectable themes minus the poster pair).
const FIRST_PARTY_THEMES = [
  'light',
  'dark',
  'warm',
  'flat',
  'minimal',
  'midnight',
  'pastel',
  'brutalist',
  'corporate',
  'terminal',
  'cyberpunk',
  'arcade',
]

export function webData(root: string): WebData {
  const siteRoot = resolve(root, 'apps/site')
  const bench = readJson(resolve(root, 'apps/bench/results/results.json')) as BenchResults
  const parity = readJson(resolve(siteRoot, 'public/parity.json')) as {
    competitors: { shadcn: { total: number; covered: number } }
  }

  // Same derivations as poster/figures.ts.
  const bundle = bench.bundle
  const gzip = bundle
    ? {
        cascivo: bundle.apps.cascade.totalGzKb,
        shadcn: bundle.apps.shadcn.totalGzKb,
        carbon: bundle.apps.carbon.totalGzKb,
      }
    : null
  const update = bench.runtime?.['update-every-10th']
  const cascadeMs = update?.cascade?.median
  const shadcnMs = update?.shadcn?.median
  const partial =
    cascadeMs && shadcnMs
      ? {
          cascivoMs: Math.round(cascadeMs),
          shadcnMs: Math.round(shadcnMs),
          speedup: shadcnMs / cascadeMs,
        }
      : null
  const axeViolations = bench.a11y?.cascade?.violations ?? null

  // Mirrors PosterHero `stats`.
  const heroStats = [
    ...(gzip
      ? [{ value: kb(gzip.cascivo), label: 'total gzip · benchmark app', tone: 'acid' }]
      : []),
    ...(partial
      ? [
          {
            value: `${partial.speedup.toFixed(1)}×`,
            label: 'faster partial updates',
            tone: 'surface',
          },
        ]
      : []),
    ...(axeViolations !== null
      ? [{ value: String(axeViolations), label: 'axe violations · 4 app states', tone: 'invert' }]
      : []),
  ]

  return {
    counts: {
      components: componentCount(root),
      themes: themeCount(root),
      charts: chartCount(root),
    },
    figures: {
      gzip,
      partial,
      axeViolations,
      shadcnParity: parity.competitors.shadcn,
    },
    formatted: {
      gzip: gzip
        ? { cascivo: kb(gzip.cascivo), shadcn: kb(gzip.shadcn), carbon: kb(gzip.carbon) }
        : null,
      speedup: partial ? `${partial.speedup.toFixed(1)}×` : null,
    },
    heroStats,
    themes: FIRST_PARTY_THEMES,
    nav: { primary: PRIMARY_LINKS, resources: RESOURCE_LINKS, footer: FOOTER_COLUMNS },
    showcaseTotal: SHOWCASE.length,
    showcase: SHOWCASE.slice(0, 4).map((s) => ({ ...s, host: displayHost(s.url) })),
    starters: readJson(resolve(siteRoot, 'src/marketing/starter-cards.json')),
    appBuilder: readJson(resolve(siteRoot, 'src/marketing/app-builder.json')),
  }
}
