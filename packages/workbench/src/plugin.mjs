/**
 * The virtual modules that turn a project's copied components into workbench entries.
 *
 * Nothing here is written by hand per component. `cascivo add` copies each component's
 * manifest (`<name>.meta.ts`) next to its source, and the manifest already carries what a
 * story would: `examples[]` are JSX, `props[]` are the controls' vocabulary, `tokens[]` are the
 * custom properties it reads. A `*.preview.tsx` file covers what has no manifest — a page, an
 * app's own component — with the `previewProps` convention `@cascivo/email-preview` uses.
 *
 * Vite does the real work, as in the email preview: the files are `.tsx`, and an edit / look /
 * edit loop is HMR, so they go into Vite's module graph rather than through a loader.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { transformWithOxc } from 'vite'

const ENTRIES_ID = 'virtual:cascivo-workbench-entries'
const SCOPE_ID = 'virtual:cascivo-workbench-scope'
const STYLES_ID = 'virtual:cascivo-workbench-styles'
const TEXT_ID = 'virtual:cascivo-workbench-text'
/** One module per manifest, so a broken example takes down its component, not the sidebar. */
const EXAMPLES_PREFIX = '/@cascivo-workbench/examples/'

const META_FILE = /\.meta\.ts$/
const PREVIEW_FILE = /\.preview\.(tsx|jsx)$/
const BLUEPRINT = 'cascivo.app.json'
/** A registry block's name, which becomes a path below: one kebab-case segment, nothing else. */
const BLOCK_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Every manifest and preview under `dir`, in a stable order. */
export function scan(dir) {
  const metas = []
  const previews = []
  const walk = (d) => {
    for (const entry of readdirSync(d).sort()) {
      if (entry === 'node_modules' || entry.startsWith('.')) continue
      const full = join(d, entry)
      if (statSync(full).isDirectory()) walk(full)
      else if (META_FILE.test(entry)) metas.push(full)
      else if (PREVIEW_FILE.test(entry)) previews.push(full)
    }
  }
  walk(dir)
  return { metas, previews }
}

/**
 * The app's `cascivo.app.json`: beside the scanned directory (the default `src` sits in the app
 * root), else in the project. `null` when the app was not generated from a blueprint.
 */
export function findBlueprint(root, project) {
  for (const dir of [dirname(resolve(root)), resolve(project)]) {
    const file = join(dir, BLUEPRINT)
    if (existsSync(file)) return file
  }
  return null
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** `auth-login` → `AuthLogin`, the name `cascivo create` imports a block's component by. */
function pascalCase(name) {
  return name.replace(/(^|-)([a-z0-9])/g, (_, _sep, c) => c.toUpperCase())
}

function slug(title) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'page'
  )
}

/**
 * The blueprint's pages that render a block, as entries. A generated page is `<Block />` and
 * nothing else, and a block carries its own sample data, so rendering the block with no props
 * is rendering the page. Pages without a block are placeholders, with nothing to look at.
 *
 * The file is hand-editable and `block` becomes a path, so it is read as `unknown` and a block
 * name is accepted only as one kebab-case segment whose source exists in `src/blocks/`.
 */
export function blueprintPages(file) {
  if (!file) return []
  let raw
  try {
    raw = JSON.parse(readFileSync(file, 'utf8'))
  } catch (e) {
    throw new Error(`${file} is not valid JSON: ${e instanceof Error ? e.message : String(e)}`)
  }
  const pages = isRecord(raw) && Array.isArray(raw.pages) ? raw.pages : []
  return pages.flatMap((page, n) => {
    if (!isRecord(page) || typeof page.block !== 'string' || !BLOCK_NAME.test(page.block)) {
      return []
    }
    const source = join(dirname(file), 'src', 'blocks', `${page.block}.tsx`)
    if (!existsSync(source)) return []
    const title =
      typeof page.title === 'string' && page.title.trim() !== '' ? page.title.trim() : page.block
    return [{ id: `app/${n}-${slug(title)}`, title, file: source, name: pascalCase(page.block) }]
  })
}

/** The module a manifest's component is imported from: its directory's barrel, else its source. */
function componentModule(metaFile) {
  const dir = dirname(metaFile)
  const name = basename(metaFile).replace(META_FILE, '')
  for (const candidate of ['index.ts', 'index.tsx', `${name}.tsx`, `${name}.ts`]) {
    if (existsSync(join(dir, candidate))) return join(dir, candidate)
  }
  return null
}

/**
 * The names an example renders as tags. Each is read from the scope of every copied
 * component, so a Card example that composes a Button works when both were copied, and fails
 * inside its own error boundary when Button was not.
 */
export function tagNames(code) {
  return [...new Set([...code.matchAll(/<([A-Z][A-Za-z0-9]*)/g)].map((m) => m[1]))].sort()
}

/** Every copied component's exports, as one namespace the examples read from. */
export function scopeModule(metas) {
  const modules = [...new Set(metas.map(componentModule).filter(Boolean))]
  // Two components exporting one name is ambiguous, and an ambiguous `export *` binding is
  // left out rather than thrown on, so one clash cannot blank every example.
  return modules.map((file) => `export * from ${JSON.stringify(file)}`).join('\n') + '\n'
}

/**
 * Whether `code` is one JSX expression, the form `meta.examples[].code` is written in. Some
 * examples are snippets instead (`const { toast } = useToast()`), and one of those in the
 * generated module would be a parse error that takes the component's other examples with it.
 */
export async function isExpression(code) {
  try {
    await transformWithOxc(`void (\n${code}\n)`, 'example.tsx', { lang: 'tsx' })
    return true
  } catch {
    return false
  }
}

/**
 * The examples of one manifest, as render functions in the order of `meta.examples`; `null`
 * for one that is a snippet to read rather than an expression to render. The `code` strings
 * become JSX here because JSX has to exist when Vite compiles, not at runtime.
 */
export async function examplesModule(examples, own = null) {
  const codes = await Promise.all(
    examples.map(async (example) => {
      const code = typeof example?.code === 'string' ? example.code : null
      return code !== null && (await isExpression(code)) ? code : null
    }),
  )
  const names = [...new Set(codes.filter(Boolean).flatMap(tagNames))]
  const lines = [`import * as scope from ${JSON.stringify(SCOPE_ID)}`]
  // The component's own module wins: two copied components can export one name
  // (`input-group` and `button-group` both export `ButtonGroup`), and an ambiguous name is
  // missing from the shared scope altogether.
  if (own) lines.push(`import * as own from ${JSON.stringify(own)}`)
  lines.push(`const names = ${own ? '{ ...scope, ...own }' : 'scope'}`)
  if (names.length > 0) lines.push(`const { ${names.join(', ')} } = names`)
  lines.push(`export default [`)
  for (const code of codes) lines.push(code === null ? '  null,' : `  () => (\n${code}\n  ),`)
  lines.push(`]`)
  // The tags each example uses that no copied component exports, so a failed render can say
  // which component is missing rather than React's "element type is invalid".
  const tags = codes.map((code) => (code === null ? [] : tagNames(code)))
  lines.push(
    `export const unresolved = ${JSON.stringify(tags)}.map((t) => t.filter((n) => names[n] === undefined))`,
  )
  return lines.join('\n') + '\n'
}

/** Ids are paths relative to the scanned directory, so they are stable and readable. */
function idFor(root, file, pattern) {
  return relative(root, file).replace(pattern, '').replaceAll('\\', '/')
}

export function entriesModule(root, { metas, previews, pages: blueprint = [] }) {
  const lines = []
  const components = []
  metas.forEach((file, i) => {
    lines.push(`import { meta as meta${i} } from ${JSON.stringify(file)}`)
    lines.push(
      `import examples${i}, { unresolved as unresolved${i} } from ${JSON.stringify(`${EXAMPLES_PREFIX}${i}.tsx`)}`,
    )
    components.push(
      `  { id: ${JSON.stringify(idFor(root, file, META_FILE))}, meta: meta${i}, render: examples${i}, unresolved: unresolved${i} }`,
    )
  })
  const pages = []
  previews.forEach((file, i) => {
    lines.push(`import * as preview${i} from ${JSON.stringify(file)}`)
    pages.push(
      `  { id: ${JSON.stringify(idFor(root, file, PREVIEW_FILE))}, kind: 'preview', title: ${JSON.stringify(idFor(root, file, PREVIEW_FILE))}, Component: preview${i}.default, props: preview${i}.previewProps ?? {} }`,
    )
  })
  // A namespace import, so a block that no longer exports its name drops out of the list
  // instead of failing the whole module.
  blueprint.forEach((page, i) => {
    lines.push(`import * as page${i} from ${JSON.stringify(page.file)}`)
    pages.push(
      `  { id: ${JSON.stringify(page.id)}, kind: 'page', title: ${JSON.stringify(page.title)}, Component: page${i}[${JSON.stringify(page.name)}], props: {} }`,
    )
  })
  lines.push(`export const source = ${JSON.stringify(root)}`)
  lines.push(`export const components = [\n${components.join(',\n')}\n].filter((c) => c.meta)`)
  lines.push(
    `export const previews = [\n${pages.join(',\n')}\n].filter((p) => typeof p.Component === 'function')`,
  )
  return lines.join('\n') + '\n'
}

/** Resolve a specifier from the first of `from` that has it installed, or `null`. */
export function resolver(from) {
  const requires = (Array.isArray(from) ? from : [from]).map((dir) =>
    createRequire(join(dir, 'noop.js')),
  )
  return (specifier) => {
    for (const require of requires) {
      try {
        return require.resolve(specifier)
      } catch {
        // Not installed where this one looks; try the next.
      }
    }
    return null
  }
}

/**
 * The stylesheets copied components expect the app to have loaded: tokens and every theme, so
 * the theme switcher has something to switch. Resolved from the project, which installed them
 * with `cascivo init` (`from` is tried in order: its root, then the scanned directory); a
 * project without them still renders, unstyled, and says why.
 */
export function stylesModule(from, extra = []) {
  const resolveFirst = resolver(from)
  const imports = []
  const missing = []
  for (const specifier of ['@cascivo/tokens', '@cascivo/themes/all.css']) {
    const file = resolveFirst(specifier)
    if (file) imports.push(file)
    else missing.push(specifier)
  }
  return (
    [...imports, ...extra].map((file) => `import ${JSON.stringify(file)}`).join('\n') +
    `\nexport const missing = ${JSON.stringify(missing)}\n`
  )
}

/**
 * `elementToMarkdown` from the project's `@cascivo/text`, or `null`. Optional rather than a
 * dependency: `@cascivo/text` releases in lockstep with `@cascivo/core`, and a dev tool that
 * depended on it would have to as well.
 */
export function textModule(from) {
  const file = resolver(from)('@cascivo/text')
  return file
    ? `export { elementToMarkdown } from ${JSON.stringify(file)}\n`
    : 'export const elementToMarkdown = null\n'
}

/** The URL that renders one entry alone, in one theme: what a test or an axe sweep opens. */
export function embedUrl(hash, theme = 'light') {
  return `/?embed&theme=${encodeURIComponent(theme)}${hash}`
}

/**
 * Every entry, as `/index.json` serves it: the "iframe URL per entry plus an index" an axe
 * sweep or a visual test needs (2026-10-07 research, §5.3).
 */
export async function entryIndex(root, { metas, previews, pages = [] }, load) {
  const entries = []
  for (const file of metas) {
    const id = idFor(root, file, META_FILE)
    const { meta } = await load(file)
    const examples = Array.isArray(meta?.examples) ? meta.examples : []
    const codes = await Promise.all(
      examples.map((e) => (typeof e?.code === 'string' ? isExpression(e.code) : false)),
    )
    examples.forEach((example, n) => {
      const hash = `#component/${id}/${n}`
      entries.push({
        id: `${id}/${n}`,
        kind: 'component',
        component: typeof meta?.name === 'string' ? meta.name : id,
        title: typeof example?.title === 'string' ? example.title : `Example ${n + 1}`,
        renders: codes[n],
        url: embedUrl(hash),
      })
    })
  }
  for (const file of previews) {
    const id = idFor(root, file, PREVIEW_FILE)
    entries.push({
      id,
      kind: 'preview',
      component: id,
      title: id,
      renders: true,
      url: embedUrl(`#preview/${id}`),
    })
  }
  for (const page of pages) {
    entries.push({
      id: page.id,
      kind: 'page',
      component: page.name,
      title: page.title,
      renders: true,
      url: embedUrl(`#preview/${page.id}`),
    })
  }
  return { v: 1, entries }
}

/**
 * @param {{ dir: string, styles?: string[], project?: string }} options
 */
export function cascivoWorkbench({ dir, styles = [], project = process.cwd() }) {
  const root = resolve(dir)
  const extra = styles.map((file) => resolve(file))
  const blueprint = findBlueprint(root, project)
  let found = { ...scan(root), pages: blueprintPages(blueprint) }
  /** @type {import('vite').ViteDevServer | undefined} */
  let dev
  return {
    name: 'cascivo-workbench',
    resolveId(id) {
      if ([ENTRIES_ID, SCOPE_ID, STYLES_ID, TEXT_ID].includes(id)) return `\0${id}`
      // Not `\0`-prefixed: the id has to end in `.tsx` for Vite to compile the JSX in it.
      if (id.startsWith(EXAMPLES_PREFIX)) return id
      return null
    },
    async load(id) {
      if (id === `\0${ENTRIES_ID}`) return entriesModule(root, found)
      if (id === `\0${SCOPE_ID}`) return scopeModule(found.metas)
      if (id === `\0${STYLES_ID}`) return stylesModule([resolve(project), root], extra)
      if (id === `\0${TEXT_ID}`) return textModule([resolve(project), root])
      if (id.startsWith(EXAMPLES_PREFIX)) {
        const file = found.metas[Number(id.slice(EXAMPLES_PREFIX.length).replace(/\.tsx$/, ''))]
        if (!file || !dev) return 'export default []\nexport const unresolved = []\n'
        // Loaded the way Vite loads any module, so a manifest is read exactly, whatever it
        // imports, rather than parsed for its strings.
        const { meta } = await dev.ssrLoadModule(file)
        return examplesModule(
          Array.isArray(meta?.examples) ? meta.examples : [],
          componentModule(file),
        )
      }
      return null
    },
    configureServer(server) {
      dev = server
      server.watcher.add(root)
      const graph = server.moduleGraph
      const reload = () => (server.hot ?? server.ws)?.send({ type: 'full-reload' })
      // A changed manifest changes its examples' JSX, which lives in a generated module Vite
      // does not know depends on it.
      server.watcher.on('change', (file) => {
        const i = found.metas.indexOf(file)
        if (i === -1) return
        const mod = graph.getModuleById(`${EXAMPLES_PREFIX}${i}.tsx`)
        if (mod) graph.invalidateModule(mod)
        const ssr = server.moduleGraph.getModuleById(file)
        if (ssr) graph.invalidateModule(ssr)
        reload()
      })
      // Adding or removing a component changes the sidebar, which no HMR patch expresses.
      const rescan = (file) => {
        if (!META_FILE.test(file) && !PREVIEW_FILE.test(file) && file !== blueprint) return
        let pages = found.pages
        try {
          pages = blueprintPages(blueprint)
        } catch (e) {
          // Mid-edit JSON: keep the last pages until the file parses again.
          server.config.logger.warn(e instanceof Error ? e.message : String(e))
        }
        found = { ...scan(root), pages }
        for (const id of [ENTRIES_ID, SCOPE_ID]) {
          const mod = graph.getModuleById(`\0${id}`)
          if (mod) graph.invalidateModule(mod)
        }
        reload()
      }
      server.watcher.on('add', rescan)
      server.watcher.on('unlink', rescan)
      // `cascivo app add page` adds a page by rewriting the blueprint.
      if (blueprint) {
        server.watcher.add(blueprint)
        server.watcher.on('change', (file) => {
          if (file === blueprint) rescan(file)
        })
      }

      server.middlewares.use('/index.json', (_req, res, next) => {
        entryIndex(root, found, (file) => server.ssrLoadModule(file))
          .then((index) => {
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify(index))
          })
          .catch(next)
      })
    },
  }
}
