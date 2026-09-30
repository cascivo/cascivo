// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { exportPage, exportUrl, handleExport, isExporting } from './export'
import type { ExportBrowser } from './export'

/** A browser that records what it was asked to do. */
function fakeBrowser(fail?: 'goto') {
  const calls: string[] = []
  let closed = false
  const browser: ExportBrowser = {
    async newPage() {
      return {
        setViewport: async (v) => void calls.push(`viewport ${v.width}x${v.height}`),
        emulateMediaType: async (t) => void calls.push(`media ${t}`),
        goto: async (url) => {
          calls.push(`goto ${url}`)
          if (fail === 'goto') throw new Error('Navigation timeout')
        },
        waitForSelector: async (s) => void calls.push(`wait ${s}`),
        pdf: async (o) => {
          calls.push(`pdf ${o.format}${o.landscape ? ' landscape' : ''}`)
          return new Uint8Array([37, 80, 68, 70])
        },
        screenshot: async (o) => {
          calls.push(o.fullPage ? 'png' : 'png viewport')
          return new Uint8Array([137, 80, 78, 71])
        },
      }
    },
    close: async () => void (closed = true),
  }
  return { launch: async () => browser, calls, closed: () => closed }
}

const get = (query: string, method = 'GET') =>
  new Request(`https://app.example/api/export${query}`, { method })

describe('handleExport', () => {
  it('renders a page of this app, flagged as an export, into a PDF download', async () => {
    const b = fakeBrowser()
    const response = (await handleExport(
      get(`?page=${encodeURIComponent('/reports?q=1')}&format=pdf`),
      b,
    ))!
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/pdf')
    expect(response.headers.get('content-disposition')).toBe('attachment; filename="reports.pdf"')
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([37, 80, 68, 70]))
    expect(b.calls).toEqual([
      'viewport 1280x800',
      'media print',
      'goto https://app.example/reports?q=1&export=1',
      'pdf A4',
    ])
    expect(b.closed()).toBe(true)
  })

  it('takes a full-page PNG with screen styles', async () => {
    const b = fakeBrowser()
    const response = (await handleExport(get('?page=/&format=png'), b))!
    expect(response.headers.get('content-type')).toBe('image/png')
    expect(response.headers.get('content-disposition')).toContain('page.png')
    expect(b.calls).toContain('media screen')
    expect(b.calls).toContain('png')
  })

  it('waits for the ready selector when one is set, and honours landscape', async () => {
    const b = fakeBrowser()
    await handleExport(get('?page=/reports&format=pdf&landscape=1'), {
      ...b,
      readySelector: '[data-export-ready]',
    })
    expect(b.calls.slice(-2)).toEqual(['wait [data-export-ready]', 'pdf A4 landscape'])
  })

  it.each([
    ['another origin', '//evil.example/x'],
    ['a URL', 'https://evil.example/'],
    ['a relative path', 'reports'],
    ['a backslash', '/\\evil.example'],
    ['a way out', '/a/../api/export'],
    ['the API, which could loop', '/api/export?page=/'],
  ])('refuses %s as the page', async (_, page) => {
    const b = fakeBrowser()
    const response = (await handleExport(get(`?page=${encodeURIComponent(page)}`), b))!
    expect(response.status).toBe(400)
    expect(b.calls).toEqual([])
  })

  it('refuses an unknown format and a non-GET, and ignores other paths', async () => {
    const b = fakeBrowser()
    expect((await handleExport(get('?page=/&format=gif'), b))!.status).toBe(400)
    expect((await handleExport(get('?page=/', 'POST'), b))!.status).toBe(405)
    expect(await handleExport(new Request('https://app.example/api/other'), b)).toBeNull()
  })

  it('closes the browser when the page fails to load', async () => {
    const b = fakeBrowser('goto')
    await expect(exportPage(b.launch, 'https://app.example/', { format: 'pdf' })).rejects.toThrow(
      'Navigation timeout',
    )
    expect(b.closed()).toBe(true)
  })
})

describe('export helpers', () => {
  it('builds the download link and detects the export flag', () => {
    expect(exportUrl('/reports?month=9', 'png')).toBe(
      '/api/export?page=%2Freports%3Fmonth%3D9&format=png',
    )
    expect(isExporting('?export=1')).toBe(true)
    expect(isExporting('?q=1')).toBe(false)
  })
})

describe('exportPage', () => {
  it('captures only the viewport when asked, for a fixed-size image', async () => {
    const b = fakeBrowser()
    await exportPage(b.launch, 'https://app.example/p/abc', {
      format: 'png',
      viewport: { width: 1200, height: 630 },
      fullPage: false,
    })
    expect(b.calls).toEqual([
      'viewport 1200x630',
      'media screen',
      'goto https://app.example/p/abc?export=1',
      'png viewport',
    ])
  })
})
