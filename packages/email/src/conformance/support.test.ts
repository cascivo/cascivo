/**
 * Verdict levels, exercised against a hand-built matrix.
 *
 * The fixtures mirror shapes that are really in the vendored data — including the
 * footnote-bearing `"a #1 #2"` codes that caused the first revision of this module to
 * reject `padding` outright.
 */
import { describe, expect, it } from 'vitest'
import { DEFAULT_FLOOR, indexFeatures, verdict, type CanIEmailData } from './support.ts'

const OUTLOOK_WIN = DEFAULT_FLOOR.find((c) => c.platform === 'windows')!

function matrix(stats: Record<string, Record<string, Record<string, string>>>): CanIEmailData {
  return {
    api_version: '1.0.4',
    last_update_date: 'fixture',
    data: [{ slug: 'css-x', title: 'x', category: 'css', stats }],
  }
}

const floor = [OUTLOOK_WIN]

describe('verdict', () => {
  it('is ok when the floor client reports y', () => {
    const v = verdict(
      indexFeatures(matrix({ outlook: { windows: { '2019': 'y' } } })),
      'css-x',
      floor,
    )
    expect(v.level).toBe('ok')
    expect(v.findings).toEqual([])
  })

  it('blocks on n', () => {
    const v = verdict(
      indexFeatures(matrix({ outlook: { windows: { '2019': 'n' } } })),
      'css-x',
      floor,
    )
    expect(v.level).toBe('blocked')
    expect(v.findings[0]?.client.label).toBe('Outlook (Windows)')
  })

  it('treats a partial as a caveat, not a failure', () => {
    // `padding` is literally `"a #1 #2"` in Outlook Windows — supported on <td>, not <div>.
    // Blocking here would reject every email ever written.
    const v = verdict(
      indexFeatures(matrix({ outlook: { windows: { '2019': 'a #1 #2' } } })),
      'css-x',
      floor,
    )
    expect(v.level).toBe('caveat')
    expect(v.findings[0]?.code).toBe('a')
  })

  it('reads the latest tested version, not the first', () => {
    const v = verdict(
      indexFeatures(matrix({ outlook: { windows: { '2007': 'n', '2019': 'y' } } })),
      'css-x',
      floor,
    )
    expect(v.level).toBe('ok')
  })

  it('reports an unknown slug as untested rather than unsupported', () => {
    // <td>, <a> and <h1> are absent from the matrix. Calling them unsupported would be false.
    const v = verdict(indexFeatures(matrix({})), 'html-td', floor)
    expect(v.level).toBe('untested')
  })

  it('ignores floor clients the feature was never tested on', () => {
    const v = verdict(
      indexFeatures(matrix({ gmail: { android: { '2024-01': 'y' } } })),
      'css-x',
      floor,
    )
    expect(v.level).toBe('untested')
  })

  it('lets one n outrank several partials', () => {
    const v = verdict(
      indexFeatures(
        matrix({
          outlook: { windows: { '2019': 'a #1' }, 'outlook-com': { '2024-01': 'n' } },
        }),
      ),
      'css-x',
      DEFAULT_FLOOR,
    )
    expect(v.level).toBe('blocked')
  })
})
