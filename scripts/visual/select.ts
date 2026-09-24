/**
 * Which components a pull request's visual-regression run should snapshot.
 *
 * Every registry entry whose source directory the diff touches, plus a fixed sample of the
 * layout-sensitive components adopter reports have caught regressing (AppShell padding three
 * times, Card's stretched link, DataTable zebra rows, Field alignment). A change to tokens or
 * themes cannot be narrowed to components, so it gets the sample alone — the full sweep stays
 * nightly.
 *
 * Usage: node scripts/visual/select.ts <changed-file>...   → prints a comma-separated list
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export const SAMPLE = ['layout/app-shell', 'card', 'data-table', 'field', 'layout/grid', 'checkbox']

// Mirrors visual.spec.ts: canvas and animated entries never have stable pixels.
const UNSTABLE_PREFIXES = ['chart/', 'flow/']

const RAW = 'https://raw.githubusercontent.com/cascivo/cascivo/main/'

export function selectComponents(
  changed: string[],
  entries: { name: string; files?: string[] }[],
): string[] {
  const picked = new Set(SAMPLE)
  for (const entry of entries) {
    if (UNSTABLE_PREFIXES.some((p) => entry.name.startsWith(p))) continue
    const dirs = new Set((entry.files ?? []).map((f) => `${dirname(f.replace(RAW, ''))}/`))
    if (changed.some((file) => [...dirs].some((d) => file.startsWith(d)))) picked.add(entry.name)
  }
  return [...picked].sort()
}

if (import.meta.main) {
  const root = join(import.meta.dirname, '..', '..')
  const registry = JSON.parse(readFileSync(join(root, 'registry.json'), 'utf8')) as {
    components: { name: string; files?: string[] }[]
  }
  console.log(selectComponents(process.argv.slice(2), registry.components).join(','))
}
