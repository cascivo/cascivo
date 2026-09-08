/**
 * The conformance lint, run against real rendered output.
 *
 * The important assertion is the last one: a fixture built only from these primitives must
 * produce **no blocked finding**. That is the whole point of the primitive set — if it can
 * be composed into something Outlook Windows cannot render, the set is wrong.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { PasswordReset, Receipt, Welcome } from '../templates/index.ts'
import { EMAIL_THEMES } from '../tokens/palettes.generated.ts'
import { renderEmail } from '../render/render.tsx'
import { CASCIVO_ALLOW, lint } from './lint.ts'
import { indexFeatures, type CanIEmailData } from './support.ts'

const data = JSON.parse(
  readFileSync(new URL('../../../../scripts/email/vendor/caniemail.json', import.meta.url), 'utf8'),
) as CanIEmailData
const features = indexFeatures(data)

/**
 * The shipped templates, not a hand-made subset.
 *
 * An earlier revision linted a fixture built from five primitives and reported the set
 * clean, while the real templates carried five blocked findings — `Spacer`'s CSS height and
 * four properties in `Preview`'s hide, none of which the fixture used. A conformance check
 * that does not lint what actually ships is not a conformance check.
 */
const TEMPLATES = [
  ['welcome', <Welcome />],
  ['password-reset', <PasswordReset />],
  ['receipt', <Receipt />],
] as const

describe('lint — detects what it should', () => {
  it('blocks a custom property', () => {
    const findings = lint('<div style="color:var(--x)"></div>', features)
    expect(findings.some((f) => f.slug === 'css-variables' && f.level === 'blocked')).toBe(true)
  })

  it('blocks flex layout', () => {
    const findings = lint('<div style="display:flex;gap:8px"></div>', features)
    expect(findings.some((f) => f.slug === 'css-display-flex' && f.level === 'blocked')).toBe(true)
    expect(findings.some((f) => f.slug === 'css-gap' && f.level === 'blocked')).toBe(true)
  })

  it('blocks oklch and rem', () => {
    const findings = lint('<div style="color:oklch(0.5 0.1 20);font-size:1rem"></div>', features)
    expect(findings.some((f) => f.slug === 'css-modern-color' && f.level === 'blocked')).toBe(true)
    expect(findings.some((f) => f.slug === 'css-unit-rem' && f.level === 'blocked')).toBe(true)
  })

  it('blocks svg', () => {
    const findings = lint('<svg viewBox="0 0 1 1"></svg>', features)
    expect(findings.some((f) => f.slug === 'html-svg' && f.level === 'blocked')).toBe(true)
  })

  it('reads declarations inside a <style> block too', () => {
    const findings = lint('<style>.a{display:grid}</style>', features)
    expect(findings.some((f) => f.slug === 'css-display-grid' && f.level === 'blocked')).toBe(true)
  })

  it('stays silent about foundational HTML the matrix never tested', () => {
    const findings = lint('<td></td><a href="#"></a><h1></h1>', features)
    expect(findings.map((f) => f.slug)).not.toContain('html-td')
  })

  it('honours the allowlist', () => {
    const findings = lint('<div style="display:flex"></div>', features, {
      allow: { 'css-display-flex': 'fixture' },
    })
    expect(findings.some((f) => f.slug === 'css-display-flex')).toBe(false)
  })

  it('ignores markup inside an Outlook conditional comment', () => {
    // The content of `<!--[if mso]>` is Outlook-only by construction, so the floor's
    // other clients never see it and must not be consulted about it.
    const findings = lint('<!--[if mso]><v:roundrect></v:roundrect><![endif]-->', features)
    expect(findings).toEqual([])
  })
})

describe('lint — every shipped template is clean', () => {
  it('produces no blocked finding, in any template, in any theme', () => {
    for (const [name, element] of TEMPLATES) {
      for (const theme of EMAIL_THEMES) {
        const out = lint(renderEmail(element, { theme }).html, features, { allow: CASCIVO_ALLOW })
        const blocked = out.filter((f) => f.level === 'blocked')
        expect(
          blocked,
          `${name} / ${theme}: ${blocked.map((f) => `${f.slug} (${f.source})`).join(', ')}`,
        ).toEqual([])
      }
    }
  })

  it('allows nothing without a written reason', () => {
    // The allowlist is the one place the lint can be weakened, so it may not grow silently.
    for (const [slug, reason] of Object.entries(CASCIVO_ALLOW)) {
      expect(reason.length, `${slug} has no real reason`).toBeGreaterThan(60)
    }
  })

  it('still blocks border-radius when the allowlist is not passed', () => {
    // Proves the finding is real and the allowlist is a deliberate waiver, not a bug.
    const out = lint(renderEmail(<Welcome />, { theme: 'light' }).html, features)
    expect(out.some((f) => f.slug === 'css-border-radius' && f.level === 'blocked')).toBe(true)
  })

  it('reports its caveats, so the constraints stay visible', () => {
    // Not an assertion about a number — a record that the caveats are surfaced at all.
    const findings = lint(renderEmail(<Welcome />, { theme: 'light' }).html, features, {
      allow: CASCIVO_ALLOW,
    })
    const caveats = findings.filter((f) => f.level === 'caveat')
    expect(caveats.length).toBeGreaterThan(0)
    for (const c of caveats) expect(c.clients.length).toBeGreaterThan(0)
  })
})
