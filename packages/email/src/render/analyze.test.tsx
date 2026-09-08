/**
 * Byte attribution.
 *
 * The invariant that matters is conservation: the four buckets must add up to the whole,
 * or the report is quietly lying about where a template's weight is.
 */
import { describe, expect, it } from 'vitest'
import { analyze, formatAnalysis } from './analyze.ts'
import { renderEmail } from './render.tsx'
import { Receipt } from '../templates/index.ts'

const { html } = renderEmail(<Receipt />, { theme: 'light' })
const analysis = analyze(html)

describe('analyze', () => {
  it('accounts for every byte', () => {
    const sum = analysis.inlineStyles + analysis.markup + analysis.text + analysis.overhead
    expect(sum).toBe(analysis.total)
  })

  it('finds inline CSS and markup to dominate, with text a small remainder', () => {
    /*
     * Measured on the receipt: 41% inline CSS, 45% markup, 11% text. The markup share is
     * this high because a presentational table carries ~70 bytes of
     * `role`/`cellpadding`/`cellspacing`/`border`/`width` attributes and the receipt emits
     * one table per line item — the cost of the design choice documented on `Receipt`.
     *
     * An earlier version of this test asserted inline CSS alone dominated and failed. The
     * assertion that holds is that content is the small part: if text ever exceeds either
     * of the other two, the templates have stopped being chrome-heavy and the whole
     * minification effort is pointed at the wrong thing.
     */
    expect(analysis.text).toBeLessThan(analysis.inlineStyles)
    expect(analysis.text).toBeLessThan(analysis.markup)
  })

  it('ranks tags by bytes, not by count', () => {
    const sorted = [...analysis.byTag].sort((a, b) => b.bytes - a.bytes)
    expect(analysis.byTag).toEqual(sorted)
  })

  it('surfaces the repeated font stack, which is the biggest single line item', () => {
    /*
     * 12 copies, 1.11 KB of a 6.85 KB email. Deliberately NOT deduplicated: Gmail and
     * Outlook.com discard `<body>` styles, which is why email templates restate the font on
     * every text-bearing element. The saving is real and so is the reason not to take it —
     * and the budgets pass with room, so this is a number to know rather than a bug.
     */
    const top = analysis.repeatedDeclarations[0]
    expect(top).toBeDefined()
    expect(top!.declaration).toContain('font-family')
    expect(top!.count).toBeGreaterThan(1)
  })

  it('reports no repeated declaration for a document that has none', () => {
    expect(analyze('<p style="color:red">x</p>').repeatedDeclarations).toEqual([])
  })

  it('formats without throwing on an empty document', () => {
    expect(() => formatAnalysis(analyze(''))).not.toThrow()
  })
})
