/**
 * The accent is defined for a FILL. Using it as TYPE is a separate contract.
 *
 * `--cascivo-color-accent` is what a button, a chip or a highlight is painted
 * with, and a theme is free to pick a hue that only works that way. Four of the
 * shipped themes do — warm's amber reads 2.1:1 as text on its own background,
 * pastel's pink 3.0, brutalist's acid 1.3. Twenty declarations across the
 * catalogue nevertheless read the fill hue directly as `color:` — Link, Prose's
 * links, TOC's current entry, SideNav's checkmark, ProgressIndicator's current
 * step, Combobox's selected option, and more. On those themes every one of them
 * was unreadable, and no theme had a lever to correct it.
 *
 * `--cascivo-color-accent-text` (and its `-hover` sibling) are that lever. They
 * default to the accent, so a theme whose accent already reads as type needs to
 * say nothing; a fill-accent theme restates them once.
 *
 * This guard is the reason the default is safe to keep: whatever a theme sets
 * its accent to, the ink that gets used AS TYPE has to clear WCAG AA against
 * that theme's own background and surface. A theme that picks a fill hue and
 * forgets to restate these two fails here rather than in an adopter's product.
 *
 * Run: `pnpm accent-text:check` (also part of `pnpm ready`).
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

/** Theme files that are palettes; `all.css` is a bundle and layers.css is order. */
function themeFiles(): string[] {
  return readdirSync(THEME_DIR)
    .filter((f) => f.endsWith('.css') && f !== 'all.css')
    .sort()
}

/**
 * Resolve `name` inside `block` to a literal `oklch()`.
 *
 * Themes declare a colour more than once on purpose: a static `oklch(l c h)`
 * fallback immediately followed by the relative-colour form
 * `oklch(from var(--…) l c h)` for browsers that support it. The two are the
 * same colour, and only the static one is resolvable without a browser, so the
 * last PLAIN literal is what this reads. One level of `var(--cascivo-…)`
 * indirection is followed within the same block, which is how a theme points
 * one role at another (brutalist's accent-text at its destructive ink).
 */
function declared(block: string, name: string, depth = 0): string | undefined {
  const matches = [...block.matchAll(new RegExp(`${name}\\s*:\\s*([^;]+);`, 'g'))]
  for (const m of matches.reverse()) {
    const raw = m[1]!.trim()
    if (/^oklch\(\s*[\d.]/i.test(raw)) return raw
    const ref = depth < 2 && raw.match(/^var\(\s*(--cascivo-[a-z0-9-]+)\s*\)$/i)
    if (ref) {
      const resolved = declared(block, ref[1]!, depth + 1)
      if (resolved) return resolved
    }
  }
  return undefined
}

interface Theme {
  file: string
  name: string
  block: string
}

function themes(): Theme[] {
  const out: Theme[] = []
  for (const file of themeFiles()) {
    const src = readFileSync(join(THEME_DIR, file), 'utf8')
    // `light.css` opens with `[data-theme='light'], :root {`, so the brace can
    // be separated from the attribute selector by the rest of a selector list.
    for (const m of src.matchAll(/\[data-theme=['"]([\w-]+)['"]\][^{}]*\{/g)) {
      const start = m.index! + m[0].length
      let depth = 1
      let i = start
      while (i < src.length && depth > 0) {
        if (src[i] === '{') depth++
        else if (src[i] === '}') depth--
        i++
      }
      out.push({ file, name: m[1]!, block: src.slice(start, i) })
    }
  }
  return out
}

describe('accent-as-type clears WCAG AA in every theme', () => {
  const all = themes()

  it('finds the shipped themes', () => {
    assert.ok(all.length >= 12, `expected ≥12 theme blocks, found ${all.length}`)
  })

  for (const theme of all) {
    const accent = declared(theme.block, '--cascivo-color-accent')
    const background = declared(theme.block, '--cascivo-color-background')
    const surface = declared(theme.block, '--cascivo-color-surface')
    // A theme that declares none of these literally (a variant that inherits
    // its palette) has nothing to assert here.
    if (!accent || !background) continue

    it(`${theme.name}`, () => {
      // Unset means "the accent is safe as type" — that is the claim under test.
      const text = declared(theme.block, '--cascivo-color-accent-text') ?? accent
      const hover =
        declared(theme.block, '--cascivo-color-accent-text-hover') ??
        declared(theme.block, '--cascivo-color-accent-hover') ??
        text

      for (const [label, ink] of [
        ['--cascivo-color-accent-text', text],
        ['--cascivo-color-accent-text-hover', hover],
      ] as const) {
        for (const [surfaceName, bg] of [
          ['background', background],
          ['surface', surface],
        ] as const) {
          if (!bg) continue
          const ratio = contrastRatio(parseOklch(ink), parseOklch(bg))
          assert.ok(
            ratio >= AA,
            `${theme.name}: ${label} (${ink}) on ${surfaceName} (${bg}) is ${ratio.toFixed(2)}:1, ` +
              `below AA ${AA}. This theme's accent is a fill — restate ` +
              `${label} with a darker step of the same hue.`,
          )
        }
      }
    })
  }
})
