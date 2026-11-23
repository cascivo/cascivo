/**
 * Conformance harness for dynamic cascivo apps (Phase 3, workstream T).
 *
 * Black-box: it needs only a URL that serves the fixture contract (`README.md`), so the same
 * file runs against the solid-htmx example today and the H starter later (`targets.ts`).
 * Real Chromium, one flow per test: form submit with validation errors, dialog, toast, server
 * island, SSE and a lazy tabs swap. In every state a swap produces:
 *
 *   - axe WCAG 2.2 AA reports 0 violations (settled: no half-faded popup is measured);
 *   - focus is never on `<body>` after a swap (checkpoint γ): a monitor records every moment
 *     it was, and each test asserts the record is empty;
 *
 * and per page (checkpoint δ): the JS the page loads, gzipped, excluding htmx and the Solid
 * island, is ≤ 15 KB; htmx and the island are reported and the island has its own budget.
 *
 * Needs `pnpm build` (the example's Vite bundles) and cargo. Never skips. The harness drives
 * Playwright as a library, so there is no test runner to trace (`--trace off` is moot).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { after, before, describe, it } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { gzipSync } from 'node:zlib'
import { chromiumNote, resolveChromium } from '../lib/chromium.ts'
import { settled } from '../lib/settle.ts'
import { resolveTarget } from './targets.ts'

const target = resolveTarget()
const require = createRequire(new URL('../../../packages/elements/package.json', import.meta.url))
const AXE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')
const { paths } = target

let browser: any
let base = ''
let stop = () => {}

/** Records every moment `document.activeElement` is `<body>` after a swap or a task later. */
const MONITOR = `(() => {
  const lost = []
  window.__lostFocus = lost
  const look = (why) => {
    if (!document.activeElement || document.activeElement === document.body) lost.push(why)
  }
  for (const type of ['htmx:afterSwap', 'htmx:afterSettle'])
    document.addEventListener(type, (e) => {
      // A swap only matters when focus was somewhere; a fresh page has none to lose.
      if (document.__hadFocus) setTimeout(() => look(type + ' ' + (e.detail?.pathInfo?.requestPath ?? '')), 50)
    })
  document.addEventListener('focusin', () => (document.__hadFocus = true))
})()`

async function open(path: string, options: Record<string, unknown> = {}) {
  const context = await browser.newContext({ baseURL: base, ...options })
  await context.addInitScript(MONITOR)
  const page = await context.newPage()
  page.setDefaultTimeout(5000)
  const errors: string[] = []
  page.on('pageerror', (e: Error) => errors.push(e.message))
  page.on('console', (m: any) => m.type() === 'error' && errors.push(m.text()))
  await page.goto(path)
  return { page, errors, close: () => context.close() }
}

async function axe(page: any, state: string) {
  await settled(page)
  const violations = await page.evaluate(async (src: string) => {
    if (!(window as any).axe) (0, eval)(src)
    const r = await (window as any).axe.run(document, {
      runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
    })
    return r.violations.map((v: any) => `${v.id}: ${v.nodes.map((n: any) => n.target).join(' ')}`)
  }, AXE)
  assert.deepEqual(violations, [], `axe: ${state}`)
}

const lostFocus = (page: any) => page.evaluate(() => (window as any).__lostFocus as string[])
const active = (page: any) =>
  page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName)
async function focusKept(page: any, state: string) {
  // The monitor looks 50 ms after each swap; wait a little longer than that.
  await page.waitForTimeout(120)
  assert.notEqual(await active(page), 'BODY', `focus fell to <body>: ${state}`)
  assert.deepEqual(await lostFocus(page), [], `focus fell to <body> during a swap: ${state}`)
}

describe(`dynamic conformance: ${target.name}`, () => {
  before(async () => {
    ;({ url: base, stop } = await target.start())
    const mod = await import(pathToFileURL(require.resolve('playwright')).href)
    const { chromium } = mod.default ?? mod
    const executablePath = resolveChromium(chromium.executablePath())
    console.log(chromiumNote(executablePath))
    browser = await chromium.launch(executablePath ? { executablePath } : {})
  })
  after(async () => {
    await browser?.close()
    stop()
  })

  describe('HTTP (no browser)', () => {
    /** Session cookie + CSRF token from a GET of the form page. */
    async function session() {
      const res = await fetch(base + paths.form)
      const html = await res.text()
      const token = /name="csrf" value="([^"]+)"/.exec(html)?.[1]
      assert.ok(token, 'the form carries a CSRF token')
      const cookie = (res.headers.getSetCookie()[0] ?? '').split(';')[0]!
      return { cookie, token }
    }
    const post = (s: { cookie: string; token?: string }, body: string, extra = {}) =>
      fetch(base + paths.form, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          cookie: s.cookie,
          ...(s.token ? { 'x-csrf-token': s.token } : {}),
          ...extra,
        },
        body,
      })

    it('a page and its htmx fragment: the fragment is a subtree, Vary says so', async () => {
      const page = await fetch(base + paths.form)
      const frag = await fetch(base + paths.form, { headers: { 'hx-request': 'true' } })
      assert.match(await page.clone().text(), /<html/)
      const html = await frag.text()
      assert.doesNotMatch(html, /<html|<main/)
      assert.match(html, /<cv-form/)
      assert.match(frag.headers.get('vary') ?? '', /HX-Request/i)
      assert.match(page.headers.get('content-security-policy') ?? '', /script-src 'nonce-/)
    })

    it('422 re-renders with the values and the errors; a valid POST is 200', async () => {
      const s = await session()
      const bad = await post(s, 'name=taken&email=a%40b.co', { 'hx-request': 'true' })
      assert.equal(bad.status, 422)
      const html = await bad.text()
      assert.match(html, /value="taken"/)
      assert.match(html, /aria-invalid="true"/)
      const ok = await post(s, 'name=ada&email=', { 'hx-request': 'true' })
      assert.equal(ok.status, 200)
      assert.match(ok.headers.get('hx-trigger') ?? '', /cv-toast|^$/)
    })

    it('CSRF: missing token, wrong token and a cross-origin POST are 403', async () => {
      const s = await session()
      assert.equal((await post({ cookie: s.cookie }, 'name=ada')).status, 403, 'missing')
      assert.equal((await post({ ...s, token: 'nope' }, 'name=ada')).status, 403, 'wrong')
      const cross = await post(s, 'name=ada', { 'sec-fetch-site': 'cross-site' })
      assert.equal(cross.status, 403, 'cross-origin')
    })

    it('server island: a tampered token is 400, a signed one is a fragment', async () => {
      const html = await (await fetch(base + paths.island)).text()
      const url = /hx-get="([^"]+)"/.exec(html)?.[1]
      assert.ok(url, 'placeholder')
      const ok = await fetch(base + url, { headers: { 'hx-request': 'true' } })
      assert.equal(ok.status, 200)
      assert.match(await ok.text(), /7 visits/)
      const bad = await fetch(base + url.replace(/.$/, (c) => (c === 'A' ? 'B' : 'A')))
      assert.equal(bad.status, 400)
    })

    it('SSE: text/event-stream, named events, HTML on data lines', async () => {
      const res = await fetch(base + paths.sseStream, { headers: { accept: 'text/event-stream' } })
      assert.match(res.headers.get('content-type') ?? '', /^text\/event-stream/)
      const reader = res.body!.getReader()
      let text = ''
      while (!/event: tick\ndata: <p[^\n]*\n\n/.test(text)) {
        const { value, done } = await reader.read()
        assert.ok(!done, `stream ended early: ${text}`)
        text += new TextDecoder().decode(value)
      }
      await reader.cancel()
    })
  })

  describe('flows in Chromium', () => {
    it('form: client errors, server 422, then success; every state axe-clean, focus kept', async () => {
      const { page, errors, close } = await open(paths.form)
      await axe(page, 'form: initial')

      // Client side: an empty required field never leaves the browser.
      await page.focus('button[type=submit]')
      await page.keyboard.press('Enter')
      await page.waitForSelector('#f-name[aria-invalid=true]')
      assert.equal(await active(page), 'f-name', 'first invalid control takes focus')
      await axe(page, 'form: client validation errors')

      // Server side: client-valid, server-invalid. The 422 body is swapped in.
      await page.fill('#f-name', 'taken')
      await page.fill('#f-email', 'ada@example.com')
      await page.keyboard.press('Enter')
      await page.waitForSelector('#f-name-error:has-text("taken is taken")')
      assert.equal(await page.inputValue('#f-name'), 'taken', 'typed values survive the 422')
      assert.equal(await page.inputValue('#f-email'), 'ada@example.com')
      assert.equal(await page.locator('[role=alert]:has-text("Fix the errors below")').count(), 1)
      // htmx first restores focus to the control it left (email), then cv-form's afterSettle
      // moves it to the first invalid one.
      await page.waitForFunction(() => document.activeElement?.id === 'f-name')
      await axe(page, 'form: server 422')
      await focusKept(page, 'form 422')

      // Fix it: 200, the form resets and the toast announces.
      await page.fill('#f-name', 'ada')
      await page.keyboard.press('Enter')
      await page.waitForSelector('#cv-toaster [role=status]:has-text("Profile saved")')
      assert.equal(await page.inputValue('#f-name'), '', 'fresh form after success')
      await axe(page, 'form: saved + toast')
      await focusKept(page, 'form success')
      // The 422 is a deliberate answer; Chromium logs every 4xx as a console error.
      assert.deepEqual(
        errors.filter((e) => !/status of 422/.test(e)),
        [],
      )
      await close()
    })

    it('dialog: native modal, trap, server close, focus returns to the opener', async () => {
      const { page, errors, close } = await open(paths.dialog)
      const modal = () => page.$eval('#edit dialog', (d: HTMLDialogElement) => d.matches(':modal'))
      await page.focus('#edit-open')
      await page.keyboard.press('Enter')
      assert.equal(await modal(), true)
      assert.ok(await page.evaluate(() => document.activeElement?.closest('dialog')))
      await axe(page, 'dialog: open')

      // Escape: closes, focus returns.
      await page.keyboard.press('Escape')
      assert.equal(await modal(), false)
      assert.equal(await active(page), 'edit-open', 'Escape returns focus to the opener')

      // Save: the server answers with `HX-Trigger: cv-dialog-close` and a toast.
      await page.keyboard.press('Enter')
      assert.equal(await modal(), true)
      await page.click('#edit-save')
      await page.waitForSelector('#dialog-status:has-text("Saved")')
      await page.waitForSelector('#cv-toaster [role=status]:has-text("Name updated")')
      assert.equal(await modal(), false, 'the server closed the dialog')
      await page.waitForFunction(() => document.activeElement?.id === 'edit-open')
      await axe(page, 'dialog: closed after save')
      await focusKept(page, 'dialog save')
      assert.deepEqual(errors, [])
      await close()
    })

    it('toast: announced in a live region, dismissible, axe-clean with the menu open', async () => {
      const { page, errors, close } = await open(paths.toast)
      await page.click('#toast-go')
      await page.waitForSelector('#toast-status:has-text("Saved")')
      const toast = page.locator('#cv-toaster .cv-toast-toast')
      await toast.waitFor()
      assert.equal(
        await toast.getAttribute('role'),
        'status',
        'a status role is a polite live region',
      )
      assert.match(await toast.innerText(), /Profile saved/)
      await axe(page, 'toast: shown')
      await focusKept(page, 'toast')

      await page.click('#actions [aria-haspopup]')
      await axe(page, 'toast: menu open')
      await page.keyboard.press('Escape')
      await axe(page, 'toast: menu closed')
      assert.notEqual(await active(page), 'BODY', 'Escape returns focus to the menu button')
      // Light dismiss flips data-state a task after the popover hides: the late fade the
      // single-pass settle used to miss (scripts/checks/lib/settle.ts).
      await page.click('#actions [aria-haspopup]')
      await page.mouse.click(5, 5) // a click on blank page legitimately leaves focus on <body>
      await axe(page, 'toast: menu light-dismissed')

      await page.focus('#cv-toaster .cv-toast-close')
      await page.keyboard.press('Enter')
      await page.waitForSelector('#cv-toaster .cv-toast-toast', { state: 'detached' })
      await focusKept(page, 'toast dismissed')
      assert.deepEqual(errors, [])
      await close()
    })

    it('server island: the placeholder loads its fragment after the page', async () => {
      const { page, errors, close } = await open(paths.island)
      await axe(page, 'island: placeholder')
      await page.waitForSelector('#stats:has-text("7 visits")')
      assert.equal(await page.locator('#island-host [hx-get]').count(), 0, 'placeholder replaced')
      await axe(page, 'island: loaded')
      assert.deepEqual(errors, [])
      await close()
    })

    it('SSE: events stream into the page and every state stays axe-clean', async () => {
      const { page, errors, close } = await open(paths.sse)
      await page.waitForSelector('#feed .tick:has-text("tick 1")')
      await axe(page, 'sse: first event')
      await page.waitForSelector('#feed .tick:has-text("tick 3")')
      await axe(page, 'sse: after more events')
      assert.deepEqual(errors, [])
      await close()
    })

    it('tabs: a lazy panel swaps in, focus stays on the tab, state survives', async () => {
      const { page, errors, close } = await open(paths.tabs)
      const shown = () =>
        page.$$eval('#plan [role=tabpanel]', (els: HTMLElement[]) =>
          els.filter((e) => !e.hidden).map((e) => e.id),
        )
      await axe(page, 'tabs: initial')
      await page.focus('#plan-trigger-overview')
      await page.keyboard.press('ArrowRight')
      await page.waitForSelector('#plan-content-details:has-text("details loaded from the server")')
      assert.deepEqual(await shown(), ['plan-content-details'])
      assert.equal(await active(page), 'plan-trigger-details', 'focus stays on the tab')
      await axe(page, 'tabs: details swapped')
      await page.keyboard.press('ArrowRight')
      await page.waitForSelector('#plan-content-history:has-text("history loaded from the server")')
      assert.equal(await page.getAttribute('#plan-trigger-history', 'aria-selected'), 'true')
      await axe(page, 'tabs: history swapped')
      await focusKept(page, 'tabs')
      assert.deepEqual(errors, [])
      await close()
    })
  })

  describe('JS weight per page (checkpoint δ)', () => {
    const pages = Object.entries(paths).filter(([k]) => k !== 'sseStream')

    for (const [name, path] of pages) {
      it(`${name} (${path}): cascivo JS ≤ ${target.budgets.pageJs / 1024} KB gz, htmx reported`, async () => {
        const context = await browser.newContext({ baseURL: base })
        const page = await context.newPage()
        const loaded = new Map<string, number>()
        page.on('response', async (res: any) => {
          const type = res.headers()['content-type'] ?? ''
          if (!/javascript/.test(type)) return
          const body: Buffer = await res.body()
          loaded.set(new URL(res.url()).pathname, gzipSync(body).length)
        })
        await page.goto(path)
        await page.waitForLoadState('load')
        // Module graphs and the island's own fetch finish after `load`.
        await page.waitForTimeout(400)
        await context.close()

        let htmx = 0
        let island = 0
        let own = 0
        for (const [file, gz] of loaded) {
          if (target.htmx.test(file)) htmx += gz
          else if (target.island.test(file)) island += gz
          else own += gz
        }
        const kb = (n: number) => `${(n / 1024).toFixed(2)} KB`
        console.log(
          `dynamic js ${name.padEnd(7)} ${path.padEnd(11)} cascivo=${kb(own)} island=${kb(island)} htmx=${kb(htmx)} (gz)`,
        )
        assert.ok(own > 0, 'the page loaded no cascivo JS: the measurement is broken')
        assert.ok(own <= target.budgets.pageJs, `cascivo JS ${own} B gz > ${target.budgets.pageJs}`)
        assert.ok(
          island <= target.budgets.islandJs,
          `island ${island} B gz > ${target.budgets.islandJs}`,
        )
      })
    }
  })
})
