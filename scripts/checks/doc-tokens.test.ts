/**
 * Doc-token guard — every `--cascivo-*` name the guides teach must actually exist.
 *
 * ## Why
 *
 * This check exists because it found something on the day it was written. `docs/THEMING.md`,
 * `docs/STYLING-INTERNALS.md`, `docs/USING-WITH-A-ROUTER.md`, `CLAUDE.md` and
 * `packages/tokens/README.md` all used `--cascivo-button-bg` as *the* worked example of a
 * component token an adopter can re-point. No stylesheet in the repo has ever defined it.
 * Anyone following the override ladder's first rung on a Button — the rung the docs call
 * the intended path — wrote a declaration that did nothing, and got no diagnostic from CSS,
 * from TypeScript, from the build, or from `cascivo audit`.
 *
 * That is the whole thesis of the styling contract in miniature: a name set nothing checks
 * is a name set that drifts, and CSS is uniquely bad at telling you. `pnpm regen` already
 * generates the true set (`packages/tokens/style-contract.json`); this asserts the guides
 * against it.
 *
 * ## What is deliberately not an error
 *
 * Three shapes are legitimate non-tokens and are skipped structurally, not by allowlist:
 *
 *   - A **prefix** ending in `-` (`--cascivo-color-`, `--cascivo-space-`). Prose naming a
 *     family, not a token.
 *   - A **CSS `@function` call** (`--cascivo-step(2)`). Same lexical shape, different thing.
 *   - The **naming-map counterexamples** in `docs/TOKENS.md`, whose right-hand "NOT" column
 *     exists precisely to name spellings that do not resolve. That table is generated from
 *     `scripts/tokens/generate-manifest.mjs`; asserting its counterexamples do not exist
 *     would be the same check twice, inverted.
 *   - **One reserved misspelling**, `--cascivo-color-acent`. Several pages now document what
 *     the token checkers catch, and an example of a wrong token has to contain a wrong
 *     token. Reserving a single spelling for that — rather than exempting whole files, or
 *     letting each page invent its own — keeps every other typo an error and makes the
 *     counterexamples greppable. Use this spelling when you need one.
 *
 * Run: `pnpm meta:check`.
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')

/**
 * The one spelling reserved for "here is a token that does not exist". See the header.
 * Do not add to this list to silence a finding — fix the name instead.
 */
const RESERVED_COUNTEREXAMPLES = new Set(['--cascivo-color-acent'])

/** Files that teach token names to an adopter or an agent. */
function surfaces(): string[] {
  const docs = readdirSync(join(REPO_ROOT, 'docs'))
    .filter((f) => f.endsWith('.md'))
    .map((f) => join('docs', f))
  return [...docs, 'CLAUDE.md', 'AGENTS.md', 'packages/tokens/readme.body.md']
}

/**
 * `docs/TOKENS.md`'s "Naming map" section lists spellings that intentionally do not exist.
 * Everything from that heading to the next `## ` is exempt.
 */
function stripNamingMap(file: string, source: string): string {
  if (!file.endsWith('TOKENS.md')) return source
  const start = source.indexOf('## Naming map')
  if (start === -1) return source
  const end = source.indexOf('\n## ', start + 1)
  return source.slice(0, start) + (end === -1 ? '' : source.slice(end))
}

/**
 * CSS `@function` names (`--cascivo-step`, `--cascivo-scale`). Same lexical shape as a
 * custom property, different thing entirely — and the guides discuss them by name, without
 * the call parentheses that would otherwise mark them. Read from the stylesheet that
 * declares them so a renamed function does not need a second edit here.
 */
function functionNames(): Set<string> {
  const css = readFileSync(join(REPO_ROOT, 'packages/tokens/src/functions.css'), 'utf8')
  return new Set([...css.matchAll(/@function\s+(--cascivo-[a-z0-9-]+)/g)].map((m) => m[1]!))
}

function knownTokens(): Set<string> {
  const contract = JSON.parse(
    readFileSync(join(REPO_ROOT, 'packages/tokens/style-contract.json'), 'utf8'),
  ) as { tokens: string[] }
  return new Set(contract.tokens)
}

describe('doc-tokens — every --cascivo-* name in the guides resolves', () => {
  it('names a token that exists', () => {
    const known = knownTokens()
    const functions = functionNames()
    const bad: string[] = []

    for (const file of surfaces()) {
      let source: string
      try {
        source = readFileSync(join(REPO_ROOT, file), 'utf8')
      } catch {
        continue
      }
      source = stripNamingMap(file, source)

      for (const [index, line] of source.split('\n').entries()) {
        // A trailing `(` marks a CSS @function call, not a custom property.
        for (const match of line.matchAll(/--cascivo-[a-z0-9-]+(\()?/g)) {
          const name = match[0].replace('(', '')
          if (match[1] === '(') continue
          if (name.endsWith('-')) continue
          if (known.has(name) || functions.has(name)) continue
          if (RESERVED_COUNTEREXAMPLES.has(name)) continue
          bad.push(`${file}:${index + 1}  ${name}`)
        }
      }
    }

    assert.deepEqual(
      bad,
      [],
      'These docs name a `--cascivo-*` custom property that no shipped stylesheet defines. ' +
        'CSS drops an unknown custom property silently, so anyone following the example ' +
        'writes a declaration that does nothing and gets no error from anywhere. Use a real ' +
        'token (`packages/tokens/style-contract.json` is the generated set) or, if the ' +
        'example needs a knob that ought to exist, add the token to the component CSS.' +
        `\n  ${bad.join('\n  ')}`,
    )
  })

  it('is actually reading the guides (guards against a silent skip)', () => {
    const found = surfaces().filter((f) => {
      try {
        return readFileSync(join(REPO_ROOT, f), 'utf8').includes('--cascivo-')
      } catch {
        return false
      }
    })
    assert.ok(
      found.length >= 5,
      `expected several guides to mention tokens; found ${found.length}: ${found.join(', ')}`,
    )
  })
})
