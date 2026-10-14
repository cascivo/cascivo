/**
 * Browser check for /cascivo-sans (needs a built apps/site + Chromium). Not part of `ready`:
 * re-run it by hand after touching the page, the tester, or the font files.
 *
 *   node --experimental-strip-types scripts/quality/cascivo-sans-page.ts [screenshot-dir]
 *   (set CHROMIUM_PATH to use a Chromium other than the one Playwright pins)
 *
 * Asserts what jsdom cannot: the font really loads (and only on this route), the tester moves
 * real `font-variation-settings` by keyboard, pasted rich text arrives as plain text, and the
 * page never scrolls sideways on a phone.
 */
import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, type Page } from '@playwright/test'

const root = fileURLToPath(new URL('../..', import.meta.url))
const distDir = join(root, 'apps/site/dist')
const shots = process.argv[2]

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
}

/** Static server with the deploy's directory-index rule (`/x` → `/x/index.html`). */
function serveDist(): Promise<Server> {
  const server = createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname)
    let file = join(distDir, normalize(urlPath).replace(/^(\.\.[/\\])+/, ''))
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
    if (!file.startsWith(distDir) || !existsSync(file)) file = join(distDir, 'index.html')
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
    createReadStream(file).pipe(res)
  })
  return new Promise((resolve, reject) => {
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}

const sampleStyle = (page: Page) =>
  page.locator('.cs-tester-sample').evaluate((el) => {
    const cs = getComputedStyle(el)
    return { fvs: cs.fontVariationSettings, size: cs.fontSize, style: cs.fontStyle }
  })

assert.ok(existsSync(join(distDir, 'cascivo-sans/index.html')), 'build apps/site first')
const server = await serveDist()
const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
// CHROMIUM_PATH: a pre-installed Chromium whose build differs from the pinned Playwright's.
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
)

try {
  const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] })
  const page = await context.newPage()

  // Home route must not download the font.
  const fontHits: string[] = []
  page.on('request', (r) => {
    if (r.url().includes('/fonts/cascivo-sans/')) fontHits.push(r.url())
  })
  await page.goto(`${origin}/`, { waitUntil: 'networkidle' })
  assert.deepEqual(fontHits, [], 'home route requested a Cascivo Sans file')
  console.log('ok — home route downloads no Cascivo Sans file')

  await page.goto(`${origin}/cascivo-sans`, { waitUntil: 'networkidle' })
  await page.locator('.cs-tester-sample').waitFor()
  const loaded = await page.evaluate(async () => {
    await document.fonts.ready
    return [...document.fonts].some(
      (f) => f.family.includes('Cascivo Sans') && f.status === 'loaded',
    )
  })
  assert.ok(loaded, 'Cascivo Sans did not load on /cascivo-sans')
  console.log('ok — font loaded on /cascivo-sans')

  const initial = await sampleStyle(page)
  assert.match(initial.fvs, /"wght" 400/)
  assert.match(initial.fvs, /"opsz" 14/)
  assert.equal(initial.size, '40px')
  console.log('ok — tester starts at the CSS defaults (no jump)')

  await page.getByRole('slider', { name: 'Weight', exact: true }).focus()
  await page.keyboard.press('End')
  assert.match((await sampleStyle(page)).fvs, /"wght" 900/)
  await page.getByRole('slider', { name: 'Optical size', exact: true }).focus()
  await page.keyboard.press('Home')
  assert.match((await sampleStyle(page)).fvs, /"opsz" 8/)
  await page.getByRole('slider', { name: 'Size', exact: true }).focus()
  await page.keyboard.press('End')
  assert.equal((await sampleStyle(page)).size, '96px')
  await page.getByRole('switch', { name: 'Italic' }).focus()
  await page.keyboard.press('Space')
  assert.equal((await sampleStyle(page)).style, 'italic')
  console.log('ok — weight, optical size, size and italic all work by keyboard')

  const sample = page.locator('.cs-tester-sample')
  await page.evaluate(async () => {
    const html = new Blob(['<b style="color:red">bold</b>'], { type: 'text/html' })
    const text = new Blob(['bold'], { type: 'text/plain' })
    await navigator.clipboard.write([new ClipboardItem({ 'text/html': html, 'text/plain': text })])
  })
  await sample.click()
  await page.keyboard.press('ControlOrMeta+A')
  await page.keyboard.press('ControlOrMeta+V')
  assert.equal(await sample.evaluate((el) => el.children.length), 0, 'paste kept markup')
  assert.equal((await sample.textContent())?.trim(), 'bold')
  console.log('ok — pasted rich text arrives as plain text')

  await page.keyboard.press('ControlOrMeta+A')
  await page.keyboard.type('Supercalifragilisticexpialidociousnesses')
  for (const width of [320, 360, 390, 414]) {
    await page.setViewportSize({ width, height: 800 })
    const over = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    assert.ok(over <= 0, `horizontal overflow of ${over}px at ${width}px`)
  }
  console.log('ok — no horizontal overflow at 320/360/390/414 with a long word at 96px')

  if (shots) {
    for (const theme of ['light', 'dark']) {
      for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(`${origin}/cascivo-sans`, { waitUntil: 'networkidle' })
        await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme)
        await page.evaluate(() => document.fonts.ready)
        await page.screenshot({
          path: join(shots, `cascivo-sans-${theme}-${width}.png`),
          fullPage: true,
        })
      }
    }
    console.log(`screenshots → ${shots}`)
  }
} finally {
  await browser.close()
  server.close()
}
