/**
 * The site serves Cascivo Sans from `apps/site/public/fonts/cascivo-sans/` — copies of the
 * font build in `fonts/cascivo-sans/`. A rebuilt font with a stale site copy would serve old
 * files to everyone who downloads from /cascivo-sans, so the copies are byte-compared here.
 * Refresh them with `pnpm fonts:site:sync` (part of `pnpm regen`).
 *
 * Also covers the type tester's pure helpers, since apps/site has no unit-test runner in CI.
 */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import {
  FONT_FILES,
  axesLabel,
  bytesPerCodepoint,
  clampAxis,
  countCodepoints,
  downloadHref,
  fontFaceSnippet,
  formatKb,
  testerStyle,
} from '../../apps/site/src/marketing/pages/cascivo-sans/data.ts'
import { FAMILIES, familySnippet } from '../../apps/site/src/marketing/pages/fonts/families.ts'
import { PRERENDER_ROUTES, ROUTE_HEAD } from '../../apps/site/src/marketing/route-head.ts'

const ROOT = join(import.meta.dirname, '../..')
const PUBLIC = join(ROOT, 'apps/site/public/fonts/cascivo-sans')
const FIX = 'run `pnpm fonts:site:sync`'

describe('site copy of Cascivo Sans', () => {
  it('every FONT_FILES entry is in public and byte-identical to its source', () => {
    for (const f of FONT_FILES) {
      const copy = join(PUBLIC, f.name)
      assert.ok(existsSync(copy), `${f.name} missing from the site — ${FIX}`)
      const same = readFileSync(copy).equals(readFileSync(join(ROOT, f.source)))
      assert.ok(same, `${f.name} differs from ${f.source} — ${FIX}`)
    }
  })

  it('public/fonts/cascivo-sans holds no extra files', () => {
    const names = existsSync(PUBLIC) ? readdirSync(PUBLIC).sort() : []
    assert.deepEqual(names, FONT_FILES.map((f) => f.name).sort(), FIX)
  })

  it('FONT_SIZES matches the source byte length for every file', async () => {
    // Imported lazily: the module is generated, and a missing one should fail this test only.
    const { FONT_SIZES } =
      await import('../../apps/site/src/marketing/pages/cascivo-sans/sizes.generated.ts')
    for (const f of FONT_FILES) {
      const bytes = readFileSync(join(ROOT, f.source)).length
      assert.equal(FONT_SIZES[f.name], bytes, `${f.name} size is stale — ${FIX}`)
    }
  })
})

describe('site copy of the family fonts', () => {
  for (const family of FAMILIES) {
    it(`cascivo-${family.id} serves exactly its files, byte-identical to the build`, () => {
      const dir = join(ROOT, 'apps/site/public/fonts', `cascivo-${family.id}`)
      assert.deepEqual(
        existsSync(dir) ? readdirSync(dir).sort() : [],
        family.files.map((f) => f.name).sort(),
        FIX,
      )
      for (const f of family.files) {
        const same = readFileSync(join(dir, f.name)).equals(readFileSync(join(ROOT, f.source)))
        assert.ok(same, `${f.name} differs from ${f.source} — ${FIX}`)
      }
    })

    it(`cascivo-${family.id} sizes are current and the header picker's face is a web file`, async () => {
      const { FAMILY_SIZES } =
        await import('../../apps/site/src/marketing/pages/fonts/sizes.generated.ts')
      for (const f of family.files) {
        assert.equal(
          FAMILY_SIZES[`${family.id}/${f.name}`],
          readFileSync(join(ROOT, f.source)).length,
        )
      }
      const css = readFileSync(
        join(ROOT, `apps/site/src/marketing/font-faces/${family.id}.css`),
        'utf8',
      )
      const web = family.files.find((f) => f.kind === 'web')
      assert.ok(
        web && css.includes(`/fonts/cascivo-${family.id}/${web.name}`),
        'picker face drifted',
      )
    })
  }

  it('every family page is routed, prerendered and has a head', () => {
    for (const route of ['/fonts', ...FAMILIES.map((f) => f.route)]) {
      assert.ok(ROUTE_HEAD[route], `no ROUTE_HEAD for ${route}`)
      assert.ok(PRERENDER_ROUTES.includes(route.slice(1)), `${route} is not prerendered`)
      assert.ok(
        (ROUTE_HEAD[route]?.description ?? '').length <= 160,
        `${route} description too long`,
      )
    }
  })

  it('familySnippet points relative url()s at the web file', () => {
    for (const family of FAMILIES) {
      const web = family.files.find((f) => f.kind === 'web')
      assert.ok(familySnippet(family).includes(`url('${web?.name}')`))
    }
  })
})

describe('@font-face cache busting', () => {
  // /fonts/* is cached for a day under one URL: without a content hash in the url(), a visitor who
  // loaded round 2's Serif kept its slab-footed period after round 3 shipped round dots.
  const sheets = [
    'apps/site/src/marketing/pages/cascivo-sans/font.css',
    ...FAMILIES.map((f) => `apps/site/src/marketing/font-faces/${f.id}.css`),
  ]
  for (const sheet of sheets) {
    it(`${sheet} versions every url() with the served file's hash`, () => {
      const css = readFileSync(join(ROOT, sheet), 'utf8')
      const urls = [...css.matchAll(/url\('(\/fonts\/[^'?]+)(\?v=[0-9a-f]*)?'\)/g)]
      assert.ok(urls.length > 0, `${sheet} has no /fonts/ url()`)
      for (const [, file = '', query] of urls) {
        const hash = createHash('sha256')
          .update(readFileSync(join(ROOT, 'apps/site/public', file)))
          .digest('hex')
          .slice(0, 10)
        assert.equal(query, `?v=${hash}`, `${file} is not versioned with its content — ${FIX}`)
      }
    })
  }
})

describe('comparison data', () => {
  it('comparison.generated.ts equals fonts/cascivo-sans/comparison.json', async () => {
    const { COMPARISON } =
      await import('../../apps/site/src/marketing/pages/cascivo-sans/comparison.generated.ts')
    const json: unknown = JSON.parse(
      readFileSync(join(ROOT, 'fonts/cascivo-sans/comparison.json'), 'utf8'),
    )
    assert.deepEqual(JSON.parse(JSON.stringify(COMPARISON)), json, FIX)
  })

  it('formats sizes as KB with one decimal and bytes per codepoint as integers', () => {
    assert.equal(formatKb(21096), '20.6 KB')
    assert.equal(bytesPerCodepoint(21096, 211), 100)
  })

  it('counts the requested codepoint set', () => {
    assert.equal(countCodepoints('U+0041-0043,U+00A0'), 4)
  })

  it('names the axes and whether an italic file exists', async () => {
    const { COMPARISON } =
      await import('../../apps/site/src/marketing/pages/cascivo-sans/comparison.generated.ts')
    const label = (name: string) => {
      const font = COMPARISON.fonts.find((f) => f.name === name)
      assert.ok(font, name)
      return axesLabel(font)
    }
    assert.equal(label('Geist'), 'Weight · no italic')
    assert.equal(label('IBM Plex Sans'), 'Weight · italic file')
  })
})

describe('type tester helpers', () => {
  it('clampAxis rounds, clamps, and maps NaN to the initial value', () => {
    assert.equal(clampAxis('wght', 1200), 900)
    assert.equal(clampAxis('opsz', 7.6), 8)
    assert.equal(clampAxis('wght', 412.4), 412)
    assert.equal(clampAxis('size', Number.NaN), 40)
  })

  it('testerStyle clamps every axis and maps italic to font-style', () => {
    assert.deepEqual(testerStyle({ wght: 1000, opsz: 14, size: 40, italic: true }), {
      '--cs-wght': '900',
      '--cs-opsz': '14',
      '--cs-size': '40px',
      'font-style': 'italic',
    })
  })
})

describe('download list and snippet', () => {
  it('downloadHref uses the URL form the browser requests for url()', () => {
    // A literal comma, as Chromium sends for the @font-face url() — one spelling per file.
    assert.equal(
      downloadHref('CascivoSans-Latin[opsz,wght].woff2'),
      '/fonts/cascivo-sans/CascivoSans-Latin%5Bopsz,wght%5D.woff2',
    )
  })

  it('fontFaceSnippet points relative url()s at every web file, as the page tells adopters', () => {
    const snippet = fontFaceSnippet()
    for (const f of FONT_FILES.filter((file) => file.kind === 'web')) {
      assert.ok(snippet.includes(`url('${f.name}')`), `snippet lacks url('${f.name}')`)
    }
    assert.ok(!snippet.includes('/fonts/'), 'snippet must not hard-code a server path')
  })

  it('web files say they are Latin-only slices', () => {
    for (const f of FONT_FILES.filter((file) => file.kind === 'web')) {
      assert.match(f.label, /Latin/, `${f.name} label hides that it is a Latin slice`)
    }
  })
})

describe('/cascivo-sans head', () => {
  it('meta description fits a search snippet (≤ 160 characters)', () => {
    const description = ROUTE_HEAD['/cascivo-sans']?.description ?? ''
    assert.ok(description.length > 0, 'no description for /cascivo-sans')
    assert.ok(description.length <= 160, `description is ${description.length} characters`)
  })
})
