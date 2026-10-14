/**
 * The site serves Cascivo Sans from `apps/site/public/fonts/cascivo-sans/` — copies of the
 * font build in `fonts/cascivo-sans/`. A rebuilt font with a stale site copy would serve old
 * files to everyone who downloads from /cascivo-sans, so the copies are byte-compared here.
 * Refresh them with `pnpm fonts:site:sync` (part of `pnpm regen`).
 *
 * Also covers the type tester's pure helpers, since apps/site has no unit-test runner in CI.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import {
  FONT_FILES,
  clampAxis,
  downloadHref,
  fontFaceSnippet,
  testerStyle,
} from '../../apps/site/src/marketing/pages/cascivo-sans/data.ts'

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
