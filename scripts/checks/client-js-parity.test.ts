/**
 * `clientJs` parity guard.
 *
 * `ComponentMeta.clientJs` records how much client JavaScript a component needs to be
 * correct, so an agent reading `registry.json` can weigh a component's runtime cost and
 * tell which components render from a Server Component without ever hydrating.
 *
 * Only the `'none'` boundary is machine-checkable, and this guard checks exactly that,
 * in both directions:
 *
 *   1. a manifest claiming `clientJs: 'none'` whose source uses a client-only React API,
 *      a signal primitive, or a DOM handler → fail (the claim is false);
 *   2. a component whose source scans clean but whose manifest claims `'enhancement'` or
 *      `'required'` → fail (the claim understates it, and the free RSC win is lost).
 *
 * `'enhancement'` vs `'required'` is deliberately NOT decided here, but the definition is
 * fixed, because the two halves of this docstring used to disagree and the catalog was
 * labelled against both. The test is **function-based, not content-based**:
 *
 *   `'enhancement'` — the component still does its job with JS off. JS adds polish.
 *                     `Toc` renders real anchors; `TimePicker` wraps a native time input;
 *                     a chart's server HTML carries the SVG *and* the accessible data table.
 *   `'required'`    — the component's primary job needs JS, even when its markup is all
 *                     there. `Calendar` server-renders the whole month grid and cannot pick
 *                     a date; `Tabs` renders one panel and cannot reach the others;
 *                     `OverflowMenu` has its items in the HTML, hidden and inert.
 *
 * Content-based was the older reading and it is the optimistic one: it would call all four
 * of those `'enhancement'`, and an adopter trusting that would ship a dead Calendar. The
 * field exists to answer "can I render this from a Server Component and never hydrate?",
 * so it answers that.
 *
 * Third rule, which follows from the first: a `clientJs: 'none'` component must not declare
 * `'use client'`. The directive is copied verbatim into adopter projects by
 * `cascivo add` (packages/cli/src/commands/add.ts), where it makes a purely static component
 * a client boundary for nothing. It buys nothing on the npm path either — the
 * `output.banner` in packages/react/vite.config.ts stamps the directive onto every chunk
 * regardless of what the source says.
 *
 * Run with: `pnpm meta:check` (or directly via node --test).
 */

import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')
const PACKAGES = join(REPO_ROOT, 'packages')

/**
 * React APIs that are unavailable under the `react-server` export condition, plus the
 * `@cascivo/core` signal primitives. Verified against react@19.2.7: `forwardRef`, `memo`,
 * `useId` and `use` ARE exported there, so they do not disqualify a component.
 */
const CLIENT_ONLY =
  /\b(useState|useEffect|useLayoutEffect|useReducer|useContext|createContext|useSignal\w*|useComputed|useMachine|useRef|useSignals|useControllableSignal|useEffectPropSignal|useRovingFocus|useTypeahead|useSyncExternalStore|useMemo|useCallback|useTransition|useDeferredValue)\b/

/** A DOM event handler binding or direct DOM access — both require a browser. */
const DOM_USE =
  /\bon[A-Z][A-Za-z]*\s*=\{|addEventListener|\.showModal\(|showPopover|requestAnimationFrame|document\.|window\./

const USE_CLIENT = /^\s*'use client';?\s*$/

/** Recursively collect `*.meta.ts` manifests, skipping build output. */
function collectMetas(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'dist' || entry.name === 'node_modules') continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...collectMetas(full))
    else if (entry.name.endsWith('.meta.ts')) out.push(full)
  }
  return out
}

/** The component sources a manifest describes — its directory's non-test, non-story TSX. */
function componentSources(metaPath: string): string[] {
  const dir = join(metaPath, '..')
  return readdirSync(dir)
    .filter((f) => f.endsWith('.tsx') && !f.includes('.test.') && !f.includes('.stories.'))
    .map((f) => join(dir, f))
}

/**
 * Import lines and type-only declarations name hooks they never call (`import type { Ref }`,
 * `onChange?: (v: string) => void` in an interface), so strip them before scanning.
 */
function scannableBody(source: string): string {
  return source
    .split('\n')
    .filter((l) => {
      const t = l.trim()
      return (
        !t.startsWith('import ') &&
        !t.startsWith('export type') &&
        !t.startsWith('export interface')
      )
    })
    .join('\n')
}

interface Subject {
  name: string
  metaPath: string
  declared: string | undefined
  needsClient: boolean
  directiveFiles: string[]
}

function loadSubjects(): Subject[] {
  return collectMetas(PACKAGES).flatMap((metaPath) => {
    const sources = componentSources(metaPath)
    if (sources.length === 0) return []
    const declared = /^\s*clientJs:\s*'(none|enhancement|required)'/m.exec(
      readFileSync(metaPath, 'utf8'),
    )?.[1]
    let needsClient = false
    const directiveFiles: string[] = []
    for (const file of sources) {
      const raw = readFileSync(file, 'utf8')
      const body = scannableBody(raw)
      if (CLIENT_ONLY.test(body) || DOM_USE.test(body)) needsClient = true
      if (USE_CLIENT.test(raw.split('\n')[0] ?? ''))
        directiveFiles.push(file.slice(REPO_ROOT.length + 1))
    }
    return [
      {
        name: metaPath.split('/').at(-1)!.replace('.meta.ts', ''),
        metaPath: metaPath.slice(REPO_ROOT.length + 1),
        declared,
        needsClient,
        directiveFiles,
      },
    ]
  })
}

describe('clientJs parity', () => {
  const subjects = loadSubjects()

  it('finds manifests to check', () => {
    assert.ok(subjects.length > 100, `expected the full catalog, got ${subjects.length}`)
  })

  it("no component claims clientJs: 'none' while using client-only APIs", () => {
    const liars = subjects
      .filter((s) => s.declared === 'none' && s.needsClient)
      .map((s) => `${s.name} (${s.metaPath})`)
    assert.deepEqual(
      liars,
      [],
      `Manifest claims clientJs: 'none' but the source needs a browser:\n  ${liars.join('\n  ')}`,
    )
  })

  it("no component understates itself — a clean source must declare clientJs: 'none'", () => {
    const understated = subjects
      .filter((s) => !s.needsClient && s.declared !== undefined && s.declared !== 'none')
      .map((s) => `${s.name} declares '${s.declared}' (${s.metaPath})`)
    assert.deepEqual(
      understated,
      [],
      `Source uses no client-only API, so clientJs must be 'none':\n  ${understated.join('\n  ')}`,
    )
  })

  it("a clientJs: 'none' component does not ship a 'use client' directive", () => {
    const offenders = subjects
      .filter((s) => s.declared === 'none' && s.directiveFiles.length > 0)
      .flatMap((s) => s.directiveFiles)
    assert.deepEqual(
      offenders,
      [],
      `clientJs: 'none' but declares 'use client' — pure cost on the copy-paste path:\n  ${offenders.join('\n  ')}`,
    )
  })
})
