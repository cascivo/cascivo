// The fixed proof set that JUDGING.md scores. Every round renders the same sheets, so scores compare.
//
//   node src/proofs.cjs OUT_DIR [--refs DIR]
//
// DIR may hold Inter.woff2 InterItalic.woff2 Geist.woff2 Plex.woff2 PlexItalic.woff2 (any missing
// one is skipped); Helvetica is stood in for by local Helvetica / Liberation Sans (same metrics).
// Chromium (Playwright, pre-installed) renders, so shaping, kerning and opsz auto are a browser's.
// Sheets are 2x (deviceScaleFactor 2) except small_1x, which judges pixels at 1x.
'use strict'
const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright')

const out = process.argv[2]
if (!out) throw new Error('usage: node src/proofs.cjs OUT_DIR [--refs DIR]')
const ri = process.argv.indexOf('--refs')
const refs = ri > 0 ? path.resolve(process.argv[ri + 1]) : null
const dist = path.resolve(__dirname, '..', 'fonts')

const url = (p) => 'file://' + p
const face = (fam, src, style) =>
  `@font-face{font-family:'${fam}';src:${src};font-weight:100 900;font-style:${style}}`
const faces = [
  face('Cascivo', `url('${url(path.join(dist, 'CascivoSans[opsz,wght].ttf'))}')`, 'normal'),
  face('Cascivo', `url('${url(path.join(dist, 'CascivoSans-Italic[opsz,wght].ttf'))}')`, 'italic'),
  // Real Helvetica where installed, else Liberation Sans (Helvetica's metrics); bold is its own face
  "@font-face{font-family:'Helvetica*';src:local('Helvetica'),local('Liberation Sans');font-weight:100 500}",
  "@font-face{font-family:'Helvetica*';src:local('Helvetica Bold'),local('Liberation Sans Bold');font-weight:600 900}",
]
const fams = ['Cascivo']
if (refs) {
  for (const [fam, up, it] of [
    ['Inter', 'Inter', 'InterItalic'],
    ['Geist', 'Geist', null],
    ['Plex', 'Plex', 'PlexItalic'],
  ]) {
    const u = path.join(refs, up + '.woff2')
    if (!fs.existsSync(u)) continue
    fams.push(fam)
    faces.push(face(fam, `url('${url(u)}')`, 'normal'))
    const i = it && path.join(refs, it + '.woff2')
    if (i && fs.existsSync(i)) faces.push(face(fam, `url('${url(i)}')`, 'italic'))
  }
}
fams.push('Helvetica*')

const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const FIGS = '0123456789 &@%$€?!()[]{}“”‘’«»-–—/*#'
const WORDS = 'Hamburgefonstiv quick wafting zephyrs vex bold Jim'
const SPACING = 'nnnonnnooo HHHOHHHOOO minimum illumination 1100110 Il1|'
const KERN = 'AVATAR To Ty Wa We LT PA F. P, y. r. Yo “A” Kv 7, f) T- LY'
const AMBIG = 'Il1| O0o rn m cl d vv w 5S 2Z 8B 6b 9g q'
const PARA =
  'Typography is the craft of making written language legible and beautiful. At small sizes the ' +
  'counters close, the joins clot and the spacing decides whether a line reads as words or as a ' +
  'texture. Quick brown foxes jump over 13 lazy dogs: 0123456789, (a, b; c) “done” — 4.5% off €1,280.'
const UI = 'Save changes · Cancel · Settings · 3 new messages · 12:45 PM · $1,234.56 · Il1 O0'
const W5 = [100, 300, 400, 700, 900]
const W9 = [100, 200, 300, 400, 500, 600, 700, 800, 900]

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const line = (fam, text, px, w, o = {}) => {
  const st =
    `font-family:'${fam}';font-size:${px}px;font-weight:${w};font-style:${o.italic ? 'italic' : 'normal'};` +
    (o.opsz ? `font-variation-settings:'opsz' ${o.opsz};` : '') +
    (o.max ? `max-width:${o.max}px;` : 'white-space:nowrap;') +
    (o.lh ? `line-height:${o.lh};` : 'line-height:1.25;')
  return `<div class=r><span class=l>${esc(fam)} ${w}${o.italic ? 'i' : ''}${o.opsz ? ' opsz ' + o.opsz : ''}</span><div style="${st}">${esc(text)}</div></div>`
}
const block = (title, rows) => `<h2>${esc(title)}</h2>${rows.join('')}`
// Italic rows only for families that ship an italic; the browser would otherwise slant the upright
const italicFams = fams.filter((f) => f !== 'Geist' && f !== 'Helvetica*')

const sheets = {
  // Shapes and proportions, every family at the same weights, upright then italic
  glyphs_upright: [LOWER, UPPER, FIGS].map((t, k) =>
    block(
      ['lowercase', 'capitals', 'figures and punctuation'][k],
      [400, 700, 900, 100].flatMap((w) => fams.map((f) => line(f, t, 64, w))),
    ),
  ),
  glyphs_italic: [LOWER, UPPER, FIGS].map((t, k) =>
    block(
      ['italic lowercase', 'italic capitals', 'italic figures and punctuation'][k],
      [400, 700, 900, 100].flatMap((w) =>
        italicFams.map((f) => line(f, t, 64, w, { italic: true })),
      ),
    ),
  ),
  // Weight axis: same words, every named weight; a step that jumps or a width that drifts shows here
  weights: [
    block(
      'weight axis, upright',
      W9.map((w) => line('Cascivo', WORDS, 44, w)),
    ),
    block(
      'weight axis, italic',
      W9.map((w) => line('Cascivo', WORDS, 44, w, { italic: true })),
    ),
  ],
  // Optical size: one size on screen, opsz forced, so only the design change shows
  opsz: [300, 400, 900].map((w) =>
    block(
      `opsz at ${w}`,
      [8, 11, 14, 24, 32, 48].map((o) =>
        line('Cascivo', 'Hamburgefonstiv 0123 Rag', 48, w, { opsz: o }),
      ),
    ),
  ),
  // Rhythm and spacing; kerning; ambiguity
  spacing: [
    block(
      'spacing strings',
      W5.flatMap((w) => fams.map((f) => line(f, SPACING, 44, w))),
    ),
    block(
      'italic spacing',
      [400, 900].flatMap((w) => italicFams.map((f) => line(f, SPACING, 44, w, { italic: true }))),
    ),
  ],
  kerning: [
    block(
      'kerning pairs',
      [100, 400, 900].flatMap((w) => fams.map((f) => line(f, KERN, 48, w))),
    ),
    block(
      'italic kerning',
      [400, 900].flatMap((w) => italicFams.map((f) => line(f, KERN, 48, w, { italic: true }))),
    ),
  ],
  ambiguity: [
    block(
      'ambiguous shapes',
      [300, 400, 700].flatMap((w) => fams.map((f) => line(f, AMBIG, 40, w))),
    ),
  ],
  // Paragraph colour: real measure, opsz auto
  text: [
    ...[16, 13].map((px) =>
      block(
        `paragraph ${px}px`,
        [300, 400, 600].flatMap((w) =>
          fams.map((f) => line(f, PARA, px, w, { max: 560, lh: 1.5 })),
        ),
      ),
    ),
    block(
      'italic paragraph 16px',
      italicFams.map((f) => line(f, PARA, 16, 400, { max: 560, lh: 1.5, italic: true })),
    ),
  ],
  display: [
    block(
      'display 120px',
      [100, 400, 900].flatMap((w) =>
        fams.map((f) => line(f, 'Regal Shift 2026', 120, w, { lh: 1.05 })),
      ),
    ),
  ],
}
const small = [
  block(
    'UI strings 11 / 12 / 13 / 14 px at 1x',
    [11, 12, 13, 14].flatMap((px) =>
      [300, 400, 600].flatMap((w) => fams.map((f) => line(f, UI, px, w))),
    ),
  ),
  block(
    'paragraph 12px at 1x',
    [400].flatMap((w) => fams.map((f) => line(f, PARA, 12, w, { max: 480, lh: 1.45 }))),
  ),
]

const css = `${faces.join('')}body{margin:0;padding:24px;background:#fff;color:#000;width:1800px}
h2{font:600 15px 'DejaVu Sans',sans-serif;color:#06c;margin:28px 0 6px;border-top:1px solid #ccc;padding-top:8px}
.r{display:flex;align-items:baseline;gap:16px;margin:2px 0}.l{flex:0 0 150px;font:11px 'DejaVu Sans Mono',monospace;color:#777}`

;(async () => {
  fs.mkdirSync(out, { recursive: true })
  const browser = await chromium.launch()
  const render = async (name, body, dpr) => {
    const page = await browser.newPage({
      viewport: { width: 1848, height: 600 },
      deviceScaleFactor: dpr,
    })
    // A file:// page, so the file:// font URLs load (about:blank may not fetch them)
    const html = path.join(out, name + '.html')
    fs.writeFileSync(html, `<!doctype html><meta charset=utf-8><style>${css}</style>${body}`)
    await page.goto(url(html))
    await page.evaluate(() => document.fonts.ready)
    // A face that failed to load would silently fall back and get judged as ours
    const bad = await page.evaluate(() =>
      [...document.fonts].filter((f) => f.status === 'error').map((f) => f.family + ' ' + f.style),
    )
    if (bad.length) throw new Error(`${name}: fonts not loaded: ${bad.join(', ')}`)
    await page.screenshot({ path: path.join(out, name + '.png'), fullPage: true })
    await page.close()
    fs.unlinkSync(html)
  }
  for (const [name, blocks] of Object.entries(sheets)) await render(name, blocks.join(''), 2)
  await render('small_1x', small.join(''), 1)
  await browser.close()
  console.log(`${Object.keys(sheets).length + 1} sheets in ${out}; families: ${fams.join(', ')}`)
})()
