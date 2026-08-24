/**
 * Merge per-OS AT sweep artifacts into the committed `at-results.json`.
 *
 * ## Why this exists
 *
 * Each OS job in `.github/workflows/a11y-at.yml` writes its own stack column and uploads the
 * whole file as an artifact. Combining the columns was a manual step — "a maintainer reviews
 * the runs, merges the two columns, stamps the date, and commits the file" — and in ~20 green
 * runs between 2026-08-03 and 2026-08-24 nobody ever did. `generatedAt` stayed `null`, every
 * component's `results` stayed `{}`, and the published accessibility page kept saying
 * "pending" while the sweep it describes was passing nightly.
 *
 * A verification loop whose last step depends on someone remembering is not a loop. This
 * closes it: the workflow runs this, opens a PR with the result, and a human reviews the
 * logged phrases — which was always the part that genuinely needed judgement.
 *
 * Usage: node at-merge.mjs <date> <artifact.json…>
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../..', import.meta.url))
const RESULTS = join(ROOT, 'apps/site/src/marketing/pages/accessibility/at-results.json')

const [date, ...artifacts] = process.argv.slice(2)
if (!date || artifacts.length === 0) {
  console.error('usage: node at-merge.mjs <YYYY-MM-DD> <artifact.json…>')
  process.exit(2)
}

const base = JSON.parse(readFileSync(RESULTS, 'utf8'))
const knownStacks = new Set(base.stacks.map((s) => s.id))

/** stackId → { componentName → status } drawn from every artifact that carries results. */
const columns = new Map()
for (const path of artifacts) {
  let doc
  try {
    doc = JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    console.warn(`  skipping ${path}: ${error.message}`)
    continue
  }
  for (const component of doc.components ?? []) {
    for (const [stackId, status] of Object.entries(component.results ?? {})) {
      if (!knownStacks.has(stackId)) {
        console.warn(`  skipping unknown stack "${stackId}" in ${path}`)
        continue
      }
      if (!columns.has(stackId)) columns.set(stackId, new Map())
      columns.get(stackId).set(component.name, status)
    }
  }
}

if (columns.size === 0) {
  console.error('No stack results found in any artifact — refusing to stamp generatedAt.')
  console.error('An empty merge would publish "verified" over a run that produced nothing.')
  process.exit(1)
}

const merged = {
  ...base,
  generatedAt: date,
  components: base.components.map((component) => {
    const results = { ...component.results }
    for (const [stackId, byComponent] of columns) {
      const status = byComponent.get(component.name)
      if (status !== undefined) results[stackId] = status
    }
    return { ...component, results }
  }),
}

writeFileSync(RESULTS, `${JSON.stringify(merged, null, 2)}\n`, 'utf8')

const covered = merged.components.filter((c) => Object.keys(c.results).length > 0).length
console.log(
  `at-merge: ${[...columns.keys()].join(', ')} → ${covered}/${merged.components.length} ` +
    `components, generatedAt ${date}`,
)
