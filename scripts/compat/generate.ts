#!/usr/bin/env node
/**
 * Regenerates the package-compatibility table in `docs/COMPATIBILITY.md`.
 *
 * The table was hand-maintained, and by 2026-07-28 it was thirteen minors stale — it
 * claimed `@cascivo/react` 0.2.x while npm served 0.13.0, `@cascivo/core` 0.1.x against
 * 0.7.0, and so on for all six packages an adopter installs. The reporter's verdict was
 * not "one wrong table" but "it undermines trust in the rest of the docs" (report C6).
 *
 * That is Mechanism C: the same fact (each package's version and peer requirements) stated
 * independently in `package.json` and in prose, with nothing reconciling them. Hand-editing
 * is exactly how it drifted. The repo already applied this reasoning to install snippets —
 * `version-pins.test.ts` forbids pinning a version in an install command so the snippet
 * cannot go stale — and simply never applied it to the table.
 *
 * So the table is generated from the `package.json` files and rewritten between markers.
 * CI's existing drift check (`pnpm regen` + `git diff --exit-code`) then makes staleness
 * structurally impossible rather than merely discouraged.
 *
 * Run as part of `pnpm regen`.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const PACKAGES_DIR = join(REPO_ROOT, 'packages')
const TARGET = join(REPO_ROOT, 'docs/COMPATIBILITY.md')

const START = '<!-- BEGIN GENERATED: package-compatibility (scripts/compat/generate.ts) -->'
const END = '<!-- END GENERATED: package-compatibility -->'

/** Display order — the order an adopter meets these packages, not alphabetical. */
const ORDER = [
  '@cascivo/core',
  '@cascivo/tokens',
  '@cascivo/themes',
  '@cascivo/react',
  '@cascivo/icons',
  '@cascivo/charts',
  '@cascivo/i18n',
  '@cascivo/storage',
  '@cascivo/mcp',
]

/** Hand-written notes for packages whose real requirement isn't a peerDependency. */
const NOTES: Record<string, string> = {
  '@cascivo/tokens': 'none (CSS only)',
  '@cascivo/themes': '`@cascivo/tokens` (direct dep) — themes `@import` it',
  '@cascivo/mcp': '(server; run via `npx`)',
}

interface PkgJson {
  name?: string
  version?: string
  private?: boolean
  peerDependencies?: Record<string, string>
  peerDependenciesMeta?: Record<string, { optional?: boolean }>
}

function packages(): Map<string, PkgJson> {
  const out = new Map<string, PkgJson>()
  for (const dir of readdirSync(PACKAGES_DIR)) {
    let pkg: PkgJson
    try {
      pkg = JSON.parse(readFileSync(join(PACKAGES_DIR, dir, 'package.json'), 'utf8')) as PkgJson
    } catch {
      continue
    }
    if (pkg.private === true || !pkg.name) continue
    out.set(pkg.name, pkg)
  }
  return out
}

/**
 * The minor line an adopter should install, e.g. `0.13.x` for 0.13.0.
 *
 * A patch-exact version here would go stale on every patch release and put the drift check
 * in everyone's way for no benefit; the minor is the unit these packages release in.
 */
function minorLine(version: string): string {
  const [major, minor] = version.split('.')
  return `${major}.${minor}.x`
}

/** Peer requirements as prose, optional peers marked so nobody thinks they must install one. */
function peerSummary(pkg: PkgJson): string {
  const note = NOTES[pkg.name!]
  if (note !== undefined) return note
  const peers = pkg.peerDependencies ?? {}
  const parts = Object.entries(peers).map(([name, range]) => {
    const optional = pkg.peerDependenciesMeta?.[name]?.optional === true
    return `\`${name} ${range.replace(/^\^/, '')}\`${optional ? ' _(optional)_' : ''}`
  })
  return parts.length > 0 ? parts.join(', ') : 'none'
}

function table(): string {
  const found = packages()
  const rows = ORDER.filter((name) => found.has(name)).map((name) => {
    const pkg = found.get(name)!
    return `| \`${name}\` | ${minorLine(pkg.version ?? '0.0.0')} | ${peerSummary(pkg)} |`
  })
  return [
    '| Package | Version | Peer requirements |',
    '| ------- | ------- | ----------------- |',
    ...rows,
  ].join('\n')
}

const source = readFileSync(TARGET, 'utf8')
const start = source.indexOf(START)
const end = source.indexOf(END)
if (start === -1 || end === -1) {
  console.error(
    `compat: markers not found in docs/COMPATIBILITY.md.\n` +
      `Wrap the package-compatibility table in:\n  ${START}\n  …\n  ${END}`,
  )
  process.exit(1)
}

const next = source.slice(0, start + START.length) + '\n\n' + table() + '\n\n' + source.slice(end)
writeFileSync(TARGET, next)
console.log(`compat: wrote ${ORDER.length} package rows to docs/COMPATIBILITY.md`)
