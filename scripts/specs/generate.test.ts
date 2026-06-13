import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildPerComponentBoundaries,
  buildSpecSummary,
  firstParagraph,
  parseExceptions,
  parseFrontMatter,
  type Registry,
} from './generate.ts'

// ---------------------------------------------------------------------------
// parseFrontMatter
// ---------------------------------------------------------------------------

describe('parseFrontMatter', () => {
  it('extracts id and title', () => {
    const fm = parseFrontMatter('---\nid: spec-spacing\ntitle: Spacing\n---\n\n# Spacing\n\nBody.')
    assert.equal(fm.id, 'spec-spacing')
    assert.equal(fm.title, 'Spacing')
    assert.ok(fm.body.includes('# Spacing'))
  })

  it('returns whole content as body when no front-matter', () => {
    const fm = parseFrontMatter('# No front matter\n\nText.')
    assert.equal(fm.id, undefined)
    assert.equal(fm.title, undefined)
    assert.ok(fm.body.includes('# No front matter'))
  })
})

// ---------------------------------------------------------------------------
// firstParagraph
// ---------------------------------------------------------------------------

describe('firstParagraph', () => {
  it('skips headings and returns the first prose paragraph', () => {
    const p = firstParagraph('# Title\n\nFirst paragraph here.\n\nSecond paragraph.')
    assert.equal(p, 'First paragraph here.')
  })

  it('joins multi-line paragraphs with spaces', () => {
    const p = firstParagraph('# Title\n\nLine one\nline two.\n\nNext.')
    assert.equal(p, 'Line one line two.')
  })
})

// ---------------------------------------------------------------------------
// buildSpecSummary
// ---------------------------------------------------------------------------

describe('buildSpecSummary', () => {
  it('builds a summary with id, title, path, and first paragraph', () => {
    const content =
      '---\nid: spec-spacing\ntitle: Spacing\n---\n\n# Spacing\n\ncascade uses a fixed scale.'
    const s = buildSpecSummary(content, 'spacing')
    assert.deepEqual(s, {
      id: 'spec-spacing',
      title: 'Spacing',
      path: '/docs/specs/spacing.md',
      summary: 'cascade uses a fixed scale.',
    })
  })

  it('falls back to slug when front-matter missing', () => {
    const s = buildSpecSummary('# Heading\n\nText.', 'foo')
    assert.equal(s.id, 'foo')
    assert.equal(s.title, 'foo')
  })
})

// ---------------------------------------------------------------------------
// buildPerComponentBoundaries
// ---------------------------------------------------------------------------

describe('buildPerComponentBoundaries', () => {
  const registry: Registry = {
    components: [
      {
        name: 'button',
        type: 'component',
        meta: {
          name: 'Button',
          intent: {
            flexibility: [
              { area: 'token names', level: 'strict', note: 'Must resolve to tokens' },
              { area: 'label copy', level: 'flexible', note: 'Free copy' },
            ],
          },
        },
      },
      {
        name: 'spinner',
        type: 'component',
        meta: { name: 'Spinner', intent: null },
      },
      {
        name: 'core',
        type: 'lib',
        meta: { name: 'core' },
      },
    ],
  }

  it('maps component display names to flexibility rules', () => {
    const out = buildPerComponentBoundaries(registry)
    assert.deepEqual(out['Button'], [
      { area: 'token names', level: 'strict', note: 'Must resolve to tokens' },
      { area: 'label copy', level: 'flexible', note: 'Free copy' },
    ])
  })

  it('omits components without flexibility', () => {
    const out = buildPerComponentBoundaries(registry)
    assert.equal('Spinner' in out, false)
  })

  it('ignores non-component registry entries', () => {
    const out = buildPerComponentBoundaries(registry)
    assert.equal('core' in out, false)
  })
})

// ---------------------------------------------------------------------------
// parseExceptions
// ---------------------------------------------------------------------------

describe('parseExceptions', () => {
  const md = `# Historical Exceptions

Intro text.

## Exceptions

### EXC-001: Accordion uses grid-template-rows animation

**What:** accordion.module.css transitions grid-template-rows.

**Breaks rule:** Never animate layout-affecting properties.

**Why:** The grid-template-rows trick is the only CSS-only method.

---

### EXC-002: Another exception

**What:** Does a thing.

**Breaks rule:** Some rule.

**Why:** A reason.
`

  it('parses all EXC sections', () => {
    const exceptions = parseExceptions(md)
    assert.equal(exceptions.length, 2)
    assert.deepEqual(
      exceptions.map((e) => e.id),
      ['EXC-001', 'EXC-002'],
    )
  })

  it('extracts what, breaksRule, and why fields', () => {
    const [first] = parseExceptions(md)
    assert.equal(first!.what, 'accordion.module.css transitions grid-template-rows.')
    assert.equal(first!.breaksRule, 'Never animate layout-affecting properties.')
    assert.equal(first!.why, 'The grid-template-rows trick is the only CSS-only method.')
  })

  it('returns empty array when no exceptions present', () => {
    assert.deepEqual(parseExceptions('# Empty\n\nNo sections.'), [])
  })
})
