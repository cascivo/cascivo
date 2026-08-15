/**
 * RSC boundary guard — a component that renders on the server may not reach client-only code.
 *
 * `clientJs: 'none'` is a promise: render this from a React Server Component and it costs no
 * client JavaScript. Three shipped components broke that promise by *crashing the build*,
 * and nothing caught it because every existing check looked at source files one at a time:
 *
 *   - `LargeTitleHeader` imported `cn` from `@cascivo/core` instead of `@cascivo/core/pure`.
 *     `@cascivo/core`'s single-chunk build carries a `'use client'` banner, so in RSC `cn`
 *     is a client reference: *"Attempted to call cn() from the server."*
 *   - `Label`, `AvatarGroup` and `InlineLoading` imported `t()` from `@cascivo/i18n`, which
 *     took `signal` from `@cascivo/core` — same banner, one hop further out:
 *     *"Attempted to call signal() from the server."* Verified against Next 16: the build
 *     fails at "Collecting page data", not at runtime.
 *   - `Swap` called `useControllableSignal()` and `useSignals()` with no `'use client'`
 *     directive at all, so RSC executed React hooks on the server.
 *
 * The common shape is transitive, which is why a per-file lint never saw it. This guard
 * walks the **published module graph** from every server-renderable chunk and fails on any
 * edge that pulls a non-component binding out of a `'use client'` module.
 *
 * It does not flag the legal case, which is common and deliberate: a Server Component may
 * *render* a client component — `Button` → `Spinner`, `User` → `Avatar`, `Field` → `Label`
 * all cross the boundary correctly. What breaks is calling a client function, or reading a
 * property off what RSC turned into an opaque client reference. `@cascivo/core/pure` exists
 * so those calls have a legal destination; `core-pure.test.ts` polices what may live there,
 * and this guard polices who is allowed to skip it.
 *
 * Needs a prior `pnpm build` — it reads `dist/`, i.e. what an adopter installs. Skips
 * cleanly when dist is absent so `pnpm ready`'s pre-build stages stay runnable.
 *
 * Run: `pnpm rsc:check` (CI, after the build).
 */

import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')
const PACKAGES = join(REPO_ROOT, 'packages')
const REACT_DIST = join(PACKAGES, 'react/dist')

/**
 * Bare specifiers a cascivo chunk may import, mapped to the file RSC resolves. Only cascivo
 * packages matter: `react`, `react-dom` and `@preact/signals-react` carry no `'use client'`
 * of their own, and a third-party client boundary would be that package's bug, not ours.
 */
const WORKSPACE_ENTRIES: Record<string, string> = {
  '@cascivo/core': 'core/dist/index.js',
  '@cascivo/core/pure': 'core/dist/pure.js',
  '@cascivo/i18n': 'i18n/dist/index.js',
}

const USE_CLIENT = /^\s*(['"])use client\1;?\s*$/

function isClientModule(file: string): boolean {
  const firstLine = readFileSync(file, 'utf8')
    .split('\n')
    .find((l) => l.trim() !== '')
  return USE_CLIENT.test(firstLine ?? '')
}

interface ImportEdge {
  /** The specifier, as written. */
  spec: string
  /**
   * The names taken from it, as *exported* (the build preserves them in the import clause
   * even when the local alias is minified: `import { Spinner as e }`). `'*'` stands for a
   * default or namespace import, which is never safe across a client boundary.
   */
  names: string[]
}

/**
 * Import edges of a module. A bare side-effect import (`import './x.css'`) yields no names
 * and is harmless: nothing crosses the boundary.
 */
function importsOf(code: string): ImportEdge[] {
  const out: ImportEdge[] = []
  const re = /import\s+(?:([^'"]*?)\s+from\s+)?['"]([^'"]+)['"]/g
  for (const m of code.matchAll(re)) {
    const clause = m[1]
    const spec = m[2]!
    if (clause === undefined) {
      out.push({ spec, names: [] })
      continue
    }
    const named = /\{([^}]*)\}/.exec(clause)
    const names: string[] = []
    // Anything outside the braces is a default or namespace binding.
    if (clause.replace(/\{[^}]*\}/, '').replace(/[,\s]/g, '') !== '') names.push('*')
    if (named) {
      for (const part of named[1]!.split(',')) {
        const exported = part
          .trim()
          .split(/\s+as\s+/)[0]
          ?.trim()
        if (exported !== undefined && exported !== '') names.push(exported)
      }
    }
    out.push({ spec, names })
  }
  return out
}

/**
 * Whether taking `names` out of a `'use client'` module is safe on the server.
 *
 * It is, and only, when every name is a component: RSC lets a Server Component *render* a
 * client component — that is the whole point of the directive — but any other binding
 * becomes an opaque client reference that throws the moment the server calls it or reads a
 * property off it. The catalog spells components in PascalCase and everything else in
 * camelCase, so the exported name is the discriminator; `'*'` (default/namespace) is never
 * safe because the server cannot know what it will touch.
 */
function onlyRenderableBindings(names: string[]): boolean {
  return names.length > 0 && names.every((n) => /^[A-Z]/.test(n))
}

/** Resolve a specifier to a file on disk, or null when it is out of scope (react, etc.). */
function resolveSpecifier(spec: string, fromFile: string): string | null {
  if (spec.startsWith('.')) {
    const abs = resolve(dirname(fromFile), spec)
    return existsSync(abs) ? abs : null
  }
  const mapped = WORKSPACE_ENTRIES[spec]
  return mapped === undefined ? null : join(PACKAGES, mapped)
}

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

/**
 * The first chain from `entry` to an edge that pulls a non-renderable binding out of a
 * `'use client'` module, or null if none exists. Returned as a chain because these are
 * transitive — `Label` was broken by `@cascivo/i18n`'s import, two hops away — so the
 * failure has to name the hop that must change, not just where it surfaced.
 *
 * Traversal stops at a client module: everything past that point already runs on the client,
 * so its own imports are not the server's problem.
 */
function unsafeChainFrom(entry: string): Array<{ file: string; via: string[] }> | null {
  const seen = new Set<string>()
  const stack: Array<{ file: string; chain: Array<{ file: string; via: string[] }> }> = [
    { file: entry, chain: [{ file: entry, via: [] }] },
  ]
  while (stack.length > 0) {
    const { file, chain } = stack.pop()!
    if (seen.has(file)) continue
    seen.add(file)
    let code: string
    try {
      code = readFileSync(file, 'utf8')
    } catch {
      continue
    }
    for (const { spec, names } of importsOf(code)) {
      if (spec.endsWith('.css')) continue
      const next = resolveSpecifier(spec, file)
      if (next === null) continue
      if (isClientModule(next)) {
        if (onlyRenderableBindings(names)) continue
        return [...chain, { file: next, via: names }]
      }
      if (!seen.has(next)) stack.push({ file: next, chain: [...chain, { file: next, via: names }] })
    }
  }
  return null
}

const built = existsSync(REACT_DIST)

describe('RSC boundary — server-renderable components stay server-safe', () => {
  /** Chunks an RSC bundler executes on the server: they emit JSX and declare no directive. */
  const serverRenderable = built
    ? walk(REACT_DIST).filter(
        (f) =>
          f.endsWith('.js') &&
          !f.includes(`${join('dist', 'node')}`) &&
          readFileSync(f, 'utf8').includes('react/jsx-runtime') &&
          !isClientModule(f),
      )
    : []

  it('finds server-renderable chunks to check', { skip: !built }, () => {
    assert.ok(
      serverRenderable.length > 20,
      `expected the clientJs:'none' catalog, got ${serverRenderable.length} chunk(s) — ` +
        'the build layout changed and this guard is no longer measuring anything',
    )
  })

  it('no server-renderable chunk reaches a client-only module', { skip: !built }, () => {
    const offenders: string[] = []
    for (const chunk of serverRenderable.sort()) {
      const chain = unsafeChainFrom(chunk)
      if (chain === null) continue
      offenders.push(
        chain
          .map(
            ({ file, via }) =>
              file.slice(REPO_ROOT.length + 1) + (via.length > 0 ? ` { ${via.join(', ')} }` : ''),
          )
          .join('\n      → '),
      )
    }
    assert.deepEqual(
      offenders,
      [],
      'These components render inside the RSC server graph but their import chain ends at a ' +
        "'use client' module, so React Server Components fail with \"Attempted to call …() " +
        'from the server". Either import the pure helper from `@cascivo/core/pure`, take the ' +
        'dependency from its own origin instead of through a client-marked barrel, or — if ' +
        "the component really does need browser APIs — give it a `'use client'` directive " +
        `and stop declaring clientJs: 'none'.\n  ${offenders.join('\n  ')}`,
    )
  })
})
