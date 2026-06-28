import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type { RegistryItem, TemplateMeta } from '@cascivo/registry'
import { writeFileSafe } from '../utils/fs.js'

export interface TemplateInitOptions {
  /** kebab-case template name (also the source folder + registry item name). */
  name: string
  /** Discovery category, e.g. "dashboard". */
  category: string
  /** Target framework for the page source. */
  framework: TemplateMeta['framework']
  /** Components the template composes (registry names). */
  components: string[]
  /** Repo owner/name used to build raw file URLs and the homepage. */
  repo?: string
  /** License SPDX id. */
  license: string
  /** Author. */
  author?: string
}

export interface ScaffoldFile {
  /** Path relative to the template repo root. */
  path: string
  contents: string
}

function pascal(name: string): string {
  return name
    .split(/[-_/]/)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
}

function rawUrl(repo: string | undefined, path: string): string {
  if (!repo) return path
  return `https://raw.githubusercontent.com/${repo}/main/${path}`
}

function pageSource(name: string, components: string[]): string {
  const comp = pascal(name)
  const importLine =
    components.length > 0
      ? `// Components installed via the template's registryDependencies:\n// ${components.join(', ')}\n`
      : ''
  return `${importLine}import './${name}.module.css'

/**
 * ${comp} template page. Owned, copy-paste source — adapt freely.
 * Presentational only: no useState/useEffect (cascade house rules).
 */
export function ${comp}Page() {
  return (
    <main className="${name}-page">
      <h1>${comp}</h1>
      {/* Compose the template's components here. */}
    </main>
  )
}
`
}

function cssSource(name: string): string {
  return `@layer components {
  .${name}-page {
    display: grid;
    gap: var(--cascivo-space-4, 1rem);
    padding: var(--cascivo-space-4, 1rem);
  }
}
`
}

function fixturesSource(name: string): string {
  return `/** Mock data for the ${name} template. Replace with your real source. */
export const ${name.replace(/-/g, '_')}Fixtures = {
  items: [],
}
`
}

function templateMetaSource(meta: TemplateMeta): string {
  return `import type { TemplateMeta } from '@cascivo/registry'

export const meta: TemplateMeta = ${JSON.stringify(meta, null, 2)}
`
}

/**
 * Build the files + registry item for a new template. Pure — no I/O — so it can
 * be unit-tested. The caller writes the files and merges the item into
 * `cascade-registry.json`.
 */
export function buildTemplateScaffold(opts: TemplateInitOptions): {
  files: ScaffoldFile[]
  item: RegistryItem
} {
  const { name, category, framework, components, repo, license, author } = opts
  const dir = `src/${name}`
  const pageTarget = `src/pages/${name}.tsx`
  const cssTarget = `src/pages/${name}.module.css`
  const fixturesTarget = `src/fixtures/${name}.ts`

  const files: ScaffoldFile[] = [
    { path: `${dir}/${name}.tsx`, contents: pageSource(name, components) },
    { path: `${dir}/${name}.module.css`, contents: cssSource(name) },
    { path: `${dir}/fixtures.ts`, contents: fixturesSource(name) },
  ]

  const meta: TemplateMeta = {
    intent: `${pascal(name)} template`,
    framework,
    category,
    screenshots: [
      { light: rawUrl(repo, `screenshots/${name}-light.png`), alt: `${name} preview (light)` },
    ],
    fileRoles: {
      [pageTarget]: 'page',
      [cssTarget]: 'asset',
      [fixturesTarget]: 'fixture',
    },
    pages: [{ name: pascal(name), target: pageTarget }],
  }

  const item: RegistryItem = {
    schemaVersion: 2,
    name,
    type: 'template',
    description: `${pascal(name)} template`,
    category,
    version: '0.1.0',
    license,
    ...(author ? { author } : {}),
    ...(repo ? { homepage: `https://github.com/${repo}` } : {}),
    files: [
      { url: rawUrl(repo, `${dir}/${name}.tsx`), target: pageTarget },
      { url: rawUrl(repo, `${dir}/${name}.module.css`), target: cssTarget },
      { url: rawUrl(repo, `${dir}/fixtures.ts`), target: fixturesTarget },
    ],
    dependencies: [],
    registryDependencies: components,
    tags: [category, 'template'],
    meta,
  }

  files.push({ path: `${dir}/${name}.template.ts`, contents: templateMetaSource(meta) })

  return { files, item }
}

function flag(args: string[], key: string): string | undefined {
  const eq = args.find((a) => a.startsWith(`--${key}=`))
  if (eq) return eq.slice(key.length + 3)
  const idx = args.indexOf(`--${key}`)
  const next = idx !== -1 ? args[idx + 1] : undefined
  return next && !next.startsWith('--') ? next : undefined
}

export async function templateInit(args: string[], cwd: string = process.cwd()): Promise<void> {
  const name = args.find((a) => !a.startsWith('-'))
  if (!name) {
    console.error(
      'Usage: cascivo template init <name> [--category dashboard] [--framework react-vite] [--components card,line-chart] [--repo owner/repo]',
    )
    process.exitCode = 1
    return
  }

  const componentsArg = flag(args, 'components')
  const opts: TemplateInitOptions = {
    name,
    category: flag(args, 'category') ?? 'misc',
    framework: (flag(args, 'framework') as TemplateMeta['framework']) ?? 'react-vite',
    components: componentsArg
      ? componentsArg
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean)
      : [],
    license: flag(args, 'license') ?? 'MIT',
    ...(flag(args, 'repo') ? { repo: flag(args, 'repo')! } : {}),
    ...(flag(args, 'author') ? { author: flag(args, 'author')! } : {}),
  }

  const { files, item } = buildTemplateScaffold(opts)

  for (const file of files) {
    await writeFileSafe(join(cwd, file.path), file.contents)
  }

  // Merge into cascivo-registry.json (create if missing).
  const registryPath = resolve(cwd, 'cascivo-registry.json')
  let index: { schemaVersion: 2; name: string; items: RegistryItem[] }
  if (existsSync(registryPath)) {
    index = JSON.parse(await readFile(registryPath, 'utf8')) as typeof index
    index.items = (index.items ?? []).filter((i) => i.name !== item.name)
    index.items.push(item)
  } else {
    index = { schemaVersion: 2, name: opts.repo ?? name, items: [item] }
  }
  await writeFileSafe(registryPath, `${JSON.stringify(index, null, 2)}\n`)

  console.log(`Scaffolded template "${name}" (${files.length} files + cascivo-registry.json).`)
  console.log('Next: fill in the page, capture screenshots, then `cascivo registry build`.')
}
