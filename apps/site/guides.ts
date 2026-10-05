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
import rehypeShikiFromHighlighter from '@shikijs/rehype/core'
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import astro from 'shiki/langs/astro.mjs'
import css from 'shiki/langs/css.mjs'
import handlebars from 'shiki/langs/handlebars.mjs'
import htmlLang from 'shiki/langs/html.mjs'
import javascript from 'shiki/langs/javascript.mjs'
import json from 'shiki/langs/json.mjs'
import jsonc from 'shiki/langs/jsonc.mjs'
import markdown from 'shiki/langs/markdown.mjs'
import shellscript from 'shiki/langs/shellscript.mjs'
import tsx from 'shiki/langs/tsx.mjs'
import typescript from 'shiki/langs/typescript.mjs'
import yaml from 'shiki/langs/yaml.mjs'
import githubDark from 'shiki/themes/github-dark.mjs'
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
const routeBySlug = new Map(GUIDES.flatMap((g) => (g.route ? [[g.slug, g.route] as const] : [])))

/** Where a guide is served: its own `route` (a page it replaced) or `/docs/guides/<slug>`. */
export function guideRoute(slug: string): string {
  return routeBySlug.get(slug) ?? `${GUIDES_BASE}/${slug}`
}

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
    // Only the languages the guides use, on shiki's JavaScript engine — the same setup as the
    // site's own CodeBlock. The full bundle loads every grammar and took a build from 1 s to 12 s.
    const highlighter = await createHighlighterCore({
      themes: [githubDark],
      langs: [
        astro,
        css,
        handlebars,
        htmlLang,
        javascript,
        json,
        jsonc,
        markdown,
        shellscript,
        tsx,
        typescript,
        yaml,
      ],
      engine: createJavaScriptRegexEngine(),
    })
    const render = createPageRenderer({
      // Highlighted at build time with the theme and AA fix CodeBlock uses, so a guide's code
      // reads like every other sample on the site and the page ships no highlighter.
      rehypePlugins: [
        [
          rehypeShikiFromHighlighter,
          highlighter,
          {
            theme: 'github-dark',
            // github-dark's comment grey is 3.05:1 on its own background; same remap as CodeBlock.
            colorReplacements: { '#6a737d': '#9aa5b1' },
            // A fence in a language not loaded above stays a plain block rather than failing.
            fallbackLanguage: 'text',
          },
        ],
      ],
      links: {
        graph,
        target: (page) => guideRoute(page.slug),
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
          `export const routes = ${JSON.stringify(Object.fromEntries(routeBySlug))}`,
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
