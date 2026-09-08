/**
 * The resolved email palettes stay complete, literal, and accessible.
 *
 * This is the guard `docs/specs/email-target.md` §9.1 names as the most likely way to ship
 * a real defect from the token work. The repo's existing contrast guards assert against
 * **oklch lightness values**; the email target resolves those to sRGB and gamut-maps them,
 * which can move a colour enough to drop it below AA. Nothing else in the tree looks at the
 * resolved hex, so without this a palette could fail WCAG while `pnpm ready` stayed green.
 *
 * Three things are asserted:
 *   1. Every theme resolves, with no `oklch()`, `var()` or `color-mix()` surviving.
 *   2. The generated file is current — regenerating produces no diff.
 *   3. Body and muted text clear WCAG 2.2 AA against the surfaces they are used on.
 *
 * **On the baseline.** Eight themes ship a `--cascivo-color-text-muted` that already fails
 * AA against their own background — pastel 2.6:1, terminal 3.0:1, minimal 3.1:1, and so on.
 * That is not a conversion artifact: `scripts/checks/color/contrast.ts`, reading the oklch
 * source directly with an independent implementation, agrees to within 0.02. It is
 * pre-existing debt in the themes, visible in the web product today, and fixing it means
 * changing eight palettes and their visual baselines — a design decision, not an email one.
 *
 * So those pairs are recorded in `MUTED_BASELINE` with their measured ratio, and this guard
 * blocks anything *worse* or *new* while leaving the known state visible. Remove an entry
 * when its theme is fixed; the guard fails if a recorded pair starts passing, so the
 * baseline cannot rot into a permanent excuse.
 *
 * Run: `pnpm email:tokens:check`.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { contrastRatio, toHex, type Rgb } from '../../packages/email/src/tokens/color.ts'
import { PALETTES, EMAIL_THEMES } from '../../packages/email/src/tokens/palettes.generated.ts'
import { buildPalette } from '../../packages/email/src/tokens/resolve.ts'

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const TOKENS_CSS = join(REPO_ROOT, 'packages/tokens/src/index.css')

/** `#rgb` / `#rrggbb` → an {@link Rgb}. Palette colours are always opaque by construction. */
function parseHex(hex: string): Rgb | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const h = m[1]!
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
    alpha: 1,
  }
}

/**
 * Text/background pairs every theme must get right, as WCAG 2.2 AA minimums.
 *
 * Only pairs the email primitives actually put on screen are listed. A token pair that no
 * template renders would be a contrast assertion about nothing.
 */
const CONTRAST_PAIRS: { fg: string; bg: string; min: number; what: string }[] = [
  {
    fg: '--cascivo-color-foreground',
    bg: '--cascivo-color-background',
    min: 4.5,
    what: 'body text',
  },
  {
    fg: '--cascivo-color-text-muted',
    bg: '--cascivo-color-background',
    min: 4.5,
    what: 'muted text',
  },
  {
    fg: '--cascivo-color-foreground',
    bg: '--cascivo-color-surface',
    min: 4.5,
    what: 'text on a card',
  },
  {
    fg: '--cascivo-color-text-on-accent',
    bg: '--cascivo-color-accent',
    min: 4.5,
    what: 'button label',
  },
  {
    fg: '--cascivo-color-text-on-destructive',
    bg: '--cascivo-color-destructive',
    min: 4.5,
    what: 'destructive button label',
  },
  /*
   * `--cascivo-color-accent-text`, NOT `--cascivo-color-accent`. The accent is defined for
   * a FILL; four shipped themes pick a hue that only works that way (warm's amber reads
   * 2.1:1 as type, brutalist's acid 1.3:1), and `-accent-text` is the lever those themes
   * restate. `scripts/checks/accent-text-contrast.test.ts` carries the full account —
   * reading the fill token here would report a theme bug that does not exist.
   */
  {
    fg: '--cascivo-color-accent-text',
    bg: '--cascivo-color-background',
    min: 4.5,
    what: 'link text',
  },
]

describe('email palettes — completeness', () => {
  it('ships one palette per shipped theme', () => {
    assert.equal(EMAIL_THEMES.length, 12, 'expected the twelve themes @cascivo/themes lists')
  })

  it('resolves every value to a literal', () => {
    for (const theme of EMAIL_THEMES) {
      for (const [name, value] of Object.entries(PALETTES[theme])) {
        for (const banned of ['oklch(', 'var(--', 'color-mix(', 'contrast-color(']) {
          assert.ok(
            !value.includes(banned),
            `${theme} ${name} still contains ${banned} — no email client resolves it: ${value}`,
          )
        }
      }
    }
  })

  it('defines the tokens the email primitives read', () => {
    const required = [
      '--cascivo-color-background',
      '--cascivo-color-foreground',
      '--cascivo-color-surface',
      '--cascivo-color-border',
      '--cascivo-color-accent',
      '--cascivo-color-accent-text',
      '--cascivo-color-text-muted',
      '--cascivo-color-text-on-accent',
      '--cascivo-color-destructive',
    ]
    for (const theme of EMAIL_THEMES) {
      for (const token of required) {
        assert.ok(PALETTES[theme][token], `${theme} is missing ${token}`)
      }
    }
  })
})

describe('email palettes — freshness', () => {
  it('regenerates byte-identically from the theme CSS', () => {
    const tokensCss = readFileSync(TOKENS_CSS, 'utf8')
    for (const theme of EMAIL_THEMES) {
      const themeCss = readFileSync(join(REPO_ROOT, 'packages/themes/src', `${theme}.css`), 'utf8')
      const fresh = buildPalette(tokensCss, themeCss)
      assert.deepEqual(
        { ...PALETTES[theme] },
        fresh,
        `${theme} is stale — run \`pnpm email:palettes:generate\` and commit the result`,
      )
    }
  })
})

/**
 * Themes whose muted text already fails AA in the shipped oklch source, with the ratio
 * measured at the time of recording. Pre-existing product debt — see the header.
 */
const MUTED_BASELINE: Record<string, number> = {
  dark: 4.15,
  warm: 3.34,
  minimal: 3.07,
  midnight: 3.53,
  pastel: 2.62,
  corporate: 3.13,
  terminal: 2.97,
  cyberpunk: 3.94,
}

describe('email palettes — WCAG 2.2 AA after sRGB resolution', () => {
  for (const theme of EMAIL_THEMES) {
    for (const pair of CONTRAST_PAIRS) {
      const baseline = pair.what === 'muted text' ? MUTED_BASELINE[theme] : undefined

      it(`${theme}: ${pair.what} ${baseline === undefined ? `clears ${pair.min}:1` : `holds its ${baseline}:1 baseline`}`, () => {
        const palette = PALETTES[theme] as Record<string, string>
        const fg = parseHex(palette[pair.fg] ?? '')
        const bg = parseHex(palette[pair.bg] ?? '')
        assert.ok(fg, `${theme} ${pair.fg} is not an opaque hex: ${palette[pair.fg]}`)
        assert.ok(bg, `${theme} ${pair.bg} is not an opaque hex: ${palette[pair.bg]}`)
        const ratio = contrastRatio(fg, bg)

        if (baseline === undefined) {
          assert.ok(
            ratio >= pair.min,
            `${theme}: ${pair.what} is ${ratio.toFixed(2)}:1 (${toHex(fg)} on ${toHex(bg)}), needs ${pair.min}:1. ` +
              'The oklch source may pass while the gamut-mapped sRGB does not — adjust the theme, not this threshold.',
          )
          return
        }

        // Recorded as failing. It may improve, but never regress, and once it clears AA
        // the entry must go — otherwise the baseline outlives the debt it documents.
        assert.ok(
          ratio >= baseline - 0.01,
          `${theme}: ${pair.what} regressed to ${ratio.toFixed(2)}:1 from a recorded ${baseline}:1`,
        )
        assert.ok(
          ratio < pair.min,
          `${theme}: ${pair.what} now clears AA at ${ratio.toFixed(2)}:1 — remove it from MUTED_BASELINE`,
        )
      })
    }
  }
})
