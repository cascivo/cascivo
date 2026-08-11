/**
 * Where a registry entry's TypeScript source lives.
 *
 * ## Why this is not just `entry.files`
 *
 * `files[]` holds the GitHub raw URLs `cascivo add` copies from, so it is populated only for
 * copy-paste components. Packages consumed from npm — charts, flow, editor — ship an empty
 * `files: []`, and every guard that resolved source through `files` simply `continue`d past
 * them:
 *
 * ```
 * if (tsx.length === 0) continue // npm-installed (charts/flow/editor): no source
 * ```
 *
 * That line appeared in both `props-parity` and `typedefs-parity`, so **37 registry entries —
 * every chart, every flow node, both editors — had never once had their manifest checked
 * against their TypeScript interface.** `AreaChart.format` is the visible consequence: a real
 * prop, documented in TSDoc, absent from the manifest and therefore from `registry.json`,
 * `llms.txt`, `llms-full.txt` and the docs site. The adopter who needed it found it by
 * grepping the `.d.ts` (2026-08-08 report B).
 *
 * The source is perfectly resolvable — it just is not in `files`. The entry name carries the
 * package (`chart/area-chart` → `packages/charts`), and the slug is the directory or file
 * name inside it.
 */
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

/** Registry name prefix → workspace package holding the source. */
const PREFIX_TO_PACKAGE: Record<string, string> = {
  chart: 'charts',
  flow: 'flow',
  editor: 'editor',
}

/** Repo-relative path from a registry file URL (`…/main/packages/x` → `packages/x`). */
export function repoRelative(url: string): string {
  const i = url.indexOf('/packages/')
  return i === -1 ? url : url.slice(i + 1)
}

function findFile(dir: string, filename: string): string | null {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return null
  }
  for (const entry of entries) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      const hit = findFile(full, filename)
      if (hit) return hit
    } else if (entry === filename) {
      return full
    }
  }
  return null
}

/**
 * Repo-relative `.tsx` paths for a registry entry, whether it is copy-paste or npm-shipped.
 *
 * Returns `[]` only when the source genuinely cannot be located — which callers should treat
 * as a failure to investigate, not a reason to skip.
 */
export function resolveEntrySources(
  repoRoot: string,
  entry: { name: string; files?: string[] },
): string[] {
  const fromFiles = (entry.files ?? []).filter((f) => f.endsWith('.tsx')).map(repoRelative)
  if (fromFiles.length > 0) return fromFiles

  const [prefix, ...rest] = entry.name.split('/')
  const pkg = PREFIX_TO_PACKAGE[prefix ?? '']
  if (!pkg || rest.length === 0) return []

  const slug = rest.join('/')
  const srcRoot = join(repoRoot, 'packages', pkg, 'src')
  if (!existsSync(srcRoot)) return []

  const hit = findFile(srcRoot, `${slug}.tsx`)
  // `relative`, not `slice` — callers pass repoRoot both with and without a trailing slash
  // (`fileURLToPath(new URL('../..'))` keeps one), and an off-by-one there silently produced
  // `ackages/charts/…`, which fails to load and looks exactly like "no source found".
  return hit ? [relative(repoRoot, hit).replaceAll('\\', '/')] : []
}
