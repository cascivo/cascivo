import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export type { BuildContractInput, ComponentInfo, Contract, PropInfo } from './contract-pure.js'
export { buildContract, normalizeValue } from './contract-pure.js'
import type { Contract } from './contract-pure.js'
import { buildContract } from './contract-pure.js'

const HERE = dirname(fileURLToPath(import.meta.url))

/** Walk up from a start directory looking for the apps/site/public dir. */
function findDocsPublic(startDir: string): string | null {
  let dir = startDir
  for (let i = 0; i < 10; i++) {
    const candidate = join(dir, 'apps', 'site', 'public')
    if (existsSync(candidate)) return candidate
    dir = join(dir, '..')
  }
  return null
}

/** Walk up from a start directory looking for registry.json at the repo root. */
function findRegistry(startDir: string): string | null {
  let dir = startDir
  for (let i = 0; i < 10; i++) {
    const candidate = join(dir, 'registry.json')
    if (existsSync(candidate)) return candidate
    dir = join(dir, '..')
  }
  return null
}

const CONTRACT_URL = 'https://cascivo.com/audit-contract.json'

/**
 * Download the contract, caching it by version so a second run is offline-fast. Returns
 * null on any failure — the audit must never hard-depend on the network.
 */
async function fetchContract(report: (source: string) => void): Promise<Contract | null> {
  try {
    const response = await fetch(CONTRACT_URL, { signal: AbortSignal.timeout(5000) })
    if (!response.ok) return null
    const bundled = (await response.json()) as BundledContract
    try {
      const target = cachePath(bundled.version)
      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(target, JSON.stringify(bundled))
    } catch {
      // A read-only cache dir is not a reason to fail the audit.
    }
    report(`network: ${CONTRACT_URL}`)
    return fromBundled(bundled)
  } catch {
    return null
  }
}

/** The reduced contract shipped inside this package (scripts/registry/audit-contract.ts). */
interface BundledContract {
  version: string
  tokens: { name: string; resolvedDefault: string | null }[]
  components: { name: string; props: { name: string; type: string; required: boolean }[] }[]
  /** Absent in contracts cut before the hand-listed passthrough set was replaced. */
  domAttributes?: string[]
  content: string[]
  /** Absent in contracts cut before typography primitives were distinguished. */
  contentPrimitives?: string[]
}

/** Adapt the bundled shape to `buildContract`'s three-artifact input. */
function fromBundled(bundled: BundledContract): Contract {
  return buildContract({
    catalog: { tokens: bundled.tokens },
    registry: { components: bundled.components.map((c) => ({ meta: c })) },
    context: { components: bundled.content.map((name) => ({ name, intent: { content: true } })) },
    ...(bundled.domAttributes ? { domAttributes: bundled.domAttributes } : {}),
    ...(bundled.contentPrimitives ? { contentPrimitives: bundled.contentPrimitives } : {}),
  })
}

/** Where the network fallback caches a downloaded contract. */
function cachePath(version: string): string {
  const base = process.env['XDG_CACHE_HOME'] ?? join(process.env['HOME'] ?? tmpdir(), '.cache')
  return join(base, 'cascivo', `audit-contract-${version}.json`)
}

/**
 * Load the cascade contract. Resolution order, first hit wins:
 *
 *   1. an explicit path (`--contract <file>` / `options.contractPath`)
 *   2. the dev-monorepo artifacts (`apps/site/public/…` + `registry.json`)
 *   3. the contract bundled in this package  ← what makes `audit` work in a real project
 *   4. `https://cascivo.com/audit-contract.json`, cached under `~/.cache/cascivo/`
 *
 * (3) is why this exists: the walk-up in (2) only ever finds anything inside this monorepo,
 * so `cascivo audit --ai` died with "token catalog not found" in every consumer project —
 * a documented, working feature that nobody outside this repo could run. (4) is best-effort
 * and never required: `audit` works offline.
 */
export async function loadContract(options?: {
  catalogPath?: string
  contextPath?: string
  registryPath?: string
  /** Explicit contract file — either the bundled shape or a docs-public directory. */
  contractPath?: string
  /** Report which tier answered (used by `--verbose`). */
  onResolve?: (source: string) => void
}): Promise<Contract> {
  const report = options?.onResolve ?? (() => {})

  // 1. Explicit path.
  if (options?.contractPath) {
    if (!existsSync(options.contractPath)) {
      throw new Error(`contract file not found: ${options.contractPath}`)
    }
    report(`explicit: ${options.contractPath}`)
    return fromBundled(JSON.parse(readFileSync(options.contractPath, 'utf8')) as BundledContract)
  }

  // 2. Dev monorepo — unchanged, so in-repo behavior and its tests are untouched.
  const docsPublic = findDocsPublic(HERE) ?? findDocsPublic(process.cwd())
  const catalogPath =
    options?.catalogPath ?? (docsPublic ? join(docsPublic, 'tokens.catalog.json') : null)
  const contextPath = options?.contextPath ?? (docsPublic ? join(docsPublic, 'context.json') : null)
  const registryPath = options?.registryPath ?? findRegistry(HERE) ?? findRegistry(process.cwd())
  const haveMonorepo =
    catalogPath &&
    existsSync(catalogPath) &&
    registryPath &&
    existsSync(registryPath) &&
    contextPath &&
    existsSync(contextPath)

  if (!haveMonorepo) {
    // 3. Bundled contract.
    const bundled = join(HERE, 'generated', 'audit-contract.json')
    const bundledDist = join(HERE, '..', 'generated', 'audit-contract.json')
    for (const candidate of [bundled, bundledDist]) {
      if (existsSync(candidate)) {
        report(`bundled: ${candidate}`)
        return fromBundled(JSON.parse(readFileSync(candidate, 'utf8')) as BundledContract)
      }
    }

    // 4. Network, with a local cache. Best-effort: a failure falls through to the error below.
    const fetched = await fetchContract(report)
    if (fetched) return fetched

    throw new Error(
      'cascivo contract unavailable. Pass --contract <path> to a downloaded ' +
        'audit-contract.json, or run inside the cascivo monorepo. ' +
        '(The CLI normally ships one; this build appears to be missing it.)',
    )
  }
  report('monorepo artifacts')

  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8')) as Parameters<
    typeof buildContract
  >[0]['catalog']
  const registry = JSON.parse(readFileSync(registryPath, 'utf8')) as Parameters<
    typeof buildContract
  >[0]['registry']
  const context = JSON.parse(readFileSync(contextPath, 'utf8')) as Parameters<
    typeof buildContract
  >[0]['context']

  // The DOM-attribute set is derived by the contract generator (it needs the type checker),
  // so even the monorepo path reads it from the generated artifact rather than recomputing.
  let domAttributes: string[] | undefined
  let contentPrimitives: string[] | undefined
  try {
    const generated = JSON.parse(
      readFileSync(join(docsPublic!, 'audit-contract.json'), 'utf8'),
    ) as { domAttributes?: string[]; contentPrimitives?: string[] }
    domAttributes = generated.domAttributes
    contentPrimitives = generated.contentPrimitives
  } catch {
    domAttributes = undefined
    contentPrimitives = undefined
  }

  return buildContract({
    catalog,
    registry,
    context,
    ...(domAttributes ? { domAttributes } : {}),
    ...(contentPrimitives ? { contentPrimitives } : {}),
  })
}
