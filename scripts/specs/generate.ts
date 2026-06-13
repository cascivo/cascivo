#!/usr/bin/env node
/**
 * Specs, boundaries, and exceptions generator.
 *
 * Reads:
 *   docs/specs/*.md             — design spec files (excluding exceptions.md)
 *   docs/specs/exceptions.md    — historical exceptions log
 *   docs/specs/boundaries.global.json — global strict/flexible boundary source
 *   registry.json               — per-component flexibility from meta.intent
 *
 * Writes:
 *   apps/docs/public/specs.json
 *   apps/docs/public/boundaries.json
 *   apps/docs/public/exceptions.json
 *
 * Run with: `pnpm specs:generate`
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SpecSummary {
  id: string
  title: string
  path: string
  summary: string
}

export interface BoundaryRule {
  area: string
  note: string
}

export interface GlobalBoundaries {
  strict: BoundaryRule[]
  flexible: BoundaryRule[]
}

export interface PerComponentBoundary {
  area: string
  level: string
  note: string
}

export interface FlexibilityRule {
  area: string
  level: string
  note: string
}

export interface RegistryEntry {
  name: string
  type: string
  meta?: {
    name?: string
    intent?: { flexibility?: FlexibilityRule[] } | null
  }
}

export interface Registry {
  components: RegistryEntry[]
}

export interface Exception {
  id: string
  what: string
  breaksRule: string
  why: string
}

// ---------------------------------------------------------------------------
// Spec parsing
// ---------------------------------------------------------------------------

interface FrontMatter {
  id?: string
  title?: string
  body: string
}

/** Parse a leading `---` YAML-ish front-matter block. */
export function parseFrontMatter(content: string): FrontMatter {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) {
    return { body: content }
  }
  const [, raw, body] = match
  const out: FrontMatter = { body: body ?? '' }
  for (const line of (raw ?? '').split('\n')) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/)
    if (!kv) continue
    const key = kv[1]
    const value = (kv[2] ?? '').trim()
    if (key === 'id') out.id = value
    else if (key === 'title') out.title = value
  }
  return out
}

/** First non-heading, non-empty paragraph of a markdown body. */
export function firstParagraph(body: string): string {
  const lines = body.split('\n')
  const collected: string[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === '') {
      if (collected.length > 0) break
      continue
    }
    if (trimmed.startsWith('#')) continue
    collected.push(trimmed)
  }
  return collected.join(' ')
}

/** Build a single spec summary from a file's raw content and slug. */
export function buildSpecSummary(content: string, slug: string): SpecSummary {
  const fm = parseFrontMatter(content)
  return {
    id: fm.id ?? slug,
    title: fm.title ?? slug,
    path: `/docs/specs/${slug}.md`,
    summary: firstParagraph(fm.body),
  }
}

// ---------------------------------------------------------------------------
// Boundaries
// ---------------------------------------------------------------------------

export function buildPerComponentBoundaries(
  registry: Registry,
): Record<string, PerComponentBoundary[]> {
  const out: Record<string, PerComponentBoundary[]> = {}
  const components = registry.components
    .filter((c) => c.type === 'component')
    .sort((a, b) => a.name.localeCompare(b.name))
  for (const entry of components) {
    const flexibility = entry.meta?.intent?.flexibility
    if (!flexibility || flexibility.length === 0) continue
    const displayName = entry.meta?.name ?? entry.name
    out[displayName] = flexibility.map((f) => ({
      area: f.area,
      level: f.level,
      note: f.note,
    }))
  }
  return out
}

// ---------------------------------------------------------------------------
// Exceptions
// ---------------------------------------------------------------------------

/** Parse `### EXC-*` sections out of exceptions.md. */
export function parseExceptions(content: string): Exception[] {
  const out: Exception[] = []
  const sectionRe = /^### (EXC-[\w-]+):\s*(.*)$/gm
  const matches = [...content.matchAll(sectionRe)]
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i]!
    const id = current[1]!
    const start = current.index! + current[0].length
    const end = i + 1 < matches.length ? matches[i + 1]!.index! : content.length
    const block = content.slice(start, end)

    out.push({
      id,
      what: extractField(block, 'What'),
      breaksRule: extractField(block, 'Breaks rule'),
      why: extractField(block, 'Why'),
    })
  }
  return out
}

/** Extract the inline text after a `**Label:**` marker within a block. */
function extractField(block: string, label: string): string {
  const re = new RegExp(`\\*\\*${label}:\\*\\*\\s*([\\s\\S]*?)(?:\\n\\n|\\n\\*\\*|$)`)
  const m = block.match(re)
  return m ? m[1]!.trim().replace(/\s+/g, ' ') : ''
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..')
const SPECS_DIR = join(ROOT, 'docs', 'specs')
const REGISTRY_PATH = join(ROOT, 'registry.json')
const OUT_DIR = join(ROOT, 'apps', 'docs', 'public')

function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  const generatedAt = new Date().toISOString().slice(0, 10)

  // specs.json
  const specFiles = readdirSync(SPECS_DIR)
    .filter((f) => f.endsWith('.md') && f !== 'exceptions.md')
    .sort()
  const specs = specFiles.map((file) => {
    const slug = file.replace(/\.md$/, '')
    return buildSpecSummary(readFileSync(join(SPECS_DIR, file), 'utf8'), slug)
  })
  writeFileSync(join(OUT_DIR, 'specs.json'), JSON.stringify({ generatedAt, specs }, null, 2) + '\n')
  console.log(`Wrote specs.json with ${specs.length} specs`)

  // boundaries.json
  const global: GlobalBoundaries = JSON.parse(
    readFileSync(join(SPECS_DIR, 'boundaries.global.json'), 'utf8'),
  )
  const registry: Registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'))
  const perComponent = buildPerComponentBoundaries(registry)
  writeFileSync(
    join(OUT_DIR, 'boundaries.json'),
    JSON.stringify({ generatedAt, global, perComponent }, null, 2) + '\n',
  )
  console.log(
    `Wrote boundaries.json (${global.strict.length} strict, ${global.flexible.length} flexible, ${Object.keys(perComponent).length} components)`,
  )

  // exceptions.json
  const exceptions = parseExceptions(readFileSync(join(SPECS_DIR, 'exceptions.md'), 'utf8'))
  writeFileSync(
    join(OUT_DIR, 'exceptions.json'),
    JSON.stringify({ generatedAt, exceptions }, null, 2) + '\n',
  )
  console.log(`Wrote exceptions.json with ${exceptions.length} exceptions`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
