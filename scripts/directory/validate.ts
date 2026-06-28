/**
 * CI validation script for directory/registries.json.
 *
 * 1. Validates the directory file itself via validateDirectory.
 * 2. For each registry entry, fetches its index and validates via validateIndex.
 * 3. For verified registries, enforces that every item has a license field.
 *
 * Network failures are soft warnings; schema failures are hard errors.
 * Run with: node scripts/directory/validate.ts  (tsx resolves .ts imports)
 */
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateDirectory } from '../../packages/registry/src/directory.ts'
import { validateIndex } from '../../packages/registry/src/validate.ts'
import { isTemplateItem, validateTemplate } from '../../packages/registry/src/template.ts'
import type { RegistryItem } from '../../packages/registry/src/types.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(HERE, '..', '..')
const DIRECTORY_PATH = join(REPO_ROOT, 'directory', 'registries.json')

let hardFailed = false
const warnings: string[] = []

function hardFail(msg: string): void {
  console.error(`ERROR: ${msg}`)
  hardFailed = true
}

function warn(msg: string): void {
  warnings.push(msg)
}

/** Derive the index URL from a registryUrl template (replace {name} with "registry", or strip /{name}.json and append /registry.json). */
function indexUrl(registryUrl: string): string {
  if (registryUrl.endsWith('/{name}.json')) {
    return registryUrl.replace('/{name}.json', '/registry.json')
  }
  return registryUrl.replace('{name}', 'registry')
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
  return res.json() as Promise<unknown>
}

// ── 1. Read and validate the directory file ────────────────────────────────

const raw = JSON.parse(await readFile(DIRECTORY_PATH, 'utf8')) as unknown
const dirResult = validateDirectory(raw)

for (const e of dirResult.errors) hardFail(`[directory] ${e}`)
for (const w of dirResult.warnings) warn(`[directory] ${w}`)

if (!dirResult.ok) {
  // No point fetching registries if the directory itself is invalid.
  console.error('\nDirectory validation failed — aborting.')
  process.exit(1)
}

// ── 2. Fetch and validate each registry index ─────────────────────────────

const obj = raw as {
  registries: Array<{
    registryUrl: string
    namespace: string
    verified: boolean
    provides?: string[]
  }>
}

for (const entry of obj.registries) {
  const url = indexUrl(entry.registryUrl)
  console.log(`Checking ${entry.namespace} → ${url}`)

  let index: unknown
  try {
    index = await fetchJson(url)
  } catch (err) {
    warn(`[${entry.namespace}] Network fetch failed (${url}): ${(err as Error).message}`)
    continue
  }

  const result = validateIndex(index)
  for (const e of result.errors) hardFail(`[${entry.namespace}] ${e}`)
  for (const w of result.warnings) warn(`[${entry.namespace}] ${w}`)

  // ── Template-providing registries: require ≥1 valid template ──────────────
  if (entry.provides?.includes('template') && result.ok) {
    const items = ((index as { items?: RegistryItem[] }).items ?? []).filter(isTemplateItem)
    if (items.length === 0) {
      hardFail(`[${entry.namespace}] provides "template" but exposes no template items`)
    }
    for (const item of items) {
      for (const e of validateTemplate(item))
        hardFail(`[${entry.namespace}] template "${item.name}": ${e}`)
    }
  }

  // ── 3. Verified registries: enforce license on every item ───────────────
  if (entry.verified && result.ok) {
    const idx = index as { items?: Array<Record<string, unknown>> }
    const items = idx.items ?? []
    for (const item of items) {
      if (!item['license'] || typeof item['license'] !== 'string') {
        hardFail(
          `[${entry.namespace}] verified registry item "${String(item['name'] ?? '?')}" is missing a license field`,
        )
      }
    }
  }
}

// ── Summary ────────────────────────────────────────────────────────────────

if (warnings.length > 0) {
  console.warn('\nWarnings:')
  for (const w of warnings) console.warn(`  WARN: ${w}`)
}

if (hardFailed) {
  console.error('\nValidation failed.')
  process.exit(1)
}

console.log('\nDirectory validation passed.')
