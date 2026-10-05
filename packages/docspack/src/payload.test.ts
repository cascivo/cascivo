/**
 * The payload is validated by the real `docspack` implementation rather than by a
 * re-description of its rules here: `runDoctor` is the check an indexer and a reviewer would
 * run, and `previewPackage` answers through the same ranking and token budget an agent gets.
 *
 * The retrieval eval is the part worth having. A payload can build, validate, and still answer
 * badly — that is the failure mode this package exists to avoid, and it is invisible to every
 * structural check. The threshold is deliberately below the measured rate so ordinary
 * documentation edits do not fail the build; it is a floor, not a target.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { previewPackage, runDoctor, serializeManifest } from 'docspack'
import { MAX_CHUNK_TOKENS, buildPayload } from './payload.ts'

const REPO_ROOT = new URL('../../..', import.meta.url).pathname
const NAME = '@cascivo/docspack'
const VERSION = '0.0.0-test'

let dir: string
let payload: Awaited<ReturnType<typeof buildPayload>>

beforeAll(async () => {
  payload = await buildPayload({ root: REPO_ROOT, name: NAME, version: VERSION })

  // A real package on disk, because `runDoctor` and `previewPackage` read one.
  dir = mkdtempSync(join(tmpdir(), 'cascivo-docspack-'))
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({ name: NAME, version: VERSION, files: ['.llms'] }),
  )
  for (const file of payload.files) {
    const target = join(dir, '.llms', file.path)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, file.contents)
  }
  writeFileSync(join(dir, '.llms', 'manifest.json'), serializeManifest(payload.manifest))
}, 60_000)

afterAll(() => {
  rmSync(dir, { recursive: true, force: true })
})

describe('payload', () => {
  it('passes `docspack doctor --strict` — the gate a publish runs', async () => {
    const report = await runDoctor({ dir, strict: true })
    const blocking = report.findings.filter((finding) => finding.severity !== 'info')
    expect(blocking.map((finding) => `${finding.check}: ${finding.message}`)).toEqual([])
    expect(report.ok).toBe(true)
  })

  it('covers every generated reference and guide', () => {
    // 209 references + 21 guides (the component index is excluded as a duplicate) + the overview.
    expect(payload.manifest.chunks.length).toBeGreaterThan(400)
    for (const name of [
      'button',
      'chart-line-chart',
      'block-pricing',
      'guide-theming',
      'cascivo',
    ]) {
      expect(payload.manifest.chunks.some((chunk) => chunk.id === name)).toBe(true)
    }
  })

  it('keeps every chunk inside the response budget', () => {
    const over = payload.manifest.chunks.filter((chunk) => chunk.tokens > MAX_CHUNK_TOKENS + 200)
    expect(over.map((chunk) => `${chunk.id} (${chunk.tokens})`)).toEqual([])
  })

  it('gives every chunk the metadata that makes it findable', () => {
    const untagged = payload.manifest.chunks.filter(
      (chunk) => chunk.tags.length === 0 && chunk.entities.length === 0,
    )
    expect(untagged.map((chunk) => chunk.id)).toEqual([])
  })

  it('repeats the import on every chunk, so a fragment is still actionable', () => {
    const button = payload.files.filter((file) => file.path.includes('/button'))
    expect(button.length).toBeGreaterThan(0)
    for (const file of button) expect(file.contents).toContain('@cascivo/react')
  })

  it('describes every CLI command, citing the cmdspec a person can open', () => {
    const cli = payload.manifest.chunks.filter((chunk) => chunk.id.startsWith('cli'))
    for (const id of ['cli', 'cli-cascivo-add', 'cli-cascivo-mcp-init', 'cli-cascivo-email-lint']) {
      expect(cli.some((chunk) => chunk.id === id)).toBe(true)
    }
    for (const chunk of cli) expect(chunk.documents?.[0]?.name).toBe('cascivo')
    const add = payload.files.find((file) => file.path.endsWith('/cli-cascivo-add.md'))
    expect(add?.contents).toContain(
      '<!-- docspack: from https://github.com/cascivo/cascivo/blob/main/packages/cli/cmdspec.json -->',
    )
    // The line an agent needs before running it: `add` installs packages.
    expect(add?.contents).toContain('effects: read, write, network, exec')
  })

  it('carries the registry metadata a generic markdown build cannot know', () => {
    const button = payload.manifest.chunks.find((chunk) => chunk.id === 'button')
    // `destructive` is a Button variant in the manifest; it appears in no heading.
    expect(button?.tags).toContain('destructive')
    expect(button?.entities).toContain('Button.variant')

    // Nested types resolve too — this broke silently for all 79 of them once.
    const chart = payload.manifest.chunks.find((chunk) => chunk.id === 'chart-line-chart')
    expect(chart?.tags).toContain('chart')
  })
})

/** [question, pattern a top-3 chunk id must match] */
const QUERIES: [string, RegExp][] = [
  ['how do I make a destructive button', /^button/],
  ['how do I show a loading state on a button', /^button/],
  ['what component do I use for collapsible sections', /^(accordion|collapsible)/],
  ['how do I switch themes at runtime', /^guide-theming/],
  ['how do I build a confirmation dialog', /^(alert-dialog|modal)/],
  ['how do I make a searchable dropdown', /^(combobox|multi-select|select)/],
  ['how do I use cascivo with Next.js', /^guide-using-with-nextjs/],
  ['how do I render a line chart', /^chart-line-chart/],
  ['how do I show a toast notification', /^toast/],
  ['how do I install cascivo', /^(cascivo|guide-getting-started)/],
  ['how do I show a user avatar with initials', /^avatar/],
  ['how do I add keyboard navigation to a menu', /^(menu|dropdown|context-menu|guide-headless)/],
  ['how do I add breadcrumbs', /^breadcrumb/],
  ['how do I show a tooltip on hover', /^tooltip/],
  ['how do I make a sidebar navigation layout', /(app-shell|side-nav|sidebar)/],
  ['how do I show a skeleton while loading', /^skeleton/],
  ['how do I sort and filter a data table', /^data-table/],
  ['how do I use cascivo with Astro', /^guide-using-with-astro/],
  ['how do I use cascivo with Tailwind', /^guide-using-with-tailwind/],
  ['how do I test a cascivo component', /^guide-testing/],
  ['how do I add the cascivo MCP server to cursor', /^cli-cascivo-mcp-init/],
  ['cascivo add button --dry-run', /^cli-cascivo-add/],
  ['how do I lint rendered email html', /^cli-cascivo-email-lint/],
  ['how do I check which installed components are outdated', /^cli-cascivo-update/],
]

describe('retrieval', () => {
  it('answers a realistic question with a relevant chunk in the top three', async () => {
    const misses: string[] = []
    for (const [question, expected] of QUERIES) {
      const result = await previewPackage({ dir, query: question })
      const ids = result.hits.map((hit) => hit.chunkId.split('/').pop() ?? '')
      if (!ids.some((id) => expected.test(id))) misses.push(`${question} → ${ids.join(', ')}`)
    }
    // Measured at 23/24 on docspack 1.3.1; the floor leaves room for documentation edits to move
    // the ranking. The miss is "how do I install cascivo": 1.x ORs the two words, so short chunks
    // that say "install" and "cascivo" (chart references, CLI commands) outrank the overview.
    expect(QUERIES.length - misses.length, `misses:\n${misses.join('\n')}`).toBeGreaterThanOrEqual(
      21,
    )
  }, 60_000)
})
