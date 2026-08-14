/**
 * Every fact an adopter needs appears on EVERY surface they might look at.
 *
 * ## Why (Mechanism D)
 *
 * A fix that lands on one surface only is the most common way a finding comes back. It has
 * happened here repeatedly: the `id` escape hatch reached five link types and missed
 * `Switcher`; the `padding="none"` rationale existed as a CSS comment and nowhere an adopter
 * reads; `AreaChart.format` was in the TSDoc and in no generated doc at all.
 *
 * `getting-started-contract.test.ts` already does this for *first-day* facts. This does it
 * for the rest, and the table below is the contract: a fact, the surfaces that must carry
 * it, and a pattern proving it is there.
 *
 * ## What this cannot do
 *
 * It matches patterns, not meaning — it proves a fact is *present*, not that it is *clear*.
 * That is still a review-time judgement. What it does buy is that deleting or rewriting one
 * copy of a fact without the others fails the build, which is the failure mode that keeps
 * producing repeat reports.
 */
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))

interface Fact {
  /** What an adopter is trying to find out. */
  id: string
  /** Where it came from, so a future reader knows why the row exists. */
  report: string
  /** Every surface that must carry it, repo-relative. */
  surfaces: string[]
  /** Proof the fact is on the surface. */
  pattern: RegExp
}

const FACTS: Fact[] = [
  {
    id: 'card-padding-none-keeps-subcomponent-padding',
    report: '2026-08-08 A8a — reported as a bug twice; the rationale lived only in a CSS comment',
    surfaces: [
      'packages/components/src/card/card.tsx',
      'packages/components/src/card/card.module.css',
      'registry.json',
    ],
    pattern: /padding="none"|padding=\\"none\\"/,
  },
  {
    id: 'datatable-density-is-a-height-floor',
    report: '2026-08-08 A8c — "barely distinguishable"; the prop works, tall content wins',
    surfaces: ['packages/components/src/data-table/data-table.tsx', 'registry.json'],
    pattern: /height floor/,
  },
  {
    id: 'button-wraps-children-in-a-span',
    report: '2026-08-08 A8d — layout CSS against `> span` hit the wrapper, not the label',
    surfaces: ['packages/components/src/button/button.tsx'],
    pattern: /inner `<span>`/,
  },
  {
    id: 'datatable-column-leftover-distribution',
    report: '2026-08-08 B9a — "leave one unsized" under-specifies; names wrapped mid-token',
    surfaces: ['packages/components/src/data-table/data-table.tsx', 'registry.json'],
    pattern: /necessary, not sufficient|leftover width/,
  },
  {
    id: 'router-active-item-prefix-matching',
    report: '2026-08-08 A7 + B — both adopters hand-wrote the same matcher, both exact-only',
    surfaces: ['docs/USING-WITH-A-ROUTER.md'],
    pattern: /isActive|prefix-match/,
  },
  {
    id: 'checkbox-testing-hit-target',
    report: '2026-08-08 A8g — every table-selection test in the suite failed confusingly',
    surfaces: ['docs/TESTING.md'],
    pattern: /intercepts pointer events|pointer-events: none/,
  },
  {
    id: 'sparkline-defeats-chart-route-splitting',
    report: '2026-08-08 B — the recipe recommended both halves of a contradiction',
    surfaces: ['docs/RECIPE-DASHBOARD.md'],
    pattern: /work against each other|already in the entry chunk|already\* in the entry chunk/,
  },
  {
    id: 'prop-name-vocabulary',
    report: '2026-08-08 A1 — nine wrong prop-name guesses in one small dashboard',
    surfaces: ['docs/AI-RULES.md', 'CLAUDE.md', 'apps/site/public/llms.txt'],
    pattern: /vocabulary/i,
  },
  {
    id: 'gap-takes-a-number',
    report: '2026-08-08 A1 — `gap="4"` alone produced 20 type errors in one run',
    surfaces: ['docs/AI-RULES.md', 'CLAUDE.md', 'apps/site/public/llms.txt'],
    pattern: /gap=\{4\}/,
  },
  {
    id: 'appshell-owns-content-padding',
    report: '2026-08-08 A3/B5 — reported three times; every adopter wrote the same wrapper div',
    surfaces: ['packages/components/src/app-shell/app-shell.tsx', 'registry.json'],
    pattern: /padding/,
  },
  {
    id: 'sparkline-is-fixed-width',
    report: '2026-08-14 §4 — 120 vs 80 and shrink-to-fit vs fixed, across two docs',
    surfaces: [
      'packages/charts/src/charts/sparkline/sparkline.tsx',
      'docs/RECIPE-DASHBOARD.md',
      'registry.json',
    ],
    pattern: /fixed-width/i,
  },
]

/**
 * The `src` filenames in `scripts/docs-md/generate.ts`'s `GUIDES` array — the curated set
 * published to `apps/site/public/docs/<slug>.md`, which is also what `@cascivo/docs` bundles
 * and therefore the ONLY way a `docs/*.md` guide reaches an adopter.
 */
function publishedGuideSources(): Set<string> {
  const source = readFileSync(join(ROOT, 'scripts/docs-md/generate.ts'), 'utf8')
  const block = /const GUIDES:[^=]*=\s*\[([\s\S]*?)\n\]/.exec(source)
  assert.ok(block, 'could not find the GUIDES array in scripts/docs-md/generate.ts')
  return new Set([...block[1]!.matchAll(/src:\s*'([^']+)'/g)].map((m) => m[1]!))
}

describe('doc-surface — every fact reaches every surface an adopter reads', () => {
  it('covers a meaningful number of facts', () => {
    assert.ok(FACTS.length >= 8, `only ${FACTS.length} facts tracked — table gutted?`)
  })

  it('every docs/*.md surface is actually published to adopters', () => {
    // A repo path is not a surface. `docs/USING-WITH-A-ROUTER.md` was registered here as the
    // surface carrying the active-item prefix-matching fact while being absent from GUIDES —
    // so it reached no cascivo.com URL, no `npx @cascivo/docs` slug and no SPA route, while
    // `aschild-docs` regenerated a table INSIDE it on every CI run. The library shipped
    // `.d.ts` pointers to a document it did not distribute, and two of them 404'd for the
    // 2026-08-14 adopter. This guard exists to stop Mechanism D; registering an unreachable
    // file as a "surface" is Mechanism D wearing the guard's own clothes.
    const published = publishedGuideSources()
    const unreachable = [...new Set(FACTS.flatMap((f) => f.surfaces))]
      .filter((s) => s.startsWith('docs/') && s.endsWith('.md'))
      .filter((s) => !s.startsWith('docs/internal/'))
      .filter((s) => !published.has(s.slice('docs/'.length)))
    assert.deepEqual(
      unreachable,
      [],
      'These are registered as adopter-facing surfaces but are NOT in the GUIDES array in ' +
        'scripts/docs-md/generate.ts, so no adopter can read them — not at ' +
        'cascivo.com/docs/<slug>.md, not via `npx @cascivo/docs`.\n' +
        'Add them to GUIDES and run `pnpm regen`, or drop the surface from the FACTS row.\n  ' +
        unreachable.join('\n  '),
    )
  })

  for (const fact of FACTS) {
    for (const surface of fact.surfaces) {
      it(`${fact.id} → ${surface}`, () => {
        const path = join(ROOT, surface)
        assert.ok(existsSync(path), `${surface} does not exist — did it move?`)
        const source = readFileSync(path, 'utf8')
        assert.match(
          source,
          fact.pattern,
          `The fact "${fact.id}" is missing from ${surface}.\n` +
            `  Origin: ${fact.report}\n` +
            '  A fact that lands on one surface only is Mechanism D — it comes back as a ' +
            'repeat report from whoever was reading the other surface. Add it here, or ' +
            'remove the surface from the row if it genuinely does not belong.',
        )
      })
    }
  }
})
