#!/usr/bin/env node
/**
 * Parity matrix generator.
 *
 * Reads docs/specs/parity-matrix.md (the human-authored source), cross-checks every
 * `covered`/`partial` row against the REAL cascivo surface (packages/react/src/index.ts
 * exports + registry.json), and writes:
 *   apps/docs/public/parity.json — derived coverage scoreboard (do NOT hand-edit)
 *
 * Coverage is DERIVED: a row marked `covered`/`partial` whose named cascivo component is not
 * actually shipped/exported makes the generator FAIL loudly. The coverage page therefore can
 * never overstate — a component shows as covered only when it is genuinely built and exported.
 *
 * Run with: `pnpm parity:generate`
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..')
const MATRIX_PATH = join(ROOT, 'docs', 'specs', 'parity-matrix.md')
const REGISTRY_PATH = join(ROOT, 'registry.json')
const REACT_INDEX_PATH = join(ROOT, 'packages', 'react', 'src', 'index.ts')
const OUT_PATH = join(ROOT, 'apps', 'docs', 'public', 'parity.json')

export type ParityStatus = 'covered' | 'partial' | 'gap' | 'by-convention' | 'deferred'

export interface ParityRow {
  competitor: string
  status: ParityStatus
  cascivo: string
  note: string
}

export interface CompetitorReport {
  total: number
  covered: number
  partial: number
  gap: number
  byConvention: number
  deferred: number
  rows: ParityRow[]
}

export interface ParityReport {
  generatedAt: string
  competitors: Record<string, CompetitorReport>
}

const VALID_STATUS: ReadonlySet<string> = new Set([
  'covered',
  'partial',
  'gap',
  'by-convention',
  'deferred',
])

/** Parse a delimited section's markdown table rows. */
export function parseSection(markdown: string, key: string): ParityRow[] {
  const start = markdown.indexOf(`<!-- parity:${key} -->`)
  const end = markdown.indexOf(`<!-- parity:${key}:end -->`)
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`parity-matrix.md: missing or malformed section markers for "${key}"`)
  }
  const block = markdown.slice(start, end)
  const rows: ParityRow[] = []
  for (const raw of block.split('\n')) {
    const line = raw.trim()
    if (!line.startsWith('|')) continue
    const cells = line
      .slice(1, line.endsWith('|') ? -1 : undefined)
      .split('|')
      .map((c) => c.trim())
    if (cells.length < 4) continue
    const [competitor, status, cascivo, note] = cells
    if (!competitor || competitor === 'Competitor') continue // header
    if (/^-+$/.test(competitor)) continue // separator
    if (!VALID_STATUS.has(status!)) {
      throw new Error(`parity-matrix.md [${key}]: invalid status "${status}" for "${competitor}"`)
    }
    rows.push({
      competitor: competitor!,
      status: status as ParityStatus,
      cascivo: cascivo ?? '',
      note: note ?? '',
    })
  }
  return rows
}

/** The set of cascivo component identifiers that are genuinely shipped + exported. */
export function buildAvailability(
  reactIndex: string,
  registry: { components: { name: string }[] },
): Set<string> {
  const available = new Set<string>()
  // From @cascivo/react barrel: `export * from '../../components/src/<name>/<name>'`
  for (const m of reactIndex.matchAll(/components\/src\/([a-z0-9-]+)\//g)) {
    available.add(m[1]!)
  }
  // From registry: every entry name, plus the prefix token for namespaced entries (chart/, layout/, …).
  for (const c of registry.components) {
    available.add(c.name)
    const slash = c.name.indexOf('/')
    if (slash !== -1) {
      available.add(c.name.slice(0, slash))
      available.add(c.name.slice(slash + 1))
    }
  }
  return available
}

export function buildReport(
  rows: ParityRow[],
  available: Set<string>,
  label: string,
): CompetitorReport {
  for (const row of rows) {
    if (row.status === 'covered' || row.status === 'partial') {
      if (!row.cascivo) {
        throw new Error(
          `parity [${label}]: "${row.competitor}" is ${row.status} but names no cascivo component`,
        )
      }
      // A covered/partial claim is only honest if the component genuinely exists + is exported.
      const tokens = row.cascivo
        .split(/[+,/]/)
        .map((t) => t.trim())
        .filter(Boolean)
      const present = tokens.some((t) => available.has(t))
      if (!present) {
        throw new Error(
          `parity [${label}]: "${row.competitor}" claims ${row.status} via "${row.cascivo}" ` +
            `but no such cascivo component is built/exported — the matrix would overstate coverage. ` +
            `Build + export it, or mark the row as a gap.`,
        )
      }
    }
  }
  const count = (s: ParityStatus) => rows.filter((r) => r.status === s).length
  return {
    total: rows.length,
    covered: count('covered'),
    partial: count('partial'),
    gap: count('gap'),
    byConvention: count('by-convention'),
    deferred: count('deferred'),
    rows,
  }
}

export function generate(
  markdown: string,
  reactIndex: string,
  registry: { components: { name: string }[] },
  generatedAt: string,
): ParityReport {
  const available = buildAvailability(reactIndex, registry)
  return {
    generatedAt,
    competitors: {
      shadcn: buildReport(parseSection(markdown, 'shadcn'), available, 'shadcn'),
      carbon: buildReport(parseSection(markdown, 'carbon'), available, 'carbon'),
    },
  }
}

function main(): void {
  const markdown = readFileSync(MATRIX_PATH, 'utf8')
  const reactIndex = readFileSync(REACT_INDEX_PATH, 'utf8')
  const registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'))
  const report = generate(markdown, reactIndex, registry, new Date().toISOString().slice(0, 10))
  writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n')
  const { shadcn, carbon } = report.competitors
  console.log(
    `Wrote parity.json — shadcn ${shadcn.covered}/${shadcn.total} covered ` +
      `(${shadcn.partial} partial, ${shadcn.gap} gap); ` +
      `carbon ${carbon.covered}/${carbon.total} covered (${carbon.partial} partial, ${carbon.gap} gap)`,
  )
}

// Only run when executed directly, not when imported by tests.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
