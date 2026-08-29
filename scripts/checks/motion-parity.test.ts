/**
 * Motion parity — the half `audit:animation` structurally cannot check.
 *
 * The audit reads source. These two invariants can only be seen in what an adopter actually
 * installs, or across the catalogue as a whole.
 *
 * 1. **Built aggregates resolve every keyframe they reference.**
 *    `@cascivo/react` does not import `styles.css`; it *assembles* it from a hand-listed set
 *    of token files and then strips every `@import`. So `tokens/index.css`'s
 *    `@import './motion.css'` vanished, and the aggregate shipped component CSS whose
 *    `animation: global(cascivo-…)` references pointed at keyframes that were not in the
 *    file. Nothing failed: an unresolved `animation-name` is not an error in CSS, in
 *    Rolldown, or in `check-styles-complete`. Every animation in the package was simply
 *    dead, and the build was green. Source-level checks cannot see this, because in source
 *    the import is right there.
 *
 * 2. **A component that owns a state has the motion for it.**
 *    The catalogue-wide sweep, in the shape of `ref-parity` / `axis-parity`: a disclosure
 *    control that rotates a chevron should transition it, not snap it. Six components
 *    rotate one and they did it two different ways (`rotate:` vs `transform: rotate()`),
 *    some with no transition at all.
 *
 * Invariant 1 needs `dist/`, and skips cleanly when it is absent so the pre-build stages of
 * `pnpm ready` stay runnable.
 *
 * Run: `pnpm motion:check`.
 */

import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')

/** Built stylesheets an adopter can import as a single file. */
const AGGREGATES = ['packages/react/dist/styles.css', 'packages/charts/dist/styles.css']

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, ' ')
}

function definedKeyframes(css: string): Set<string> {
  return new Set([...stripComments(css).matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]!))
}

/**
 * Keyframe names referenced from `animation` / `animation-name` in a BUILT sheet. By this
 * point `global()` is gone and CSS-Modules names are hashed, so anything that survives as a
 * bare `cascivo-*` identifier was meant to resolve against the shared catalogue.
 */
function referencedKeyframes(css: string): Set<string> {
  const out = new Set<string>()
  for (const decl of stripComments(css).matchAll(/animation(?:-name)?\s*:([^;{}]*)/g)) {
    for (const m of decl[1]!.matchAll(/(?<![\w-])(cascivo-[\w-]+)(?![\w-])/g)) out.add(m[1]!)
  }
  return out
}

describe('motion:check — built aggregates resolve their keyframes', () => {
  for (const rel of AGGREGATES) {
    const file = join(REPO_ROOT, rel)
    it(`${rel}: every referenced keyframe is defined in the same sheet`, (t) => {
      if (!existsSync(file)) {
        t.skip(`${rel} not built — run pnpm build`)
        return
      }
      const css = readFileSync(file, 'utf8')
      const referenced = referencedKeyframes(css)
      const defined = definedKeyframes(css)
      const missing = [...referenced].filter((name) => !defined.has(name)).sort()
      assert.deepEqual(
        missing,
        [],
        `${rel} references keyframes it does not define: ${missing.join(', ')}.\n` +
          `An unresolved animation-name is not an error anywhere — the animation just never\n` +
          `runs. This sheet is assembled from an explicit file list with @import stripped, so\n` +
          `packages/tokens/src/motion.css must be listed in it (see packages/react/vite.config.ts).`,
      )
    })
  }
})

/** Component stylesheets, keyed by component name. */
function componentCss(): Map<string, { rel: string; css: string }> {
  const roots = ['packages/components/src', 'packages/layouts/src']
  const out = new Map<string, { rel: string; css: string }>()
  for (const root of roots) {
    const dir = join(REPO_ROOT, root)
    for (const entry of readdirSync(dir)) {
      const file = join(dir, entry, `${entry}.module.css`)
      if (!statSync(join(dir, entry)).isDirectory() || !existsSync(file)) continue
      out.set(entry, {
        rel: relative(REPO_ROOT, file).split(sep).join('/'),
        css: readFileSync(file, 'utf8'),
      })
    }
  }
  return out
}

/**
 * `rotate: 180deg` and `transform: rotate(180deg)` are different properties and do not
 * compose the same way, so a component using one cannot be transitioned by a rule targeting
 * the other. The catalogue standardises on the `rotate` longhand.
 */
const HALF_TURN = /(?:^|[;{])\s*rotate\s*:\s*(?:180deg|0\.5turn)/m
const HALF_TURN_TRANSFORM = /transform\s*:\s*rotate\(\s*(?:180deg|0\.5turn)\s*\)/

describe('motion:check — a rotated disclosure indicator is transitioned', () => {
  const components = componentCss()

  it('no component expresses a half-turn via `transform: rotate()`', () => {
    const offenders: string[] = []
    for (const [, { rel, css }] of components) {
      if (HALF_TURN_TRANSFORM.test(stripComments(css))) offenders.push(`  ${rel}`)
    }
    assert.deepEqual(
      offenders,
      [],
      `use the \`rotate:\` longhand, not \`transform: rotate()\`, for a half-turn indicator.\n` +
        `They are separate properties: a transition on one does not animate the other, and a\n` +
        `component mixing them cannot inherit a shared rule.\n${offenders.join('\n')}`,
    )
  })

  it('every half-turn indicator transitions its rotation', () => {
    const offenders: string[] = []
    for (const [, { rel, css }] of components) {
      const clean = stripComments(css)
      if (!HALF_TURN.test(clean)) continue
      if (/transition[^;{}]*\brotate\b/.test(clean)) continue
      offenders.push(`  ${rel}`)
    }
    assert.deepEqual(
      offenders,
      [],
      `these components flip an indicator 180° with no transition, so it snaps:\n` +
        `${offenders.join('\n')}\n` +
        `  fix: transition: rotate var(--cascivo-duration-150) var(--cascivo-ease-out);`,
    )
  })
})
