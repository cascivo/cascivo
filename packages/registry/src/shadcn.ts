/**
 * shadcn-registry-compatible projection of the cascivo registry.
 *
 * This is purely ADDITIVE interop: it maps cascivo's own `RegistryItem`s into
 * the shadcn `registry:*` item schema so the shadcn CLI can install a cascivo
 * component (`npx shadcn add <host>/r/shadcn/<name>.json`). cascivo's own
 * `registry.json` schema is untouched.
 *
 * cascivo is CSS-native: components ship `.tsx` + `.module.css` and rely on a
 * `@cascivo/themes` import plus the `@cascivo/core` peer — there is no Tailwind
 * config, so no `cssVars`/`tailwind` block is emitted.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { RegistryIndex, RegistryItem, RegistryItemType } from './types.ts'

const SHADCN_ITEM_SCHEMA = 'https://ui.shadcn.com/schema/registry-item.json'
const SHADCN_REGISTRY_SCHEMA = 'https://ui.shadcn.com/schema/registry.json'

export type ShadcnItemType =
  | 'registry:component'
  | 'registry:block'
  | 'registry:lib'
  | 'registry:ui'
  | 'registry:hook'
  | 'registry:theme'
  | 'registry:style'
  | 'registry:file'

export interface ShadcnRegistryFile {
  path: string
  type: ShadcnItemType
  content?: string
  target?: string
}

export interface ShadcnRegistryItem {
  $schema: string
  name: string
  type: ShadcnItemType
  description?: string
  dependencies?: string[]
  registryDependencies?: string[]
  files: ShadcnRegistryFile[]
  categories?: string[]
  meta?: Record<string, unknown>
}

export interface ToShadcnOptions {
  /** Resolve a cascivo file URL to its source text, to inline as `content`. */
  resolveContent?: (fileUrl: string) => string | undefined
  /**
   * Base URL of the hosted shadcn registry (e.g. `https://cascivo.com/r/shadcn`).
   * When set, each `registryDependencies` entry is rewritten to an absolute
   * `<base>/<name>.json` URL so the shadcn CLI fetches cascivo's own dependency
   * (not a same-named item from the default shadcn.com registry).
   */
  registryBaseUrl?: string
}

const TYPE_MAP: Record<RegistryItemType, ShadcnItemType> = {
  component: 'registry:component',
  layout: 'registry:block',
  block: 'registry:block',
  section: 'registry:block',
  chart: 'registry:component',
  theme: 'registry:theme',
  style: 'registry:style',
  template: 'registry:block',
}

/** Flatten a possibly-prefixed cascivo name ("block/x") into a shadcn slug. */
export function shadcnName(name: string): string {
  return name.replace(/\//g, '-')
}

function filePath(fileUrl: string, slug: string): string {
  const base = fileUrl.split('/').pop() ?? fileUrl
  return `${slug}/${base}`
}

export function toShadcnItem(item: RegistryItem, opts: ToShadcnOptions = {}): ShadcnRegistryItem {
  const slug = shadcnName(item.name)
  const type = TYPE_MAP[item.type] ?? 'registry:component'

  const files: ShadcnRegistryFile[] = item.files.map((f) => {
    const file: ShadcnRegistryFile = { path: filePath(f.url, slug), type }
    const content = opts.resolveContent?.(f.url)
    if (content !== undefined) file.content = content
    return file
  })

  const out: ShadcnRegistryItem = {
    $schema: SHADCN_ITEM_SCHEMA,
    name: slug,
    type,
    files,
  }
  if (item.description) out.description = item.description
  if (item.dependencies.length > 0) out.dependencies = [...item.dependencies]
  if (item.registryDependencies && item.registryDependencies.length > 0) {
    const base = opts.registryBaseUrl?.replace(/\/+$/, '')
    out.registryDependencies = item.registryDependencies.map((dep) =>
      base ? `${base}/${shadcnName(dep)}.json` : shadcnName(dep),
    )
  }
  if (item.category) out.categories = [item.category]
  out.meta = { cascivo: { type: item.type, version: item.version } }
  return out
}

/**
 * Write one shadcn `r/<name>.json` per item (with inlined file content when a
 * resolver is supplied) plus a lean `registry.json` index (content omitted).
 */
export async function writeShadcnRegistry(
  index: RegistryIndex,
  outDir: string,
  opts: ToShadcnOptions = {},
): Promise<void> {
  await mkdir(outDir, { recursive: true })

  // Absolute base for cross-item `registryDependencies` URLs. The registry is
  // served at `<homepage>/r/shadcn/`; fall back to caller-supplied opts if the
  // index carries no homepage.
  const registryBaseUrl =
    opts.registryBaseUrl ??
    (index.homepage ? `${index.homepage.replace(/\/+$/, '')}/r/shadcn` : undefined)
  const itemOpts: ToShadcnOptions = registryBaseUrl ? { ...opts, registryBaseUrl } : { ...opts }

  const sorted = [...index.items].sort((a, b) => a.name.localeCompare(b.name))
  const items = sorted.map((it) => toShadcnItem(it, itemOpts))

  for (const item of items) {
    await writeFile(join(outDir, `${item.name}.json`), `${JSON.stringify(item, null, 2)}\n`, 'utf8')
  }

  const indexItems = items.map((it) => ({
    ...it,
    files: it.files.map((f) => ({
      path: f.path,
      type: f.type,
      ...(f.target ? { target: f.target } : {}),
    })),
  }))
  const registry = {
    $schema: SHADCN_REGISTRY_SCHEMA,
    name: index.name,
    ...(index.homepage ? { homepage: index.homepage } : {}),
    items: indexItems,
  }
  await writeFile(join(outDir, 'registry.json'), `${JSON.stringify(registry, null, 2)}\n`, 'utf8')
}
