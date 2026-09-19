import { describe, expect, it } from 'vitest'
import { correctReactOutput, stripResourceHints, unescapeApostrophes } from './react-output.ts'

describe('stripResourceHints', () => {
  it('drops the preload link React 19 emits for an image', () => {
    // Verified against react-dom 19.2.7: rendering one <img> hoists one of these into <head>.
    const html =
      '<head><link rel="preload" as="image" href="https://x.test/a.png"/><title>t</title></head>'
    expect(stripResourceHints(html)).toBe('<head><title>t</title></head>')
  })

  it('drops every hint rel, not just preload', () => {
    for (const rel of ['modulepreload', 'prefetch', 'preconnect', 'dns-prefetch']) {
      expect(stripResourceHints(`<link rel="${rel}" href="https://x.test"/>`)).toBe('')
    }
  })

  it('leaves a link the author wrote alone', () => {
    // Only React's own hints are noise; an <link rel="alternate"> is a deliberate choice.
    const authored = '<link rel="alternate" href="https://x.test/web"/>'
    expect(stripResourceHints(authored)).toBe(authored)
  })

  it('does not run past the end of the tag it is removing', () => {
    const html = '<link rel="preload" as="image" href="https://x.test/a.png"/><p>kept</p>'
    expect(stripResourceHints(html)).toBe('<p>kept</p>')
  })
})

describe('unescapeApostrophes', () => {
  it('spends two bytes on a quoted font name instead of twelve', () => {
    const before = `<p style="font-family:&#x27;Segoe UI&#x27;,sans-serif">x</p>`
    const after = unescapeApostrophes(before)
    expect(after).toBe(`<p style="font-family:'Segoe UI',sans-serif">x</p>`)
    // Two quotes: 12 bytes of entity for 2 bytes of apostrophe.
    expect(before.length - after.length).toBe(10)
  })

  it('leaves &quot; alone, which is load-bearing inside a double-quoted attribute', () => {
    const html = '<p title="say &quot;hi&quot;">x</p>'
    expect(unescapeApostrophes(html)).toBe(html)
  })

  it('does not touch an apostrophe entity the author wrote as text', () => {
    // React escapes a literal `&#x27;` in content to `&amp;#x27;`, which this must not match.
    expect(unescapeApostrophes('<p>&amp;#x27;</p>')).toBe('<p>&amp;#x27;</p>')
  })
})

describe('correctReactOutput', () => {
  it('applies both corrections', () => {
    const html = `<link rel="preload" as="image" href="https://x.test/a.png"/><p style="font-family:&#x27;SF Mono&#x27;">x</p>`
    expect(correctReactOutput(html)).toBe(`<p style="font-family:'SF Mono'">x</p>`)
  })
})
