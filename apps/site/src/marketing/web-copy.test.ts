/**
 * The static home (`web/layouts/sections/*.html`) duplicates the copy of the poster JSX it
 * ports. Until the SPA home is deleted, this fails when a sentence is edited in one place only:
 * every plain-text run in a poster component (JSX text and string literals that read like
 * prose) must appear, after entity decoding and whitespace folding, in the section templates
 * that port it.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const site = resolve(__dirname, '../..')
const poster = (n: string) => resolve(site, 'src/marketing/poster', n)
const section = (n: string) => resolve(site, 'web/layouts/sections', n)

/**
 * Poster component → the templates that port it. Not listed on purpose: PosterColocation (only on
 * /modern-css), PosterLiveStrip (renders only with a Worker URL) and the island-only files.
 */
const PORTS: Record<string, string[]> = {
  'PosterHero.tsx': ['hero.html'],
  'PosterReactivity.tsx': ['signals.html'],
  'PosterProof.tsx': ['proof.html'],
  'PosterComparison.tsx': ['compare.html'],
  'PosterThemes.tsx': ['themes.html'],
  'PosterAiLayer.tsx': ['ai.html'],
  'PosterBreadth.tsx': ['beyond.html'],
  'PosterTerminal.tsx': ['terminal.html'],
  'PosterQuickStart.tsx': ['quickstart.html'],
  'PosterAppBuilder.tsx': ['ship.html'],
  'PosterShowcase.tsx': ['showcase.html'],
  'PosterCta.tsx': ['cta.html'],
}

const ENTITIES: Record<string, string> = {
  '&lt;': '<',
  '&gt;': '>',
  '&amp;': '&',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&#x27;': "'",
  '&nbsp;': ' ',
}
const decode = (s: string) =>
  s
    .replace(/&(?:lt|gt|amp|quot|nbsp|apos|#39|#x27);/g, (e) => ENTITIES[e] ?? e)
    .replace(/\s+/g, ' ')
    .trim()
/** Text content only (tags dropped); `decode` alone keeps attribute values. */
const fold = (s: string) => decode(decode(s).replace(/<[^>]*>/g, ' '))

/** Prose-like: at least 4 words, over half of them plain words (class lists and paths are not). */
const isProse = (s: string) => {
  const words = s.replace(/\s+/g, ' ').trim().split(' ')
  const plain = words.filter((w) => /^[A-Za-z][a-z']*[.,;:!?]?$/.test(w))
  return words.length >= 4 && plain.length * 2 > words.length
}

/** Text runs of a poster component, split at the `{…}` holes JSX leaves for data. */
export function proseOf(file: string): string[] {
  const sf = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const out: string[] = []
  const visit = (n: ts.Node) => {
    if (ts.isJsxText(n)) out.push(n.text)
    else if (ts.isJsxAttribute(n) && n.initializer && ts.isStringLiteral(n.initializer)) {
      const name = n.name.getText()
      if (name === 'aria-label' || name === 'alt' || name === 'title') out.push(n.initializer.text)
    }
    ts.forEachChild(n, visit)
  }
  visit(sf)
  return out.map((s) => s.replace(/\s+/g, ' ').trim()).filter(isProse)
}

describe('static home copy matches the poster JSX', () => {
  it('every poster file is mapped (a new section cannot slip past)', () => {
    const files = Object.keys(PORTS)
    for (const f of files) expect(() => readFileSync(poster(f))).not.toThrow()
  })

  for (const [file, templates] of Object.entries(PORTS)) {
    it(`${file} → ${templates.join(', ')}`, () => {
      const raw = templates.map((t) => readFileSync(section(t), 'utf8')).join(' ')
      const [text, attrs] = [fold(raw), decode(raw)]
      const missing = proseOf(poster(file)).filter(
        (p) => !text.includes(decode(p)) && !attrs.includes(decode(p)),
      )
      expect(missing, `copy in ${file} not found in ${templates.join(', ')}`).toEqual([])
    })
  }
})

describe('the copy check is not vacuous', () => {
  it('finds prose in the big sections', () => {
    for (const f of [
      'PosterHero.tsx',
      'PosterAiLayer.tsx',
      'PosterComparison.tsx',
      'PosterProof.tsx',
    ])
      expect(proseOf(poster(f)).length, f).toBeGreaterThan(0)
  })
})
