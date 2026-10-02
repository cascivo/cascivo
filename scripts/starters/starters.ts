/**
 * Committed starters: `cascivo create` output checked into `starters/<name>/`, so a public
 * GitHub path exists for the "Deploy to Cloudflare" button and for
 * `npm create cloudflare -- --template cascivo/cascivo/starters/<name>`. Both need a
 * self-contained directory with real npm versions, which the workspace-linked
 * `apps/examples/*` cannot be.
 *
 * The starters are GENERATED from the built CLI, never edited by hand:
 * `pnpm starters:generate` rewrites them, and `scripts/checks/starters.test.ts` (part of
 * `scaffold:check`) fails when the scaffolder and the committed copy disagree.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

export const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
export const CLI = join(REPO_ROOT, 'packages/cli/dist/index.mjs')
export const STARTERS_DIR = join(REPO_ROOT, 'starters')

/** How a starter is offered on the landing page (scripts/starters/cards.ts). */
export interface StarterCard {
  title: string
  /** One sentence: what the deployed app does. */
  summary: string
  /**
   * The pending changeset this starter's published versions need, e.g. `use-signal-state.md`.
   * While it is pending, `npm install` of the starter fails, so the card says "after the next
   * release"; the release that consumes it turns the card into a Deploy button.
   */
  waitsFor?: string
}

export interface Starter {
  /** Directory under starters/. */
  name: string
  card: StarterCard
  /** Project name passed to `cascivo create`: the package, Worker and header brand. */
  project: string
  /** Extra `cascivo create` flags. */
  args: string[]
}

// npm, because the Deploy button and C3 install with npm.
export const STARTERS: Starter[] = [
  {
    name: 'cloudflare',
    project: 'cascivo-app',
    card: {
      title: 'App + API',
      summary:
        'A client-rendered app and its typed API as one Worker, with file routes and a live SSE demo.',
    },
    args: ['--framework', 'cloudflare', '--pm', 'npm'],
  },
  {
    name: 'cloudflare-board',
    project: 'cascivo-board',
    card: {
      title: 'Multiplayer board',
      summary: 'Notes and cursors shared live through a Durable Object.',
    },
    args: ['--framework', 'cloudflare', '--example', 'board', '--pm', 'npm'],
  },
  {
    name: 'cloudflare-agent',
    project: 'cascivo-agent',
    card: {
      title: 'AI agent',
      summary: 'An assistant on Workers AI that answers with real cascivo components.',
      waitsFor: 'use-signal-state.md',
    },
    args: ['--framework', 'cloudflare', '--example', 'agent', '--pm', 'npm'],
  },
  {
    name: 'cloudflare-crud',
    project: 'cascivo-crud',
    card: {
      title: 'Data table on D1',
      summary:
        'Customers in D1 behind a DataTable: server-side sort, search and paging, plus editing.',
    },
    args: ['--framework', 'cloudflare', '--example', 'crud', '--pm', 'npm'],
  },
  {
    name: 'shop',
    project: 'cascivo-shop',
    card: {
      title: 'Shop on Stripe',
      summary:
        'Sell a product with Stripe Checkout: orders in D1, a live order page, emailed receipts.',
      waitsFor: 'app-stripe.md',
    },
    args: ['--framework', 'cloudflare', '--example', 'checkout', '--pm', 'npm'],
  },
]

/**
 * Added to every starter on top of what generates it. A starter lives inside this repo's
 * pnpm workspace without being one of its projects, so `pnpm install` in it installed the
 * monorepo instead, and `pnpm dev` then failed to resolve the starter's own dependencies.
 * Its own workspace file makes it the root pnpm finds. The builds are approved because pnpm
 * 11+ refuses an install with unapproved build scripts (pnpm 10 reads the second list).
 * npm, and so the Deploy button and C3, ignore the file.
 */
export const STARTER_PNPM_WORKSPACE = `# Makes this directory its own pnpm workspace, so \`pnpm install\` works here even inside
# the cascivo repository. npm ignores this file.
packages:
  - .
allowBuilds:
  esbuild: true
  workerd: true
  # The Agents SDK pulls this in; its install script only prints a banner.
  core-js-pure: false
onlyBuiltDependencies:
  - esbuild
  - workerd
`

/** Install and build output: never part of a starter, even after running one in place. */
const LOCAL_OUTPUT = new Set([
  'node_modules',
  'dist',
  '.wrangler',
  'pnpm-lock.yaml',
  'package-lock.json',
])

/** Every file under `dir`, keyed by its `/`-separated relative path. */
export function readTree(dir: string): Map<string, string> {
  const out = new Map<string, string>()
  const walk = (current: string) => {
    for (const entry of readdirSync(current)) {
      if (LOCAL_OUTPUT.has(entry)) continue
      const full = join(current, entry)
      if (statSync(full).isDirectory()) walk(full)
      else out.set(relative(dir, full).split('\\').join('/'), readFileSync(full, 'utf8'))
    }
  }
  walk(dir)
  return out
}

/** Scaffolds `starter` with the built CLI into a temp dir and returns its files. */
export function scaffoldStarter(starter: Starter): Map<string, string> {
  const work = mkdtempSync(join(tmpdir(), 'cascivo-starter-'))
  try {
    execFileSync(process.execPath, [CLI, 'create', starter.project, '--yes', ...starter.args], {
      cwd: work,
      stdio: 'pipe',
    })
    const files = readTree(join(work, starter.project))
    files.set('pnpm-workspace.yaml', STARTER_PNPM_WORKSPACE)
    // Local secrets are never committed; .dev.vars.example lists them for the Deploy button.
    files.delete('.dev.vars')
    return files
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
}
