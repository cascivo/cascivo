/**
 * The adopter guides (`docs/*.md`, curated in `scripts/docs-md/guides.ts`) as rendered
 * `/docs/guides/<slug>` pages.
 *
 * The same Markdown already reaches agents twice — as the raw `/docs/<slug>.md` mirror and as
 * `@cascivo/docspack` chunks — and until now reached people only as that raw mirror. This renders
 * it once, at build time, with Sheaf (`@docspack/sheaf` for the page graph, `@docspack/sheaf-html`
 * for the HTML), so the page a person reads and the text an agent reads come from one parse.
 *
 * The SPA gets two things from it, through virtual modules:
 *   - `virtual:cascivo-guides` — the graph without page bodies or headings (titles, summaries,
 *     order). A few KB; it drives the index, the pager and SEO.
 *   - `virtual:cascivo-guide/<slug>` — one page's HTML and headings, imported on demand so the
 *     docs chunk does not carry all 31 guides.
 * `prerenderPages` in vite.config.ts writes the same HTML into each route's static body.
 */
import { readFileSync } from 'node:fs'
import { posix, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ContentGraph, Page } from '@docspack/sheaf'
import { graphFromSources } from '@docspack/sheaf'
import { createPageRenderer } from '@docspack/sheaf-html'
import type { Plugin } from 'vite-plus'
import { GUIDES } from '../../scripts/docs-md/guides.ts'

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const DOCS_DIR = resolve(ROOT, 'docs')
const REPO_BLOB = 'https://github.com/cascivo/cascivo/blob/main'
const REPO_TREE = 'https://github.com/cascivo/cascivo/tree/main'

export const GUIDES_BASE = '/docs/guides'

const INDEX_ID = 'virtual:cascivo-guides'
const PAGE_PREFIX = 'virtual:cascivo-guide/'

export interface RenderedGuides {
  /** Pages in curated order, bodies included. */
  readonly graph: ContentGraph
  /** Rendered article HTML, by slug. */
  readonly html: ReadonlyMap<string, string>
}

const slugBySrc = new Map(GUIDES.map((g) => [g.src, g.slug]))

/** Inline code and emphasis markers dropped: the text a reader sees. */
function plainText(markdown: string): string {
  return markdown.replace(/`|\*\*|__/g, '')
}

/**
 * Builds the graph from the curated list. Sheaf orders pages by filename, so the result is put
 * back into curated order, and each page takes its served slug from the list so the URL never
 * depends on how a filename happens to slugify.
 */
function buildGuideGraph(): ContentGraph {
  const graph = graphFromSources(
    GUIDES.map((g) => ({ path: g.src, source: readFileSync(resolve(DOCS_DIR, g.src), 'utf8') })),
  )
  const order = new Map(GUIDES.map((g, index) => [g.src, index]))
  const pages = [...graph.pages]
    .map((page) => ({
      ...page,
      slug: slugBySrc.get(page.sourcePath) ?? page.slug,
      // Sheaf keeps a title's and summary's Markdown as written (`# Headless primitives
      // (\`@cascivo/core\`)`, `**Short version:** …`), and both land in plain-text places:
      // <title>, the meta description, the pager, the guide index.
      title: plainText(page.title),
      summary: plainText(page.summary),
    }))
    .sort((a, b) => (order.get(a.sourcePath) ?? 0) - (order.get(b.sourcePath) ?? 0))
  return { ...graph, pages }
}

/** A repository path from a guide (`../apps/examples/`, `GOVERNANCE.md`) as a GitHub URL. */
function repoUrl(path: string): string {
  const fragment = path.includes('#') ? path.slice(path.indexOf('#')) : ''
  const bare = path.slice(0, path.length - fragment.length)
  const fromRoot = posix.normalize(posix.join('docs', bare)).replace(/^\.\//, '')
  return `${bare.endsWith('/') ? REPO_TREE : REPO_BLOB}/${fromRoot}${fragment}`
}

let cached: Promise<RenderedGuides> | undefined

/** Renders every guide once per build (or until a guide changes in dev). */
export function renderGuides(): Promise<RenderedGuides> {
  cached ??= (async () => {
    const graph = buildGuideGraph()
    const render = createPageRenderer({
      links: {
        graph,
        target: (page) => `${GUIDES_BASE}/${page.slug}`,
        resolve: (path) => repoUrl(path),
      },
    })
    const html = new Map<string, string>()
    for (const page of graph.pages) html.set(page.slug, (await render(page)).html)
    return { graph, html }
  })()
  return cached
}

/** The graph every guide route needs up front: no bodies, no headings (those load per page). */
function lightGraph(graph: ContentGraph): ContentGraph {
  return {
    ...graph,
    pages: graph.pages.map((page): Page => ({ ...page, body: '', content: '', headings: [] })),
  }
}

export function guidesData(): Plugin {
  return {
    name: 'cascade:guides',
    resolveId(id) {
      if (id === INDEX_ID || id.startsWith(PAGE_PREFIX)) return `\0${id}`
      return undefined
    },
    async load(id) {
      if (!id.startsWith('\0virtual:cascivo-guide')) return undefined
      const { graph, html } = await renderGuides()
      for (const g of GUIDES) this.addWatchFile(resolve(DOCS_DIR, g.src))

      if (id === `\0${INDEX_ID}`) {
        const loaders = graph.pages
          .map(
            (p) =>
              `  ${JSON.stringify(p.slug)}: () => import(${JSON.stringify(PAGE_PREFIX + p.slug)}),`,
          )
          .join('\n')
        return [
          `export const graph = ${JSON.stringify(lightGraph(graph))}`,
          `const loaders = {\n${loaders}\n}`,
          'export function loadGuide(slug) {',
          // Own keys only: a slug from the URL must not reach `constructor` and friends.
          '  return Object.hasOwn(loaders, slug) ? loaders[slug]() : Promise.resolve(undefined)',
          '}',
        ].join('\n')
      }

      const slug = id.slice(`\0${PAGE_PREFIX}`.length)
      const page = graph.pages.find((p) => p.slug === slug)
      const body = html.get(slug)
      if (page === undefined || body === undefined) this.error(`No guide with slug "${slug}"`)
      return [
        `export const html = ${JSON.stringify(body)}`,
        `export const headings = ${JSON.stringify(page.headings)}`,
      ].join('\n')
    },
    handleHotUpdate(ctx) {
      if (!GUIDES.some((g) => ctx.file === resolve(DOCS_DIR, g.src))) return
      cached = undefined
      for (const id of ctx.server.moduleGraph.idToModuleMap.keys()) {
        if (id.startsWith('\0virtual:cascivo-guide')) {
          const mod = ctx.server.moduleGraph.getModuleById(id)
          if (mod) ctx.server.moduleGraph.invalidateModule(mod)
        }
      }
    },
  }
}
