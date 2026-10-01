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

export interface Starter {
  /** Directory under starters/. */
  name: string
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
    args: ['--framework', 'cloudflare', '--pm', 'npm'],
  },
  {
    name: 'cloudflare-board',
    project: 'cascivo-board',
    args: ['--framework', 'cloudflare', '--example', 'board', '--pm', 'npm'],
  },
  {
    name: 'cloudflare-agent',
    project: 'cascivo-agent',
    args: ['--framework', 'cloudflare', '--example', 'agent', '--pm', 'npm'],
  },
  {
    name: 'cloudflare-crud',
    project: 'cascivo-crud',
    args: ['--framework', 'cloudflare', '--example', 'crud', '--pm', 'npm'],
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
    return files
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
}
