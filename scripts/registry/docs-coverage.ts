/**
 * Documentation-coverage guard.
 *
 * Fails (exit 1) if any component prop in the registry lacks a `description`, so
 * the prop tables on the docs site (and the /docs/api reference) never regress
 * to bare name/type rows — the gap the dashboard feedback hit. A small reviewed
 * allowlist exempts genuinely self-describing passthrough props.
 *
 * Run with: `pnpm docs:coverage` (also runs in CI).
 */
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(HERE, '..', '..')
const REGISTRY_PATH = join(REPO_ROOT, 'registry.json')

/** Props that need no description (universally understood HTML passthroughs). */
const ALLOWLIST = new Set<string>(['key', 'ref'])

interface Prop {
  name: string
  description?: string
}
interface Component {
  name: string
  meta?: { props?: Prop[] }
}

async function main(): Promise<void> {
  const registry = JSON.parse(await readFile(REGISTRY_PATH, 'utf8')) as { components: Component[] }

  const missing: { component: string; prop: string }[] = []
  let total = 0
  for (const c of registry.components) {
    for (const p of c.meta?.props ?? []) {
      total++
      if (ALLOWLIST.has(p.name)) continue
      if (!p.description || !p.description.trim()) {
        missing.push({ component: c.name, prop: p.name })
      }
    }
  }

  const documented = total - missing.length
  if (missing.length === 0) {
    console.log(`docs:coverage — OK. All ${total} component props are documented.`)
    return
  }

  console.error(
    `docs:coverage — ${missing.length}/${total} props undocumented (${Math.round(
      (documented / total) * 100,
    )}% covered):\n`,
  )
  for (const m of missing) {
    console.error(`  ✗ ${m.component}: prop "${m.prop}" has no description.`)
  }
  console.error(`\nFix: add a one-line behavioral "description" to each prop in its *.meta.ts.`)
  process.exit(1)
}

await main()
