/**
 * RTL canary — the catalog mirrors under `dir="rtl"`.
 *
 * ## Why
 *
 * `CLAUDE.md` lists RTL as a shipping target ("CSS logical properties throughout"), and the
 * implementation is in fact almost perfectly logical — a sweep of every shipped stylesheet
 * finds exactly one physical inline property, and it is justified. But nothing asserted any
 * of it: before this file the whole repo contained a single `dir="rtl"` reference and no RTL
 * test, which made RTL the one shipping claim with no evidence behind it while every
 * neighbouring claim had a guard. That asymmetry is what this closes (1.0 readiness, S1).
 *
 * ## Two legs, because either alone is weak
 *
 * **Static** — no shipped rule uses a physical inline property. Cheap, exhaustive, and it
 * fails at authoring time, which is where a `padding-left` gets typed.
 *
 * **Browser** — real Chromium, shipped `dist/`, each component mounted twice: `dir="ltr"`
 * and `dir="rtl"`. For every element whose inline box is *asymmetric* in LTR, the physical
 * values must swap. This is the leg that catches what a grep cannot: a logical property
 * defeated by a physical one later in the cascade, a third-party rule, or a shorthand.
 *
 * The browser leg counts the asymmetric elements it found and fails if there are too few —
 * a mirroring assertion over symmetric padding passes no matter what the CSS does, so
 * without that count this file would be the kind of guard that has only ever been green.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { after, before, describe, it } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { chromiumNote, resolveChromium } from './lib/chromium.ts'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const DIST = join(ROOT, 'packages/react/dist')

/* ------------------------------------------------------------------ static leg */

/**
 * Every published package that ships CSS. `flow`, `editor` and `platform` were missing from
 * an earlier revision while `docs/COMPATIBILITY.md` claimed the guarantee held for "every
 * shipped rule" — they were clean, so the gap cost nothing yet, but a scope narrower than the
 * published claim is how a claim quietly stops being true.
 */
const CSS_ROOTS = [
  'packages/components/src',
  'packages/layouts/src',
  'packages/charts/src',
  'packages/themes/src',
  'packages/tokens/src',
  'packages/flow/src',
  'packages/editor/src',
  'packages/platform/src',
]

/**
 * A physical property is only wrong when it participates in inline layout. `left`/`right`
 * on an element positioned from a *pointer coordinate* is physical on purpose: the browser
 * hands over a viewport x, which has no writing-mode-relative meaning.
 */
const PHYSICAL_ALLOWLIST: Record<string, string> = {
  'packages/components/src/context-menu/context-menu.module.css':
    'positioned from the pointer x (--cascivo-context-x), a viewport coordinate, not an inline offset',
}

// Anchored on a declaration boundary — start of line, `{`, or `;` — rather than start of
// line alone, so a rule written on one line (`.x { padding-left: 8px; }`) cannot slip
// past. The boundary also stops `--brand-left: 4px` from reading as a `left` declaration.
// The optional `-\w+` tail catches longhands like `border-left-width`.
const PHYSICAL =
  /(?:^|[{;])\s*(?:(?:margin|padding|border)-(?:left|right)(?:-\w+)?\s*:|(?:left|right)\s*:|text-align\s*:\s*(?:left|right))/

function cssFiles(dir: string): string[] {
  const out: string[] = []
  const full = join(ROOT, dir)
  if (!existsSync(full)) return out
  const walk = (d: string): void => {
    for (const entry of readdirSync(d)) {
      if (entry === 'node_modules' || entry === 'dist') continue
      const p = join(d, entry)
      if (statSync(p).isDirectory()) walk(p)
      else if (entry.endsWith('.css')) out.push(p)
    }
  }
  walk(full)
  return out
}

describe('RTL — static', () => {
  const files = CSS_ROOTS.flatMap(cssFiles)

  it('finds the stylesheets it is meant to cover (no vacuous pass)', () => {
    assert.ok(files.length >= 150, `expected 150+ shipped stylesheets, found ${files.length}`)
  })

  it('no shipped rule uses a physical inline property', () => {
    const offenders: string[] = []
    for (const file of files) {
      const rel = relative(ROOT, file)
      if (rel in PHYSICAL_ALLOWLIST) continue
      for (const [i, line] of readFileSync(file, 'utf8').split('\n').entries()) {
        // `inset-inline` is logical; its longhands read `inset-inline-start`, not `left`.
        if (line.includes('inset-inline')) continue
        if (PHYSICAL.test(line)) offenders.push(`${rel}:${i + 1}  ${line.trim()}`)
      }
    }
    assert.deepEqual(
      offenders,
      [],
      'Physical inline properties do not mirror under dir="rtl", and cascivo ships RTL as a ' +
        'supported target (CLAUDE.md). Use the logical equivalent — margin-inline-start, ' +
        'padding-inline-end, inset-inline-start, text-align: start — or add the file to ' +
        `PHYSICAL_ALLOWLIST with the reason it is genuinely physical.\n${offenders.join('\n')}`,
    )
  })
})

/* ----------------------------------------------------------------- browser leg */

// React, react-dom and Playwright are dependencies of `packages/react`, not of the repo
// root, so resolve from there rather than adding root devDependencies for one check —
// the same arrangement `computed-style.test.ts` uses.
const resolve = createRequire(new URL('../../packages/react/package.json', import.meta.url)).resolve
async function load(specifier: string): Promise<any> {
  const mod = await import(pathToFileURL(resolve(specifier)).href)
  return mod.default && !mod.chromium && !mod.createElement && !mod.renderToStaticMarkup
    ? mod.default
    : mod
}

interface Box {
  selector: string
  paddingLeft: number
  paddingRight: number
  marginLeft: number
  marginRight: number
  borderLeft: number
  borderRight: number
}

describe('RTL — browser', () => {
  if (!existsSync(join(DIST, 'styles.css'))) {
    it('skipped — packages/react/dist absent (run `pnpm build`)', () => {})
    return
  }

  let browser: any
  let page: any
  let h: any
  let renderToStaticMarkup: any
  let C: any
  let STYLES = ''

  before(async () => {
    const { chromium } = await load('@playwright/test')
    ;({ createElement: h } = await load('react'))
    ;({ renderToStaticMarkup } = await load('react-dom/server'))
    C = await import(new URL('../../packages/react/dist/node/index.js', import.meta.url).href)
    STYLES = readFileSync(join(DIST, 'styles.css'), 'utf8')
    const executablePath = resolveChromium(chromium.executablePath())
    console.log(chromiumNote(executablePath))
    browser = await chromium.launch(executablePath ? { executablePath } : {})
    page = await browser.newPage({ viewport: { width: 900, height: 900 } })
  })

  after(async () => {
    await browser?.close()
  })

  /** Mount the sample in one direction and measure every element's physical inline box. */
  async function measure(dir: 'ltr' | 'rtl'): Promise<Map<string, Box>> {
    // Chosen for asymmetry, not coverage: these are the components whose stylesheets use
    // padding-inline-start / margin-inline-start / border-inline-end, which is what makes a
    // mirroring assertion mean anything. Symmetric components would pass trivially.
    const sample = h(
      'div',
      { id: 'root' },
      h(C.SideNav, {
        key: 'n',
        items: [
          { label: 'Overview', href: '#', active: true },
          { label: 'Reports', href: '#', items: [{ label: 'Weekly', href: '#' }] },
        ],
      }),
      h(C.Toc, {
        key: 't',
        items: [
          { id: 'a', label: 'Introduction', level: 2 },
          { id: 'b', label: 'Nested heading', level: 3 },
        ],
      }),
      h(C.List, { key: 'l', items: ['First item', 'Second item'] }),
      h(
        C.Blockquote,
        { key: 'q', cite: 'Ada' },
        'A logical property mirrors; a physical one does not.',
      ),
      h(C.Progress, { key: 'p', value: 40, label: 'Upload' }),
      h(C.Alert, { key: 'a', variant: 'info', title: 'Heads up', description: 'Body copy.' }),
      h(
        C.Card,
        { key: 'c' },
        h(C.CardHeader, { key: 'h' }, 'Header'),
        h(C.CardContent, { key: 'b' }, 'Content'),
      ),
    )
    const html = renderToStaticMarkup(sample)
    await page.setContent(
      `<!doctype html><html dir="${dir}" lang="en"><head><style>${STYLES}</style></head>` +
        `<body><div data-theme="light">${html}</div></body></html>`,
    )
    const boxes: Box[] = await page.$$eval('#root *', (nodes: Element[]) =>
      nodes.map((el, i) => {
        const s = getComputedStyle(el)
        const n = (v: string): number => Number.parseFloat(v) || 0
        return {
          selector: `${el.tagName.toLowerCase()}#${i}`,
          paddingLeft: n(s.paddingLeft),
          paddingRight: n(s.paddingRight),
          marginLeft: n(s.marginLeft),
          marginRight: n(s.marginRight),
          borderLeft: n(s.borderLeftWidth),
          borderRight: n(s.borderRightWidth),
        }
      }),
    )
    return new Map(boxes.map((b) => [b.selector, b]))
  }

  it('every asymmetric inline box mirrors under dir="rtl"', async () => {
    const ltr = await measure('ltr')
    const rtl = await measure('rtl')

    const asymmetric: string[] = []
    const failures: string[] = []

    for (const [selector, l] of ltr) {
      const r = rtl.get(selector)
      if (r === undefined) continue
      const pairs: [string, number, number, number, number][] = [
        ['padding', l.paddingLeft, l.paddingRight, r.paddingLeft, r.paddingRight],
        ['margin', l.marginLeft, l.marginRight, r.marginLeft, r.marginRight],
        ['border', l.borderLeft, l.borderRight, r.borderLeft, r.borderRight],
      ]
      for (const [prop, ll, lr, rl, rr] of pairs) {
        if (ll === lr) continue // symmetric: mirrors to itself, proves nothing
        asymmetric.push(`${selector} ${prop}`)
        if (Math.abs(ll - rr) > 0.5 || Math.abs(lr - rl) > 0.5) {
          failures.push(
            `  ${selector} ${prop}: ltr ${ll}/${lr} (left/right) → rtl ${rl}/${rr}, expected ${lr}/${ll}`,
          )
        }
      }
    }

    assert.ok(
      asymmetric.length >= 8,
      `Only ${asymmetric.length} asymmetric inline boxes found in the sample — a mirroring ` +
        'assertion over symmetric padding passes whatever the CSS does, so this guard would ' +
        'be green by construction. Add components that use padding-inline-start / ' +
        'margin-inline-end to the sample.',
    )

    assert.deepEqual(
      failures,
      [],
      'These elements do not mirror under dir="rtl", so a physical property is winning ' +
        'somewhere in the cascade — a logical longhand overridden by a physical one, a ' +
        'shorthand, or a rule outside the stylesheets the static leg scans.\n' +
        failures.join('\n'),
    )
  })

  it('RTL introduces no horizontal overflow', async () => {
    await measure('rtl')
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    assert.ok(
      overflow.scrollWidth <= overflow.clientWidth + 1,
      `dir="rtl" pushes a horizontal scrollbar (scrollWidth ${overflow.scrollWidth} vs ` +
        `clientWidth ${overflow.clientWidth}). Something is positioned from the wrong edge.`,
    )
  })
})
