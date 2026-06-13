import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export type { BuildContractInput, ComponentInfo, Contract, PropInfo } from './contract-pure.js'
export { buildContract, normalizeValue } from './contract-pure.js'
import type { Contract } from './contract-pure.js'
import { buildContract } from './contract-pure.js'

const HERE = dirname(fileURLToPath(import.meta.url))

/** Walk up from a start directory looking for the apps/docs/public dir. */
function findDocsPublic(startDir: string): string | null {
  let dir = startDir
  for (let i = 0; i < 10; i++) {
    const candidate = join(dir, 'apps', 'docs', 'public')
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

/**
 * Load the published cascade contract from local generated artifacts:
 * - token catalog (apps/docs/public/tokens.catalog.json) → value→token map
 * - registry.json (repo root) → component prop index
 * - context bundle (apps/docs/public/context.json) → which components have chrome text
 */
export async function loadContract(options?: {
  catalogPath?: string
  contextPath?: string
  registryPath?: string
}): Promise<Contract> {
  const docsPublic = findDocsPublic(HERE) ?? findDocsPublic(process.cwd())
  const catalogPath =
    options?.catalogPath ?? (docsPublic ? join(docsPublic, 'tokens.catalog.json') : null)
  const contextPath = options?.contextPath ?? (docsPublic ? join(docsPublic, 'context.json') : null)
  const registryPath = options?.registryPath ?? findRegistry(HERE) ?? findRegistry(process.cwd())

  if (!catalogPath || !existsSync(catalogPath)) {
    throw new Error('token catalog not found (apps/docs/public/tokens.catalog.json)')
  }
  if (!registryPath || !existsSync(registryPath)) {
    throw new Error('registry.json not found')
  }
  if (!contextPath || !existsSync(contextPath)) {
    throw new Error('context bundle not found (apps/docs/public/context.json)')
  }

  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8')) as Parameters<
    typeof buildContract
  >[0]['catalog']
  const registry = JSON.parse(readFileSync(registryPath, 'utf8')) as Parameters<
    typeof buildContract
  >[0]['registry']
  const context = JSON.parse(readFileSync(contextPath, 'utf8')) as Parameters<
    typeof buildContract
  >[0]['context']

  return buildContract({ catalog, registry, context })
}
