import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { chromium, type Browser, type Page } from '@playwright/test'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromiumNote, resolveChromium } from '../../../../scripts/checks/lib/chromium.ts'
import { findOnAnyPage, goTo } from './_lib.ts'

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

// Mutates text for the first 300 ms and then goes quiet, standing in for a widget that was
// already updating when the click happened.
const NOISY = shell(
  '<a href="#">Dead</a><p id="tick">0</p>',
  `let n = 0
   const id = setInterval(() => { document.getElementById('tick').textContent = String(++n) }, 50)
   setTimeout(() => clearInterval(id), 300)`,
)

const pages: Record<string, string> = {
  '/noisy': NOISY,
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

  it('goTo ignores page mutations that happened before the click', async () => {
    page = await browser.newPage()
    await page.goto(`${baseUrl}noisy`)
    await page.waitForTimeout(600)
    await expect(goTo(page, baseUrl, /^dead$/i, { timeoutMs: 500 })).rejects.toThrow(
      /did not navigate or change the page/,
    )
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
})
