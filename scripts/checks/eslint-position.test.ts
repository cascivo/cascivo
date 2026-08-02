/**
 * `react-hooks/immutability` position guard.
 *
 * `eslint-plugin-react-hooks@7`'s `recommended-latest` — what a stock 2026 React app gets —
 * enables `react-hooks/immutability`, which reports every `signal.value = next` as
 * `Error: This value cannot be modified`. That is the idiom `AI-RULES.md` mandates and
 * `HEADLESS.md` demonstrates, so a new adopter runs `pnpm lint`, sees an error on every
 * piece of state they wrote, and has nothing to reach for: a search of the entire offline
 * docs corpus for `immutability` returned **zero hits**.
 *
 * The fix is only half code. The other half is that the fact has to be reachable from
 * wherever the adopter is standing when it bites — the reactivity rule that causes it, the
 * example that triggers it, the install page, the error-text index, the agent-facing
 * `llms.txt`, and the scaffolded app itself. A guide nobody routes to is how the gap
 * survived in the first place, so each of those surfaces is asserted here rather than
 * trusted.
 *
 * Run: `pnpm meta:check`.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const RULE = 'react-hooks/immutability'

/** Every surface an adopter could be reading when the rule bites. */
const SURFACES = [
  ['docs/AI-RULES.md', 'the reactivity contract that mandates the idiom'],
  ['docs/HEADLESS.md', 'the page whose own example the rule reports'],
  ['docs/GETTING-STARTED.md', 'the install page — before they write any state'],
  ['docs/TROUBLESHOOTING.md', 'the error-text index they will search'],
  ['docs/USING-WITH-STRICT-ESLINT.md', 'the long-form rationale'],
  ['scripts/llms/generate.ts', 'the llms.txt generator — the agent-facing surface'],
  ['packages/cli/src/commands/create.ts', 'the scaffolded app, pre-wired'],
] as const

function read(rel: string): string {
  return readFileSync(join(REPO_ROOT, rel), 'utf8')
}

describe('eslint-position — the immutability stance is stated where it bites', () => {
  it('names the rule on every surface', () => {
    const missing = SURFACES.filter(([file]) => !read(file).includes(RULE)).map(
      ([file, why]) => `  ${file} — ${why}`,
    )
    assert.deepEqual(
      missing,
      [],
      `\`${RULE}\` is not mentioned on:\n${missing.join('\n')}\n\n` +
        'The adopter hits this rule from any of these surfaces. A stance stated in only one\n' +
        'place is the failure mode that let it go undocumented entirely — the docs corpus had\n' +
        'zero hits for "immutability" when it was first reported.',
    )
  })

  it('ships the literal error text so a web search for it lands somewhere', () => {
    // Reported verbatim by the rule. An adopter's first move is to paste it into a search
    // box, so it must appear as a string in the docs, not be paraphrased.
    const literal = 'This value cannot be modified'
    for (const file of ['docs/TROUBLESHOOTING.md', 'docs/USING-WITH-STRICT-ESLINT.md']) {
      assert.ok(read(file).includes(literal), `${file} must quote the literal error text`)
    }
  })

  it('@cascivo/eslint-config actually turns the rule off', () => {
    // The docs above all point here; if the package stopped setting it, every one of them
    // would be giving advice that does nothing.
    const src = read('packages/eslint-config/src/index.js')
    assert.match(
      src,
      new RegExp(`'${RULE.replace('/', '\\/')}':\\s*'off'`),
      `packages/eslint-config must set '${RULE}': 'off' — every doc surface points at it.`,
    )
  })

  it('the signals fragment is not scoped to a directory', () => {
    // The pre-existing recipe scoped rules to `src/components/ui/**`. That glob does not
    // exist on the prebuilt path and would not cover page code anyway, which is exactly
    // why it did not help. A `files` key on this fragment would reintroduce the gap.
    const src = read('packages/eslint-config/src/index.js')
    const fragment = /export const cascivoSignals = \{[\s\S]*?\n\}/.exec(src)?.[0] ?? ''
    assert.ok(fragment !== '', 'could not locate the cascivoSignals fragment')
    assert.ok(
      !fragment.includes('files:'),
      "cascivoSignals must apply to all files — signal writes live in the app's own pages.",
    )
  })

  it('states a React Compiler position', () => {
    // The ecosystem keeps tightening here; silence is what made this a blocker once.
    assert.match(
      read('docs/USING-WITH-STRICT-ESLINT.md'),
      /React Compiler/,
      'USING-WITH-STRICT-ESLINT.md must state a React Compiler position, not just this rule.',
    )
  })
})
