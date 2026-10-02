/**
 * The landing page's app builder (apps/site/src/marketing/poster/PosterAppBuilder.tsx) shows
 * what `cascivo create --framework cloudflare` writes for any mix of examples. Its data is
 * GENERATED from the built CLI, one scaffold per example, so the page cannot promise a file,
 * page or binding the scaffolder does not produce:
 *
 *   pnpm app-builder:generate   rewrites apps/site/src/marketing/app-builder.json
 *   scripts/checks/app-builder.test.ts (in `scaffold:check`) fails when it is stale
 *
 * Only the words are written by hand (labels, blurbs, groups, service names), and the check
 * fails when the CLI gains an example or a binding this file has no words for.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { CLI, REPO_ROOT, readTree } from '../starters/starters.ts'

export const DATA_FILE = join(REPO_ROOT, 'apps/site/src/marketing/app-builder.json')

/** Every `--example` the CLI accepts, read from its source. */
export function cliExamples(): string[] {
  const source = readFileSync(join(REPO_ROOT, 'packages/cli/src/commands/create.ts'), 'utf8')
  const list = /export const EXAMPLES = \[([\s\S]*?)\] as const/.exec(source)?.[1]
  if (!list) throw new Error('EXAMPLES not found in packages/cli/src/commands/create.ts')
  return [...list.matchAll(/'([a-z]+)'/g)].map((m) => m[1]!)
}

type Group = 'Realtime' | 'AI' | 'Data' | 'Operations'

/** The words for each example. The check fails if the CLI has one this map lacks. */
export const EXAMPLE_WORDS: Record<string, { label: string; blurb: string; group: Group }> = {
  board: {
    label: 'Multiplayer board',
    blurb: 'Notes and live cursors, shared by everyone in the room.',
    group: 'Realtime',
  },
  notes: {
    label: 'Local-first notes',
    blurb: 'Edits survive a dropped connection and sync when it returns.',
    group: 'Realtime',
  },
  live: {
    label: 'Live dashboard',
    blurb: 'Events through a queue, charts that move every second.',
    group: 'Realtime',
  },
  agent: {
    label: 'Generative-UI assistant',
    blurb: 'A chat that answers with validated interface, not just text.',
    group: 'AI',
  },
  voice: {
    label: 'Voice assistant',
    blurb: 'Talk to it; it listens, thinks and answers aloud.',
    group: 'AI',
  },
  search: {
    label: 'Semantic search',
    blurb: 'Finds what a question means, not just the words in it.',
    group: 'AI',
  },
  crud: {
    label: 'Data table',
    blurb: 'A database table with server-side sort, search and paging.',
    group: 'Data',
  },
  import: {
    label: 'CSV import job',
    blurb: 'A durable background job with live progress.',
    group: 'Data',
  },
  files: {
    label: 'File uploads',
    blurb: 'Uploads with progress and resized image previews.',
    group: 'Data',
  },
  publish: {
    label: 'Publish pages',
    blurb: 'Turn a generated view into a live, shareable page.',
    group: 'Data',
  },
  export: {
    label: 'PDF export',
    blurb: 'Any page, downloaded as a PDF or PNG.',
    group: 'Operations',
  },
  digest: {
    label: 'Weekly report email',
    blurb: 'The report as a PDF, emailed every Monday.',
    group: 'Operations',
  },
  usage: {
    label: 'Usage analytics',
    blurb: 'Every API call recorded and charted.',
    group: 'Operations',
  },
  webhooks: {
    label: 'Inbound webhooks',
    blurb: 'Signed GitHub deliveries, verified and shown live.',
    group: 'Operations',
  },
  checkout: {
    label: 'Stripe checkout',
    blurb: 'Sell a product: paid on Stripe, confirmed live, receipt emailed.',
    group: 'Operations',
  },
  newsletter: {
    label: 'Newsletter',
    blurb: 'Double opt-in sign-ups; issues sent through Amazon SES.',
    group: 'Operations',
  },
}

export const AUTH_WORDS: Record<string, { label: string; blurb: string }> = {
  email: { label: 'Accounts', blurb: 'Email sign-in links; every write needs a signed-in user.' },
  access: { label: 'Cloudflare Access', blurb: 'Only people your identity provider lets in.' },
}

/**
 * A wrangler.jsonc key, as a Cloudflare service, and how it runs in `vite dev`: `simulated`
 * runs locally for real (workerd, miniflare), `stand-in` is replaced by a labelled local
 * substitute until deployed. `null` is configuration, not a service.
 */
export const SERVICES: Record<string, { name: string; local: 'simulated' | 'stand-in' } | null> = {
  name: null,
  main: null,
  compatibility_date: null,
  compatibility_flags: null,
  assets: null,
  observability: null,
  migrations: null,
  vars: null,
  durable_objects: { name: 'Durable Objects', local: 'simulated' },
  d1_databases: { name: 'D1', local: 'simulated' },
  r2_buckets: { name: 'R2', local: 'simulated' },
  images: { name: 'Images', local: 'simulated' },
  queues: { name: 'Queues', local: 'simulated' },
  workflows: { name: 'Workflows', local: 'simulated' },
  browser: { name: 'Browser Run', local: 'simulated' },
  analytics_engine_datasets: { name: 'Analytics Engine', local: 'simulated' },
  send_email: { name: 'Email Service', local: 'simulated' },
  ratelimits: { name: 'Rate Limiting', local: 'simulated' },
  triggers: { name: 'Cron Triggers', local: 'simulated' },
  ai: { name: 'Workers AI', local: 'stand-in' },
  vectorize: { name: 'Vectorize', local: 'stand-in' },
}

/** Access has no binding: the Worker checks its token, and `vite dev` has no Access at all. */
const ACCESS_SERVICE = 'access'

const PROJECT = 'my-app'

function scaffold(args: string[]): Map<string, string> {
  const work = mkdtempSync(join(tmpdir(), 'cascivo-builder-'))
  try {
    execFileSync(
      process.execPath,
      [CLI, 'create', PROJECT, '--yes', '--framework', 'cloudflare', '--pm', 'npm', ...args],
      { cwd: work, stdio: 'pipe' },
    )
    return readTree(join(work, PROJECT))
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
}

/** Top-level keys of wrangler.jsonc: the two-space-indented `"key":` lines. */
function wranglerKeys(files: Map<string, string>): string[] {
  const text = files.get('wrangler.jsonc') ?? ''
  return [...text.matchAll(/^ {2}"([a-z0-9_]+)":/gm)].map((m) => m[1]!)
}

/** A route file as its path: `src/routes/p/[slug].tsx` is `/p/:slug`. */
function routePath(file: string): string {
  const path = file
    .replace(/^src\/routes\//, '')
    .replace(/\.tsx$/, '')
    .replace(/\[([^\]]+)\]/g, ':$1')
    .replace(/(^|\/)index$/, '')
  return `/${path}`
}

interface Delta {
  files: string[]
  pages: string[]
  services: string[]
  react: boolean
}

function delta(base: Map<string, string>, files: Map<string, string>): Delta {
  const added = [...files.keys()].filter((f) => !base.has(f)).sort()
  const baseKeys = new Set(wranglerKeys(base))
  const services = wranglerKeys(files).filter((key) => {
    if (!(key in SERVICES)) {
      throw new Error(
        `wrangler.jsonc key "${key}" has no entry in SERVICES (scripts/site/app-builder.ts)`,
      )
    }
    return !baseKeys.has(key) && SERVICES[key] !== null
  })
  const pkg: unknown = JSON.parse(files.get('package.json') ?? '{}')
  const deps =
    typeof pkg === 'object' && pkg !== null
      ? (pkg as Record<string, unknown>)['dependencies']
      : null
  return {
    files: added,
    pages: added.filter((f) => f.startsWith('src/routes/') && f.endsWith('.tsx')).map(routePath),
    services,
    react: typeof deps === 'object' && deps !== null && 'react-dom' in deps,
  }
}

export interface BuilderData {
  examples: (Delta & { id: string; label: string; blurb: string; group: Group; brings: string[] })[]
  auth: (Delta & { id: string; label: string; blurb: string })[]
  services: Record<string, { name: string; local: 'simulated' | 'stand-in' | 'account' }>
}

export function buildData(): BuilderData {
  const examples = cliExamples()
  const missing = examples.filter((e) => !(e in EXAMPLE_WORDS))
  if (missing.length > 0) {
    throw new Error(
      `No words for --example ${missing.join(', ')} in EXAMPLE_WORDS (scripts/site/app-builder.ts)`,
    )
  }
  const base = scaffold([])
  const deltas = new Map(examples.map((id) => [id, delta(base, scaffold(['--example', id]))]))
  return {
    examples: examples.map((id) => {
      const own = deltas.get(id)!
      // Another example this one brings along: all of that one's files arrive with it.
      const brings = examples.filter(
        (other) => other !== id && deltas.get(other)!.files.every((f) => own.files.includes(f)),
      )
      return { id, ...EXAMPLE_WORDS[id]!, ...own, brings }
    }),
    auth: Object.entries(AUTH_WORDS).map(([id, words]) => {
      const own = delta(base, scaffold(['--auth', id]))
      return {
        id,
        ...words,
        ...own,
        services: id === 'access' ? [ACCESS_SERVICE, ...own.services] : own.services,
      }
    }),
    services: {
      ...Object.fromEntries(
        Object.entries(SERVICES).flatMap(([key, value]) => (value ? [[key, value]] : [])),
      ),
      [ACCESS_SERVICE]: { name: 'Access', local: 'account' },
    },
  }
}

export function serialize(data: BuilderData): string {
  return `${JSON.stringify(data, null, 2)}\n`
}
