/**
 * Muted text clears WCAG 2.2 AA on every surface it is rendered on, in every theme.
 *
 * `--cascivo-color-text-muted` drives hint text, captions, timestamps, table secondary
 * columns and form help across roughly eighteen components. It is the least legible ink in
 * the system by design, which is exactly why it needs a floor.
 *
 * It did not have one. Eight of the twelve shipped themes failed AA against their own
 * background — pastel at 2.6:1, terminal 3.0:1, minimal 3.1:1 — and worse against
 * `surface-2` (pastel 2.37:1). The existing guards did not cover it: `accent-text-contrast`
 * checks the accent used as type, and nothing checked the muted ink at all. The gap surfaced
 * only when the email target resolved the palettes to sRGB and measured them
 * (`docs/specs/email-target.md` §11.2).
 *
 * The fix adjusted lightness only, leaving hue and chroma alone so no theme changed
 * character. This guard is what keeps it fixed.
 *
 * Run: `pnpm muted-text:check` (part of `pnpm ready`).
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { contrastRatio, parseOklch } from './color/contrast.ts'

const REPO_ROOT = join(import.meta.dirname, '../..')
const THEME_DIR = join(REPO_ROOT, 'packages/themes/src')

/** WCAG 2.2 AA for normal-size text. */
const AA = 4.5

/**
 * Surfaces muted text is actually rendered on.
 *
 * Checking only `background` is what let this ship: a caption inside a `Card` sits on
 * `surface`, and a nested one on `surface-2`, which is the tightest of the three.
 */
const SURFACES = [
  '--cascivo-color-background',
  '--cascivo-color-surface',
  '--cascivo-color-surface-2',
] as const

/** Aggregates and adapters, not palettes. */
const NOT_A_THEME = new Set(['all.css', 'base.css', 'light-dark.css', 'tailwind.css'])

function themeFiles(): string[] {
  return readdirSync(THEME_DIR)
    .filter((f) => f.endsWith('.css') && !NOT_A_THEME.has(f))
    .sort()
}

/**
 * The last **plain** `oklch()` literal declared for `name`.
 *
 * Themes declare a colour twice on purpose — a static literal, then a relative-colour form
 * for browsers that support it. Only the static one is resolvable without a browser, and
 * the two are the same colour. Mirrors `accent-text-contrast.test.ts`.
 */
function literal(css: string, name: string): string | null {
  const re = new RegExp(`${name}:\\s*(oklch\\([^;]*\\))`, 'g')
  let last: string | null = null
  let m: RegExpExecArray | null
  while ((m = re.exec(css)) !== null) {
    if (!/\bfrom\b|var\(/.test(m[1]!)) last = m[1]!
  }
  return last
}

describe('muted text contrast', () => {
  for (const file of themeFiles()) {
    const css = readFileSync(join(THEME_DIR, file), 'utf8')
    const muted = literal(css, '--cascivo-color-text-muted')

    for (const surface of SURFACES) {
      const bg = literal(css, surface)

      it(`${file}: muted text on ${surface.replace('--cascivo-color-', '')}`, () => {
        if (!muted || !bg) {
          // A theme that does not restate the token inherits a checked one; nothing to test.
          return
        }
        const ratio = contrastRatio(parseOklch(muted), parseOklch(bg))
        assert.ok(
          ratio >= AA,
          `${file}: --cascivo-color-text-muted is ${ratio.toFixed(2)}:1 on ${surface}, needs ${AA}:1. ` +
            'Adjust the lightness of the muted token in this theme — leave hue and chroma alone ' +
            'so the theme keeps its character.',
        )
      })
    }
  }
})
