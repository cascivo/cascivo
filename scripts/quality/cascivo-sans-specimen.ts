/**
 * Browser check for /cascivo-sans/specimen (needs a built apps/site + Chromium). Not part of
 * `ready`: re-run it by hand after touching the specimen, its data, or the font files.
 *
 *   node --experimental-strip-types scripts/quality/cascivo-sans-specimen.ts [screenshot-dir]
 *   (set CHROMIUM_PATH to use a Chromium other than the one Playwright pins)
 *
 * Asserts what jsdom cannot: the live meter matches a DOM measurement and follows the split
 * width rule (100-700 within +-2% of 400; 800-900 within +5% / -2%), the tab rows do not
 * reflow past that on hover or toggle, the dashes order hyphen < en < em with minus = plus,
 * the page never scrolls sideways on a phone, and the font loads only on the two font routes.
 * With a directory it also writes section-01..07.png (light) and -dark.png, and a 360px
 * full-page shot.
 */
import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { createReadStream, existsSync, mkdirSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, type Page } from '@playwright/test'
import {
  SAMPLE,
  SPECIMEN_WEIGHTS,
  TAB_LABELS,
  limitFor,
} from '../../apps/site/src/marketing/pages/cascivo-sans/specimen.ts'

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

const pct = (n: number) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(2)}%`
const fmt = (n: number) => n.toFixed(3)

assert.ok(existsSync(join(distDir, 'cascivo-sans/specimen/index.html')), 'build apps/site first')
const server = await serveDist()
const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
)

/** Request URLs for Cascivo Sans files while visiting `path`. */
async function fontRequests(page: Page, path: string): Promise<string[]> {
  const hits: string[] = []
  const on = (r: { url(): string }) => {
    if (r.url().includes('/fonts/cascivo-sans/')) hits.push(r.url())
  }
  page.on('request', on)
  await page.goto(`${origin}${path}`, { waitUntil: 'networkidle' })
  page.off('request', on)
  return hits
}

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()

  // The font loads only on its two routes.
  for (const path of ['/', '/modern-css', '/performance']) {
    assert.deepEqual(await fontRequests(page, path), [], `${path} requested a Cascivo Sans file`)
  }
  assert.ok((await fontRequests(page, '/cascivo-sans')).length > 0, '/cascivo-sans loads no font')
  const specimenHits = await fontRequests(page, '/cascivo-sans/specimen')
  assert.ok(specimenHits.length > 0, '/cascivo-sans/specimen loads no font')
  console.log('ok — the font loads on /cascivo-sans and /cascivo-sans/specimen, nowhere else')

  await page.waitForFunction(
    () => !document.querySelector('.sp-weight [data-delta]')?.textContent?.includes('…'),
  )
  const faceLoaded = await page.evaluate(async () => {
    await document.fonts.ready
    return [...document.fonts].some(
      (f) => f.family.includes('Cascivo Sans') && f.status === 'loaded',
    )
  })
  assert.ok(faceLoaded, 'Cascivo Sans did not load on the specimen')

  // 01: the meter's numbers, against an independent measurement: a DOM probe at 40px with automatic
  // optical sizing off, which is the axis default (opsz 14) the width limits are defined at.
  const meter = await page.evaluate(
    async ({ weights, sample }) => {
      const out: { weight: number; label: string; over: boolean; dom: number }[] = []
      const probe = document.createElement('span')
      probe.style.cssText =
        'position:absolute;visibility:hidden;white-space:nowrap;font:400 40px "Cascivo Sans";font-optical-sizing:none;'
      document.body.append(probe)
      probe.textContent = sample
      const domWidth: number[] = []
      for (const w of weights) {
        probe.style.fontWeight = String(w)
        await document.fonts.load(`${w} 40px "Cascivo Sans"`, sample)
        domWidth.push(probe.getBoundingClientRect().width)
      }
      probe.remove()
      const rows = [...document.querySelectorAll<HTMLElement>('.sp-weight')]
      rows.forEach((row, i) => {
        out.push({
          weight: Number(row.dataset.weight),
          label:
            row
              .querySelector('[data-delta]')
              ?.textContent?.replace(' over the limit', '')
              .replace('width vs 400: ', '') ?? '',
          over: row.hasAttribute('data-over'),
          dom: (domWidth[i] ?? 0) / (domWidth[3] ?? 1) - 1,
        })
      })
      return out
    },
    { weights: SPECIMEN_WEIGHTS.map((w) => w.value), sample: SAMPLE },
  )
  assert.equal(meter.length, 9, 'nine weight rows')
  console.log('01 weight | shown   | DOM 40px | limit')
  for (const row of meter) {
    const shown = Number(row.label.replace('−', '-').replace('%', ''))
    const limit = limitFor(row.weight)
    const domPct = row.dom * 100
    console.log(
      `   ${row.weight}    | ${row.label.padStart(6)} | ${pct(domPct).padStart(7)}  | -${limit.under}/+${limit.over}`,
    )
    assert.ok(
      Math.abs(shown - domPct) <= 0.1,
      `${row.weight}: meter ${row.label} disagrees with the DOM (${pct(domPct)})`,
    )
    assert.ok(shown <= limit.over && shown >= -limit.under, `${row.weight} is past its limit`)
    assert.equal(row.over, false, `${row.weight} is flagged over its limit`)
  }
  assert.ok(
    (await page.locator('.sp-weight[data-weight="900"] .sp-delta').textContent())?.includes('%'),
  )
  console.log('ok — meter matches the DOM; 100-700 within +-2%, 800-900 within +5% / -2%')

  // 02: the tab rows keep their width to within +-2% (the same rule as section 01), and their
  // height (nothing wraps) and the next element's position do not move at all.
  const TAB_TOLERANCE = 0.02
  const geometry = (id: string) =>
    page.locator(id).evaluate((el) => {
      const box = el.getBoundingClientRect()
      const next = el.closest('.sp-scroll')!.nextElementSibling
      return {
        w: box.width,
        h: box.height,
        nextTop: (next?.getBoundingClientRect().top ?? -1) - box.top,
      }
    })
  const hoverBase = await geometry('#sp-tabs-hover')
  const hoverRuns: { w: number; h: number; nextTop: number }[] = []
  for (const label of TAB_LABELS) {
    const tab = page.locator('#sp-tabs-hover').getByText(label, { exact: true })
    await tab.hover()
    assert.equal(
      await tab.evaluate((el) => getComputedStyle(el).fontWeight),
      '700',
      `${label} is not 700 on hover`,
    )
    hoverRuns.push(await geometry('#sp-tabs-hover'))
  }
  for (const g of hoverRuns) {
    assert.ok(
      Math.abs(g.w / hoverBase.w - 1) <= TAB_TOLERANCE,
      `hover reflowed the row: ${hoverBase.w} → ${g.w}`,
    )
    assert.equal(g.h, hoverBase.h, 'hover changed the row height')
    assert.equal(g.nextTop, hoverBase.nextTop, 'hover moved the next element')
  }
  await page.mouse.move(0, 0)
  const toggleBase = await geometry('#sp-tabs-toggle')
  await page.getByRole('button', { name: 'Set row to 700' }).click()
  const toggled = await geometry('#sp-tabs-toggle')
  assert.equal(
    await page.locator('#sp-tabs-toggle').evaluate((el) => getComputedStyle(el).fontWeight),
    '700',
  )
  assert.ok(
    Math.abs(toggled.w / toggleBase.w - 1) <= TAB_TOLERANCE,
    `toggle reflowed: ${toggleBase.w} → ${toggled.w}`,
  )
  assert.equal(toggled.h, toggleBase.h, 'toggle changed the row height')
  assert.equal(toggled.nextTop, toggleBase.nextTop, 'toggle moved the next element')
  await page.getByRole('button', { name: 'Set row to 400' }).click()
  const back = await geometry('#sp-tabs-toggle')
  assert.ok(Math.abs(back.w - toggleBase.w) < 0.01, 'toggling back did not restore the width')
  console.log(
    `ok — tab row ${fmt(hoverBase.w)}px; hover max ${pct((Math.max(...hoverRuns.map((g) => g.w)) / hoverBase.w - 1) * 100)}; ` +
      `toggle 400→700 ${fmt(toggleBase.w)}→${fmt(toggled.w)}px (${pct((toggled.w / toggleBase.w - 1) * 100)}); ` +
      'height and next element unmoved; width limit +-2%',
  )

  // The meter must stay readable in every theme the page can show: track, fill, tick and the
  // over-limit fill (WCAG 1.4.11, 3:1 against the page and against the track).
  const THEMES = ['poster', 'poster-dark', 'light', 'dark', 'warm']
  for (const theme of THEMES) {
    await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme)
    const c = await page.evaluate(() => {
      const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
      if (ctx === null) throw new Error('no canvas')
      type Rgb = [number, number, number]
      const paint = (under: Rgb, css: string): Rgb => {
        ctx.clearRect(0, 0, 1, 1)
        ctx.fillStyle = `rgb(${under.join(',')})`
        ctx.fillRect(0, 0, 1, 1)
        ctx.fillStyle = css
        ctx.fillRect(0, 0, 1, 1)
        const d = ctx.getImageData(0, 0, 1, 1).data
        return [d[0] ?? 0, d[1] ?? 0, d[2] ?? 0]
      }
      const lum = ([r, g, b]: Rgb) => {
        const f = (v: number) => {
          const x = v / 255
          return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
        }
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
      }
      const ratio = (a: Rgb, b: Rgb) => {
        const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number]
        return (hi + 0.05) / (lo + 0.05)
      }
      let page: Rgb = [255, 255, 255]
      for (
        let el: Element | null = document.querySelector('.sp-track');
        el;
        el = el.parentElement
      ) {
        const bg = getComputedStyle(el).backgroundColor
        if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' && !el.matches('.sp-track')) {
          page = paint([255, 255, 255], bg)
          break
        }
      }
      const row = document.querySelector<HTMLElement>('.sp-weight[data-weight="900"]')!
      const css = (sel: string) => getComputedStyle(row.querySelector(sel)!).backgroundColor
      const track = paint(page, css('.sp-track'))
      const fill = paint(track, css('.sp-fill'))
      const tick = paint(track, css('.sp-tick'))
      row.setAttribute('data-over', '')
      const warn = paint(track, css('.sp-fill'))
      row.removeAttribute('data-over')
      return {
        trackVsPage: ratio(track, page),
        fillVsTrack: ratio(fill, track),
        tickVsTrack: ratio(tick, track),
        warnVsTrack: ratio(warn, track),
        warnVsPage: ratio(warn, page),
      }
    })
    console.log(
      `   ${theme.padEnd(11)} track/page ${c.trackVsPage.toFixed(2)}  fill/track ${c.fillVsTrack.toFixed(2)}  tick/track ${c.tickVsTrack.toFixed(2)}  warn/track ${c.warnVsTrack.toFixed(2)}  warn/page ${c.warnVsPage.toFixed(2)}`,
    )
    assert.ok(c.fillVsTrack >= 3, `${theme}: the fill is not visible against the track`)
    assert.ok(c.tickVsTrack >= 3, `${theme}: the 400 tick is not visible against the track`)
    assert.ok(c.warnVsTrack >= 3, `${theme}: the over-limit fill is under 3:1 against the track`)
    assert.ok(c.warnVsPage >= 3, `${theme}: the over-limit fill is under 3:1 against the page`)
  }
  console.log('ok — meter fill, tick and over-limit fill keep >=3:1 in five themes')
  await page.evaluate(() => document.documentElement.removeAttribute('data-theme'))

  // 05: advances and ink of the dashes at every weight. 1000px so canvas ink boxes are not
  // rounded to whole pixels of a small size (1px at 64px is 4% of an en dash).
  const dashes = await page.evaluate(
    async (weights) => {
      const canvas = document.createElement('canvas')
      canvas.width = 1600
      canvas.height = 1400
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (ctx === null) throw new Error('no canvas')
      // measureText's ink box is padded to whole pixels; scanning the painted pixels is exact.
      const inkOf = (ch: string): number => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#000'
        ctx.textBaseline = 'alphabetic'
        ctx.fillText(ch, 200, 900)
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
        let lo = canvas.width
        let hi = -1
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            if ((data[(y * canvas.width + x) * 4 + 3] ?? 0) > 127) {
              if (x < lo) lo = x
              if (x > hi) hi = x
            }
          }
        }
        return hi - lo + 1
      }
      const chars = { hyphen: '-', en: '\u2013', em: '\u2014', minus: '\u2212', plus: '+' }
      const out: Record<number, Record<string, { adv: number; ink: number }>> = {}
      for (const w of weights) {
        await document.fonts.load(`${w} 1000px "Cascivo Sans"`, '-')
        ctx.font = `${w} 1000px "Cascivo Sans"`
        const row: Record<string, { adv: number; ink: number }> = {}
        for (const [name, ch] of Object.entries(chars)) {
          row[name] = { adv: ctx.measureText(ch).width, ink: inkOf(ch) }
        }
        out[w] = row
      }
      return out
    },
    SPECIMEN_WEIGHTS.map((w) => w.value),
  )
  console.log('05 weight | hyphen   en      em     minus   plus  | minus ink / en ink, / plus ink')
  for (const w of SPECIMEN_WEIGHTS) {
    const d = dashes[w.value]
    assert.ok(d, `no dashes for ${w.value}`)
    const { hyphen, en, em, minus, plus } = d as Record<string, { adv: number; ink: number }>
    assert.ok(hyphen && en && em && minus && plus)
    assert.ok(hyphen.adv < en.adv && en.adv < em.adv, `${w.value}: hyphen < en < em fails`)
    assert.ok(Math.abs(minus.adv - plus.adv) < 0.01, `${w.value}: minus advance ≠ plus advance`)
    const vsEn = minus.ink / en.ink
    const vsPlus = minus.ink / plus.ink
    console.log(
      `   ${w.value}    | ${[hyphen, en, em, minus, plus].map((m) => fmt(m.adv / 1000).padStart(6)).join(' ')} | ${vsEn.toFixed(3)} / ${vsPlus.toFixed(3)}`,
    )
    if (w.value <= 700) assert.ok(vsEn <= 0.92, `${w.value}: minus ink is not ≥8% shorter than en`)
    else {
      // The font's own gates: 0.90 of the plus bar at 800 (the straight line from Bold to Black), 0.98 at 900.
      const floor = w.value === 900 ? 0.98 : 0.9
      assert.ok(vsPlus >= floor, `${w.value}: minus ink is under ${floor} of the plus`)
    }
  }
  // The visible 64px row is the same advances.
  const shownWidths = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('[data-dash]')].map((el) => [
      el.dataset.dash,
      el.getBoundingClientRect().width,
    ]),
  )
  const byName = Object.fromEntries(shownWidths as [string, number][])
  assert.ok(
    byName.hyphen! < byName['en dash']! && byName['en dash']! < byName['em dash']!,
    'rendered dashes are not hyphen < en < em',
  )
  console.log('ok — hyphen < en < em and minus = plus at all nine weights; minus ink split holds')

  // 04/05: the alternates really switch glyphs (the feature changes the advance or the ink).
  const features = await page.evaluate(async () => {
    await document.fonts.load('400 36px "Cascivo Sans"')
    const ctx = document.createElement('canvas').getContext('2d')
    if (ctx === null) throw new Error('no canvas')
    const sizes = [...document.querySelectorAll<HTMLElement>('.sp-variants .sp-pair-glyphs')]
    return sizes.map((el) => ({ features: el.style.fontFeatureSettings, w: el.scrollWidth }))
  })
  assert.equal(features.length, 4, 'four alternate rows')

  // No horizontal page overflow, and the 22px sample lines scroll inside their own wrapper.
  for (const width of [320, 360, 390, 414]) {
    await page.setViewportSize({ width, height: 800 })
    const m = await page.evaluate(() => ({
      over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      inner: document.querySelector('.sp-weight[data-weight="400"] .sp-sample-wrap')!.scrollWidth,
      box: document.querySelector('.sp-weight[data-weight="400"] .sp-sample-wrap')!.clientWidth,
    }))
    assert.ok(m.over <= 0, `horizontal page overflow of ${m.over}px at ${width}px`)
    assert.ok(m.inner > m.box, `sample line should scroll inside its wrapper at ${width}px`)
  }
  console.log('ok — no horizontal page overflow at 320/360/390/414; sample lines scroll in place')

  // Coarse pointer: the interactive targets reach 44px.
  const touch = await browser.newContext({
    viewport: { width: 360, height: 800 },
    hasTouch: true,
    isMobile: true,
  })
  const phone = await touch.newPage()
  await phone.goto(`${origin}/cascivo-sans/specimen`, { waitUntil: 'networkidle' })
  await phone.waitForFunction(
    () => !document.querySelector('.sp-weight [data-delta]')?.textContent?.includes('…'),
  )
  const targets = await phone.evaluate(() => {
    const h = (el: Element) => el.getBoundingClientRect().height
    return {
      tabs: [...document.querySelectorAll('.sp-tab')].map(h),
      button: h(document.querySelector('.sp-toggle button')!),
      over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  })
  assert.ok(
    targets.tabs.every((t) => t >= 44),
    `tab targets under 44px: ${targets.tabs}`,
  )
  assert.ok(targets.button >= 44, `toggle button ${targets.button}px under 44px`)
  assert.ok(targets.over <= 0, 'touch viewport overflows sideways')
  console.log('ok — tabs and toggle are ≥44px on a coarse pointer')

  if (shots) {
    mkdirSync(shots, { recursive: true })
    await page.setViewportSize({ width: 1280, height: 900 })
    // The sticky site header would land on top of every element screenshot.
    await page.addStyleTag({
      content:
        '.landing-shell-header { position: static !important; } .scroll-progress { display: none !important; }',
    })
    for (const theme of ['light', 'dark', 'poster', 'poster-dark']) {
      await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme)
      await page.evaluate(() => document.fonts.ready)
      for (let n = 1; n <= 7; n++) {
        const id = `0${n}`
        await page.locator(`#sp-${id}`).screenshot({
          path: join(shots, `section-${id}${theme === 'light' ? '' : `-${theme}`}.png`),
        })
      }
    }
    await phone.screenshot({ path: join(shots, 'mobile-360.png'), fullPage: true })
    console.log(`screenshots → ${shots}`)
  }
} finally {
  await browser.close()
  server.close()
}
