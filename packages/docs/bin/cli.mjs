/**
 * @cascivo/docs CLI — print any cascivo doc to stdout, no network, no install.
 * Dependency-free (node:fs/path/url only) so `npx @cascivo/docs` is instant.
 *
 * The logic is exported as `run()` for tests; `cascivo-docs.mjs` is the thin
 * executable wrapper. Content is resolved from the shipped `content/` dir, with a
 * monorepo fallback so the CLI works in a dev checkout before a build.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))

/** Locate the docs content dir. Order: explicit override (tests) → shipped
 * `content/` → dev monorepo `apps/site/public`. Returns null if none has llms.txt. */
export function resolveContentDir(env = process.env) {
  const candidates = [
    env.CASCIVO_DOCS_CONTENT,
    join(HERE, '..', 'content'),
    join(HERE, '..', '..', '..', 'apps', 'site', 'public'),
  ].filter(Boolean)
  for (const c of candidates) {
    if (existsSync(join(c, 'llms.txt'))) return c
  }
  return null
}

const USAGE = `cascivo-docs — the cascivo docs, offline. No website needed.

Usage:
  npx @cascivo/docs                 print llms.txt (the index — lists every doc)
  npx @cascivo/docs <component>     print one component's reference (e.g. button, area-chart)
  npx @cascivo/docs guide <slug>    print a guide (e.g. getting-started, theming, troubleshooting)
  npx @cascivo/docs --full          print llms-full.txt (the entire library, one file)
  npx @cascivo/docs --list          list every available doc path
  npx @cascivo/docs --dir           print the absolute path of the content dir (grep it directly)
  npx @cascivo/docs --help          this message
`

function read(file) {
  return readFileSync(file, 'utf8')
}

/** Find a component doc by name: flat `llms/<name>.md`, then one level of
 * subdirs (block/chart/layout/…), then `context/<name>.md`. */
function findComponentDoc(dir, name) {
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/\.md$/, '')
  const flat = join(dir, 'llms', `${slug}.md`)
  if (existsSync(flat)) return flat
  const llmsDir = join(dir, 'llms')
  if (existsSync(llmsDir)) {
    for (const entry of readdirSync(llmsDir)) {
      const sub = join(llmsDir, entry)
      let isDir = false
      try {
        isDir = statSync(sub).isDirectory()
      } catch {
        isDir = false
      }
      if (isDir && existsSync(join(sub, `${slug}.md`))) return join(sub, `${slug}.md`)
    }
  }
  const ctx = join(dir, 'context', `${slug}.md`)
  if (existsSync(ctx)) return ctx
  return null
}

/** Find a guide by slug: `guides/<slug>.md`, or the dev-monorepo `docs/<slug>.md`. */
function findGuide(dir, slug) {
  const s = slug.toLowerCase().replace(/\.md$/, '')
  for (const rel of [join('guides', `${s}.md`), join('docs', `${s}.md`)]) {
    const p = join(dir, rel)
    if (existsSync(p)) return p
  }
  return null
}

/**
 * Docs whose slug contains `term`, as the names a user would type them back as.
 *
 * For the error message. An adopter looking for the email package typed
 * `cascivo-docs email` and got "no doc for \"email\"" — which is true of the component
 * index and useless, because `guide recipe-email` was sitting right there. A dead end that
 * knows the answer is worse than one that does not.
 */
function suggest(dir, term) {
  const t = term.toLowerCase()
  return listPaths(dir)
    .filter((p) => !p.endsWith('.txt') && !p.includes('(--full)') && p.toLowerCase().includes(t))
    .slice(0, 6)
}

/** List every doc path a user can ask for. */
function listPaths(dir) {
  const out = ['llms.txt', 'llms-full.txt (--full)']
  const push = (label, sub, transform) => {
    const base = join(dir, sub)
    if (!existsSync(base)) return
    for (const entry of readdirSync(base)) {
      const full = join(base, entry)
      let isDir = false
      try {
        isDir = statSync(full).isDirectory()
      } catch {
        isDir = false
      }
      if (isDir) {
        for (const f of readdirSync(full)) if (f.endsWith('.md')) out.push(transform(f, entry))
      } else if (entry.endsWith('.md')) {
        out.push(transform(entry))
      }
    }
  }
  push('components', 'llms', (f) => f.replace(/\.md$/, ''))
  // guides in built content, or docs/ in a dev checkout
  const guideDir = existsSync(join(dir, 'guides')) ? 'guides' : 'docs'
  const gp = join(dir, guideDir)
  if (existsSync(gp)) {
    for (const f of readdirSync(gp))
      if (f.endsWith('.md')) out.push(`guide ${f.replace(/\.md$/, '')}`)
  }
  return [...new Set(out)].sort()
}

/**
 * Run the CLI. Returns a process exit code. `stdout`/`stderr` are injectable for
 * tests; they default to the real streams.
 */
export function run(argv, opts = {}) {
  const env = opts.env ?? process.env
  const out = opts.stdout ?? ((s) => process.stdout.write(s))
  const err = opts.stderr ?? ((s) => process.stderr.write(s))

  if (argv.includes('--help') || argv.includes('-h')) {
    out(USAGE)
    return 0
  }

  const dir = resolveContentDir(env)
  if (!dir) {
    err('cascivo-docs: docs content not found. Reinstall @cascivo/docs.\n')
    return 1
  }

  if (argv.includes('--dir')) {
    out(`${dir}\n`)
    return 0
  }
  if (argv.includes('--list') || argv.includes('-l')) {
    out(`${listPaths(dir).join('\n')}\n`)
    return 0
  }
  if (argv.includes('--full') || argv.includes('-f')) {
    const p = join(dir, 'llms-full.txt')
    if (!existsSync(p)) {
      err('cascivo-docs: llms-full.txt not found.\n')
      return 1
    }
    out(read(p))
    return 0
  }

  const positional = argv.filter((a) => !a.startsWith('-'))

  if (positional.length === 0) {
    out(read(join(dir, 'llms.txt')))
    return 0
  }

  if (positional[0] === 'guide') {
    const slug = positional[1]
    if (!slug) {
      err('cascivo-docs: `guide` needs a slug, e.g. `guide theming`. Try `--list`.\n')
      return 2
    }
    const p = findGuide(dir, slug)
    if (!p) {
      err(`cascivo-docs: no guide "${slug}". Run \`cascivo-docs --list\` to see all.\n`)
      return 1
    }
    out(read(p))
    return 0
  }

  // A bare topic means a component doc, and falls back to a guide of the same slug: a
  // reader who types `cascivo-docs theming` means the theming guide, and making them know
  // which of the two shelves a name lives on is a distinction only this CLI cares about.
  const p = findComponentDoc(dir, positional[0]) ?? findGuide(dir, positional[0])
  if (!p) {
    const near = suggest(dir, positional[0])
    const hint = near.length > 0 ? ` Did you mean: ${near.join(', ')}?` : ''
    err(
      `cascivo-docs: no doc for "${positional[0]}".${hint} Run \`cascivo-docs --list\` to see all.\n`,
    )
    return 1
  }
  out(read(p))
  return 0
}
