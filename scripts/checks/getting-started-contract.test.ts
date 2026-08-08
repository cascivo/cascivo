/**
 * Getting-started contract — a first-day fact must be on EVERY first-day surface.
 *
 * `useSignals()` was documented correctly the whole time: in the `index.d.ts` header, in
 * `HEADLESS.md`, and in `TROUBLESHOOTING.md`, which has an entire section titled "Handlers
 * fire but the UI never updates". It appeared in `GETTING-STARTED.md` exactly once — at
 * line 260, inside a comment in the *theming* section — and not at all in "First
 * component". A 2026-07-28 adopter called it "the single most likely first-day bug for
 * anyone building an app rather than a page" (report C7).
 *
 * That is Mechanism D: the fix landed on a surface the adopter does not read. And the
 * reason it keeps happening is that "the docs" is not one place. Adopters demonstrably
 * split across at least four entry points — the 07-26 pair built entire apps from the
 * `.d.ts` and from `llms.txt` respectively, and never opened the website.
 *
 * So this guard enumerates the surfaces and the facts, and requires the cross product.
 * Adding a fact means adding it everywhere; the guard names the surface that is missing it.
 *
 * Run: `pnpm meta:check`.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')

/**
 * The surfaces a cold adopter actually starts from.
 *
 * `apps/site/public/docs/getting-started.md` is generated from the guide by `pnpm regen`,
 * so it is covered transitively and not listed. The rendered site page is hand-authored
 * TSX and is a genuinely separate surface — that is why it is here.
 */
const SURFACES: { label: string; path: string }[] = [
  { label: 'docs/GETTING-STARTED.md', path: 'docs/GETTING-STARTED.md' },
  {
    label: 'the docs site getting-started page',
    path: 'apps/site/src/pages/GettingStartedPage.tsx',
  },
  { label: 'llms.txt (generator)', path: 'scripts/llms/generate.ts' },
  // The CLI's OWN OUTPUT is a first-day surface — for most adopters it is the first one,
  // since `cascivo init` runs before any doc is opened. It was never checked here, and it
  // showed the theme import alone: not the tokens sheet (debugged as a greyscale app), not
  // light-dark.css (needed the moment you add a toggle), not @cascivo/charts/styles.css.
  { label: 'the `cascivo init` completion output', path: 'packages/cli/src/commands/init.ts' },
]

/**
 * Facts a first-day adopter must not be able to miss, each with the patterns that prove
 * it is present. Every pattern must match on every surface.
 */
const FACTS: { name: string; why: string; patterns: RegExp[] }[] = [
  {
    name: 'useSignals() is required in the consumer’s own components',
    why:
      'Without it a component that reads signal.value in render never re-renders. No error, ' +
      'no warning — handlers fire and the UI freezes (2026-07-28 report C7).',
    patterns: [/useSignals\(\)/],
  },
  {
    name: 'theme CSS must be imported, and which bundle carries which themes',
    why:
      'Setting data-theme with no matching theme CSS loaded renders every component ' +
      'greyscale. all.css naming cost adopters real time (2026-07-28 report C4).',
    patterns: [/@cascivo\/themes\/light-dark/, /@cascivo\/themes\/all/],
  },
]

function read(path: string): string {
  return readFileSync(join(REPO_ROOT, path), 'utf8')
}

describe('getting-started-contract — first-day facts reach every first-day surface', () => {
  for (const fact of FACTS) {
    it(`every surface states: ${fact.name}`, () => {
      const missing: string[] = []
      for (const surface of SURFACES) {
        const source = read(surface.path)
        for (const pattern of fact.patterns) {
          if (!pattern.test(source)) {
            missing.push(`${surface.label} — no match for ${pattern}`)
          }
        }
      }
      assert.deepEqual(
        missing,
        [],
        `A first-day fact is missing from a first-day surface.\n\nFact: ${fact.name}\n` +
          `Why it matters: ${fact.why}\n\n` +
          '"The docs" is not one place — adopters start from the guide, the website, and ' +
          'llms.txt, and two 07-26 reporters built whole apps without opening the website ' +
          'at all. A fact on one surface is a fact most readers never see.\n' +
          `Missing from:\n  ${missing.join('\n  ')}`,
      )
    })
  }

  it('every listed surface exists (guards against passing vacuously)', () => {
    for (const surface of SURFACES) {
      assert.doesNotThrow(
        () => read(surface.path),
        `${surface.label} (${surface.path}) is unreadable — if it moved, update SURFACES; ` +
          'a missing file here would silently stop checking a whole surface.',
      )
    }
  })
})
