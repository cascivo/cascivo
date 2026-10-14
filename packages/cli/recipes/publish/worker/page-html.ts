import { CascivoView } from '@cascivo/render'
import { Flex, Heading } from '@cascivo/react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Page } from '../src/pages'

/** The static-assets binding (`assets.binding` in wrangler.jsonc): the built index.html. */
export interface Assets {
  fetch(request: Request): Promise<Response>
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#x27;': "'",
}

/** Rendered markup back to its visible text, for a link preview's description. */
function textOf(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:amp|lt|gt|quot|#39|#x27);/g, (entity) => ENTITIES[entity] ?? entity)
    .replace(/\s+/g, ' ')
    .trim()
}

/** The route file whose stylesheets a published page needs, as the build manifest names it. */
const PAGE_ROUTE = 'src/routes/p/[slug].tsx'

/**
 * The stylesheets the published-page route loads, from Vite's build manifest (vite.config.ts
 * writes it as asset-manifest.json). The route is loaded lazily, so its component CSS is
 * linked by JavaScript; a reader without JavaScript needs it linked in the HTML. `vite dev`
 * has no manifest, and there the CSS arrives with the JavaScript anyway.
 */
async function pageStylesheets(request: Request, assets: Assets): Promise<string[]> {
  const response = await assets.fetch(new Request(new URL('/asset-manifest.json', request.url)))
  if (!response.ok) return []
  const manifest: unknown = await response.json().catch(() => null)
  if (typeof manifest !== 'object' || manifest === null) return []
  const chunks = manifest as Record<string, unknown>
  const found = new Set<string>()
  const seen = new Set<string>()
  const walk = (key: string) => {
    if (seen.has(key)) return
    seen.add(key)
    const chunk = chunks[key]
    if (typeof chunk !== 'object' || chunk === null) return
    const { css, imports } = chunk as Record<string, unknown>
    if (Array.isArray(css)) for (const file of css) if (typeof file === 'string') found.add(file)
    if (Array.isArray(imports)) for (const next of imports) if (typeof next === 'string') walk(next)
  }
  walk(PAGE_ROUTE)
  return [...found]
}

/**
 * The app's index.html for a published page, with the page in it: a title and description
 * for search engines and link previews (which run no JavaScript), and the rendered view in
 * a `<noscript>` for readers without JavaScript. The app then starts as usual and renders
 * the page itself.
 */
export async function renderPageHtml(
  request: Request,
  page: Page,
  assets: Assets,
  imageUrl: string | null,
): Promise<Response> {
  const shell = await assets.fetch(new Request(new URL('/', request.url)))
  const view = renderToStaticMarkup(createElement(CascivoView, { config: page.view }))
  // The same layout as src/routes/p/[slug].tsx, so it is styled by the same stylesheets.
  const body = renderToStaticMarkup(
    createElement(
      Flex,
      { gap: 4 },
      createElement(Heading, { level: 1 }, page.title),
      createElement(CascivoView, { config: page.view }),
    ),
  )
  const description = textOf(view).slice(0, 160)
  const url = new URL(request.url)
  url.search = ''
  const title = escapeHtml(page.title)
  const meta = [
    `<title>${title}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<link rel="canonical" href="${escapeHtml(url.href)}" />`,
    '<meta property="og:type" content="article" />',
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(url.href)}" />`,
    ...(imageUrl
      ? [
          `<meta property="og:image" content="${escapeHtml(imageUrl)}" />`,
          '<meta property="og:image:width" content="1200" />',
          '<meta property="og:image:height" content="630" />',
          '<meta name="twitter:card" content="summary_large_image" />',
        ]
      : ['<meta name="twitter:card" content="summary" />']),
  ].join('\n    ')
  const stylesheets = (await pageStylesheets(request, assets))
    .map((file) => `<link rel="stylesheet" href="/${escapeHtml(file)}" />`)
    .join('\n    ')
  const html = (await shell.text())
    .replace(/<title>[\s\S]*?<\/title>/, stylesheets ? `${meta}\n    ${stylesheets}` : meta)
    .replace(
      '<div id="root"></div>',
      // Before the app's root, which fills the viewport: after it, the page would start below
      // the fold.
      `<noscript><main style="padding: 1.5rem">${body}</main></noscript>\n    <div id="root"></div>`,
    )
  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=60' },
  })
}
