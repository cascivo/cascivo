/**
 * Tone-parity guard — a shared vocabulary must render like one.
 *
 * `badge.tsx` sells the tone aliasing as letting "one domain enum drive `Badge`, `Tag`,
 * `Status` and `Notification` with no lookup table". `normalizeTone` guarantees the
 * **spelling** converges. Nothing ever checked that the **rendering** does — and it did not,
 * on the single most common value:
 *
 *   Badge        neutral → `default`   → `--cascivo-color-accent`   ← the brand colour
 *   Tag          neutral → `default`   → `--cascivo-color-bg-subtle`
 *   Status       neutral → `neutral`   → `--cascivo-color-text-muted`
 *   Notification neutral → `neutral`   → `--cascivo-color-bg`
 *
 * Badge was the sole outlier of four, so every "neutral" chip in a reported dashboard —
 * framework labels, preview-environment tags, member roles — rendered as a primary-blue
 * pill. No error, no warning, and the actually-neutral look was `secondary`, typed as a
 * Badge-only shape and therefore invisible to anyone working from the tone vocabulary.
 *
 * ## What this asserts, and what it deliberately does not
 *
 * Each component presents tone differently and that is fine: Badge is a filled chip, Tag a
 * quiet chip, Status a coloured dot, Notification a tinted card. So this does NOT require
 * the same token — it requires the same token **family**. `--cascivo-color-info` and
 * `--cascivo-color-info-subtle` both satisfy `info`; `--cascivo-color-accent` does not
 * satisfy `neutral`.
 *
 * Run: `pnpm meta:check`.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const SRC = join(REPO_ROOT, 'packages/components/src')

/**
 * Token families a canonical tone may read from.
 *
 * `danger` accepts both `destructive` and `error`: both are real red semantic tokens and
 * different components legitimately picked different ones.
 */
const FAMILIES: Record<string, RegExp> = {
  neutral: /--cascivo-color-(bg|bg-subtle|text|text-subtle|text-muted|border|surface)\b/,
  info: /--cascivo-color-info\b|--cascivo-color-info-/,
  success: /--cascivo-color-success\b|--cascivo-color-success-/,
  warning: /--cascivo-color-warning\b|--cascivo-color-warning-/,
  danger: /--cascivo-color-(destructive|error)\b|--cascivo-color-(destructive|error)-/,
}

/** Tokens that must NEVER back a neutral tone — the actual bug. */
const NOT_NEUTRAL = /--cascivo-color-(accent|primary)\b/

/**
 * The four components that accept the shared `ToneInput` vocabulary, with the attribute
 * their stylesheet keys on and the per-tone selector value each one uses.
 */
const COMPONENTS = [
  {
    name: 'badge',
    attr: 'data-variant',
    // Read from the component's own TONE_CLASS map so this cannot drift from the code.
    tones: () => toneMapOf('badge/badge.tsx', 'TONE_CLASS'),
  },
  { name: 'tag', attr: 'data-variant', tones: () => toneMapOf('tag/tag.tsx', 'TONE_CLASS') },
  {
    name: 'status',
    attr: 'data-status',
    tones: () => toneMapOf('status/status.tsx', 'TONE_CLASS'),
  },
  {
    name: 'notification',
    attr: 'data-variant',
    tones: () => toneMapOf('notification/notification.tsx', 'TONE_CLASS'),
  },
]

/** Parse a `const <name>: Record<string, string> = { tone: 'value', … }` map out of source. */
function toneMapOf(rel: string, mapName: string): Record<string, string> {
  const src = readFileSync(join(SRC, rel), 'utf8')
  const body = new RegExp(`const ${mapName}[^=]*=\\s*\\{([^}]*)\\}`, 's').exec(src)?.[1]
  assert.ok(body, `${rel}: could not find the ${mapName} map — has it been renamed?`)
  const map: Record<string, string> = {}
  for (const m of body.matchAll(/(\w+)\s*:\s*'([^']+)'/g)) map[m[1]!] = m[2]!
  return map
}

/** The declaration block a component's stylesheet emits for one selector value. */
function ruleFor(component: string, attr: string, value: string): string {
  const css = readFileSync(join(SRC, `${component}/${component}.module.css`), 'utf8')
  // Collect every rule whose selector carries `[attr='value']` — a tone may be styled by
  // more than one (e.g. the chip plus a nested dot).
  const rules: string[] = []
  const needle = `[${attr}='${value}']`
  let index = css.indexOf(needle)
  while (index !== -1) {
    const open = css.indexOf('{', index)
    if (open === -1) break
    let depth = 0
    let end = open
    for (; end < css.length; end++) {
      if (css[end] === '{') depth++
      else if (css[end] === '}' && --depth === 0) break
    }
    rules.push(css.slice(open, end))
    index = css.indexOf(needle, end)
  }
  return rules.join('\n')
}

describe('tone-parity — one tone vocabulary, one token family per tone', () => {
  for (const component of COMPONENTS) {
    const tones = component.tones()

    it(`${component.name} maps every canonical tone`, () => {
      assert.deepEqual(
        Object.keys(FAMILIES).filter((t) => !(t in tones)),
        [],
        `${component.name} accepts ToneInput but its tone map is missing canonical tones`,
      )
    })

    for (const [tone, selectorValue] of Object.entries(tones)) {
      const family = FAMILIES[tone]
      if (!family) continue

      it(`${component.name}: ${tone} reads from the ${tone} token family`, () => {
        const rule = ruleFor(component.name, component.attr, selectorValue)
        assert.ok(
          rule.trim() !== '',
          `${component.name}.module.css has no rule for [${component.attr}='${selectorValue}'] ` +
            `(the ${tone} tone), so the tone renders unstyled`,
        )
        assert.match(
          rule,
          family,
          `${component.name}'s "${tone}" tone resolves to [${component.attr}='${selectorValue}'], ` +
            `whose rule reads no --cascivo-color-* token from the ${tone} family. A shared ` +
            'vocabulary that renders differently per component is worse than no vocabulary: ' +
            'the caller has no signal that anything is wrong.',
        )
      })
    }

    it(`${component.name}: neutral is not the brand colour`, () => {
      const value = tones['neutral']
      assert.ok(value, `${component.name} has no neutral tone`)
      const rule = ruleFor(component.name, component.attr, value)
      assert.doesNotMatch(
        rule,
        NOT_NEUTRAL,
        `${component.name}'s "neutral" tone renders with --cascivo-color-accent/primary. ` +
          'This is the exact defect: a neutral badge came out as a primary-blue pill while ' +
          'Tag, Status and Notification all rendered neutral quietly. If you want the accent ' +
          'look, expose it as an explicit non-tone variant.',
      )
    })
  }
})
