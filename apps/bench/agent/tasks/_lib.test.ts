import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { chromium, type Browser, type Page } from '@playwright/test'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromiumNote, resolveChromium } from '../../../../scripts/checks/lib/chromium.ts'
import { anyVisible, eventually, fillUntil, findOnAnyPage, firstVisible, goTo } from './_lib.ts'

// Needs a real Chromium, so it stays out of the default run: EVAL_SLOW=1 enables it.
const slow = process.env['EVAL_SLOW'] ? describe : describe.skip

const shell = (body: string, script = '') =>
  `<!doctype html><title>t</title><body>${body}<script>${script}</script></body>`

const HOME = shell(
  `<nav>
     <a href="/settings" id="hist">Settings</a>
     <a href="#/profile">Profile</a>
     <a href="#">Dead</a>
     <a href="#features">Features</a><a href="#pricing">Pricing</a><a href="#top">Top</a>
     <a href="/">Home</a>
     <a href="/about">About</a>
     <button id="swap">Swap view</button>
   </nav>
   <main id="out"><h1>Home</h1></main>`,
  `
  const out = document.getElementById('out')
  document.getElementById('hist').onclick = (e) => {
    e.preventDefault()
    history.pushState({}, '', '/settings')
    out.innerHTML = '<h1>Settings page</h1>'
  }
  document.getElementById('swap').onclick = () => { out.textContent = 'Swapped view' }
  addEventListener('hashchange', () => {
    if (location.hash === '#/profile') out.innerHTML = '<h1>Profile page</h1>'
  })`,
)

// The mutation lands on mousedown: after goTo has armed its observer, before the click event
// fires. An observer that counted from arm time would take it for the link's effect.
const MOUSEDOWN_NOISE = shell(
  `<a href="#" onmousedown="document.getElementById('t').textContent = 'touched'">Dead</a>
   <p id="t">untouched</p>`,
)

const pages: Record<string, string> = {
  '/mousedown-noise': MOUSEDOWN_NOISE,
  '/': HOME,
  '/about': shell('<h1>About</h1><button>Contact us</button>'),
}

slow('tasks/_lib', () => {
  let server: Server
  let browser: Browser
  let page: Page
  let baseUrl = ''
  const hits: string[] = []

  beforeAll(async () => {
    server = createServer((req, res) => {
      const path = (req.url ?? '/').split('?')[0] ?? '/'
      if (path === '/favicon.ico') {
        res.writeHead(404).end()
        return
      }
      hits.push(path)
      // Any unknown path serves the SPA shell, as a history-routed app behind a static host does.
      res.writeHead(200, { 'content-type': 'text/html' }).end(pages[path] ?? HOME)
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`
    const executablePath = resolveChromium(chromium.executablePath())
    console.log(chromiumNote(executablePath))
    browser = await chromium.launch(executablePath === undefined ? {} : { executablePath })
  })
  afterAll(async () => {
    await browser?.close()
    await new Promise((resolve) => server?.close(resolve))
  })

  const fresh = async () => {
    page = await browser.newPage()
    await page.goto(baseUrl)
    hits.length = 0
  }

  it('goTo follows a history-API link', async () => {
    await fresh()
    await goTo(page, baseUrl, /^settings$/i)
    await expect(page.getByRole('heading', { name: 'Settings page' }).isVisible()).resolves.toBe(
      true,
    )
  })

  it('goTo follows a hash-route link', async () => {
    await fresh()
    await goTo(page, baseUrl, /^profile$/i)
    await expect(page.getByRole('heading', { name: 'Profile page' }).isVisible()).resolves.toBe(
      true,
    )
  })

  it('goTo follows a plain link that loads a new document', async () => {
    await fresh()
    await goTo(page, baseUrl, /^about$/i)
    expect(page.url()).toBe(`${baseUrl}about`)
    await expect(page.getByRole('heading', { name: 'About' }).isVisible()).resolves.toBe(true)
  })

  it('goTo accepts a button that only re-renders the page', async () => {
    await fresh()
    await goTo(page, baseUrl, /^swap view$/i)
    await expect(page.getByText('Swapped view').isVisible()).resolves.toBe(true)
  })

  it('goTo ignores a mutation that lands before the click event', async () => {
    page = await browser.newPage()
    await page.goto(`${baseUrl}mousedown-noise`)
    await expect(goTo(page, baseUrl, /^dead$/i, { timeoutMs: 500 })).rejects.toThrow(
      /did not navigate or change the page/,
    )
    // Guards the premise: the mutation did happen, it just must not count.
    await expect(page.getByText('touched').isVisible()).resolves.toBe(true)
  })

  it('goTo throws on a dead link that changes nothing', async () => {
    await fresh()
    await expect(goTo(page, baseUrl, /^dead$/i, { timeoutMs: 500 })).rejects.toThrow(
      /did not navigate or change the page/,
    )
  })

  it('goTo skips the check for an in-page toggle when told to', async () => {
    await fresh()
    await expect(
      goTo(page, baseUrl, /^dead$/i, { expectNavigation: false, timeoutMs: 500 }),
    ).resolves.toBeUndefined()
  })

  it('findOnAnyPage visits distinct pages only', async () => {
    await fresh()
    const hit = await findOnAnyPage(page, baseUrl, 'button', /contact us/i)
    await expect(hit.isVisible()).resolves.toBe(true)
    // Home, then each distinct link once. The second "/" is the #/profile hash route, fetched from
    // /settings; the three anchors, the bare "#" and the "/" link add no visit.
    expect(hits).toEqual(['/', '/settings', '/', '/about'])
  })

  it('findOnAnyPage throws when nothing matches', async () => {
    await fresh()
    await expect(findOnAnyPage(page, baseUrl, 'button', /nope/i)).rejects.toThrow(/No visible/)
  })

  it('anyVisible finds a visible match behind a hidden one', async () => {
    page = await browser.newPage()
    // Text locators, unlike role locators, also match hidden elements: the case `.first()` misses.
    await page.setContent('<p hidden>Go</p><p>Go</p><p hidden>Away</p>')
    await expect(page.getByText('Go').first().isVisible()).resolves.toBe(false)
    await expect(anyVisible(page.getByText('Go'))).resolves.toBe(true)
    await expect(anyVisible(page.getByText('Away'))).resolves.toBe(false)
  })

  it('firstVisible skips a hidden match and returns null when none is visible', async () => {
    page = await browser.newPage()
    await page.setContent('<p hidden>Go one</p><p>Go two</p><p hidden>Away</p>')
    const hit = await firstVisible(page.getByText(/^Go/))
    await expect(hit?.textContent()).resolves.toBe('Go two')
    await expect(firstVisible(page.getByText('Away'))).resolves.toBeNull()
  })

  // The never-settling case waits out both of fillUntil's bounds, about 7 s.
  it(
    'fillUntil presses Enter for a box that applies its text only then',
    { timeout: 20_000 },
    async () => {
      page = await browser.newPage()
      await page.setContent(
        shell(
          '<input aria-label="Filter"><p id="out"></p>',
          `const box = document.querySelector('input')
         box.onkeydown = (e) => { if (e.key === 'Enter') document.getElementById('out').textContent = box.value }`,
        ),
      )
      const out = page.locator('#out')
      const applied = async () => (await out.textContent()) === 'abc'
      await expect(fillUntil(page.getByLabel('Filter'), 'abc', applied)).resolves.toBe(true)
      await expect(fillUntil(page.getByLabel('Filter'), 'xyz', async () => false)).resolves.toBe(
        false,
      )
    },
  )
})

describe('eventually', () => {
  it('resolves true once the check comes true', async () => {
    let calls = 0
    await expect(eventually(async () => ++calls >= 3, 5000)).resolves.toBe(true)
    expect(calls).toBe(3)
  })

  it('resolves false after the timeout, having checked at least once', async () => {
    let calls = 0
    const started = Date.now()
    await expect(
      eventually(async () => {
        calls += 1
        return false
      }, 300),
    ).resolves.toBe(false)
    expect(calls).toBeGreaterThan(0)
    expect(Date.now() - started).toBeGreaterThanOrEqual(300)
  })
})
