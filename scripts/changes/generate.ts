/**
 * Breaking/feature-change surface generator.
 *
 * Parses every published package's changesets CHANGELOG.md and emits
 * `apps/site/public/breaking-changes.json`: per package, its current version
 * and every MAJOR and MINOR release with its notes. Agents use this to detect
 * API drift between the library version they were trained on / installed and
 * the current one — patch noise is deliberately excluded.
 *
 * Run with: `pnpm changes:generate` (part of `pnpm regen`).
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const OUT_PATH = join(REPO_ROOT, 'apps', 'site', 'public', 'breaking-changes.json')

interface Release {
  version: string
  level: 'major' | 'minor'
  notes: string[]
}

interface PackageChanges {
  name: string
  version: string
  releases: Release[]
}

/** Parse a changesets-format CHANGELOG.md into major/minor releases. */
export function parseChangelog(markdown: string): Release[] {
  const releases: Release[] = []
  let version: string | null = null
  let level: 'major' | 'minor' | null = null

  for (const line of markdown.split('\n')) {
    const versionMatch = /^## (\d+\.\d+\.\d+.*)$/.exec(line)
    if (versionMatch) {
      version = versionMatch[1]!.trim()
      level = null
      continue
    }
    const levelMatch = /^### (Major|Minor|Patch) Changes$/.exec(line)
    if (levelMatch) {
      level = levelMatch[1] === 'Major' ? 'major' : levelMatch[1] === 'Minor' ? 'minor' : null
      continue
    }
    if (version && level && line.startsWith('- ') && !line.startsWith('- Updated dependencies')) {
      const note = line.slice(2).replace(/^[0-9a-f]{7,}: /, '')
      let release = releases.find((r) => r.version === version && r.level === level)
      if (!release) {
        release = { version, level, notes: [] }
        releases.push(release)
      }
      release.notes.push(note)
    }
  }
  return releases
}

function main(): void {
  const packagesDir = join(REPO_ROOT, 'packages')
  const packages: PackageChanges[] = []

  for (const entry of readdirSync(packagesDir).sort()) {
    const pkgPath = join(packagesDir, entry, 'package.json')
    const changelogPath = join(packagesDir, entry, 'CHANGELOG.md')
    if (!existsSync(pkgPath) || !existsSync(changelogPath)) continue
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
      name: string
      version: string
      private?: boolean
    }
    if (pkg.private === true) continue
    packages.push({
      name: pkg.name,
      version: pkg.version,
      releases: parseChangelog(readFileSync(changelogPath, 'utf8')),
    })
  }

  const out = {
    generatedAt: new Date().toISOString().slice(0, 10),
    description:
      'Major and minor releases per published package, parsed from changesets CHANGELOGs. Compare against your installed versions to detect API drift; patch releases are excluded.',
    packages,
  }
  writeFileSync(OUT_PATH, `${JSON.stringify(out, null, 2)}\n`, 'utf8')
  console.log(
    `Wrote breaking-changes.json (${packages.length} packages, ${packages.reduce((n, p) => n + p.releases.length, 0)} major/minor releases)`,
  )
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
