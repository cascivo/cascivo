/**
 * Changesets-style release tool for the repo's Rust crates (crates.io).
 *
 *   pnpm changeset:rust                       interactive add
 *   pnpm changeset:rust add --crate cascivo-html --bump minor --summary "…"
 *   pnpm changeset:rust status [--markdown]   pending bumps -> resulting versions
 *   pnpm changeset:rust version               consume changesets, bump manifests/lock/changelogs
 *   pnpm changeset:rust publish-plan          JSON: crates whose version is not on crates.io yet
 *   pnpm changeset:rust changelog-section --crate <name> --version <v>
 *   pnpm changeset:rust coverage [--base <ref>]   PR gate: src/Cargo.toml change needs a changeset
 *
 * Zero dependencies; run with `node --experimental-strip-types`. See .changeset-rust/README.md.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { randomInt } from 'node:crypto'
import {
  type Bump,
  type Change,
  type Changeset,
  type Config,
  type CrateInfo,
  type Release,
  changelogSection,
  indexPath,
  isBump,
  needsRustChangeset,
  parseChangeset,
  parseIndexVersions,
  planReleases,
  prependChangelog,
  publishPlan,
  readableName,
  renderChangelogEntry,
  rewriteDependencyVersions,
  rewriteLockVersions,
  rewritePackageVersion,
  serializeChangeset,
} from './lib.ts'

// RUST_RELEASE_ROOT lets a scratch copy of the repo be used for dry runs.
const ROOT = process.env['RUST_RELEASE_ROOT'] ?? join(import.meta.dirname, '../..')
const DIR = join(ROOT, '.changeset-rust')

type Crate = CrateInfo & { manifest: string; dir: string; publishable: boolean }

function run(cmd: string, args: string[], stderr: 'inherit' | 'ignore' = 'inherit'): string {
  return execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', stderr] })
}

function loadConfig(): Config {
  const raw: unknown = JSON.parse(readFileSync(join(DIR, 'config.json'), 'utf8'))
  const c = raw as Partial<Config>
  return { fixed: c.fixed ?? [], baseBranch: c.baseBranch ?? 'main' }
}

function loadCrates(): Crate[] {
  const meta = JSON.parse(
    run('cargo', ['metadata', '--no-deps', '--format-version', '1', '--offline']),
  ) as {
    packages: {
      name: string
      version: string
      manifest_path: string
      publish: string[] | null
      dependencies: { name: string; path?: string }[]
    }[]
  }
  const names = new Set(meta.packages.map((p) => p.name))
  return meta.packages
    .map((p) => ({
      name: p.name,
      version: p.version,
      manifest: p.manifest_path,
      dir: p.manifest_path.replace(/\/Cargo\.toml$/, ''),
      // `publish = false` is `[]`; null means any registry.
      publishable: p.publish === null || p.publish.length > 0,
      dependsOn: p.dependencies
        .filter((d) => d.path !== undefined && names.has(d.name))
        .map((d) => d.name),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

function loadChangesets(): Changeset[] {
  if (!existsSync(DIR)) return []
  return readdirSync(DIR)
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .sort()
    .map((f) => parseChangeset(f, readFileSync(join(DIR, f), 'utf8')))
    .filter((cs) => cs.releases.length > 0)
}

function arg(args: string[], name: string): string | undefined {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? undefined : args[i + 1]
}

function writeChangeset(crates: string[], bump: Bump, summary: string): string {
  const taken = new Set(readdirSync(DIR).map((f) => f.replace(/\.md$/, '')))
  const name = readableName((n) => randomInt(n), taken)
  const file = join(DIR, `${name}.md`)
  writeFileSync(
    file,
    serializeChangeset(
      crates.map((crate) => ({ crate, bump })),
      summary,
    ),
  )
  return file
}

async function add(args: string[]): Promise<void> {
  const crates = loadCrates().filter((c) => c.publishable)
  const names = crates.map((c) => c.name)
  let picked = arg(args, 'crate')?.split(',').filter(Boolean)
  let bump = arg(args, 'bump')
  let summary = arg(args, 'summary')
  if (!picked || !bump || !summary) {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    try {
      if (!picked) {
        names.forEach((n, i) => console.log(`  ${i + 1}) ${n}`))
        const a = await rl.question('Crates (numbers, comma separated): ')
        picked = a.split(',').flatMap((s) => names[Number(s.trim()) - 1] ?? [])
      }
      bump ??= await rl.question('Bump (patch/minor/major): ')
      summary ??= await rl.question('Summary: ')
    } finally {
      rl.close()
    }
  }
  if (picked.length === 0) throw new Error('no crate selected')
  for (const c of picked)
    if (!names.includes(c)) throw new Error(`unknown or unpublishable crate "${c}"`)
  if (!isBump(bump)) throw new Error(`bump must be patch, minor or major, got "${bump}"`)
  if (summary.trim() === '') throw new Error('summary is empty')
  console.log(`Wrote ${writeChangeset(picked, bump, summary)}`)
}

function plan(): { releases: Release[]; crates: Crate[]; config: Config } {
  const crates = loadCrates()
  const config = loadConfig()
  // `publish = false` crates never release; naming one in a changeset is an error.
  return {
    releases: planReleases(
      loadChangesets(),
      crates.filter((c) => c.publishable),
      config,
    ),
    crates,
    config,
  }
}

function status(args: string[]): void {
  const { releases } = plan()
  if (releases.length === 0) return void console.log('No pending Rust changesets.')
  if (args.includes('--markdown')) {
    console.log('| Crate | Bump | Version |\n| --- | --- | --- |')
    for (const r of releases) console.log(`| \`${r.crate}\` | ${r.bump} | ${r.from} → ${r.to} |`)
    return
  }
  for (const r of releases) console.log(`${r.crate}: ${r.bump}  ${r.from} -> ${r.to}`)
}

function version(): void {
  const { releases, crates, config } = plan()
  if (releases.length === 0) return void console.log('No pending Rust changesets.')
  const versions = new Map(releases.map((r) => [r.crate, r.to]))
  for (const c of crates) {
    let toml = readFileSync(c.manifest, 'utf8')
    if (versions.has(c.name)) toml = rewritePackageVersion(toml, versions.get(c.name) ?? c.version)
    toml = rewriteDependencyVersions(toml, versions)
    writeFileSync(c.manifest, toml)
  }
  const lock = join(ROOT, 'Cargo.lock')
  if (existsSync(lock))
    writeFileSync(lock, rewriteLockVersions(readFileSync(lock, 'utf8'), versions))
  for (const r of releases) {
    const crate = crates.find((c) => c.name === r.crate)
    if (!crate) continue
    const file = join(crate.dir, 'CHANGELOG.md')
    const group = config.fixed.find((g) => g.includes(r.crate)) ?? [r.crate]
    const before = existsSync(file) ? readFileSync(file, 'utf8') : null
    writeFileSync(file, prependChangelog(before, r.crate, renderChangelogEntry(r, group)))
  }
  for (const f of new Set(releases.flatMap((r) => r.changesets.map((cs) => cs.file))))
    unlinkSync(join(DIR, f))
  // Empty-frontmatter changesets release nothing; consume them too so they do not linger.
  for (const f of readdirSync(DIR))
    if (
      f.endsWith('.md') &&
      f !== 'README.md' &&
      !parseChangeset(f, readFileSync(join(DIR, f), 'utf8')).releases.length
    )
      unlinkSync(join(DIR, f))
  for (const r of releases) console.log(`${r.crate}: ${r.from} -> ${r.to}`)
}

async function publishedVersions(name: string): Promise<string[]> {
  const res = await fetch(`https://index.crates.io/${indexPath(name)}`)
  if (res.status === 404) return [] // never published
  if (!res.ok) throw new Error(`crates.io index ${res.status} for ${name}`)
  return parseIndexVersions(await res.text())
}

async function publishPlanCommand(): Promise<void> {
  const crates = loadCrates().filter((c) => c.publishable)
  const published = new Map<string, string[]>()
  for (const c of crates) published.set(c.name, await publishedVersions(c.name))
  console.log(JSON.stringify(publishPlan(crates, published)))
}

function coverage(args: string[]): void {
  const baseBranch = loadConfig().baseBranch
  const git = (...a: string[]): string => run('git', a, 'ignore')
  let base: string | null = null
  for (const ref of [
    arg(args, 'base'),
    process.env['CHANGESET_BASE'],
    `origin/${baseBranch}`,
    baseBranch,
  ]) {
    if (!ref) continue
    try {
      base = git('merge-base', ref, 'HEAD').trim()
      break
    } catch {
      /* ref absent in this clone, try the next */
    }
  }
  // A diff guard with no base must fail, not pass having checked nothing.
  if (base === null) throw new Error('no merge base found; fetch full history (fetch-depth: 0)')
  const changes: Change[] = git('diff', '--no-renames', '--name-status', base)
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [status = '', path = ''] = line.split('\t')
      const show = (ref: string): string | null => {
        try {
          return git('show', `${ref}:${path}`)
        } catch {
          return null
        }
      }
      return {
        path,
        status,
        before: show(base),
        after: existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), 'utf8') : null,
      }
    })
  const { needed, consumes } = needsRustChangeset(changes)
  const added = changes.some(
    (c) => !c.status.startsWith('D') && /^\.changeset-rust\/(?!README\.md$).+\.md$/.test(c.path),
  )
  if (consumes) return void console.log('Rust version PR: consumes changesets, none needed.')
  if (needed.length === 0 || added) return void console.log('Rust changeset coverage OK.')
  console.error(
    `Rust changes with no changeset:\n  ${needed.join('\n  ')}\n\n` +
      'Run `pnpm changeset:rust` and commit the file, or label the PR `no-rust-changeset` if the change reaches no adopter.',
  )
  process.exitCode = 1
}

const [command = 'add', ...rest] = process.argv.slice(2)
switch (command) {
  case 'add':
    await add(rest)
    break
  case 'status':
    status(rest)
    break
  case 'version':
    version()
    break
  case 'publish-plan':
    await publishPlanCommand()
    break
  case 'changelog-section': {
    const crate = arg(rest, 'crate')
    const v = arg(rest, 'version')
    if (!crate || !v) throw new Error('--crate and --version are required')
    const dir = loadCrates().find((c) => c.name === crate)?.dir
    const file = dir ? join(dir, 'CHANGELOG.md') : ''
    const section =
      file && existsSync(file) ? changelogSection(readFileSync(file, 'utf8'), v) : null
    console.log(section ?? `Release ${crate} ${v}.`)
    break
  }
  case 'coverage':
    coverage(rest)
    break
  default:
    throw new Error(`unknown command "${command}"`)
}
