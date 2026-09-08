#!/usr/bin/env node
/**
 * Refresh the vendored Can I email support matrix.
 *
 * The email target's conformance lint (`pnpm email:conformance:check`) decides whether a
 * CSS property or HTML element may appear in a rendered email by looking it up here. That
 * data is Can I email's, MIT-licensed, and vendored rather than fetched so CI stays
 * offline and deterministic — and so that a change in what the linter permits arrives as a
 * reviewed diff rather than as a silent behaviour change on the day upstream retests a
 * client.
 *
 * The snapshot is slimmed to the fields the linter reads. Prose, test URLs and per-note
 * footnotes are dropped: they would quadruple the file and make the diff unreadable, which
 * defeats the point of reviewing it.
 *
 * Run manually — deliberately NOT part of `pnpm regen`, which must not need the network.
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SOURCE = 'https://www.caniemail.com/api/data.json'
const OUT = join(import.meta.dirname, 'vendor', 'caniemail.json')

interface UpstreamFeature {
  slug: string
  title: string
  category: string
  keywords?: string
  stats: Record<string, Record<string, Record<string, string>>>
}

const res = await fetch(SOURCE)
if (!res.ok) throw new Error(`caniemail refresh failed: ${res.status} ${res.statusText}`)
const raw = (await res.json()) as {
  api_version: string
  last_update_date: string
  nicenames: { family: Record<string, string>; platform: Record<string, string> }
  data: UpstreamFeature[]
}

const slim = {
  $source: SOURCE,
  $license: 'MIT — https://github.com/hteumeuleu/caniemail',
  $note: 'Slimmed snapshot. Refresh with `pnpm email:caniemail:refresh`; commit the diff.',
  api_version: raw.api_version,
  last_update_date: raw.last_update_date,
  nicenames: { family: raw.nicenames.family, platform: raw.nicenames.platform },
  data: raw.data
    .map((f) => ({
      slug: f.slug,
      title: f.title,
      category: f.category,
      ...(f.keywords ? { keywords: f.keywords } : {}),
      stats: f.stats,
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug)),
}

/**
 * One feature per line.
 *
 * `stats` is four levels deep, so pretty-printing the whole file costs ~1.1 MB and spreads
 * a single retested client across dozens of diff lines. Compact-per-feature keeps the file
 * a third of that size and makes a refresh diff read as "these N features changed".
 */
const serialized = [
  '{',
  ...Object.entries(slim)
    .filter(([k]) => k !== 'data')
    .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`),
  '  "data": [',
  ...slim.data.map((f, i) => `    ${JSON.stringify(f)}${i === slim.data.length - 1 ? '' : ','}`),
  '  ]',
  '}',
].join('\n')

writeFileSync(OUT, `${serialized}\n`)
console.log(
  `email: vendored ${slim.data.length} caniemail features (api ${slim.api_version}, tested ${slim.last_update_date})`,
)
