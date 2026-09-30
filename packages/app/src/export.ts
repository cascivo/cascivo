/**
 * `@cascivo/app/export` — any page of the app as a PDF or PNG, rendered by Cloudflare's
 * Browser Run from the Worker.
 *
 * The Worker opens the page in a headless browser, at its own origin, with `?export=1`: the
 * app sees `isExporting()` and can drop its shell, so the file holds the page, not the nav.
 *
 * ```ts
 * // worker/index.ts
 * import puppeteer from '@cloudflare/puppeteer'
 * const exported = await handleExport(request, { launch: () => puppeteer.launch(env.BROWSER) })
 * if (exported) return exported
 * // the page
 * <a href={exportUrl('/reports', 'pdf')}>Download PDF</a>
 * ```
 */

export type ExportFormat = 'pdf' | 'png'

/** What an export needs of a page: a subset of `@cloudflare/puppeteer`'s `Page`. */
export interface ExportPage {
  setViewport(viewport: {
    width: number
    height: number
    deviceScaleFactor?: number
  }): Promise<void>
  goto(url: string, options: { waitUntil: 'networkidle0'; timeout: number }): Promise<unknown>
  waitForSelector(selector: string, options: { timeout: number }): Promise<unknown>
  emulateMediaType(type: 'print' | 'screen'): Promise<void>
  pdf(options: { format: 'A4'; printBackground: boolean; landscape: boolean }): Promise<Uint8Array>
  screenshot(options: { type: 'png'; fullPage: boolean }): Promise<Uint8Array>
}

/** What an export needs of a browser: a subset of `@cloudflare/puppeteer`'s `Browser`. */
export interface ExportBrowser {
  newPage(): Promise<ExportPage>
  close(): Promise<void>
}

export interface ExportPageOptions {
  format: ExportFormat
  /** Landscape pages, for a PDF. */
  landscape?: boolean
  /**
   * A selector the page shows once it is ready to capture — when its data has arrived. The
   * default is the network going quiet, which suits pages that load everything on start.
   */
  readySelector?: string
  /** Default 1280 × 800. */
  viewport?: { width: number; height: number }
  /** Default 15 s, for loading and for `readySelector`. */
  timeoutMs?: number
}

/** The query flag an exported page is opened with. */
const EXPORT_FLAG = 'export'

/** True inside the headless browser rendering an export: render the page without chrome. */
export function isExporting(
  search: string = typeof location === 'undefined' ? '' : location.search,
): boolean {
  return new URLSearchParams(search).has(EXPORT_FLAG)
}

/** The link that downloads `page` as a file, e.g. `exportUrl('/reports', 'pdf')`. */
export function exportUrl(
  page: string,
  format: ExportFormat = 'pdf',
  path = '/api/export',
): string {
  return `${path}?page=${encodeURIComponent(page)}&format=${format}`
}

/**
 * Renders `url` in a browser and returns the file. Use it directly from a Cron Trigger or a
 * Workflow (for a scheduled report); `handleExport` wraps it for requests.
 */
export async function exportPage(
  launch: () => Promise<ExportBrowser>,
  url: string,
  options: ExportPageOptions,
): Promise<Uint8Array> {
  const target = new URL(url)
  target.searchParams.set(EXPORT_FLAG, '1')
  const timeout = options.timeoutMs ?? 15_000
  const browser = await launch()
  try {
    const page = await browser.newPage()
    await page.setViewport(options.viewport ?? { width: 1280, height: 800 })
    await page.emulateMediaType(options.format === 'pdf' ? 'print' : 'screen')
    await page.goto(target.href, { waitUntil: 'networkidle0', timeout })
    if (options.readySelector) await page.waitForSelector(options.readySelector, { timeout })
    return options.format === 'pdf'
      ? await page.pdf({
          format: 'A4',
          printBackground: true,
          landscape: options.landscape ?? false,
        })
      : await page.screenshot({ type: 'png', fullPage: true })
  } finally {
    await browser.close()
  }
}

export interface HandleExportOptions extends Omit<ExportPageOptions, 'format' | 'landscape'> {
  /** Opens a browser: `() => puppeteer.launch(env.BROWSER)`. */
  launch: () => Promise<ExportBrowser>
  /** Where exports are served. Default `/api/export`. */
  path?: string
  /**
   * Which pages may be exported. Default: any page of this app outside `/api/` — an export
   * of an export would launch browsers in a loop.
   */
  allow?: (page: string) => boolean
}

/** A same-origin path: one leading slash, no scheme, no backslashes, nothing odd. */
const PAGE = /^\/(?!\/)[\w\-./~%?=&+]*$/

/**
 * Serves `GET <path>?page=/reports&format=pdf|png[&landscape=1]`, rendering the page at this
 * Worker's own origin. Returns `null` for other requests. It does not authenticate, and the
 * browser opens the page without the visitor's cookies: a page that needs a session renders
 * signed out. Each export starts a browser session, so put a rate limit in front of it.
 */
export async function handleExport(
  request: Request,
  options: HandleExportOptions,
): Promise<Response | null> {
  const url = new URL(request.url)
  const path = options.path ?? '/api/export'
  if (url.pathname !== path) return null
  if (request.method !== 'GET') return Response.json({ error: 'Use GET' }, { status: 405 })
  const page = url.searchParams.get('page') ?? ''
  const format = url.searchParams.get('format') ?? 'pdf'
  const allow = options.allow ?? ((p: string) => !p.startsWith('/api/'))
  if (page.length > 512 || !PAGE.test(page) || page.includes('/../') || !allow(page)) {
    return Response.json(
      { error: 'page must be a path of this app, like /reports' },
      { status: 400 },
    )
  }
  if (format !== 'pdf' && format !== 'png') {
    return Response.json({ error: 'format is pdf or png' }, { status: 400 })
  }
  const file = await exportPage(options.launch, new URL(page, url.origin).href, {
    ...options,
    format,
    landscape: url.searchParams.get('landscape') === '1',
  })
  const name =
    (page
      .split('?')[0]!
      .replace(/^\/+|\/+$/g, '')
      .replace(/[^\w-]+/g, '-') || 'page') + `.${format}`
  // `slice()`: a copy over a plain ArrayBuffer, which is what a Response body takes.
  return new Response(file.slice(), {
    headers: {
      'content-type': format === 'pdf' ? 'application/pdf' : 'image/png',
      'content-disposition': `attachment; filename="${name}"`,
      'cache-control': 'no-store',
    },
  })
}
