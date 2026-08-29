/**
 * Container-query preference guard.
 *
 * `CLAUDE.md` says: "Prefer `@container` (component adapts to its slot) over `@media`
 * (viewport) wherever a component can live in arbitrary containers." A viewport width query
 * inside a component is a bet that the component is as wide as the window — and the moment
 * an adopter drops it into a sidebar, a split pane, or a `Grid` cell, the bet is wrong and
 * the component styles itself for a width it does not have.
 *
 * The bet is sometimes correct. A `<dialog>` in the top layer, a fixed bottom `Dock`, a
 * portalled `Toast` and `AppShell`'s drawer breakpoint really are viewport-scoped: nothing
 * contains them, so `@container` would match nothing at all. `toast.module.css` records
 * exactly that in a comment, having shipped the container version first and found it never
 * matched.
 *
 * So this guard does not ban viewport queries. It bans **undeclared** ones: every width
 * `@media` in `packages/components` or `packages/layouts` must carry a
 * `viewport-query: <reason>` comment above it saying why the viewport is the right axis.
 * The reason a rule exists then lives beside the rule instead of being re-derived — or,
 * more often, not re-derived — by the next person to touch the file.
 *
 * Run: `pnpm container-preference:check` (part of `pnpm meta:check`).
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname, relative } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')

/** Roots whose CSS ships inside a component and can therefore land in any container. */
const ROOTS = ['packages/components/src', 'packages/layouts/src']

/** How far above the `@media` the marker may sit, in lines. Enough for a wrapped comment. */
const MARKER_LOOKBEHIND = 12

const MARKER = /viewport-query:\s*\S/

function collectCssFiles(dir: string): string[] {
  const out: string[] = []
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === 'dist') continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...collectCssFiles(full))
    else if (extname(entry) === '.css') out.push(full)
  }
  return out
}

interface Violation {
  file: string
  line: number
  text: string
}

export function scanUndeclaredViewportQueries(source: string, filename: string): Violation[] {
  const lines = source.split('\n')
  const out: Violation[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    // Only width conditions. `(pointer: coarse)`, `(forced-colors: active)`,
    // `(prefers-reduced-motion: …)` and friends have no container equivalent and are never
    // a slot-vs-viewport question.
    if (!/^\s*@media\b/.test(line)) continue
    if (!/\b(min-width|max-width|width\s*[<>=])/.test(line)) continue

    const from = Math.max(0, i - MARKER_LOOKBEHIND)
    const preceding = lines.slice(from, i).join('\n')
    if (MARKER.test(preceding) || MARKER.test(line)) continue

    out.push({ file: filename, line: i + 1, text: line.trim() })
  }
  return out
}

describe('container-query preference', () => {
  it('every width @media in a component declares why the viewport is the right axis', () => {
    const violations: Violation[] = []
    for (const root of ROOTS) {
      for (const file of collectCssFiles(join(REPO_ROOT, root))) {
        violations.push(
          ...scanUndeclaredViewportQueries(readFileSync(file, 'utf8'), relative(REPO_ROOT, file)),
        )
      }
    }

    assert.deepEqual(
      violations.map((v) => `${v.file}:${v.line}  ${v.text}`),
      [],
      'A width @media inside a component styles it for the window, not for the slot it was ' +
        'dropped into. Convert it to @container, or — if the element genuinely has no ' +
        'container (top layer, fixed, portalled) — add a `viewport-query: <reason>` comment ' +
        'above it.',
    )
  })
})
