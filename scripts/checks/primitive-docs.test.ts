/**
 * Primitive-docs coverage check — the anti-drift guard for the *concept* layer.
 *
 * Per-component AI docs (llms/*.md, context/*.md, registry.json) are generated
 * from each `.meta.ts`, so they cannot drift — CI regenerates and diffs them.
 * The cross-cutting primitives have no such manifest: the `@cascivo/core`
 * behavior/state hooks and the `@cascivo/react` runtime primitives (theme, forms)
 * are documented as hand-authored prose in docs/HEADLESS.md. That is exactly where
 * a shipped-but-undocumented feature slips through — an adopter or agent then
 * concludes the capability doesn't exist and hand-rolls an inferior version.
 *
 * This check closes that gap the same way meta-coverage.test.ts does for
 * components: every public runtime export of `@cascivo/core`, plus the named
 * `@cascivo/react` runtime primitives, must appear in the AI-facing concept docs
 * (HEADLESS.md / ENTERPRISE-READINESS.md) — or be listed in ALLOWLIST with a
 * reason. Ship a new primitive → document it or exclude it, consciously.
 *
 * Run with: `pnpm meta:check` (bundled) or directly. Runs in `ready`/CI.
 */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')
const CORE_INDEX = join(REPO_ROOT, 'packages/core/src/index.ts')
const CONCEPT_DOCS = ['docs/HEADLESS.md', 'docs/ENTERPRISE-READINESS.md']

/**
 * Public runtime exports that intentionally need no concept-doc entry. Key: the
 * exported identifier. Value: the reason. Keep this honest — a low-level utility
 * that a builder never reaches for directly is fine to exclude; a stateful hook
 * or a behavior primitive is not.
 */
const ALLOWLIST: Record<string, string> = {
  VERSION: 'package version constant, not a primitive',
  // Raw @preact/signals-react re-exports — the `use*` wrappers are the documented
  // surface; these bare functions are for module-level / non-React use.
  computed: 'raw signal fn; useComputed is the documented React surface',
  effect: 'raw signal fn; useSignalEffect is the documented React surface',
  batch: 'raw signal batching util; implied by signal usage',
  // Generic utilities, not behavior/state primitives.
  cn: 'generic className joiner',
  useMediaQuery: 'thin matchMedia hook',
  useClipboard: 'utility hook (copy to clipboard)',
  useInfiniteScroll: 'utility hook (scroll sentinel)',
  useDraggable: 'utility hook (pointer drag)',
  useResizeObserver: 'utility hook (ResizeObserver wrapper)',
  useMutationObserver: 'utility hook (MutationObserver wrapper)',
  useIntersectionObserver: 'utility hook (IntersectionObserver wrapper)',
  createStreamBuffer: 'streaming buffer util (charts/data plumbing)',
  useStreamBuffer: 'streaming buffer util (charts/data plumbing)',
  ErrorBoundary: 'React error boundary wrapper, not a cascivo behavior primitive',
  SuspenseBoundary: 'React suspense wrapper, not a cascivo behavior primitive',
}

/**
 * `@cascivo/react` runtime primitives (not part of `@cascivo/core`) that the
 * concept docs must also cover — the theme runtime and the form store. These are
 * the surfaces the enterprise-readiness report tripped over.
 */
const REACT_PRIMITIVES = [
  'ThemeProvider',
  'useTheme',
  'setTheme',
  'themePreloadScript',
  'createForm',
  'useForm',
  'Form',
  'field',
]

/** Parse the runtime (non-type) named exports out of `@cascivo/core`'s barrel. */
function coreRuntimeExports(): string[] {
  const src = readFileSync(CORE_INDEX, 'utf8')
  // Remove `export type { … }` blocks so type-only names aren't required in prose.
  const noTypes = src.replace(/export\s+type\s*\{[^}]*\}[^\n]*\n?/g, '')
  const names = new Set<string>()

  for (const m of noTypes.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const raw of (m[1] ?? '').split(',')) {
      const part = raw.trim()
      if (!part || part.startsWith('type ')) continue
      // `X as Y` → the public name is Y.
      const name = part
        .split(/\s+as\s+/)
        .pop()
        ?.trim()
      if (name) names.add(name)
    }
  }
  for (const m of noTypes.matchAll(/export\s+(?:const|function)\s+([A-Za-z0-9_]+)/g)) {
    if (m[1]) names.add(m[1])
  }
  return [...names]
}

function conceptCorpus(): string {
  return CONCEPT_DOCS.map((p) => readFileSync(join(REPO_ROOT, p), 'utf8')).join('\n')
}

function mentions(corpus: string, name: string): boolean {
  return new RegExp(`\\b${name}\\b`).test(corpus)
}

describe('primitive-docs — every shipped primitive is documented for AI/devs', () => {
  it('each @cascivo/core runtime export is in the concept docs or allowlisted', () => {
    const corpus = conceptCorpus()
    const exports = coreRuntimeExports()
    assert.ok(
      exports.length > 20,
      `implausibly few core exports parsed (${exports.length}) — parser broken?`,
    )

    const undocumented = exports.filter(
      (name) => ALLOWLIST[name] === undefined && !mentions(corpus, name),
    )
    assert.deepEqual(
      undocumented,
      [],
      `@cascivo/core exports missing from ${CONCEPT_DOCS.join(' / ')} ` +
        `(document them there, or add an ALLOWLIST entry with a reason):\n  ${undocumented.join('\n  ')}`,
    )
  })

  it('the @cascivo/react theme + form primitives are in the concept docs', () => {
    const corpus = conceptCorpus()
    const missing = REACT_PRIMITIVES.filter((name) => !mentions(corpus, name))
    assert.deepEqual(
      missing,
      [],
      `@cascivo/react runtime primitives missing from the concept docs: ${missing.join(', ')}`,
    )
  })

  it('allowlist has no stale entries (all still exported by @cascivo/core)', () => {
    const exported = new Set(coreRuntimeExports())
    const stale = Object.keys(ALLOWLIST).filter((name) => name !== 'VERSION' && !exported.has(name))
    assert.deepEqual(
      stale,
      [],
      `ALLOWLIST names no longer exported by @cascivo/core: ${stale.join(', ')}`,
    )
  })
})
