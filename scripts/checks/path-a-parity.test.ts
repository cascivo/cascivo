/**
 * Path A reachability guard — the missing twin of `path-b-parity.test.ts`.
 *
 * `path-b-parity` exists because the docs once named a primitive the PREBUILT path could not
 * reach. Only that direction was ever built, so the identical failure on the COPY-PASTE path
 * went unseen for months: `ThemeProvider` / `useTheme` / `setTheme` / `applyTheme` /
 * `themePreloadScript` were documented in `llms.txt` and `THEMING.md` as the theming answer,
 * and shipped only from `@cascivo/react` — the prebuilt distribution of all 197 components,
 * which a Path A adopter deliberately does not install.
 *
 * Naming the package is not disclosing the constraint. The 2026-08-06 reporter checked all
 * 114 `@cascivo/core` exports, concluded theming was unavailable on the path `cascivo init`
 * configures, and hand-wrote a theme signal, a localStorage writer, the inline no-FOUC
 * preload script, and the `data-theme` + `color-scheme` application.
 *
 * So: every primitive the concept docs name must be importable from `@cascivo/core` — the
 * only cascivo package the copy-paste path installs — or be explicitly listed as Path-B-only
 * AND described as such in prose. That second half is the part that would have caught this:
 * an API being Path-B-only is legitimate; documenting it as universal is not.
 *
 * Run: `pnpm meta:check`.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const CORE_INDEX = join(REPO_ROOT, 'packages/core/src/index.ts')

/**
 * Primitives that genuinely ship only from `@cascivo/react`, with the reason.
 *
 * Every entry must ALSO be described as Path-B-only wherever the docs name it — asserted
 * below. An entry here is a promise to the reader, not a way to silence the guard.
 */
const PATH_B_ONLY: Record<string, string> = {
  createForm: 'Form store — built on the component layer (Field/Form), which Path A copies.',
  useForm: 'See createForm.',
  Form: 'A component, not a primitive: Path A gets it with `cascivo add form`.',
  field: 'See createForm.',
}

/** The theming API specifically — the finding this guard was built from. */
const THEME_API = [
  'ThemeProvider',
  'useTheme',
  'setTheme',
  'themeSignal',
  'applyTheme',
  'themePreloadScript',
]

/**
 * React's own hooks. The docs name these constantly — to FORBID them ("never `useState`,
 * use `useSignal`") — so finding them is expected and says nothing about reachability.
 */
const REACT_OWN = new Set([
  'useState',
  'useEffect',
  'useLayoutEffect',
  'useContext',
  'useReducer',
  'useRef',
  'useMemo',
  'useCallback',
  'useImperativeHandle',
  'useSyncExternalStore',
  'useTransition',
])

/** Primitives that legitimately come from somewhere else, and where. */
const FROM_OTHER_PACKAGE: Record<string, string> = {
  useStreamSeries: '@cascivo/charts — an npm package, reachable on both paths',
  useStreamBuffer: '@cascivo/charts — an npm package, reachable on both paths',
  usePopover: "the Popover component's own source, which `cascivo add popover` copies",
  useToast: "the Toast component's own source, which `cascivo add toast` copies",
  currentLocale: '@cascivo/i18n — an npm package, reachable on both paths',
}

/** Names the concept docs tell an app to use, extracted from the docs themselves. */
function documentedPrimitives(): Map<string, string[]> {
  const found = new Map<string, string[]>()
  const docs = [
    'docs/HEADLESS.md',
    'docs/AI-RULES.md',
    'docs/THEMING.md',
    'apps/site/public/llms.txt',
  ]
  for (const rel of docs) {
    const text = readFileSync(join(REPO_ROOT, rel), 'utf8')
    // Backticked hook identifiers, plus the theme API by name. Deliberately NOT "any
    // lowerCamel identifier": that swept up prop names like `defaultTheme` and turned the
    // guard into noise, which is how a guard gets muted instead of fixed.
    const pattern = new RegExp(`\`(use[A-Z]\\w+|${THEME_API.join('|')})\\b`, 'g')
    for (const m of text.matchAll(pattern)) {
      const name = m[1]!
      if (REACT_OWN.has(name) || name in FROM_OTHER_PACKAGE) continue
      if (!found.has(name)) found.set(name, [])
      if (!found.get(name)!.includes(rel)) found.get(name)!.push(rel)
    }
  }
  return found
}

/** Named exports of `packages/core/src/index.ts` (the only cascivo package Path A installs). */
function coreExportedNames(): Set<string> {
  const src = readFileSync(CORE_INDEX, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
  const names = new Set<string>()
  for (const block of src.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g)) {
    for (const raw of block[1]!.split(',')) {
      const name = raw
        .trim()
        .replace(/^type\s+/, '')
        .split(/\s+as\s+/)
        .pop()
        ?.trim()
      if (name) names.add(name)
    }
  }
  for (const m of src.matchAll(/export\s+(?:function|const|class)\s+(\w+)/g)) names.add(m[1]!)
  return names
}

describe('Path A parity — documented primitives are reachable from @cascivo/core', () => {
  const exported = coreExportedNames()

  it('reads a plausible export list (guards against passing vacuously)', () => {
    assert.ok(
      exported.size > 80,
      `expected @cascivo/core's full export surface, parsed only ${exported.size} names`,
    )
  })

  for (const name of THEME_API) {
    it(`@cascivo/core exports ${name}`, () => {
      assert.ok(
        exported.has(name),
        `The theming docs name \`${name}\` as THE answer, but @cascivo/core does not export ` +
          'it — so a copy-paste-path adopter would have to install @cascivo/react (the ' +
          'prebuilt distribution of every component) just to get a theme signal, or ' +
          'hand-write the provider, the persistence and the no-FOUC script. One did.',
      )
    })
  }

  it('every documented primitive is in @cascivo/core or explicitly Path-B-only', () => {
    const unreachable: string[] = []
    for (const [name, where] of documentedPrimitives()) {
      if (exported.has(name)) continue
      if (name in PATH_B_ONLY) continue
      unreachable.push(`${name} (named in ${where.join(', ')})`)
    }
    assert.deepEqual(
      unreachable,
      [],
      'These are documented as things to use but are not exported by @cascivo/core, the ' +
        'only package the copy-paste path installs. Either export them from core, or add a ' +
        `PATH_B_ONLY entry with a reason AND say so in the doc.\n  ${unreachable.join('\n  ')}`,
    )
  })

  it('every Path-B-only primitive is described as such in the docs that name it', () => {
    // The allowlist is a promise to the reader; this is what keeps it one.
    const silent: string[] = []
    for (const name of Object.keys(PATH_B_ONLY)) {
      for (const rel of ['docs/HEADLESS.md', 'docs/AI-RULES.md', 'docs/THEMING.md']) {
        const text = readFileSync(join(REPO_ROOT, rel), 'utf8')
        if (!new RegExp(`\`${name}\\b`).test(text)) continue
        // The paragraph naming it must also name @cascivo/react.
        const para = text.split(/\n\s*\n/).find((p) => new RegExp(`\`${name}\\b`).test(p)) ?? ''
        if (!para.includes('@cascivo/react')) silent.push(`${name} in ${rel}`)
      }
    }
    assert.deepEqual(
      silent,
      [],
      'These are Path-B-only but the docs that name them never say so, which is exactly how ' +
        `theming read as universal for months.\n  ${silent.join('\n  ')}`,
    )
  })
})

describe('Path A parity — the theming guide states which path each API is on', () => {
  it('THEMING.md names @cascivo/core as the import for the theme runtime', () => {
    const guide = readFileSync(join(REPO_ROOT, 'docs/THEMING.md'), 'utf8')
    assert.ok(
      guide.includes('@cascivo/core'),
      'THEMING.md must tell a copy-paste-path reader where the theme runtime comes from. ' +
        'It previously named only @cascivo/react, which reads as "install 197 components".',
    )
  })
})
