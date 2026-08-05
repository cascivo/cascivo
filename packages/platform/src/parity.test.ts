/**
 * Platform parity guard.
 *
 * The `data-platform` axis is only additive — twelve themes plus N platforms rather than
 * twelve times N — while one invariant holds:
 *
 *   platform owns geometry, motion and interaction affordance;
 *   theme owns colour; neither writes the other's properties.
 *
 * Break it and the axes stop composing: a platform that sets a colour has to be
 * re-authored for every theme, and the matrix becomes the thing this design exists to
 * avoid. `docs/internal/ROADMAP-V59.md` §4.1 states the rule; this file is what makes it
 * true rather than aspirational.
 *
 * Three assertions:
 *   1. every platform file declares exactly the same token set (no platform silently
 *      missing a knob a component will read),
 *   2. no platform file sets any `--cascivo-color-*` / `--cascivo-border-*` property,
 *   3. every platform file lives in `@layer cascivo.platform` and nowhere else.
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'vitest'

const SRC = join(import.meta.dirname)

/** Platform stylesheets, excluding the aggregate bundle which declares nothing itself. */
function platformFiles(): string[] {
  return readdirSync(SRC)
    .filter((f) => f.endsWith('.css') && f !== 'all.css')
    .sort()
}

/** Custom-property names declared in a stylesheet, e.g. `--cascivo-radius-base`. */
function declaredTokens(source: string): string[] {
  return [...source.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gim)].map((m) => m[1]!).sort()
}

describe('platform parity', () => {
  const files = platformFiles()

  it('ships at least one platform', () => {
    assert.ok(files.length > 0, 'no platform stylesheets found in packages/platform/src')
  })

  it('declares an identical token set on every platform', () => {
    const sets = files.map((file) => ({
      file,
      tokens: declaredTokens(readFileSync(join(SRC, file), 'utf8')),
    }))
    const reference = sets[0]!
    for (const entry of sets.slice(1)) {
      const missing = reference.tokens.filter((t) => !entry.tokens.includes(t))
      const extra = entry.tokens.filter((t) => !reference.tokens.includes(t))
      assert.deepEqual(
        { missing, extra },
        { missing: [], extra: [] },
        `${entry.file} does not declare the same tokens as ${reference.file}. ` +
          `Every platform must answer every knob: a component reading a token a platform ` +
          `forgot silently falls back to the tokens tier and looks wrong on that platform only.`,
      )
    }
  })

  it('never sets a colour — that belongs to the theme axis', () => {
    const offenders: string[] = []
    for (const file of files) {
      const source = readFileSync(join(SRC, file), 'utf8')
      for (const token of declaredTokens(source)) {
        if (/^--cascivo-(color|border(?!-radius))/.test(token)) offenders.push(`${file}: ${token}`)
      }
    }
    assert.deepEqual(
      offenders,
      [],
      `A platform stylesheet set a colour property. Platform owns geometry, motion and ` +
        `affordance only; colour is the theme axis (packages/themes). Setting colour here ` +
        `would force the platform to be re-authored per theme and collapse the two axes ` +
        `into a matrix. See docs/internal/ROADMAP-V59.md §4.1.`,
    )
  })

  it('puts every rule in @layer cascivo.platform', () => {
    for (const file of files) {
      const source = readFileSync(join(SRC, file), 'utf8')
      const layers = [...source.matchAll(/@layer\s+([a-zA-Z0-9_.-]+)\s*\{/g)].map((m) => m[1])
      assert.deepEqual(
        [...new Set(layers)],
        ['cascivo.platform'],
        `${file} must place all of its rules in @layer cascivo.platform`,
      )
    }
  })
})
