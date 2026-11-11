/**
 * Pure logic for the Rust crate release flow (changesets-style, for crates.io).
 *
 * The @changesets CLI only understands pnpm/npm workspaces, so Rust crates get their own
 * `.changeset-rust/` directory with the same file format and a small zero-dependency tool.
 * Everything here is a pure function over strings so it can be unit-tested without a
 * checkout, a network or cargo; `cli.ts` does the I/O.
 */

export type Bump = 'major' | 'minor' | 'patch'
export type Changeset = { file: string; releases: { crate: string; bump: Bump }[]; summary: string }
export type Config = { fixed: string[][]; baseBranch: string }
export type CrateInfo = { name: string; version: string; dependsOn: string[] }
export type Release = {
  crate: string
  from: string
  to: string
  bump: Bump
  changesets: Changeset[]
}

const RANK: Record<Bump, number> = { patch: 1, minor: 2, major: 3 }
const BUMPS = new Set<string>(['major', 'minor', 'patch'])

export function isBump(value: string): value is Bump {
  return BUMPS.has(value)
}

export function maxBump(a: Bump | undefined, b: Bump): Bump {
  return a !== undefined && RANK[a] >= RANK[b] ? a : b
}

/** Parse a changeset: `---` frontmatter of `"crate": bump` lines, then a markdown summary. */
export function parseChangeset(file: string, text: string): Changeset {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  if (lines[0]?.trim() !== '---') throw new Error(`${file}: missing opening --- frontmatter`)
  const end = lines.findIndex((line, i) => i > 0 && line.trim() === '---')
  if (end === -1) throw new Error(`${file}: missing closing --- frontmatter`)
  const releases: Changeset['releases'] = []
  for (const line of lines.slice(1, end)) {
    if (line.trim() === '') continue
    const m = /^\s*(["']?)([A-Za-z0-9_-]+)\1\s*:\s*(\S+)\s*$/.exec(line)
    if (!m) throw new Error(`${file}: cannot parse frontmatter line "${line}"`)
    const [, , crate = '', bump = ''] = m
    if (!isBump(bump)) throw new Error(`${file}: "${bump}" is not major, minor or patch`)
    if (releases.some((r) => r.crate === crate)) throw new Error(`${file}: ${crate} listed twice`)
    releases.push({ crate, bump })
  }
  const summary = lines
    .slice(end + 1)
    .join('\n')
    .trim()
  if (releases.length > 0 && summary === '') throw new Error(`${file}: empty summary`)
  return { file, releases, summary }
}

export function serializeChangeset(releases: Changeset['releases'], summary: string): string {
  const front = releases.map((r) => `"${r.crate}": ${r.bump}`).join('\n')
  return `---\n${front}\n---\n\n${summary.trim()}\n`
}

export function bumpVersion(version: string, bump: Bump): string {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(version)
  if (!m) throw new Error(`unsupported version "${version}" (pre-releases are not handled)`)
  const [major, minor, patch] = [Number(m[1]), Number(m[2]), Number(m[3])]
  if (bump === 'major') return `${major + 1}.0.0`
  if (bump === 'minor') return `${major}.${minor + 1}.0`
  return `${major}.${minor}.${patch + 1}`
}

export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (d !== 0) return d
  }
  return 0
}

/**
 * Highest bump per crate, then: fixed-group members all take the group's highest bump and
 * the same version; a crate depending on a bumped crate that nothing else bumped gets a
 * patch (changesets' `updateInternalDependencies: patch`), repeated until stable.
 */
export function planReleases(
  changesets: Changeset[],
  crates: CrateInfo[],
  config: Pick<Config, 'fixed'>,
): Release[] {
  const byName = new Map(crates.map((c) => [c.name, c]))
  const bumps = new Map<string, Bump>()
  for (const cs of changesets) {
    for (const { crate, bump } of cs.releases) {
      if (!byName.has(crate)) throw new Error(`${cs.file}: unknown crate "${crate}"`)
      bumps.set(crate, maxBump(bumps.get(crate), bump))
    }
  }
  for (const group of config.fixed)
    for (const name of group)
      if (!byName.has(name)) throw new Error(`config.fixed names unknown crate "${name}"`)

  const grouped = new Map<string, string[]>()
  for (const group of config.fixed) for (const name of group) grouped.set(name, group)

  // Fixed groups and dependents influence each other, so iterate to a fixpoint.
  for (let changed = true; changed;) {
    changed = false
    const set = (name: string, bump: Bump): void => {
      const cur = bumps.get(name)
      const next = maxBump(cur, bump)
      if (cur !== next) {
        bumps.set(name, next)
        changed = true
      }
    }
    for (const [name, bump] of [...bumps]) for (const m of grouped.get(name) ?? []) set(m, bump)
    for (const c of crates)
      if (!bumps.has(c.name) && c.dependsOn.some((d) => bumps.has(d))) set(c.name, 'patch')
  }

  const releases: Release[] = []
  const done = new Set<string>()
  for (const c of crates) {
    const bump = bumps.get(c.name)
    if (bump === undefined || done.has(c.name)) continue
    const group = grouped.get(c.name) ?? [c.name]
    // One shared version: bump from the highest current version in the group.
    const base = group
      .map((n) => byName.get(n)?.version ?? c.version)
      .reduce((a, b) => (compareVersions(a, b) >= 0 ? a : b))
    const to = bumpVersion(base, bump)
    for (const name of group) {
      done.add(name)
      const info = byName.get(name)
      if (!info) continue
      releases.push({
        crate: name,
        from: info.version,
        to,
        bump,
        changesets: changesets.filter((cs) => cs.releases.some((r) => r.crate === name)),
      })
    }
  }
  return releases.sort((a, b) => a.crate.localeCompare(b.crate))
}

const VERSION_VALUE = /((?<![\w-])version\s*=\s*)"[^"]*"/

/** Section header of a Cargo.toml: `[package]`, `[dependencies.foo]`, `[[bin]]`, … */
function sectionOf(line: string): string | null {
  const m = /^\s*\[\[?([^\]]+)\]\]?\s*(#.*)?$/.exec(line)
  return m ? (m[1] ?? '').trim() : null
}

/** Set `[package] version` only — never `[workspace.package]`, never a dependency. */
export function rewritePackageVersion(toml: string, version: string): string {
  let section = ''
  let replaced = false
  const out = toml.split('\n').map((line) => {
    const s = sectionOf(line)
    if (s !== null) section = s
    else if (section === 'package' && !replaced && /^\s*version\s*=\s*"/.test(line)) {
      replaced = true
      return line.replace(VERSION_VALUE, `$1"${version}"`)
    }
    return line
  })
  if (!replaced) throw new Error('no [package] version = "…" line found')
  return out.join('\n')
}

/**
 * Update `version = "…"` requirements on dependencies that are workspace crates being
 * released. Handles inline tables and `[dependencies.name]` tables; leaves every other
 * line, comment and spacing untouched.
 */
export function rewriteDependencyVersions(toml: string, versions: Map<string, string>): string {
  let tableDep: string | null = null
  return toml
    .split('\n')
    .map((line) => {
      const s = sectionOf(line)
      if (s !== null) {
        const m =
          /^(?:[\w.-]+\.)?(?:dependencies|dev-dependencies|build-dependencies)\.([\w-]+)$/.exec(s)
        tableDep = m?.[1] && versions.has(m[1]) ? m[1] : null
        return line
      }
      if (tableDep !== null && /^\s*version\s*=\s*"/.test(line)) {
        return line.replace(VERSION_VALUE, `$1"${versions.get(tableDep)}"`)
      }
      const inline = /^\s*([\w-]+)\s*=\s*\{/.exec(line)
      const name = inline?.[1]
      if (name && versions.has(name) && /\bversion\s*=\s*"/.test(line)) {
        return line.replace(VERSION_VALUE, `$1"${versions.get(name)}"`)
      }
      return line
    })
    .join('\n')
}

/** Workspace crates in Cargo.lock have no `source`; bump just those entries. */
export function rewriteLockVersions(lock: string, versions: Map<string, string>): string {
  return lock
    .split('\n\n')
    .map((block) => {
      const name = /^name = "([^"]+)"$/m.exec(block)?.[1]
      if (!name || !versions.has(name) || /^source = /m.test(block)) return block
      return block.replace(/^version = "[^"]*"$/m, `version = "${versions.get(name)}"`)
    })
    .join('\n\n')
}

const HEADINGS: Record<Bump, string> = {
  major: 'Major Changes',
  minor: 'Minor Changes',
  patch: 'Patch Changes',
}

/** One CHANGELOG section for a release, in changesets' layout. */
export function renderChangelogEntry(release: Release, group: string[]): string {
  const sections: Record<Bump, string[]> = { major: [], minor: [], patch: [] }
  for (const cs of release.changesets) {
    const bump = cs.releases.find((r) => r.crate === release.crate)?.bump ?? 'patch'
    const [first = '', ...rest] = cs.summary.split('\n')
    sections[bump].push([`- ${first}`, ...rest.map((l) => (l === '' ? '' : `  ${l}`))].join('\n'))
  }
  if (release.changesets.length === 0) {
    const others = group.filter((n) => n !== release.crate).join(', ')
    sections[release.bump].push(
      others === ''
        ? '- Updated internal dependencies.'
        : `- Released in lockstep with ${others} (fixed group).`,
    )
  }
  const body = (['major', 'minor', 'patch'] as const)
    .filter((b) => sections[b].length > 0)
    .map((b) => `### ${HEADINGS[b]}\n\n${sections[b].join('\n\n')}`)
    .join('\n\n')
  return `## ${release.to}\n\n${body}\n`
}

/** Insert an entry directly under the `# <crate>` title (creating the file's header if needed). */
export function prependChangelog(existing: string | null, crate: string, entry: string): string {
  if (existing === null || existing.trim() === '') return `# ${crate}\n\n${entry}`
  const m = /^(# .*\n)\n*/.exec(existing)
  if (!m) return `# ${crate}\n\n${entry}\n${existing}`
  return `${m[1]}\n${entry}\n${existing.slice(m[0].length)}`
}

/** The `## <version>` section of a changelog, for GitHub release notes. */
export function changelogSection(changelog: string, version: string): string | null {
  const lines = changelog.split('\n')
  const start = lines.findIndex((l) => l.trim() === `## ${version}`)
  if (start === -1) return null
  const next = lines.findIndex((l, i) => i > start && l.startsWith('## '))
  return lines
    .slice(start + 1, next === -1 ? undefined : next)
    .join('\n')
    .trim()
}

/** Dependencies first; ties by name so the order is deterministic. Throws on a cycle. */
export function dependencyOrder(crates: CrateInfo[]): string[] {
  const names = new Set(crates.map((c) => c.name))
  const remaining = new Map(
    crates.map((c) => [c.name, new Set(c.dependsOn.filter((d) => names.has(d) && d !== c.name))]),
  )
  const out: string[] = []
  while (remaining.size > 0) {
    const ready = [...remaining]
      .filter(([, deps]) => deps.size === 0)
      .map(([n]) => n)
      .sort()
    if (ready.length === 0)
      throw new Error(`dependency cycle among ${[...remaining.keys()].join(', ')}`)
    for (const n of ready) {
      remaining.delete(n)
      out.push(n)
    }
    for (const deps of remaining.values()) for (const n of ready) deps.delete(n)
  }
  return out
}

/** Sparse-index path: https://doc.rust-lang.org/cargo/reference/registry-index.html */
export function indexPath(name: string): string {
  const n = name.toLowerCase()
  if (n.length <= 2) return `${n.length}/${n}`
  if (n.length === 3) return `3/${n[0]}/${n}`
  return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n}`
}

/** Versions listed in a sparse-index file (one JSON object per line); yanked ones count. */
export function parseIndexVersions(body: string): string[] {
  const out: string[] = []
  for (const line of body.split('\n')) {
    if (line.trim() === '') continue
    const vers: unknown = (JSON.parse(line) as { vers?: unknown }).vers
    if (typeof vers === 'string') out.push(vers)
  }
  return out
}

/** Crates whose local version is absent from crates.io, in dependency order. */
export function publishPlan(
  crates: CrateInfo[],
  published: Map<string, string[]>,
): { crate: string; version: string }[] {
  const byName = new Map(crates.map((c) => [c.name, c]))
  return dependencyOrder(crates).flatMap((name) => {
    const c = byName.get(name)
    return c && !(published.get(name) ?? []).includes(c.version)
      ? [{ crate: name, version: c.version }]
      : []
  })
}

/**
 * Blank the values a release legitimately moves: `[package] version` and the `version` on
 * path (workspace-sibling) dependencies. Registry requirements and `rust-version` stay, so
 * bumping `ureq` or the MSRV still reads as a real change.
 */
function normalizeVersions(toml: string): string {
  let section = ''
  return toml
    .split('\n')
    .map((line) => {
      const s = sectionOf(line)
      if (s !== null) section = s
      else if (section === 'package' && /^\s*version\s*=\s*"/.test(line))
        return line.replace(VERSION_VALUE, '$1"_"')
      else if (/^\s*[\w-]+\s*=\s*\{[^}]*\bpath\s*=/.test(line))
        return line.replace(VERSION_VALUE, '$1"_"')
      return line
    })
    .join('\n')
}

export function isVersionOnlyCargoChange(before: string, after: string): boolean {
  return normalizeVersions(before) === normalizeVersions(after)
}

export type Change = { path: string; status: string; before: string | null; after: string | null }

/**
 * Files in a diff that ship a Rust change and so need a rust changeset:
 * anything under a crate's `src/` and its `Cargo.toml`, unless only version values moved.
 * A diff that deletes a changeset is the version PR, which consumes them.
 */
export function needsRustChangeset(changes: Change[]): { needed: string[]; consumes: boolean } {
  const consumes = changes.some(
    (c) => c.status.startsWith('D') && /^\.changeset-rust\/(?!README\.md$).+\.md$/.test(c.path),
  )
  const needed = changes
    .filter((c) => {
      if (/^crates\/[^/]+\/src\//.test(c.path)) return true
      if (/^crates\/[^/]+\/Cargo\.toml$/.test(c.path))
        return !(
          c.before !== null &&
          c.after !== null &&
          isVersionOnlyCargoChange(c.before, c.after)
        )
      return false
    })
    .map((c) => c.path)
  return { needed, consumes }
}

const WORDS = {
  adj: ['brave', 'calm', 'eager', 'fair', 'gentle', 'happy', 'kind', 'lucky', 'quick', 'wise'],
  noun: ['bees', 'cats', 'crabs', 'dogs', 'foxes', 'owls', 'pandas', 'seals', 'tigers', 'wolves'],
  verb: ['dance', 'jump', 'laugh', 'march', 'play', 'run', 'sing', 'smile', 'swim', 'wave'],
}

/** `brave-owls-sing`, like changesets; `pick(n)` returns an index in [0, n). */
export function readableName(pick: (n: number) => number, taken: Set<string>): string {
  for (let i = 0; i < 1000; i++) {
    const name = [WORDS.adj, WORDS.noun, WORDS.verb]
      .map((list) => list[pick(list.length)] ?? '')
      .join('-')
    if (!taken.has(name)) return name
  }
  throw new Error('could not find a free changeset name')
}
