#!/usr/bin/env node
/**
 * Component index generator (v37 T6, #9).
 *
 * Reads registry.json and writes a categorized "what exists" index into
 * packages/react/readme.body.md between the COMPONENT_INDEX markers, so a
 * consumer can see every exported component at a glance instead of reading
 * index.d.ts. Run before readme:generate (which wraps the body into README.md).
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const REPO_ROOT = join(import.meta.dirname, '..', '..')
const BODY = join(REPO_ROOT, 'packages/react/readme.body.md')
const START = '<!-- COMPONENT_INDEX:START -->'
const END = '<!-- COMPONENT_INDEX:END -->'

// Display order + human labels for the registry's category keys.
const CATEGORIES = [
  ['inputs', 'Inputs'],
  ['display', 'Display'],
  ['overlay', 'Overlay'],
  ['navigation', 'Navigation'],
  ['layout', 'Layout'],
  ['feedback', 'Feedback'],
  ['chart', 'Charts'],
]

const registry = JSON.parse(readFileSync(join(REPO_ROOT, 'registry.json'), 'utf8'))
const components = registry.components

const grouped = new Map(CATEGORIES.map(([key]) => [key, []]))
for (const c of components) {
  if (!grouped.has(c.category)) grouped.set(c.category, [])
  grouped.get(c.category).push(c)
}

let body = `## Component index\n\n`
body += `${components.length} components, exported from \`@cascivo/react\`. Full props, examples, and live demos at [docs.cascivo.com](https://docs.cascivo.com).\n`
for (const [key, label] of CATEGORIES) {
  const list = (grouped.get(key) ?? []).sort((a, b) =>
    (a.meta?.name ?? a.name).localeCompare(b.meta?.name ?? b.name),
  )
  if (list.length === 0) continue
  body += `\n### ${label}\n\n`
  for (const c of list) {
    body += `- **${c.meta?.name ?? c.name}** — ${c.description}\n`
  }
}

const source = readFileSync(BODY, 'utf8')
const startIdx = source.indexOf(START)
const endIdx = source.indexOf(END)
if (startIdx === -1 || endIdx === -1) {
  throw new Error(
    `component-index: missing ${START} / ${END} markers in packages/react/readme.body.md`,
  )
}
const next = `${source.slice(0, startIdx + START.length)}\n\n${body.trim()}\n\n${source.slice(endIdx)}`
writeFileSync(BODY, next)

console.log(`✓ component index: ${components.length} components written to react readme.body.md`)
