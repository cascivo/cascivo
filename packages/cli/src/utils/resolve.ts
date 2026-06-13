import type { CascadeConfig, RegistryNamespaceConfig } from './config.js'
import { fetchJson } from './http.js'
import type { RegistryItem } from '@cascivo/registry'

export type AddressKind = 'bare' | 'namespace' | 'url' | 'github'

export interface ParsedAddress {
  kind: AddressKind
  namespace?: string
  name: string
  ref?: string
  raw: string
}

const GITHUB_RE = /^([^/]+)\/([^/]+)\/([^#]+)(?:#(.+))?$/

function expandEnv(str: string, env: NodeJS.ProcessEnv = process.env): string {
  return str.replace(/\$\{([^}]+)\}/g, (_, key: string) => {
    const val = env[key]
    if (val === undefined) throw new Error(`Environment variable ${key} is not set`)
    return val
  })
}

export function parseAddress(spec: string, env: NodeJS.ProcessEnv = process.env): ParsedAddress {
  if (
    spec.startsWith('http://') ||
    spec.startsWith('https://') ||
    spec.startsWith('./') ||
    spec.startsWith('/')
  ) {
    return { kind: 'url', name: spec, raw: spec }
  }

  if (spec.startsWith('@')) {
    const slash = spec.indexOf('/', 1)
    if (slash === -1) throw new Error(`Invalid namespace address: ${spec} (expected @ns/name)`)
    const namespace = spec.slice(0, slash)
    const name = spec.slice(slash + 1)
    return { kind: 'namespace', namespace, name, raw: spec }
  }

  // GitHub: owner/repo/item[#ref] — at least 3 path segments, no leading protocol/dot
  const specWithoutRef = spec.includes('#') ? spec.slice(0, spec.indexOf('#')) : spec
  const githubMatch = GITHUB_RE.exec(spec)
  if (githubMatch && !specWithoutRef.includes('.') && specWithoutRef.split('/').length >= 3) {
    const [, owner, repo, item, ref] = githubMatch
    return {
      kind: 'github',
      name: `${owner}/${repo}/${item}`,
      ref: ref ?? 'main',
      raw: spec,
    }
  }

  return { kind: 'bare', name: spec, raw: spec }
}

function resolveNamespaceUrl(
  ns: string,
  name: string,
  nsCfg: RegistryNamespaceConfig,
  env: NodeJS.ProcessEnv,
): string {
  const template = typeof nsCfg === 'string' ? nsCfg : nsCfg.url
  if (!template.includes('{name}')) {
    throw new Error(`Registry namespace "${ns}" URL template must contain {name}: ${template}`)
  }
  return expandEnv(template.replace('{name}', name), env)
}

export async function resolveItemUrl(
  addr: ParsedAddress,
  config: CascadeConfig,
  env: NodeJS.ProcessEnv = process.env,
  resolveNamespaceHook?: (ns: string) => Promise<RegistryNamespaceConfig | null>,
): Promise<{ url: string; headers?: Record<string, string>; params?: Record<string, string> }> {
  switch (addr.kind) {
    case 'url':
      return { url: addr.name }

    case 'bare': {
      const base = config.registry.replace(/\/registry\.json$/, '').replace(/\/r$/, '')
      return { url: `${base}/r/${addr.name}.json` }
    }

    case 'github': {
      const parts = addr.name.split('/')
      const owner = parts[0]!
      const repo = parts[1]!
      const item = parts.slice(2).join('/')
      const ref = addr.ref ?? 'main'
      return {
        url: `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/r/${item}.json`,
      }
    }

    case 'namespace': {
      const ns = addr.namespace!
      const name = addr.name

      // Config-defined namespaces always win
      if (config.registries?.[ns]) {
        const nsCfg = config.registries[ns]!
        const url = resolveNamespaceUrl(ns, name, nsCfg, env)
        const headers = typeof nsCfg !== 'string' ? nsCfg.headers : undefined
        const params = typeof nsCfg !== 'string' ? nsCfg.params : undefined
        const expandedHeaders = headers
          ? Object.fromEntries(Object.entries(headers).map(([k, v]) => [k, expandEnv(v, env)]))
          : undefined
        const expandedParams = params
          ? Object.fromEntries(Object.entries(params).map(([k, v]) => [k, expandEnv(v, env)]))
          : undefined
        const result: {
          url: string
          headers?: Record<string, string>
          params?: Record<string, string>
        } = { url }
        if (expandedHeaders) result.headers = expandedHeaders
        if (expandedParams) result.params = expandedParams
        return result
      }

      // Directory fallback hook (injected from T3)
      if (resolveNamespaceHook) {
        const hookResult = await resolveNamespaceHook(ns)
        if (hookResult) {
          const url = resolveNamespaceUrl(ns, name, hookResult, env)
          return { url }
        }
      }

      // Built-in @cascade namespace fallback
      if (ns === '@cascade') {
        return { url: `https://cascade-ui.dev/r/${name}.json` }
      }

      throw new Error(
        `Unknown namespace "${ns}". Add it to registries in cascade.config.ts or check the directory at cascade-ui.dev`,
      )
    }
  }
}

export interface InstallPlan {
  items: {
    spec: string
    addr: ParsedAddress
    itemUrl: string
    headers?: Record<string, string>
    params?: Record<string, string>
    item: RegistryItem
    registryBase: string
  }[]
}

export async function resolveClosure(
  specs: string[],
  config: CascadeConfig,
  env: NodeJS.ProcessEnv = process.env,
  resolveNamespaceHook?: (ns: string) => Promise<RegistryNamespaceConfig | null>,
): Promise<InstallPlan> {
  const seen = new Set<string>()
  const queue: string[] = [...specs]
  const plan: InstallPlan['items'] = []

  while (queue.length > 0) {
    const spec = queue.shift()!
    const addr = parseAddress(spec, env)
    const identity = addr.raw

    if (seen.has(identity)) continue
    seen.add(identity)

    const { url, headers, params } = await resolveItemUrl(addr, config, env, resolveNamespaceHook)
    const fetchOpts: Parameters<typeof fetchJson>[1] = {}
    if (headers) fetchOpts.headers = headers
    if (params) fetchOpts.params = params
    const raw = await fetchJson(url, fetchOpts)
    const item = raw as RegistryItem

    const base = url.replace(/\/[^/]+\.json$/, '')

    const entry: InstallPlan['items'][number] = {
      spec,
      addr,
      itemUrl: url,
      item,
      registryBase: base,
    }
    if (headers) entry.headers = headers
    if (params) entry.params = params
    plan.push(entry)

    for (const dep of item.registryDependencies ?? []) {
      queue.push(dep)
    }
  }

  return { items: plan }
}
